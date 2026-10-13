import { ChangeDetectionStrategy, Component, Injectable, OnDestroy, inject, input, signal } from '@angular/core';
import { cx, type Variant } from './utils';

export type ToastId = string | number;

export interface ToastItem {
  id: ToastId;
  title?: string;
  message: string;
  variant?: Variant;
}

export interface ToastOptions {
  message: string;
  title?: string;
  variant?: Variant;
  /** Auto-dismiss delay in ms. 0 keeps the toast until dismissed. Default 5000. */
  duration?: number;
  /** Reuse an id to replace an existing toast. */
  id?: ToastId;
}

interface Timer {
  remaining: number;
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | null;
}

/**
 * App-wide toast queue. Render `<pl-toaster />` once (e.g. in the root component), then:
 *
 * ```ts
 * inject(PlToastService).show({ title: 'Saved', message: 'Your changes are live.', variant: 'success' });
 * ```
 *
 * Auto-dismiss pauses while the pointer is over the toaster or focus is inside it (WCAG 2.2.1).
 */
@Injectable({ providedIn: 'root' })
export class PlToastService implements OnDestroy {
  /** Default auto-dismiss delay in ms. */
  defaultDuration = 5000;

  private readonly items = signal<ToastItem[]>([]);
  private readonly timers = new Map<ToastId, Timer>();
  private counter = 0;
  private paused = false;

  /** Toasts currently shown, oldest first. */
  readonly toasts = this.items.asReadonly();

  show(options: ToastOptions | string): ToastId {
    const opts: ToastOptions = typeof options === 'string' ? { message: options } : options;
    this.counter += 1;
    const id = opts.id ?? `pl-toast-${this.counter}`;
    const item: ToastItem = { id, message: opts.message, title: opts.title, variant: opts.variant };
    this.clearTimer(id);
    this.items.update((list) => {
      const index = list.findIndex((t) => t.id === id);
      if (index === -1) return [...list, item];
      const copy = [...list];
      copy[index] = item;
      return copy;
    });
    const duration = opts.duration ?? this.defaultDuration;
    if (duration > 0) {
      const timer: Timer = { remaining: duration, startedAt: 0, handle: null };
      this.timers.set(id, timer);
      if (!this.paused) this.start(id, timer);
    }
    return id;
  }

  dismiss(id: ToastId): void {
    this.clearTimer(id);
    this.items.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const id of [...this.timers.keys()]) this.clearTimer(id);
    this.items.set([]);
  }

  /** Stop auto-dismiss countdowns (keeps the remaining time). */
  pause(): void {
    if (this.paused) return;
    this.paused = true;
    const now = Date.now();
    for (const timer of this.timers.values()) {
      if (timer.handle !== null) {
        clearTimeout(timer.handle);
        timer.handle = null;
        timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
      }
    }
  }

  /** Resume auto-dismiss countdowns. */
  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    for (const [id, timer] of this.timers) this.start(id, timer);
  }

  get isPaused(): boolean {
    return this.paused;
  }

  ngOnDestroy(): void {
    this.clear();
  }

  private start(id: ToastId, timer: Timer): void {
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.dismiss(id), timer.remaining);
  }

  private clearTimer(id: ToastId): void {
    const timer = this.timers.get(id);
    if (timer?.handle != null) clearTimeout(timer.handle);
    this.timers.delete(id);
  }
}

/** Polite live region that renders the toasts from `PlToastService`. Place it once. */
@Component({
  selector: 'pl-toaster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    'aria-live': 'polite',
    class: 'pl-toast-stack',
    '(mouseenter)': 'onEnter()',
    '(mouseleave)': 'onLeave()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    @for (t of service.toasts(); track t.id) {
      <div [class]="toastClass(t)">
        <div class="pl-toast__body">
          @if (t.title) {
            <div class="pl-toast__title">{{ t.title }}</div>
          }
          <div class="pl-toast__message">{{ t.message }}</div>
        </div>
        <button type="button" class="pl-close" [attr.aria-label]="dismissLabel()" (click)="service.dismiss(t.id)">×</button>
      </div>
    }
  `,
})
export class PlToaster {
  protected readonly service = inject(PlToastService);
  readonly dismissLabel = input('Dismiss');
  private hovered = false;
  private focused = false;

  protected toastClass(t: ToastItem): string {
    return cx('pl-toast', t.variant && t.variant !== 'info' && `pl-toast--${t.variant}`);
  }

  protected onLeave(): void {
    this.hovered = false;
    if (!this.focused) this.service.resume();
  }
  protected onFocusIn(): void {
    this.focused = true;
    this.service.pause();
  }
  protected onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && host.contains(event.relatedTarget)) return;
    this.focused = false;
    if (!this.hovered) this.service.resume();
  }
  protected onEnter(): void {
    this.hovered = true;
    this.service.pause();
  }
}

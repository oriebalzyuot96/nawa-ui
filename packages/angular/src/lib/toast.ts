import { ChangeDetectionStrategy, Component, Injectable, OnDestroy, PLATFORM_ID, afterNextRender, booleanAttribute, effect, inject, input, numberAttribute, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  mountToaster,
  toast as coreToast,
  toastStore,
  type MountToasterOptions,
  type ToastActionDef,
  type ToastAvatar,
  type ToasterController,
  type ToasterHotkey,
  type ToasterPosition,
  type ToastLabels,
  type ToastPromiseMessages,
  type ToastRecord,
  type ToastType,
} from '@pelagic-ui/core/toast';
import type { Variant } from './utils';

export type { ToasterPosition, ToastType, ToastRecord, ToastAvatar } from '@pelagic-ui/core/toast';
export { TOAST_POSITIONS, TOAST_TYPES } from '@pelagic-ui/core/toast';

export type ToastId = string | number;

export interface ToastItem {
  id: ToastId;
  title?: string;
  message: string;
  variant?: Variant;
  type: ToastType;
}

export interface ToastOptions {
  message: string;
  /** Headline; `message` becomes the description under it. */
  title?: string;
  /** 'success' | 'warning' | 'danger' | 'info' (or use `type`). */
  variant?: Variant;
  type?: ToastType;
  /** Auto-dismiss delay in ms. 0 (or Infinity) keeps the toast until dismissed. Default 5000. */
  duration?: number;
  /** Reuse an id to replace an existing toast. */
  id?: ToastId;
  action?: ToastActionDef;
  cancel?: ToastActionDef;
  /** Shorthand for an "Undo" action. */
  undo?: () => void;
  avatar?: string | ToastAvatar;
  closeButton?: boolean;
  progress?: boolean;
  dismissible?: boolean;
  sound?: ToastRecord['sound'];
}

const typeOf = (o: ToastOptions): ToastType => o.type ?? (o.variant === 'danger' ? 'error' : o.variant === 'success' || o.variant === 'warning' || o.variant === 'info' ? o.variant : 'default');

/**
 * App-wide toast queue, shared with every Pelagic toaster on the page (@pelagic-ui/core/toast).
 * Render `<pl-toaster />` once (e.g. in the root component), then:
 *
 * ```ts
 * const toasts = inject(PlToastService);
 * toasts.show({ title: 'Saved', message: 'Your changes are live.', variant: 'success', undo: () => restore() });
 * toasts.promise(save(), { loading: 'Saving…', success: 'Saved', error: 'Could not save' });
 * ```
 *
 * Countdowns pause while the pointer is over the toaster, focus is inside it or the tab is hidden (WCAG 2.2.1).
 */
@Injectable({ providedIn: 'root' })
export class PlToastService implements OnDestroy {
  /** Default auto-dismiss delay in ms. */
  defaultDuration = 5000;

  private readonly items = signal<ToastItem[]>([]);
  private manualPause = false;
  private readonly unsubscribe = toastStore.subscribe(() => this.sync());

  /** Toasts currently shown, oldest first. */
  readonly toasts = this.items.asReadonly();

  constructor() {
    this.sync();
  }

  private sync(): void {
    this.items.set(
      toastStore
        .get()
        .filter((t) => !t.dismissed)
        .map((t) => ({
          id: t.id,
          type: t.type,
          title: t.description != null ? String(t.message) : undefined,
          message: String(t.description ?? t.message),
          variant: t.type === 'error' ? 'danger' : t.type === 'default' || t.type === 'loading' ? undefined : (t.type as Variant),
        })),
    );
  }

  show(options: ToastOptions | string): ToastId {
    const o: ToastOptions = typeof options === 'string' ? { message: options } : options;
    const duration = o.duration ?? this.defaultDuration;
    const { message, title, variant: _v, type: _t, duration: _d, ...rest } = o;
    return toastStore.upsert(title ?? message, {
      ...rest,
      type: typeOf(o),
      description: title ? message : undefined,
      duration: duration > 0 ? duration : Infinity,
    });
  }

  success(message: string, options: Omit<ToastOptions, 'message' | 'type' | 'variant'> = {}): ToastId {
    return this.show({ ...options, message, type: 'success' });
  }
  error(message: string, options: Omit<ToastOptions, 'message' | 'type' | 'variant'> = {}): ToastId {
    return this.show({ ...options, message, type: 'error' });
  }
  warning(message: string, options: Omit<ToastOptions, 'message' | 'type' | 'variant'> = {}): ToastId {
    return this.show({ ...options, message, type: 'warning' });
  }
  info(message: string, options: Omit<ToastOptions, 'message' | 'type' | 'variant'> = {}): ToastId {
    return this.show({ ...options, message, type: 'info' });
  }
  /** A loading toast whose spinner morphs into success or error when the promise settles. */
  promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T, string>): ToastId {
    return coreToast.promise(promise, messages);
  }

  dismiss(id: ToastId): void {
    toastStore.dismiss(id);
  }

  clear(): void {
    toastStore.remove();
  }

  /** Stop auto-dismiss countdowns (keeps the remaining time). */
  pause(): void {
    if (this.manualPause) return;
    this.manualPause = true;
    toastStore.pause();
  }

  /** Resume auto-dismiss countdowns. */
  resume(): void {
    if (!this.manualPause) return;
    this.manualPause = false;
    toastStore.resume();
  }

  get isPaused(): boolean {
    return toastStore.isPaused();
  }

  ngOnDestroy(): void {
    this.unsubscribe();
    this.resume();
  }
}

/**
 * The notification region (portalled to <body>): spring enter and exit from its corner, a deck that fans
 * out on hover or focus, swipe to dismiss, pausing countdowns, animated icons, actions and undo, a queue,
 * polite / assertive announcements and RTL. Place it once.
 */
@Component({
  selector: 'pl-toaster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: '',
})
export class PlToaster implements OnDestroy {
  readonly position = input<ToasterPosition>('bottom-end');
  readonly visibleToasts = input(3, { transform: numberAttribute });
  readonly duration = input(5000, { transform: numberAttribute });
  readonly expand = input(false, { transform: booleanAttribute });
  readonly richColors = input(false, { transform: booleanAttribute });
  readonly closeButton = input(true, { transform: booleanAttribute });
  readonly progress = input(false, { transform: booleanAttribute });
  readonly hotkey = input<ToasterHotkey | false | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);
  readonly labels = input<Partial<ToastLabels> | undefined>(undefined);
  /** Label of the close button. */
  readonly dismissLabel = input<string | undefined>(undefined);
  readonly dir = input<'ltr' | 'rtl' | 'auto' | undefined>(undefined);

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private ctl: ToasterController | null = null;

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      this.ctl = mountToaster(this.options());
    });
    effect(() => {
      const opts = this.options();
      untracked(() => this.ctl?.update(opts));
    });
  }

  private options(): MountToasterOptions {
    const labels = { ...(this.labels() ?? {}), ...(this.dismissLabel() ? { close: this.dismissLabel()! } : {}) };
    const o: MountToasterOptions = {
      position: this.position(),
      visibleToasts: this.visibleToasts(),
      duration: this.duration(),
      expand: this.expand(),
      richColors: this.richColors(),
      closeButton: this.closeButton(),
      progress: this.progress(),
      locale: this.locale(),
      labels,
      dir: this.dir(),
    };
    if (this.hotkey() !== undefined) o.hotkey = this.hotkey();
    return o;
  }

  ngOnDestroy(): void {
    this.ctl?.destroy();
    this.ctl = null;
  }
}

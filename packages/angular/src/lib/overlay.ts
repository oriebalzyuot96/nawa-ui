import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  Directive,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { lockScroll, trapFocus } from '@pelagic-ui/core/a11y';
import { cx, plId } from './utils';

/** Footer content for a dialog or drawer: `<div plDialogFooter>…</div>`. */
@Directive({ selector: '[plDialogFooter]' })
export class PlDialogFooter {}

/**
 * Shared modal behavior: Escape closes, focus moves into the panel and is trapped there,
 * the page behind does not scroll, and focus returns to the opener on close.
 * The overlay is moved to <body> while open (no CDK needed) unless `appendToBody` is false.
 */
@Directive()
export abstract class PlModalBase {
  /** Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  readonly title = input.required<string>();
  /** Close when the backdrop is clicked. Default true. */
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  /** Close on Escape. Default true. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  /** Show the × close button. Default true. */
  readonly closable = input(true, { transform: booleanAttribute });
  readonly closeLabel = input('Close');
  /** Move the overlay to <body> while open. Default true. */
  readonly appendToBody = input(true, { transform: booleanAttribute });
  /** Emitted whenever the modal requests to close (Escape, backdrop, × button). */
  readonly closed = output<void>();

  protected readonly titleId = plId('pl-dialog-title');
  protected readonly footer = contentChild(PlDialogFooter);
  protected readonly overlayRef = viewChild<ElementRef<HTMLElement>>('overlay');
  protected readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly document = inject(DOCUMENT);

  constructor() {
    afterRenderEffect((onCleanup) => {
      const overlay = this.overlayRef()?.nativeElement;
      const panel = this.panelRef()?.nativeElement;
      if (!overlay || !panel) return;
      untracked(() => {
        const doc = this.document;
        if (this.appendToBody()) doc.body.appendChild(overlay);
        const previous = doc.activeElement as HTMLElement | null;
        panel.focus();
        const releaseFocus = trapFocus(panel);
        const releaseScroll = lockScroll();
        const onKey = (event: KeyboardEvent) => {
          if (event.key === 'Escape' && this.closeOnEscape()) this.close();
        };
        doc.addEventListener('keydown', onKey);
        onCleanup(() => {
          doc.removeEventListener('keydown', onKey);
          releaseFocus();
          releaseScroll();
          // Closed: Angular already removed it. Destroyed while open: remove it from <body>.
          overlay.remove();
          previous?.focus?.();
        });
      });
    });
  }

  close(): void {
    this.open.set(false);
    this.closed.emit();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) this.close();
  }
}

const PANEL_CONTENT = `
  <div class="pl-dialog__header">
    <h2 class="pl-dialog__title" [id]="titleId">{{ title() }}</h2>
    @if (closable()) {
      <button type="button" class="pl-close" [attr.aria-label]="closeLabel()" (click)="close()">×</button>
    }
  </div>
  <div class="pl-dialog__body"><ng-content /></div>
  @if (footer()) {
    <div class="pl-dialog__footer"><ng-content select="[plDialogFooter]" /></div>
  }`;

/**
 * Modal dialog.
 *
 * ```html
 * <pl-dialog [(open)]="editing" title="Edit profile">
 *   …
 *   <div plDialogFooter><button plButton (click)="editing.set(false)">Done</button></div>
 * </pl-dialog>
 * ```
 */
@Component({
  selector: 'pl-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '[attr.title]': 'null' },
  template: `
    @if (open()) {
      <div #overlay class="pl-overlay" (mousedown)="onBackdrop($event)">
        <div
          #panel
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          [attr.aria-labelledby]="titleId"
          [class]="panelClass()"
        >
          ${PANEL_CONTENT}
        </div>
      </div>
    }
  `,
})
export class PlDialog extends PlModalBase {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly panelClass = computed(() => cx('pl-dialog', this.size() !== 'md' && `pl-dialog--${this.size()}`));
}

/** Side sheet with the same modal behavior as `pl-dialog`. */
@Component({
  selector: 'pl-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '[attr.title]': 'null' },
  template: `
    @if (open()) {
      <div #overlay [class]="overlayClass()" (mousedown)="onBackdrop($event)">
        <div
          #panel
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          [attr.aria-labelledby]="titleId"
          [class]="panelClass()"
        >
          ${PANEL_CONTENT}
        </div>
      </div>
    }
  `,
})
export class PlDrawer extends PlModalBase {
  readonly side = input<'left' | 'right'>('right');
  protected readonly overlayClass = computed(() =>
    cx('pl-overlay', 'pl-overlay--drawer', this.side() === 'right' && 'pl-overlay--right'),
  );
  protected readonly panelClass = computed(() => cx('pl-drawer', this.side() === 'right' && 'pl-drawer--right'));
}

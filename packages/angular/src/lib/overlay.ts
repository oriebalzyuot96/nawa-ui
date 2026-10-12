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
import { lockScroll, trapFocus } from '@nawa-ui/core/a11y';
import { cx, nwId } from './utils';

/** Footer content for a dialog or drawer: `<div nwDialogFooter>…</div>`. */
@Directive({ selector: '[nwDialogFooter]' })
export class NwDialogFooter {}

/**
 * Shared modal behavior: Escape closes, focus moves into the panel and is trapped there,
 * the page behind does not scroll, and focus returns to the opener on close.
 * The overlay is moved to <body> while open (no CDK needed) unless `appendToBody` is false.
 */
@Directive()
export abstract class NwModalBase {
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

  protected readonly titleId = nwId('nw-dialog-title');
  protected readonly footer = contentChild(NwDialogFooter);
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
  <header class="nw-dialog__header">
    <h2 class="nw-dialog__title" [id]="titleId">{{ title() }}</h2>
    @if (closable()) {
      <button type="button" class="nw-close" [attr.aria-label]="closeLabel()" (click)="close()">×</button>
    }
  </header>
  <div class="nw-dialog__body"><ng-content /></div>
  @if (footer()) {
    <footer class="nw-dialog__footer"><ng-content select="[nwDialogFooter]" /></footer>
  }`;

/**
 * Modal dialog.
 *
 * ```html
 * <nw-dialog [(open)]="editing" title="Edit profile">
 *   …
 *   <div nwDialogFooter><button nwButton (click)="editing.set(false)">Done</button></div>
 * </nw-dialog>
 * ```
 */
@Component({
  selector: 'nw-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '[attr.title]': 'null' },
  template: `
    @if (open()) {
      <div #overlay class="nw-overlay" (mousedown)="onBackdrop($event)">
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
export class NwDialog extends NwModalBase {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly panelClass = computed(() => cx('nw-dialog', this.size() !== 'md' && `nw-dialog--${this.size()}`));
}

/** Side sheet with the same modal behavior as `nw-dialog`. */
@Component({
  selector: 'nw-drawer',
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
export class NwDrawer extends NwModalBase {
  readonly side = input<'left' | 'right'>('right');
  protected readonly overlayClass = computed(() =>
    cx('nw-overlay', 'nw-overlay--drawer', this.side() === 'right' && 'nw-overlay--right'),
  );
  protected readonly panelClass = computed(() => cx('nw-drawer', this.side() === 'right' && 'nw-drawer--right'));
}

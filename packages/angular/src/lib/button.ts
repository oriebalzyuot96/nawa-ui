import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, computed, inject, input } from '@angular/core';
import { cx } from './utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Native button (or link) styled as an Orca UI button.
 *
 * ```html
 * <button ocButton variant="outline" [loading]="saving()">Save</button>
 * ```
 */
@Component({
  selector: 'button[ocButton], a[ocButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.type]': 'isAnchor ? null : type()',
    '[attr.disabled]': 'isDisabled() && !isAnchor ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() && isAnchor ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
  template: `@if (loading()) {<span class="oc-spinner" aria-hidden="true"></span>}<ng-content />`,
})
export class OcButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  /** Shows a spinner and disables the button. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });
  /** Square button for a single icon. Pass aria-label. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  protected readonly isAnchor = (inject(ElementRef).nativeElement as HTMLElement).tagName === 'A';
  protected readonly isDisabled = computed(() => this.disabled() || this.loading());
  protected readonly classes = computed(() =>
    cx(
      'oc-btn',
      `oc-btn--${this.variant()}`,
      this.size() !== 'md' && `oc-btn--${this.size()}`,
      this.block() && 'oc-btn--block',
      this.iconOnly() && 'oc-btn--icon',
    ),
  );
}

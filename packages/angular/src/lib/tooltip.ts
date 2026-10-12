import { DOCUMENT, Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';
import { ocId } from './utils';

/**
 * Hover/focus tooltip for any element.
 *
 * ```html
 * <button ocButton ocTooltip="Copy link" aria-label="Copy">⧉</button>
 * ```
 *
 * The bubble (role="tooltip") is rendered in <body> with fixed positioning so it is never
 * clipped and never becomes part of the host's accessible name. The host gets
 * aria-describedby pointing at it. Escape hides the bubble until the pointer leaves or focus
 * moves (WCAG 1.4.13).
 */
@Directive({
  selector: '[ocTooltip]',
  host: {
    '[attr.aria-describedby]': 'describedBy()',
    '(mouseenter)': 'show()',
    '(focusin)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'dismiss()',
  },
})
export class OcTooltip implements OnDestroy {
  readonly text = input.required<string>({ alias: 'ocTooltip' });
  readonly placement = input<'top' | 'bottom'>('top', { alias: 'ocTooltipPlacement' });
  /** Existing aria-describedby ids on the host, kept alongside the tooltip id. */
  readonly ariaDescribedBy = input<string | null>(null, { alias: 'aria-describedby' });

  readonly tooltipId = ocId('oc-tooltip');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private bubble: HTMLElement | null = null;
  private visible = false;

  constructor() {
    effect(() => {
      const text = this.text();
      this.ensureBubble().textContent = text;
    });
  }

  protected describedBy(): string {
    const extra = this.ariaDescribedBy();
    return extra ? `${extra} ${this.tooltipId}` : this.tooltipId;
  }

  /** The bubble element (created lazily in <body>). */
  get element(): HTMLElement | null {
    return this.bubble;
  }

  /** Whether the bubble is currently shown. */
  get isVisible(): boolean {
    return this.visible;
  }

  show(): void {
    const bubble = this.ensureBubble();
    this.visible = true;
    this.position(bubble);
    bubble.style.opacity = '1';
    bubble.removeAttribute('data-hidden');
  }

  hide(): void {
    this.visible = false;
    if (!this.bubble) return;
    this.bubble.style.opacity = '0';
    this.bubble.setAttribute('data-hidden', '');
  }

  /** Escape: hide until the next pointer enter / focus. */
  dismiss(): void {
    this.hide();
  }

  ngOnDestroy(): void {
    this.bubble?.remove();
    this.bubble = null;
  }

  private ensureBubble(): HTMLElement {
    if (this.bubble) return this.bubble;
    const bubble = this.document.createElement('span');
    bubble.id = this.tooltipId;
    bubble.setAttribute('role', 'tooltip');
    bubble.className = 'oc-tooltip__bubble';
    bubble.setAttribute('data-hidden', '');
    Object.assign(bubble.style, { position: 'fixed', opacity: '0', insetInlineStart: 'auto', bottom: 'auto', fontFamily: 'var(--oc-font)' });
    this.document.body.appendChild(bubble);
    this.bubble = bubble;
    return bubble;
  }

  private position(bubble: HTMLElement): void {
    const rect = this.host.getBoundingClientRect();
    const gap = 6;
    const bottom = this.placement() === 'bottom';
    bubble.style.left = `${rect.left + rect.width / 2}px`;
    bubble.style.top = bottom ? `${rect.bottom + gap}px` : `${rect.top - gap}px`;
    bubble.style.transform = bottom ? 'translateX(-50%)' : 'translate(-50%, -100%)';
  }
}

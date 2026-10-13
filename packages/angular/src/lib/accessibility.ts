import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
  type OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  mountA11yPanel,
  normalizeA11yPrefs,
  renderA11yPanelHTML,
  type A11yPanelChange,
  type A11yPanelController,
  type A11yPanelLabelOverrides,
  type A11yPrefs,
} from '@orca-ui/core/a11y-prefs';
import { ocId } from './utils';

export type { A11yPrefs, A11yPanelChange, A11yPanelLabelOverrides } from '@orca-ui/core/a11y-prefs';
export {
  applyA11yPrefs,
  loadA11yPrefs,
  saveA11yPrefs,
  resetA11yPrefs,
  watchSystemPrefs,
  getSystemPrefs,
  defaultA11yPrefs,
  normalizeA11yPrefs,
} from '@orca-ui/core/a11y-prefs';
export { createTheme, applyCustomTheme, removeCustomTheme, themeToCode } from '@orca-ui/core/theme';
export type { CustomTheme, CreateThemeOptions } from '@orca-ui/core/theme';

export type OcA11yGroup = 'color' | 'text' | 'reading' | 'motion' | 'interaction';

/**
 * Accessibility settings drawer: color schemes, color-vision filters, text size and spacing, reading
 * aids, motion and interaction aids. Changes apply live to <html> (or `target`), persist in localStorage
 * and are announced politely. Markup and behavior are shared with every Orca package.
 *
 *   <oc-accessibility-panel [(prefs)]="prefs" [(open)]="open" locale="ar" trigger="inline"
 *                           (changed)="onChange($event)" />
 */
@Component({
  selector: 'oc-accessibility-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: '',
})
export class OcAccessibilityPanel implements OnDestroy {
  /** Two-way bindable preferences: `[(prefs)]`. Optional; the panel keeps its own state when unbound. */
  readonly prefs = model<Partial<A11yPrefs> | undefined>(undefined);
  /** Two-way bindable open state: `[(open)]`. */
  readonly open = model(false);
  readonly trigger = input<'floating' | 'inline' | 'none'>('floating');
  readonly triggerLabel = input<string | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);
  readonly labels = input<A11yPanelLabelOverrides | undefined>(undefined);
  readonly preview = input(true, { transform: booleanAttribute });
  readonly groups = input<OcA11yGroup[] | undefined>(undefined);
  /** localStorage key, true (default key) or false. */
  readonly persist = input<boolean | string>(true);
  /** Element that receives the data-a11y-* attributes. Default <html>. */
  readonly target = input<HTMLElement | null | undefined>(undefined);
  /** Every change, with the key that changed ('reset' for Reset all). */
  readonly changed = output<{ prefs: A11yPrefs; change: A11yPanelChange }>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly id = ocId('oc-a11y');
  private ctl: A11yPanelController | null = null;
  private rendered = false;

  constructor() {
    afterNextRender(() => {
      this.rendered = true;
      this.mount();
    });
    // Markup-defining inputs: render again.
    effect(() => {
      this.locale();
      this.labels();
      this.trigger();
      this.triggerLabel();
      this.preview();
      this.groups();
      this.persist();
      if (this.rendered) untracked(() => this.mount());
    });
    effect(() => {
      const open = this.open();
      const ctl = this.ctl;
      if (!ctl) return;
      if (open && !ctl.isOpen()) ctl.open();
      else if (!open && ctl.isOpen()) ctl.close();
    });
    effect(() => {
      const value = this.prefs();
      this.target();
      const ctl = this.ctl;
      if (!ctl || !value) return;
      const next = normalizeA11yPrefs(value);
      if (JSON.stringify(next) !== JSON.stringify(ctl.get())) ctl.setAll(next);
    });
  }

  private mount(): void {
    if (!this.isBrowser) return;
    this.ctl?.destroy();
    const el = this.host.nativeElement as HTMLElement;
    const initial = this.prefs();
    el.innerHTML = renderA11yPanelHTML({
      id: this.id,
      locale: this.locale(),
      labels: this.labels(),
      trigger: this.trigger(),
      triggerLabel: this.triggerLabel(),
      preview: this.preview(),
      groups: this.groups(),
      prefs: initial,
    });
    this.ctl = mountA11yPanel(el.firstElementChild as HTMLElement, {
      target: () => this.target() ?? this.document.documentElement,
      persist: this.persist(),
      value: initial,
      onChange: (prefs, change) => {
        this.prefs.set(prefs);
        this.changed.emit({ prefs, change });
      },
      onOpenChange: (open) => this.open.set(open),
    });
    this.prefs.set(this.ctl.get());
    if (this.open()) this.ctl.open();
  }

  /** Open the panel. */
  show(): void {
    this.ctl?.open();
  }

  /** Close the panel. */
  hide(): void {
    this.ctl?.close();
  }

  /** Reset every preference. */
  reset(): void {
    this.ctl?.reset();
  }

  ngOnDestroy(): void {
    this.ctl?.destroy();
    this.ctl = null;
  }
}

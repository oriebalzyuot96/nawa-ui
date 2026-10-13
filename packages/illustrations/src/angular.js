// Angular directive shipped in Angular's partial-compilation (linker) format, so it works
// with AOT builds without this package needing its own Angular compiler step.
import * as i0 from '@angular/core';
import { illustrationToSvg, isIllustrationName } from './illustrations.js';

export * from './illustrations.js';

const flag = (v, fallback) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');

/**
 * `<span plIllustration="no-results" [label]="…" compact></span>`
 * Writes the scene into its host element (decorative unless `label` is set).
 */
export class PlIllustration {
  constructor() {
    this.host = i0.inject(i0.ElementRef).nativeElement;
    this.plIllustration = undefined;
    this.label = '';
    this.compact = undefined;
    this.animated = undefined;
  }

  ngOnChanges() {
    const name = this.plIllustration;
    this.host.innerHTML = isIllustrationName(name)
      ? illustrationToSvg(name, { label: this.label || '', compact: flag(this.compact, false), animated: flag(this.animated, true) })
      : '';
  }

  static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: '12.0.0', version: '20.0.0', ngImport: i0, type: PlIllustration, deps: [], target: i0.ɵɵFactoryTarget.Directive });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: '14.0.0',
    version: '20.0.0',
    type: PlIllustration,
    isStandalone: true,
    selector: '[plIllustration]',
    inputs: { plIllustration: 'plIllustration', label: 'label', compact: 'compact', animated: 'animated' },
    host: { styleAttribute: 'display: block' },
    usesOnChanges: true,
    ngImport: i0,
  });
}

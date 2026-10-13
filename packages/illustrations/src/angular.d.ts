import * as i0 from '@angular/core';
import type { IllustrationName } from './illustrations.js';

export * from './illustrations.js';

/** `<span plIllustration="no-results" [label]="…" compact></span>` — decorative unless `label` is set. */
export declare class PlIllustration implements i0.OnChanges {
  plIllustration: IllustrationName | undefined;
  label: string;
  compact: boolean | '' | undefined;
  animated: boolean | '' | undefined;
  ngOnChanges(): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<PlIllustration, never>;
  static ɵdir: i0.ɵɵDirectiveDeclaration<PlIllustration, '[plIllustration]', never, { plIllustration: { alias: 'plIllustration'; required: false }; label: { alias: 'label'; required: false }; compact: { alias: 'compact'; required: false }; animated: { alias: 'animated'; required: false } }, {}, never, never, true, never>;
}

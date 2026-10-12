import * as i0 from '@angular/core';
import type { IllustrationName } from './illustrations.js';

export * from './illustrations.js';

/** `<span ocIllustration="no-results" [label]="…" compact></span>` — decorative unless `label` is set. */
export declare class OcIllustration implements i0.OnChanges {
  ocIllustration: IllustrationName | undefined;
  label: string;
  compact: boolean | '' | undefined;
  animated: boolean | '' | undefined;
  ngOnChanges(): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<OcIllustration, never>;
  static ɵdir: i0.ɵɵDirectiveDeclaration<OcIllustration, '[ocIllustration]', never, { ocIllustration: { alias: 'ocIllustration'; required: false }; label: { alias: 'label'; required: false }; compact: { alias: 'compact'; required: false }; animated: { alias: 'animated'; required: false } }, {}, never, never, true, never>;
}

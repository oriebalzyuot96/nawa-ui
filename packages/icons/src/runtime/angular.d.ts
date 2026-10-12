import * as i0 from '@angular/core';
import type { IconName, IconVariant } from '../icons.js';

/** Standalone `<oc-icon name="search" variant="duotone" size="20" label="Search">` */
export declare class OcIconComponent implements i0.OnChanges {
  name: IconName | undefined;
  variant: IconVariant;
  size: number | string;
  /** Accessible name; without it the icon is decorative (aria-hidden). */
  label: string | undefined;
  strokeWidth: number | string | undefined;
  flipRtl: boolean | '' | 'true' | 'false' | undefined;
  spin: boolean | '' | 'true' | 'false';
  constructor(el: i0.ElementRef<HTMLElement>, renderer: i0.Renderer2);
  ngOnChanges(): void;
  render(): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<OcIconComponent, never>;
  static ɵcmp: i0.ɵɵComponentDeclaration<
    OcIconComponent,
    'oc-icon',
    never,
    {
      name: { alias: 'name'; required: false };
      variant: { alias: 'variant'; required: false };
      size: { alias: 'size'; required: false };
      label: { alias: 'label'; required: false };
      strokeWidth: { alias: 'strokeWidth'; required: false };
      flipRtl: { alias: 'flipRtl'; required: false };
      spin: { alias: 'spin'; required: false };
    },
    {},
    never,
    never,
    true,
    never
  >;
}
export { icons, iconNames } from '../icons.js';
export type { IconName, IconVariant } from '../icons.js';

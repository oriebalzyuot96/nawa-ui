import * as React from 'react';
import type { IconData, IconName, IconVariant } from '../icons.js';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref' | 'name' | 'title'> {
  /** Width and height (number = px). Default 24. */
  size?: number | string;
  /** Default 'outline'. 'solid' falls back to 'duotone' for icons without solid art. */
  variant?: IconVariant;
  /** Accessible name; without it the icon is decorative (aria-hidden). */
  title?: string;
  /** Alias of title. */
  label?: string;
  /** Default 1.75. */
  strokeWidth?: number | string;
  /** Override the icon's RTL mirroring flag. */
  flipRtl?: boolean;
  spin?: boolean;
}

export type IconComponent = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

export declare const Icon: React.ForwardRefExoticComponent<IconProps & { name: IconName } & React.RefAttributes<SVGSVGElement>>;
export declare function createIcon(data: IconData, displayName?: string): IconComponent;
export { icons, iconNames } from '../icons.js';
export type { IconName, IconVariant } from '../icons.js';

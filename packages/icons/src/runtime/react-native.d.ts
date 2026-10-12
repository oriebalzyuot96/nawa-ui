import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import type { IconData, IconName, IconVariant } from '../icons.js';

export interface IconProps extends Omit<SvgProps, 'width' | 'height' | 'color'> {
  size?: number | string;
  variant?: IconVariant;
  /** Stroke/fill colour (react-native-svg resolves currentColor from it; default black). */
  color?: string;
  /** Accessible name; without it the icon is hidden from assistive tech. */
  title?: string;
  label?: string;
  strokeWidth?: number | string;
  /** Colour of the duotone layer (default: same as color). */
  duotoneColor?: string;
  /** Opacity of the duotone layer (default 0.22). */
  duotoneOpacity?: number;
}

export type IconComponent = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<unknown>>;
export declare const Icon: React.ForwardRefExoticComponent<IconProps & { name: IconName } & React.RefAttributes<unknown>>;
export declare function createIcon(data: IconData, displayName?: string): IconComponent;
export { icons, iconNames } from '../icons.js';
export type { IconName, IconVariant } from '../icons.js';

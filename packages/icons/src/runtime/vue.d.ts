import type { DefineComponent } from 'vue';
import type { IconData, IconName, IconVariant } from '../icons.js';

export interface IconProps {
  size?: number | string;
  variant?: IconVariant;
  /** Accessible name; without it the icon is decorative (aria-hidden). */
  title?: string;
  label?: string;
  strokeWidth?: number | string;
  flipRtl?: boolean;
  spin?: boolean;
}

export type IconComponent = DefineComponent<IconProps>;
export declare const Icon: DefineComponent<IconProps & { name: IconName }>;
export declare function createIcon(data: IconData, name?: string): IconComponent;
export { icons, iconNames } from '../icons.js';
export type { IconName, IconVariant } from '../icons.js';

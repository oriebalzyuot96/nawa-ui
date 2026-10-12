import type { Component } from 'svelte';
import type { IconName, IconVariant } from '../icons.js';

export interface IconProps {
  name: IconName;
  variant?: IconVariant;
  size?: number | string;
  /** Accessible name; without it the icon is decorative (aria-hidden). */
  title?: string;
  label?: string;
  strokeWidth?: number | string;
  flipRtl?: boolean;
  spin?: boolean;
  class?: string;
  [attr: string]: unknown;
}

export declare const Icon: Component<IconProps>;
export { icons, iconNames, iconToSvg } from '../icons.js';
export type { IconName, IconVariant } from '../icons.js';

import type { Component } from 'svelte';
import type { IllustrationName, IllustrationOptions } from '../illustrations.js';

export * from '../illustrations.js';

export interface IllustrationProps extends Omit<IllustrationOptions, 'className'> {
  name: IllustrationName;
  class?: string;
}
/** Themeable scene as inline SVG. Decorative unless `label` is set. */
export declare const Illustration: Component<IllustrationProps>;

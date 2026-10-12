import type { DefineComponent } from 'vue';
import type { IllustrationName } from './illustrations.js';

export * from './illustrations.js';

export interface NamedIllustrationProps {
  /** Accessible name; omit for a decorative (aria-hidden) scene. */
  label?: string;
  compact?: boolean;
  animated?: boolean;
  styles?: boolean;
}
export interface IllustrationProps extends NamedIllustrationProps {
  name: IllustrationName;
}
export type NamedIllustrationComponent = DefineComponent<NamedIllustrationProps>;

/** Themeable scene as inline SVG. Decorative unless `label` is set. */
export declare const Illustration: DefineComponent<IllustrationProps>;

/*@VUE_NAMED_DTS*/

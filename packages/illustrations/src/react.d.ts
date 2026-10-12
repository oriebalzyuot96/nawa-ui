import type { ReactElement, SVGProps } from 'react';
import type { IllustrationName, IllustrationOptions } from './illustrations.js';

export * from './illustrations.js';

export interface IllustrationProps extends IllustrationOptions, Omit<SVGProps<SVGSVGElement>, 'name' | 'children'> {
  name: IllustrationName;
}
export type NamedIllustration = ((props: Omit<IllustrationProps, 'name'>) => ReactElement) & { displayName: string };

/** Themeable scene as inline SVG. Decorative unless `label` is set. */
export declare function Illustration(props: IllustrationProps): ReactElement;

/*@REACT_NAMED_DTS*/

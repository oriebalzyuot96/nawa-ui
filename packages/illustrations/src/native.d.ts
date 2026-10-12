import type { ReactElement } from 'react';
import type { IllustrationName, IllustrationPalette } from './illustrations.js';

export * from './illustrations.js';

export interface NativeIllustrationProps {
  name: IllustrationName;
  /** Accessible name; omit for a decorative scene hidden from screen readers. */
  label?: string;
  /** Simplified 96px scene for inline empty states. */
  compact?: boolean;
  /** An Orca theme object, e.g. `useOrcaTheme()` from @orca-ui/react-native. */
  theme?: Partial<Record<string, string>>;
  /** Explicit role colors (override the theme). */
  colors?: Partial<IllustrationPalette>;
  width?: number | string;
  height?: number | string;
  style?: unknown;
  testID?: string;
}

export declare function Illustration(props: NativeIllustrationProps): ReactElement | null;
export declare function createNativeIllustration(svgModule: Record<string, unknown>, h?: (...args: unknown[]) => unknown): (props: NativeIllustrationProps) => ReactElement | null;

/*@NATIVE_NAMED_DTS*/

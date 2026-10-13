/** Every scene shipped by @pelagic-ui/illustrations. */
export type IllustrationName = /*@NAMES_UNION*/;

/** Color roles a scene is drawn with. Each maps to a Pelagic theme token. */
export type IllustrationRole = 'accent' | 'soft' | 'paper' | 'alt' | 'muted' | 'line' | 'ink';

export interface IllustrationOptions {
  /**
   * Accessible name. When set the SVG gets `role="img"` + `aria-label`; when omitted
   * (the default) it is decorative: `aria-hidden="true"` — use this inside EmptyState,
   * whose title and description already carry the meaning.
   */
  label?: string;
  /** Simplified scene (no orbit / sparkle details) sized for inline and table empty states (96px). */
  compact?: boolean;
  /** Gentle floating motion (always disabled under prefers-reduced-motion). Default true. */
  animated?: boolean;
  /** Embed the small <style> block (sizing, motion, forced-colors). Default true. */
  styles?: boolean;
  /** Extra class names on the <svg>. */
  className?: string;
}

export interface IllustrationNode {
  tag: string;
  attrs: Record<string, string>;
  children: IllustrationNode[];
  text?: string;
}

export interface IllustrationMeta {
  name: IllustrationName;
  title: string;
  keywords: string[];
  /** Named component exported by the React / Vue / React Native entry points. */
  component: string;
}

export declare const VIEWBOX: '0 0 240 180';
export declare const ILLUSTRATION_NAMES: readonly IllustrationName[];
export declare const ILLUSTRATIONS: readonly IllustrationMeta[];
export declare const ROLES: Readonly<Record<IllustrationRole, { token: string; fallback: string; native: string }>>;
/** CSS shared by every scene (also shipped in @pelagic-ui/core's pelagic.css). */
export declare const ILLUSTRATION_CSS: string;

export declare function isIllustrationName(value: unknown): value is IllustrationName;
/** CSS color for a role: `var(--pl-illus-<role>, var(--pl-<token>, <fallback>))`. */
export declare function roleColor(role: IllustrationRole | 'edge' | 'none'): string;
/** Render a scene to an SVG string. */
export declare function illustrationToSvg(name: IllustrationName, options?: IllustrationOptions): string;
/** Element tree with resolved colors and ARIA, for custom renderers. */
export declare function illustrationTree(name: IllustrationName, options?: IllustrationOptions): IllustrationNode;
/** Raw scene tree with unresolved color roles. */
export declare function getScene(name: IllustrationName): unknown[];

export type IllustrationPalette = Record<IllustrationRole | 'edge', string>;
/** Concrete colors for non-CSS renderers (React Native) from a Pelagic theme object. */
export declare function resolvePalette(theme?: Partial<Record<string, string>>, overrides?: Partial<IllustrationPalette>): IllustrationPalette;

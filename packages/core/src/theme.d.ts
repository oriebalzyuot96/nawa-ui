import type { ThemeAccent, ThemeMode, ThemeShape } from '../tokens';

export interface ThemeChoice {
  /** 'system' follows prefers-color-scheme and prefers-contrast. */
  mode?: ThemeMode | 'system';
  /** A built-in accent, or the name of a custom theme already injected with applyCustomTheme(). */
  accent?: ThemeAccent | (string & {});
  shape?: ThemeShape;
  /** A createTheme() result: its CSS is injected and it becomes the accent of `target`. */
  custom?: CustomTheme;
}

export declare const THEME_STORAGE_KEY: string;
/** Set data-theme / data-accent / data-shape on `target` (default: <html>). */
export declare function applyTheme(theme?: ThemeChoice, target?: HTMLElement): void;
/** Save a theme choice to localStorage. Failures are ignored. */
export declare function saveTheme(theme: ThemeChoice): void;
/** Read a saved theme choice, or null. */
export declare function loadTheme(): ThemeChoice | null;

/* ---------- Custom brand themes ---------- */

export type CustomThemeMode = 'light' | 'dark' | 'hc';

export interface CreateThemeOptions {
  /** Brand color: hex, rgb(), hsl(), oklch(), oklab() or a common color name. */
  primary: string;
  /** Optional second brand color, exposed as --oc-secondary, --oc-secondary-hover, --oc-secondary-ink, --oc-on-secondary. */
  secondary?: string;
  /** Tint the neutrals (surfaces, text, borders) with this color's hue. */
  neutral?: string;
  /** Corner radius in px (controls), or a built-in shape. */
  radius?: number | ThemeShape;
  /** CSS font-family for --oc-font. */
  font?: string;
  /** Theme name, used as the data-accent value. Default 'custom'. */
  name?: string;
}

/** Accent values of one mode (same shape as an accent in themes.mjs). */
export interface CustomAccentPalette {
  primary: string;
  primaryHover: string;
  primaryInk: string;
  onPrimary: string;
  secondary?: string;
  secondaryHover?: string;
  secondaryInk?: string;
  onSecondary?: string;
}

/** Fully resolved hex tokens of one mode. */
export interface ResolvedTokens {
  primary: string;
  primaryHover: string;
  primaryInk: string;
  onPrimary: string;
  primarySoft: string;
  focus: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  controlBorder: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  onDanger: string;
  successSoft: string;
  warningSoft: string;
  dangerSoft: string;
  infoSoft: string;
  overlay: string;
  tintHover: string;
  tintPress: string;
  canvas: string;
  surfaceRaised: string;
  borderSubtle: string;
  secondary?: string;
  secondaryHover?: string;
  secondaryInk?: string;
  onSecondary?: string;
  secondarySoft?: string;
}

export interface ContrastFailure {
  label: string;
  fg: string;
  bg: string;
  foreground: string;
  background: string;
  ratio: number;
  min: number;
}

export interface CustomTheme {
  name: string;
  input: Omit<CreateThemeOptions, 'name'>;
  palette: Record<CustomThemeMode, CustomAccentPalette>;
  tokens: Record<CustomThemeMode, ResolvedTokens>;
  /** CSS scoped to [data-accent="<name>"], covering light, dark, hc and the OS preferences. */
  css: string;
  /** WCAG pairs below AA per mode (empty for every valid input). */
  failures: Record<CustomThemeMode, ContrastFailure[]>;
}

/** Build a WCAG 2.2 AA theme (light, dark, high contrast) from brand colors. Works in the browser and Node. */
export declare function createTheme(options: CreateThemeOptions | string): CustomTheme;
/** Inject a theme's CSS (<style data-theme-custom>) and select it on `target` (default <html>). Returns a cleanup. */
export declare function applyCustomTheme(theme: CustomTheme, target?: HTMLElement): () => void;
/** Remove the injected CSS of a custom theme. */
export declare function removeCustomTheme(name: string, doc?: Document): void;
/** The createTheme() call that recreates `theme`, for "copy code" buttons. */
export declare function themeToCode(theme: CustomTheme): string;

/* ---------- Color utilities ---------- */
export interface Rgb {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}
export interface Oklch {
  L: number;
  C: number;
  H: number;
}
export declare function parseColor(input: string | Rgb): Required<Rgb>;
export declare function toHex(color: string): string;
export declare function toOklch(color: string): Oklch;
export declare function oklchToHex(lch: Oklch): string;
export declare function rgbToOklch(rgb: Rgb): Oklch;
export declare function oklchToRgb(lch: Oklch): Rgb;
export declare function oklchToGamutRgb(lch: Oklch): Rgb;
export declare function rgbToHex(rgb: Rgb): string;
export declare function mixHex(a: string, b: string, amount: number): string;
export declare function luminance(color: string): number;
export declare function contrastRatio(a: string, b: string): number;
export declare function resolveTokens(mode: CustomThemeMode, neutrals: Record<string, string>, accent: CustomAccentPalette): ResolvedTokens;
export declare function auditTheme(tokens: Partial<ResolvedTokens> & Record<string, string | undefined>, pairs?: Array<[string, string, string, number]>): ContrastFailure[];

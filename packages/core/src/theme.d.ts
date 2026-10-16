import type { ThemeAccent, ThemeMode, ThemePreset, ThemeShape } from '../tokens';

export type { ThemePreset } from '../tokens';

export interface ThemeChoice {
  /** 'system' follows prefers-color-scheme and prefers-contrast. */
  mode?: ThemeMode | 'system';
  /** A built-in accent, or the name of a custom theme already injected with applyCustomTheme(). null or 'default' removes data-accent. */
  accent?: ThemeAccent | 'default' | (string & {}) | null;
  shape?: ThemeShape;
  /** A named theme preset (data-theme-preset): surfaces, text, borders and accent. null or 'default' removes it. */
  preset?: ThemePreset | 'default' | null;
  /** Any CSS color: builds a WCAG AA theme fitted to the active preset and selects it (null removes it). */
  brand?: string | null;
  /** A createTheme() result: its CSS is injected and it becomes the accent of `target`. */
  custom?: CustomTheme;
}

export declare const THEME_STORAGE_KEY: string;
/** data-accent value of the live brand theme built by switchTheme({ brand }) and the panels. */
export declare const BRAND_THEME_NAME: 'brand';
/** Bubbling event dispatched on the target after switchTheme(); detail is { state, previous }. */
export declare const THEME_CHANGE_EVENT: 'pl-theme-change';
/** Set data-theme / data-accent / data-shape on `target` (default: <html>). */
export declare function applyTheme(theme?: ThemeChoice, target?: HTMLElement): void;
/** Save a theme choice to localStorage. Failures are ignored. */
export declare function saveTheme(theme: ThemeChoice): void;
/** Read a saved theme choice, or null. */
export declare function loadTheme(): (ThemeChoice & { brandCss?: string; customCss?: string }) | null;

/** The theme applied to an element, read from its attributes. */
export interface ThemeState {
  mode: ThemeMode | 'system';
  /** Explicit data-accent (null: the preset's or the default accent). */
  accent: ThemeAccent | (string & {}) | null;
  preset: ThemePreset | 'default';
  shape: ThemeShape | (string & {});
  /** The live brand color (hex), when one is applied. */
  brand: string | null;
}

/** Where the reveal starts: a control, a pointer / mouse event or a viewport point. */
export type ThemeSwitchOrigin = Element | { clientX: number; clientY: number } | { currentTarget?: EventTarget | null; target?: EventTarget | null } | { x: number; y: number } | null;

export interface SwitchThemeOptions {
  /** Start of the circular reveal. Default: the center of the viewport. */
  origin?: ThemeSwitchOrigin;
  /** Element to theme. Default <html>; other targets switch without animation. */
  target?: HTMLElement;
  /** Save the choice (loadTheme / the no-flash script restore it). Default true. */
  persist?: boolean;
  /** false: switch instantly. Reduced motion always switches instantly. */
  animate?: boolean;
  /** Reveal duration in ms. Default: 460–760 depending on the distance to cover. */
  duration?: number;
}

/** Read the theme currently applied to `target` (default <html>). */
export declare function getThemeState(target?: HTMLElement | null): ThemeState;
/**
 * Change mode, accent, preset, shape or brand with a circular reveal from `origin` (View Transitions API),
 * a short crossfade where that API is missing, and no animation under reduced motion. Saves the choice and
 * dispatches `pl-theme-change`. Resolves with the new state when the animation has finished.
 */
export declare function switchTheme(next: ThemeChoice, options?: SwitchThemeOptions): Promise<ThemeState>;
/** Listen for switchTheme() changes on `target` (default <html>). Returns an unsubscribe. */
export declare function onThemeChange(listener: (state: ThemeState, previous: ThemeState) => void, target?: HTMLElement): () => void;
/** Apply a saved choice without animation (default: loadTheme()). Returns the applied state, or null. */
export declare function restoreTheme(target?: HTMLElement, saved?: ReturnType<typeof loadTheme>): ThemeState | null;
/** True when theme changes should not animate (OS reduced motion, or data-a11y-motion reduce / off; "full" forces motion). */
export declare function themeMotionReduced(target?: HTMLElement): boolean;
/** Build (cached) and apply a WCAG AA theme for a brand color, fitted to the preset active on `target`. */
export declare function applyBrandColor(color: string, target?: HTMLElement): CustomTheme;
/** Neutral and status tokens of a preset in one mode. */
export declare function presetNeutrals(preset: ThemePreset | (string & {}), mode: CustomThemeMode): Record<string, string>;

/* ---------- Custom brand themes ---------- */

export type CustomThemeMode = 'light' | 'dark' | 'hc';

export interface CreateThemeOptions {
  /** Brand color: hex, rgb(), hsl(), oklch(), oklab() or a common color name. */
  primary: string;
  /** Optional second brand color, exposed as --pl-secondary, --pl-secondary-hover, --pl-secondary-ink, --pl-on-secondary. */
  secondary?: string;
  /** Tint the neutrals (surfaces, text, borders) with this color's hue. */
  neutral?: string;
  /** Corner radius in px (controls), or a built-in shape. */
  radius?: number | ThemeShape;
  /** CSS font-family for --pl-font. */
  font?: string;
  /** Fit the brand to the surfaces of a named preset (data-theme-preset). */
  preset?: ThemePreset | 'default';
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

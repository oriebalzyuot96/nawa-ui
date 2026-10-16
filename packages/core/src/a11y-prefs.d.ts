import type { ThemeState } from './theme';
import type { SoundPrefs, SoundTheme } from './sound';

export type A11yContrast = 'default' | 'hc' | 'yellow-black' | 'black-yellow' | 'white-black' | 'black-white' | 'gray' | 'invert';
export type A11yColorFilter = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export type A11ySpacing = 'normal' | 'wide' | 'wider';

export interface A11yPrefs {
  contrast: A11yContrast;
  colorFilter: A11yColorFilter;
  patterns: boolean;
  saturation: 'low' | 'normal' | 'high';
  /** 0.9 – 2 */
  fontScale: number;
  lineHeight: A11ySpacing;
  letterSpacing: A11ySpacing;
  wordSpacing: A11ySpacing;
  paragraphSpacing: A11ySpacing;
  readableFont: boolean;
  alignStart: boolean;
  links: 'default' | 'underline' | 'highlight';
  focus: 'default' | 'large';
  cursor: 'default' | 'large';
  readingGuide: boolean;
  readingMask: boolean;
  /** 'full' keeps animations on even when the OS asks to reduce motion. */
  motion: 'system' | 'full' | 'reduce' | 'off';
  hideImages: boolean;
  largeTargets: boolean;
}
export type A11yPrefKey = keyof A11yPrefs;

export interface SystemPrefs {
  reducedMotion: boolean;
  contrast: 'more' | 'less' | 'custom' | 'no-preference';
  colorScheme: 'light' | 'dark';
  forcedColors: boolean;
  reducedTransparency: boolean;
}

export declare const A11Y_STORAGE_KEY: string;
export declare const defaultA11yPrefs: Readonly<A11yPrefs>;
export declare const a11yOptions: Readonly<{
  contrast: A11yContrast[];
  colorFilter: A11yColorFilter[];
  saturation: Array<A11yPrefs['saturation']>;
  lineHeight: A11ySpacing[];
  letterSpacing: A11ySpacing[];
  wordSpacing: A11ySpacing[];
  paragraphSpacing: A11ySpacing[];
  links: Array<A11yPrefs['links']>;
  focus: Array<A11yPrefs['focus']>;
  cursor: Array<A11yPrefs['cursor']>;
  motion: Array<A11yPrefs['motion']>;
}>;
/** Values of the theme and sound controls (stored by theme.js and sound.js). */
export declare const themePanelOptions: Readonly<{
  mode: Array<'system' | 'light' | 'dark' | 'hc'>;
  preset: string[];
  accent: string[];
  soundTheme: SoundTheme[];
}>;
/** Swatch color of each built-in accent. */
export declare const accentSwatches: Readonly<Record<string, string>>;
/** Light and dark preview colors of each preset tile ('default' is the Pelagic palette). */
export declare const presetSwatches: Readonly<Record<string, Record<'light' | 'dark', { surface: string; alt: string; text: string; primary: string }>>>;
export declare const FONT_SCALE_MIN: number;
export declare const FONT_SCALE_MAX: number;
export declare const COLOR_FILTERS_ID: string;
export declare const colorFilterMatrices: Readonly<Record<Exclude<A11yColorFilter, 'none'>, string>>;

export declare function normalizeA11yPrefs(prefs?: Partial<A11yPrefs> | null): A11yPrefs;
export declare function isDefaultA11yPrefs(prefs?: Partial<A11yPrefs> | null): boolean;
export declare function countActiveA11yPrefs(prefs?: Partial<A11yPrefs> | null): number;
/** data-a11y-* attributes for SSR (null = absent). */
export declare function a11yPrefsToAttributes(prefs?: Partial<A11yPrefs> | null): Record<string, string | null>;
export declare function ensureColorFilters(doc?: Document): void;
/** Apply preferences to `target` (default <html>). Returns the normalized preferences. */
export declare function applyA11yPrefs(prefs: Partial<A11yPrefs>, target?: HTMLElement): A11yPrefs;
export declare function saveA11yPrefs(prefs: Partial<A11yPrefs>, key?: string): void;
export declare function loadA11yPrefs(key?: string): A11yPrefs;
export declare function resetA11yPrefs(target?: HTMLElement, key?: string): A11yPrefs;
export declare function getSystemPrefs(win?: Window): SystemPrefs;
/** Calls `callback` now and on every OS change. Returns an unsubscribe function. */
export declare function watchSystemPrefs(callback: (prefs: SystemPrefs) => void, win?: Window): () => void;

/* ---------- Shared panel model ---------- */
export type A11yControlType = 'tiles' | 'select' | 'segmented' | 'switch' | 'scale' | 'presets' | 'swatches' | 'color';
/** Keys of the theme (mode, preset, accent, brand) and sound (sound, soundTheme) controls. */
export type A11yExternalKey = 'mode' | 'preset' | 'accent' | 'brand' | 'sound' | 'soundTheme';
export interface A11yControl {
  key: A11yPrefKey | A11yExternalKey;
  type: A11yControlType;
  /** 'theme' and 'sound' controls keep their value in theme.js / sound.js, not in A11yPrefs. */
  source?: 'theme' | 'sound';
  /** For switches over string values: the value when on / off. */
  on?: string;
  off?: string;
}
export interface A11yGroup {
  id: 'appearance' | 'color' | 'text' | 'reading' | 'motion' | 'interaction' | 'sound';
  controls: A11yControl[];
}
export declare const a11yPanelSchema: ReadonlyArray<A11yGroup>;
/** True for the theme and sound controls. */
export declare function isExternalControl(control: A11yControl | undefined): boolean;
/** Groups to show: `groups` limits and orders them, appearance / sound false drop those groups. */
export declare function panelGroups(groups?: Array<A11yGroup['id']>, options?: { appearance?: boolean; sound?: boolean | 'auto' }): A11yGroup[];
/** Current value of a theme control (accent is null while a brand color is applied). */
export declare function themeControlValue(state: ThemeState, key: 'mode' | 'preset' | 'accent' | 'brand'): string | null;
export declare const contrastSwatches: Readonly<Record<A11yContrast, [string, string] | null>>;

export interface A11yControlLabels {
  label: string;
  hint?: string;
  decrease?: string;
  increase?: string;
  /** Brand color: the button that removes it. */
  clear?: string;
}
export interface A11yPanelLabels {
  title: string;
  subtitle: string;
  trigger: string;
  close: string;
  reset: string;
  resetDone: string;
  preview: string;
  previewTitle: string;
  previewBody: string;
  previewLink: string;
  previewButton: string;
  previewStatus: string;
  on: string;
  off: string;
  /** '{n} active' */
  active: string;
  /** '{label}: {value}' */
  changed: string;
  /** The button that restores the default preset and accent. */
  themeReset: string;
  groups: Record<A11yGroup['id'], string>;
  controls: Record<A11yPrefKey | A11yExternalKey, A11yControlLabels>;
  options: Partial<Record<A11yPrefKey | A11yExternalKey, Record<string, string>>>;
}
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type A11yPanelLabelOverrides = DeepPartial<A11yPanelLabels>;
export declare const a11yPanelLabels: Readonly<{ en: A11yPanelLabels; ar: A11yPanelLabels }>;
export declare function getA11yLabels(locale?: string, overrides?: A11yPanelLabelOverrides): A11yPanelLabels;
export declare function describeA11yValue(labels: A11yPanelLabels, key: A11yPrefKey | A11yExternalKey, value: unknown): string;
export declare function announceA11yChange(labels: A11yPanelLabels, key: A11yPrefKey | A11yExternalKey, value: unknown): string;

/* ---------- Framework-free panel ---------- */
export declare const a11yIcons: Readonly<Record<'accessibility' | 'appearance' | 'color' | 'text' | 'reading' | 'motion' | 'interaction' | 'sound' | 'check', string>>;
export interface A11yPanelRenderOptions {
  id?: string;
  locale?: string;
  labels?: A11yPanelLabelOverrides;
  /** Default 'floating'. */
  trigger?: 'floating' | 'inline' | 'none';
  triggerLabel?: string;
  /** Default true. */
  preview?: boolean;
  groups?: Array<A11yGroup['id']>;
  /** Initial state for server rendering. */
  prefs?: Partial<A11yPrefs>;
  className?: string;
  /** Show the Theme group (mode, color theme, accent, own color). Default true. */
  appearance?: boolean;
  /** Sound group: 'auto' (default) shows it when the page has a sound engine; true always; false never. */
  sound?: boolean | 'auto';
  /** Theme state for server rendering (default: read from <html>). */
  theme?: Partial<ThemeState>;
  /** Sound preferences for server rendering (default: saved ones). */
  soundPrefs?: Partial<SoundPrefs>;
}
/** HTML of an AccessibilityPanel (trigger, live region, backdrop, dialog). Escapes every label. */
export declare function renderA11yPanelHTML(options?: A11yPanelRenderOptions): string;
export interface A11yPanelChange {
  key: A11yPrefKey | 'reset';
  value: unknown;
}
export interface A11yPanelMountOptions {
  target?: HTMLElement | null | (() => HTMLElement | null | undefined);
  persist?: boolean | string;
  value?: Partial<A11yPrefs>;
  onChange?: (prefs: A11yPrefs, change: A11yPanelChange) => void;
  onOpenChange?: (open: boolean) => void;
  /** Move the dialog to <body>. Default true. */
  portal?: boolean;
  /** Element the Theme group switches (animated only for <html>). Default <html>. */
  themeTarget?: HTMLElement;
  /** Same as the render option; 'auto' reveals the Sound group once a sound engine exists. */
  sound?: boolean | 'auto';
}
export interface A11yPanelController {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  get(): A11yPrefs;
  set<K extends A11yPrefKey>(key: K, value: A11yPrefs[K]): void;
  /** Replace all preferences without announcing or firing onChange (for controlled wrappers). */
  setAll(prefs: Partial<A11yPrefs>): void;
  reset(): void;
  destroy(): void;
}
/** Wire up panel markup: state, persistence, keyboard, focus trap, announcements. */
export declare function mountA11yPanel(root: HTMLElement, options?: A11yPanelMountOptions): A11yPanelController;

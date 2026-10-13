/**
 * Pelagic UI theme source of truth.
 *
 * A theme = mode (light | dark | hc) × accent (violet | teal | indigo | rose | amber | emerald | slate) × shape.
 * `scripts/build.mjs` generates `pelagic.css` and `tokens.ts` from this file, and
 * `scripts/check-contrast.mjs` verifies every mode × accent pair against WCAG 2.2 AA.
 */

/** Neutrals and status colors per mode. */
export const modes = {
  light: {
    surface: '#ffffff',
    surfaceAlt: '#f4f8f9',
    surfaceMuted: '#e8eef0',
    text: '#16262d',
    textMuted: '#4b6873',
    border: '#dbe5e8',
    /** Borders of inputs and other controls (WCAG 1.4.11 needs ≥ 3:1). */
    controlBorder: '#768c95',
    success: '#0f6b33',
    warning: '#9a4100',
    danger: '#c0262d',
    info: '#1458b0',
    onDanger: '#ffffff',
    overlay: 'rgba(13, 20, 24, 0.55)',
    shadowRgb: '22, 38, 45',
  },
  dark: {
    surface: '#10161b',
    surfaceAlt: '#172028',
    surfaceMuted: '#202b34',
    text: '#e7eef1',
    textMuted: '#a1b4bc',
    border: '#283640',
    controlBorder: '#6d838e',
    success: '#4cd987',
    warning: '#f6a35c',
    danger: '#ff8a8a',
    info: '#78b3ff',
    onDanger: '#2a0606',
    overlay: 'rgba(0, 0, 0, 0.65)',
    shadowRgb: '0, 0, 0',
  },
  /** High contrast (light). Used for data-theme="hc" and `prefers-contrast: more`. */
  hc: {
    surface: '#ffffff',
    surfaceAlt: '#ffffff',
    surfaceMuted: '#ececec',
    text: '#000000',
    textMuted: '#1a1a1a',
    border: '#000000',
    controlBorder: '#000000',
    success: '#00561f',
    warning: '#6e2a00',
    danger: '#9c0006',
    info: '#00339c',
    onDanger: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.75)',
    shadowRgb: '0, 0, 0',
  },
};

/**
 * Accent palettes. Per mode:
 * - primary: filled buttons, selected states (text on it is onPrimary)
 * - primaryHover: hover fill
 * - primaryInk: accent text and links on surfaces
 */
export const accents = {
  /** Default Pelagic accent: electric violet. */
  violet: {
    light: { primary: '#5b34d6', primaryHover: '#4925b8', primaryInk: '#5230cc', onPrimary: '#ffffff' },
    dark: { primary: '#b9a5ff', primaryHover: '#d3c7ff', primaryInk: '#c4b5fd', onPrimary: '#1d0f4a' },
    hc: { primary: '#3a17a3', primaryHover: '#2b0f80', primaryInk: '#3a17a3', onPrimary: '#ffffff' },
  },
  teal: {
    light: { primary: '#0d7377', primaryHover: '#0a5c5f', primaryInk: '#0b6b6b', onPrimary: '#ffffff' },
    dark: { primary: '#2fb8b8', primaryHover: '#5fcaca', primaryInk: '#6fd1d1', onPrimary: '#06201f' },
    hc: { primary: '#005252', primaryHover: '#003d3d', primaryInk: '#004747', onPrimary: '#ffffff' },
  },
  indigo: {
    light: { primary: '#4338ca', primaryHover: '#3730a3', primaryInk: '#4338ca', onPrimary: '#ffffff' },
    dark: { primary: '#a5b4fc', primaryHover: '#c7d2fe', primaryInk: '#b4c0fd', onPrimary: '#1e1b4b' },
    hc: { primary: '#2a1b9c', primaryHover: '#1f1478', primaryInk: '#2a1b9c', onPrimary: '#ffffff' },
  },
  rose: {
    light: { primary: '#be123c', primaryHover: '#9f1239', primaryInk: '#b3123a', onPrimary: '#ffffff' },
    dark: { primary: '#fda4af', primaryHover: '#fecdd3', primaryInk: '#fdb0ba', onPrimary: '#4c0519' },
    hc: { primary: '#87001f', primaryHover: '#6a0018', primaryInk: '#87001f', onPrimary: '#ffffff' },
  },
  amber: {
    light: { primary: '#a34a06', primaryHover: '#853c05', primaryInk: '#974506', onPrimary: '#ffffff' },
    dark: { primary: '#fbbf24', primaryHover: '#fcd34d', primaryInk: '#fcd34d', onPrimary: '#2b1a00' },
    hc: { primary: '#5f2a00', primaryHover: '#4a2100', primaryInk: '#5f2a00', onPrimary: '#ffffff' },
  },
  emerald: {
    light: { primary: '#047857', primaryHover: '#065f46', primaryInk: '#036e50', onPrimary: '#ffffff' },
    dark: { primary: '#34d399', primaryHover: '#6ee7b7', primaryInk: '#6ee7b7', onPrimary: '#022c22' },
    hc: { primary: '#00503a', primaryHover: '#003d2c', primaryInk: '#00503a', onPrimary: '#ffffff' },
  },
  slate: {
    light: { primary: '#334155', primaryHover: '#1e293b', primaryInk: '#334155', onPrimary: '#ffffff' },
    dark: { primary: '#cbd5e1', primaryHover: '#e2e8f0', primaryInk: '#cbd5e1', onPrimary: '#0f172a' },
    hc: { primary: '#000000', primaryHover: '#262626', primaryInk: '#000000', onPrimary: '#ffffff' },
  },
};

/** Corner radius presets, selected with data-shape. */
export const shapes = {
  sharp: { sm: 2, md: 4, lg: 6 },
  default: { sm: 8, md: 12, lg: 16 },
  round: { sm: 12, md: 18, lg: 24 },
};

/** Soft tints are a mix of a color into the surface. Kept here so CSS and JS agree. */
export const softMix = { primary: 0.14, status: 0.12 };

/**
 * Accent tints of the Pelagic design language (fractions of primary mixed into a neutral):
 * hover = interactive hover wash, press = pressed wash, canvas = sunken/page areas (into surfaceAlt),
 * border = hairlines that pick up the accent hue (into border).
 */
export const tint = { hover: 0.07, press: 0.12, canvas: 0.035, border: 0.1 };

/**
 * WCAG 2.2 AA pairs every theme must pass: [label, foreground key, background key, minimum ratio].
 * Used by scripts/check-contrast.mjs (built-in themes, accessibility schemes, inverted rendering) and by
 * createTheme() in src/theme.js, which tunes custom brand colors until all of them pass.
 * Keys are resolved token names (see resolveTokens in src/theme.js).
 */
const TEXT = 4.5; // 1.4.3 normal text
const UI = 3; // 1.4.11 non-text (control borders, focus indicator)
export const contrastPairs = [
  ['body text on surface', 'text', 'surface', TEXT],
  ['body text on surface-alt', 'text', 'surfaceAlt', TEXT],
  ['body text on surface-muted', 'text', 'surfaceMuted', TEXT],
  ['muted text on surface', 'textMuted', 'surface', TEXT],
  ['muted text on surface-alt', 'textMuted', 'surfaceAlt', TEXT],
  ['button text on primary', 'onPrimary', 'primary', TEXT],
  ['button text on primary hover', 'onPrimary', 'primaryHover', TEXT],
  ['accent text on surface', 'primaryInk', 'surface', TEXT],
  ['accent text on surface-alt', 'primaryInk', 'surfaceAlt', TEXT],
  ['accent text on primary-soft (badge)', 'primaryInk', 'primarySoft', TEXT],
  ['danger button text', 'onDanger', 'danger', TEXT],
  ['success text on surface', 'success', 'surface', TEXT],
  ['warning text on surface', 'warning', 'surface', TEXT],
  ['danger text on surface', 'danger', 'surface', TEXT],
  ['info text on surface', 'info', 'surface', TEXT],
  ['success badge', 'success', 'successSoft', TEXT],
  ['warning badge', 'warning', 'warningSoft', TEXT],
  ['danger badge', 'danger', 'dangerSoft', TEXT],
  ['info badge', 'info', 'infoSoft', TEXT],
  ['text in alerts (success)', 'text', 'successSoft', TEXT],
  ['text in alerts (danger)', 'text', 'dangerSoft', TEXT],
  ['control border on surface', 'controlBorder', 'surface', UI],
  ['focus ring on surface', 'focus', 'surface', UI],
  ['focus ring on surface-alt', 'focus', 'surfaceAlt', UI],
  ['selected tab underline on surface', 'primary', 'surface', UI],
  // Accent-tinted roles of the design language (same math as build.mjs).
  ['body text on hover tint', 'text', 'tintHover', TEXT],
  ['body text on pressed tint', 'text', 'tintPress', TEXT],
  ['accent text on hover tint', 'primaryInk', 'tintHover', TEXT],
  ['body text on canvas', 'text', 'canvas', TEXT],
  ['muted text on canvas', 'textMuted', 'canvas', TEXT],
  ['accent text on canvas', 'primaryInk', 'canvas', TEXT],
  ['focus ring on canvas', 'focus', 'canvas', UI],
  ['control border on canvas', 'controlBorder', 'canvas', UI],
  ['body text on raised surface', 'text', 'surfaceRaised', TEXT],
  ['muted text on raised surface', 'textMuted', 'surfaceRaised', TEXT],
  ['danger text on raised surface (menu item)', 'danger', 'surfaceRaised', TEXT],
  ['danger text on danger tint (menu hover)', 'danger', 'dangerSoft', TEXT],
  ['muted text on surface-muted (segmented, chips)', 'textMuted', 'surfaceMuted', TEXT],
  ['selected text on primary-soft (option, tree, row)', 'text', 'primarySoft', TEXT],
  ['control border on surface-alt', 'controlBorder', 'surfaceAlt', UI],
];

/** Extra pairs for the optional secondary brand color of custom themes (createTheme({ secondary })). */
export const secondaryContrastPairs = [
  ['button text on secondary', 'onSecondary', 'secondary', TEXT],
  ['button text on secondary hover', 'onSecondary', 'secondaryHover', TEXT],
  ['secondary text on surface', 'secondaryInk', 'surface', TEXT],
  ['secondary text on surface-alt', 'secondaryInk', 'surfaceAlt', TEXT],
  ['secondary fill on surface', 'secondary', 'surface', UI],
];

/**
 * Accessibility color schemes, selected with data-a11y-contrast on <html> or any container
 * (see src/parts/a11y-modes.css and src/a11y-prefs.js). Each one is a complete palette: the build
 * turns it into !important token overrides, so contrast is exact and check-contrast verifies it.
 * Status colors are deliberately the same as the text in the strict two-color schemes; components carry
 * status by icon and text as well, never by color alone.
 */
export const contrastSchemes = {
  'yellow-black': {
    colorScheme: 'dark',
    surface: '#000000', surfaceAlt: '#000000', surfaceMuted: '#1f1f00',
    text: '#ffff00', textMuted: '#ffff00', border: '#ffff00', controlBorder: '#ffff00',
    primary: '#ffff00', primaryHover: '#ffffff', primaryInk: '#ffff00', onPrimary: '#000000',
    success: '#ffff00', warning: '#ffff00', danger: '#ffff00', info: '#ffff00', onDanger: '#000000',
    overlay: 'rgba(0, 0, 0, 0.85)',
  },
  'black-yellow': {
    colorScheme: 'light',
    surface: '#ffff00', surfaceAlt: '#ffff00', surfaceMuted: '#e6e600',
    text: '#000000', textMuted: '#000000', border: '#000000', controlBorder: '#000000',
    primary: '#000000', primaryHover: '#2e2e00', primaryInk: '#000000', onPrimary: '#ffff00',
    success: '#000000', warning: '#000000', danger: '#000000', info: '#000000', onDanger: '#ffff00',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  'white-black': {
    colorScheme: 'dark',
    surface: '#000000', surfaceAlt: '#000000', surfaceMuted: '#1f1f1f',
    text: '#ffffff', textMuted: '#ffffff', border: '#ffffff', controlBorder: '#ffffff',
    primary: '#ffffff', primaryHover: '#d6d6d6', primaryInk: '#ffffff', onPrimary: '#000000',
    success: '#ffffff', warning: '#ffffff', danger: '#ffffff', info: '#ffffff', onDanger: '#000000',
    overlay: 'rgba(0, 0, 0, 0.85)',
  },
  'black-white': {
    colorScheme: 'light',
    surface: '#ffffff', surfaceAlt: '#ffffff', surfaceMuted: '#ebebeb',
    text: '#000000', textMuted: '#000000', border: '#000000', controlBorder: '#000000',
    primary: '#000000', primaryHover: '#333333', primaryInk: '#000000', onPrimary: '#ffffff',
    success: '#000000', warning: '#000000', danger: '#000000', info: '#000000', onDanger: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  /** Grayscale, light page. Statuses keep distinct grey levels; meaning is carried by icon and text. */
  gray: {
    colorScheme: 'light',
    surface: '#ffffff', surfaceAlt: '#f3f3f3', surfaceMuted: '#e6e6e6',
    text: '#1a1a1a', textMuted: '#4f4f4f', border: '#d4d4d4', controlBorder: '#767676',
    primary: '#3b3b3b', primaryHover: '#1f1f1f', primaryInk: '#333333', onPrimary: '#ffffff',
    success: '#3d3d3d', warning: '#474747', danger: '#1f1f1f', info: '#333333', onDanger: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  /** Grayscale on a dark page (data-theme="dark", or the OS in dark mode). */
  'gray-dark': {
    colorScheme: 'dark',
    surface: '#141414', surfaceAlt: '#1c1c1c', surfaceMuted: '#282828',
    text: '#ededed', textMuted: '#b3b3b3', border: '#333333', controlBorder: '#8a8a8a',
    primary: '#d9d9d9', primaryHover: '#f2f2f2', primaryInk: '#e0e0e0', onPrimary: '#111111',
    success: '#d1d1d1', warning: '#c7c7c7', danger: '#f0f0f0', info: '#dedede', onDanger: '#111111',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const defaultMode = 'light';
export const defaultAccent = 'violet';
export const defaultShape = 'default';

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
  /** Open-water blue, brighter than indigo. */
  ocean: {
    light: { primary: '#007bbb', primaryHover: '#00669b', primaryInk: '#006ea7', onPrimary: '#ffffff' },
    dark: { primary: '#3fa7ed', primaryHover: '#58baff', primaryInk: '#4db4fa', onPrimary: '#001829' },
    hc: { primary: '#005c8d', primaryHover: '#004b74', primaryInk: '#004e79', onPrimary: '#ffffff' },
  },
  /** Warm red-orange. */
  coral: {
    light: { primary: '#d1451d', primaryHover: '#b63000', primaryInk: '#c03403', onPrimary: '#ffffff' },
    dark: { primary: '#fa6b46', primaryHover: '#ff8c6d', primaryInk: '#ff8160', onPrimary: '#2c0902' },
    hc: { primary: '#a42a00', primaryHover: '#882100', primaryInk: '#8a2200', onPrimary: '#ffffff' },
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

/**
 * Named theme presets, selected with data-theme-preset. A preset changes the whole palette, not only the
 * accent: page and card surfaces, text, borders, status colors and its own accent, for light and dark.
 * High contrast keeps the pure black-on-white neutrals and uses the preset's high-contrast accent.
 * An explicit data-accent (or a custom brand from createTheme({ preset })) still wins over the preset accent.
 * Every preset × mode, and every preset × built-in accent, is verified by scripts/check-contrast.mjs.
 */
export const presets = {
  lagoon: {
    light: { surface: '#f9fefe', surfaceAlt: '#e9fafb', surfaceMuted: '#dbeff0', text: '#172a2b', textMuted: '#50686a', border: '#d0e2e3', controlBorder: '#7a8c8d', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#0b7a8c', primaryHover: '#006474', primaryInk: '#007183', onPrimary: '#ffffff' },
    dark: { surface: '#02171c', surfaceAlt: '#072025', surfaceMuted: '#112a30', text: '#d2edf4', textMuted: '#99b7bf', border: '#20383e', controlBorder: '#5a777f', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#38d0d6', primaryHover: '#53e4ea', primaryInk: '#38d0d6', onPrimary: '#001b1c' },
    hc: { primary: '#006170', primaryHover: '#004f5c', primaryInk: '#005260', onPrimary: '#ffffff' },
  },
  abyss: {
    light: { surface: '#fcfdff', surfaceAlt: '#f0f6ff', surfaceMuted: '#e3ebf6', text: '#202730', textMuted: '#5b6470', border: '#d7dfe8', controlBorder: '#818992', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#1f47c9', primaryHover: '#0f2fb1', primaryInk: '#1f47c9', onPrimary: '#ffffff' },
    dark: { surface: '#040c20', surfaceAlt: '#09142a', surfaceMuted: '#111e36', text: '#dde8fd', textMuted: '#a5b2c8', border: '#1f2c44', controlBorder: '#607292', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#6ccbff', primaryHover: '#9fdbff', primaryInk: '#6ccbff', onPrimary: '#001926' },
    hc: { primary: '#1f47c9', primaryHover: '#1132b5', primaryInk: '#1639bb', onPrimary: '#ffffff' },
  },
  reef: {
    light: { surface: '#fffcfc', surfaceAlt: '#fff3ef', surfaceMuted: '#fae6df', text: '#33221c', textMuted: '#745d56', border: '#ecdad3', controlBorder: '#96847d', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#cc4829', primaryHover: '#b4300d', primaryInk: '#bb3817', onPrimary: '#ffffff' },
    dark: { surface: '#1d100e', surfaceAlt: '#261816', surfaceMuted: '#31221f', text: '#fbe1dc', textMuted: '#c6a9a4', border: '#3f302d', controlBorder: '#806c68', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#ff8a6b', primaryHover: '#ffaa93', primaryInk: '#ff8a6b', onPrimary: '#2c0902' },
    hc: { primary: '#a82700', primaryHover: '#8c1f00', primaryInk: '#8c1f00', onPrimary: '#ffffff' },
  },
  kelp: {
    light: { surface: '#fbfefc', surfaceAlt: '#eef9f1', surfaceMuted: '#e1efe5', text: '#1e2a22', textMuted: '#58685d', border: '#d5e2d9', controlBorder: '#7f8c83', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#1d7148', primaryHover: '#005c36', primaryInk: '#1d7148', onPrimary: '#ffffff' },
    dark: { surface: '#0a170f', surfaceAlt: '#122017', surfaceMuted: '#1b2a20', text: '#d9eedf', textMuted: '#a0b8a8', border: '#2a382e', controlBorder: '#64776a', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#5fd49a', primaryHover: '#74e8ad', primaryInk: '#5fd49a', onPrimary: '#001c0e' },
    hc: { primary: '#09653d', primaryHover: '#005230', primaryInk: '#005632', onPrimary: '#ffffff' },
  },
  sage: {
    light: { surface: '#fdfefa', surfaceAlt: '#f4f8ec', surfaceMuted: '#e9eddf', text: '#25281c', textMuted: '#616655', border: '#dce0d3', controlBorder: '#868a7d', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#56702a', primaryHover: '#435c13', primaryInk: '#56702a', onPrimary: '#ffffff' },
    dark: { surface: '#13150c', surfaceAlt: '#1b1d13', surfaceMuted: '#25271d', text: '#e5ebd8', textMuted: '#aeb4a0', border: '#33362b', controlBorder: '#707466', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#b6cf7a', primaryHover: '#c9e38d', primaryInk: '#b6cf7a', onPrimary: '#121900' },
    hc: { primary: '#476018', primaryHover: '#374f00', primaryInk: '#3a5204', onPrimary: '#ffffff' },
  },
  dune: {
    light: { surface: '#fffdf9', surfaceAlt: '#fff4e4', surfaceMuted: '#f6e8d4', text: '#2f2515', textMuted: '#6e614d', border: '#e9dcc9', controlBorder: '#938673', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#a5530d', primaryHover: '#8a4200', primaryInk: '#a14f05', onPrimary: '#ffffff' },
    dark: { surface: '#1b120b', surfaceAlt: '#231a12', surfaceMuted: '#2e241b', text: '#f7e4d6', textMuted: '#c1ad9d', border: '#3c3229', controlBorder: '#7d6f64', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#f0b45c', primaryHover: '#ffc97e', primaryInk: '#f0b45c', onPrimary: '#211300' },
    hc: { primary: '#8d4400', primaryHover: '#753700', primaryInk: '#783900', onPrimary: '#ffffff' },
  },
  aurora: {
    light: { surface: '#fdfdff', surfaceAlt: '#f7f4ff', surfaceMuted: '#ece8f7', text: '#282431', textMuted: '#666072', border: '#e0dbea', controlBorder: '#8a8594', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#7b3fd6', primaryHover: '#6824be', primaryInk: '#7b3fd6', onPrimary: '#ffffff' },
    dark: { surface: '#16111f', surfaceAlt: '#1e1929', surfaceMuted: '#282234', text: '#ebe4fa', textMuted: '#b4acc5', border: '#363142', controlBorder: '#756d84', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#d7a8ff', primaryHover: '#e3c4ff', primaryInk: '#d7a8ff', onPrimary: '#1e0d2a' },
    hc: { primary: '#6f2fc7', primaryHover: '#5f14b3', primaryInk: '#621ab7', onPrimary: '#ffffff' },
  },
  merlot: {
    light: { surface: '#fffcfc', surfaceAlt: '#fff2f1', surfaceMuted: '#f7e6e4', text: '#312221', textMuted: '#715e5c', border: '#eadad8', controlBorder: '#948482', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#8f1d3d', primaryHover: '#76002c', primaryInk: '#8f1d3d', onPrimary: '#ffffff' },
    dark: { surface: '#1e0f11', surfaceAlt: '#271719', surfaceMuted: '#322023', text: '#fbe0e3', textMuted: '#c6a8ac', border: '#412e31', controlBorder: '#836a6d', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#f29ab2', primaryHover: '#ffb2c6', primaryInk: '#f29ab2', onPrimary: '#2a0714' },
    hc: { primary: '#8f1d3d', primaryHover: '#7b002e', primaryInk: '#8b183a', onPrimary: '#ffffff' },
  },
  ink: {
    light: { surface: '#fffdf9', surfaceAlt: '#fbf5e7', surfaceMuted: '#f1ead9', text: '#2c2616', textMuted: '#6b624f', border: '#e4dece', controlBorder: '#8d8777', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#1e3a8a', primaryHover: '#0e2574', primaryInk: '#1e3a8a', onPrimary: '#ffffff' },
    dark: { surface: '#0b1423', surfaceAlt: '#121c2d', surfaceMuted: '#1c2639', text: '#dde8fd', textMuted: '#a5b2c8', border: '#2a3447', controlBorder: '#64728b', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#e5bd62', primaryHover: '#f9d076', primaryInk: '#e5bd62', onPrimary: '#1e1400' },
    hc: { primary: '#1e3a8a', primaryHover: '#102877', primaryInk: '#1e3a8a', onPrimary: '#ffffff' },
  },
  graphite: {
    light: { surface: '#fcfdfe', surfaceAlt: '#f3f6fa', surfaceMuted: '#e7ebef', text: '#24272b', textMuted: '#606469', border: '#dbdee2', controlBorder: '#85888d', success: '#0f6b33', warning: '#9a4100', danger: '#c0262d', info: '#1458b0', onDanger: '#ffffff', primary: '#2f5fd0', primaryHover: '#1c49b8', primaryInk: '#2f5fd0', onPrimary: '#ffffff' },
    dark: { surface: '#101419', surfaceAlt: '#181c22', surfaceMuted: '#22262c', text: '#e1e9f3', textMuted: '#a9b2bd', border: '#30353b', controlBorder: '#6c727a', success: '#4cd987', warning: '#f6a35c', danger: '#ff8a8a', info: '#78b3ff', onDanger: '#2a0606', primary: '#8fb1ff', primaryHover: '#acc6ff', primaryInk: '#8fb1ff', onPrimary: '#091431' },
    hc: { primary: '#214fbe', primaryHover: '#113caa', primaryInk: '#1440ae', onPrimary: '#ffffff' },
  },
};

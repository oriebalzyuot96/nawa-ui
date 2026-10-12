/**
 * Nawa UI theme source of truth.
 *
 * A theme = mode (light | dark | hc) × accent (teal | indigo | rose | amber | emerald | slate) × shape.
 * `scripts/build.mjs` generates `nawa-ui.css` and `tokens.ts` from this file, and
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

export const defaultMode = 'light';
export const defaultAccent = 'teal';
export const defaultShape = 'default';

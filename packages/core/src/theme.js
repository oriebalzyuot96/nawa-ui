// Apply and persist a Pelagic UI theme on the web, and generate custom brand themes.
// Theming is pure CSS attributes, so this works the same for React, Vue, Svelte, Astro or plain HTML.
// Everything except applyTheme / applyCustomTheme / save / load is DOM-free and runs in Node too.
import { contrastPairs, modes as baseModes, presets as themePresets, secondaryContrastPairs, shapes, softMix, tint } from './themes.mjs';

export const THEME_STORAGE_KEY = 'pelagic-ui-theme';

/** Name of the custom theme generated for a live brand color (switchTheme({ brand }) and the panels). */
export const BRAND_THEME_NAME = 'brand';
/** Event dispatched (bubbling) on the target after switchTheme() changed the theme. */
export const THEME_CHANGE_EVENT = 'pl-theme-change';

/**
 * Set data-theme / data-accent / data-shape / data-theme-preset on `target` (default: <html>).
 * mode 'system' removes data-theme so the OS setting (dark mode, high contrast) applies.
 * accent null or 'default' removes data-accent (the preset's own accent, or the default one, applies).
 * preset null or 'default' removes data-theme-preset.
 * `custom` (a createTheme() result) injects that theme's CSS and selects it as the accent.
 * `brand` (any CSS color) builds a WCAG AA theme fitted to the current preset and selects it.
 */
export function applyTheme({ mode, accent, shape, custom, preset, brand } = {}, target = document.documentElement) {
  if (mode !== undefined) {
    if (mode === 'system' || mode === null) target.removeAttribute('data-theme');
    else target.setAttribute('data-theme', mode);
  }
  if (preset !== undefined) {
    if (!preset || preset === 'default') target.removeAttribute('data-theme-preset');
    else target.setAttribute('data-theme-preset', preset);
  }
  if (custom) applyCustomTheme(custom, target);
  else if (brand) applyBrandColor(brand, target);
  else if (accent !== undefined || brand === null) {
    if (target.getAttribute('data-accent') === BRAND_THEME_NAME) removeCustomTheme(BRAND_THEME_NAME, target.ownerDocument ?? document);
    if (accent === undefined) {
      if (target.getAttribute('data-accent') === BRAND_THEME_NAME) target.removeAttribute('data-accent');
    } else if (accent === null || accent === 'default') target.removeAttribute('data-accent');
    else target.setAttribute('data-accent', accent);
  }
  if (shape !== undefined) target.setAttribute('data-shape', shape);
}

/** Save a theme choice. Storage can be unavailable (private mode); failures are ignored. */
export function saveTheme(theme) {
  try {
    const { custom, ...rest } = theme ?? {};
    // A full createTheme() result is large; keep only what restores it before first paint.
    const value = custom ? { ...rest, accent: custom.name, customCss: custom.css } : rest;
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/** Read a saved theme choice, or null. */
export function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ==========================================================================
 * Color math: parsing, OKLab / OKLCH, gamut mapping and WCAG 2.x contrast.
 * ======================================================================== */

const NAMED = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', lime: '#00ff00', blue: '#0000ff',
  yellow: '#ffff00', orange: '#ffa500', purple: '#800080', violet: '#ee82ee', indigo: '#4b0082', teal: '#008080',
  navy: '#000080', maroon: '#800000', olive: '#808000', aqua: '#00ffff', cyan: '#00ffff', fuchsia: '#ff00ff',
  magenta: '#ff00ff', pink: '#ffc0cb', gold: '#ffd700', coral: '#ff7f50', crimson: '#dc143c', tomato: '#ff6347',
  gray: '#808080', grey: '#808080', silver: '#c0c0c0', brown: '#a52a2a', rebeccapurple: '#663399',
  turquoise: '#40e0d0', salmon: '#fa8072', chocolate: '#d2691e', slategray: '#708090',
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (s, scale = 1) => (String(s).trim().endsWith('%') ? (parseFloat(s) / 100) * scale : parseFloat(s));
function hue(s) {
  const v = String(s).trim();
  if (v.endsWith('turn')) return parseFloat(v) * 360;
  if (v.endsWith('rad')) return (parseFloat(v) * 180) / Math.PI;
  if (v.endsWith('grad')) return parseFloat(v) * 0.9;
  return parseFloat(v);
}

/**
 * Parse a CSS color: #rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba(), hsl()/hsla(), oklch(), oklab()
 * or a common named color. Returns `{ r, g, b, alpha }` with sRGB channels in 0..1 (may be out of gamut
 * for oklch/oklab input). Throws a TypeError for anything else.
 */
export function parseColor(input) {
  if (input && typeof input === 'object' && 'r' in input) return { alpha: 1, ...input };
  const s = String(input ?? '').trim().toLowerCase();
  if (NAMED[s]) return parseColor(NAMED[s]);
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) throw new TypeError(`Unsupported color: ${input}`);
    const v = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: v(0), g: v(2), b: v(4), alpha: h.length === 8 ? v(6) : 1 };
  }
  m = s.match(/^([a-z]+)\((.*)\)$/);
  if (!m) throw new TypeError(`Unsupported color: ${input}`);
  const fn = m[1];
  const parts = m[2].replace(/\s*\/\s*/, ' / ').split(/[\s,]+/).filter(Boolean);
  const slash = parts.indexOf('/');
  const alphaRaw = slash >= 0 ? parts[slash + 1] : parts[3];
  const args = slash >= 0 ? parts.slice(0, slash) : parts.slice(0, 3);
  const alpha = alphaRaw === undefined ? 1 : clamp(num(alphaRaw), 0, 1);
  if (args.length !== 3 || args.some((a) => Number.isNaN(parseFloat(a)) && a !== 'none')) throw new TypeError(`Unsupported color: ${input}`);
  const a = args.map((x) => (x === 'none' ? '0' : x));
  if (fn === 'rgb' || fn === 'rgba') return { r: num(a[0], 255) / 255, g: num(a[1], 255) / 255, b: num(a[2], 255) / 255, alpha };
  if (fn === 'hsl' || fn === 'hsla') {
    const h = (((hue(a[0]) % 360) + 360) % 360) / 360;
    const sat = clamp(num(a[1], 100) / 100, 0, 1);
    const l = clamp(num(a[2], 100) / 100, 0, 1);
    const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
    const p = 2 * l - q;
    const f = (t) => {
      t = (t + 1) % 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return { r: f(h + 1 / 3), g: f(h), b: f(h - 1 / 3), alpha };
  }
  if (fn === 'oklch') {
    const L = num(a[0]);
    const C = String(a[1]).endsWith('%') ? num(a[1], 0.4) : parseFloat(a[1]);
    return { ...oklchToRgb({ L, C, H: hue(a[2]) }), alpha };
  }
  if (fn === 'oklab') {
    const L = num(a[0]);
    const A = String(a[1]).endsWith('%') ? num(a[1], 0.4) : parseFloat(a[1]);
    const B = String(a[2]).endsWith('%') ? num(a[2], 0.4) : parseFloat(a[2]);
    return { ...oklabToRgb({ L, a: A, b: B }), alpha };
  }
  throw new TypeError(`Unsupported color: ${input}`);
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.sign(c) * Math.abs(c) ** (1 / 2.4) - 0.055);

function rgbToOklab({ r, g, b }) {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/** sRGB (0..1) → OKLCH { L 0..1, C, H degrees }. */
export function rgbToOklch(rgb) {
  const { L, a, b } = rgbToOklab(rgb);
  const C = Math.sqrt(a * a + b * b);
  const H = C < 1e-4 ? 0 : (((Math.atan2(b, a) * 180) / Math.PI) % 360 + 360) % 360;
  return { L, C, H };
}

/** OKLCH → sRGB (0..1, not clamped). */
export function oklchToRgb({ L, C, H }) {
  const h = (H * Math.PI) / 180;
  return oklabToRgb({ L, a: C * Math.cos(h), b: C * Math.sin(h) });
}

const inGamut = ({ r, g, b }, eps = 1e-6) => [r, g, b].every((v) => v >= -eps && v <= 1 + eps);

/** OKLCH → in-gamut sRGB by reducing chroma (keeps lightness and hue, the CSS Color 4 approach). */
export function oklchToGamutRgb({ L, C, H }) {
  const Lc = clamp(L, 0, 1);
  let rgb = oklchToRgb({ L: Lc, C, H });
  if (inGamut(rgb)) return rgb;
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToRgb({ L: Lc, C: mid, H }))) lo = mid;
    else hi = mid;
  }
  rgb = oklchToRgb({ L: Lc, C: lo, H });
  return { r: clamp(rgb.r, 0, 1), g: clamp(rgb.g, 0, 1), b: clamp(rgb.b, 0, 1) };
}

/** sRGB (0..1) → '#rrggbb'. */
export function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('')}`;
}

/** Any supported CSS color → '#rrggbb' (alpha dropped, out-of-gamut colors gamut-mapped). */
export function toHex(color) {
  const c = parseColor(color);
  return rgbToHex(inGamut(c) ? c : oklchToGamutRgb(rgbToOklch(c)));
}

/** Any supported CSS color → OKLCH. */
export const toOklch = (color) => rgbToOklch(parseColor(color));

/** OKLCH → '#rrggbb', gamut mapped. */
export const oklchToHex = (lch) => rgbToHex(oklchToGamutRgb(lch));

/** Same result as CSS `color-mix(in srgb, a <amount*100>%, b)` on hex colors. */
export function mixHex(a, b, amount) {
  const ca = parseColor(a);
  const cb = parseColor(b);
  // 8-bit channels, exactly like scripts/color.mjs, so build output and audits agree to the last bit.
  const m = (x, y) => Math.round(Math.round(x * 255) * amount + Math.round(y * 255) * (1 - amount)) / 255;
  return rgbToHex({ r: m(ca.r, cb.r), g: m(ca.g, cb.g), b: m(ca.b, cb.b) });
}

/** WCAG 2.x relative luminance of a color. */
export function luminance(color) {
  const { r, g, b } = parseColor(color);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio between two colors (1–21). */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ==========================================================================
 * Token resolution (shared by the build, the contrast check and createTheme)
 * ======================================================================== */

/**
 * Fully resolved hex tokens for one mode: neutrals + status (`m`) and accent (`a`, with primary,
 * primaryHover, primaryInk, onPrimary and optional secondary*). Includes the derived soft tints and the
 * accent-tinted roles of the design language (tintHover, tintPress, canvas, surfaceRaised, borderSubtle).
 */
export function resolveTokens(mode, m, a) {
  const t = {
    primary: a.primary,
    primaryHover: a.primaryHover,
    primaryInk: a.primaryInk,
    onPrimary: a.onPrimary,
    primarySoft: mixHex(a.primary, m.surface, softMix.primary),
    focus: a.primary,
    surface: m.surface,
    surfaceAlt: m.surfaceAlt,
    surfaceMuted: m.surfaceMuted,
    text: m.text,
    textMuted: m.textMuted,
    border: m.border,
    controlBorder: m.controlBorder,
    success: m.success,
    warning: m.warning,
    danger: m.danger,
    info: m.info,
    onDanger: m.onDanger,
    successSoft: mixHex(m.success, m.surface, softMix.status),
    warningSoft: mixHex(m.warning, m.surface, softMix.status),
    dangerSoft: mixHex(m.danger, m.surface, softMix.status),
    infoSoft: mixHex(m.info, m.surface, softMix.status),
    overlay: m.overlay,
    tintHover: mixHex(a.primary, m.surface, tint.hover),
    tintPress: mixHex(a.primary, m.surface, tint.press),
    canvas: mixHex(a.primary, m.surfaceAlt, tint.canvas),
    surfaceRaised: mode === 'dark' ? m.surfaceAlt : m.surface,
    borderSubtle: mixHex(a.primary, m.border, tint.border),
  };
  if (a.secondary) {
    Object.assign(t, {
      secondary: a.secondary,
      secondaryHover: a.secondaryHover,
      secondaryInk: a.secondaryInk,
      onSecondary: a.onSecondary,
      secondarySoft: mixHex(a.secondary, m.surface, softMix.primary),
    });
  }
  return t;
}

/** Check resolved tokens against the WCAG pairs. Returns the failures (empty when everything passes). */
export function auditTheme(tokens, pairs = tokens.secondary ? [...contrastPairs, ...secondaryContrastPairs] : contrastPairs) {
  const failures = [];
  for (const [label, fg, bg, min] of pairs) {
    if (!tokens[fg] || !tokens[bg]) continue;
    const ratio = contrastRatio(tokens[fg], tokens[bg]);
    if (ratio < min) failures.push({ label, fg, bg, foreground: tokens[fg], background: tokens[bg], ratio: +ratio.toFixed(2), min });
  }
  return failures;
}

/* ==========================================================================
 * createTheme(): any brand color → light, dark and high-contrast token sets
 * ======================================================================== */

const MODES = ['light', 'dark', 'hc'];
/** Safety margin over the WCAG thresholds so rounding to 8-bit hex never tips a pair under. */
const M = 0.08;

/**
 * Walk OKLCH lightness from `L` in `dir` (+1 lighter, -1 darker) until `ok(hex)` holds.
 * Returns the first passing color, so the result stays as close to the brand as the constraints allow.
 */
function fit({ L, C, H }, dir, ok, step = 0.004) {
  for (let l = clamp(L, 0, 1); l >= 0 && l <= 1; l += dir * step) {
    const hex = oklchToHex({ L: l, C, H });
    if (ok(hex)) return hex;
  }
  return dir > 0 ? '#ffffff' : '#000000';
}

const passes = (hex, against, min) => against.every((bg) => contrastRatio(hex, bg) >= min + M);

/** Accent palette (primary, hover, ink, on-primary) for one mode on the given neutrals. */
function deriveAccent(mode, src, n) {
  const { C, H } = src;
  const surfaces = [n.surface, n.surfaceAlt];
  if (mode === 'dark') {
    const onPrimary = oklchToHex({ L: 0.2, C: Math.min(C, 0.06), H });
    const okPrimary = (hex) => {
      const hover = oklchToHex({ L: toOklch(hex).L + 0.06, C, H });
      return passes(hex, [onPrimary], 4.5) && passes(hover, [onPrimary], 4.5) && passes(hex, [...surfaces, mixHex(hex, n.surfaceAlt, tint.canvas)], 3);
    };
    const primary = fit({ L: Math.max(src.L, 0.7), C, H }, +1, okPrimary);
    const pl = toOklch(primary).L;
    let primaryHover = oklchToHex({ L: pl + 0.06, C, H });
    if (!passes(primaryHover, [onPrimary], 4.5)) primaryHover = primary;
    const inkBgs = (hex) => [...surfaces, mixHex(primary, n.surface, softMix.primary), mixHex(primary, n.surface, tint.hover), mixHex(primary, n.surfaceAlt, tint.canvas)];
    const primaryInk = fit({ L: Math.max(pl, 0.74), C, H }, +1, (hex) => passes(hex, inkBgs(hex), 4.5));
    return { primary, primaryHover, primaryInk, onPrimary };
  }
  // light and hc: white text on a fill dark enough for it; hc aims for AAA (7:1) on fills and ink.
  const onPrimary = '#ffffff';
  const strong = mode === 'hc' ? 7 : 4.5;
  const okPrimary = (hex) => passes(hex, [onPrimary], strong) && passes(hex, [...surfaces, mixHex(hex, n.surfaceAlt, tint.canvas)], 3);
  const primary = fit({ L: Math.min(src.L, mode === 'hc' ? 0.5 : 0.72), C, H }, -1, okPrimary);
  const pl = toOklch(primary).L;
  const primaryHover = oklchToHex({ L: Math.max(0, pl - (mode === 'hc' ? 0.06 : 0.07)), C, H });
  const inkBgs = [...surfaces, mixHex(primary, n.surface, softMix.primary), mixHex(primary, n.surface, tint.hover), mixHex(primary, n.surfaceAlt, tint.canvas)];
  const primaryInk = fit({ L: pl, C, H }, -1, (hex) => passes(hex, inkBgs, strong));
  return { primary, primaryHover, primaryInk, onPrimary };
}

/** Neutrals tinted with the hue of `src` (light and dark); hc keeps its pure black-on-white neutrals. */
function deriveNeutrals(mode, src) {
  const base = { ...baseModes[mode] };
  if (mode === 'hc') return base;
  const H = src.H;
  const c = Math.min(src.C, 0.04);
  const at = (L, k) => oklchToHex({ L, C: c * k, H });
  const n =
    mode === 'light'
      ? { ...base, surface: at(0.997, 0.1), surfaceAlt: at(0.975, 0.35), surfaceMuted: at(0.945, 0.5), border: at(0.91, 0.5) }
      : { ...base, surface: at(0.185, 0.45), surfaceAlt: at(0.222, 0.5), surfaceMuted: at(0.265, 0.55), border: at(0.32, 0.55) };
  const bgs = [n.surface, n.surfaceAlt, n.surfaceMuted];
  const dir = mode === 'light' ? -1 : +1;
  n.text = fit({ L: mode === 'light' ? 0.25 : 0.94, C: c * 0.7, H }, dir, (hex) => passes(hex, bgs, 7));
  n.textMuted = fit({ L: mode === 'light' ? 0.5 : 0.78, C: c * 0.8, H }, dir, (hex) => passes(hex, bgs, 4.5));
  n.controlBorder = fit({ L: mode === 'light' ? 0.64 : 0.55, C: c * 0.6, H }, dir, (hex) => passes(hex, [n.surface, n.surfaceAlt], 3));
  return n;
}

/** Re-fit the status colors (and on-danger) for custom neutrals. */
function fitStatus(mode, n) {
  const dir = mode === 'dark' ? +1 : -1;
  const out = { ...n };
  for (const key of ['success', 'warning', 'danger', 'info']) {
    const src = toOklch(n[key]);
    out[key] = fit(src, dir, (hex) => {
      const soft = mixHex(hex, n.surface, softMix.status);
      return passes(hex, [n.surface, n.surfaceAlt, soft], 4.5) && passes(n.text, [soft], 4.5);
    });
  }
  const dl = toOklch(out.danger);
  out.onDanger = contrastRatio('#ffffff', out.danger) >= 4.5 + M ? '#ffffff' : oklchToHex({ L: 0.18, C: Math.min(dl.C, 0.08), H: dl.H });
  return out;
}

const NEUTRAL_FG = new Set(['text', 'textMuted', 'controlBorder', 'success', 'warning', 'danger', 'info']);
const ACCENT_FG = new Set(['primaryInk', 'secondaryInk']);

/** Push failing foregrounds (neutral text, borders, status, ink) away from their backgrounds. Returns true if a neutral changed. */
function repair(mode, n, accent) {
  const dir = mode === 'dark' ? +1 : -1;
  let neutralChanged = false;
  for (let round = 0; round < 6; round += 1) {
    const failures = auditTheme(resolveTokens(mode, n, accent));
    if (!failures.length) break;
    const t = resolveTokens(mode, n, accent);
    for (const key of new Set(failures.map((f) => f.fg))) {
      const owner = NEUTRAL_FG.has(key) ? n : ACCENT_FG.has(key) ? accent : null;
      if (!owner) continue;
      const mine = failures.filter((f) => f.fg === key);
      owner[key] = fit(toOklch(owner[key]), dir, (hex) => mine.every((f) => contrastRatio(hex, t[f.bg]) >= f.min + M));
      if (owner === n) neutralChanged = true;
    }
  }
  return neutralChanged;
}

const slug = (s) => String(s ?? 'custom').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'custom';
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const ACCENT_KEYS = ['primary', 'primaryHover', 'primaryInk', 'onPrimary'];
const SECONDARY_KEYS = ['secondary', 'secondaryHover', 'secondaryInk', 'onSecondary'];
const NEUTRAL_KEYS = ['surface', 'surfaceAlt', 'surfaceMuted', 'text', 'textMuted', 'border', 'controlBorder', 'success', 'warning', 'danger', 'info', 'onDanger'];

function radiusVars(radius) {
  if (radius === undefined || radius === null) return null;
  const s = typeof radius === 'number' ? { sm: Math.round(radius * 0.66), md: radius, lg: Math.round(radius * 1.33) } : shapes[radius];
  if (!s) throw new TypeError(`Unknown radius "${radius}". Use a number of px or one of: ${Object.keys(shapes).join(', ')}`);
  return {
    'radius-xs': `${Math.max(2, Math.round(s.sm / 2))}px`,
    'radius-sm': `${s.sm}px`,
    radius: `${s.md}px`,
    'radius-lg': `${s.lg}px`,
    'radius-xl': `${s.lg + Math.round(s.lg / 3)}px`,
  };
}

/** Neutral + status tokens of a named preset in one mode (hc presets keep the pure high-contrast neutrals). */
export function presetNeutrals(preset, mode) {
  const p = typeof preset === 'string' ? themePresets[preset] : preset;
  const out = { ...baseModes[mode] };
  if (!p) return out;
  for (const key of NEUTRAL_KEYS) if (p[mode]?.[key] !== undefined) out[key] = p[mode][key];
  return out;
}

/**
 * Build a complete, WCAG 2.2 AA theme from brand colors.
 *
 *   const brand = createTheme({ primary: '#ff6a00', name: 'acme' });
 *   brand.css      // CSS text: scoped to [data-accent="acme"] (light, dark, hc and OS preferences)
 *   brand.tokens   // { light, dark, hc } resolved hex tokens (also for React Native / Flutter)
 *   brand.palette  // { light, dark, hc } accent values, same shape as an entry of `accents` in themes.mjs
 *   applyCustomTheme(brand)            // or applyTheme({ custom: brand }, container)
 *
 * Lightness (and chroma, through gamut mapping) is tuned in OKLCH, keeping the brand hue, until every
 * pair in `contrastPairs` passes in every mode. `primary` may be any CSS color string (hex, rgb, hsl, oklch).
 *
 * @param {string | { primary: string, secondary?: string, neutral?: string, radius?: number | 'sharp' | 'default' | 'round', font?: string, name?: string }} options
 */
export function createTheme(options) {
  const opts = typeof options === 'string' ? { primary: options } : { ...options };
  if (!opts.primary) throw new TypeError('createTheme: `primary` color is required');
  const name = slug(opts.name);
  const brand = toOklch(opts.primary);
  const secondarySrc = opts.secondary ? toOklch(opts.secondary) : null;
  const neutralSrc = opts.neutral ? toOklch(opts.neutral) : null;
  const presetName = opts.preset && opts.preset !== 'default' ? String(opts.preset) : null;
  if (presetName && !themePresets[presetName]) {
    throw new TypeError(`createTheme: unknown preset "${presetName}". Use one of: ${Object.keys(themePresets).join(', ')}`);
  }
  // Base neutrals: a named preset's surfaces (so the brand is fitted to the page it will sit on), explicit
  // `baseNeutrals` (used by the preset generator) or the default Pelagic neutrals.
  const baseFor = (mode) =>
    presetName ? presetNeutrals(presetName, mode) : opts.baseNeutrals?.[mode] ? { ...baseModes[mode], ...opts.baseNeutrals[mode] } : { ...baseModes[mode] };

  const palette = {};
  const neutrals = {};
  const tokens = {};
  let customNeutrals = !!neutralSrc;
  for (const mode of MODES) {
    const n = neutralSrc ? fitStatus(mode, deriveNeutrals(mode, neutralSrc)) : baseFor(mode);
    const accent = deriveAccent(mode, brand, n);
    if (secondarySrc) {
      const s = deriveAccent(mode, secondarySrc, n);
      Object.assign(accent, { secondary: s.primary, secondaryHover: s.primaryHover, secondaryInk: s.primaryInk, onSecondary: s.onPrimary });
    }
    // Neutral roles also sit on accent-tinted backgrounds (canvas, hover and selected tints). A very
    // saturated brand can pull one of those pairs just under the line; nudge the foreground until it passes.
    if (repair(mode, n, accent)) customNeutrals = true;
    palette[mode] = accent;
    neutrals[mode] = n;
    tokens[mode] = resolveTokens(mode, n, accent);
  }
  const failures = Object.fromEntries(MODES.map((mode) => [mode, auditTheme(tokens[mode])]));
  const radius = radiusVars(opts.radius);
  const css = buildCustomThemeCss({ name, palette, neutrals: customNeutrals ? neutrals : null, radius, font: opts.font, secondary: !!secondarySrc });
  return {
    name,
    input: { primary: opts.primary, secondary: opts.secondary, neutral: opts.neutral, preset: presetName ?? undefined, radius: opts.radius, font: opts.font },
    palette,
    tokens,
    css,
    /** Pairs that did not reach WCAG 2.2 AA (always empty for valid input; kept for auditing). */
    failures,
  };
}

function decl(vars) {
  return Object.entries(vars)
    .map(([k, v]) => `  --pl-${k}: ${v};`)
    .join('\n');
}

/** CSS of a custom theme. The theme is a new accent: core's [data-accent] binding picks the mode values. */
function buildCustomThemeCss({ name, palette, neutrals, radius, font, secondary }) {
  const sel = `[data-accent="${name}"]`;
  const root = {};
  for (const mode of MODES) {
    for (const key of [...ACCENT_KEYS, ...(secondary ? SECONDARY_KEYS : [])]) root[`a-${mode}-${kebab(key)}`] = palette[mode][key];
  }
  if (radius) Object.assign(root, radius);
  if (font) root.font = font;
  let css = `/* Pelagic UI custom theme "${name}" — generated by createTheme(). */\n${sel} {\n${decl(root)}\n}\n`;

  const modeVars = (mode) => {
    const v = {};
    if (neutrals) {
      for (const key of NEUTRAL_KEYS) v[kebab(key)] = neutrals[mode][key];
      const pct = softMix.status * 100;
      for (const s of ['success', 'warning', 'danger', 'info']) v[`${s}-soft`] = `color-mix(in srgb, var(--pl-${s}) ${pct}%, var(--pl-surface))`;
      v['surface-raised'] = mode === 'dark' ? 'var(--pl-surface-alt)' : 'var(--pl-surface)';
    }
    if (secondary) {
      for (const key of SECONDARY_KEYS) v[kebab(key)] = `var(--pl-a-${mode}-${kebab(key)})`;
      v['secondary-soft'] = `color-mix(in srgb, var(--pl-secondary) ${Math.round(softMix.primary * 100)}%, var(--pl-surface))`;
    }
    return v;
  };
  if (!neutrals && !secondary) return css;
  const block = (selector, mode) => `${selector} {\n${mode !== 'light' && neutrals ? `  color-scheme: ${mode === 'dark' ? 'dark' : 'light'};\n` : ''}${decl(modeVars(mode))}\n}\n`;
  const system = (mode) => `:root${sel}:not([data-theme]),\n:where(:root:not([data-theme])) ${sel}:not([data-theme])`;
  css += block(sel, 'light');
  css += `@media (prefers-color-scheme: dark) {\n${block(system('dark'), 'dark')}}\n`;
  css += `@media (prefers-contrast: more) {\n${block(system('hc'), 'hc')}}\n`;
  for (const mode of MODES) css += block(`:where([data-theme="${mode}"]) ${sel}:not([data-theme]),\n${sel}[data-theme="${mode}"]`, mode);
  return css;
}

/**
 * Inject a createTheme() result as <style data-theme-custom="name"> and select it on `target`
 * (default <html>; any container works, so a custom theme can be scoped to one part of a page).
 * Returns a function that removes the style element and the attribute again.
 */
export function applyCustomTheme(theme, target = document.documentElement) {
  const doc = target.ownerDocument ?? document;
  let style = doc.head.querySelector(`style[data-theme-custom="${theme.name}"]`);
  if (!style) {
    style = doc.createElement('style');
    style.setAttribute('data-theme-custom', theme.name);
    doc.head.appendChild(style);
  }
  if (style.textContent !== theme.css) style.textContent = theme.css;
  target.setAttribute('data-accent', theme.name);
  return () => {
    style.remove();
    if (target.getAttribute('data-accent') === theme.name) target.removeAttribute('data-accent');
  };
}

/** Remove the injected CSS of a custom theme by name. */
export function removeCustomTheme(name, doc = document) {
  doc.head.querySelector(`style[data-theme-custom="${slug(name)}"]`)?.remove();
}

/** The JS call that recreates a theme, for "copy" buttons and docs. */
export function themeToCode(theme) {
  const entries = Object.entries(theme.input).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const body = [...entries, ['name', theme.name]].map(([k, v]) => `  ${k}: ${typeof v === 'number' ? v : `'${v}'`},`).join('\n');
  return `import { createTheme, applyCustomTheme } from '@pelagic-ui/core/theme';\n\nconst theme = createTheme({\n${body}\n});\napplyCustomTheme(theme); // or applyCustomTheme(theme, someContainer)`;
}

/* ==========================================================================
 * Live theme state, brand colors and the animated theme switch
 * ======================================================================== */

const brandCache = new Map();

/**
 * Build (cached) and apply a WCAG AA theme for a brand color on `target`, fitted to the preset that is
 * active there. Returns the createTheme() result.
 */
export function applyBrandColor(color, target = document.documentElement) {
  const preset = target.getAttribute('data-theme-preset') || undefined;
  const hex = toHex(color);
  const key = `${hex}|${preset ?? ''}`;
  let theme = brandCache.get(key);
  if (!theme) {
    theme = createTheme({ primary: color, name: BRAND_THEME_NAME, preset });
    brandCache.set(key, theme);
    if (brandCache.size > 24) brandCache.delete(brandCache.keys().next().value);
  }
  applyCustomTheme(theme, target);
  const doc = target.ownerDocument ?? document;
  doc.head.querySelector(`style[data-theme-custom="${BRAND_THEME_NAME}"]`)?.setAttribute('data-color', hex);
  return theme;
}

/**
 * The theme currently applied to `target`, read from its attributes:
 * { mode, accent, preset, shape, brand } (mode 'system', accent and brand null when not set, preset 'default').
 */
export function getThemeState(target = typeof document === 'undefined' ? null : document.documentElement) {
  if (!target) return { mode: 'system', accent: null, preset: 'default', shape: 'default', brand: null };
  const accent = target.getAttribute('data-accent');
  const doc = target.ownerDocument ?? document;
  const isBrand = accent === BRAND_THEME_NAME;
  const brand = isBrand ? doc.head?.querySelector(`style[data-theme-custom="${BRAND_THEME_NAME}"]`)?.getAttribute('data-color') ?? null : null;
  return {
    mode: target.getAttribute('data-theme') ?? 'system',
    accent: isBrand ? null : accent,
    preset: target.getAttribute('data-theme-preset') ?? 'default',
    shape: target.getAttribute('data-shape') ?? 'default',
    brand,
  };
}

/** The saved form of a theme state (what loadTheme() returns and the no-flash script restores). */
function toSaved(state, target) {
  const out = { mode: state.mode, accent: state.accent, shape: state.shape, preset: state.preset };
  if (state.brand) {
    const doc = target.ownerDocument ?? document;
    out.accent = BRAND_THEME_NAME;
    out.brand = state.brand;
    out.brandCss = doc.head.querySelector(`style[data-theme-custom="${BRAND_THEME_NAME}"]`)?.textContent ?? undefined;
  }
  return out;
}

/** Apply a saved choice (default: loadTheme()) without animation. Returns the applied state, or null. */
export function restoreTheme(target = document.documentElement, saved = loadTheme()) {
  if (!saved) return null;
  const { brandCss: _css, customCss: _custom, ...choice } = saved;
  if (choice.accent === BRAND_THEME_NAME) delete choice.accent;
  applyTheme(choice, target);
  return getThemeState(target);
}

/** True when theme changes should not animate: data-a11y-motion off or reduce, or the OS asks (unless "full"). */
export function themeMotionReduced(target = document.documentElement) {
  const root = target.ownerDocument?.documentElement ?? target;
  const pref = root.getAttribute('data-a11y-motion');
  if (pref === 'off' || pref === 'reduce' || pref === 'reduced') return true;
  if (pref === 'full' || pref === 'on') return false;
  const win = root.ownerDocument?.defaultView;
  return !!win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Viewport point of an origin: an element (its center), a pointer or mouse event, or { x, y }. */
function originPoint(origin, win) {
  const w = win?.innerWidth ?? 1024;
  const h = win?.innerHeight ?? 768;
  const center = { x: w / 2, y: h / 2 };
  if (!origin) return center;
  // Events from a real pointer carry coordinates; keyboard-activated clicks report 0, 0.
  if (typeof origin.clientX === 'number' && (origin.clientX || origin.clientY)) return { x: origin.clientX, y: origin.clientY };
  const el = origin.currentTarget?.getBoundingClientRect ? origin.currentTarget : origin.target?.getBoundingClientRect ? origin.target : origin;
  if (el?.getBoundingClientRect) {
    // A visually hidden radio (swatches, tiles) has a 1px box: use its label instead.
    const box = el.labels?.[0] ?? el.closest?.('label') ?? el;
    const r = box.getBoundingClientRect();
    if (r.width > 1 || r.height > 1) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if (typeof origin.x === 'number' && typeof origin.y === 'number') return { x: origin.x, y: origin.y };
  return center;
}

/** Point the theme-color meta tag (browser UI color) at the current accent. */
function syncThemeColorMeta(doc) {
  const meta = doc.querySelector('meta[name="theme-color"]:not([media])');
  const win = doc.defaultView;
  if (!meta || !win?.getComputedStyle) return;
  const value = win.getComputedStyle(doc.documentElement).getPropertyValue('--pl-primary').trim();
  if (/^#[0-9a-f]{3,8}$/i.test(value)) meta.setAttribute('content', value);
}

const sameState = (a, b) =>
  a.mode === b.mode && a.accent === b.accent && a.preset === b.preset && a.shape === b.shape && (a.brand ?? null) === (b.brand ?? null);

/** The state after `next` is merged into `before`. Choosing a new preset resets accent and brand to the preset's own. */
function mergeState(before, next) {
  const s = { ...before };
  if (next.mode !== undefined) s.mode = next.mode ?? 'system';
  if (next.shape !== undefined) s.shape = next.shape;
  if (next.preset !== undefined) {
    s.preset = next.preset || 'default';
    if (s.preset !== before.preset && next.accent === undefined && next.brand === undefined) {
      s.accent = null;
      s.brand = null;
    }
  }
  if (next.accent !== undefined) {
    s.accent = next.accent === 'default' ? null : next.accent;
    if (next.brand === undefined) s.brand = null;
  }
  if (next.brand !== undefined) {
    s.brand = next.brand ? toHex(next.brand) : null;
    if (s.brand) s.accent = null;
  }
  return s;
}

let running = null;
const VT_ATTR = 'data-pl-theme-transition';
const VT_VARS = ['--pl-vt-x', '--pl-vt-y', '--pl-vt-r', '--pl-vt-duration'];

/**
 * Change the theme with an animated reveal: a circle that grows from `origin` (the clicked control, a
 * pointer event or { x, y }) until it covers the page, using the View Transitions API. Browsers without the
 * API get a short color crossfade. Nothing animates when the user prefers reduced motion (OS setting, or
 * data-a11y-motion "reduce" / "off"), when `animate` is false, or when `target` is not <html>.
 *
 *   switchTheme({ mode: 'dark' }, { origin: event })
 *   switchTheme({ preset: 'abyss' }, { origin: button })
 *   switchTheme({ brand: '#ff6a00' })
 *
 * `next` takes mode, accent, preset, shape and brand (any CSS color, or null to drop it). The choice is saved
 * (persist: false to skip) and a bubbling `pl-theme-change` event with { state, previous } is dispatched.
 * Returns a promise for the new state that resolves when the animation has finished.
 */
export function switchTheme(next = {}, options = {}) {
  const target = options.target ?? document.documentElement;
  const doc = target.ownerDocument ?? document;
  const win = doc.defaultView;
  const root = doc.documentElement;
  const previous = getThemeState(target);
  const state = mergeState(previous, next ?? {});
  if (sameState(previous, state)) {
    // Nothing to change (e.g. a brand color that was already previewed live): still save when asked to.
    if (options.persist === true) saveTheme(toSaved(previous, target));
    return Promise.resolve(previous);
  }

  const commit = () => {
    applyTheme(
      {
        mode: state.mode,
        preset: state.preset,
        shape: state.shape === previous.shape ? undefined : state.shape,
        ...(state.brand ? { brand: state.brand } : { accent: state.accent, brand: null }),
      },
      target,
    );
    const applied = getThemeState(target);
    if (options.persist !== false) saveTheme(toSaved(applied, target));
    syncThemeColorMeta(doc);
    const Ev = win?.CustomEvent ?? globalThis.CustomEvent;
    if (Ev) target.dispatchEvent(new Ev(THEME_CHANGE_EVENT, { bubbles: true, detail: { state: applied, previous } }));
    return applied;
  };

  if (running) {
    running.skip();
    running = null;
  }
  if (options.animate === false || target !== root || themeMotionReduced(root)) return Promise.resolve(commit());

  const { x, y } = originPoint(options.origin, win);
  const w = win?.innerWidth ?? 1024;
  const h = win?.innerHeight ?? 768;
  const radius = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y)));
  const duration = options.duration ?? Math.round(Math.min(760, Math.max(460, 380 + radius * 0.22)));
  const px = Math.round(x);
  const py = Math.round(y);
  root.style.setProperty('--pl-vt-x', `${px}px`);
  root.style.setProperty('--pl-vt-y', `${py}px`);
  root.style.setProperty('--pl-vt-r', `${radius}px`);
  root.style.setProperty('--pl-vt-duration', `${duration}ms`);
  const cleanup = () => {
    root.removeAttribute(VT_ATTR);
    for (const p of VT_VARS) root.style.removeProperty(p);
  };

  if (typeof doc.startViewTransition === 'function') {
    root.setAttribute(VT_ATTR, 'reveal');
    let applied = previous;
    let vt;
    try {
      vt = doc.startViewTransition(() => {
        applied = commit();
      });
    } catch {
      cleanup();
      return Promise.resolve(commit());
    }
    const handle = { skip: () => vt.skipTransition?.() };
    running = handle;
    vt.ready
      ?.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${px}px ${py}px)`, `circle(${radius}px at ${px}px ${py}px)`] },
          { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
    const done = () => {
      if (running === handle) running = null;
      cleanup();
      return applied;
    };
    return Promise.resolve(vt.finished ?? vt.updateCallbackDone).then(done, done);
  }

  // No View Transitions: a short crossfade of colors (see [data-pl-theme-transition="fade"] in the CSS).
  root.setAttribute(VT_ATTR, 'fade');
  void win?.getComputedStyle?.(root).color; // start the transitions from the current colors
  const applied = commit();
  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (running === handle) running = null;
      cleanup();
      resolve(applied);
    };
    const handle = { skip: finish };
    running = handle;
    const timer = setTimeout(finish, 300);
  });
}

/** Call `listener(state, previous)` after every switchTheme() on `target` (default <html>). Returns an unsubscribe. */
export function onThemeChange(listener, target = document.documentElement) {
  const handler = (e) => listener(e.detail.state, e.detail.previous);
  target.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => target.removeEventListener(THEME_CHANGE_EVENT, handler);
}

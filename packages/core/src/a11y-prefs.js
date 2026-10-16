// Accessibility display preferences: contrast schemes, color-vision filters, text spacing, reading aids,
// motion and interaction aids. Everything is a data-a11y-* attribute on <html> (or any container), styled
// by src/parts/a11y-modes.css, so it works the same for React, Vue, Svelte, Angular, Astro or plain HTML.
// The JS here adds what CSS alone cannot: the SVG color-vision filters, the reading guide / mask that
// follow the pointer and focus, pausing autoplaying media, persistence and OS preference watching.

// The panel also carries the theme (mode, named preset, accent and a live brand color, switched with the
// animated switchTheme) and the interface sound settings, which keep their own modules and storage keys.
import { accents, defaultAccent, modes, presets } from './themes.mjs';
import { THEME_CHANGE_EVENT, getThemeState, switchTheme } from './theme.js';
import { SOUND_CHANGE_EVENT, SOUND_PREFS_EVENT, SOUND_THEMES, getSoundPrefs, hasSoundEngine, setSoundPrefs } from './sound.js';

export const A11Y_STORAGE_KEY = 'pelagic-ui-a11y';

/** Every preference with its default value. */
export const defaultA11yPrefs = Object.freeze({
  /** 'default' | 'hc' | 'yellow-black' | 'black-yellow' | 'white-black' | 'black-white' | 'gray' | 'invert' */
  contrast: 'default',
  /** 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' */
  colorFilter: 'none',
  /** Patterns, dashes and markers in charts in addition to color. */
  patterns: false,
  /** 'low' | 'normal' | 'high' */
  saturation: 'normal',
  /** Text scale, 0.9 – 2 (90 % – 200 %). */
  fontScale: 1,
  /** 'normal' | 'wide' (1.75) | 'wider' (2) */
  lineHeight: 'normal',
  /** 'normal' | 'wide' (0.06em) | 'wider' (0.12em) */
  letterSpacing: 'normal',
  /** 'normal' | 'wide' (0.16em) | 'wider' (0.32em) */
  wordSpacing: 'normal',
  /** 'normal' | 'wide' (1.5em after paragraphs) | 'wider' (2em) */
  paragraphSpacing: 'normal',
  /** Atkinson Hyperlegible, a typeface designed for low-vision readers. */
  readableFont: false,
  /** Align text to the start edge (left in LTR, right in RTL); no justified text. */
  alignStart: false,
  /** 'default' | 'underline' | 'highlight' */
  links: 'default',
  /** 'default' | 'large' */
  focus: 'default',
  /** 'default' | 'large' */
  cursor: 'default',
  readingGuide: false,
  readingMask: false,
  /** 'system' (follow the OS) | 'full' (animate even if the OS asks to reduce) | 'reduce' | 'off' (no animation, no autoplay) */
  motion: 'system',
  hideImages: false,
  /** Every control at least 44 × 44 px. */
  largeTargets: false,
});

export const a11yOptions = Object.freeze({
  contrast: ['default', 'hc', 'yellow-black', 'black-yellow', 'white-black', 'black-white', 'gray', 'invert'],
  colorFilter: ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'],
  saturation: ['low', 'normal', 'high'],
  lineHeight: ['normal', 'wide', 'wider'],
  letterSpacing: ['normal', 'wide', 'wider'],
  wordSpacing: ['normal', 'wide', 'wider'],
  paragraphSpacing: ['normal', 'wide', 'wider'],
  links: ['default', 'underline', 'highlight'],
  focus: ['default', 'large'],
  cursor: ['default', 'large'],
  motion: ['system', 'full', 'reduce', 'off'],
});

/** Values of the theme and sound controls of the panel (stored by theme.js and sound.js, not here). */
export const themePanelOptions = Object.freeze({
  mode: ['system', 'light', 'dark', 'hc'],
  preset: ['default', ...Object.keys(presets)],
  accent: ['default', ...Object.keys(accents)],
  soundTheme: [...SOUND_THEMES],
});

/** Swatch color of each built-in accent (its light-mode fill). */
export const accentSwatches = Object.freeze(Object.fromEntries(Object.keys(accents).map((name) => [name, accents[name].light.primary])));

/** Preview colors of each preset tile: light and dark surface, text and accent. */
export const presetSwatches = Object.freeze(
  Object.fromEntries(
    themePanelOptions.preset.map((name) => {
      const pick = (mode) => {
        const p = name === 'default' ? { ...modes[mode], ...accents[defaultAccent][mode] } : presets[name][mode];
        return { surface: p.surface, alt: p.surfaceAlt, text: p.text, primary: p.primary };
      };
      return [name, { light: pick('light'), dark: pick('dark') }];
    }),
  ),
);

export const FONT_SCALE_MIN = 0.9;
export const FONT_SCALE_MAX = 2;

const BOOLEAN_KEYS = ['patterns', 'readableFont', 'alignStart', 'readingGuide', 'readingMask', 'hideImages', 'largeTargets'];

/** Fill in defaults and drop invalid values (safe for data read from storage or a URL). */
export function normalizeA11yPrefs(prefs = {}) {
  const out = { ...defaultA11yPrefs };
  if (!prefs || typeof prefs !== 'object') return out;
  for (const [key, values] of Object.entries(a11yOptions)) if (values.includes(prefs[key])) out[key] = prefs[key];
  for (const key of BOOLEAN_KEYS) if (typeof prefs[key] === 'boolean') out[key] = prefs[key];
  const scale = Number(prefs.fontScale);
  if (Number.isFinite(scale)) out.fontScale = Math.round(Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale)) * 100) / 100;
  return out;
}

/** True when nothing differs from the defaults. */
export function isDefaultA11yPrefs(prefs) {
  const p = normalizeA11yPrefs(prefs);
  return Object.keys(defaultA11yPrefs).every((k) => p[k] === defaultA11yPrefs[k]);
}

/** Number of preferences that differ from the defaults (for a badge on the trigger button). */
export function countActiveA11yPrefs(prefs) {
  const p = normalizeA11yPrefs(prefs);
  return Object.keys(defaultA11yPrefs).filter((k) => p[k] !== defaultA11yPrefs[k]).length;
}

/**
 * The data-a11y-* attributes for a set of preferences (null = attribute absent). Use it to render the
 * attributes on the server (SSR, Astro) so the first paint already matches the user's choice.
 */
export function a11yPrefsToAttributes(prefs) {
  const p = normalizeA11yPrefs(prefs);
  const pick = (value, off) => (value === off ? null : String(value));
  return {
    'data-a11y-contrast': pick(p.contrast, 'default'),
    'data-a11y-color-filter': pick(p.colorFilter, 'none'),
    'data-a11y-patterns': p.patterns ? '' : null,
    'data-a11y-saturation': pick(p.saturation, 'normal'),
    'data-a11y-font-scale': p.fontScale === 1 ? null : String(p.fontScale),
    'data-a11y-line-height': pick(p.lineHeight, 'normal'),
    'data-a11y-letter-spacing': pick(p.letterSpacing, 'normal'),
    'data-a11y-word-spacing': pick(p.wordSpacing, 'normal'),
    'data-a11y-paragraph-spacing': pick(p.paragraphSpacing, 'normal'),
    'data-a11y-font': p.readableFont ? 'readable' : null,
    'data-a11y-text-align': p.alignStart ? 'start' : null,
    'data-a11y-links': pick(p.links, 'default'),
    'data-a11y-focus': pick(p.focus, 'default'),
    'data-a11y-cursor': pick(p.cursor, 'default'),
    'data-a11y-reading-guide': p.readingGuide ? '' : null,
    'data-a11y-reading-mask': p.readingMask ? '' : null,
    'data-a11y-motion': pick(p.motion, 'system'),
    'data-a11y-images': p.hideImages ? 'hide' : null,
    'data-a11y-targets': p.largeTargets ? 'large' : null,
  };
}

/* ---------- Color-vision filters (inline SVG feColorMatrix) ----------
 * Daltonization: the color information a viewer with the deficiency cannot see (original minus the
 * Machado et al. 2009 simulation) is shifted into channels they can see. Correction = I + Shift·(I − Sim). */
const SIM = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const SHIFT_RG = [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]];
const SHIFT_B = [[1, 0, 0.7], [0, 1, 0.7], [0, 0, 0]];

function correctionMatrix(sim, shift) {
  const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const err = I.map((row, i) => row.map((v, j) => v - sim[i][j]));
  return I.map((row, i) => row.map((v, j) => v + shift[i].reduce((acc, s, k) => acc + s * err[k][j], 0)));
}
const fmt = (m) => m.map((row) => `${row.map((v) => +v.toFixed(4)).join(' ')} 0 0`).join(' ') + ' 0 0 0 1 0';

/** feColorMatrix values per filter (exported for tests and for apps that ship their own SVG). */
export const colorFilterMatrices = Object.freeze({
  protanopia: fmt(correctionMatrix(SIM.protanopia, SHIFT_RG)),
  deuteranopia: fmt(correctionMatrix(SIM.deuteranopia, SHIFT_RG)),
  tritanopia: fmt(correctionMatrix(SIM.tritanopia, SHIFT_B)),
  // No hue is reliable: luminance only, with a little extra contrast (see the CSS for the contrast step).
  achromatopsia: fmt([[0.2126, 0.7152, 0.0722], [0.2126, 0.7152, 0.0722], [0.2126, 0.7152, 0.0722]]),
});

export const COLOR_FILTERS_ID = 'pl-a11y-filters';

/** Insert the SVG with the color-vision filters once per document (referenced as url(#pl-a11y-<name>)). */
export function ensureColorFilters(doc = document) {
  if (doc.getElementById(COLOR_FILTERS_ID)) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = doc.createElementNS(ns, 'svg');
  svg.setAttribute('id', COLOR_FILTERS_ID);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none');
  const defs = doc.createElementNS(ns, 'defs');
  for (const [name, values] of Object.entries(colorFilterMatrices)) {
    const filter = doc.createElementNS(ns, 'filter');
    filter.setAttribute('id', `pl-a11y-${name}`);
    filter.setAttribute('color-interpolation-filters', 'linearRGB');
    const m = doc.createElementNS(ns, 'feColorMatrix');
    m.setAttribute('type', 'matrix');
    m.setAttribute('values', values);
    filter.appendChild(m);
    defs.appendChild(filter);
  }
  svg.appendChild(defs);
  (doc.body ?? doc.documentElement).appendChild(svg);
}

/* ---------- Reading guide and reading mask ---------- */
const aids = new WeakMap();

function readingAids(target, guide, mask) {
  const doc = target.ownerDocument ?? document;
  const win = doc.defaultView;
  let state = aids.get(target);
  if (!guide && !mask) {
    if (state) {
      state.cleanup();
      aids.delete(target);
    }
    return;
  }
  if (!state) {
    const els = {};
    let y = (win?.innerHeight ?? 600) / 2;
    let frame = 0;
    const paint = () => {
      frame = 0;
      for (const el of Object.values(els)) el?.style.setProperty('--pl-a11y-guide-y', `${Math.round(y)}px`);
    };
    const move = (next) => {
      y = next;
      if (!frame) frame = win?.requestAnimationFrame ? win.requestAnimationFrame(paint) : (paint(), 0);
    };
    const onPointer = (e) => move(e.clientY);
    const onFocus = (e) => {
      const r = e.target?.getBoundingClientRect?.();
      if (r && (r.width || r.height)) move(r.top + r.height / 2);
    };
    doc.addEventListener('pointermove', onPointer, { passive: true });
    doc.addEventListener('focusin', onFocus);
    state = {
      els,
      sync: paint,
      cleanup() {
        doc.removeEventListener('pointermove', onPointer);
        doc.removeEventListener('focusin', onFocus);
        if (frame && win?.cancelAnimationFrame) win.cancelAnimationFrame(frame);
        for (const el of Object.values(els)) el?.remove();
      },
    };
    aids.set(target, state);
  }
  for (const [name, on] of [['guide', guide], ['mask', mask]]) {
    if (on && !state.els[name]) {
      const el = doc.createElement('div');
      el.className = `pl-a11y-reading-${name}`;
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('data-pl-a11y-aid', name);
      (doc.body ?? doc.documentElement).appendChild(el);
      state.els[name] = el;
    } else if (!on && state.els[name]) {
      state.els[name].remove();
      delete state.els[name];
    }
  }
  state.sync();
}

/* ---------- Motion: pause autoplaying media ---------- */
const mediaObservers = new WeakMap();

function pauseMedia(root) {
  for (const media of root.querySelectorAll?.('video[autoplay], audio[autoplay], video[data-autoplay]') ?? []) {
    try {
      media.pause();
      media.removeAttribute('autoplay');
      media.setAttribute('data-pl-a11y-paused', '');
    } catch {
      /* jsdom or a detached element */
    }
  }
}

function motionOff(target, off) {
  const existing = mediaObservers.get(target);
  if (!off) {
    existing?.disconnect();
    mediaObservers.delete(target);
    return;
  }
  pauseMedia(target);
  const MO = (target.ownerDocument?.defaultView ?? globalThis).MutationObserver;
  if (!existing && MO) {
    const mo = new MO((records) => {
      for (const r of records) for (const n of r.addedNodes) if (n.nodeType === 1) pauseMedia(n.parentNode ?? n);
    });
    mo.observe(target, { childList: true, subtree: true });
    mediaObservers.set(target, mo);
  }
}

/**
 * Apply preferences to `target` (default <html>): sets the data-a11y-* attributes and
 * --pl-user-font-scale, injects the color-vision SVG filters when needed, starts or stops the reading
 * guide / mask, pauses autoplaying media when motion is off, and dispatches a bubbling
 * `pl-a11y-change` event with the normalized preferences. Returns the normalized preferences.
 */
export function applyA11yPrefs(prefs, target = document.documentElement) {
  const p = normalizeA11yPrefs(prefs);
  for (const [name, value] of Object.entries(a11yPrefsToAttributes(p))) {
    if (value === null) target.removeAttribute(name);
    else target.setAttribute(name, value);
  }
  if (p.fontScale === 1) target.style.removeProperty('--pl-user-font-scale');
  else target.style.setProperty('--pl-user-font-scale', String(p.fontScale));
  const doc = target.ownerDocument ?? document;
  if (p.colorFilter !== 'none') ensureColorFilters(doc);
  readingAids(target, p.readingGuide, p.readingMask);
  motionOff(target, p.motion === 'off');
  const Ev = doc.defaultView?.CustomEvent ?? globalThis.CustomEvent;
  if (Ev) target.dispatchEvent(new Ev('pl-a11y-change', { detail: p, bubbles: true }));
  return p;
}

/** Save preferences. Storage can be unavailable (private mode); failures are ignored. */
export function saveA11yPrefs(prefs, key = A11Y_STORAGE_KEY) {
  try {
    const p = normalizeA11yPrefs(prefs);
    if (isDefaultA11yPrefs(p)) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

/** Read saved preferences (normalized), or the defaults. */
export function loadA11yPrefs(key = A11Y_STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    return normalizeA11yPrefs(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeA11yPrefs({});
  }
}

/** Remove every preference from `target` and from storage. Returns the defaults. */
export function resetA11yPrefs(target = document.documentElement, key = A11Y_STORAGE_KEY) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
  return applyA11yPrefs(defaultA11yPrefs, target);
}

/** Current OS accessibility settings. */
export function getSystemPrefs(win = typeof window === 'undefined' ? undefined : window) {
  const q = (query) => !!win?.matchMedia?.(query).matches;
  return {
    reducedMotion: q('(prefers-reduced-motion: reduce)'),
    contrast: q('(prefers-contrast: more)') ? 'more' : q('(prefers-contrast: less)') ? 'less' : q('(prefers-contrast: custom)') ? 'custom' : 'no-preference',
    colorScheme: q('(prefers-color-scheme: dark)') ? 'dark' : 'light',
    forcedColors: q('(forced-colors: active)'),
    reducedTransparency: q('(prefers-reduced-transparency: reduce)'),
  };
}

/**
 * Call `callback(getSystemPrefs())` now and whenever the OS reduced-motion, contrast, color-scheme,
 * forced-colors or reduced-transparency setting changes. Returns an unsubscribe function.
 */
export function watchSystemPrefs(callback, win = typeof window === 'undefined' ? undefined : window) {
  if (!win?.matchMedia) {
    callback(getSystemPrefs(win));
    return () => {};
  }
  const queries = [
    '(prefers-reduced-motion: reduce)',
    '(prefers-contrast: more)',
    '(prefers-contrast: less)',
    '(prefers-color-scheme: dark)',
    '(forced-colors: active)',
    '(prefers-reduced-transparency: reduce)',
  ].map((q) => win.matchMedia(q));
  const notify = () => callback(getSystemPrefs(win));
  for (const mql of queries) {
    if (mql.addEventListener) mql.addEventListener('change', notify);
    else mql.addListener?.(notify);
  }
  notify();
  return () => {
    for (const mql of queries) {
      if (mql.removeEventListener) mql.removeEventListener('change', notify);
      else mql.removeListener?.(notify);
    }
  };
}

/* ==========================================================================
 * Panel model shared by the React, Vue, Svelte, Angular and Astro AccessibilityPanel
 * ======================================================================== */

/** Groups and controls of the AccessibilityPanel, in display order. */
export const a11yPanelSchema = Object.freeze([
  {
    id: 'appearance',
    controls: [
      { key: 'mode', type: 'segmented', source: 'theme' },
      { key: 'preset', type: 'presets', source: 'theme' },
      { key: 'accent', type: 'swatches', source: 'theme' },
      { key: 'brand', type: 'color', source: 'theme' },
    ],
  },
  {
    id: 'color',
    controls: [
      { key: 'contrast', type: 'tiles' },
      { key: 'colorFilter', type: 'select' },
      { key: 'saturation', type: 'segmented' },
      { key: 'patterns', type: 'switch' },
    ],
  },
  {
    id: 'text',
    controls: [
      { key: 'fontScale', type: 'scale' },
      { key: 'lineHeight', type: 'segmented' },
      { key: 'letterSpacing', type: 'segmented' },
      { key: 'wordSpacing', type: 'segmented' },
      { key: 'paragraphSpacing', type: 'segmented' },
      { key: 'readableFont', type: 'switch' },
      { key: 'alignStart', type: 'switch' },
    ],
  },
  {
    id: 'reading',
    controls: [
      { key: 'links', type: 'segmented' },
      { key: 'readingGuide', type: 'switch' },
      { key: 'readingMask', type: 'switch' },
    ],
  },
  {
    id: 'motion',
    controls: [
      { key: 'motion', type: 'segmented' },
      { key: 'hideImages', type: 'switch' },
    ],
  },
  {
    id: 'interaction',
    controls: [
      { key: 'focus', type: 'switch', on: 'large', off: 'default' },
      { key: 'cursor', type: 'switch', on: 'large', off: 'default' },
      { key: 'largeTargets', type: 'switch' },
    ],
  },
  {
    // Shown when the page has a sound engine (createSoundEngine), or always with `sound: true`.
    id: 'sound',
    controls: [
      { key: 'sound', type: 'switch', source: 'sound' },
      { key: 'soundTheme', type: 'segmented', source: 'sound' },
    ],
  },
]);

/** True for controls whose value lives in theme.js or sound.js rather than in the A11yPrefs object. */
export const isExternalControl = (control) => control?.source === 'theme' || control?.source === 'sound';

/** Background / foreground of the contrast tiles (null = the current theme). */
export const contrastSwatches = Object.freeze({
  default: null,
  hc: ['#ffffff', '#000000'],
  'yellow-black': ['#000000', '#ffff00'],
  'black-yellow': ['#ffff00', '#000000'],
  'white-black': ['#000000', '#ffffff'],
  'black-white': ['#ffffff', '#000000'],
  gray: ['#e6e6e6', '#1a1a1a'],
  invert: ['#1d1d2b', '#f4f4f8'],
});

/** English and Arabic labels of the panel. Pass `labels` to a panel to override any of them. */
export const a11yPanelLabels = Object.freeze({
  en: {
    title: 'Accessibility',
    subtitle: 'Adjust colors, text and motion. Saved on this device.',
    trigger: 'Accessibility settings',
    close: 'Close accessibility settings',
    reset: 'Reset all',
    resetDone: 'All accessibility settings were reset.',
    preview: 'Preview',
    previewTitle: 'The quick brown fox',
    previewBody: 'Readable text, clear links and calm motion make a page usable for everyone.',
    previewLink: 'A sample link',
    previewButton: 'Button',
    previewStatus: 'Saved',
    on: 'on',
    off: 'off',
    active: '{n} active',
    changed: '{label}: {value}',
    themeReset: 'Default colors',
    groups: {
      appearance: 'Theme',
      sound: 'Sound',
      color: 'Contrast & color',
      text: 'Text',
      reading: 'Reading aids',
      motion: 'Motion & media',
      interaction: 'Interaction',
    },
    controls: {
      mode: { label: 'Mode' },
      preset: { label: 'Color theme', hint: 'Complete palettes for page, cards, text and accent. Each meets WCAG AA in light, dark and high contrast.' },
      accent: { label: 'Accent color' },
      brand: { label: 'Your own color', hint: 'Any color works: contrast is tuned to WCAG AA automatically.', clear: 'Remove custom color' },
      sound: { label: 'Interface sounds', hint: 'Short, quiet sounds for clicks, switches and alerts.' },
      soundTheme: { label: 'Sound style' },
      contrast: { label: 'Color scheme', hint: 'Exact token palettes; every pair meets WCAG AA or better.' },
      colorFilter: { label: 'Color vision', hint: 'Shifts colors you cannot tell apart into ones you can.' },
      saturation: { label: 'Saturation' },
      patterns: { label: 'Patterns in charts', hint: 'Adds hatching, dashes and markers next to color.' },
      fontScale: { label: 'Text size', decrease: 'Smaller text', increase: 'Larger text' },
      lineHeight: { label: 'Line height' },
      letterSpacing: { label: 'Letter spacing' },
      wordSpacing: { label: 'Word spacing' },
      paragraphSpacing: { label: 'Paragraph spacing' },
      readableFont: { label: 'Readable font', hint: 'Atkinson Hyperlegible, designed for low-vision readers.' },
      alignStart: { label: 'Align text to start', hint: 'No justified or centered paragraphs.' },
      links: { label: 'Links' },
      readingGuide: { label: 'Reading guide', hint: 'A bar that follows the pointer and keyboard focus.' },
      readingMask: { label: 'Reading mask', hint: 'Dims everything except a band around the pointer.' },
      motion: { label: 'Animation', hint: 'Full keeps animations on even when the device asks to reduce motion.' },
      hideImages: { label: 'Hide decorative images' },
      focus: { label: 'Bigger focus indicator' },
      cursor: { label: 'Big cursor' },
      largeTargets: { label: 'Larger click targets', hint: 'Every control at least 44 × 44 px.' },
    },
    options: {
      contrast: {
        default: 'Theme',
        hc: 'High contrast',
        'yellow-black': 'Yellow on black',
        'black-yellow': 'Black on yellow',
        'white-black': 'White on black',
        'black-white': 'Black on white',
        gray: 'Grayscale',
        invert: 'Inverted',
      },
      colorFilter: { none: 'No filter', protanopia: 'Protanopia (red)', deuteranopia: 'Deuteranopia (green)', tritanopia: 'Tritanopia (blue)', achromatopsia: 'Achromatopsia (no color)' },
      saturation: { low: 'Low', normal: 'Normal', high: 'High' },
      lineHeight: { normal: 'Normal', wide: 'Wide', wider: 'Wider' },
      letterSpacing: { normal: 'Normal', wide: 'Wide', wider: 'Wider' },
      wordSpacing: { normal: 'Normal', wide: 'Wide', wider: 'Wider' },
      paragraphSpacing: { normal: 'Normal', wide: 'Wide', wider: 'Wider' },
      links: { default: 'As designed', underline: 'Underline', highlight: 'Highlight' },
      motion: { system: 'System', full: 'Full', reduce: 'Reduce', off: 'Off' },
      mode: { system: 'System', light: 'Light', dark: 'Dark', hc: 'High contrast' },
      preset: {
        default: 'Pelagic',
        lagoon: 'Lagoon',
        abyss: 'Abyss',
        reef: 'Reef',
        kelp: 'Kelp',
        sage: 'Sage',
        dune: 'Dune',
        aurora: 'Aurora',
        merlot: 'Merlot',
        ink: 'Ink & paper',
        graphite: 'Graphite',
      },
      accent: { default: 'Theme accent', violet: 'Violet', teal: 'Teal', indigo: 'Indigo', rose: 'Rose', amber: 'Amber', emerald: 'Emerald', slate: 'Slate', ocean: 'Ocean', coral: 'Coral' },
      soundTheme: { soft: 'Soft', crisp: 'Crisp', playful: 'Playful', minimal: 'Minimal' },
    },
  },
  ar: {
    title: 'إمكانية الوصول',
    subtitle: 'اضبط الألوان والنص والحركة. تُحفظ على هذا الجهاز.',
    trigger: 'إعدادات إمكانية الوصول',
    close: 'إغلاق إعدادات إمكانية الوصول',
    reset: 'إعادة الضبط',
    resetDone: 'أُعيد ضبط جميع إعدادات إمكانية الوصول.',
    preview: 'معاينة',
    previewTitle: 'نصّ تجريبي للمعاينة',
    previewBody: 'النص المقروء والروابط الواضحة والحركة الهادئة تجعل الصفحة صالحة للجميع.',
    previewLink: 'رابط تجريبي',
    previewButton: 'زر',
    previewStatus: 'تم الحفظ',
    on: 'مفعّل',
    off: 'متوقف',
    active: '{n} مفعّلة',
    changed: '{label}: {value}',
    themeReset: 'الألوان الافتراضية',
    groups: {
      appearance: 'المظهر',
      sound: 'الصوت',
      color: 'التباين والألوان',
      text: 'النص',
      reading: 'مساعدات القراءة',
      motion: 'الحركة والوسائط',
      interaction: 'التفاعل',
    },
    controls: {
      mode: { label: 'الوضع' },
      preset: { label: 'سمة الألوان', hint: 'لوحات كاملة للصفحة والبطاقات والنص ولون التمييز، وكل منها يحقق WCAG AA في الوضع الفاتح والداكن والتباين العالي.' },
      accent: { label: 'لون التمييز' },
      brand: { label: 'لونك الخاص', hint: 'أي لون يصلح: يُضبط التباين تلقائيًا ليحقق WCAG AA.', clear: 'إزالة اللون المخصص' },
      sound: { label: 'أصوات الواجهة', hint: 'أصوات قصيرة وهادئة للنقرات والمفاتيح والتنبيهات.' },
      soundTheme: { label: 'نمط الصوت' },
      contrast: { label: 'نظام الألوان', hint: 'لوحات ألوان دقيقة؛ كل زوج يحقق مستوى WCAG AA أو أعلى.' },
      colorFilter: { label: 'رؤية الألوان', hint: 'ينقل الألوان التي يصعب تمييزها إلى ألوان يمكن تمييزها.' },
      saturation: { label: 'التشبع' },
      patterns: { label: 'أنماط في الرسوم البيانية', hint: 'يضيف تظليلًا وخطوطًا متقطعة وعلامات بجانب اللون.' },
      fontScale: { label: 'حجم النص', decrease: 'تصغير النص', increase: 'تكبير النص' },
      lineHeight: { label: 'ارتفاع السطر' },
      letterSpacing: { label: 'تباعد الأحرف' },
      wordSpacing: { label: 'تباعد الكلمات' },
      paragraphSpacing: { label: 'تباعد الفقرات' },
      readableFont: { label: 'خط سهل القراءة', hint: 'خط Atkinson Hyperlegible المصمم لضعاف البصر.' },
      alignStart: { label: 'محاذاة النص إلى البداية', hint: 'بلا فقرات مضبوطة أو في الوسط.' },
      links: { label: 'الروابط' },
      readingGuide: { label: 'دليل القراءة', hint: 'شريط يتبع المؤشر وتركيز لوحة المفاتيح.' },
      readingMask: { label: 'قناع القراءة', hint: 'يعتّم كل شيء عدا شريطًا حول المؤشر.' },
      motion: { label: 'الحركة', hint: 'خيار «كاملة» يُبقي الحركة مفعّلة حتى لو طلب الجهاز تقليلها.' },
      hideImages: { label: 'إخفاء الصور الزخرفية' },
      focus: { label: 'مؤشر تركيز أكبر' },
      cursor: { label: 'مؤشر فأرة كبير' },
      largeTargets: { label: 'أهداف نقر أكبر', hint: 'كل عنصر تحكم بحجم 44 × 44 بكسل على الأقل.' },
    },
    options: {
      contrast: {
        default: 'الثيم',
        hc: 'تباين عالٍ',
        'yellow-black': 'أصفر على أسود',
        'black-yellow': 'أسود على أصفر',
        'white-black': 'أبيض على أسود',
        'black-white': 'أسود على أبيض',
        gray: 'تدرّج رمادي',
        invert: 'معكوس',
      },
      colorFilter: { none: 'بلا مرشح', protanopia: 'عمى الأحمر', deuteranopia: 'عمى الأخضر', tritanopia: 'عمى الأزرق', achromatopsia: 'عمى الألوان الكلي' },
      saturation: { low: 'منخفض', normal: 'عادي', high: 'مرتفع' },
      lineHeight: { normal: 'عادي', wide: 'واسع', wider: 'أوسع' },
      letterSpacing: { normal: 'عادي', wide: 'واسع', wider: 'أوسع' },
      wordSpacing: { normal: 'عادي', wide: 'واسع', wider: 'أوسع' },
      paragraphSpacing: { normal: 'عادي', wide: 'واسع', wider: 'أوسع' },
      links: { default: 'كما صُممت', underline: 'تسطير', highlight: 'إبراز' },
      motion: { system: 'النظام', full: 'كاملة', reduce: 'تقليل', off: 'إيقاف' },
      mode: { system: 'النظام', light: 'فاتح', dark: 'داكن', hc: 'تباين عالٍ' },
      preset: {
        default: 'بيلاجيك',
        lagoon: 'البحيرة',
        abyss: 'الأعماق',
        reef: 'الشعاب',
        kelp: 'عشب البحر',
        sage: 'المريمية',
        dune: 'الكثبان',
        aurora: 'الشفق',
        merlot: 'العنابي',
        ink: 'حبر وورق',
        graphite: 'الجرافيت',
      },
      accent: { default: 'لون السمة', violet: 'بنفسجي', teal: 'أزرق مخضر', indigo: 'نيلي', rose: 'وردي', amber: 'كهرماني', emerald: 'زمردي', slate: 'أردوازي', ocean: 'محيطي', coral: 'مرجاني' },
      soundTheme: { soft: 'ناعم', crisp: 'واضح', playful: 'مرح', minimal: 'خافت' },
    },
  },
});

/** Merge label overrides (deeply) over the English or Arabic defaults. */
export function getA11yLabels(locale = 'en', overrides) {
  const base = a11yPanelLabels[String(locale).toLowerCase().startsWith('ar') ? 'ar' : 'en'];
  if (!overrides) return base;
  const merge = (a, b) => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b ?? {})) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(a?.[k] ?? {}, v) : v;
    return out;
  };
  return merge(base, overrides);
}

/** Human-readable value of one preference ("Yellow on black", "125%", "on"). */
export function describeA11yValue(labels, key, value) {
  if (key === 'fontScale') return `${Math.round(Number(value) * 100)}%`;
  if (typeof value === 'boolean') return value ? labels.on : labels.off;
  const ctl = a11yPanelSchema.flatMap((g) => g.controls).find((c) => c.key === key);
  if (ctl?.type === 'switch' && ctl.on) return value === ctl.on ? labels.on : labels.off;
  return labels.options?.[key]?.[value] ?? String(value);
}

/** The polite announcement for a change ("Color scheme: Yellow on black"). */
export function announceA11yChange(labels, key, value) {
  return labels.changed.replace('{label}', labels.controls[key]?.label ?? key).replace('{value}', describeA11yValue(labels, key, value));
}

/* ==========================================================================
 * Framework-free AccessibilityPanel: an HTML renderer (SSR, Astro, Angular, Vue, Svelte or plain pages)
 * and a DOM controller. The React package renders the same markup natively.
 * ======================================================================== */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ICON = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

/** Inner markup of the panel's icons (24 × 24, stroke currentColor). */
export const a11yIcons = Object.freeze({
  accessibility: '<circle cx="12" cy="4.25" r="1.75" fill="currentColor" stroke="none"/><path d="M4.5 8.25c2.4.8 4.9 1.2 7.5 1.2s5.1-.4 7.5-1.2"/><path d="M12 9.5v4.25m0 0-2.75 6.75M12 13.75l2.75 6.75"/>',
  color: '<circle cx="12" cy="12" r="8.25"/><path d="M12 3.75v16.5a8.25 8.25 0 0 0 0-16.5z" fill="currentColor" stroke="none"/>',
  text: '<path d="M4 18 8.5 6h1L14 18M5.6 14h6.8M15.5 11.5c.6-.9 1.6-1.4 2.7-1.4 1.6 0 2.8 1 2.8 2.7V18m0-3.4c-.7-.5-1.6-.7-2.6-.7-1.7 0-2.9.9-2.9 2.1s1 2.1 2.4 2.1c1.4 0 2.6-.8 3.1-1.9"/>',
  reading: '<path d="M3 5.5c3-.9 6-.6 9 1.2 3-1.8 6-2.1 9-1.2v13c-3-.9-6-.6-9 1.2-3-1.8-6-2.1-9-1.2z"/><path d="M12 6.7v13"/>',
  motion: '<circle cx="12" cy="12" r="8.25"/><path d="M10 9v6M14 9v6"/>',
  interaction: '<path d="M6 3.5v13.2l3.4-3.2 2.4 5.6 2.5-1.1-2.4-5.5H16.5z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="3.2"/>',
  appearance: '<path d="M12 3.75a8.25 8.25 0 1 0 0 16.5c1.1 0 1.7-.7 1.7-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6h1.9a4.1 4.1 0 0 0 4.1-4.1c0-3.7-3.7-6.8-8.3-6.8z"/><circle cx="7.6" cy="11.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.4" cy="7.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.9" cy="7.9" r="1.1" fill="currentColor" stroke="none"/>',
  sound: '<path d="M4.5 9.5h3l4.5-3.75v12.5L7.5 14.5h-3z"/><path d="M15.5 9.25a4 4 0 0 1 0 5.5M18 7a7.2 7.2 0 0 1 0 10"/>',
});

/** Panel groups to show, in order: `groups` limits them; appearance / sound false drop those groups. */
export function panelGroups(groups, { appearance = true, sound = 'auto' } = {}) {
  const list = groups ? groups.map((g) => a11yPanelSchema.find((s) => s.id === g)).filter(Boolean) : a11yPanelSchema;
  return list.filter((g) => (g.id === 'appearance' ? appearance !== false : g.id === 'sound' ? sound !== false : true));
}

/** Current value of a theme control (accent is null while a brand color is applied). */
export function themeControlValue(state, key) {
  if (key === 'mode') return state.mode ?? 'system';
  if (key === 'preset') return state.preset ?? 'default';
  if (key === 'accent') return state.brand ? null : state.accent ?? 'default';
  if (key === 'brand') return state.brand ?? null;
  return null;
}

let panelSeq = 0;

/**
 * HTML of an AccessibilityPanel (trigger, live region, backdrop and dialog), ready for mountA11yPanel().
 * Options: id, locale ('en' | 'ar'), labels (overrides), trigger ('floating' | 'inline' | 'none'),
 * triggerLabel, preview (default true), groups (ids), prefs (initial state for server rendering), className.
 */
export function renderA11yPanelHTML(options = {}) {
  const { locale, labels: overrides, trigger = 'floating', triggerLabel, preview = true, groups, className, appearance = true, sound = 'auto' } = options;
  panelSeq += 1;
  const id = options.id ?? `pl-a11y-panel-${panelSeq}`;
  const L = getA11yLabels(locale ?? 'en', overrides);
  const p = normalizeA11yPrefs(options.prefs);
  const isAr = !!locale && String(locale).toLowerCase().startsWith('ar');
  const active = countActiveA11yPrefs(p);
  const activeText = L.active.replace('{n}', String(active));
  const shown = panelGroups(groups, { appearance, sound });
  const ts = { ...getThemeState(typeof document === 'undefined' ? null : document.documentElement), ...(options.theme ?? {}) };
  const ss = { ...getSoundPrefs(), ...(options.soundPrefs ?? {}) };

  const external = (ctl) => {
    const { key, type } = ctl;
    const t = L.controls[key];
    const labelId = `${id}-${key}-label`;
    const hintId = t.hint ? `${id}-${key}-hint` : '';
    const hint = t.hint ? `<p id="${hintId}" class="pl-a11y-control__hint">${esc(t.hint)}</p>` : '';
    const describedby = hintId ? ` aria-describedby="${hintId}"` : '';
    const isTheme = ctl.source === 'theme';
    const keyAttr = isTheme ? `data-theme-key="${key}"` : `data-sound-key="${key === 'sound' ? 'enabled' : 'theme'}"`;
    const valueAttr = isTheme ? 'data-theme-value' : 'data-sound-value';
    if (type === 'switch') {
      return `<div class="pl-a11y-control pl-a11y-control--switch"><div class="pl-a11y-control__text"><span id="${labelId}" class="pl-a11y-control__label">${esc(t.label)}</span>${hint}</div><button type="button" role="switch" class="pl-switch" aria-checked="${!!ss.enabled}" aria-labelledby="${labelId}"${describedby} ${keyAttr}></button></div>`;
    }
    if (type === 'color') {
      const value = ts.brand ?? presetSwatches[ts.preset]?.light.primary ?? presetSwatches.default.light.primary;
      return `<div class="pl-a11y-control pl-a11y-brand"><label for="${id}-${key}" id="${labelId}" class="pl-a11y-control__label">${esc(t.label)}</label><div class="pl-a11y-brand__row"><input id="${id}-${key}" type="color" class="pl-a11y-brand__input" value="${esc(value)}"${describedby} ${keyAttr} data-active="${ts.brand ? 'true' : 'false'}"><span class="pl-a11y-brand__hex" dir="ltr" aria-hidden="true" data-brand-hex>${esc(ts.brand ?? '')}</span><button type="button" class="pl-btn pl-btn--ghost pl-btn--sm" data-theme-brand-clear${ts.brand ? '' : ' hidden'}>${esc(t.clear ?? 'Remove')}</button></div>${hint}</div>`;
    }
    const values = isTheme ? themePanelOptions[key] : themePanelOptions.soundTheme;
    const current = isTheme ? themeControlValue(ts, key) : ss.theme;
    const anyChecked = values.includes(current);
    const radios = values
      .map((o, i) => {
        const checked = current === o;
        const focusable = checked || (!anyChecked && i === 0);
        const attrs = `type="button" role="radio" aria-checked="${checked}" tabindex="${focusable ? 0 : -1}" ${valueAttr}="${o}"`;
        const text = esc(L.options[key]?.[o] ?? o);
        if (type === 'presets') {
          const sw = presetSwatches[o];
          const style = `--pl-ps-ls: ${sw.light.surface}; --pl-ps-la: ${sw.light.alt}; --pl-ps-lp: ${sw.light.primary}; --pl-ps-lt: ${sw.light.text}; --pl-ps-ds: ${sw.dark.surface}; --pl-ps-da: ${sw.dark.alt}; --pl-ps-dp: ${sw.dark.primary}; --pl-ps-dt: ${sw.dark.text};`;
          return `<button ${attrs} class="pl-a11y-preset" style="${style}"><span class="pl-a11y-preset__art" aria-hidden="true"><span class="pl-a11y-preset__half pl-a11y-preset__half--light"><i></i><b></b></span><span class="pl-a11y-preset__half pl-a11y-preset__half--dark"><i></i><b></b></span></span><span class="pl-a11y-preset__name">${text}</span><span class="pl-a11y-tile__check" aria-hidden="true">${ICON(a11yIcons.check)}</span></button>`;
        }
        if (type === 'swatches') {
          const color = o === 'default' ? presetSwatches[ts.preset]?.light.primary ?? presetSwatches.default.light.primary : accentSwatches[o];
          return `<button ${attrs} class="pl-a11y-swatch${o === 'default' ? ' pl-a11y-swatch--default' : ''}" aria-label="${text}" title="${text}" style="--pl-swatch: ${color};">${ICON(a11yIcons.check)}</button>`;
        }
        return `<button ${attrs} class="pl-segmented__item">${text}</button>`;
      })
      .join('');
    const cls = type === 'presets' ? 'pl-a11y-presets' : type === 'swatches' ? 'pl-a11y-swatches' : 'pl-segmented';
    const cols = type === 'presets' ? ' data-columns="3"' : '';
    return `<div class="pl-a11y-control"><span id="${labelId}" class="pl-a11y-control__label">${esc(t.label)}</span>${type === 'segmented' ? '' : hint}<div role="radiogroup" aria-labelledby="${labelId}"${describedby} class="${cls}" ${keyAttr}${cols}>${radios}</div>${type === 'segmented' ? hint : ''}</div>`;
  };

  const control = (ctl) => {
    if (isExternalControl(ctl)) return external(ctl);
    const { key, type, on, off } = ctl;
    const t = L.controls[key];
    const labelId = `${id}-${key}-label`;
    const hintId = t.hint ? `${id}-${key}-hint` : '';
    const hint = t.hint ? `<p id="${hintId}" class="pl-a11y-control__hint">${esc(t.hint)}</p>` : '';
    const describedby = hintId ? ` aria-describedby="${hintId}"` : '';
    const value = p[key];
    if (type === 'switch') {
      const checked = on ? value === on : value === true;
      const values = on ? ` data-on="${on}" data-off="${off}"` : '';
      return `<div class="pl-a11y-control pl-a11y-control--switch"><div class="pl-a11y-control__text"><span id="${labelId}" class="pl-a11y-control__label">${esc(t.label)}</span>${hint}</div><button type="button" role="switch" class="pl-switch" aria-checked="${checked}" aria-labelledby="${labelId}"${describedby} data-a11y-key="${key}"${values}></button></div>`;
    }
    if (type === 'select') {
      const opts = a11yOptions[key].map((o) => `<option value="${o}"${o === value ? ' selected' : ''}>${esc(L.options[key]?.[o] ?? o)}</option>`).join('');
      return `<div class="pl-a11y-control"><label for="${id}-${key}" id="${labelId}" class="pl-a11y-control__label">${esc(t.label)}</label><select id="${id}-${key}" class="pl-select"${describedby} data-a11y-key="${key}">${opts}</select>${hint}</div>`;
    }
    if (type === 'scale') {
      const pct = `${Math.round(p.fontScale * 100)}%`;
      const dis = (cond) => (cond ? ' disabled' : '');
      return `<div class="pl-a11y-control"><label for="${id}-${key}" id="${labelId}" class="pl-a11y-control__label">${esc(t.label)}</label><div class="pl-a11y-scale"><button type="button" class="pl-a11y-scale__btn pl-a11y-scale__btn--sm" aria-label="${esc(t.decrease)}" data-a11y-step="-0.1"${dis(p.fontScale <= FONT_SCALE_MIN)}>A</button><input id="${id}-${key}" type="range" class="pl-slider" min="${FONT_SCALE_MIN}" max="${FONT_SCALE_MAX}" step="0.05" value="${p.fontScale}" aria-valuetext="${pct}" data-a11y-key="${key}"><button type="button" class="pl-a11y-scale__btn pl-a11y-scale__btn--lg" aria-label="${esc(t.increase)}" data-a11y-step="0.1"${dis(p.fontScale >= FONT_SCALE_MAX)}>A</button><output for="${id}-${key}" class="pl-a11y-scale__value" aria-hidden="true" data-a11y-output>${pct}</output></div></div>`;
    }
    const radios = a11yOptions[key]
      .map((o) => {
        const checked = value === o;
        const attrs = `type="button" role="radio" aria-checked="${checked}" tabindex="${checked ? 0 : -1}" data-value="${o}"`;
        const text = esc(L.options[key]?.[o] ?? o);
        if (type === 'tiles') {
          const sw = contrastSwatches[o];
          const style = sw ? ` style="--pl-swatch-bg: ${sw[0]}; --pl-swatch-fg: ${sw[1]};"` : '';
          return `<button ${attrs} class="pl-a11y-tile"><span class="pl-a11y-tile__swatch" data-swatch="${o}" aria-hidden="true"${style}><span>Aa</span></span><span>${text}</span><span class="pl-a11y-tile__check" aria-hidden="true">${ICON(a11yIcons.check)}</span></button>`;
        }
        return `<button ${attrs} class="pl-segmented__item">${text}</button>`;
      })
      .join('');
    if (type === 'tiles') {
      return `<div class="pl-a11y-control"><span id="${labelId}" class="pl-a11y-control__label">${esc(t.label)}</span>${hint}<div role="radiogroup" aria-labelledby="${labelId}"${describedby} class="pl-a11y-tiles" data-a11y-key="${key}" data-columns="4">${radios}</div></div>`;
    }
    return `<div class="pl-a11y-control"><span id="${labelId}" class="pl-a11y-control__label">${esc(t.label)}</span><div role="radiogroup" aria-labelledby="${labelId}"${describedby} class="pl-segmented" data-a11y-key="${key}">${radios}</div>${hint}</div>`;
  };

  const previewHtml = preview
    ? `<div class="pl-a11y-preview" aria-hidden="true"><p class="pl-a11y-preview__label">${esc(L.preview)}</p><p class="pl-a11y-preview__title">${esc(L.previewTitle)}</p><p class="pl-a11y-preview__body">${esc(L.previewBody)}</p><div class="pl-a11y-preview__row"><span class="pl-a11y-preview__link">${esc(L.previewLink)}</span><span class="pl-btn pl-btn--primary pl-btn--sm">${esc(L.previewButton)}</span><span class="pl-badge pl-badge--success">${esc(L.previewStatus)}</span></div></div>`
    : '';
  const themeIsDefault = ts.preset === 'default' && !ts.accent && !ts.brand;
  const groupExtra = (g) =>
    g.id === 'appearance' ? `<div class="pl-a11y-group__actions"><button type="button" class="pl-btn pl-btn--ghost pl-btn--sm" data-theme-reset${themeIsDefault ? ' disabled' : ''}>${esc(L.themeReset)}</button></div>` : '';
  const groupAttrs = (g) => (g.id === 'sound' ? ` data-sound-group${sound === 'auto' && !hasSoundEngine() ? ' hidden' : ''}` : '');
  const groupsHtml = shown
    .map((g) => `<section class="pl-a11y-group" aria-labelledby="${id}-${g.id}"${groupAttrs(g)}><h3 id="${id}-${g.id}" class="pl-a11y-group__title">${ICON(a11yIcons[g.id])}${esc(L.groups[g.id])}</h3>${g.controls.map(control).join('')}${groupExtra(g)}</section>`)
    .join('');
  const lang = locale ? ` lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}"` : '';
  const badge = `<span class="pl-a11y-trigger__badge" aria-hidden="true" data-a11y-badge${active ? '' : ' hidden'}>${active}</span>`;
  let triggerHtml = '';
  if (trigger === 'inline') {
    triggerHtml = `<button type="button" class="pl-a11y-trigger pl-a11y-trigger--inline" aria-haspopup="dialog" aria-expanded="false" data-a11y-open>${ICON(a11yIcons.accessibility)}<span>${esc(triggerLabel ?? L.title)}</span><span class="pl-sr-only" data-a11y-active-sr>${active ? ` (${esc(activeText)})` : ''}</span>${badge}</button>`;
  } else if (trigger !== 'none') {
    triggerHtml = `<button type="button" class="pl-a11y-trigger" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(active ? `${L.trigger} (${activeText})` : L.trigger)}" data-a11y-open>${ICON(a11yIcons.accessibility)}${badge}</button>`;
  }
  const header = `<div class="pl-a11y-panel__header"><span class="pl-a11y-panel__icon" aria-hidden="true">${ICON(a11yIcons.accessibility)}</span><div class="pl-a11y-panel__heading"><h2 id="${id}-title" class="pl-a11y-panel__title">${esc(L.title)}</h2><p class="pl-a11y-panel__subtitle">${esc(L.subtitle)}</p></div><button type="button" class="pl-close" aria-label="${esc(L.close)}" data-a11y-close>×</button></div>`;
  const footer = `<div class="pl-a11y-panel__footer"><span class="pl-a11y-panel__count" data-a11y-count>${esc(activeText)}</span><button type="button" class="pl-btn pl-btn--secondary pl-btn--sm" data-a11y-reset${active ? '' : ' disabled'}>${esc(L.reset)}</button></div>`;
  const panelClass = `pl-a11y-panel${className ? ` ${esc(className)}` : ''}`;
  return `<div class="pl-a11y-root" data-pl-a11y-panel="${id}" data-labels="${esc(JSON.stringify(L))}">${triggerHtml}<div role="status" aria-live="polite" class="pl-sr-only" data-a11y-status></div><div class="pl-a11y-backdrop" hidden data-a11y-backdrop></div><div id="${id}" class="${panelClass}" data-labelledby="${id}-title" tabindex="-1" hidden${lang}>${header}<div class="pl-a11y-panel__body">${previewHtml}${groupsHtml}</div>${footer}</div></div>`;
}

const FOCUSABLE_IN_PANEL = 'button:not(:disabled):not([tabindex="-1"]), select:not(:disabled), input:not(:disabled), [tabindex="0"]';

/**
 * Wire up AccessibilityPanel markup from renderA11yPanelHTML() (or identical template markup).
 * Options: target (element or () => element, default <html>), persist (true | storage key | false),
 * value (initial prefs; saved ones win while persist is on), onChange(prefs, change), onOpenChange(open),
 * portal (move the dialog to <body>; default true, because fixed panels must escape filtered or
 * backdrop-filtered ancestors such as sticky headers).
 * Returns { open, close, toggle, isOpen, get, set(key, value), setAll(prefs), reset, destroy }.
 */
export function mountA11yPanel(root, options = {}) {
  const doc = root.ownerDocument ?? document;
  const win = doc.defaultView ?? globalThis;
  const { persist = true, onChange, onOpenChange, portal = true } = options;
  const storageKey = persist === false ? null : typeof persist === 'string' ? persist : A11Y_STORAGE_KEY;
  const target = () => (typeof options.target === 'function' ? options.target() : options.target) ?? doc.documentElement;
  const panel = root.querySelector('.pl-a11y-panel');
  const backdrop = root.querySelector('[data-a11y-backdrop]');
  const trigger = root.querySelector('[data-a11y-open]');
  const status = root.querySelector('[data-a11y-status]');
  let labels = null;
  try {
    labels = JSON.parse(root.getAttribute('data-labels') || 'null');
  } catch {
    labels = null;
  }
  labels = labels ?? getA11yLabels('en');
  if (portal) {
    doc.body.appendChild(backdrop);
    doc.body.appendChild(panel);
  }
  const saved = storageKey ? Object.fromEntries(Object.entries(loadA11yPrefs(storageKey)).filter(([k, v]) => v !== defaultA11yPrefs[k])) : {};
  let prefs = normalizeA11yPrefs({ ...(options.value ?? {}), ...saved });
  let openState = false;
  let previous = null;
  let unlockScroll = null;

  const themeRoot = options.themeTarget ?? doc.documentElement;

  /** Check the radio whose value attribute equals `value` (roving tabindex; the first one when none matches). */
  const checkRadios = (group, attr, value) => {
    const radios = [...group.querySelectorAll('[role="radio"]')];
    const any = radios.some((r) => r.getAttribute(attr) === String(value));
    radios.forEach((r, i) => {
      const on = r.getAttribute(attr) === String(value);
      r.setAttribute('aria-checked', String(on));
      r.tabIndex = on || (!any && i === 0) ? 0 : -1;
    });
  };

  const renderTheme = () => {
    const ts = getThemeState(themeRoot);
    for (const el of panel.querySelectorAll('[data-theme-key]')) {
      const key = el.getAttribute('data-theme-key');
      if (el.getAttribute('role') === 'radiogroup') checkRadios(el, 'data-theme-value', themeControlValue(ts, key));
      else if (el.type === 'color') {
        const fallback = presetSwatches[ts.preset]?.light.primary ?? presetSwatches.default.light.primary;
        if (doc.activeElement !== el) el.value = ts.brand ?? fallback;
        el.setAttribute('data-active', String(!!ts.brand));
      }
    }
    // The "theme accent" swatch shows the accent of the active preset.
    const def = panel.querySelector('[data-theme-key="accent"] [data-theme-value="default"]');
    def?.style.setProperty('--pl-swatch', presetSwatches[ts.preset]?.light.primary ?? presetSwatches.default.light.primary);
    const hex = panel.querySelector('[data-brand-hex]');
    if (hex) hex.textContent = ts.brand ?? '';
    const clear = panel.querySelector('[data-theme-brand-clear]');
    if (clear) clear.hidden = !ts.brand;
    const themeReset = panel.querySelector('[data-theme-reset]');
    if (themeReset) themeReset.disabled = ts.preset === 'default' && !ts.accent && !ts.brand;
  };

  const renderSound = () => {
    const group = panel.querySelector('[data-sound-group]');
    if (!group) return;
    if (options.sound !== true && hasSoundEngine()) group.hidden = false;
    const sp = getSoundPrefs();
    const sw = group.querySelector('[data-sound-key="enabled"]');
    sw?.setAttribute('aria-checked', String(!!sp.enabled));
    const styles = group.querySelector('[data-sound-key="theme"]');
    if (styles) checkRadios(styles, 'data-sound-value', sp.theme);
  };

  const render = () => {
    for (const el of panel.querySelectorAll('[data-a11y-key]')) {
      const key = el.getAttribute('data-a11y-key');
      const value = prefs[key];
      if (el.getAttribute('role') === 'radiogroup') {
        for (const r of el.querySelectorAll('[role="radio"]')) {
          const on = r.getAttribute('data-value') === String(value);
          r.setAttribute('aria-checked', String(on));
          r.tabIndex = on ? 0 : -1;
        }
      } else if (el.getAttribute('role') === 'switch') {
        const onValue = el.getAttribute('data-on');
        el.setAttribute('aria-checked', String(onValue ? value === onValue : value === true));
      } else if (el.tagName === 'SELECT') {
        el.value = String(value);
      } else if (el.type === 'range') {
        el.value = String(value);
        el.setAttribute('aria-valuetext', `${Math.round(value * 100)}%`);
      }
    }
    const out = panel.querySelector('[data-a11y-output]');
    if (out) out.textContent = `${Math.round(prefs.fontScale * 100)}%`;
    for (const b of panel.querySelectorAll('[data-a11y-step]')) {
      b.disabled = Number(b.getAttribute('data-a11y-step')) < 0 ? prefs.fontScale <= FONT_SCALE_MIN : prefs.fontScale >= FONT_SCALE_MAX;
    }
    const n = countActiveA11yPrefs(prefs);
    const activeText = labels.active.replace('{n}', String(n));
    const count = panel.querySelector('[data-a11y-count]');
    if (count) count.textContent = activeText;
    const reset = panel.querySelector('[data-a11y-reset]');
    if (reset) reset.disabled = n === 0;
    const badge = root.querySelector('[data-a11y-badge]');
    if (badge) {
      badge.textContent = String(n);
      badge.hidden = n === 0;
    }
    const sr = root.querySelector('[data-a11y-active-sr]');
    if (sr) sr.textContent = n ? ` (${activeText})` : '';
    if (trigger && !trigger.classList.contains('pl-a11y-trigger--inline')) trigger.setAttribute('aria-label', n ? `${labels.trigger} (${activeText})` : labels.trigger);
    renderTheme();
    renderSound();
  };

  const commit = (next, change) => {
    prefs = normalizeA11yPrefs(next);
    applyA11yPrefs(prefs, target());
    if (storageKey) saveA11yPrefs(prefs, storageKey);
    render();
    onChange?.(prefs, change);
    root.dispatchEvent(new win.CustomEvent('pl-change', { bubbles: true, detail: { prefs, change } }));
  };
  const announce = (text) => {
    if (!status) return;
    status.textContent = text;
  };
  const set = (key, value) => {
    commit({ ...prefs, [key]: value }, { key, value });
    announce(announceA11yChange(labels, key, prefs[key]));
  };
  const reset = () => {
    commit({ ...defaultA11yPrefs }, { key: 'reset', value: null });
    announce(labels.resetDone);
  };

  /* ---- theme and sound controls ---- */
  const setTheme = (key, value, origin, extra = {}) => {
    // Explicit keys (not a computed `{ [key]: value }`): every bundler keeps them, so the panel always
    // sends exactly the choice the user made.
    const next =
      key === 'reset'
        ? { preset: 'default', accent: null, brand: null }
        : key === 'mode'
          ? { mode: value }
          : key === 'preset'
            ? { preset: value }
            : key === 'accent'
              ? { accent: value }
              : { brand: value };
    const done = switchTheme(next, { origin, target: themeRoot, ...extra });
    renderTheme();
    if (extra.persist !== false && key !== 'reset') announce(announceA11yChange(labels, key, value ?? labels.off));
    else if (key === 'reset') announce(`${labels.themeReset}`);
    return done;
  };
  const setSound = (patch) => {
    setSoundPrefs(patch);
    renderSound();
    if ('enabled' in patch) announce(announceA11yChange(labels, 'sound', patch.enabled));
    else if ('theme' in patch) announce(announceA11yChange(labels, 'soundTheme', patch.theme));
  };
  let brandFrame = 0;
  let pendingBrand = null;
  const previewBrand = (value) => {
    pendingBrand = value;
    if (brandFrame) return;
    const raf = win.requestAnimationFrame ?? ((fn) => setTimeout(fn, 16));
    brandFrame = raf(() => {
      brandFrame = 0;
      switchTheme({ brand: pendingBrand }, { target: themeRoot, animate: false, persist: false });
      renderTheme();
    });
  };

  const focusables = () => [...panel.querySelectorAll(FOCUSABLE_IN_PANEL)];
  const close = () => {
    if (!openState) return;
    openState = false;
    unlockScroll?.();
    unlockScroll = null;
    backdrop.hidden = true;
    panel.hidden = true;
    // A closed panel is not a dialog: no hidden role="dialog" lingers in the page for assistive tech or tests.
    for (const a of ['role', 'aria-modal', 'aria-labelledby']) panel.removeAttribute(a);
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.removeAttribute('aria-controls');
    (trigger ?? previous)?.focus?.();
    onOpenChange?.(false);
  };
  const open = () => {
    if (openState) return;
    openState = true;
    previous = doc.activeElement;
    // Modal like Dialog and Drawer: the page behind does not scroll while the panel is open.
    const body = doc.body;
    const before = body.style.overflow;
    body.style.overflow = 'hidden';
    unlockScroll = () => (body.style.overflow = before);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', panel.getAttribute('data-labelledby'));
    renderTheme();
    renderSound();
    backdrop.hidden = false;
    panel.hidden = false;
    trigger?.setAttribute('aria-expanded', 'true');
    trigger?.setAttribute('aria-controls', panel.id);
    panel.focus();
    onOpenChange?.(true);
  };
  const onDocKey = (e) => {
    if (!openState) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusables().filter((el) => !el.closest('[hidden]'));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = doc.activeElement;
    if (!panel.contains(active) || active === panel) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };
  /** Select a radio of any panel group (preference, theme or sound). */
  const choose = (radio) => {
    const group = radio.closest('[role="radiogroup"]');
    if (group.hasAttribute('data-theme-key')) setTheme(group.getAttribute('data-theme-key'), radio.getAttribute('data-theme-value'), radio);
    else if (group.hasAttribute('data-sound-key')) setSound({ theme: radio.getAttribute('data-sound-value') });
    else set(group.getAttribute('data-a11y-key'), radio.getAttribute('data-value'));
  };
  const onClick = (e) => {
    const el = e.target.closest?.('button');
    if (!el || !panel.contains(el) || el.disabled) return;
    if (el.hasAttribute('data-a11y-close')) close();
    else if (el.hasAttribute('data-a11y-reset')) reset();
    else if (el.hasAttribute('data-theme-reset')) setTheme('reset', null, el);
    else if (el.hasAttribute('data-theme-brand-clear')) setTheme('brand', null, el);
    else if (el.hasAttribute('data-sound-key')) setSound({ enabled: !getSoundPrefs().enabled });
    else if (el.hasAttribute('data-a11y-step')) {
      const v = prefs.fontScale + Number(el.getAttribute('data-a11y-step'));
      set('fontScale', Math.round(Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, v)) * 100) / 100);
    } else if (el.getAttribute('role') === 'switch') {
      const key = el.getAttribute('data-a11y-key');
      const onValue = el.getAttribute('data-on');
      set(key, onValue ? (prefs[key] === onValue ? el.getAttribute('data-off') : onValue) : !prefs[key]);
    } else if (el.getAttribute('role') === 'radio') {
      // Keyboard activation (Enter / Space) reports no pointer position: the reveal starts at the control.
      choose(el);
    }
  };
  const onChangeEvent = (e) => {
    const key = e.target.getAttribute?.('data-a11y-key');
    if (key && e.target.tagName === 'SELECT') set(key, e.target.value);
    else if (e.target.type === 'color' && e.target.hasAttribute('data-theme-key')) {
      // The final pick is saved and announced (the live preview while dragging is not).
      pendingBrand = null;
      setTheme('brand', e.target.value, e.target, { animate: false, persist: true });
    }
  };
  const onRange = (e) => {
    const key = e.target.getAttribute?.('data-a11y-key');
    if (key && e.target.type === 'range') set(key, Number(e.target.value));
    else if (e.target.type === 'color' && e.target.hasAttribute('data-theme-key')) previewBrand(e.target.value);
  };
  const onKeyDown = (e) => {
    const radio = e.target.closest?.('[role="radio"]');
    if (!radio) return;
    const group = radio.closest('[role="radiogroup"]');
    const radios = [...group.querySelectorAll('[role="radio"]')];
    const cols = Number(group.getAttribute('data-columns')) || radios.length;
    const rtl = win.getComputedStyle?.(group).direction === 'rtl';
    const vertical = cols < radios.length ? cols : 1;
    const moves = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: vertical, ArrowUp: -vertical };
    const i = radios.indexOf(radio);
    let next;
    if (e.key in moves) next = (i + moves[e.key] + radios.length) % radios.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = radios.length - 1;
    else return;
    e.preventDefault();
    choose(radios[next]);
    radios[next].focus();
  };
  const toggle = () => (openState ? close() : open());
  const onThemeChange = () => renderTheme();
  const onSoundChange = () => renderSound();

  panel.addEventListener('click', onClick);
  panel.addEventListener('change', onChangeEvent);
  panel.addEventListener('input', onRange);
  panel.addEventListener('keydown', onKeyDown);
  backdrop.addEventListener('mousedown', close);
  trigger?.addEventListener('click', toggle);
  doc.addEventListener('keydown', onDocKey, true);
  themeRoot.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
  win.addEventListener?.(SOUND_CHANGE_EVENT, onSoundChange);
  win.addEventListener?.(SOUND_PREFS_EVENT, onSoundChange);

  applyA11yPrefs(prefs, target());
  render();

  return {
    open,
    close,
    toggle,
    isOpen: () => openState,
    get: () => prefs,
    set,
    setAll(next) {
      prefs = normalizeA11yPrefs(next);
      applyA11yPrefs(prefs, target());
      render();
    },
    reset,
    destroy() {
      close();
      panel.removeEventListener('click', onClick);
      panel.removeEventListener('change', onChangeEvent);
      panel.removeEventListener('input', onRange);
      panel.removeEventListener('keydown', onKeyDown);
      backdrop.removeEventListener('mousedown', close);
      trigger?.removeEventListener('click', toggle);
      doc.removeEventListener('keydown', onDocKey, true);
      themeRoot.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
      win.removeEventListener?.(SOUND_CHANGE_EVENT, onSoundChange);
      win.removeEventListener?.(SOUND_PREFS_EVENT, onSoundChange);
      if (portal) {
        root.appendChild(backdrop);
        root.appendChild(panel);
      }
    },
  };
}

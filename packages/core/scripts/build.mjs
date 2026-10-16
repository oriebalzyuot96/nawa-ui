// Generates pelagic.css and tokens.ts from src/themes.mjs. Run: node scripts/build.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Brand accents: --brand "#ff6a00" [--brand-name acme] [--neutral …] [--secondary …] [--brand-default],
// or --config pelagic.config.json (see scripts/brand.mjs).
import { accents, contrastSchemes, defaultAccent as coreDefaultAccent, defaultShape, modes, presets, shapes, softMix, tint } from '../src/themes.mjs';
import { mixHex } from '../src/theme.js';
import { buildBrands, readBrandConfig } from './brand.mjs';
import { accentNames as coreAccentNames, modeNames, presetNames, resolvePresetTheme, resolveTheme } from './resolve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brands = buildBrands(readBrandConfig());
const accentNames = [...coreAccentNames, ...brands.map((b) => b.theme.name).filter((n) => !coreAccentNames.includes(n))];
const defaultBrand = brands.find((b) => b.isDefault)?.theme;
const defaultAccent = defaultBrand?.name ?? coreDefaultAccent;
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const block = (selector, vars) =>
  `${selector} {\n${Object.entries(vars).map(([k, v]) => `  --pl-${kebab(k)}: ${v};`).join('\n')}\n}\n`;

// Accent palettes: every accent carries its light, dark and hc values as --pl-a-<mode>-<key>.
function accentVars(accent) {
  const vars = {};
  for (const mode of modeNames) {
    for (const [key, value] of Object.entries(accents[accent][mode])) vars[`a-${mode}-${kebab(key)}`] = value;
  }
  return vars;
}

/**
 * Accessibility color schemes (data-a11y-contrast). Every token is !important so the user's choice wins
 * over any theme, accent or custom theme, on the element and on nested [data-theme] / [data-accent] scopes.
 */
function schemeVars(s) {
  return {
    surface: s.surface,
    surfaceAlt: s.surfaceAlt,
    surfaceMuted: s.surfaceMuted,
    text: s.text,
    textMuted: s.textMuted,
    border: s.border,
    controlBorder: s.controlBorder,
    success: s.success,
    warning: s.warning,
    danger: s.danger,
    info: s.info,
    onDanger: s.onDanger,
    overlay: s.overlay,
    primary: s.primary,
    primaryHover: s.primaryHover,
    primaryInk: s.primaryInk,
    onPrimary: s.onPrimary,
    secondary: s.primary,
    secondaryHover: s.primaryHover,
    secondaryInk: s.primaryInk,
    onSecondary: s.onPrimary,
    focus: s.primary,
    primarySoft: mixHex(s.primary, s.surface, softMix.primary),
    successSoft: mixHex(s.success, s.surface, softMix.status),
    warningSoft: mixHex(s.warning, s.surface, softMix.status),
    dangerSoft: mixHex(s.danger, s.surface, softMix.status),
    infoSoft: mixHex(s.info, s.surface, softMix.status),
    tintHover: mixHex(s.primary, s.surface, tint.hover),
    tintPress: mixHex(s.primary, s.surface, tint.press),
    canvas: mixHex(s.primary, s.surfaceAlt, tint.canvas),
    borderSubtle: mixHex(s.primary, s.border, tint.border),
    borderStrong: mixHex(s.controlBorder, s.border, 0.55),
    ring: `color-mix(in srgb, ${s.primary} 30%, transparent)`,
    surfaceRaised: s.colorScheme === 'dark' ? s.surfaceAlt : s.surface,
    highlight: 'transparent',
  };
}
const importantBlock = (selectors, vars, colorScheme) =>
  `${selectors.join(',\n')} {\n  color-scheme: ${colorScheme} !important;\n${Object.entries(vars)
    .map(([k, v]) => `  --pl-${kebab(k)}: ${v} !important;`)
    .join('\n')}\n}\n`;
const NESTED = ':is([data-theme], [data-accent])';
function schemeCss() {
  let out = '/* ---------- Accessibility color schemes (data-a11y-contrast), verified by check-contrast ---------- */\n';
  for (const [name, s] of Object.entries(contrastSchemes)) {
    if (name === 'gray-dark') continue;
    const sel = `[data-a11y-contrast="${name}"]`;
    out += importantBlock([sel, `${sel} ${NESTED}`], schemeVars(s), s.colorScheme);
  }
  // Grayscale follows the page mode: dark greys under data-theme="dark" or the OS dark setting.
  const gd = contrastSchemes['gray-dark'];
  const g = '[data-a11y-contrast="gray"]';
  out += importantBlock(
    [`${g}[data-theme="dark"]`, `${g}[data-theme="dark"] ${NESTED}`, `[data-theme="dark"] ${g}`, `[data-theme="dark"] ${g} ${NESTED}`, `${g} [data-theme="dark"]`],
    schemeVars(gd),
    'dark',
  );
  out += `@media (prefers-color-scheme: dark) {\n${importantBlock(
    [`:root:not([data-theme])${g}`, `:root:not([data-theme])${g} [data-accent]:not([data-theme])`, `:root:not([data-theme]) ${g}:not([data-theme])`],
    schemeVars(gd),
    'dark',
  )}}\n`;
  // Invert (filter in a11y-modes.css) always inverts the light tokens, or the hc tokens under data-theme="hc":
  // an inverted dark theme would be a washed-out light page. check-contrast verifies the inverted colors.
  const inv = '[data-a11y-contrast="invert"]';
  const pinned = (mode) => ({ ...modeVars(mode), ...bindingVars(mode) });
  // data-a11y-contrast="hc": the built-in high-contrast tokens for the current accent, whatever data-theme says.
  const hc = '[data-a11y-contrast="hc"]';
  out += importantBlock([hc, `${hc} ${NESTED}`], pinned('hc'), 'light');
  out += importantBlock([inv, `${inv} ${NESTED}`], pinned('light'), 'light');
  out += importantBlock([`${inv}[data-theme="hc"]`, `${inv}[data-theme="hc"] ${NESTED}`, `[data-theme="hc"] ${inv}`, `[data-theme="hc"] ${inv} ${NESTED}`], pinned('hc'), 'light');
  return out;
}

// Binding: pick the accent values for the current mode.
function bindingVars(mode) {
  const vars = {};
  for (const key of ['primary', 'primaryHover', 'primaryInk', 'onPrimary']) vars[key] = `var(--pl-a-${mode}-${kebab(key)})`;
  vars.primarySoft = `color-mix(in srgb, var(--pl-primary) ${softMix.primary * 100}%, var(--pl-surface))`;
  vars.focus = 'var(--pl-primary)';
  // Accent-tinted roles of the Pelagic design language (see DESIGN.md). They live in the binding blocks
  // so nested data-theme / data-accent scopes recompute them. Same math as scripts/resolve.mjs.
  vars.tintHover = `color-mix(in srgb, var(--pl-primary) ${tint.hover * 100}%, var(--pl-surface))`;
  vars.tintPress = `color-mix(in srgb, var(--pl-primary) ${tint.press * 100}%, var(--pl-surface))`;
  vars.canvas = `color-mix(in srgb, var(--pl-primary) ${tint.canvas * 100}%, var(--pl-surface-alt))`;
  vars.borderSubtle = `color-mix(in srgb, var(--pl-primary) ${tint.border * 100}%, var(--pl-border))`;
  vars.borderStrong = 'color-mix(in srgb, var(--pl-control-border) 55%, var(--pl-border))';
  vars.ring = 'color-mix(in srgb, var(--pl-focus) 24%, transparent)';
  return vars;
}

/** Elevation scale: soft, multi-layer shadows. Dark mode needs denser shadows to read at all. */
function shadows(mode) {
  const c = modes[mode].shadowRgb;
  const k = mode === 'dark' ? 3.2 : 1;
  const a = (v) => Math.min(0.9, +(v * k).toFixed(3));
  return {
    shadowXs: `0 1px 1px rgba(${c}, ${a(0.04)}), 0 1px 2px rgba(${c}, ${a(0.05)})`,
    shadowSm: `0 1px 2px rgba(${c}, ${a(0.05)}), 0 2px 6px -2px rgba(${c}, ${a(0.08)})`,
    shadowMd: `0 2px 4px -2px rgba(${c}, ${a(0.06)}), 0 10px 24px -8px rgba(${c}, ${a(0.16)})`,
    shadowLg: `0 4px 8px -4px rgba(${c}, ${a(0.08)}), 0 24px 48px -16px rgba(${c}, ${a(0.22)})`,
    shadowXl: `0 8px 16px -8px rgba(${c}, ${a(0.1)}), 0 40px 80px -24px rgba(${c}, ${a(0.26)})`,
    /** 1px inner top highlight that makes raised surfaces read as layered. */
    highlight: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : mode === 'hc' ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
  };
}

function modeVars(mode) {
  const m = modes[mode];
  const pct = softMix.status * 100;
  return {
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
    successSoft: `color-mix(in srgb, var(--pl-success) ${pct}%, var(--pl-surface))`,
    warningSoft: `color-mix(in srgb, var(--pl-warning) ${pct}%, var(--pl-surface))`,
    dangerSoft: `color-mix(in srgb, var(--pl-danger) ${pct}%, var(--pl-surface))`,
    infoSoft: `color-mix(in srgb, var(--pl-info) ${pct}%, var(--pl-surface))`,
    overlay: m.overlay,
    /** Floating layers (menus, popovers, dialogs): lifted one step above the page in dark mode. */
    surfaceRaised: mode === 'dark' ? 'var(--pl-surface-alt)' : 'var(--pl-surface)',
    ...shadows(mode),
  };
}

const shapeVars = (name) => {
  const s = shapes[name];
  return {
    radiusXs: `${Math.max(2, Math.round(s.sm / 2))}px`,
    radiusSm: `${s.sm}px`,
    radius: `${s.md}px`,
    radiusLg: `${s.lg}px`,
    radiusXl: `${s.lg + Math.round(s.lg / 3)}px`,
  };
};

/** Custom brand accents baked in with --brand / pelagic.config.json (same CSS as createTheme()). */
function brandCss() {
  if (!brands.length) return '';
  const parts = brands.map(({ theme, isDefault }) =>
    isDefault ? theme.css.replace(`[data-accent="${theme.name}"] {`, `:root, [data-accent="${theme.name}"] {`) : theme.css,
  );
  return `/* ---------- Brand accents ---------- */\n${parts.join('')}\n`;
}

/**
 * Named theme presets (data-theme-preset). Each one overrides the raw neutrals of light and dark (the soft
 * tints, raised surface and shadows are derived from them by the mode blocks) and supplies its own accent
 * unless the element also has an explicit data-accent. High contrast keeps the hc neutrals.
 */
const PRESET_NEUTRALS = ['surface', 'surfaceAlt', 'surfaceMuted', 'text', 'textMuted', 'border', 'controlBorder', 'success', 'warning', 'danger', 'info', 'onDanger'];
const PRESET_ACCENT_KEYS = ['primary', 'primaryHover', 'primaryInk', 'onPrimary'];
function presetCss() {
  let out = '/* ---------- Theme presets (data-theme-preset), verified by check-contrast ---------- */\n';
  const neutralsOf = (name, mode) => {
    const src = mode === 'hc' ? modes.hc : presets[name][mode];
    return Object.fromEntries(PRESET_NEUTRALS.map((k) => [k, src[k]]));
  };
  const withScheme = (b, scheme) => b.replace('{\n', `{\n  color-scheme: ${scheme};\n`);
  for (const name of presetNames) {
    const sel = `[data-theme-preset="${name}"]`;
    out += withScheme(block(`${sel}:not([data-theme="dark"], [data-theme="hc"])`, neutralsOf(name, 'light')), 'light');
    out += withScheme(block(`${sel}[data-theme="dark"]`, neutralsOf(name, 'dark')), 'dark');
    const accentVars = {};
    for (const mode of modeNames) for (const k of PRESET_ACCENT_KEYS) accentVars[`a-${mode}-${kebab(k)}`] = presets[name][mode][k];
    out += block(`${sel}:not([data-accent])`, accentVars);
  }
  // The OS settings apply when no data-theme is set: these are more specific than the light block above.
  out += `@media (prefers-color-scheme: dark) {\n${presetNames.map((n) => withScheme(block(`:root[data-theme-preset="${n}"]:not([data-theme])`, neutralsOf(n, 'dark')), 'dark')).join('')}}\n`;
  out += `@media (prefers-contrast: more) {\n${presetNames.map((n) => withScheme(block(`:root[data-theme-preset="${n}"]:not([data-theme])`, neutralsOf(n, 'hc')), 'light')).join('')}}\n`;
  return out;
}

/**
 * data-a11y-motion="full": the user asked for animation even though the OS asks to reduce motion. Every
 * selector inside a `@media (prefers-reduced-motion: reduce)` block is scoped to
 * `:root:not([data-a11y-motion="full"])`, so the reduced rules step aside only for that explicit choice.
 */
function scopeReducedMotion(text) {
  const marker = '@media (prefers-reduced-motion: reduce)';
  const guard = ':not([data-a11y-motion="full"])';
  const prefix = (sel) => {
    const t = sel.trim();
    if (!t) return sel;
    if (t.startsWith(':root')) return t.replace(':root', `:root${guard}`);
    if (/^html\b/.test(t)) return t.replace('html', `html${guard}`);
    return `:root${guard} ${t}`;
  };
  // Split a selector list on top-level commas only (not inside :is(), :not(), :where()).
  const splitTop = (list) => {
    const parts = [];
    let depth = 0;
    let cur = '';
    for (const ch of list) {
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      if (ch === ',' && depth === 0) {
        parts.push(cur);
        cur = '';
      } else cur += ch;
    }
    parts.push(cur);
    return parts;
  };
  const strip = (x) => x.replace(/\/\*[\s\S]*?\*\//g, '');
  // Rewrite the selectors of the rules in a block body (nested at-rules are walked, keyframes left alone).
  const rewrite = (body) => {
    let res = '';
    let i = 0;
    while (i < body.length) {
      const open = body.indexOf('{', i);
      if (open < 0) {
        res += body.slice(i);
        break;
      }
      const head = body.slice(i, open);
      let depth = 1;
      let j = open + 1;
      while (j < body.length && depth) {
        if (body[j] === '{') depth += 1;
        else if (body[j] === '}') depth -= 1;
        j += 1;
      }
      const inner = body.slice(open + 1, j - 1);
      const clean = strip(head).trim();
      if (clean.startsWith('@keyframes')) res += `${head}{${inner}}`;
      else if (clean.startsWith('@')) res += `${head}{${rewrite(inner)}}`;
      else {
        // Keep leading whitespace and comments, rewrite each selector of the list.
        const lead = head.match(/^(\s|\/\*[\s\S]*?\*\/)*/)[0];
        res += `${lead}${splitTop(strip(head.slice(lead.length))).map(prefix).join(',\n  ')} {${inner}}`;
      }
      i = j;
    }
    return res;
  };
  let out = '';
  let pos = 0;
  for (;;) {
    const at = text.indexOf(marker, pos);
    if (at < 0) {
      out += text.slice(pos);
      break;
    }
    const open = text.indexOf('{', at);
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') depth -= 1;
      j += 1;
    }
    out += text.slice(pos, open + 1) + rewrite(text.slice(open + 1, j - 1)) + '}';
    pos = j;
  }
  return out;
}

let css = `/* Pelagic UI — GENERATED by packages/core/scripts/build.mjs from src/themes.mjs. Do not edit by hand.
 * Theme with attributes on <html> (or any container):
 *   data-theme="light | dark | hc"   (default: follows prefers-color-scheme / prefers-contrast)
 *   data-accent="${accentNames.join(' | ')}"
 *   data-shape="${Object.keys(shapes).join(' | ')}"
 *   data-theme-preset="${presetNames.join(' | ')}"
 */

/* ---------- Shapes ---------- */
${block(`:root, [data-shape="${defaultShape}"]`, shapeVars(defaultShape))}${Object.keys(shapes)
  .filter((s) => s !== defaultShape)
  .map((s) => block(`[data-shape="${s}"]`, shapeVars(s)))
  .join('')}
/* ---------- Accent palettes ---------- */
${block(`:root, [data-accent="${coreDefaultAccent}"]`, accentVars(coreDefaultAccent))}${coreAccentNames
  .filter((a) => a !== coreDefaultAccent)
  .map((a) => block(`[data-accent="${a}"]`, accentVars(a)))
  .join('')}
${brandCss()}/* ---------- Modes ---------- */
${block(':root, [data-theme="light"]', { ...modeVars('light') }).replace('{\n', '{\n  color-scheme: light;\n')}${block('[data-theme="dark"]', modeVars('dark')).replace('{\n', '{\n  color-scheme: dark;\n')}${block('[data-theme="hc"]', modeVars('hc')).replace('{\n', '{\n  color-scheme: light;\n')}@media (prefers-color-scheme: dark) {
${block(':root:not([data-theme])', modeVars('dark')).replace('{\n', '{\n  color-scheme: dark;\n')}}
@media (prefers-contrast: more) {
${block(':root:not([data-theme])', modeVars('hc')).replace('{\n', '{\n  color-scheme: light;\n')}}

/* ---------- Accent bound to the active mode ----------
 * Order matters: page defaults, then accent-only scopes (which inherit the page mode),
 * then explicit data-theme, which always wins on its own element. */
${block(':root', bindingVars('light'))}@media (prefers-color-scheme: dark) {
${block(':root:not([data-theme])', bindingVars('dark'))}}
@media (prefers-contrast: more) {
${block(':root:not([data-theme])', bindingVars('hc'))}}
${block('[data-accent]', bindingVars('light'))}${block(':where([data-theme="dark"]) [data-accent]', bindingVars('dark'))}${block(':where([data-theme="hc"]) [data-accent]', bindingVars('hc'))}@media (prefers-color-scheme: dark) {
${block(':where(:root:not([data-theme])) [data-accent]', bindingVars('dark'))}}
@media (prefers-contrast: more) {
${block(':where(:root:not([data-theme])) [data-accent]', bindingVars('hc'))}}
${block('[data-theme="light"]', bindingVars('light'))}${block('[data-theme="dark"]', bindingVars('dark'))}${block('[data-theme="hc"]', bindingVars('hc'))}`;

css += '\n' + presetCss();
css += '\n' + schemeCss();
css += '\n' + readFileSync(join(root, 'src/base.css'), 'utf8');
css += '\n' + readFileSync(join(root, 'src/components.css'), 'utf8');
// Additional component groups live in src/parts/*.css (one file per area), concatenated in name order.
const partsDir = join(root, 'src/parts');
if (existsSync(partsDir)) {
  for (const file of readdirSync(partsDir).filter((f) => f.endsWith('.css')).sort()) {
    css += `\n/* ===== ${file} ===== */\n` + readFileSync(join(partsDir, file), 'utf8');
  }
}
css = scopeReducedMotion(css);
writeFileSync(join(root, 'pelagic.css'), css);

// ---------- tokens.ts for React Native and other JS consumers ----------
const themes = {};
for (const mode of modeNames) {
  themes[mode] = {};
  for (const accent of coreAccentNames) {
    const { mode: _m, accent: _a, ...colors } = resolveTheme(mode, accent);
    themes[mode][accent] = colors;
  }
  for (const { theme } of brands) {
    const tokenKeys = Object.keys(themes[mode][coreDefaultAccent]);
    themes[mode][theme.name] = Object.fromEntries(tokenKeys.map((k) => [k, theme.tokens[mode][k]]));
  }
}
const keys = Object.keys(themes.light[coreDefaultAccent]);
const presetThemes = {};
for (const name of presetNames) {
  presetThemes[name] = {};
  for (const mode of modeNames) {
    const { mode: _m, accent: _a, ...colors } = resolvePresetTheme(name, mode);
    presetThemes[name][mode] = colors;
  }
}

const header = '/* Pelagic UI tokens — GENERATED by packages/core/scripts/build.mjs from src/themes.mjs. Do not edit by hand. */\n';

const js = `${header}
export const themes = ${JSON.stringify(themes, null, 2)};

export const shapes = ${JSON.stringify(shapes, null, 2)};

/** Named theme presets (data-theme-preset), resolved per mode with their own accent. */
export const presetThemes = ${JSON.stringify(presetThemes, null, 2)};

export const lightTheme = themes.light.${defaultAccent};
export const darkTheme = themes.dark.${defaultAccent};
export const highContrastTheme = themes.hc.${defaultAccent};

export const radius = { ...shapes.${defaultShape}, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const fontSize = { xs: 11, sm: 13, md: 15, lg: 17, xl: 20 };

export function getTheme(mode = 'light', accent = '${defaultAccent}') {
  return themes[mode][accent];
}
`;

const dts = `${header}
export type ThemeMode = ${modeNames.map((m) => `'${m}'`).join(' | ')};
export type ThemeAccent = ${accentNames.map((a) => `'${a}'`).join(' | ')};
export type ThemeShape = ${Object.keys(shapes).map((s) => `'${s}'`).join(' | ')};
export type ThemePreset = ${presetNames.map((s) => `'${s}'`).join(' | ')};
/** @deprecated use ThemeMode */
export type ThemeName = ThemeMode;

export interface PelagicTheme {
${keys.map((k) => `  ${k}: string;`).join('\n')}
}

export declare const themes: Record<ThemeMode, Record<ThemeAccent, PelagicTheme>>;
export declare const shapes: Record<ThemeShape, { sm: number; md: number; lg: number }>;
export declare const presetThemes: Record<ThemePreset, Record<ThemeMode, PelagicTheme>>;
export declare const lightTheme: PelagicTheme;
export declare const darkTheme: PelagicTheme;
export declare const highContrastTheme: PelagicTheme;
export declare const radius: { readonly sm: number; readonly md: number; readonly lg: number; readonly pill: 999 };
export declare const spacing: { readonly xs: 4; readonly sm: 8; readonly md: 12; readonly lg: 16; readonly xl: 24 };
export declare const fontSize: { readonly xs: 11; readonly sm: 13; readonly md: 15; readonly lg: 17; readonly xl: 20 };
export declare function getTheme(mode?: ThemeMode, accent?: ThemeAccent): PelagicTheme;
`;
writeFileSync(join(root, 'tokens.js'), js);
writeFileSync(join(root, 'tokens.d.ts'), dts);

console.log(`Built pelagic.css (${(css.length / 1024).toFixed(1)} KB) and tokens.js/.d.ts —${modeNames.length} modes × ${accentNames.length} accents × ${Object.keys(shapes).length} shapes × ${presetNames.length} presets.`);

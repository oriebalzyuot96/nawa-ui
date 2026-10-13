// Generates orca-ui.css and tokens.ts from src/themes.mjs. Run: node scripts/build.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Brand accents: --brand "#ff6a00" [--brand-name acme] [--neutral …] [--secondary …] [--brand-default],
// or --config orca.config.json (see scripts/brand.mjs).
import { accents, contrastSchemes, defaultAccent as coreDefaultAccent, defaultShape, modes, shapes, softMix, tint } from '../src/themes.mjs';
import { mixHex } from '../src/theme.js';
import { buildBrands, readBrandConfig } from './brand.mjs';
import { accentNames as coreAccentNames, modeNames, resolveTheme } from './resolve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brands = buildBrands(readBrandConfig());
const accentNames = [...coreAccentNames, ...brands.map((b) => b.theme.name).filter((n) => !coreAccentNames.includes(n))];
const defaultBrand = brands.find((b) => b.isDefault)?.theme;
const defaultAccent = defaultBrand?.name ?? coreDefaultAccent;
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const block = (selector, vars) =>
  `${selector} {\n${Object.entries(vars).map(([k, v]) => `  --oc-${kebab(k)}: ${v};`).join('\n')}\n}\n`;

// Accent palettes: every accent carries its light, dark and hc values as --oc-a-<mode>-<key>.
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
    .map(([k, v]) => `  --oc-${kebab(k)}: ${v} !important;`)
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
  for (const key of ['primary', 'primaryHover', 'primaryInk', 'onPrimary']) vars[key] = `var(--oc-a-${mode}-${kebab(key)})`;
  vars.primarySoft = `color-mix(in srgb, var(--oc-primary) ${softMix.primary * 100}%, var(--oc-surface))`;
  vars.focus = 'var(--oc-primary)';
  // Accent-tinted roles of the Orca design language (see DESIGN.md). They live in the binding blocks
  // so nested data-theme / data-accent scopes recompute them. Same math as scripts/resolve.mjs.
  vars.tintHover = `color-mix(in srgb, var(--oc-primary) ${tint.hover * 100}%, var(--oc-surface))`;
  vars.tintPress = `color-mix(in srgb, var(--oc-primary) ${tint.press * 100}%, var(--oc-surface))`;
  vars.canvas = `color-mix(in srgb, var(--oc-primary) ${tint.canvas * 100}%, var(--oc-surface-alt))`;
  vars.borderSubtle = `color-mix(in srgb, var(--oc-primary) ${tint.border * 100}%, var(--oc-border))`;
  vars.borderStrong = 'color-mix(in srgb, var(--oc-control-border) 55%, var(--oc-border))';
  vars.ring = 'color-mix(in srgb, var(--oc-focus) 24%, transparent)';
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
    successSoft: `color-mix(in srgb, var(--oc-success) ${pct}%, var(--oc-surface))`,
    warningSoft: `color-mix(in srgb, var(--oc-warning) ${pct}%, var(--oc-surface))`,
    dangerSoft: `color-mix(in srgb, var(--oc-danger) ${pct}%, var(--oc-surface))`,
    infoSoft: `color-mix(in srgb, var(--oc-info) ${pct}%, var(--oc-surface))`,
    overlay: m.overlay,
    /** Floating layers (menus, popovers, dialogs): lifted one step above the page in dark mode. */
    surfaceRaised: mode === 'dark' ? 'var(--oc-surface-alt)' : 'var(--oc-surface)',
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

/** Custom brand accents baked in with --brand / orca.config.json (same CSS as createTheme()). */
function brandCss() {
  if (!brands.length) return '';
  const parts = brands.map(({ theme, isDefault }) =>
    isDefault ? theme.css.replace(`[data-accent="${theme.name}"] {`, `:root, [data-accent="${theme.name}"] {`) : theme.css,
  );
  return `/* ---------- Brand accents ---------- */\n${parts.join('')}\n`;
}

let css = `/* Orca UI — GENERATED by packages/core/scripts/build.mjs from src/themes.mjs. Do not edit by hand.
 * Theme with attributes on <html> (or any container):
 *   data-theme="light | dark | hc"   (default: follows prefers-color-scheme / prefers-contrast)
 *   data-accent="${accentNames.join(' | ')}"
 *   data-shape="${Object.keys(shapes).join(' | ')}"
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
writeFileSync(join(root, 'orca-ui.css'), css);

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

const header = '/* Orca UI tokens — GENERATED by packages/core/scripts/build.mjs from src/themes.mjs. Do not edit by hand. */\n';

const js = `${header}
export const themes = ${JSON.stringify(themes, null, 2)};

export const shapes = ${JSON.stringify(shapes, null, 2)};

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
/** @deprecated use ThemeMode */
export type ThemeName = ThemeMode;

export interface OrcaTheme {
${keys.map((k) => `  ${k}: string;`).join('\n')}
}

export declare const themes: Record<ThemeMode, Record<ThemeAccent, OrcaTheme>>;
export declare const shapes: Record<ThemeShape, { sm: number; md: number; lg: number }>;
export declare const lightTheme: OrcaTheme;
export declare const darkTheme: OrcaTheme;
export declare const highContrastTheme: OrcaTheme;
export declare const radius: { readonly sm: number; readonly md: number; readonly lg: number; readonly pill: 999 };
export declare const spacing: { readonly xs: 4; readonly sm: 8; readonly md: 12; readonly lg: 16; readonly xl: 24 };
export declare const fontSize: { readonly xs: 11; readonly sm: 13; readonly md: 15; readonly lg: 17; readonly xl: 20 };
export declare function getTheme(mode?: ThemeMode, accent?: ThemeAccent): OrcaTheme;
`;
writeFileSync(join(root, 'tokens.js'), js);
writeFileSync(join(root, 'tokens.d.ts'), dts);

console.log(`Built orca-ui.css (${(css.length / 1024).toFixed(1)} KB) and tokens.js/.d.ts —${modeNames.length} modes × ${accentNames.length} accents × ${Object.keys(shapes).length} shapes.`);

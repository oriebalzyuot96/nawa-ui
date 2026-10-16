// Verifies WCAG 2.2 AA (text 4.5:1, UI 3:1) for:
//   1. every built-in mode × accent (21 themes)
//   2. the accessibility color schemes (data-a11y-contrast: yellow-black, black-yellow, white-black,
//      black-white, gray, gray-dark)
//   3. the inverted rendering (data-a11y-contrast="invert": filter invert(1) hue-rotate(180deg)) of all 21 themes
//   4. the saturation filters (data-a11y-saturation low / high) of all 21 themes
//   5. custom brand themes from createTheme(): a fixed sample of brand colors, plus --brand / pelagic.config.json
//   6. the named theme presets (data-theme-preset): every preset × mode with its own accent, every preset ×
//      built-in accent (an explicit data-accent over a preset), their inverted and low-saturation renderings,
//      and brand colors fitted to each preset with createTheme({ primary, preset })
// Exits 1 on any failure. Pair list: contrastPairs in src/themes.mjs.
import { contrastPairs, contrastSchemes } from '../src/themes.mjs';
import { auditTheme, createTheme, parseColor, resolveTokens, rgbToHex } from '../src/theme.js';
import { readBrandConfig } from './brand.mjs';
import { accentNames, modeNames, presetModeNeutrals, presetNames, resolvePresetTheme, resolveTheme } from './resolve.mjs';
import { accents, modes, presets } from '../src/themes.mjs';

let failures = 0;
let checks = 0;
const groups = [];

function run(label, tokens, pairs) {
  const f = auditTheme(tokens, pairs);
  checks += pairs ? pairs.length : tokens.secondary ? contrastPairs.length + 5 : contrastPairs.length;
  for (const x of f) {
    failures += 1;
    console.error(`FAIL ${label}: ${x.label} — ${x.foreground} on ${x.background} = ${x.ratio} (needs ${x.min})`);
  }
}

// ---------- 1. Built-in themes ----------
const builtIn = {};
for (const mode of modeNames) {
  for (const accent of accentNames) {
    const t = resolveTokens(mode, modes[mode], accents[accent][mode]);
    // Keep the generator and this check honest: resolve.mjs and resolveTokens must agree.
    const r = resolveTheme(mode, accent);
    for (const k of Object.keys(r)) if (k !== 'mode' && k !== 'accent' && r[k] !== t[k]) throw new Error(`resolve mismatch ${mode}/${accent}.${k}`);
    builtIn[`${mode}/${accent}`] = t;
    run(`${mode}/${accent}`, t);
  }
}
groups.push(`${modeNames.length} modes × ${accentNames.length} accents × ${contrastPairs.length} pairs`);

// ---------- 2. Accessibility color schemes ----------
for (const [name, s] of Object.entries(contrastSchemes)) run(`a11y-contrast ${name}`, resolveTokens(s.colorScheme === 'dark' ? 'dark' : 'light', s, s));
groups.push(`${Object.keys(contrastSchemes).length} accessibility schemes`);

// ---------- 3 & 4. Filters (sRGB, as browsers apply CSS filter functions) ----------
function matrixFilter(m) {
  return (hex) => {
    if (!/^#/.test(hex)) return hex;
    const { r, g, b } = parseColor(hex);
    const v = [r, g, b];
    const out = m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
    return rgbToHex({ r: out[0], g: out[1], b: out[2] });
  };
}
/** Filter Effects 1: hue-rotate and saturate matrices. */
const hueRotate = (deg) => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [
    [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928],
    [0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283],
    [0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072],
  ];
};
const saturate = (s) => [
  [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
  [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
  [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
];
const invert = (hex) => {
  if (!/^#/.test(hex)) return hex;
  const { r, g, b } = parseColor(hex);
  return rgbToHex({ r: 1 - r, g: 1 - g, b: 1 - b });
};
const rotate180 = matrixFilter(hueRotate(180));
// The values must match src/parts/a11y-modes.css. Invert always renders the light (or hc) tokens inverted:
// the build pins those under data-a11y-contrast="invert", because an inverted dark theme is a washed-out
// light one. High saturation is applied to media and charts only (it would push red text under 4.5:1),
// so only the whole-page low-saturation filter is checked here.
const filters = {
  invert: { fn: (hex) => rotate180(invert(hex)), themes: (label) => !label.startsWith('dark/') },
  'saturation-low': { fn: matrixFilter(saturate(0.5)), themes: () => true },
};
let filtered = 0;
for (const [fname, { fn, themes }] of Object.entries(filters)) {
  for (const [label, t] of Object.entries(builtIn)) {
    if (!themes(label)) continue;
    filtered += 1;
    run(`${fname} ${label}`, Object.fromEntries(Object.entries(t).map(([k, v]) => [k, fn(v)])));
  }
}
groups.push(`${filtered} filtered renderings (invert, low saturation)`);

// ---------- 5. Custom brand themes ----------
const sample = ['#ff6a00', '#ffd400', '#00e5ff', '#39ff14', '#e11d48', '#0a0a0a', '#ffffff', '#7c3aed', '#14b8a6', '#8b5e3c', 'hsl(48 100% 50%)', 'oklch(0.7 0.25 330)'];
const configured = readBrandConfig().map((b) => b.primary);
let brandThemes = 0;
for (const primary of [...sample, ...configured]) {
  for (const extra of [{}, { neutral: primary, secondary: '#0ea5e9' }]) {
    const theme = createTheme({ primary, ...extra });
    brandThemes += 1;
    for (const mode of modeNames) run(`brand ${primary}${extra.neutral ? ' +neutral' : ''} ${mode}`, theme.tokens[mode]);
  }
}
groups.push(`${brandThemes} custom brand themes × ${modeNames.length} modes`);

// ---------- 6. Theme presets ----------
let presetRuns = 0;
for (const preset of presetNames) {
  for (const mode of modeNames) {
    const t = resolveTokens(mode, presetModeNeutrals(preset, mode), presets[preset][mode]);
    const r = resolvePresetTheme(preset, mode);
    for (const k of Object.keys(r)) if (k !== 'mode' && k !== 'accent' && r[k] !== t[k]) throw new Error(`resolve mismatch preset ${preset}/${mode}.${k}`);
    run(`preset ${preset} ${mode}`, t);
    presetRuns += 1;
    // Saturation filter over the whole page, like the built-in themes.
    run(`saturation-low preset ${preset} ${mode}`, Object.fromEntries(Object.entries(t).map(([k, v]) => [k, filters['saturation-low'].fn(v)])));
    presetRuns += 1;
    // An explicit data-accent over the preset surfaces (hc keeps the hc neutrals, so it equals section 1).
    if (mode !== 'hc') {
      for (const accent of accentNames) {
        run(`preset ${preset} ${mode} + ${accent}`, resolveTokens(mode, presetModeNeutrals(preset, mode), accents[accent][mode]));
        presetRuns += 1;
      }
    }
  }
  // Invert pins the light (or hc) neutrals; the preset accent stays.
  for (const mode of ['light', 'hc']) {
    const t = resolveTokens(mode, modes[mode], presets[preset][mode]);
    run(`invert preset ${preset} ${mode}`, Object.fromEntries(Object.entries(t).map(([k, v]) => [k, filters.invert.fn(v)])));
    presetRuns += 1;
  }
  // A brand fitted to the preset surfaces.
  for (const primary of ['#ff6a00', '#ffd400', '#00e5ff', '#0a0a0a', '#7c3aed']) {
    const theme = createTheme({ primary, preset });
    for (const mode of modeNames) {
      run(`brand ${primary} on preset ${preset} ${mode}`, theme.tokens[mode]);
      presetRuns += 1;
    }
  }
}
groups.push(`${presetNames.length} presets: ${presetRuns} preset renderings (own accent, + every accent, saturation, invert, fitted brands)`);

if (failures) {
  console.error(`\n${failures} of ${checks} contrast checks failed.`);
  process.exit(1);
}
console.log(`All ${checks} contrast checks pass (${groups.join('; ')}).`);

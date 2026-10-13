// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { contrastPairs, modes } from '../src/themes.mjs';
import {
  applyCustomTheme,
  applyTheme,
  auditTheme,
  contrastRatio,
  createTheme,
  parseColor,
  removeCustomTheme,
  themeToCode,
  toHex,
  toOklch,
} from '../src/theme.js';

const MODES = ['light', 'dark', 'hc'];

/** Deterministic PRNG so the 50 "random" brand colors are the same on every run. */
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const rand = prng(20261013);
const randomHex = () => `#${Math.floor(rand() * 0x1000000).toString(16).padStart(6, '0')}`;

describe('color parsing and OKLCH', () => {
  it('parses hex, rgb, hsl, oklch, oklab and names to the same color', () => {
    expect(toHex('#f60')).toBe('#ff6600');
    expect(toHex('#FF660080')).toBe('#ff6600');
    expect(toHex('rgb(255, 102, 0)')).toBe('#ff6600');
    expect(toHex('rgb(255 102 0 / 50%)')).toBe('#ff6600');
    expect(toHex('hsl(24 100% 50%)')).toBe('#ff6600');
    expect(toHex('hsla(24deg, 100%, 50%, 0.5)')).toBe('#ff6600');
    expect(toHex('rebeccapurple')).toBe('#663399');
    expect(toHex('oklch(62.8% 0.2577 29.23)')).toBe('#ff0000');
    expect(toHex('oklab(0.628 0.2249 0.1258)')).toBe('#ff0000');
    expect(parseColor('rgb(0 0 0 / 0.25)').alpha).toBeCloseTo(0.25);
  });

  it('round-trips sRGB through OKLCH', () => {
    for (let i = 0; i < 40; i += 1) {
      const hex = randomHex();
      const { L, C, H } = toOklch(hex);
      expect(toHex(`oklch(${L} ${C} ${H})`)).toBe(hex);
    }
  });

  it('gamut-maps out-of-range OKLCH instead of clipping channels', () => {
    const hex = toHex('oklch(0.7 0.5 150)');
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(toOklch(hex).L).toBeCloseTo(0.7, 1);
  });

  it('rejects input it cannot parse', () => {
    expect(() => createTheme({ primary: 'not-a-color' })).toThrow(TypeError);
    expect(() => createTheme({})).toThrow(TypeError);
  });
});

describe('createTheme', () => {
  const samples = Array.from({ length: 50 }, randomHex);

  it.each(samples)('brand %s passes every WCAG pair in light, dark and hc', (primary) => {
    const theme = createTheme({ primary });
    for (const mode of MODES) {
      expect(auditTheme(theme.tokens[mode]), `${primary} ${mode}`).toEqual([]);
      expect(theme.failures[mode]).toEqual([]);
    }
  });

  it.each(samples.slice(0, 25))('brand %s with a tinted neutral and a secondary color passes too', (primary) => {
    const theme = createTheme({ primary, neutral: randomHex(), secondary: randomHex() });
    for (const mode of MODES) {
      const t = theme.tokens[mode];
      expect(auditTheme(t), `${primary} ${mode}`).toEqual([]);
      expect(contrastRatio(t.onSecondary, t.secondary)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.secondaryInk, t.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('accepts every color syntax', () => {
    for (const primary of ['#ff6a00', 'rgb(255 106 0)', 'hsl(25 100% 50%)', 'oklch(0.7 0.2 45)', 'tomato']) {
      const theme = createTheme(primary);
      for (const mode of MODES) expect(theme.failures[mode]).toEqual([]);
    }
  });

  it('keeps the brand hue and stays close to the brand where contrast allows', () => {
    const brand = '#ff6a00';
    const theme = createTheme({ primary: brand });
    const hue = toOklch(brand).H;
    for (const mode of MODES) expect(Math.abs(toOklch(theme.palette[mode].primary).H - hue)).toBeLessThan(8);
    // A light brand color is usable as is on dark surfaces.
    expect(theme.palette.dark.primary).toBe(brand);
    // hc aims for AAA on its fills.
    expect(contrastRatio(theme.palette.hc.onPrimary, theme.palette.hc.primary)).toBeGreaterThanOrEqual(7);
  });

  it('checks the same pair list as check-contrast', () => {
    expect(contrastPairs.length).toBeGreaterThanOrEqual(40);
    const t = createTheme('#00e5ff').tokens.light;
    for (const [, fg, bg] of contrastPairs) {
      expect(t[fg], fg).toMatch(/^#/);
      expect(t[bg], bg).toMatch(/^#/);
    }
  });

  it('keeps the default neutrals unless a neutral is given', () => {
    const plain = createTheme({ primary: '#7c3aed' });
    expect(plain.tokens.light.surface).toBe(modes.light.surface);
    expect(plain.tokens.dark.surface).toBe(modes.dark.surface);
    const tinted = createTheme({ primary: '#7c3aed', neutral: '#0ea5e9' });
    expect(tinted.tokens.light.surface).not.toBe(modes.light.surface);
    expect(tinted.css).toContain('--oc-surface:');
  });

  it('emits CSS scoped to the theme name for light, dark, hc and the OS preferences', () => {
    const theme = createTheme({ primary: '#ff6a00', neutral: '#334155', secondary: '#0ea5e9', name: 'Acme Corp', radius: 6, font: 'Inter, sans-serif' });
    expect(theme.name).toBe('acme-corp');
    const { css } = theme;
    expect(css).toContain('[data-accent="acme-corp"] {');
    for (const mode of MODES) {
      expect(css).toContain(`--oc-a-${mode}-primary: ${theme.palette[mode].primary};`);
      expect(css).toContain(`[data-accent="acme-corp"][data-theme="${mode}"]`);
    }
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root\[data-accent="acme-corp"\]:not\(\[data-theme\]\)/);
    expect(css).toMatch(/@media \(prefers-contrast: more\)/);
    expect(css).toContain('--oc-secondary: var(--oc-a-light-secondary);');
    expect(css).toContain('--oc-radius: 6px;');
    expect(css).toContain('--oc-font: Inter, sans-serif;');
    const open = (css.match(/\{/g) ?? []).length;
    expect((css.match(/\}/g) ?? []).length).toBe(open);
  });

  it('themeToCode reproduces the call', () => {
    const theme = createTheme({ primary: '#ff6a00', name: 'acme', radius: 8 });
    const code = themeToCode(theme);
    expect(code).toContain("primary: '#ff6a00'");
    expect(code).toContain('radius: 8');
    expect(code).toContain("name: 'acme'");
    expect(code).toContain('applyCustomTheme(theme');
  });
});

describe('applyCustomTheme / applyTheme({ custom })', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('data-accent');
    document.documentElement.removeAttribute('data-theme');
  });

  it('injects one <style data-theme-custom> per theme and selects it as the accent', () => {
    const theme = createTheme({ primary: '#e11d48', name: 'brand' });
    const cleanup = applyCustomTheme(theme);
    applyCustomTheme(theme);
    const styles = document.head.querySelectorAll('style[data-theme-custom="brand"]');
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toBe(theme.css);
    expect(document.documentElement.getAttribute('data-accent')).toBe('brand');
    cleanup();
    expect(document.head.querySelector('style[data-theme-custom]')).toBeNull();
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });

  it('can be scoped to a container', () => {
    const box = document.createElement('section');
    document.body.appendChild(box);
    applyTheme({ mode: 'dark', custom: createTheme({ primary: '#14b8a6', name: 'scoped' }) }, box);
    expect(box.getAttribute('data-accent')).toBe('scoped');
    expect(box.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
    removeCustomTheme('scoped');
    expect(document.head.querySelector('style[data-theme-custom="scoped"]')).toBeNull();
    box.remove();
  });
});


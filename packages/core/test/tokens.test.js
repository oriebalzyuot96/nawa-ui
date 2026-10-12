import { describe, expect, it } from 'vitest';
import * as tokens from '../tokens.js';
import { accents, defaultAccent, modes, shapes as sourceShapes } from '../src/themes.mjs';

const MODES = ['light', 'dark', 'hc'];
const ACCENTS = ['violet', 'teal', 'indigo', 'rose', 'amber', 'emerald', 'slate'];
const KEYS = [
  'primary', 'primaryHover', 'primaryInk', 'onPrimary', 'primarySoft', 'focus',
  'surface', 'surfaceAlt', 'surfaceMuted', 'text', 'textMuted', 'border', 'controlBorder',
  'success', 'warning', 'danger', 'info', 'onDanger',
  'successSoft', 'warningSoft', 'dangerSoft', 'infoSoft', 'overlay',
];
const COLOR = /^(#[0-9a-f]{6}|rgba\(\d+, \d+, \d+, (0|1|0?\.\d+)\))$/i;

describe('tokens.js', () => {
  it('has exactly the 3 modes and 7 accents from the source of truth', () => {
    expect(Object.keys(tokens.themes)).toEqual(MODES);
    expect(Object.keys(modes)).toEqual(MODES);
    expect(Object.keys(accents)).toEqual(ACCENTS);
    for (const mode of MODES) expect(Object.keys(tokens.themes[mode])).toEqual(ACCENTS);
  });

  it.each(MODES.flatMap((m) => ACCENTS.map((a) => [m, a])))('%s/%s has every key as a resolved color', (mode, accent) => {
    const theme = tokens.themes[mode][accent];
    expect(Object.keys(theme).sort()).toEqual([...KEYS].sort());
    for (const key of KEYS) expect(theme[key], key).toMatch(COLOR);
    expect(theme.focus).toBe(theme.primary);
    expect(theme.primary).toBe(accents[accent][mode].primary);
    expect(theme.surface).toBe(modes[mode].surface);
  });

  it('getTheme defaults to light / violet', () => {
    expect(defaultAccent).toBe('violet');
    expect(tokens.getTheme()).toBe(tokens.themes.light.violet);
    expect(tokens.getTheme('dark')).toBe(tokens.themes.dark.violet);
    expect(tokens.getTheme('hc', 'amber')).toBe(tokens.themes.hc.amber);
  });

  it('exposes the convenience themes and scales', () => {
    expect(tokens.lightTheme).toBe(tokens.themes.light.violet);
    expect(tokens.darkTheme).toBe(tokens.themes.dark.violet);
    expect(tokens.highContrastTheme).toBe(tokens.themes.hc.violet);
    expect(tokens.shapes).toEqual(sourceShapes);
    expect(tokens.radius).toEqual({ ...sourceShapes.default, pill: 999 });
    expect(tokens.spacing).toEqual({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24 });
    expect(tokens.fontSize).toEqual({ xs: 11, sm: 13, md: 15, lg: 17, xl: 20 });
  });

  it('dark themes really are dark and light themes light', () => {
    const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    for (const accent of ACCENTS) {
      expect(lum(tokens.themes.dark[accent].surface)).toBeLessThan(lum(tokens.themes.dark[accent].text));
      expect(lum(tokens.themes.light[accent].surface)).toBeGreaterThan(lum(tokens.themes.light[accent].text));
    }
  });
});

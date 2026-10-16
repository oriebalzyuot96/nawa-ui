import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrast, mix } from '../scripts/color.mjs';
import { accentNames, modeNames, resolveTheme } from '../scripts/resolve.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('color math', () => {
  it('computes WCAG contrast ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrast('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('mixes colors like CSS color-mix(in srgb)', () => {
    expect(mix('#000000', '#ffffff', 0.5).toLowerCase()).toMatch(/^#(7f|80){3}$/);
    expect(mix('#ff0000', '#ffffff', 1).toLowerCase()).toBe('#ff0000');
  });

  it('resolves every mode × accent', () => {
    expect(modeNames).toHaveLength(3);
    expect(accentNames).toHaveLength(9);
    for (const m of modeNames) for (const a of accentNames) expect(resolveTheme(m, a).surface).toMatch(/^#/);
  });
});

describe('scripts/check-contrast.mjs', () => {
  it('exits 0 (all WCAG 2.2 AA pairs pass in every theme)', () => {
    const result = spawnSync(process.execPath, [join(pkg, 'scripts', 'check-contrast.mjs')], { encoding: 'utf8' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/All \d+ contrast checks pass \(3 modes × 9 accents/);
  });
});

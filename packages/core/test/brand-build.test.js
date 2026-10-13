// Runs the generator with --brand / pelagic.config.json in a temporary copy of the package.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODES = ['light', 'dark', 'hc'];

describe('build --brand / pelagic.config.json', () => {
  let dir;
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

  const copy = () => {
    dir = mkdtempSync(join(tmpdir(), 'pelagic-brand-'));
    cpSync(join(pkg, 'src'), join(dir, 'src'), { recursive: true });
    cpSync(join(pkg, 'scripts'), join(dir, 'scripts'), { recursive: true });
  };

  it('bakes a --brand accent into the CSS and tokens', async () => {
    copy();
    execFileSync(process.execPath, [join(dir, 'scripts', 'build.mjs'), '--brand', '#ff6a00', '--brand-name', 'acme'], { cwd: dir, stdio: 'pipe' });
    const css = readFileSync(join(dir, 'pelagic.css'), 'utf8');
    expect(css).toContain('[data-accent="acme"] {');
    const tokens = await import(pathToFileURL(join(dir, 'tokens.js')).href);
    expect(Object.keys(tokens.themes.light)).toContain('acme');
    expect(tokens.themes.dark.acme.primary).toBe('#ff6a00');
    expect(readFileSync(join(dir, 'tokens.d.ts'), 'utf8')).toContain("'acme'");
    // Without "default", the library default accent is unchanged.
    expect(tokens.lightTheme).toEqual(tokens.themes.light.violet);
  });

  it('reads pelagic.config.json and can make the brand the default accent', async () => {
    copy();
    writeFileSync(join(dir, 'pelagic.config.json'), JSON.stringify({ brands: [{ name: 'sun', primary: 'hsl(48 100% 50%)', neutral: '#57534e', default: true }] }));
    execFileSync(process.execPath, [join(dir, 'scripts', 'build.mjs')], { cwd: dir, stdio: 'pipe' });
    const css = readFileSync(join(dir, 'pelagic.css'), 'utf8');
    expect(css).toContain(':root, [data-accent="sun"] {');
    const tokens = await import(pathToFileURL(join(dir, 'tokens.js')).href);
    expect(tokens.lightTheme).toEqual(tokens.themes.light.sun);
    expect(tokens.getTheme('dark')).toEqual(tokens.themes.dark.sun);
    for (const mode of MODES) expect(tokens.themes[mode].sun.surface).toMatch(/^#/);
  });
});

// Runs the CSS/token generator in a temporary copy of the package (so the repo is never
// rewritten by tests) and checks the output.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accents, defaultAccent, modes, shapes } from '../src/themes.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = join(pkg, '..');
let dir;
let css;
let built;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'orca-core-build-'));
  cpSync(join(pkg, 'src'), join(dir, 'src'), { recursive: true });
  cpSync(join(pkg, 'scripts'), join(dir, 'scripts'), { recursive: true });
  execFileSync(process.execPath, [join(dir, 'scripts', 'build.mjs')], { cwd: dir, stdio: 'pipe' });
  css = readFileSync(join(dir, 'orca-ui.css'), 'utf8');
  built = await import(pathToFileURL(join(dir, 'tokens.js')).href);
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

describe('build output: orca-ui.css', () => {
  it('contains the default theme on :root', () => {
    expect(css).toContain(`:root, [data-accent="${defaultAccent}"] {`);
    expect(css).toContain(':root, [data-theme="light"] {');
    expect(css).toContain(':root, [data-shape="default"] {');
  });

  it.each(Object.keys(modes))('has a [data-theme="%s"] block with every mode variable', (mode) => {
    const block = css.match(new RegExp(`\\[data-theme="${mode}"\\] \\{([^}]*)\\}`));
    expect(block, `missing [data-theme="${mode}"]`).not.toBeNull();
    for (const v of ['surface', 'text', 'text-muted', 'border', 'control-border', 'danger', 'overlay']) {
      expect(block[1]).toContain(`--oc-${v}:`);
    }
  });

  it.each(Object.keys(accents))('has a [data-accent="%s"] palette with light, dark and hc values', (accent) => {
    expect(css).toContain(`[data-accent="${accent}"]`);
    for (const mode of Object.keys(modes)) {
      const primary = accents[accent][mode].primary;
      expect(css).toContain(`--oc-a-${mode}-primary: ${primary};`);
    }
  });

  it.each(Object.keys(shapes))('has a [data-shape="%s"] block', (shape) => {
    expect(css).toContain(`[data-shape="${shape}"]`);
    expect(css).toContain(`--oc-radius: ${shapes[shape].md}px;`);
  });

  it('follows the OS for dark mode and increased contrast', () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme\]\)/);
    expect(css).toMatch(/@media \(prefers-contrast: more\) \{\s*:root:not\(\[data-theme\]\)/);
  });

  it('includes base, components and every parts/*.css file', () => {
    for (const file of readdirSync(join(pkg, 'src/parts')).filter((f) => f.endsWith('.css'))) {
      expect(css).toContain(`/* ===== ${file} ===== */`);
    }
    expect(css).toContain('.oc-btn');
    expect(css).toContain('.oc-dialog');
  });

  it('has balanced braces', () => {
    const body = stripComments(css);
    let depth = 0;
    let min = 0;
    for (const ch of body) {
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      if (depth < min) min = depth;
    }
    expect(min).toBe(0);
    expect(depth).toBe(0);
  });

  it('uses no CSS variable that is never defined (except ones components set at runtime)', () => {
    const body = stripComments(css);
    const defined = new Set([...body.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    const withoutFallback = new Set(
      [...body.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1]),
    );
    // Variables a framework component sets inline (style={{ '--oc-i': i }}, setProperty('--x'), [style.--x]).
    const runtime = new Set();
    const walk = (d) => {
      for (const name of readdirSync(d)) {
        if (name === 'node_modules' || name === 'dist' || name === '__tests__') continue;
        const p = join(d, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|vue|svelte|astro|jsx?)$/.test(name)) {
          const src = readFileSync(p, 'utf8');
          for (const m of src.matchAll(/['"`](--[\w-]+)['"`]/g)) runtime.add(m[1]);
          for (const m of src.matchAll(/style\.(--[\w-]+)/g)) runtime.add(m[1]);
        }
      }
    };
    for (const p of readdirSync(packagesDir)) {
      const src = join(packagesDir, p, 'src');
      if (p !== 'core' && existsSync(src)) walk(src);
    }
    const undefinedVars = [...withoutFallback].filter((v) => !defined.has(v) && !runtime.has(v)).sort();
    expect(undefinedVars).toEqual([]);
  });

  it('every --oc-* theme variable referenced by the binding layer is defined', () => {
    const body = stripComments(css);
    const defined = new Set([...body.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    for (const mode of Object.keys(modes)) {
      for (const key of ['primary', 'primary-hover', 'primary-ink', 'on-primary']) {
        expect(defined.has(`--oc-a-${mode}-${key}`), `--oc-a-${mode}-${key}`).toBe(true);
      }
    }
  });
});

describe('build output: tokens.js', () => {
  it('matches the committed tokens.js (run `npm run build -w @orca-ui/core` if this fails)', () => {
    const committed = readFileSync(join(pkg, 'tokens.js'), 'utf8').replace(/\r\n/g, '\n');
    const fresh = readFileSync(join(dir, 'tokens.js'), 'utf8').replace(/\r\n/g, '\n');
    expect(fresh).toBe(committed);
  });

  it('exports a 3 × 7 theme matrix', () => {
    expect(Object.keys(built.themes)).toHaveLength(3);
    for (const mode of Object.keys(built.themes)) expect(Object.keys(built.themes[mode])).toHaveLength(7);
    expect(built.getTheme()).toEqual(built.themes.light.violet);
  });

  it('writes matching type declarations', () => {
    const dts = readFileSync(join(dir, 'tokens.d.ts'), 'utf8');
    expect(dts).toContain("export type ThemeMode = 'light' | 'dark' | 'hc';");
    expect(dts).toContain("export type ThemeAccent = 'violet' | 'teal' | 'indigo' | 'rose' | 'amber' | 'emerald' | 'slate';");
    for (const key of Object.keys(built.themes.light.violet)) expect(dts).toContain(`  ${key}: string;`);
  });
});

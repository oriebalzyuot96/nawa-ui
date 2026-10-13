// node --test (run `node scripts/build.mjs` first; `npm test` does both).
// Framework renderers resolve react / vue / svelte / jsdom from the monorepo root node_modules.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = (f) => pathToFileURL(join(root, 'dist', f)).href;
const lib = await import(dist('illustrations.js'));
const { ILLUSTRATION_NAMES, ILLUSTRATIONS, illustrationToSvg, illustrationTree, resolvePalette, isIllustrationName } = lib;
const require = createRequire(join(root, 'package.json'));
const { JSDOM } = require('jsdom');

const REQUIRED = [
  'no-data', 'no-results', 'empty-inbox', 'no-notifications', 'empty-cart', 'no-files', 'upload', 'no-messages',
  'all-done', 'error', 'not-found', 'server-error', 'offline', 'no-permission', 'maintenance', 'coming-soon',
  'no-favorites', 'no-comments', 'empty-calendar', 'no-team-members', 'no-payments', 'welcome', 'empty-folder', 'filter-empty',
];

/** Strip every var(...) (including nested fallbacks) so only literal colors remain. */
function stripVars(value) {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    if (value.startsWith('var(', i)) {
      let depth = 0;
      for (; i < value.length; i++) {
        if (value[i] === '(') depth++;
        else if (value[i] === ')' && --depth === 0) break;
      }
      continue;
    }
    out += value[i];
  }
  return out;
}

function parseSvg(markup) {
  const { window } = new JSDOM('');
  const doc = new window.DOMParser().parseFromString(markup, 'image/svg+xml');
  assert.equal(doc.getElementsByTagName('parsererror').length, 0, 'well-formed XML');
  return doc.documentElement;
}

describe('catalog', () => {
  it('ships every required scene (≥ 20) with metadata', () => {
    assert.ok(ILLUSTRATION_NAMES.length >= 20);
    for (const name of REQUIRED) assert.ok(isIllustrationName(name), name);
    for (const m of ILLUSTRATIONS) {
      assert.ok(m.title && m.keywords.length >= 3, m.name);
      assert.match(m.component, /^[A-Z][A-Za-z]+Illustration$/);
    }
    assert.equal(isIllustrationName('nope'), false);
    assert.throws(() => illustrationToSvg('nope'), /Unknown illustration/);
  });

  it('types expose an IllustrationName union with every scene and illustrationToSvg', () => {
    const dts = readFileSync(join(root, 'dist/illustrations.d.ts'), 'utf8');
    const union = dts.match(/export type IllustrationName = ([^;]+);/)[1];
    for (const name of ILLUSTRATION_NAMES) assert.ok(union.includes(`'${name}'`), name);
    assert.match(dts, /export declare function illustrationToSvg\(name: IllustrationName, options\?: IllustrationOptions\): string;/);
    for (const f of ['react.d.ts', 'vue.d.ts', 'native.d.ts']) {
      const text = readFileSync(join(root, 'dist', f), 'utf8');
      for (const m of ILLUSTRATIONS) assert.ok(text.includes(m.component), `${f}: ${m.component}`);
    }
  });
});

describe('every scene', () => {
  for (const name of ILLUSTRATION_NAMES) {
    it(`${name}: valid SVG, token colors only, decorative by default`, () => {
      const svg = illustrationToSvg(name);
      const el = parseSvg(svg);
      assert.equal(el.tagName, 'svg');
      assert.equal(el.getAttribute('viewBox'), '0 0 240 180');
      assert.equal(el.getAttribute('aria-hidden'), 'true');
      assert.equal(el.getAttribute('focusable'), 'false');
      assert.equal(el.getAttribute('role'), null);
      assert.ok(el.querySelectorAll('path, circle, rect, ellipse').length >= 6, 'has a real drawing');
      // No ids (safe to repeat on a page), no scripts, no external refs.
      assert.equal(el.querySelectorAll('[id], script, image, use, foreignObject').length, 0);
      for (const node of el.querySelectorAll('*')) {
        for (const attr of ['fill', 'stroke']) {
          const v = node.getAttribute(attr);
          if (v == null || v === 'none') continue;
          assert.match(v, /^var\(--pl-illus-[a-z]+, /, `${name} ${attr}="${v}"`);
          assert.ok(!/#[0-9a-f]{3,8}\b|rgb|hsl/i.test(stripVars(v)), `${name}: literal color outside var(): ${v}`);
        }
        for (const attr of ['style', 'color', 'stop-color']) assert.equal(node.getAttribute(attr), null, `${name}: ${attr}`);
      }
      // Literal colors anywhere in the markup (outside the embedded CSS keywords) only as var() fallbacks.
      assert.ok(!/#[0-9a-f]{3,8}\b/i.test(stripVars(svg)), `${name}: hard-coded hex outside var()`);
    });
  }

  it('the backdrop and the nucleus motif recur in every scene', () => {
    for (const name of ILLUSTRATION_NAMES) {
      const el = parseSvg(illustrationToSvg(name));
      assert.ok(el.querySelectorAll('.pl-illus__bg').length >= 2, `${name}: backdrop discs`);
      assert.ok(el.querySelector('ellipse[stroke-dasharray]'), `${name}: dotted orbit`);
    }
  });
});

describe('options and accessibility', () => {
  it('label turns the scene into role="img" with an escaped aria-label', () => {
    const el = parseSvg(illustrationToSvg('no-results', { label: 'Nothing for "x" & <y>' }));
    assert.equal(el.getAttribute('role'), 'img');
    assert.equal(el.getAttribute('aria-label'), 'Nothing for "x" & <y>');
    assert.equal(el.getAttribute('aria-hidden'), null);
    assert.equal(parseSvg(illustrationToSvg('no-results', { label: '   ' })).getAttribute('aria-hidden'), 'true');
  });

  it('compact drops detail layers and adds the compact class', () => {
    const full = parseSvg(illustrationToSvg('all-done'));
    const compact = parseSvg(illustrationToSvg('all-done', { compact: true }));
    assert.ok(compact.classList.contains('pl-illus--compact'));
    assert.ok(compact.querySelectorAll('*').length < full.querySelectorAll('*').length);
    assert.equal(compact.querySelector('ellipse[stroke-dasharray]'), null);
  });

  it('motion is opt-out and always disabled under prefers-reduced-motion', () => {
    assert.ok(illustrationToSvg('no-data').includes('pl-illus__float'));
    assert.ok(!illustrationToSvg('no-data', { animated: false }).includes('class="pl-illus__float'));
    assert.match(lib.ILLUSTRATION_CSS, /prefers-reduced-motion:reduce\)\{\.pl-illus__float\{animation:none\}/);
  });

  it('forced-colors rules map fills to Canvas and strokes to CanvasText', () => {
    assert.match(lib.ILLUSTRATION_CSS, /@media \(forced-colors:active\)/);
    assert.match(lib.ILLUSTRATION_CSS, /fill:Canvas/);
    assert.match(lib.ILLUSTRATION_CSS, /stroke:CanvasText/);
    const core = readFileSync(join(root, '../core/src/parts/empty-states.css'), 'utf8');
    assert.match(core, /forced-colors: active/);
  });

  it('styles: false omits the embedded <style>', () => {
    assert.ok(illustrationToSvg('offline').includes('<style>'));
    assert.ok(!illustrationToSvg('offline', { styles: false }).includes('<style>'));
    assert.equal(illustrationTree('offline', { styles: false }).children[0].tag !== 'style', true);
  });

  it('resolvePalette maps Pelagic theme tokens for React Native', async () => {
    const { getTheme } = await import(pathToFileURL(join(root, '../core/tokens.js')).href);
    const dark = getTheme('dark', 'teal');
    const p = resolvePalette(dark);
    assert.equal(p.accent, dark.primary);
    assert.equal(p.paper, dark.surface);
    assert.equal(p.ink, dark.textMuted);
    assert.match(p.edge, /^#[0-9a-f]{6}$/);
    assert.equal(resolvePalette({}, { accent: '#ff0000' }).accent, '#ff0000');
  });

  it('standalone SVG files are generated for every scene', () => {
    for (const name of ILLUSTRATION_NAMES) assert.ok(existsSync(join(root, 'dist/svg', `${name}.svg`)), name);
  });
});

describe('framework entry points', () => {
  it('React: named components render decorative inline SVG, label → role="img"', async () => {
    const { createElement } = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const r = await import(dist('react.js'));
    const html = renderToStaticMarkup(createElement(r.NoResultsIllustration, { compact: true, style: { maxWidth: 80 } }));
    const el = parseSvg(html);
    assert.equal(el.getAttribute('aria-hidden'), 'true');
    assert.ok(el.classList.contains('pl-illus--compact'));
    assert.match(el.getAttribute('style'), /max-width:80px/);
    assert.ok(el.querySelector('[stroke-width]'), 'kebab-case SVG attributes survive');
    const labelled = parseSvg(renderToStaticMarkup(createElement(r.Illustration, { name: 'offline', label: 'Offline' })));
    assert.equal(labelled.getAttribute('role'), 'img');
    assert.equal(r.ErrorIllustration.displayName, 'ErrorIllustration');
  });

  it('Vue: Illustration and named components render the same SVG', async () => {
    const { createSSRApp, h } = require('vue');
    const { renderToString } = require('vue/server-renderer');
    const v = await import(dist('vue.js'));
    const html = await renderToString(createSSRApp({ render: () => h(v.EmptyInboxIllustration, { label: 'Inbox zero' }) }));
    const el = parseSvg(html);
    assert.equal(el.getAttribute('role'), 'img');
    assert.equal(el.getAttribute('aria-label'), 'Inbox zero');
    assert.equal(el.getAttribute('data-illustration'), 'empty-inbox');
  });

  it('Svelte: the component compiles', () => {
    const { compile } = require('svelte/compiler');
    const source = readFileSync(join(root, 'dist/svelte/Illustration.svelte'), 'utf8');
    assert.ok(compile(source, { generate: 'server' }).js.code.length > 0);
  });

  it('web component renders into light DOM and reacts to attribute changes', async () => {
    const { window } = new JSDOM('<!doctype html><body></body>');
    Object.assign(globalThis, { HTMLElement: window.HTMLElement, customElements: window.customElements, document: window.document });
    try {
      const mod = await import(dist('element.js') + '?jsdom');
      const el = window.document.createElement('pl-illustration');
      el.setAttribute('name', 'not-found');
      window.document.body.append(el);
      assert.equal(el.querySelector('svg').getAttribute('aria-hidden'), 'true');
      el.setAttribute('label', 'Page not found');
      el.setAttribute('compact', '');
      assert.equal(el.querySelector('svg').getAttribute('role'), 'img');
      assert.ok(el.querySelector('svg').classList.contains('pl-illus--compact'));
      el.setAttribute('name', 'bogus');
      assert.equal(el.innerHTML, '');
      assert.equal(typeof mod.defineIllustrationElement, 'function');
    } finally {
      for (const k of ['HTMLElement', 'customElements', 'document']) delete globalThis[k];
    }
  });

  it('React Native: maps the scene to react-native-svg primitives with theme colors', async () => {
    const source = readFileSync(join(root, 'dist/native.js'), 'utf8');
    assert.match(source, /from 'react-native-svg'/);
    // Evaluate the factory without react-native-svg installed by stubbing imports.
    const stub = source
      .replace(/^import \{ createElement \} from 'react';$/m, 'const createElement = (t, p, ...c) => ({ t, p, c });')
      .replace(/^import \* as SvgLib from 'react-native-svg';$/m, 'const SvgLib = { Svg: "Svg", G: "G", Path: "Path", Circle: "Circle", Rect: "Rect", Ellipse: "Ellipse", Line: "Line", Polyline: "Polyline", Polygon: "Polygon" };')
      .replaceAll("'./illustrations.js'", `'${dist('illustrations.js')}'`);
    const mod = await import('data:text/javascript,' + encodeURIComponent(stub));
    const out = mod.NoDataIllustration({ theme: { primary: '#123456', surface: '#000000' } });
    assert.equal(out.t, 'Svg');
    assert.equal(out.p.viewBox, '0 0 240 180');
    assert.equal(out.p.width, 240);
    assert.equal(out.p.importantForAccessibility, 'no-hide-descendants');
    const fills = JSON.stringify(out);
    assert.ok(fills.includes('#123456') && !fills.includes('var('));
    const labelled = mod.Illustration({ name: 'offline', label: 'Offline', compact: true });
    assert.equal(labelled.p.accessibilityLabel, 'Offline');
    assert.equal(labelled.p.width, 96);
    assert.equal(mod.Illustration({ name: 'nope' }), null);
  });

  it('Angular: the partially-compiled directive links with the Angular linker', async () => {
    const ngRequire = createRequire(join(root, '../angular/package.json'));
    let babel;
    let linker;
    try {
      // Use the Babel that @angular/compiler-cli itself depends on (the linker pins its major).
      babel = createRequire(ngRequire.resolve('@angular/compiler-cli/package.json'))('@babel/core');
      linker = await import(pathToFileURL(ngRequire.resolve('@angular/compiler-cli/linker/babel')).href);
    } catch {
      return; // Angular toolchain not installed — skip.
    }
    const source = readFileSync(join(root, 'dist/angular.js'), 'utf8');
    const plugin = linker.default ?? linker.createEs2015LinkerPlugin({ fileSystem: undefined });
    const { code } = await babel.transformAsync(source, { filename: join(root, 'dist/angular.js'), plugins: [plugin], compact: false });
    assert.ok(!code.includes('ɵɵngDeclareDirective'), 'declaration was linked');
    assert.match(code, /ɵɵdefineDirective/);
    assert.match(code, /plIllustration/);
  });
});

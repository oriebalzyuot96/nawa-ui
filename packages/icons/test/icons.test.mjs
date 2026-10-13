// Dependency-free tests (node:test). Run after `npm run build`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = (f) => path.join(ROOT, 'dist', f);
const lib = await import('../dist/icons.js');
const meta = JSON.parse(fs.readFileSync(dist('icons.json'), 'utf8'));
const require = createRequire(import.meta.url);
const tryRequire = (id) => {
  try { return require(id); } catch { return null; }
};

/** Minimal well-formedness check: balanced tags, quoted attributes, single root. */
function assertWellFormed(xml, label) {
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/g;
  let m, roots = 0, consumed = 0;
  while ((m = re.exec(xml))) {
    assert.equal(m.index, consumed, `${label}: unparsable markup near "${xml.slice(consumed, consumed + 40)}"`);
    consumed = re.lastIndex;
    if (m[5] !== undefined) continue;
    const [, close, tag, , self] = m;
    if (close) assert.equal(stack.pop(), tag, `${label}: mismatched </${tag}>`);
    else {
      if (!stack.length) roots += 1;
      if (!self) stack.push(tag);
    }
  }
  assert.equal(consumed, xml.length, `${label}: trailing garbage`);
  assert.equal(stack.length, 0, `${label}: unclosed ${stack.join(',')}`);
  assert.equal(roots, 1, `${label}: expected a single root`);
}

test('library size and naming', () => {
  assert.ok(lib.iconNames.length >= 180, `only ${lib.iconNames.length} icons`);
  assert.equal(new Set(lib.iconNames).size, lib.iconNames.length, 'names are unique');
  for (const n of lib.iconNames) assert.match(n, /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
  assert.ok(lib.solidIconNames.length >= 30, 'at least 30 solid icons');
  for (const c of lib.categories) assert.ok(lib.iconNames.some((n) => lib.icons[n].category === c), `category ${c} empty`);
});

test('IconName union in .d.ts matches the runtime names', () => {
  const dts = fs.readFileSync(dist('icons.d.ts'), 'utf8');
  const block = dts.slice(dts.indexOf('export type IconName ='), dts.indexOf('export type SolidIconName'));
  const names = [...block.matchAll(/\| "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(names, [...lib.iconNames]);
  const react = fs.readFileSync(dist('react/index.d.ts'), 'utf8');
  for (const n of lib.iconNames) {
    const comp = n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('') + 'Icon';
    assert.ok(react.includes(`export declare const ${comp}: IconComponent;`), `missing ${comp}`);
  }
});

test('every icon renders well-formed SVG in every variant', () => {
  for (const name of lib.iconNames) {
    for (const variant of ['outline', 'duotone', 'solid']) {
      const svg = lib.iconToSvg(name, { variant, size: 20 });
      assertWellFormed(svg, `${name}/${variant}`);
      assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="20" height="20" viewBox="0 0 24 24"/);
      assert.ok(!/transform=/.test(svg), `${name}: no transforms`);
      const expected = variant === 'solid' && !lib.icons[name].solid ? 'duotone' : variant;
      assert.ok(svg.includes(`pl-icon--${expected}`), `${name}: ${variant} resolves to ${expected}`);
    }
  }
});

test('outline layer never fills; duotone layer is a separate soft group', () => {
  for (const name of lib.iconNames) {
    const ic = lib.icons[name];
    for (const [, attrs] of ic.outline) assert.ok(!('fill' in attrs) && !('fill-rule' in attrs), `${name} outline fill`);
    const duo = lib.iconToSvg(name, { variant: 'duotone' });
    if (ic.duotone.length) {
      assert.ok(duo.includes('<g class="pl-icon__duo" fill="currentColor" fill-opacity="0.22" stroke="none">'), name);
      // Duotone sits behind the outline and never replaces it.
      assert.ok(duo.indexOf('pl-icon__duo') < duo.lastIndexOf('</g>'));
    }
    // The outline markup is present unchanged after the duotone group.
    const outlineInner = lib.iconToSvg(name).replace(/^<svg[^>]*>/, '').replace('</svg>', '');
    assert.ok(duo.endsWith(outlineInner + '</svg>'), name);
  }
});

test('decorative by default', () => {
  const svg = lib.iconToSvg('search');
  assert.match(svg, / aria-hidden="true"/);
  assert.match(svg, / focusable="false"/);
  assert.doesNotMatch(svg, /role=|<title|aria-labelledby/);
});

test('labelled icons expose role=img with a <title> referenced by aria-labelledby', () => {
  for (const key of ['title', 'label']) {
    const svg = lib.iconToSvg('bell', { [key]: 'Notifications & "alerts"', id: 'x1' });
    assert.match(svg, / role="img"/);
    assert.doesNotMatch(svg, /aria-hidden/);
    const id = /aria-labelledby="([^"]+)"/.exec(svg)[1];
    assert.ok(svg.includes(`<title id="${id}">Notifications &amp; "alerts"</title>`), svg);
    assertWellFormed(svg, 'labelled');
  }
  // unique ids when no id is given
  const a = /aria-labelledby="([^"]+)"/.exec(lib.iconToSvg('bell', { title: 'a' }))[1];
  const b = /aria-labelledby="([^"]+)"/.exec(lib.iconToSvg('bell', { title: 'b' }))[1];
  assert.notEqual(a, b);
});

test('solid icons knock details out with a uniquely-id mask', () => {
  const svg = lib.iconToSvg('check-circle', { variant: 'solid', id: 'abc' });
  assert.ok(svg.includes('<mask id="abc-cut"'));
  assert.ok(svg.includes('mask="url(#abc-cut)"'));
});

test('RTL flip flags', () => {
  const flipped = ['arrow-right', 'arrow-left', 'chevron-left', 'chevron-right', 'undo', 'redo', 'send', 'reply', 'log-out', 'external-link'];
  for (const n of flipped) {
    assert.equal(lib.icons[n].rtlFlip, true, n);
    assert.match(lib.iconToSvg(n), /pl-icon--flip-rtl/);
  }
  for (const n of ['arrow-up', 'arrow-down', 'search', 'clock', 'text-direction-rtl', 'list-ordered']) {
    assert.ok(!lib.icons[n].rtlFlip, n);
    assert.doesNotMatch(lib.iconToSvg(n), /flip-rtl/);
  }
  assert.doesNotMatch(lib.iconToSvg('arrow-right', { flipRtl: false }), /flip-rtl/);
  assert.deepEqual([...lib.rtlFlipIconNames], lib.iconNames.filter((n) => lib.icons[n].rtlFlip));
  const css = fs.readFileSync(dist('pelagic-icons.css'), 'utf8');
  assert.ok(css.includes("[dir='rtl'] .pl-icon--flip-rtl { transform: scaleX(-1); }"));
});

test('sprite contains every symbol', () => {
  const sprite = fs.readFileSync(dist('sprite.svg'), 'utf8');
  assertWellFormed(sprite.replace(/<!--[\s\S]*?-->/g, ''), 'sprite');
  const ids = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
  for (const n of lib.iconNames) {
    assert.ok(ids.has(`pl-${n}`), `pl-${n}`);
    assert.ok(ids.has(`pl-${n}-duotone`), `pl-${n}-duotone`);
    assert.equal(ids.has(`pl-${n}-solid`), !!lib.icons[n].solid, `pl-${n}-solid`);
  }
  assert.equal(ids.size, lib.iconNames.length * 2 + lib.solidIconNames.length);
});

test('icons.json metadata mirrors the data', () => {
  assert.equal(meta.count, lib.iconNames.length);
  assert.deepEqual(meta.icons.map((i) => i.name), [...lib.iconNames]);
  for (const i of meta.icons) {
    const ic = lib.icons[i.name];
    assert.equal(i.category, ic.category);
    assert.deepEqual(i.tags, [...ic.tags]);
    assert.ok(i.tags.length >= 2);
    assert.equal(i.rtlFlip, !!ic.rtlFlip);
  }
});

test('web component module is import-safe without a DOM', async () => {
  const el = await import('../dist/element.js');
  assert.equal(typeof el.PlIconElement, 'function');
});

const React = tryRequire('react');
const ReactDOMServer = tryRequire('react-dom/server');
test('React components render (SSR smoke)', { skip: !(React && ReactDOMServer) && 'react not installed' }, async () => {
  const r = await import('../dist/react/index.js');
  const h = React.createElement;
  const a = ReactDOMServer.renderToStaticMarkup(h(r.SearchIcon, { size: 20, className: 'x', 'data-test': 'y' }));
  assert.match(a, /^<svg[^>]* width="20"/);
  assert.match(a, /class="pl-icon pl-icon-search pl-icon--outline x"/);
  assert.match(a, /aria-hidden="true"/);
  assert.match(a, /data-test="y"/);
  const b = ReactDOMServer.renderToStaticMarkup(h(r.Icon, { name: 'bell', variant: 'duotone', title: 'Alerts' }));
  assert.match(b, /role="img"/);
  assert.match(b, /<title id="([^"]+)">Alerts<\/title>/);
  assert.equal(/aria-labelledby="([^"]+)"/.exec(b)[1], /<title id="([^"]+)"/.exec(b)[1]);
  assert.match(b, /fill-opacity="0.22"/);
  const c = ReactDOMServer.renderToStaticMarkup(h(r.HomeIcon, { variant: 'solid', 'aria-label': 'Home' }));
  assert.match(c, /<mask id="[^"]+"/);
  assert.doesNotMatch(c, /aria-hidden/);
  assert.ok(typeof r.SearchIcon.displayName === 'string');
  const ref = React.createRef();
  ReactDOMServer.renderToStaticMarkup(h(r.SearchIcon, { ref }));
});

const vueSsr = tryRequire('@vue/server-renderer');
test('Vue components render (SSR smoke)', { skip: !vueSsr && 'vue not installed' }, async () => {
  const { createSSRApp, h } = await import('vue');
  const v = await import('../dist/vue/index.js');
  const app = createSSRApp({
    render: () => h('div', [
      h(v.SearchIcon, { size: 16, class: 'extra' }),
      h(v.Icon, { name: 'bell', variant: 'duotone', title: 'Alerts' }),
      h(v.Icon, { name: 'arrow-right', 'aria-label': 'Next' }),
    ]),
  });
  const html = await vueSsr.renderToString(app);
  assert.match(html, /class="pl-icon pl-icon-search pl-icon--outline extra"/);
  assert.match(html, /width="16"/);
  assert.match(html, /<title id="[^"]+">Alerts<\/title>/);
  assert.match(html, /<title id="[^"]+">Next<\/title>/);
  assert.doesNotMatch(html, /aria-label=/);
  assert.match(html, /pl-icon--flip-rtl/);
});

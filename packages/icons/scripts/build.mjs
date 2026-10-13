#!/usr/bin/env node
// Orca Icons build: validates every source icon and generates all targets.
// Zero dependencies — Node >= 18.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pathPoints } from './svg-path.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

export const CATEGORIES = [
  'navigation', 'actions', 'status', 'communication', 'files', 'media', 'commerce', 'data',
  'devices', 'people', 'time', 'editor', 'layout', 'places', 'social', 'orca',
];
const STROKE_HALF = 1.75 / 2;
const TAGS = new Set(['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon']);
const GEOMETRY = {
  path: ['d'], circle: ['cx', 'cy', 'r'], rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  ellipse: ['cx', 'cy', 'rx', 'ry'], line: ['x1', 'y1', 'x2', 'y2'], polyline: ['points'], polygon: ['points'],
};
const FORBIDDEN_ATTRS = /^(transform|style|class|id|on\w+|href|xlink:href|filter|clip-path|mask)$/i;

// ---------------------------------------------------------------------------
// Parsing & validation
// ---------------------------------------------------------------------------
function parseElement(str, where) {
  const m = /^<(\w+)((?:\s+[\w:-]+="[^"]*")*)\s*\/>$/.exec(str.trim());
  if (!m) throw new Error(`${where}: not a self-closing SVG element: ${str}`);
  const [, tag, rest] = m;
  if (!TAGS.has(tag)) throw new Error(`${where}: <${tag}> is not allowed`);
  const attrs = {};
  for (const [, k, v] of rest.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    if (FORBIDDEN_ATTRS.test(k)) throw new Error(`${where}: attribute "${k}" is not allowed (no transforms/styles/ids)`);
    if (k in attrs) throw new Error(`${where}: duplicate attribute ${k}`);
    attrs[k] = v;
  }
  for (const k of Object.keys(attrs)) {
    if (!GEOMETRY[tag].includes(k) && k !== 'fill-rule') throw new Error(`${where}: unexpected attribute "${k}" on <${tag}>`);
  }
  return [tag, attrs];
}

function points(node) {
  const [tag, a] = node;
  const num = (k) => Number(a[k] ?? 0);
  switch (tag) {
    case 'path': return pathPoints(a.d);
    case 'circle': return [[num('cx') - num('r'), num('cy') - num('r')], [num('cx') + num('r'), num('cy') + num('r')]];
    case 'ellipse': return [[num('cx') - num('rx'), num('cy') - num('ry')], [num('cx') + num('rx'), num('cy') + num('ry')]];
    case 'rect': return [[num('x'), num('y')], [num('x') + num('width'), num('y') + num('height')]];
    case 'line': return [[num('x1'), num('y1')], [num('x2'), num('y2')]];
    default: {
      const v = a.points.trim().split(/[\s,]+/).map(Number);
      const out = [];
      for (let i = 0; i < v.length; i += 2) out.push([v[i], v[i + 1]]);
      return out;
    }
  }
}

function bbox(nodes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of nodes) {
    for (const [x, y] of points(n)) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`non-finite coordinate in <${n[0]}>`);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  return { x0, y0, x1, y1 };
}

export async function loadIcons({ strict = true } = {}) {
  const dir = path.join(SRC, 'icons');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
  const errors = [];
  const warnings = [];
  const icons = [];
  const names = new Set();
  for (const file of files) {
    const where = `src/icons/${file}`;
    try {
      const mod = await import(pathToFileURL(path.join(dir, file)).href + `?t=${Date.now()}`);
      const src = mod.default;
      if (!src || typeof src !== 'object') throw new Error(`${where}: missing default export`);
      const { name, category, tags, rtlFlip, outline, duotone, solid } = src;
      const extra = Object.keys(src).filter((k) => !['name', 'category', 'tags', 'rtlFlip', 'outline', 'duotone', 'solid'].includes(k));
      if (extra.length) throw new Error(`${where}: unknown keys ${extra.join(', ')}`);
      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name || '')) throw new Error(`${where}: name must be kebab-case`);
      if (`${name}.js` !== file) throw new Error(`${where}: file name must match icon name "${name}"`);
      if (names.has(name)) throw new Error(`${where}: duplicate icon name "${name}"`);
      names.add(name);
      if (!CATEGORIES.includes(category)) throw new Error(`${where}: unknown category "${category}"`);
      if (!Array.isArray(tags) || tags.length < 2 || tags.some((t) => typeof t !== 'string' || !t.trim()))
        throw new Error(`${where}: needs at least two non-empty tags`);
      if (rtlFlip !== undefined && typeof rtlFlip !== 'boolean') throw new Error(`${where}: rtlFlip must be boolean`);
      if (!Array.isArray(outline) || !outline.length) throw new Error(`${where}: outline layer is required`);
      if (!Array.isArray(duotone)) throw new Error(`${where}: duotone must be an array (may be empty)`);

      const o = outline.map((s, i) => parseElement(s, `${where} outline[${i}]`));
      for (const [tag, a] of o) if ('fill-rule' in a) throw new Error(`${where}: outline <${tag}> must not carry fill rules (stroke-only layer)`);
      const d = duotone.map((s, i) => parseElement(s, `${where} duotone[${i}]`));
      let s;
      if (solid !== undefined) {
        if (!solid || !Array.isArray(solid.fill) || !solid.fill.length) throw new Error(`${where}: solid.fill is required`);
        s = { fill: solid.fill.map((e, i) => parseElement(e, `${where} solid.fill[${i}]`)) };
        if (solid.line) s.line = solid.line.map((e, i) => parseElement(e, `${where} solid.line[${i}]`));
        if (solid.cut) s.cut = solid.cut.map((e, i) => parseElement(e, `${where} solid.cut[${i}]`));
      }
      // Geometry: hard limit = canvas, soft limit = 2px live-area padding (stroke included).
      const b = bbox(o);
      if (b.x0 < 0 || b.y0 < 0 || b.x1 > 24 || b.y1 > 24) throw new Error(`${where}: outline exceeds the 24x24 canvas`);
      const lo = 2 - 0.2, hi = 22 + 0.2; // small tolerance for round caps
      if (b.x0 - STROKE_HALF < lo || b.y0 - STROKE_HALF < lo || b.x1 + STROKE_HALF > hi || b.y1 + STROKE_HALF > hi)
        warnings.push(`${name}: stroke reaches outside the 2px live-area padding (${[b.x0, b.y0, b.x1, b.y1].map((v) => v.toFixed(2)).join(', ')})`);
      if (d.length) {
        const db = bbox(d);
        if (db.x0 < 2 || db.y0 < 2 || db.x1 > 22 || db.y1 > 22)
          errors.push(`${where}: duotone layer leaves the 20x20 live area`);
      }
      icons.push({ name, category, tags: [...new Set(tags)], rtlFlip: !!rtlFlip, outline: o, duotone: d, solid: s });
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (strict && errors.length) {
    throw new Error(`Icon validation failed:\n  - ${errors.join('\n  - ')}`);
  }
  return { icons, errors, warnings };
}

// ---------------------------------------------------------------------------
// Generation helpers
// ---------------------------------------------------------------------------
export const pascal = (name) => name.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
export const componentName = (name) => `${pascal(name)}Icon`;
const ident = (name) => `i_${name.replace(/-/g, '_')}`;
const json = (v) => JSON.stringify(v);

const written = new Set();
function write(rel, content) {
  const file = path.join(DIST, rel);
  written.add(path.normalize(file));
  // Only touch files whose content changed: keeps rebuilds fast on Windows/AV.
  try {
    if (fs.readFileSync(file, 'utf8') === content) return;
  } catch { /* new file */ }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function removeStale(dir = DIST) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) removeStale(p);
    else if (!written.has(path.normalize(p))) fs.rmSync(p);
  }
}
const runtime = (f) => fs.readFileSync(path.join(SRC, 'runtime', f), 'utf8');
const BANNER = `// @orca-ui/icons v${pkg.version} — generated by scripts/build.mjs. Do not edit.\n`;

function iconData(ic) {
  const o = { name: ic.name, category: ic.category, tags: ic.tags };
  if (ic.rtlFlip) o.rtlFlip = true;
  o.outline = ic.outline;
  o.duotone = ic.duotone;
  if (ic.solid) o.solid = ic.solid;
  return o;
}

// The same tree helpers are used to build the sprite at build time.
const core = await import(pathToFileURL(path.join(SRC, 'runtime', 'core.js')).href);

function symbol(ic, variant) {
  const tree = core.iconTree(iconData(ic), { variant, id: `oc-${ic.name}-${variant}` });
  const children = tree[2].filter((c) => c[0] !== 'title');
  const id = variant === 'outline' ? `oc-${ic.name}` : `oc-${ic.name}-${variant}`;
  const g = ['g', { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, children];
  return core.nodeToString(['symbol', { id, viewBox: '0 0 24 24' }, [g]]);
}

// ---------------------------------------------------------------------------
export async function build() {
  const { icons, warnings } = await loadIcons();
  written.clear();
  fs.mkdirSync(DIST, { recursive: true });

  const names = icons.map((i) => i.name);
  const solidNames = icons.filter((i) => i.solid).map((i) => i.name);
  const flipNames = icons.filter((i) => i.rtlFlip).map((i) => i.name);

  // 1. core + per-icon data modules -----------------------------------------
  write('core.js', BANNER + runtime('core.js'));
  write('core.d.ts', BANNER + `export * from './icons.js';\n`);
  const iconDts = `import type { IconData } from '../icons.js';\ndeclare const icon: IconData;\nexport default icon;\n`;
  for (const ic of icons) {
    write(`icons/${ic.name}.js`, `${BANNER}export default /*#__PURE__*/ Object.freeze(${json(iconData(ic))});\n`);
    write(`icons/${ic.name}.d.ts`, iconDts);
  }

  // 2. icons.js + .d.ts -------------------------------------------------------
  let js = BANNER;
  js += `import { iconTree, nodeToString, iconParts } from './core.js';\n`;
  for (const ic of icons) js += `import ${ident(ic.name)} from './icons/${ic.name}.js';\n`;
  js += `\nexport * from './core.js';\n`;
  js += `export const icons = /*#__PURE__*/ Object.freeze({\n${icons.map((i) => `  ${json(i.name)}: ${ident(i.name)},`).join('\n')}\n});\n`;
  js += `export const iconNames = /*#__PURE__*/ Object.freeze(${json(names)});\n`;
  js += `export const solidIconNames = /*#__PURE__*/ Object.freeze(${json(solidNames)});\n`;
  js += `export const rtlFlipIconNames = /*#__PURE__*/ Object.freeze(${json(flipNames)});\n`;
  js += `export const categories = /*#__PURE__*/ Object.freeze(${json(CATEGORIES)});\n`;
  js += `const has = Object.prototype.hasOwnProperty;\n`;
  js += `export function isIconName(name) { return typeof name === 'string' && has.call(icons, name); }\n`;
  js += `export function getIcon(name) { return isIconName(name) ? icons[name] : undefined; }\n`;
  js += `function need(name) {\n  const icon = getIcon(name);\n  if (!icon) throw new Error(\`[orca-icons] Unknown icon "\${name}"\`);\n  return icon;\n}\n`;
  js += `/** Render an icon to an SVG string. */\nexport function iconToSvg(name, options) { return nodeToString(iconTree(need(name), options)); }\n`;
  js += `/** Root attributes + inner markup for an icon. */\nexport function iconToParts(name, options) { return iconParts(need(name), options); }\n`;
  write('icons.js', js);

  const union = (arr) => arr.map((n) => `  | ${json(n)}`).join('\n');
  let dts = BANNER;
  dts += `export type IconName =\n${union(names)};\n\n`;
  dts += `export type SolidIconName =\n${union(solidNames)};\n\n`;
  dts += `export type IconCategory =\n${union(CATEGORIES)};\n\n`;
  dts += `export type IconVariant = 'outline' | 'duotone' | 'solid';\n`;
  dts += `/** Render tree: text, or [tag, attributes, children]. */\n`;
  dts += `export type IconNode = string | [tag: string, attrs: Record<string, string>, children?: IconNode[]];\n`;
  dts += `export interface IconData {\n  readonly name: IconName;\n  readonly category: IconCategory;\n  readonly tags: readonly string[];\n  /** Mirror horizontally in right-to-left contexts. */\n  readonly rtlFlip?: boolean;\n  readonly outline: readonly IconNode[];\n  readonly duotone: readonly IconNode[];\n  readonly solid?: { readonly fill: readonly IconNode[]; readonly line?: readonly IconNode[]; readonly cut?: readonly IconNode[] };\n}\n`;
  dts += `export interface IconOptions {\n  /** Default 'outline'. 'solid' falls back to 'duotone' for icons without solid art. */\n  variant?: IconVariant;\n  /** Width/height (number = px). Default 24. */\n  size?: number | string;\n  /** Accessible name. When set the icon gets role="img" and a <title>; otherwise it is aria-hidden. */\n  title?: string;\n  /** Alias of title. */\n  label?: string;\n  className?: string;\n  /** Default 1.75. */\n  strokeWidth?: number | string;\n  /** Override the icon's RTL flip flag. */\n  flipRtl?: boolean;\n  spin?: boolean;\n  /** Stable id prefix used for <title>/<mask> references (SSR). */\n  id?: string;\n  /** Extra root attributes. */\n  attrs?: Record<string, string | number | boolean | null | undefined>;\n}\n`;
  dts += `export declare const SVG_NS: string;\nexport declare const STROKE_WIDTH: number;\nexport declare const DUOTONE_OPACITY: number;\nexport declare const VARIANTS: readonly IconVariant[];\n`;
  dts += `export declare const icons: Readonly<Record<IconName, IconData>>;\n`;
  dts += `export declare const iconNames: readonly IconName[];\nexport declare const solidIconNames: readonly SolidIconName[];\nexport declare const rtlFlipIconNames: readonly IconName[];\nexport declare const categories: readonly IconCategory[];\n`;
  dts += `export declare function isIconName(name: unknown): name is IconName;\n`;
  dts += `export declare function getIcon(name: string): IconData | undefined;\n`;
  dts += `export declare function iconToSvg(name: IconName, options?: IconOptions): string;\n`;
  dts += `export declare function iconToParts(name: IconName, options?: IconOptions): { attrs: Record<string, string>; inner: string };\n`;
  dts += `export declare function iconTree(icon: IconData, options?: IconOptions): IconNode;\n`;
  dts += `export declare function iconParts(icon: IconData, options?: IconOptions): { attrs: Record<string, string>; inner: string };\n`;
  dts += `export declare function iconDataToSvg(icon: IconData, options?: IconOptions): string;\n`;
  dts += `export declare function nodeToString(node: IconNode): string;\n`;
  dts += `export declare function resolveVariant(icon: IconData, variant?: IconVariant): IconVariant;\n`;
  dts += `export declare function nextId(): string;\nexport declare function safeId(raw: string): string;\n`;
  write('icons.d.ts', dts);

  // 3. metadata ---------------------------------------------------------------
  const meta = {
    name: pkg.name,
    version: pkg.version,
    count: icons.length,
    categories: CATEGORIES.map((c) => ({ name: c, count: icons.filter((i) => i.category === c).length })),
    icons: icons.map((i) => ({
      name: i.name,
      component: componentName(i.name),
      category: i.category,
      tags: i.tags,
      rtlFlip: i.rtlFlip,
      variants: i.solid ? ['outline', 'duotone', 'solid'] : ['outline', 'duotone'],
    })),
  };
  write('icons.json', JSON.stringify(meta, null, 2) + '\n');

  // 4. sprite + css -----------------------------------------------------------
  let sprite = `<svg xmlns="${core.SVG_NS}" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">\n`;
  sprite += `<!-- @orca-ui/icons v${pkg.version} sprite: #oc-<name> (outline), #oc-<name>-duotone, #oc-<name>-solid -->\n`;
  for (const ic of icons) {
    sprite += symbol(ic, 'outline') + '\n' + symbol(ic, 'duotone') + '\n';
    if (ic.solid) sprite += symbol(ic, 'solid') + '\n';
  }
  sprite += `</svg>\n`;
  write('sprite.svg', sprite);
  write('orca-icons.css', runtime('orca-icons.css'));

  // 5. web component --------------------------------------------------------
  write('element.js', BANNER + runtime('element.js'));
  write('element.d.ts', BANNER + runtime('element.d.ts'));

  // 6. React -------------------------------------------------------------------
  const perIcon = (fn) => icons.map((ic) => fn(ic)).join('\n');
  let react = BANNER + runtime('react.js') + '\n';
  react += perIcon((ic) => `import ${ident(ic.name)} from '../icons/${ic.name}.js';`) + '\n';
  react += perIcon((ic) => `export const ${componentName(ic.name)} = /*#__PURE__*/ createIcon(${ident(ic.name)}, ${json(componentName(ic.name))});`) + '\n';
  write('react/index.js', react);
  write('react/index.d.ts', BANNER + runtime('react.d.ts') + '\n' + perIcon((ic) => `export declare const ${componentName(ic.name)}: IconComponent;`) + '\n');

  // 7. Vue ---------------------------------------------------------------------
  let vue = BANNER + runtime('vue.js') + '\n';
  vue += perIcon((ic) => `import ${ident(ic.name)} from '../icons/${ic.name}.js';`) + '\n';
  vue += perIcon((ic) => `export const ${componentName(ic.name)} = /*#__PURE__*/ createIcon(${ident(ic.name)}, ${json(componentName(ic.name))});`) + '\n';
  write('vue/index.js', vue);
  write('vue/index.d.ts', BANNER + runtime('vue.d.ts') + '\n' + perIcon((ic) => `export declare const ${componentName(ic.name)}: IconComponent;`) + '\n');

  // 8. React Native ------------------------------------------------------------
  let rn = BANNER + runtime('react-native.js') + '\n';
  rn += perIcon((ic) => `import ${ident(ic.name)} from '../icons/${ic.name}.js';`) + '\n';
  rn += perIcon((ic) => `export const ${componentName(ic.name)} = /*#__PURE__*/ createIcon(${ident(ic.name)}, ${json(componentName(ic.name))});`) + '\n';
  write('react-native/index.js', rn);
  write('react-native/index.d.ts', BANNER + runtime('react-native.d.ts') + '\n' + perIcon((ic) => `export declare const ${componentName(ic.name)}: IconComponent;`) + '\n');

  // 9. Svelte, Astro, Angular (thin wrappers) ---------------------------------
  write('svelte/Icon.svelte', runtime('Icon.svelte'));
  write('svelte/index.js', BANNER + `export { default as Icon } from './Icon.svelte';\nexport { icons, iconNames, iconToSvg } from '../icons.js';\n`);
  write('svelte/index.d.ts', BANNER + runtime('svelte.d.ts'));
  write('astro/Icon.astro', runtime('Icon.astro'));
  // The "./astro" export resolves to Icon.astro itself, so its types must expose a default export too.
  write('astro/index.d.ts', BANNER + `export { default, default as Icon } from './Icon.astro';\n`);
  write('angular/index.js', BANNER + runtime('angular.js'));
  write('angular/index.d.ts', BANNER + runtime('angular.d.ts'));
  removeStale();

  return { icons, warnings };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const t0 = Date.now();
  try {
    const { icons, warnings } = await build();
    for (const w of warnings) console.warn(`  warn: ${w}`);
    const byCat = CATEGORIES.map((c) => `${c} ${icons.filter((i) => i.category === c).length}`).join(', ');
    console.log(`@orca-ui/icons: built ${icons.length} icons (${icons.filter((i) => i.solid).length} with solid) in ${Date.now() - t0}ms`);
    console.log(`  ${byCat}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

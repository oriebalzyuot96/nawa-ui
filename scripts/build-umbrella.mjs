// Builds the single installable package `pelagic` (packages/pelagic) from the built @pelagic-ui/* packages,
// so developers can `npm i pelagic` and import every target from one package:
//   pelagic/style.css, pelagic/core/theme, pelagic/react, pelagic/vue, pelagic/svelte, pelagic/angular,
//   pelagic/astro/components/Button, pelagic/react-native, pelagic/three, pelagic/icons/react, ...
// Each package's export map is copied under its prefix, and cross-package imports ('@pelagic-ui/x/y')
// inside the copied files are rewritten to relative paths. Run after building the packages.
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const umbrella = join(root, 'packages/pelagic');
const out = join(umbrella, 'dist');

/** [prefix, package dir, publish dir relative to the package (Angular publishes its ng-packagr output)] */
const packages = [
  ['core', 'packages/core', '.'],
  ['react', 'packages/react', '.'],
  ['vue', 'packages/vue', '.'],
  ['svelte', 'packages/svelte', '.'],
  ['astro', 'packages/astro', '.'],
  ['angular', 'packages/angular', 'dist'],
  ['react-native', 'packages/react-native', '.'],
  ['three', 'packages/three', '.'],
  ['icons', 'packages/icons', '.'],
  ['illustrations', 'packages/illustrations', '.'],
];

const toPosix = (p) => p.split(sep).join('/');
const strip = (p) => p.replace(/^\.\//, '');

rmSync(out, { recursive: true, force: true });

const exportsMap = {
  './style.css': './dist/core/pelagic.css',
  './package.json': './package.json',
};
const peers = {};
const deps = {};
/** name -> { prefix, exports } used to resolve '@pelagic-ui/<pkg>/<sub>' imports */
const resolvers = new Map();

/** Prefix every target in an export condition object or string. */
function prefixTargets(value, prefix) {
  if (typeof value === 'string') return value.startsWith('./') ? `./dist/${prefix}/${strip(value)}` : value;
  if (value === null) return null;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, prefixTargets(v, prefix)]));
}

for (const [prefix, dir, publishDir] of packages) {
  const pkgDir = join(root, dir, publishDir);
  const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
  const files = manifest.files ?? ['.'];
  for (const f of files) {
    const src = join(pkgDir, f);
    if (!existsSync(src)) {
      if (f.includes('*')) continue;
      throw new Error(`${manifest.name}: "${f}" is missing. Build the package first.`);
    }
    cpSync(src, join(out, prefix, f), { recursive: true, filter: (p) => !/[\\/](node_modules|__tests__|test)([\\/]|$)/.test(p) });
  }
  if (publishDir !== '.') {
    // ng-packagr output: copy everything it produced except its manifest and README.
    for (const entry of readdirSync(pkgDir)) {
      if (entry === 'package.json' || entry === 'README.md') continue;
      cpSync(join(pkgDir, entry), join(out, prefix, entry), { recursive: true });
    }
  }

  const exp = manifest.exports ?? { '.': `./${strip(manifest.module ?? manifest.main ?? 'index.js')}` };
  for (const [sub, target] of Object.entries(exp)) {
    if (sub === './package.json') continue;
    const key = sub === '.' ? `./${prefix}` : `./${prefix}/${strip(sub)}`;
    exportsMap[key] = prefixTargets(target, prefix);
  }
  resolvers.set(manifest.name, { prefix, exports: exp });

  for (const [name, range] of Object.entries(manifest.peerDependencies ?? {})) peers[name] = range;
  for (const [name, range] of Object.entries(manifest.dependencies ?? {})) {
    if (!name.startsWith('@pelagic-ui/')) deps[name] = range;
  }
}

/** Resolve '@pelagic-ui/<pkg>[/sub]' to a file inside dist using that package's export map. */
function resolveSpecifier(spec) {
  const m = /^(@pelagic-ui\/[^/]+)(?:\/(.+))?$/.exec(spec);
  if (!m) return null;
  const info = resolvers.get(m[1]);
  if (!info) return null;
  const subKey = m[2] ? `./${m[2]}` : '.';
  let target = info.exports[subKey];
  if (!target) {
    // Pattern exports like "./components/*"
    for (const [k, v] of Object.entries(info.exports)) {
      if (k.endsWith('*') && subKey.startsWith(k.slice(0, -1))) {
        const rest = subKey.slice(k.length - 1);
        target = JSON.parse(JSON.stringify(v).split('*').join(rest));
        break;
      }
    }
  }
  if (!target) return null;
  const pick = (t) => (typeof t === 'string' ? t : t.import ?? t.svelte ?? t.default ?? t.types ?? pick(Object.values(t)[0]));
  return join(out, info.prefix, strip(pick(target)));
}

const rewritten = [];
(function walk(d) {
  for (const entry of readdirSync(d)) {
    const p = join(d, entry);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(m?js|cjs|d\.m?ts|ts|tsx|svelte|astro|vue)$/.test(entry)) continue;
    const text = readFileSync(p, 'utf8');
    if (!text.includes('@pelagic-ui/')) continue;
    const next = text.replace(/(['"])(@pelagic-ui\/[^'"]+)\1/g, (all, q, spec) => {
      const file = resolveSpecifier(spec);
      if (!file) return all;
      let rel = toPosix(relative(dirname(p), file));
      if (!rel.startsWith('.')) rel = `./${rel}`;
      // TypeScript sources import extensionless; keep that style for .ts/.tsx targets.
      if (/\.(ts|tsx)$/.test(entry) && !/\.d\.ts$/.test(entry)) rel = rel.replace(/\.(ts|tsx)$/, '');
      return `${q}${rel}${q}`;
    });
    if (next !== text) {
      writeFileSync(p, next);
      rewritten.push(toPosix(relative(out, p)));
    }
  }
})(out);

const leftovers = [];
(function scan(d) {
  for (const entry of readdirSync(d)) {
    const p = join(d, entry);
    if (statSync(p).isDirectory()) scan(p);
    else if (/\.(m?js|svelte|astro|tsx?)$/.test(entry) && !/\.d\.ts$/.test(entry) && /(['"])@pelagic-ui\//.test(readFileSync(p, 'utf8'))) leftovers.push(toPosix(relative(out, p)));
  }
})(out);
if (leftovers.length) throw new Error(`Unresolved @pelagic-ui imports in:\n  ${leftovers.join('\n  ')}`);

const manifestPath = join(umbrella, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.exports = exportsMap;
manifest.dependencies = Object.fromEntries(Object.entries(deps).sort());
manifest.peerDependencies = Object.fromEntries(Object.entries(peers).sort());
manifest.peerDependenciesMeta = Object.fromEntries(Object.keys(peers).sort().map((n) => [n, { optional: true }]));
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Built packages/pelagic/dist: ${packages.length} packages, ${Object.keys(exportsMap).length} export paths, ${rewritten.length} files rewritten.`);
void posix;

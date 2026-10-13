// Adds explicit file extensions to relative imports in compiled ESM output, so the packages load in
// plain Node.js (SSR, test runners) and not only through bundlers.
//   './components/actions'  -> './components/actions.js'
//   './utils'               -> './utils/index.js' (when it is a directory)
// Usage: node scripts/fix-esm-extensions.mjs <dist dir>
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
const SPEC = /((?:import|export)\s[^'"]*?from\s*|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;

let files = 0;
let rewrites = 0;

function fix(file) {
  const isDts = file.endsWith('.d.ts');
  const text = readFileSync(file, 'utf8');
  const next = text.replace(SPEC, (all, head, q, spec) => {
    if (/\.(m?js|cjs|json|css|svg)$/.test(spec)) return all;
    const base = resolve(dirname(file), spec);
    const ext = isDts ? '.js' : '.js';
    let target = null;
    if (existsSync(`${base}.js`) || existsSync(`${base}.d.ts`)) target = `${spec}${ext}`;
    else if (existsSync(join(base, 'index.js')) || existsSync(join(base, 'index.d.ts'))) target = `${spec}/index${ext}`;
    if (!target) return all;
    rewrites++;
    return `${head}${q}${target}${q}`;
  });
  if (next !== text) {
    writeFileSync(file, next);
    files++;
  }
}

(function walk(d) {
  for (const entry of readdirSync(d)) {
    const p = join(d, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|d\.ts)$/.test(entry)) fix(p);
  }
})(dist);

console.log(`fix-esm-extensions: ${rewrites} imports in ${files} files (${dist})`);

// Custom brand accents for the build (CSS + tokens for React Native and Flutter).
//
//   node packages/core/scripts/build.mjs --brand "#ff6a00" [--brand-name acme] [--neutral "#334155"]
//                                        [--secondary "#0ea5e9"] [--brand-default]
//   node packages/core/scripts/build.mjs --config path/to/pelagic.config.json
//
// Without flags, `pelagic.config.json` in the current directory is used when it exists:
//   { "brands": [{ "name": "acme", "primary": "#ff6a00", "neutral": "#334155", "default": true }] }
//   (or a single object under "brand")
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createTheme } from '../src/theme.js';

function flag(argv, name) {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0) return argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : undefined;
}

/** Brand definitions from CLI flags or pelagic.config.json. Returns [] when there are none. */
export function readBrandConfig(argv = process.argv.slice(2), cwd = process.cwd()) {
  const brand = flag(argv, 'brand');
  if (typeof brand === 'string') {
    return [
      {
        primary: brand,
        name: typeof flag(argv, 'brand-name') === 'string' ? flag(argv, 'brand-name') : 'brand',
        neutral: typeof flag(argv, 'neutral') === 'string' ? flag(argv, 'neutral') : undefined,
        secondary: typeof flag(argv, 'secondary') === 'string' ? flag(argv, 'secondary') : undefined,
        default: flag(argv, 'brand-default') === true,
      },
    ];
  }
  const explicit = flag(argv, 'config');
  const file = typeof explicit === 'string' ? resolve(cwd, explicit) : resolve(cwd, 'pelagic.config.json');
  if (!existsSync(file)) {
    if (typeof explicit === 'string') throw new Error(`Config file not found: ${file}`);
    return [];
  }
  const config = JSON.parse(readFileSync(file, 'utf8'));
  const list = config.brands ?? (config.brand ? [config.brand] : []);
  return list.map((b, i) => ({ name: b.name ?? (i ? `brand-${i + 1}` : 'brand'), ...b }));
}

/** createTheme() for every configured brand, with its `default` flag. */
export function buildBrands(defs) {
  return defs.map((def) => {
    const { default: isDefault, ...opts } = def;
    const theme = createTheme(opts);
    const failed = Object.entries(theme.failures).filter(([, f]) => f.length);
    if (failed.length) throw new Error(`Brand "${theme.name}" does not reach WCAG AA: ${JSON.stringify(failed)}`);
    return { theme, isDefault: !!isDefault };
  });
}

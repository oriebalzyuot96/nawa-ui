// Generates preview/index.html (contact sheet: every scene in light, dark and hc, plus accents,
// tones, sizes and forced-colors) and renders PNGs with headless Edge via puppeteer-core.
// Run after build: node scripts/preview.mjs [--no-shots]
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'preview');
mkdirSync(out, { recursive: true });
const { ILLUSTRATIONS, illustrationToSvg } = await import(pathToFileURL(join(root, 'dist/illustrations.js')).href);

const accents = ['violet', 'teal', 'indigo', 'rose', 'amber', 'emerald', 'slate'];
const grid = (theme) => `
<section class="sheet" data-theme="${theme}" id="sheet-${theme}">
  <header><h2>${theme === 'hc' ? 'High contrast' : theme[0].toUpperCase() + theme.slice(1)}</h2><p>${ILLUSTRATIONS.length} scenes · @pelagic-ui/illustrations</p></header>
  <div class="grid">${ILLUSTRATIONS.map((m) => `<figure class="pl-card cell">${illustrationToSvg(m.name, { animated: false })}<figcaption><b>${m.title}</b><code>${m.name}</code></figcaption></figure>`).join('')}</div>
</section>`;

const tones = ['neutral', 'info', 'success', 'warning', 'danger'];
const demo = `
<section class="sheet" data-theme="light" id="sheet-components">
  <header><h2>EmptyState</h2><p>sizes · tones · split layout · accents</p></header>
  <div class="row">${accents.map((a) => `<div class="mini pl-card" data-accent="${a}">${illustrationToSvg('no-results', { animated: false })}<code>${a}</code></div>`).join('')}</div>
  <div class="row">${accents.map((a) => `<div class="mini pl-card" data-theme="dark" data-accent="${a}">${illustrationToSvg('welcome', { animated: false })}<code>${a}</code></div>`).join('')}</div>
  <div class="demos">
    <div class="pl-card"><div class="pl-empty pl-empty--split"><div class="pl-empty__inner"><div class="pl-empty__media">${illustrationToSvg('no-results', { animated: false })}</div><div class="pl-empty__body"><h3 class="pl-empty__title">No results for “quarterly”</h3><p class="pl-empty__desc">Check the spelling or try a broader term. Filters for status and owner are still applied.</p><div class="pl-empty__actions"><button class="pl-btn pl-btn--primary">Clear filters</button><button class="pl-btn pl-btn--ghost">Search help</button></div></div></div></div></div>
    <div class="tones">${tones.map((t, i) => `<div class="pl-card"><div class="pl-empty pl-empty--compact pl-empty--tone-${t}"><div class="pl-empty__inner"><div class="pl-empty__media">${illustrationToSvg(['no-data', 'offline', 'all-done', 'maintenance', 'error'][i], { compact: true, animated: false })}</div><div class="pl-empty__body"><h3 class="pl-empty__title">tone="${t}"</h3><p class="pl-empty__desc">Compact size</p></div></div></div></div>`).join('')}</div>
    <div class="pl-card" dir="rtl"><div class="pl-empty pl-empty--start"><div class="pl-empty__inner"><div class="pl-empty__media">${illustrationToSvg('empty-inbox', { animated: false })}</div><div class="pl-empty__body"><h3 class="pl-empty__title">صندوق الوارد فارغ</h3><p class="pl-empty__desc">لا توجد رسائل جديدة. align="start" مع اتجاه RTL.</p><div class="pl-empty__actions"><button class="pl-btn pl-btn--primary">رسالة جديدة</button></div></div></div></div></div>
  </div>
</section>`;

const html = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pelagic illustrations — contact sheet</title>
<link rel="stylesheet" href="../../core/pelagic.css" />
<style>
  body { margin: 0; background: #e9edf0; font-family: var(--pl-font); }
  .sheet { padding: 28px 32px 36px; background: var(--pl-surface-alt); color: var(--pl-text); }
  .sheet header { display: flex; align-items: baseline; gap: 16px; margin-bottom: 18px; }
  .sheet h2 { margin: 0; font-size: 20px; }
  .sheet header p { margin: 0; color: var(--pl-text-muted); font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
  .cell { margin: 0; padding: 14px 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; background: var(--pl-surface); }
  .cell svg { max-inline-size: 200px; }
  figcaption { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 12px; }
  figcaption code, .mini code { color: var(--pl-text-muted); font-size: 11px; }
  .row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; margin-bottom: 12px; }
  .mini { padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px; background: var(--pl-surface); color: var(--pl-text); }
  .demos { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-top: 18px; }
  .demos > :first-child { grid-column: 1 / -1; }
  .tones { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; grid-column: 1 / -1; }
  @media (max-width: 640px) {
    .sheet { padding: 20px 16px; }
    .grid, .tones { grid-template-columns: repeat(2, 1fr); }
    .row { grid-template-columns: repeat(4, 1fr); }
    .demos { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
${grid('light')}
${grid('dark')}
${grid('hc')}
${demo}
</body>
</html>
`;
writeFileSync(join(out, 'index.html'), html);
console.log('Wrote preview/index.html');

if (!process.argv.includes('--no-shots')) {
  const require = createRequire('C:/repo/dada/package.json');
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(out, 'index.html')).href, { waitUntil: 'load' });
  for (const id of ['light', 'dark', 'hc', 'components']) {
    const el = await page.$(`#sheet-${id}`);
    await el.screenshot({ path: join(out, `contact-${id}.png`) });
  }
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
  await (await page.$('#sheet-light')).screenshot({ path: join(out, 'contact-forced-colors.png') });
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await (await page.$('#sheet-light')).screenshot({ path: join(out, 'contact-light@2x.png') });
  await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 });
  await (await page.$('#sheet-components')).screenshot({ path: join(out, 'contact-mobile.png') });
  console.log('Wrote preview/contact-{light,light@2x,dark,hc,components,forced-colors,mobile}.png');
  // Edge sometimes keeps the pipe open on Windows; don't let that hang the script.
  await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 3000))]);
  process.exit(0);
}

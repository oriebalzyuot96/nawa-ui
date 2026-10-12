#!/usr/bin/env node
// Writes preview/index.html: a contact sheet of every icon in every variant at
// 16/20/24/32px, on light and dark themes. Query params (handy for screenshots):
//   ?theme=light|dark   ?cat=<category>   ?mode=review (large icons on a 24-grid)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lib = await import(pathToFileURL(path.join(ROOT, 'dist', 'icons.js')).href);
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist', 'icons.json'), 'utf8'));
const css = fs.readFileSync(path.join(ROOT, 'dist', 'orca-icons.css'), 'utf8');

const SIZES = [16, 20, 24, 32];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

let uid = 0;
const svg = (name, variant, size) => lib.iconToSvg(name, { variant, size, id: `p${(uid += 1)}` });

function card(ic) {
  const variants = ic.variants;
  const rows = variants
    .map((v) => `<div class="row"><span class="v">${v[0]}</span>${SIZES.map((s) => `<span class="cell s${s}">${svg(ic.name, v, s)}</span>`).join('')}</div>`)
    .join('');
  const review = variants.map((v) => `<span class="big">${svg(ic.name, v, 72)}</span>`).join('');
  const flags = ic.rtlFlip ? '<span class="flag" title="Mirrors in RTL">RTL</span>' : '';
  return `<figure class="card" data-name="${ic.name}"><div class="sheet">${rows}</div><div class="review">${review}</div><figcaption>${esc(ic.name)}${flags}</figcaption></figure>`;
}

function section(theme) {
  return `<section class="theme ${theme}" data-theme="${theme}"><h2>${theme === 'light' ? 'Light' : 'Dark'}</h2>${meta.categories
    .map((c) => {
      const list = meta.icons.filter((i) => i.category === c.name);
      return `<div class="cat" data-cat="${c.name}"><h3>${c.name} <small>${list.length}</small></h3><div class="grid">${list.map(card).join('')}</div></div>`;
    })
    .join('')}</section>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Orca Icons — contact sheet</title>
<style>
${css}
:root { --accent: #4f46e5; }
* { box-sizing: border-box; }
body { margin: 0; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; background: #f4f4f7; color: #1d1d27; }
header { padding: 20px 24px 8px; }
header h1 { margin: 0 0 4px; font-size: 20px; }
header p { margin: 0; color: #5b5b6b; }
.theme { padding: 8px 24px 24px; }
.theme.light { background: #ffffff; color: #1d1d27; }
.theme.dark { background: #14141c; color: #e8e8f0; }
.theme.dark h3 small, .theme.dark figcaption { color: #9a9aae; }
h2 { font-size: 15px; margin: 16px 0 4px; }
h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; margin: 18px 0 8px; }
h3 small { font-weight: 400; color: #6b6b7b; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(196px, 1fr)); gap: 8px; }
.card { margin: 0; padding: 8px 10px 6px; border-radius: 10px; border: 1px solid rgb(127 127 140 / .22); }
.row { display: flex; align-items: center; gap: 10px; height: 36px; }
.v { width: 10px; font-size: 10px; opacity: .5; text-transform: uppercase; }
.cell { display: inline-flex; width: 32px; justify-content: center; }
.theme.light .oc-icon--duotone { color: #2b2bb0; }
.theme.dark .oc-icon--duotone { color: #a5b4fc; }
figcaption { font-size: 11px; color: #6b6b7b; display: flex; gap: 6px; align-items: center; margin-top: 2px; }
.flag { font-size: 9px; padding: 0 4px; border-radius: 4px; background: rgb(127 127 140 / .2); }
.review { display: none; }
/* Review mode: big icons on a 24-unit grid with the 2px live-area padding marked. */
.mode-review .sheet { display: none; }
.mode-review .review { display: flex; gap: 10px; }
.mode-review .grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.big { width: 72px; height: 72px; display: inline-flex;
  background-image: linear-gradient(rgb(127 127 140 / .14) 1px, transparent 1px), linear-gradient(90deg, rgb(127 127 140 / .14) 1px, transparent 1px);
  background-size: 3px 3px; outline: 1px dashed rgb(127 127 140 / .35); outline-offset: -6px; }
</style>
</head>
<body>
<header>
  <h1>Orca Icons <small>v${meta.version}</small></h1>
  <p>${meta.count} icons · outline + duotone${meta.icons.some((i) => i.variants.includes('solid')) ? ` · ${meta.icons.filter((i) => i.variants.includes('solid')).length} solid` : ''} · rows: o = outline, d = duotone, s = solid · sizes 16 / 20 / 24 / 32 px · 24×24 grid, 1.75 stroke, round caps &amp; joins</p>
</header>
${section('light')}
${section('dark')}
<script>
  const q = new URLSearchParams(location.search);
  if (q.get('mode') === 'review') document.body.classList.add('mode-review');
  const theme = q.get('theme');
  if (theme) document.querySelectorAll('.theme').forEach((s) => { if (s.dataset.theme !== theme) s.remove(); });
  const cat = q.get('cat');
  if (cat) document.querySelectorAll('.cat').forEach((c) => { if (!cat.split(',').includes(c.dataset.cat)) c.remove(); });
</script>
</body>
</html>
`;

fs.mkdirSync(path.join(ROOT, 'preview'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'preview', 'index.html'), html);
console.log(`preview/index.html written (${meta.count} icons, ${(html.length / 1024).toFixed(0)} KB)`);

// Renders public/og.png (1200×630 social preview) from an SVG. Run: node scripts/og.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og.png');

const chip = (x, label) =>
  `<g transform="translate(${x} 470)"><rect width="${label.length * 15 + 36}" height="52" rx="26" fill="#ffffff" fill-opacity="0.14"/><text x="20" y="34" font-size="21" font-weight="700" fill="#ffffff">${label}</text></g>`;

let x = 80;
const chips = ['React', 'Vue', 'Angular', 'Svelte', 'Astro', 'React Native', 'Flutter']
  .map((label) => {
    const svg = chip(x, label);
    x += label.length * 15 + 50;
    return svg;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Segoe UI, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5b34d6"/>
      <stop offset="1" stop-color="#1d0f4a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1030" cy="150" r="250" fill="#ffffff" fill-opacity="0.05"/>
  <g transform="translate(80 90)">
    <rect width="88" height="88" rx="24" fill="#ffffff"/>
    <path d="M26 59C30.7 42.3 40 26.4 56.6 18.7c-2.5 12.6-1.4 26.4 3.9 40.4z" fill="#5b34d6"/>
    <path d="M15 66.5c5.8-4.4 11.5-4.4 17.3 0s11.5 4.4 17.3 0 11.5-4.4 17.3 0" fill="none" stroke="#5b34d6" stroke-width="5" stroke-linecap="round"/>
  </g>
  <text x="196" y="152" font-size="56" font-weight="800" fill="#ffffff">Orca UI</text>
  <text x="80" y="290" font-size="64" font-weight="800" fill="#ffffff">Accessible UI components</text>
  <text x="80" y="370" font-size="64" font-weight="800" fill="#c4b5fd">for every framework.</text>
  <text x="80" y="430" font-size="28" fill="#e4dcff">WCAG 2.2 AA · 21 themes · Dark &amp; high contrast · Skeletons · RTL</text>
  ${chips}
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(out, png);
console.log(`Wrote ${out} (${(png.length / 1024).toFixed(0)} KB)`);

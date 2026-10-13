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
    <g transform="scale(2.75)">
      <path d="M16 5c-4.1 5.1-7.6 9.7-7.6 13.9a7.6 7.6 0 0 0 15.2 0C23.6 14.7 20.1 10.1 16 5z" fill="#5b34d6"/>
      <g fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round">
        <path d="M10.5 17.6q1.375-1.3 2.75 0t2.75 0 2.75 0 2.75 0"/>
        <path d="M12 21.6q1.333-1.15 2.667 0t2.667 0 2.666 0" stroke-opacity="0.6"/>
      </g>
    </g>
  </g>
  <text x="196" y="152" font-size="56" font-weight="800" fill="#ffffff">Pelagic UI</text>
  <text x="80" y="290" font-size="64" font-weight="800" fill="#ffffff">Accessible UI components</text>
  <text x="80" y="370" font-size="64" font-weight="800" fill="#c4b5fd">for every framework.</text>
  <text x="80" y="430" font-size="28" fill="#e4dcff">WCAG 2.2 AA · 21 themes · Dark &amp; high contrast · Skeletons · RTL</text>
  ${chips}
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(out, png);
console.log(`Wrote ${out} (${(png.length / 1024).toFixed(0)} KB)`);

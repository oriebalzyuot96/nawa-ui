// Visual review helper for the docs site: full-page screenshots and a no-horizontal-scroll check.
//
//   SHOT_URL=http://localhost:4533/pelagic-ui/ PUPPETEER_EXECUTABLE_PATH=<chromium> node tests/e2e/screenshots.mjs
//
// Screenshots go to .artifacts/screens/ at the repo root (git-ignored). Options:
//   SHOT_PAGES=",packages/,ar/"   pages relative to SHOT_URL (default: the main pages)
//   SHOT_MOTION=1                  keep animations on (default: reduced motion for stable images)
// Every sitemap page is also loaded at 360px wide; the script exits 1 if any of them scrolls sideways.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', '.artifacts', 'screens');
mkdirSync(out, { recursive: true });

const BASE = (process.env.SHOT_URL ?? 'http://localhost:4533/pelagic-ui/').replace(/\/?$/, '/');
const PAGES = (process.env.SHOT_PAGES ?? ',ar/,packages/,ar/packages/,components/,components/forms/').split(',');
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
];
const MODES = ['light', 'dark'];

const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, headless: true });
const slug = (p) => p.replace(/\/$/, '').replace(/\//g, '_') || 'home';

async function open(url, viewport, mode) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  if (!process.env.SHOT_MOTION) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument((m) => {
    try {
      localStorage.setItem('pelagic-ui-theme', JSON.stringify({ mode: m, accent: 'violet', shape: 'default' }));
    } catch {
      /* ignore */
    }
  }, mode);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  // Scroll through so client:visible islands hydrate and reveal-on-scroll sections show.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 600));
  return { page, errors };
}

for (const p of PAGES) {
  for (const vp of VIEWPORTS) {
    for (const mode of MODES) {
      const { page, errors } = await open(new URL(p, BASE).href, vp, mode);
      const file = join(out, `${slug(p)}--${vp.name}--${mode}.png`);
      await page.screenshot({ path: file, fullPage: true });
      await page.screenshot({ path: file.replace(/\.png$/, '--fold.png') });
      console.log(`saved ${file}${errors.length ? `  (errors: ${errors.join(' | ')})` : ''}`);
      await page.close();
    }
  }
}

// No horizontal scroll at 360px on any page in the sitemap.
const xml = await (await fetch(new URL('sitemap-0.xml', BASE))).text();
const prefix = new URL(BASE).pathname;
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(new URL(m[1]).pathname.slice(prefix.length), BASE).href);
let overflow = 0;
for (const url of urls) {
  const { page } = await open(url, { width: 360, height: 780, isMobile: true, hasTouch: true }, 'light');
  // html/body use overflow-x: clip, so also look for content that pokes past the viewport without a
  // scrolling or clipping ancestor of its own (it would be cut off rather than scroll).
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const vw = root.clientWidth;
    const culprits = [];
    const contained = (el) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).overflowX !== 'visible') return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if ((r.right > vw + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed' && !contained(el)) {
        culprits.push(`${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(' ').slice(0, 2).join('.')} → ${Math.round(r.left)}..${Math.round(r.right)}px`);
        if (culprits.length > 6) break;
      }
    }
    return { wide: root.scrollWidth > vw + 1 || culprits.length > 0, scrollWidth: root.scrollWidth, culprits };
  });
  if (result.wide) {
    overflow += 1;
    console.log(`OVERFLOW ${url}: ${result.scrollWidth}px\n  ${result.culprits.join('\n  ')}`);
  }
  await page.close();
}
console.log(overflow ? `${overflow} page(s) scroll sideways at 360px` : `no horizontal scroll at 360px on ${urls.length} pages`);
await browser.close();
process.exit(overflow ? 1 : 0);

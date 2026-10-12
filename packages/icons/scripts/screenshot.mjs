#!/usr/bin/env node
// Renders preview/index.html to PNGs with a headless Chromium-based browser.
// puppeteer-core is resolved from PUPPETEER_FROM (a package.json path) or the
// local node_modules; the browser from BROWSER_PATH or the default Edge location.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = process.env.PUPPETEER_FROM || 'C:/repo/dada/package.json';
let puppeteer;
try {
  puppeteer = createRequire(from)('puppeteer-core');
} catch {
  puppeteer = createRequire(import.meta.url)('puppeteer-core');
}
const executablePath = process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const page0 = pathToFileURL(path.join(ROOT, 'preview', 'index.html')).href;
const outDir = path.join(ROOT, 'preview');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist', 'icons.json'), 'utf8'));

const jobs = [
  { file: 'contact-light.png', query: '?theme=light', width: 1440 },
  { file: 'contact-dark.png', query: '?theme=dark', width: 1440 },
  ...meta.categories.map((c) => ({ file: `review-${c.name}.png`, query: `?mode=review&theme=light&cat=${c.name}`, width: 1200 })),
  { file: 'zoom-24px.png', query: '?theme=light&cat=actions,status', width: 900, scale: 2 },
];
const only = process.argv.slice(2);

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  for (const job of jobs) {
    if (only.length && !only.some((o) => job.file.includes(o))) continue;
    await page.setViewport({ width: job.width, height: 900, deviceScaleFactor: job.scale || 1 });
    await page.goto(page0 + job.query, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(outDir, job.file), fullPage: true });
    console.log('wrote preview/' + job.file);
  }
} finally {
  await browser.close();
}

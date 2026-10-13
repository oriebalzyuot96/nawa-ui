// End-to-end + accessibility + visual smoke tests for the Pelagic UI docs site.
//
// Target:
//   E2E_URL=https://oriebalzyuot96.github.io/pelagic-ui/   test a deployed site
//   (unset)                                              start `astro preview` for apps/docs/dist
//                                                        (build it first: npm run docs:build)
// Browser:
//   PUPPETEER_EXECUTABLE_PATH=<path>  use an installed Chromium browser, e.g. on Windows
//   "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe". Otherwise Puppeteer's own Chrome.
// Output:
//   tests/e2e/artifacts/*.png   screenshots per page × theme
//   tests/e2e/artifacts/axe-report.json   every axe violation (rule, impact, selector, page, theme)
import { AxePuppeteer } from '@axe-core/puppeteer';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const artifacts = join(here, 'artifacts');
mkdirSync(artifacts, { recursive: true });

const PORT = Number(process.env.E2E_PORT ?? 4329);
const BASE = (process.env.E2E_URL ?? `http://127.0.0.1:${PORT}/pelagic-ui/`).replace(/\/?$/, '/');
const MODES = ['light', 'dark', 'hc'];
const ACCENTS = ['violet', 'teal', 'indigo', 'rose', 'amber', 'emerald', 'slate'];
const VIEWPORT = { width: 1280, height: 900 };
// Pages that must be in the sitemap (and so in every check below), whatever else it lists.
const REQUIRED_PAGES = ['', 'ar/', 'packages/', 'ar/packages/', 'components/', 'themes/', 'accessibility-modes/', 'space/'];

let server;
let browser;
let pages = [];
const axeReport = [];

async function waitForUrl(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

/** Page URLs from the site's sitemap, rebased onto BASE (works for preview and deployed sites). */
async function discoverPages() {
  const xml = await (await fetch(new URL('sitemap-0.xml', BASE))).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]));
  const prefix = new URL(BASE).pathname;
  const paths = locs.map((u) => u.pathname).filter((p) => p.startsWith(prefix));
  return [...new Set(paths)].map((p) => new URL(p, BASE).href);
}

const slug = (url) => new URL(url).pathname.replace(new URL(BASE).pathname, '').replace(/\/$/, '').replace(/\//g, '_') || 'home';

async function newPage({ mode, accent } = {}) {
  const page = await browser.newPage();
  // Keyboard tests need the page to own focus (pages opened earlier may still be in front).
  await page.bringToFront();
  await page.setViewport(VIEWPORT);
  // Stable screenshots and no mid-transition colours for the contrast rule.
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  if (mode || accent) {
    // Same path as a real user: ThemeScript restores the saved choice before first paint.
    await page.evaluateOnNewDocument((choice) => {
      try {
        localStorage.setItem('pelagic-ui-theme', JSON.stringify(choice));
      } catch {
        /* ignore */
      }
    }, { mode: mode ?? 'light', accent: accent ?? 'violet', shape: 'default' });
  }
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    const reason = req.failure()?.errorText ?? '';
    if (!reason.includes('ERR_ABORTED')) errors.push(`requestfailed: ${req.url()} (${reason})`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && new URL(res.url()).origin === new URL(BASE).origin) errors.push(`HTTP ${res.status()}: ${res.url()}`);
  });
  return { page, errors };
}

/** Scroll through the page so client:visible islands hydrate, then return to the top. */
async function hydrate(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 400));
}

async function open(url, theme) {
  const ctx = await newPage(theme);
  const response = await ctx.page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  return { ...ctx, response };
}

async function runAxe(page, url, theme) {
  const results = await new AxePuppeteer(page).analyze();
  const violations = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    page: new URL(url).pathname,
    theme,
    nodes: v.nodes.map((n) => ({ selector: n.target.join(' '), summary: n.failureSummary, html: n.html.slice(0, 200) })),
  }));
  axeReport.push(...violations);
  return violations;
}

const describeViolations = (vs) =>
  vs.map((v) => `  [${v.impact}] ${v.rule} on ${v.page} (${v.theme}): ${v.help}\n${v.nodes.map((n) => `      ${n.selector}`).join('\n')}`).join('\n');

before(async () => {
  if (!process.env.E2E_URL) {
    // Serve the built docs exactly as GitHub Pages would (base /pelagic-ui/).
    const astroBin = join(repoRoot, 'node_modules', 'astro', 'astro.js');
    server = spawn(process.execPath, [astroBin, 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
      cwd: join(repoRoot, 'apps', 'docs'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    server.stdout.on('data', (d) => (log += d));
    server.stderr.on('data', (d) => (log += d));
    server.on('exit', (code) => {
      if (code) console.error(`astro preview exited with ${code}\n${log}`);
    });
  }
  await waitForUrl(BASE);
  browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    headless: true,
    args: process.env.CI ? ['--no-sandbox'] : [],
  });
  pages = await discoverPages();
  assert.ok(pages.length > 5, `expected the sitemap to list the docs pages, got ${pages.length}`);
  for (const p of REQUIRED_PAGES) {
    const url = new URL(p, BASE).href;
    assert.ok(pages.includes(url), `the sitemap is missing ${url}`);
  }
});

after(async () => {
  writeFileSync(join(artifacts, 'axe-report.json'), JSON.stringify(axeReport, null, 2));
  await browser?.close();
  server?.kill();
});

describe('docs pages load cleanly', () => {
  it('every page in the sitemap returns 200 with no console errors', async () => {
    const failures = [];
    for (const url of pages) {
      const { page, errors, response } = await open(url, { mode: 'light' });
      await hydrate(page);
      if (!response || response.status() !== 200) failures.push(`${url}: HTTP ${response?.status()}`);
      const title = await page.title();
      if (!title) failures.push(`${url}: empty <title>`);
      for (const e of errors) failures.push(`${url}: ${e}`);
      await page.close();
    }
    assert.deepEqual(failures, []);
  });

  it('the 404 page is served for unknown routes', async () => {
    const { page, response } = await open(new URL('this-page-does-not-exist/', BASE).href);
    assert.equal(response.status(), 404);
    assert.ok((await page.$('main')) !== null);
    await page.close();
  });
});

describe('axe (real browser, includes color-contrast)', () => {
  for (const mode of MODES) {
    it(`every page passes in ${mode} mode`, async () => {
      const all = [];
      for (const url of pages) {
        const { page } = await open(url, { mode });
        await hydrate(page);
        const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        assert.equal(applied, mode, `${url} did not apply data-theme="${mode}"`);
        await page.screenshot({ path: join(artifacts, `${slug(url)}--${mode}.png`) });
        all.push(...(await runAxe(page, url, mode)));
        await page.close();
      }
      assert.equal(all.length, 0, `axe violations:\n${describeViolations(all)}`);
    });
  }

  it('the home page passes with every accent in light, dark and hc', async () => {
    const all = [];
    for (const accent of ACCENTS) {
      for (const mode of MODES) {
        const { page } = await open(BASE, { mode, accent });
        await hydrate(page);
        const applied = await page.evaluate(() => document.documentElement.getAttribute('data-accent'));
        assert.equal(applied, accent);
        if (mode === 'light') await page.screenshot({ path: join(artifacts, `home--accent-${accent}.png`) });
        all.push(...(await runAxe(page, BASE, `${mode}/${accent}`)));
        await page.close();
      }
    }
    assert.equal(all.length, 0, `axe violations:\n${describeViolations(all)}`);
  });
});

describe('keyboard smoke', () => {
  it('the first Tab stop is the skip link, and it moves focus to <main>', async () => {
    const { page } = await open(BASE, { mode: 'light' });
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => ({
      cls: document.activeElement?.className,
      href: document.activeElement?.getAttribute('href'),
      text: document.activeElement?.textContent?.trim(),
    }));
    assert.match(String(first.cls), /pl-skip-link/);
    assert.equal(first.href, '#main');
    // The skip link becomes visible when focused.
    const visible = await page.evaluate(() => {
      const r = document.activeElement.getBoundingClientRect();
      return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < window.innerHeight;
    });
    assert.ok(visible, 'skip link is not visible on focus');
    await page.screenshot({ path: join(artifacts, 'keyboard--skip-link.png') });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'main', { timeout: 3000 });
    await page.close();
  });

  it('a dialog on /components/ traps focus, closes with Escape and restores focus', async () => {
    const url = new URL('components/overlays/', BASE).href;
    const { page } = await open(url, { mode: 'light' });
    // Scope to the page content: the site header also has dialog triggers (search, accessibility panel).
    const opener = await page.waitForSelector('.docs-content button[aria-haspopup="dialog"]');
    await opener.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    // The demo is a client:visible island: retry until it has hydrated and the click opens the dialog.
    let dialog = null;
    for (let i = 0; i < 20 && !dialog; i += 1) {
      await opener.evaluate((el) => el.focus());
      await page.keyboard.press('Enter');
      dialog = await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 500 }).catch(() => null);
    }
    assert.ok(dialog, 'dialog did not open');
    const name = await dialog.evaluate((el) => document.getElementById(el.getAttribute('aria-labelledby') ?? '')?.textContent ?? el.getAttribute('aria-label'));
    assert.ok(name && name.trim().length > 0, 'dialog has no accessible name');
    assert.ok(await dialog.evaluate((el) => el.contains(document.activeElement)), 'focus did not move into the dialog');
    await page.screenshot({ path: join(artifacts, 'keyboard--dialog-open.png') });

    const count = await dialog.evaluate((el) => el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').length);
    for (let i = 0; i < count + 2; i += 1) {
      await page.keyboard.press('Tab');
      assert.ok(await dialog.evaluate((el) => el.contains(document.activeElement)), `Tab #${i + 1} escaped the dialog`);
    }
    for (let i = 0; i < count + 2; i += 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      assert.ok(await dialog.evaluate((el) => el.contains(document.activeElement)), `Shift+Tab #${i + 1} escaped the dialog`);
    }
    const scrollLocked = await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden');
    assert.ok(scrollLocked, 'page scroll is not locked while the dialog is open');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-modal="true"]'), { timeout: 3000 });
    const restored = await opener.evaluate((el) => document.activeElement === el);
    assert.ok(restored, 'focus did not return to the opener');
    await page.close();
  });

  it('the command palette opens with Ctrl+K, finds a component and restores focus on Escape', async () => {
    const { page } = await open(new URL('packages/', BASE).href, { mode: 'light' });
    await page.waitForFunction(() => document.documentElement.classList.contains('js'));
    const trigger = await page.$('.search-trigger');
    await trigger.focus();
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    await page.waitForSelector('dialog.palette[open]', { timeout: 3000 });
    assert.ok(await page.evaluate(() => document.activeElement?.matches('[role="combobox"]')), 'focus is not in the search box');
    await page.keyboard.type('datatable');
    await page.waitForSelector('#palette-list [role="option"]', { timeout: 5000 });
    const first = await page.$eval('#palette-list [role="option"][aria-selected="true"]', (el) => el.textContent);
    assert.match(first, /DataTable/i);
    const active = await page.$eval('[role="combobox"]', (el) => el.getAttribute('aria-activedescendant'));
    assert.ok(active && (await page.$('#' + active)), 'aria-activedescendant does not point at an option');
    await page.screenshot({ path: join(artifacts, 'keyboard--palette.png') });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog.palette[open]'), { timeout: 3000 });
    assert.ok(await page.evaluate(() => document.activeElement?.classList.contains('search-trigger')), 'focus did not return to the search button');
    await page.close();
  });
});

describe('internationalisation', () => {
  it('the Arabic page is right-to-left', async () => {
    const { page } = await open(new URL('ar/', BASE).href, { mode: 'light' });
    const { dir, lang, computed } = await page.evaluate(() => ({
      dir: document.documentElement.dir,
      lang: document.documentElement.lang,
      computed: getComputedStyle(document.body).direction,
    }));
    assert.equal(dir, 'rtl');
    assert.equal(lang, 'ar');
    assert.equal(computed, 'rtl');
    await page.screenshot({ path: join(artifacts, 'ar--rtl.png') });
    await page.close();
  });

  it('English pages are left-to-right', async () => {
    const { page } = await open(BASE, { mode: 'light' });
    assert.equal(await page.evaluate(() => document.documentElement.dir || 'ltr'), 'ltr');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    await page.close();
  });
});

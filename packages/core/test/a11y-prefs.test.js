// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  A11Y_STORAGE_KEY,
  a11yOptions,
  a11yPanelLabels,
  a11yPanelSchema,
  a11yPrefsToAttributes,
  announceA11yChange,
  applyA11yPrefs,
  colorFilterMatrices,
  countActiveA11yPrefs,
  defaultA11yPrefs,
  getA11yLabels,
  getSystemPrefs,
  isDefaultA11yPrefs,
  loadA11yPrefs,
  mountA11yPanel,
  normalizeA11yPrefs,
  renderA11yPanelHTML,
  resetA11yPrefs,
  saveA11yPrefs,
  watchSystemPrefs,
} from '../src/a11y-prefs.js';
import { contrastSchemes } from '../src/themes.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = document.documentElement;
const a11yAttrs = () => [...html.attributes].filter((a) => a.name.startsWith('data-a11y-')).map((a) => a.name);

afterEach(() => {
  resetA11yPrefs();
  localStorage.clear();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('normalizeA11yPrefs', () => {
  it('fills defaults and drops invalid values', () => {
    const p = normalizeA11yPrefs({ contrast: 'neon', fontScale: 9, patterns: 'yes', motion: 'off', lineHeight: 'wider' });
    expect(p.contrast).toBe('default');
    expect(p.fontScale).toBe(2);
    expect(p.patterns).toBe(false);
    expect(p.motion).toBe('off');
    expect(p.lineHeight).toBe('wider');
    expect(normalizeA11yPrefs({ fontScale: 0.2 }).fontScale).toBe(0.9);
    expect(normalizeA11yPrefs(null)).toEqual(defaultA11yPrefs);
  });

  it('counts active preferences', () => {
    expect(isDefaultA11yPrefs({})).toBe(true);
    expect(countActiveA11yPrefs({ contrast: 'gray', readableFont: true, fontScale: 1.25 })).toBe(3);
  });
});

describe('applyA11yPrefs', () => {
  it('writes every mode as a data-a11y-* attribute and removes defaults again', () => {
    const p = applyA11yPrefs({
      contrast: 'yellow-black',
      colorFilter: 'deuteranopia',
      patterns: true,
      saturation: 'low',
      fontScale: 1.5,
      lineHeight: 'wide',
      letterSpacing: 'wider',
      wordSpacing: 'wide',
      paragraphSpacing: 'wider',
      readableFont: true,
      alignStart: true,
      links: 'highlight',
      focus: 'large',
      cursor: 'large',
      readingGuide: true,
      readingMask: true,
      motion: 'off',
      hideImages: true,
      largeTargets: true,
    });
    expect(p.contrast).toBe('yellow-black');
    expect(html.getAttribute('data-a11y-contrast')).toBe('yellow-black');
    expect(html.getAttribute('data-a11y-color-filter')).toBe('deuteranopia');
    expect(html.hasAttribute('data-a11y-patterns')).toBe(true);
    expect(html.getAttribute('data-a11y-saturation')).toBe('low');
    expect(html.getAttribute('data-a11y-font-scale')).toBe('1.5');
    expect(html.style.getPropertyValue('--oc-user-font-scale')).toBe('1.5');
    expect(html.getAttribute('data-a11y-line-height')).toBe('wide');
    expect(html.getAttribute('data-a11y-letter-spacing')).toBe('wider');
    expect(html.getAttribute('data-a11y-word-spacing')).toBe('wide');
    expect(html.getAttribute('data-a11y-paragraph-spacing')).toBe('wider');
    expect(html.getAttribute('data-a11y-font')).toBe('readable');
    expect(html.getAttribute('data-a11y-text-align')).toBe('start');
    expect(html.getAttribute('data-a11y-links')).toBe('highlight');
    expect(html.getAttribute('data-a11y-focus')).toBe('large');
    expect(html.getAttribute('data-a11y-cursor')).toBe('large');
    expect(html.getAttribute('data-a11y-motion')).toBe('off');
    expect(html.getAttribute('data-a11y-images')).toBe('hide');
    expect(html.getAttribute('data-a11y-targets')).toBe('large');
    // JS-only parts: SVG filters and the reading aids.
    expect(document.getElementById('oc-a11y-filters')?.querySelector('#oc-a11y-deuteranopia')).not.toBeNull();
    expect(document.querySelector('.oc-a11y-reading-guide')).not.toBeNull();
    expect(document.querySelector('.oc-a11y-reading-mask')).not.toBeNull();

    applyA11yPrefs({});
    expect(a11yAttrs()).toEqual([]);
    expect(html.style.getPropertyValue('--oc-user-font-scale')).toBe('');
    expect(document.querySelector('.oc-a11y-reading-guide')).toBeNull();
  });

  it('moves the reading guide with the pointer', async () => {
    applyA11yPrefs({ readingGuide: true });
    document.dispatchEvent(Object.assign(new Event('pointermove'), { clientY: 321 }));
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 20));
    expect(document.querySelector('.oc-a11y-reading-guide').style.getPropertyValue('--oc-a11y-guide-y')).toBe('321px');
  });

  it('targets a container and dispatches oc-a11y-change', () => {
    const box = document.createElement('div');
    document.body.appendChild(box);
    const seen = vi.fn();
    document.addEventListener('oc-a11y-change', seen);
    applyA11yPrefs({ contrast: 'gray', fontScale: 1.25 }, box);
    expect(box.getAttribute('data-a11y-contrast')).toBe('gray');
    expect(box.style.getPropertyValue('--oc-user-font-scale')).toBe('1.25');
    expect(html.hasAttribute('data-a11y-contrast')).toBe(false);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen.mock.calls[0][0].detail.contrast).toBe('gray');
    document.removeEventListener('oc-a11y-change', seen);
  });

  it('pauses autoplaying media when motion is off', () => {
    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.pause = vi.fn();
    document.body.appendChild(video);
    applyA11yPrefs({ motion: 'off' });
    expect(video.pause).toHaveBeenCalled();
    expect(video.hasAttribute('autoplay')).toBe(false);
  });

  it('builds SSR attributes', () => {
    const attrs = a11yPrefsToAttributes({ contrast: 'invert', hideImages: true });
    expect(attrs['data-a11y-contrast']).toBe('invert');
    expect(attrs['data-a11y-images']).toBe('hide');
    expect(attrs['data-a11y-motion']).toBeNull();
  });
});

describe('persistence', () => {
  it('round-trips through localStorage and clears defaults', () => {
    saveA11yPrefs({ contrast: 'black-yellow', fontScale: 1.75 });
    expect(JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY)).contrast).toBe('black-yellow');
    expect(loadA11yPrefs().fontScale).toBe(1.75);
    saveA11yPrefs(defaultA11yPrefs);
    expect(localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
  });

  it('survives corrupt JSON and blocked storage', () => {
    localStorage.setItem(A11Y_STORAGE_KEY, '{oops');
    expect(loadA11yPrefs()).toEqual(defaultA11yPrefs);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    expect(() => saveA11yPrefs({ contrast: 'gray' })).not.toThrow();
    expect(loadA11yPrefs()).toEqual(defaultA11yPrefs);
  });

  it('resetA11yPrefs clears attributes and storage', () => {
    applyA11yPrefs({ contrast: 'invert' });
    saveA11yPrefs({ contrast: 'invert' });
    expect(resetA11yPrefs()).toEqual(defaultA11yPrefs);
    expect(a11yAttrs()).toEqual([]);
    expect(localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
  });
});

describe('system preferences', () => {
  it('reports and watches media queries', () => {
    const listeners = [];
    const win = {
      matchMedia: (q) => ({
        matches: q === '(prefers-reduced-motion: reduce)' || q === '(prefers-contrast: more)',
        addEventListener: (_t, fn) => listeners.push(fn),
        removeEventListener: (_t, fn) => listeners.splice(listeners.indexOf(fn), 1),
      }),
    };
    expect(getSystemPrefs(win)).toMatchObject({ reducedMotion: true, contrast: 'more', colorScheme: 'light', forcedColors: false });
    const cb = vi.fn();
    const stop = watchSystemPrefs(cb, win);
    expect(cb).toHaveBeenCalledTimes(1);
    listeners[0]();
    expect(cb).toHaveBeenCalledTimes(2);
    stop();
    expect(listeners).toHaveLength(0);
  });
});

describe('panel model and CSS', () => {
  const css = readFileSync(join(pkg, 'src/parts/a11y-modes.css'), 'utf8');
  const built = readFileSync(join(pkg, 'orca-ui.css'), 'utf8');

  it('labels every control and option in English and Arabic', () => {
    for (const locale of ['en', 'ar']) {
      const l = a11yPanelLabels[locale];
      for (const group of a11yPanelSchema) {
        expect(l.groups[group.id], `${locale} group ${group.id}`).toBeTruthy();
        for (const c of group.controls) {
          expect(l.controls[c.key]?.label, `${locale} ${c.key}`).toBeTruthy();
          if (a11yOptions[c.key] && c.type !== 'switch') for (const v of a11yOptions[c.key]) expect(l.options[c.key]?.[v], `${locale} ${c.key}.${v}`).toBeTruthy();
        }
      }
    }
    expect(getA11yLabels('ar-SA').title).toBe('إمكانية الوصول');
    expect(getA11yLabels('en', { controls: { contrast: { label: 'Colors' } } }).controls.contrast.label).toBe('Colors');
    expect(announceA11yChange(a11yPanelLabels.en, 'contrast', 'yellow-black')).toBe('Color scheme: Yellow on black');
    expect(announceA11yChange(a11yPanelLabels.en, 'fontScale', 1.5)).toBe('Text size: 150%');
  });

  it('has CSS for every attribute value', () => {
    for (const value of a11yOptions.contrast.filter((v) => v !== 'default')) expect(built).toContain(`[data-a11y-contrast="${value}"]`);
    for (const name of Object.keys(contrastSchemes).filter((n) => n !== 'gray-dark')) expect(built).toContain(`[data-a11y-contrast="${name}"]`);
    for (const f of ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia']) expect(css).toContain(`[data-a11y-color-filter='${f}']`);
    for (const sel of [
      "[data-a11y-saturation='low']",
      "[data-a11y-saturation='high']",
      '[data-a11y-patterns]',
      "[data-a11y-line-height='wider']",
      "[data-a11y-letter-spacing='wider']",
      "[data-a11y-word-spacing='wider']",
      "[data-a11y-paragraph-spacing='wider']",
      "[data-a11y-font='readable']",
      "[data-a11y-text-align='start']",
      "[data-a11y-links='highlight']",
      "[data-a11y-focus='large']",
      "[data-a11y-cursor='large']",
      '.oc-a11y-reading-guide',
      '.oc-a11y-reading-mask',
      "[data-a11y-motion='off']",
      "[data-a11y-images='hide']",
      "[data-a11y-targets='large']",
    ]) {
      expect(css, sel).toContain(sel);
    }
    // The scheme palettes override every theme: all tokens are !important.
    const block = built.match(/\[data-a11y-contrast="yellow-black"\],[^{]*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    expect(block[1]).toContain('--oc-surface: #000000 !important;');
    expect(block[1]).toContain('--oc-text: #ffff00 !important;');
    // Self-hosted readable font, relative to orca-ui.css.
    expect(css).toContain("url('./fonts/atkinson-hyperlegible-latin-400-normal.woff2')");
  });

  it('renders panel HTML with escaped labels, every group and the initial state', () => {
    const out = renderA11yPanelHTML({ id: 'x', labels: { title: '<b>"Display"</b>' }, prefs: { contrast: 'gray', readableFont: true }, trigger: 'inline' });
    expect(out).toContain('&lt;b&gt;&quot;Display&quot;&lt;/b&gt;');
    expect(out).not.toContain('<b>"Display"</b>');
    const doc = new DOMParser().parseFromString(out, 'text/html');
    expect(doc.querySelectorAll('.oc-a11y-group')).toHaveLength(a11yPanelSchema.length);
    expect(doc.querySelector('[data-value="gray"]').getAttribute('aria-checked')).toBe('true');
    expect(doc.querySelector('[data-a11y-key="readableFont"]').getAttribute('aria-checked')).toBe('true');
    expect(doc.querySelector('[data-a11y-count]').textContent).toBe('2 active');
    expect(doc.querySelector('.oc-a11y-panel').getAttribute('data-labelledby')).toBe('x-title');
    expect(doc.querySelector('[role="dialog"]')).toBeNull();
    const ids = [...doc.querySelectorAll('[id]')].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const el of doc.querySelectorAll('[aria-labelledby], [aria-describedby]')) {
      for (const ref of `${el.getAttribute('aria-labelledby') ?? ''} ${el.getAttribute('aria-describedby') ?? ''}`.trim().split(/\s+/)) expect(doc.getElementById(ref), ref).not.toBeNull();
    }
  });

  it('mountA11yPanel keeps state, saves and reports changes', () => {
    document.body.innerHTML = `<div id="host">${renderA11yPanelHTML({ id: 'm' })}</div>`;
    const changes = [];
    const ctl = mountA11yPanel(document.querySelector('#host > div'), { onChange: (p, c) => changes.push(c) });
    ctl.open();
    expect(ctl.isOpen()).toBe(true);
    document.querySelector('[data-value="invert"]').click();
    expect(html.getAttribute('data-a11y-contrast')).toBe('invert');
    expect(changes).toEqual([{ key: 'contrast', value: 'invert' }]);
    expect(loadA11yPrefs().contrast).toBe('invert');
    ctl.destroy();
    expect(document.querySelector('#host .oc-a11y-panel')).not.toBeNull();
  });

  it('ships valid color-vision matrices (rows of 5, alpha preserved)', () => {
    for (const values of Object.values(colorFilterMatrices)) {
      const n = values.split(' ').map(Number);
      expect(n).toHaveLength(20);
      expect(n.every(Number.isFinite)).toBe(true);
      expect(n.slice(15)).toEqual([0, 0, 0, 1, 0]);
    }
  });
});

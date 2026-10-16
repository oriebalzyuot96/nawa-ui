// @vitest-environment jsdom
// The Theme and Sound groups of the shared AccessibilityPanel, and the "full" motion option.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  a11yOptions,
  a11yPanelLabels,
  a11yPrefsToAttributes,
  mountA11yPanel,
  normalizeA11yPrefs,
  panelGroups,
  presetSwatches,
  renderA11yPanelHTML,
  resetA11yPrefs,
  themePanelOptions,
} from '../src/a11y-prefs.js';
import { createSoundEngine, getSoundPrefs } from '../src/sound.js';
import { getThemeState, loadTheme } from '../src/theme.js';
import { accents, presets } from '../src/themes.mjs';

const html = document.documentElement;

beforeEach(() => {
  window.matchMedia = vi.fn((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  resetA11yPrefs();
  localStorage.clear();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  for (const a of ['data-theme', 'data-accent', 'data-theme-preset']) html.removeAttribute(a);
  document.head.querySelectorAll('style[data-theme-custom]').forEach((s) => s.remove());
});

const mount = (options = {}, render = {}) => {
  document.body.innerHTML = `<div id="host">${renderA11yPanelHTML({ id: 't', ...render })}</div>`;
  const ctl = mountA11yPanel(document.querySelector('#host > div'), options);
  ctl.open();
  return ctl;
};
const panel = () => document.querySelector('.pl-a11y-panel');

describe('motion "full"', () => {
  it('is a valid value with its own attribute and label', () => {
    expect(a11yOptions.motion).toEqual(['system', 'full', 'reduce', 'off']);
    expect(normalizeA11yPrefs({ motion: 'full' }).motion).toBe('full');
    expect(a11yPrefsToAttributes({ motion: 'full' })['data-a11y-motion']).toBe('full');
    expect(a11yPanelLabels.en.options.motion.full).toBe('Full');
    expect(a11yPanelLabels.ar.options.motion.full).toBeTruthy();
  });
});

describe('panel model', () => {
  it('lists every preset, accent and sound style with labels in English and Arabic', () => {
    expect(themePanelOptions.preset).toEqual(['default', ...Object.keys(presets)]);
    expect(themePanelOptions.accent).toEqual(['default', ...Object.keys(accents)]);
    for (const locale of ['en', 'ar']) {
      const o = a11yPanelLabels[locale].options;
      for (const key of ['mode', 'preset', 'accent', 'soundTheme']) for (const v of themePanelOptions[key]) expect(o[key]?.[v], `${locale} ${key}.${v}`).toBeTruthy();
    }
    for (const name of themePanelOptions.preset) expect(presetSwatches[name].dark.surface).toMatch(/^#/);
  });

  it('drops the Theme or Sound group on request', () => {
    expect(panelGroups(undefined, { appearance: false }).map((g) => g.id)).not.toContain('appearance');
    expect(panelGroups(undefined, { sound: false }).map((g) => g.id)).not.toContain('sound');
    expect(panelGroups(['sound', 'text']).map((g) => g.id)).toEqual(['sound', 'text']);
  });
});

describe('Theme group', () => {
  it('renders mode, preset tiles, accent swatches and the color input as labelled controls', () => {
    const doc = new DOMParser().parseFromString(renderA11yPanelHTML({ id: 'r' }), 'text/html');
    const mode = doc.querySelector('[data-theme-key="mode"]');
    expect(mode.getAttribute('role')).toBe('radiogroup');
    expect(mode.querySelector('[data-theme-value="system"]').getAttribute('aria-checked')).toBe('true');
    expect(doc.querySelectorAll('[data-theme-key="preset"] [role="radio"]')).toHaveLength(themePanelOptions.preset.length);
    for (const sw of doc.querySelectorAll('.pl-a11y-swatch')) expect(sw.getAttribute('aria-label')).toBeTruthy();
    const color = doc.querySelector('input[type="color"]');
    expect(doc.querySelector(`label[for="${color.id}"]`).textContent).toBe('Your own color');
    // The sound group stays hidden until a sound engine exists.
    expect(doc.querySelector('[data-sound-group]').hasAttribute('hidden')).toBe(true);
    expect(renderA11yPanelHTML({ appearance: false, sound: false })).not.toMatch(/data-theme-key|data-sound-group/);
  });

  it('switches mode, preset and accent, saves them and keeps the radios in sync', async () => {
    mount();
    panel().querySelector('[data-theme-key="mode"] [data-theme-value="dark"]').click();
    expect(html.getAttribute('data-theme')).toBe('dark');
    panel().querySelector('[data-theme-key="preset"] [data-theme-value="aurora"]').click();
    expect(html.getAttribute('data-theme-preset')).toBe('aurora');
    expect(panel().querySelector('[data-theme-value="aurora"]').getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('[data-a11y-status]').textContent).toBe('Color theme: Aurora');
    panel().querySelector('[data-theme-key="accent"] [data-theme-value="coral"]').click();
    expect(html.getAttribute('data-accent')).toBe('coral');
    expect(loadTheme()).toMatchObject({ mode: 'dark', preset: 'aurora', accent: 'coral' });
    // Restore the preset's own colors.
    const reset = panel().querySelector('[data-theme-reset]');
    expect(reset.disabled).toBe(false);
    reset.click();
    expect(getThemeState()).toMatchObject({ preset: 'default', accent: null, mode: 'dark' });
    expect(reset.disabled).toBe(true);
  });

  it('follows changes made elsewhere on the page', async () => {
    mount();
    const { switchTheme } = await import('../src/theme.js');
    await switchTheme({ preset: 'reef' }, { animate: false });
    expect(panel().querySelector('[data-theme-value="reef"]').getAttribute('aria-checked')).toBe('true');
  });

  it('arrow keys move through preset tiles in rows of three', () => {
    mount();
    const first = panel().querySelector('[data-theme-key="preset"] [data-theme-value="default"]');
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(html.getAttribute('data-theme-preset')).toBe(themePanelOptions.preset[3]);
    expect(document.activeElement.getAttribute('data-theme-value')).toBe(themePanelOptions.preset[3]);
  });

  it('applies a brand color live and saves the final pick', async () => {
    mount();
    const input = panel().querySelector('input[type="color"]');
    input.value = '#ff6a00';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(html.getAttribute('data-accent')).toBe('brand');
    expect(loadTheme()).toMatchObject({ brand: '#ff6a00', accent: 'brand' });
    const clear = panel().querySelector('[data-theme-brand-clear]');
    expect(clear.hidden).toBe(false);
    clear.click();
    expect(html.hasAttribute('data-accent')).toBe(false);
    expect(clear.hidden).toBe(true);
  });
});

describe('Sound group', () => {
  it('appears once an engine exists and drives it', () => {
    const engine = createSoundEngine({ createContext: () => null });
    mount();
    const group = panel().querySelector('[data-sound-group]');
    expect(group.hidden).toBe(false);
    const sw = group.querySelector('[data-sound-key="enabled"]');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    sw.click();
    expect(engine.getState().enabled).toBe(true);
    expect(getSoundPrefs().enabled).toBe(true);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    group.querySelector('[data-sound-value="crisp"]').click();
    expect(engine.getTheme()).toBe('crisp');
    expect(JSON.parse(localStorage.getItem('pl-sound')).theme).toBe('crisp');
    engine.destroy();
  });
});

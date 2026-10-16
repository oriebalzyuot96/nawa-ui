// @vitest-environment jsdom
// switchTheme(): state merging, persistence, the change event, presets, brand colors and the three
// animation paths (View Transitions reveal, crossfade fallback, instant under reduced motion).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BRAND_THEME_NAME,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  applyTheme,
  createTheme,
  getThemeState,
  loadTheme,
  onThemeChange,
  restoreTheme,
  switchTheme,
  themeMotionReduced,
} from '../src/theme.js';
import { presets } from '../src/themes.mjs';

const html = document.documentElement;
const ATTRS = ['data-theme', 'data-accent', 'data-shape', 'data-theme-preset', 'data-a11y-motion', 'data-pl-theme-transition'];

function mockMatchMedia(reduced) {
  window.matchMedia = vi.fn((q) => ({ matches: reduced && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
}

beforeEach(() => mockMatchMedia(false));
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  for (const a of ATTRS) html.removeAttribute(a);
  html.removeAttribute('style');
  document.head.querySelectorAll('style[data-theme-custom]').forEach((s) => s.remove());
  delete document.startViewTransition;
});

describe('getThemeState / applyTheme with presets and brand colors', () => {
  it('reads the defaults', () => {
    expect(getThemeState()).toEqual({ mode: 'system', accent: null, preset: 'default', shape: 'default', brand: null });
    expect(getThemeState(null).mode).toBe('system');
  });

  it('sets and clears data-theme-preset, and accent null / "default" removes data-accent', () => {
    applyTheme({ preset: 'abyss', accent: 'rose' });
    expect(html.getAttribute('data-theme-preset')).toBe('abyss');
    applyTheme({ accent: 'default' });
    expect(html.hasAttribute('data-accent')).toBe(false);
    applyTheme({ preset: 'default' });
    expect(html.hasAttribute('data-theme-preset')).toBe(false);
  });

  it('a brand color becomes a fitted custom theme and is read back as state', () => {
    applyTheme({ preset: 'dune', brand: '#ff6a00' });
    expect(html.getAttribute('data-accent')).toBe(BRAND_THEME_NAME);
    const style = document.head.querySelector(`style[data-theme-custom="${BRAND_THEME_NAME}"]`);
    expect(style.textContent).toContain('[data-accent="brand"]');
    expect(getThemeState()).toMatchObject({ preset: 'dune', brand: '#ff6a00', accent: null });
    applyTheme({ brand: null });
    expect(html.hasAttribute('data-accent')).toBe(false);
    expect(document.head.querySelector('style[data-theme-custom]')).toBeNull();
  });
});

describe('createTheme({ preset })', () => {
  it('fits the brand to the preset surfaces and passes every pair', () => {
    for (const preset of Object.keys(presets)) {
      const t = createTheme({ primary: '#ffd400', preset });
      expect(t.tokens.light.surface).toBe(presets[preset].light.surface);
      expect(t.tokens.dark.surface).toBe(presets[preset].dark.surface);
      for (const mode of ['light', 'dark', 'hc']) expect(t.failures[mode], `${preset} ${mode}`).toEqual([]);
    }
  });

  it('rejects an unknown preset', () => {
    expect(() => createTheme({ primary: '#ff0000', preset: 'nope' })).toThrow(/unknown preset/);
  });
});

describe('switchTheme', () => {
  it('merges, applies, saves and announces a change', async () => {
    const seen = [];
    const stop = onThemeChange((state, previous) => seen.push([state, previous]));
    const state = await switchTheme({ mode: 'dark', accent: 'teal' }, { animate: false });
    expect(state).toMatchObject({ mode: 'dark', accent: 'teal' });
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(loadTheme()).toMatchObject({ mode: 'dark', accent: 'teal', preset: 'default' });
    expect(seen).toHaveLength(1);
    expect(seen[0][1].mode).toBe('system');
    stop();
    await switchTheme({ mode: 'light' }, { animate: false, persist: false });
    expect(seen).toHaveLength(1);
    expect(loadTheme().mode).toBe('dark');
  });

  it('choosing a preset resets the accent and brand to the preset', async () => {
    await switchTheme({ accent: 'rose' }, { animate: false });
    await switchTheme({ preset: 'kelp' }, { animate: false });
    expect(html.getAttribute('data-theme-preset')).toBe('kelp');
    expect(html.hasAttribute('data-accent')).toBe(false);
    await switchTheme({ brand: 'rebeccapurple' }, { animate: false });
    expect(getThemeState().brand).toBe('#663399');
    expect(loadTheme()).toMatchObject({ accent: BRAND_THEME_NAME, brand: '#663399' });
    expect(loadTheme().brandCss).toContain('--pl-a-light-primary');
    await switchTheme({ accent: 'amber' }, { animate: false });
    expect(getThemeState()).toMatchObject({ accent: 'amber', brand: null });
  });

  it('resolves immediately without a change', async () => {
    const listener = vi.fn();
    html.addEventListener(THEME_CHANGE_EVENT, listener);
    await switchTheme({ mode: 'system' });
    expect(listener).not.toHaveBeenCalled();
    html.removeEventListener(THEME_CHANGE_EVENT, listener);
  });

  it('uses a circular View Transition from the origin element', async () => {
    const animate = vi.fn();
    html.animate = animate;
    let finish;
    document.startViewTransition = vi.fn((update) => {
      update();
      return { ready: Promise.resolve(), finished: new Promise((r) => (finish = r)), skipTransition: vi.fn() };
    });
    const button = document.createElement('button');
    button.getBoundingClientRect = () => ({ left: 100, top: 40, width: 40, height: 20 });
    document.body.appendChild(button);
    const done = switchTheme({ mode: 'dark' }, { origin: button });
    expect(html.getAttribute('data-pl-theme-transition')).toBe('reveal');
    expect(html.style.getPropertyValue('--pl-vt-x')).toBe('120px');
    expect(html.style.getPropertyValue('--pl-vt-y')).toBe('50px');
    await Promise.resolve();
    await Promise.resolve();
    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes, opts] = animate.mock.calls[0];
    expect(keyframes.clipPath[0]).toBe('circle(0px at 120px 50px)');
    expect(keyframes.clipPath[1]).toMatch(/^circle\(\d+px at 120px 50px\)$/);
    expect(opts.pseudoElement).toBe('::view-transition-new(root)');
    finish();
    await done;
    expect(html.hasAttribute('data-pl-theme-transition')).toBe(false);
    expect(html.getAttribute('data-theme')).toBe('dark');
    button.remove();
  });

  it('takes the pointer position of a click event', async () => {
    html.animate = vi.fn();
    document.startViewTransition = vi.fn((update) => {
      update();
      return { ready: Promise.resolve(), finished: Promise.resolve() };
    });
    const p = switchTheme({ mode: 'dark' }, { origin: { clientX: 7, clientY: 9 } });
    expect(html.style.getPropertyValue('--pl-vt-x')).toBe('7px');
    await p;
  });

  it('falls back to a short crossfade without View Transitions', async () => {
    vi.useFakeTimers();
    const p = switchTheme({ mode: 'dark' });
    expect(html.getAttribute('data-pl-theme-transition')).toBe('fade');
    expect(html.getAttribute('data-theme')).toBe('dark');
    vi.advanceTimersByTime(400);
    await p;
    expect(html.hasAttribute('data-pl-theme-transition')).toBe(false);
    vi.useRealTimers();
  });

  it('never animates under reduced motion (OS or data-a11y-motion), but does with "full"', async () => {
    document.startViewTransition = vi.fn();
    mockMatchMedia(true);
    expect(themeMotionReduced()).toBe(true);
    await switchTheme({ mode: 'dark' });
    expect(document.startViewTransition).not.toHaveBeenCalled();
    expect(html.hasAttribute('data-pl-theme-transition')).toBe(false);
    expect(html.getAttribute('data-theme')).toBe('dark');
    html.setAttribute('data-a11y-motion', 'full');
    expect(themeMotionReduced()).toBe(false);
    mockMatchMedia(false);
    html.setAttribute('data-a11y-motion', 'off');
    await switchTheme({ mode: 'light' });
    expect(document.startViewTransition).not.toHaveBeenCalled();
    html.setAttribute('data-a11y-motion', 'reduce');
    expect(themeMotionReduced()).toBe(true);
  });

  it('restoreTheme applies a saved choice, brand included', async () => {
    await switchTheme({ preset: 'ink', mode: 'dark' }, { animate: false });
    await switchTheme({ brand: '#00e5ff' }, { animate: false });
    for (const a of ATTRS) html.removeAttribute(a);
    document.head.querySelectorAll('style[data-theme-custom]').forEach((s) => s.remove());
    const state = restoreTheme();
    expect(state).toMatchObject({ mode: 'dark', preset: 'ink', brand: '#00e5ff' });
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)).preset).toBe('ink');
  });
});

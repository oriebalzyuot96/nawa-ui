// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY, applyTheme, loadTheme, saveTheme } from '../src/theme.js';

const html = document.documentElement;

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  for (const a of ['data-theme', 'data-accent', 'data-shape']) html.removeAttribute(a);
});

describe('applyTheme', () => {
  it('sets data-theme, data-accent and data-shape on <html> by default', () => {
    applyTheme({ mode: 'dark', accent: 'rose', shape: 'round' });
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(html.getAttribute('data-accent')).toBe('rose');
    expect(html.getAttribute('data-shape')).toBe('round');
  });

  it("mode 'system' removes data-theme", () => {
    html.setAttribute('data-theme', 'hc');
    applyTheme({ mode: 'system' });
    expect(html.hasAttribute('data-theme')).toBe(false);
  });

  it('leaves attributes alone for keys that are not given', () => {
    applyTheme({ mode: 'hc', accent: 'teal', shape: 'sharp' });
    applyTheme({ accent: 'amber' });
    expect(html.getAttribute('data-theme')).toBe('hc');
    expect(html.getAttribute('data-accent')).toBe('amber');
    expect(html.getAttribute('data-shape')).toBe('sharp');
    applyTheme();
    expect(html.getAttribute('data-accent')).toBe('amber');
  });

  it('targets a custom container', () => {
    const box = document.createElement('section');
    applyTheme({ mode: 'light', accent: 'slate' }, box);
    expect(box.getAttribute('data-theme')).toBe('light');
    expect(box.getAttribute('data-accent')).toBe('slate');
    expect(html.hasAttribute('data-theme')).toBe(false);
  });
});

describe('saveTheme / loadTheme', () => {
  it('round-trips a theme through localStorage under the documented key', () => {
    expect(THEME_STORAGE_KEY).toBe('orca-ui-theme');
    const choice = { mode: 'dark', accent: 'emerald', shape: 'default' };
    saveTheme(choice);
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY))).toEqual(choice);
    expect(loadTheme()).toEqual(choice);
  });

  it('returns null when nothing is saved', () => {
    expect(loadTheme()).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '{not json');
    expect(loadTheme()).toBeNull();
  });

  it('saveTheme ignores storage failures (quota / private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveTheme({ mode: 'dark' })).not.toThrow();
  });

  it('loadTheme returns null when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    expect(loadTheme()).toBeNull();
  });

  it('works when localStorage itself is missing', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    try {
      expect(() => saveTheme({ mode: 'hc' })).not.toThrow();
      expect(loadTheme()).toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'localStorage', original);
    }
  });
});

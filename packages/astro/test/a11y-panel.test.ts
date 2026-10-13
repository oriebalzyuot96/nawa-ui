// @vitest-environment jsdom
// client/a11y-panel.ts on the markup AccessibilityPanel.astro renders (renderA11yPanelHTML from core).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { A11Y_STORAGE_KEY, renderA11yPanelHTML } from '@pelagic-ui/core/a11y-prefs';
import { initA11yPanels } from '../src/client/a11y-panel';

const html = document.documentElement;
const dialog = () => document.querySelector<HTMLElement>('.pl-a11y-panel')!;
const radio = (name: string) => [...document.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent?.replace('Aa', '').trim() === name)!;
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(e);
  return e;
};

function host(attrs = '', options: Parameters<typeof renderA11yPanelHTML>[0] = {}) {
  document.body.innerHTML = `<main><button id="before">before</button></main><div class="pl-a11y-host" data-pl-a11y-host ${attrs}>${renderA11yPanelHTML({ id: 'p', ...options })}</div>`;
  initA11yPanels();
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  document.body.innerHTML = '';
  for (const a of [...html.attributes]) if (a.name.startsWith('data-a11y-')) html.removeAttribute(a.name);
  html.style.removeProperty('--pl-user-font-scale');
});

describe('client/a11y-panel', () => {
  it('moves the dialog to <body>, opens, traps Tab, closes on Escape and restores focus', () => {
    host();
    expect(dialog().parentElement).toBe(document.body);
    const trigger = document.querySelector<HTMLButtonElement>('[data-a11y-open]')!;
    trigger.focus();
    trigger.click();
    expect(dialog().hidden).toBe(false);
    expect(dialog().getAttribute('role')).toBe('dialog');
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog().getAttribute('aria-labelledby')!)!.textContent).toBe('Accessibility');
    expect(document.body.style.overflow).toBe('hidden');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe('p');
    expect(document.activeElement).toBe(dialog());
    // Tab from the dialog itself goes to its first control; Shift+Tab on the first wraps to the last.
    expect(key(dialog(), 'Tab').defaultPrevented).toBe(true);
    const first = document.activeElement as HTMLElement;
    expect(first.getAttribute('data-a11y-close')).not.toBeNull();
    expect(key(first, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(dialog().contains(document.activeElement)).toBe(true);
    key(document.activeElement!, 'Escape');
    expect(dialog().hidden).toBe(true);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
  });

  it('applies and saves every kind of control, announces changes and resets', () => {
    host();
    radio('Grayscale').click();
    expect(html.getAttribute('data-a11y-contrast')).toBe('gray');
    expect(document.querySelector('[role="status"]')!.textContent).toBe('Color scheme: Grayscale');
    const sw = document.querySelector<HTMLButtonElement>('[role="switch"][data-a11y-key="cursor"]')!;
    sw.click();
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(html.getAttribute('data-a11y-cursor')).toBe('large');
    const range = document.querySelector<HTMLInputElement>('input[type="range"]')!;
    range.value = '1.5';
    range.dispatchEvent(new Event('input', { bubbles: true }));
    expect(html.getAttribute('data-a11y-font-scale')).toBe('1.5');
    expect(range.getAttribute('aria-valuetext')).toBe('150%');
    document.querySelector<HTMLButtonElement>('[data-a11y-step="0.1"]')!.click();
    expect(html.getAttribute('data-a11y-font-scale')).toBe('1.6');
    expect(JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY)!)).toMatchObject({ contrast: 'gray', cursor: 'large', fontScale: 1.6 });
    expect(document.querySelector('[data-a11y-count]')!.textContent).toBe('3 active');
    expect(document.querySelector<HTMLElement>('[data-a11y-badge]')!.hidden).toBe(false);
    document.querySelector<HTMLButtonElement>('[data-a11y-reset]')!.click();
    expect([...html.attributes].some((a) => a.name.startsWith('data-a11y-'))).toBe(false);
    expect(document.querySelector('[role="status"]')!.textContent).toBe('All accessibility settings were reset.');
    expect(document.querySelector<HTMLButtonElement>('[data-a11y-reset]')!.disabled).toBe(true);
  });

  it('restores saved preferences and supports a scoped target', () => {
    localStorage.setItem('my-key', JSON.stringify({ contrast: 'white-black' }));
    document.body.innerHTML = '<section id="scope"></section>';
    const div = document.createElement('div');
    div.setAttribute('data-pl-a11y-host', '');
    div.setAttribute('data-persist', 'my-key');
    div.setAttribute('data-target', '#scope');
    div.innerHTML = renderA11yPanelHTML({ id: 'q' });
    document.body.appendChild(div);
    initA11yPanels();
    expect(document.getElementById('scope')!.getAttribute('data-a11y-contrast')).toBe('white-black');
    expect(html.hasAttribute('data-a11y-contrast')).toBe(false);
    expect(radio('White on black').getAttribute('aria-checked')).toBe('true');
  });

  it('arrow keys select in grids and segmented groups, RTL-aware', () => {
    host('', { locale: 'ar' });
    const tiles = [...document.querySelectorAll<HTMLElement>('[data-a11y-key="contrast"] [role="radio"]')];
    tiles[0].focus();
    key(tiles[0], 'ArrowDown');
    expect(html.getAttribute('data-a11y-contrast')).toBe('white-black');
    expect(document.activeElement).toBe(tiles[4]);
    key(tiles[4], 'Home');
    expect(html.hasAttribute('data-a11y-contrast')).toBe(false);
  });
});

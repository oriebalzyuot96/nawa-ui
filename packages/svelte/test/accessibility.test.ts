// AccessibilityPanel (Svelte): bindings, callbacks, persistence, keyboard, Arabic, and axe in every scheme.
// color-contrast / target-size need a layout engine; they run in tests/e2e and packages/core check-contrast.
import { render } from '@testing-library/svelte';
import axe from 'axe-core';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { A11Y_STORAGE_KEY, a11yOptions } from '@pelagic-ui/core/a11y-prefs';
import { AccessibilityPanel } from '../src/lib/index';
import A11yBind from './fixtures/A11yBind.svelte';

const html = document.documentElement;
const dialog = () => document.querySelector<HTMLElement>('.pl-a11y-panel')!;
const radio = (name: string) => [...document.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent?.replace('Aa', '').trim() === name)!;
const contrastRadio = (name: string) => [...document.querySelectorAll<HTMLElement>('[data-a11y-key="contrast"] [role="radio"]')].find((r) => r.textContent?.replace('Aa', '').trim() === name)!;
const byLabel = (role: string, name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[role="${role}"]`)].find((el) => document.getElementById(el.getAttribute('aria-labelledby') ?? '')?.textContent === name)!;

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  for (const a of [...html.attributes]) if (a.name.startsWith('data-a11y-')) html.removeAttribute(a.name);
  html.style.removeProperty('--pl-user-font-scale');
});

describe('AccessibilityPanel (Svelte)', () => {
  it('opens, closes on Escape and restores focus to the trigger', () => {
    render(AccessibilityPanel);
    flushSync();
    const trigger = document.querySelector<HTMLButtonElement>('[data-a11y-open]')!;
    trigger.click();
    expect(dialog().hidden).toBe(false);
    expect(document.activeElement).toBe(dialog());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dialog().hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('applies, persists and reports changes through onchange', () => {
    const onchange = vi.fn();
    render(AccessibilityPanel, { props: { open: true, onchange } });
    flushSync();
    contrastRadio('Black on yellow').click();
    expect(html.getAttribute('data-a11y-contrast')).toBe('black-yellow');
    expect(onchange).toHaveBeenLastCalledWith(expect.objectContaining({ contrast: 'black-yellow' }), { key: 'contrast', value: 'black-yellow' });
    expect(JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY)!).contrast).toBe('black-yellow');
    byLabel('switch', 'Larger click targets').click();
    expect(html.getAttribute('data-a11y-targets')).toBe('large');
    const select = document.querySelector<HTMLSelectElement>('select[data-a11y-key="colorFilter"]')!;
    select.value = 'achromatopsia';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(html.getAttribute('data-a11y-color-filter')).toBe('achromatopsia');
  });

  it('two-way binds prefs and open', async () => {
    const r = render(A11yBind, { props: { initial: { contrast: 'gray' } } });
    flushSync();
    expect(html.getAttribute('data-a11y-contrast')).toBe('gray');
    (r.getByTestId('set-invert') as HTMLButtonElement).click();
    flushSync();
    expect(html.getAttribute('data-a11y-contrast')).toBe('invert');
    (r.getByTestId('open') as HTMLButtonElement).click();
    flushSync();
    expect(dialog().hidden).toBe(false);
    contrastRadio('High contrast').click();
    flushSync();
    expect(r.getByTestId('contrast').textContent).toBe('hc');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flushSync();
    expect(r.getByTestId('open-state').textContent).toBe('false');
  });

  it('moves through options with the arrow keys and renders Arabic', () => {
    render(AccessibilityPanel, { props: { open: true, locale: 'ar', persist: false } });
    flushSync();
    expect(dialog().getAttribute('dir')).toBe('rtl');
    const item = document.querySelector<HTMLElement>('[data-a11y-key="motion"] [aria-checked="true"]')!;
    item.focus();
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(html.getAttribute('data-a11y-motion')).toBe('off');
    expect(radio('إيقاف')).toBe(document.activeElement);
  });

  it.each(a11yOptions.contrast)('the open panel passes axe with contrast "%s"', async (contrast) => {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ contrast, readableFont: true, readingGuide: true }));
    render(AccessibilityPanel, { props: { open: true } });
    flushSync();
    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false }, region: { enabled: false } } });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

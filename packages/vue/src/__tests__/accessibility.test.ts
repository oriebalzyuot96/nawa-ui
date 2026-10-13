// AccessibilityPanel (Vue): v-model, events, persistence, keyboard, Arabic, and axe in every color scheme.
// color-contrast / target-size need a layout engine; they run in tests/e2e and packages/core check-contrast.
import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { A11Y_STORAGE_KEY, a11yOptions, type A11yPrefs } from '@pelagic-ui/core/a11y-prefs';
import { AccessibilityPanel } from '../index';

const html = document.documentElement;
const dialog = () => document.querySelector<HTMLElement>('.pl-a11y-panel')!;
const radio = (name: string) => [...document.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent?.replace('Aa', '').trim() === name)!;
const byLabel = (role: string, name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[role="${role}"]`)].find((el) => document.getElementById(el.getAttribute('aria-labelledby') ?? '')?.textContent === name)!;

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  for (const a of [...html.attributes]) if (a.name.startsWith('data-a11y-')) html.removeAttribute(a.name);
  html.style.removeProperty('--pl-user-font-scale');
});

describe('AccessibilityPanel (Vue)', () => {
  it('opens from the trigger, traps nothing outside, closes on Escape and restores focus', async () => {
    const w = mount(AccessibilityPanel, { attachTo: document.body });
    const trigger = document.querySelector<HTMLButtonElement>('[data-a11y-open]')!;
    expect(trigger.getAttribute('aria-label')).toBe('Accessibility settings');
    trigger.click();
    expect(dialog().hidden).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(dialog());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dialog().hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    w.unmount();
  });

  it('applies changes, emits update:modelValue and change, and persists', async () => {
    const w = mount(AccessibilityPanel, { attachTo: document.body, props: { open: true } });
    radio('White on black').click();
    expect(html.getAttribute('data-a11y-contrast')).toBe('white-black');
    expect((w.emitted('update:modelValue')!.slice(-1)[0][0] as A11yPrefs).contrast).toBe('white-black');
    expect(w.emitted('change')!.slice(-1)[0][1]).toEqual({ key: 'contrast', value: 'white-black' });
    expect(JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY)!).contrast).toBe('white-black');
    expect(document.querySelector('[role="status"]')!.textContent).toBe('Color scheme: White on black');
    byLabel('switch', 'Reading guide').click();
    expect(document.querySelector('.pl-a11y-reading-guide')).not.toBeNull();
    document.querySelector<HTMLButtonElement>('[data-a11y-reset]')!.click();
    expect(html.hasAttribute('data-a11y-contrast')).toBe(false);
    expect(document.querySelector('.pl-a11y-reading-guide')).toBeNull();
    w.unmount();
  });

  it('follows v-model from the parent', async () => {
    const prefs = ref<Partial<A11yPrefs>>({ contrast: 'gray' });
    const Parent = defineComponent({
      setup: () => () => h(AccessibilityPanel, { modelValue: prefs.value, persist: false, 'onUpdate:modelValue': (v: A11yPrefs) => (prefs.value = v) }),
    });
    const w = mount(Parent, { attachTo: document.body });
    expect(html.getAttribute('data-a11y-contrast')).toBe('gray');
    prefs.value = { contrast: 'invert', fontScale: 1.5 };
    await nextTick();
    expect(html.getAttribute('data-a11y-contrast')).toBe('invert');
    expect(html.getAttribute('data-a11y-font-scale')).toBe('1.5');
    w.unmount();
  });

  it('arrow keys move the checked radio (roving tabindex)', () => {
    const w = mount(AccessibilityPanel, { attachTo: document.body, props: { open: true, persist: false } });
    const first = radio('Theme');
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(html.getAttribute('data-a11y-contrast')).toBe('hc');
    expect(document.activeElement).toBe(radio('High contrast'));
    expect(radio('High contrast').tabIndex).toBe(0);
    expect(radio('Theme').tabIndex).toBe(-1);
    w.unmount();
  });

  it('renders Arabic', () => {
    const w = mount(AccessibilityPanel, { attachTo: document.body, props: { locale: 'ar', open: true, persist: false } });
    expect(dialog().getAttribute('dir')).toBe('rtl');
    expect(dialog().getAttribute('lang')).toBe('ar');
    expect(radio('أصفر على أسود')).toBeTruthy();
    w.unmount();
  });

  it.each(a11yOptions.contrast)('the open panel passes axe with contrast "%s"', async (contrast) => {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ contrast, fontScale: 1.25, focus: 'large', links: 'highlight' }));
    const w = mount(defineComponent({ setup: () => () => h('main', [h('h1', 'Page'), h(AccessibilityPanel, { open: true })]) }), { attachTo: document.body });
    await nextTick();
    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } } });
    expect(results.violations.map((v) => v.id)).toEqual([]);
    w.unmount();
  });
});

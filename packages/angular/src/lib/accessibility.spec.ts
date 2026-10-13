import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { A11Y_STORAGE_KEY, a11yOptions, type A11yPrefs } from '@pelagic-ui/core/a11y-prefs';
import { PlAccessibilityPanel } from './accessibility';

const html = document.documentElement;
const dialog = () => document.querySelector<HTMLElement>('.pl-a11y-panel')!;
const radio = (name: string) => [...document.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent?.replace('Aa', '').trim() === name)!;

function cleanup() {
  localStorage.clear();
  for (const a of [...html.attributes]) if (a.name.startsWith('data-a11y-')) html.removeAttribute(a.name);
  html.style.removeProperty('--pl-user-font-scale');
  document.querySelectorAll('.pl-a11y-panel, .pl-a11y-backdrop, .pl-a11y-reading-guide, .pl-a11y-reading-mask').forEach((n) => n.remove());
}

describe('PlAccessibilityPanel', () => {
  @Component({
    imports: [PlAccessibilityPanel],
    template: `<pl-accessibility-panel [(prefs)]="prefs" [(open)]="open" [locale]="locale()" (changed)="changes.push($event.change)" />`,
  })
  class Host {
    prefs = signal<Partial<A11yPrefs> | undefined>(undefined);
    open = signal(false);
    locale = signal<string | undefined>(undefined);
    changes: unknown[] = [];
  }

  afterEach(cleanup);

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture;
  }

  it('opens from the trigger, closes on Escape and returns focus', async () => {
    const fixture = await setup();
    const trigger = document.querySelector<HTMLButtonElement>('[data-a11y-open]')!;
    trigger.click();
    await fixture.whenStable();
    expect(dialog().hidden).toBe(false);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(document.activeElement).toBe(dialog());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(dialog().hidden).toBe(true);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
    fixture.destroy();
  });

  it('applies, persists, emits and two-way binds prefs', async () => {
    const fixture = await setup();
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    radio('Yellow on black').click();
    await fixture.whenStable();
    expect(html.getAttribute('data-a11y-contrast')).toBe('yellow-black');
    expect(fixture.componentInstance.prefs()?.contrast).toBe('yellow-black');
    expect(fixture.componentInstance.changes.at(-1)).toEqual({ key: 'contrast', value: 'yellow-black' });
    expect(JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY)!).contrast).toBe('yellow-black');
    fixture.componentInstance.prefs.set({ contrast: 'gray', fontScale: 1.75 });
    await fixture.whenStable();
    expect(html.getAttribute('data-a11y-contrast')).toBe('gray');
    expect(html.getAttribute('data-a11y-font-scale')).toBe('1.75');
    fixture.destroy();
  });

  it('renders Arabic labels right-to-left', async () => {
    const fixture = await setup();
    fixture.componentInstance.locale.set('ar');
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    expect(dialog().getAttribute('dir')).toBe('rtl');
    expect(radio('أبيض على أسود')).toBeTruthy();
    fixture.destroy();
  });

  for (const contrast of a11yOptions.contrast) {
    it(`the open panel passes axe with contrast "${contrast}"`, async () => {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ contrast, links: 'highlight', largeTargets: true }));
      const fixture = await setup();
      fixture.componentInstance.open.set(true);
      await fixture.whenStable();
      const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false }, region: { enabled: false } } });
      expect(results.violations.map((v) => v.id)).toEqual([]);
      fixture.destroy();
    });
  }
});

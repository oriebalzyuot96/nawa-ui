import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NwButton } from './button';
import { NwDialog, NwDialogFooter, NwDrawer } from './overlay';
import { NwTooltip } from './tooltip';
import { NwToastService, NwToaster } from './toast';
import { NawaThemeService, provideNawaTheme } from './theme';
import { THEME_STORAGE_KEY } from '@nawa-ui/core/theme';

const press = (key: string, target: EventTarget = document, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));

describe('NwDialog', () => {
  @Component({
    imports: [NwDialog, NwDialogFooter, NwButton],
    template: `
      <button nwButton id="opener" (click)="open.set(true)">Open</button>
      <nw-dialog [(open)]="open" title="Edit profile" (closed)="closedCount = closedCount + 1">
        <input id="first" />
        <div nwDialogFooter><button nwButton id="last">Save</button></div>
      </nw-dialog>
    `,
  })
  class Host {
    open = signal(false);
    closedCount = 0;
  }

  afterEach(() => {
    document.body.style.overflow = '';
  });

  async function openDialog() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    await fixture.whenStable();
    const panel = document.body.querySelector('[role="dialog"]') as HTMLElement;
    return { fixture, opener, panel };
  }

  it('portals to body with aria-modal and aria-labelledby, focuses the panel and locks scroll', async () => {
    const { fixture, panel } = await openDialog();
    expect(panel).not.toBeNull();
    expect(panel.parentElement?.parentElement).toBe(document.body);
    expect(panel.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(panel.getAttribute('aria-labelledby')!);
    expect(title?.textContent).toContain('Edit profile');
    expect(panel.querySelector('.nw-dialog__footer #last')).not.toBeNull();
    expect(document.activeElement).toBe(panel);
    expect(document.body.style.overflow).toBe('hidden');
    fixture.destroy();
  });

  it('traps Tab inside the panel', async () => {
    const { fixture, panel } = await openDialog();
    const close = panel.querySelector('.nw-close') as HTMLButtonElement;
    const last = panel.querySelector('#last') as HTMLButtonElement;
    last.focus();
    const forward = press('Tab', last);
    expect(forward).toBe(false); // default prevented
    expect(document.activeElement).toBe(close);
    press('Tab', close, { shiftKey: true });
    expect(document.activeElement).toBe(last);
    fixture.destroy();
  });

  it('closes on Escape, restores scroll and returns focus to the opener', async () => {
    const { fixture, opener } = await openDialog();
    press('Escape');
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.closedCount).toBe(1);
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
  });

  it('closes on backdrop mousedown but not on panel mousedown', async () => {
    const { fixture, panel } = await openDialog();
    panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);
    panel.parentElement!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('removes the portaled overlay when destroyed while open', async () => {
    const { fixture } = await openDialog();
    fixture.destroy();
    expect(document.body.querySelector('.nw-overlay')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});

describe('NwDrawer', () => {
  @Component({
    imports: [NwDrawer],
    template: `<nw-drawer [(open)]="open" title="Filters" side="left"><button id="inside">x</button></nw-drawer>`,
  })
  class Host {
    open = signal(true);
  }

  it('renders drawer classes and closes on Escape', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const panel = document.body.querySelector('.nw-drawer') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.classList).not.toContain('nw-drawer--right');
    expect(panel.parentElement?.className).toBe('nw-overlay nw-overlay--drawer');
    press('Escape');
    await fixture.whenStable();
    expect(document.body.querySelector('.nw-drawer')).toBeNull();
  });
});

describe('NwTooltip', () => {
  @Component({
    imports: [NwTooltip],
    template: `<button id="t" nwTooltip="Copy link" aria-describedby="extra">Copy</button><span id="extra">x</span>`,
  })
  class Host {}

  it('sets aria-describedby on the host and hides on Escape', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('#t') as HTMLButtonElement;
    const ids = button.getAttribute('aria-describedby')!.split(' ');
    expect(ids[0]).toBe('extra');
    const bubble = document.getElementById(ids[1])!;
    expect(bubble.getAttribute('role')).toBe('tooltip');
    expect(bubble.textContent).toBe('Copy link');
    expect(button.textContent).toBe('Copy'); // tooltip text is not part of the accessible name

    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(bubble.style.opacity).toBe('1');
    press('Escape', button);
    expect(bubble.style.opacity).toBe('0');
    expect(bubble.hasAttribute('data-hidden')).toBe(true);

    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(bubble.style.opacity).toBe('1');
    button.dispatchEvent(new MouseEvent('mouseleave'));
    expect(bubble.style.opacity).toBe('0');

    fixture.destroy();
    expect(document.getElementById(ids[1])).toBeNull();
  });
});

describe('NwToastService + nw-toaster', () => {
  @Component({ imports: [NwToaster], template: `<nw-toaster />` })
  class Host {}

  afterEach(() => {
    vi.useRealTimers();
    TestBed.inject(NwToastService).clear();
  });

  it('shows and dismisses toasts in a polite live region', async () => {
    const fixture = TestBed.createComponent(Host);
    const toasts = TestBed.inject(NwToastService);
    await fixture.whenStable();
    const stack = fixture.nativeElement.querySelector('nw-toaster') as HTMLElement;
    expect(stack.getAttribute('role')).toBe('status');
    expect(stack.getAttribute('aria-live')).toBe('polite');
    expect(stack.classList).toContain('nw-toast-stack');

    const id = toasts.show({ title: 'Saved', message: 'All good', variant: 'success', duration: 0 });
    toasts.show('Plain message');
    await fixture.whenStable();
    const items = stack.querySelectorAll('.nw-toast');
    expect(items.length).toBe(2);
    expect(items[0].className).toBe('nw-toast nw-toast--success');
    expect(items[0].querySelector('.nw-toast__title')?.textContent).toBe('Saved');

    toasts.dismiss(id);
    await fixture.whenStable();
    expect(stack.querySelectorAll('.nw-toast').length).toBe(1);

    (stack.querySelector('.nw-close') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(toasts.toasts().length).toBe(0);
  });

  it('auto-dismisses and pauses while hovered or focused', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const toasts = TestBed.inject(NwToastService);
    const stack = fixture.nativeElement.querySelector('nw-toaster') as HTMLElement;

    toasts.show({ message: 'Hi', duration: 1000 });
    vi.advanceTimersByTime(400);
    stack.dispatchEvent(new MouseEvent('mouseenter'));
    expect(toasts.isPaused).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(toasts.toasts().length).toBe(1);

    stack.dispatchEvent(new MouseEvent('mouseleave'));
    expect(toasts.isPaused).toBe(false);
    vi.advanceTimersByTime(500);
    expect(toasts.toasts().length).toBe(1);
    vi.advanceTimersByTime(150);
    expect(toasts.toasts().length).toBe(0);

    toasts.show({ message: 'Again', duration: 1000 });
    stack.dispatchEvent(new FocusEvent('focusin'));
    vi.advanceTimersByTime(3000);
    expect(toasts.toasts().length).toBe(1);
    stack.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }));
    vi.advanceTimersByTime(1000);
    expect(toasts.toasts().length).toBe(0);
  });
});

describe('Theme', () => {
  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    for (const a of ['data-theme', 'data-accent', 'data-shape']) document.documentElement.removeAttribute(a);
  });

  it('provideNawaTheme applies the theme on startup', () => {
    TestBed.configureTestingModule({ providers: [provideNawaTheme({ mode: 'dark', accent: 'rose', shape: 'round' })] });
    const service = TestBed.inject(NawaThemeService);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-accent')).toBe('rose');
    expect(document.documentElement.getAttribute('data-shape')).toBe('round');
    expect(service.theme()).toEqual({ mode: 'dark', accent: 'rose', shape: 'round' });
  });

  it('NawaThemeService persists and restores a choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'hc' }));
    TestBed.configureTestingModule({ providers: [provideNawaTheme({ mode: 'light', accent: 'teal' })] });
    const service = TestBed.inject(NawaThemeService);
    expect(service.theme()).toEqual({ mode: 'hc', accent: 'teal' });
    service.set({ mode: 'system' }, { persist: true });
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!)).toEqual({ mode: 'system', accent: 'teal' });
  });
});

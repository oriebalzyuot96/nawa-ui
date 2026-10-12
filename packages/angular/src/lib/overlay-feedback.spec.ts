import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OcButton } from './button';
import { OcDialog, OcDialogFooter, OcDrawer } from './overlay';
import { OcTooltip } from './tooltip';
import { OcToastService, OcToaster } from './toast';
import { OrcaThemeService, provideOrcaTheme } from './theme';
import { THEME_STORAGE_KEY } from '@orca-ui/core/theme';

const press = (key: string, target: EventTarget = document, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));

describe('OcDialog', () => {
  @Component({
    imports: [OcDialog, OcDialogFooter, OcButton],
    template: `
      <button ocButton id="opener" (click)="open.set(true)">Open</button>
      <oc-dialog [(open)]="open" title="Edit profile" (closed)="closedCount = closedCount + 1">
        <input id="first" />
        <div ocDialogFooter><button ocButton id="last">Save</button></div>
      </oc-dialog>
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
    expect(panel.querySelector('.oc-dialog__footer #last')).not.toBeNull();
    expect(document.activeElement).toBe(panel);
    expect(document.body.style.overflow).toBe('hidden');
    fixture.destroy();
  });

  it('traps Tab inside the panel', async () => {
    const { fixture, panel } = await openDialog();
    const close = panel.querySelector('.oc-close') as HTMLButtonElement;
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
    expect(document.body.querySelector('.oc-overlay')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});

describe('OcDrawer', () => {
  @Component({
    imports: [OcDrawer],
    template: `<oc-drawer [(open)]="open" title="Filters" side="left"><button id="inside">x</button></oc-drawer>`,
  })
  class Host {
    open = signal(true);
  }

  it('renders drawer classes and closes on Escape', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const panel = document.body.querySelector('.oc-drawer') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.classList).not.toContain('oc-drawer--right');
    expect(panel.parentElement?.className).toBe('oc-overlay oc-overlay--drawer');
    press('Escape');
    await fixture.whenStable();
    expect(document.body.querySelector('.oc-drawer')).toBeNull();
  });
});

describe('OcTooltip', () => {
  @Component({
    imports: [OcTooltip],
    template: `<button id="t" ocTooltip="Copy link" aria-describedby="extra">Copy</button><span id="extra">x</span>`,
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

describe('OcToastService + oc-toaster', () => {
  @Component({ imports: [OcToaster], template: `<oc-toaster />` })
  class Host {}

  afterEach(() => {
    vi.useRealTimers();
    TestBed.inject(OcToastService).clear();
  });

  it('shows and dismisses toasts in a polite live region', async () => {
    const fixture = TestBed.createComponent(Host);
    const toasts = TestBed.inject(OcToastService);
    await fixture.whenStable();
    const stack = fixture.nativeElement.querySelector('oc-toaster') as HTMLElement;
    expect(stack.getAttribute('role')).toBe('status');
    expect(stack.getAttribute('aria-live')).toBe('polite');
    expect(stack.classList).toContain('oc-toast-stack');

    const id = toasts.show({ title: 'Saved', message: 'All good', variant: 'success', duration: 0 });
    toasts.show('Plain message');
    await fixture.whenStable();
    const items = stack.querySelectorAll('.oc-toast');
    expect(items.length).toBe(2);
    expect(items[0].className).toBe('oc-toast oc-toast--success');
    expect(items[0].querySelector('.oc-toast__title')?.textContent).toBe('Saved');

    toasts.dismiss(id);
    await fixture.whenStable();
    expect(stack.querySelectorAll('.oc-toast').length).toBe(1);

    (stack.querySelector('.oc-close') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(toasts.toasts().length).toBe(0);
  });

  it('auto-dismisses and pauses while hovered or focused', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const toasts = TestBed.inject(OcToastService);
    const stack = fixture.nativeElement.querySelector('oc-toaster') as HTMLElement;

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

  it('provideOrcaTheme applies the theme on startup', () => {
    TestBed.configureTestingModule({ providers: [provideOrcaTheme({ mode: 'dark', accent: 'rose', shape: 'round' })] });
    const service = TestBed.inject(OrcaThemeService);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-accent')).toBe('rose');
    expect(document.documentElement.getAttribute('data-shape')).toBe('round');
    expect(service.theme()).toEqual({ mode: 'dark', accent: 'rose', shape: 'round' });
  });

  it('OrcaThemeService persists and restores a choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'hc' }));
    TestBed.configureTestingModule({ providers: [provideOrcaTheme({ mode: 'light', accent: 'teal' })] });
    const service = TestBed.inject(OrcaThemeService);
    expect(service.theme()).toEqual({ mode: 'hc', accent: 'teal' });
    service.set({ mode: 'system' }, { persist: true });
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!)).toEqual({ mode: 'system', accent: 'teal' });
  });
});

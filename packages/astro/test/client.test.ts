// @vitest-environment jsdom
// The client scripts (src/client/*.ts) are plain DOM modules imported by the Astro components.
// Markup below mirrors what the components render (see components.test.ts).
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  // jsdom has <dialog> but not its modal API; emulate the parts the overlay script relies on.
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { __nwPolyfill?: boolean };
  if (typeof proto.showModal !== 'function' || !proto.__nwPolyfill) {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto.close = function close(this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
    proto.__nwPolyfill = true;
  }
  await import('../src/client/overlay');
  await import('../src/client/tabs');
  await import('../src/client/switch');
  await import('../src/client/slider');
  await import('../src/client/toast');
  await import('../src/client/tooltip');
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

const key = (el: Element, k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
};

describe('client/tabs', () => {
  const markup = `
    <div class="pl-tabs" data-pl-tabs>
      <div role="tablist">
        <button role="tab" id="t-a" aria-controls="p-a" aria-selected="true" tabindex="0">A</button>
        <button role="tab" id="t-b" aria-controls="p-b" aria-selected="false" tabindex="-1" disabled>B</button>
        <button role="tab" id="t-c" aria-controls="p-c" aria-selected="false" tabindex="-1">C</button>
        <button role="tab" id="t-d" aria-controls="p-d" aria-selected="false" tabindex="-1">D</button>
      </div>
      <div role="tabpanel" id="p-a">a</div>
      <div role="tabpanel" id="p-b" hidden>b</div>
      <div role="tabpanel" id="p-c" hidden>c</div>
      <div role="tabpanel" id="p-d" hidden>d</div>
    </div>`;
  const $ = (id: string) => document.getElementById(id)!;
  const selected = () => [...document.querySelectorAll('[role="tab"]')].filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.id);
  const visible = () => [...document.querySelectorAll<HTMLElement>('[role="tabpanel"]')].filter((p) => !p.hidden).map((p) => p.id);

  it('arrow keys move selection, focus and roving tabindex, skipping disabled tabs', () => {
    document.body.innerHTML = markup;
    $('t-a').focus();
    expect(key($('t-a'), 'ArrowRight').defaultPrevented).toBe(true);
    expect(selected()).toEqual(['t-c']);
    expect(document.activeElement).toBe($('t-c'));
    expect(visible()).toEqual(['p-c']);
    expect($('t-c').tabIndex).toBe(0);
    expect($('t-a').tabIndex).toBe(-1);
    key($('t-c'), 'ArrowLeft');
    expect(selected()).toEqual(['t-a']);
    key($('t-a'), 'ArrowLeft');
    expect(selected()).toEqual(['t-d']); // wraps
    key($('t-d'), 'Home');
    expect(document.activeElement).toBe($('t-a'));
    key($('t-a'), 'End');
    expect(document.activeElement).toBe($('t-d'));
    expect(visible()).toEqual(['p-d']);
  });

  it('ignores other keys', () => {
    document.body.innerHTML = markup;
    expect(key($('t-a'), 'Enter').defaultPrevented).toBe(false);
    expect(selected()).toEqual(['t-a']);
  });

  it('click selects without moving focus; disabled tabs are ignored', () => {
    document.body.innerHTML = markup;
    $('t-c').click();
    expect(selected()).toEqual(['t-c']);
    expect(visible()).toEqual(['p-c']);
    $('t-b').dispatchEvent(new MouseEvent('click', { bubbles: true })); // disabled
    expect(selected()).toEqual(['t-c']);
  });

  it('only handles tabs inside [data-pl-tabs]', () => {
    document.body.innerHTML = '<div class="pl-tabs"><button role="tab" id="x" aria-selected="false">X</button></div>';
    $('x').click();
    expect($('x').getAttribute('aria-selected')).toBe('false');
  });
});

describe('client/overlay', () => {
  const markup = `
    <button id="open" data-pl-open="dlg" aria-expanded="false">Open</button>
    <dialog id="dlg" class="pl-dialog"><button id="x" data-pl-close aria-label="Close">×</button><p id="content">Body</p></dialog>
    <button id="open-drawer" data-pl-open="drw"><span id="inner">Filters</span></button>
    <dialog id="drw" class="pl-drawer pl-drawer--right"><button data-pl-close>Done</button></dialog>`;
  const $ = (id: string) => document.getElementById(id)!;

  it('opens with data-pl-open, mirrors aria-expanded and closes with data-pl-close', () => {
    document.body.innerHTML = markup;
    $('open').click();
    expect(($('dlg') as HTMLDialogElement).open).toBe(true);
    expect($('open').getAttribute('aria-expanded')).toBe('true');
    $('content').click(); // content clicks keep it open
    expect(($('dlg') as HTMLDialogElement).open).toBe(true);
    $('x').click();
    expect(($('dlg') as HTMLDialogElement).open).toBe(false);
    expect($('open').getAttribute('aria-expanded')).toBe('false');
  });

  it('a click on the backdrop (the <dialog> itself) closes it', () => {
    document.body.innerHTML = markup;
    $('inner').click(); // click on a child of the opener
    const drawer = $('drw') as HTMLDialogElement;
    expect(drawer.open).toBe(true);
    drawer.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.open).toBe(false);
    expect($('open-drawer').getAttribute('aria-expanded')).toBe('false');
  });

  it('Escape (native cancel → close) resets aria-expanded', () => {
    document.body.innerHTML = markup;
    $('open').click();
    ($('dlg') as HTMLDialogElement).close(); // what the browser does on Escape
    expect($('open').getAttribute('aria-expanded')).toBe('false');
  });

  it('does not reopen an open dialog or touch unknown ids', () => {
    document.body.innerHTML = markup + '<button id="ghost" data-pl-open="nope">?</button>';
    const spy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    $('open').click();
    $('open').click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(() => $('ghost').click()).not.toThrow();
    spy.mockRestore();
  });
});

describe('client/tooltip', () => {
  it('links the trigger with aria-describedby (keeping existing ids) and Escape dismisses until leave/blur', () => {
    document.body.innerHTML = `
      <span class="pl-tooltip" data-pl-tooltip id="wrap">
        <button id="trigger" aria-describedby="help">Copy</button>
        <span role="tooltip" id="tip">Copy link</span>
      </span>
      <span class="pl-tooltip" data-pl-tooltip id="wrap2"><span role="tooltip" id="tip2">orphan</span></span>`;
    document.dispatchEvent(new Event('astro:page-load'));
    const wrap = document.getElementById('wrap')!;
    const trigger = document.getElementById('trigger')!;
    expect(trigger.getAttribute('aria-describedby')).toBe('help tip');
    key(trigger, 'Escape');
    expect(wrap.hasAttribute('data-dismissed')).toBe(true);
    wrap.dispatchEvent(new MouseEvent('mouseleave'));
    expect(wrap.hasAttribute('data-dismissed')).toBe(false);
    key(trigger, 'Escape');
    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(wrap.hasAttribute('data-dismissed')).toBe(false);
    // the bubble is never described by itself
    expect(document.getElementById('tip2')!.hasAttribute('aria-describedby')).toBe(false);
  });

  it('wires each tooltip only once', () => {
    document.body.innerHTML = `<span class="pl-tooltip" data-pl-tooltip><button id="b">B</button><span role="tooltip" id="t">T</span></span>`;
    document.dispatchEvent(new Event('astro:page-load'));
    document.dispatchEvent(new Event('astro:page-load'));
    expect(document.getElementById('b')!.getAttribute('aria-describedby')).toBe('t');
  });
});

describe('client/switch', () => {
  it('toggles aria-checked, mirrors a hidden input and emits pl-change', () => {
    document.body.innerHTML = `
      <span class="pl-check"><button type="button" role="switch" class="pl-switch" aria-checked="false" data-pl-switch id="s"></button><input type="hidden" name="wifi" value="" id="h" /></span>
      <button type="button" role="switch" class="pl-switch" aria-checked="false" data-pl-switch id="d" disabled></button>`;
    const sw = document.getElementById('s')!;
    const hidden = document.getElementById('h') as HTMLInputElement;
    const events: boolean[] = [];
    document.addEventListener('pl-change', (e) => events.push((e as CustomEvent<{ checked: boolean }>).detail.checked));
    sw.click();
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(hidden.value).toBe('on');
    sw.click();
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(hidden.value).toBe('');
    expect(events).toEqual([true, false]);
    const disabled = document.getElementById('d')!;
    disabled.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(disabled.getAttribute('aria-checked')).toBe('false');
  });
});

describe('client/slider', () => {
  it('keeps the <output> in sync with the range input', () => {
    document.body.innerHTML = `
      <label for="r">Volume <output id="r-out" for="r">50</output></label>
      <input id="r" type="range" class="pl-slider" value="50" data-pl-output="r-out" />
      <input id="plain" type="range" class="pl-slider" value="10" />`;
    const input = document.getElementById('r') as HTMLInputElement;
    input.value = '72';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.getElementById('r-out')!.textContent).toBe('72');
    const plain = document.getElementById('plain') as HTMLInputElement;
    plain.value = '11';
    expect(() => plain.dispatchEvent(new Event('input', { bubbles: true }))).not.toThrow();
  });
});

describe('client/toast', () => {
  const region = () => document.querySelector('section.pl-toaster')!;
  const items = () => [...region().querySelectorAll('.pl-toaster__toast[data-state="open"]')];
  const mount = (config = {}) => {
    document.body.innerHTML = `<template data-pl-toaster data-config='${JSON.stringify(config)}'></template>`;
  };
  afterEach(() => window.pelagicToaster.remove());

  it('window.pelagicToast shows a toast with title, message, type icon and a labelled dismiss button', () => {
    mount({ closeButton: true });
    window.pelagicToast({ title: 'Saved', message: 'All good', variant: 'success', duration: 0 });
    const toast = items()[0];
    expect(toast.getAttribute('data-type')).toBe('success');
    expect(toast.querySelector('.pl-toaster__title')!.textContent).toBe('Saved');
    expect(toast.querySelector('.pl-toaster__desc')!.textContent).toBe('All good');
    expect(toast.querySelector('.pl-toast-ico--success')).not.toBeNull();
    const close = toast.querySelector<HTMLButtonElement>('[data-toast-close]')!;
    expect(close.getAttribute('aria-label')).toBe('Dismiss notification');
    expect(close.type).toBe('button');
    close.click();
    expect(toast.getAttribute('data-state')).toBe('closed');
  });

  it('treats text as text (no HTML injection)', () => {
    mount();
    window.pelagicToast({ message: '<img src=x onerror=alert(1)>', duration: 0 });
    expect(region().querySelector('img')).toBeNull();
    expect(items()[0].querySelector('.pl-toaster__title')!.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('auto-dismisses after the duration and pauses while hovered', () => {
    vi.useFakeTimers();
    mount();
    window.pelagicToast({ message: 'Bye', duration: 1000 });
    const list = region().querySelector('ol')!;
    vi.advanceTimersByTime(600);
    list.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(5000);
    expect(items()).toHaveLength(1);
    list.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(399);
    expect(items()).toHaveLength(1);
    vi.advanceTimersByTime(2);
    expect(items()).toHaveLength(0);
  });

  it('honours the configured position and the full toast() API', async () => {
    mount({ position: 'top-center' });
    expect(window.pelagicToast({ message: 'x', duration: 0 })).toBeTruthy();
    expect(region().classList.contains('pl-toaster--top-center')).toBe(true);
    let resolve!: (v: string) => void;
    window.pelagicToaster.promise(new Promise<string>((r) => (resolve = r)), { loading: 'Saving', success: 'Saved', error: 'Failed' });
    expect(region().querySelector('[data-type="loading"]')).not.toBeNull();
    resolve('ok');
    await Promise.resolve();
    await Promise.resolve();
    expect(region().querySelector('[data-type="success"] .pl-toast-ico[data-morph]')).not.toBeNull();
  });

  it('does nothing without a Toaster on the page', () => {
    document.body.innerHTML = '';
    expect(() => window.pelagicToast({ message: 'nowhere' })).not.toThrow();
    expect(document.querySelector('.pl-toaster')).toBeNull();
  });
});

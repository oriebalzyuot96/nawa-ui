// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { getFocusable, lockScroll, trapFocus } from '../src/a11y.js';

function tab(target, shiftKey = false) {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function mount(html) {
  const root = document.createElement('div');
  root.tabIndex = -1;
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
});

describe('getFocusable', () => {
  it('returns focusable descendants in DOM order', () => {
    const root = mount(`
      <a href="#x" id="a">link</a>
      <a id="no-href">not focusable</a>
      <button id="b">ok</button>
      <button disabled>disabled</button>
      <input id="c" />
      <input type="hidden" />
      <input disabled />
      <select id="d"><option>1</option></select>
      <textarea id="e"></textarea>
      <div tabindex="0" id="f"></div>
      <div tabindex="-1">programmatic only</div>
      <div contenteditable="true" id="g"></div>
    `);
    expect(getFocusable(root).map((el) => el.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('skips hidden, inert and aria-hidden subtrees', () => {
    const root = mount(`
      <button id="visible">v</button>
      <div hidden><button>hidden</button></div>
      <div inert><button>inert</button></div>
      <div aria-hidden="true"><button>aria-hidden</button></div>
      <button hidden>hidden itself</button>
    `);
    expect(getFocusable(root).map((el) => el.id)).toEqual(['visible']);
  });
});

describe('trapFocus', () => {
  it('wraps Tab from the last item to the first', () => {
    const root = mount('<button id="first">1</button><button id="mid">2</button><button id="last">3</button>');
    const release = trapFocus(root);
    root.querySelector('#last').focus();
    const event = tab(document.activeElement);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement.id).toBe('first');
    release();
  });

  it('wraps Shift+Tab from the first item to the last', () => {
    const root = mount('<button id="first">1</button><button id="last">2</button>');
    const release = trapFocus(root);
    root.querySelector('#first').focus();
    const event = tab(document.activeElement, true);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement.id).toBe('last');
    release();
  });

  it('Shift+Tab from the container itself goes to the last item', () => {
    const root = mount('<button id="first">1</button><button id="last">2</button>');
    const release = trapFocus(root);
    root.focus();
    tab(root, true);
    expect(document.activeElement.id).toBe('last');
    release();
  });

  it('lets the browser move focus between middle items', () => {
    const root = mount('<button id="first">1</button><button id="mid">2</button><button id="last">3</button>');
    const release = trapFocus(root);
    root.querySelector('#mid').focus();
    expect(tab(document.activeElement).defaultPrevented).toBe(false);
    expect(tab(document.activeElement, true).defaultPrevented).toBe(false);
    release();
  });

  it('ignores hidden and inert items when finding the edges', () => {
    const root = mount(`
      <button id="first">1</button>
      <button id="last">2</button>
      <div hidden><button id="hidden">h</button></div>
      <div inert><button id="inert">i</button></div>
    `);
    const release = trapFocus(root);
    root.querySelector('#last').focus();
    tab(document.activeElement);
    expect(document.activeElement.id).toBe('first');
    release();
  });

  it('keeps focus on the container when nothing inside is focusable', () => {
    const root = mount('<p>No controls</p>');
    const release = trapFocus(root);
    const event = tab(root);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(root);
    release();
  });

  it('ignores keys other than Tab', () => {
    const root = mount('<button id="only">1</button>');
    const release = trapFocus(root);
    root.querySelector('#only').focus();
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    document.activeElement.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    release();
  });

  it('cleanup removes the trap', () => {
    const root = mount('<button id="first">1</button><button id="last">2</button>');
    const release = trapFocus(root);
    release();
    root.querySelector('#last').focus();
    expect(tab(document.activeElement).defaultPrevented).toBe(false);
    expect(document.activeElement.id).toBe('last');
  });
});

describe('lockScroll', () => {
  it('sets overflow hidden and restores the previous value', () => {
    document.body.style.overflow = 'scroll';
    const release = lockScroll();
    expect(document.body.style.overflow).toBe('hidden');
    release();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('restores an empty value when nothing was set', () => {
    const release = lockScroll();
    expect(document.body.style.overflow).toBe('hidden');
    release();
    expect(document.body.style.overflow).toBe('');
  });

  it('nested locks restore in LIFO order', () => {
    const outer = lockScroll();
    const inner = lockScroll();
    inner();
    expect(document.body.style.overflow).toBe('hidden');
    outer();
    expect(document.body.style.overflow).toBe('');
  });
});

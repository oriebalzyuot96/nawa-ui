// Behaviour + ARIA for the Vue components not covered by components.test.ts.
import { mount } from '@vue/test-utils';
import { h, markRaw, nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Accordion,
  Alert,
  Avatar,
  Breadcrumb,
  Card,
  Checkbox,
  Divider,
  Drawer,
  EmptyState,
  ProgressBar,
  RadioGroup,
  Segmented,
  Select,
  Skeleton,
  SkeletonText,
  Slider,
  Spinner,
  Stepper,
  Textarea,
  Timeline,
  Toast,
} from '../index';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('form controls (v-model)', () => {
  it('Select: label, placeholder, disabled option, emits update:modelValue', async () => {
    const w = mount(Select, {
      props: { label: 'Fruit', placeholder: 'Pick', hint: 'Seasonal', modelValue: '', options: [{ label: 'Apple', value: 'apple' }, { label: 'Pear', value: 'pear', disabled: true }] },
    });
    const select = w.find('select');
    expect(w.find('label').attributes('for')).toBe(select.attributes('id'));
    expect(select.attributes('aria-describedby')).toBe(`${select.attributes('id')}-hint`);
    const options = w.findAll('option');
    expect(options.map((o) => o.text())).toEqual(['Pick', 'Apple', 'Pear']);
    expect(options[2].attributes('disabled')).toBeDefined();
    await select.setValue('apple');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['apple']);
    await w.setProps({ error: 'Required' });
    expect(select.attributes('aria-invalid')).toBe('true');
    expect(select.attributes('aria-describedby')).toBe(`${select.attributes('id')}-err`);
  });

  it('Textarea: v-model and error', async () => {
    const w = mount(Textarea, { props: { label: 'Bio', modelValue: 'Hi', error: 'Too short' } });
    const ta = w.find('textarea');
    expect((ta.element as HTMLTextAreaElement).value).toBe('Hi');
    expect(ta.attributes('aria-invalid')).toBe('true');
    await ta.setValue('Hello');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['Hello']);
  });

  it('Checkbox: native checkbox, emits checked state, disabled class', async () => {
    const w = mount(Checkbox, { props: { label: 'Agree', modelValue: false } });
    await w.find('input').setValue(true);
    expect(w.emitted('update:modelValue')?.[0]).toEqual([true]);
    await w.setProps({ disabled: true });
    expect(w.find('input').attributes('disabled')).toBeDefined();
    expect(w.classes()).toContain('pl-check--disabled');
  });

  it('RadioGroup: labelled radiogroup, checked option, emits on change', async () => {
    const w = mount(RadioGroup, {
      props: { name: 'size', label: 'Size', modelValue: 'm', options: [{ label: 'S', value: 's' }, { label: 'M', value: 'm' }, { label: 'L', value: 'l', disabled: true }] },
    });
    expect(w.attributes('role')).toBe('radiogroup');
    expect(w.attributes('aria-label')).toBe('Size');
    const radios = w.findAll('input[type="radio"]');
    expect((radios[1].element as HTMLInputElement).checked).toBe(true);
    expect(radios[2].attributes('disabled')).toBeDefined();
    await radios[0].trigger('change');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['s']);
  });

  it('Segmented: roving tabindex, arrows wrap and move focus', async () => {
    const w = mount(Segmented, {
      props: { label: 'View', modelValue: 'list', options: [{ label: 'List', value: 'list' }, { label: 'Grid', value: 'grid' }, { label: 'Map', value: 'map' }] },
      attachTo: document.body,
    });
    const items = w.findAll('[role="radio"]');
    expect(items.map((i) => i.attributes('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(items.map((i) => i.attributes('tabindex'))).toEqual(['0', '-1', '-1']);
    await items[0].trigger('keydown', { key: 'ArrowLeft' });
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['map']);
    expect(document.activeElement).toBe(items[2].element);
    await items[2].trigger('keydown', { key: 'ArrowRight' });
    expect(w.emitted('update:modelValue')?.[1]).toEqual(['list']);
    await items[1].trigger('click');
    expect(w.emitted('update:modelValue')?.[2]).toEqual(['grid']);
    w.unmount();
  });

  it('Slider: labelled range emitting numbers, showValue', async () => {
    const w = mount(Slider, { props: { label: 'Volume', modelValue: 30, showValue: true, max: 50 } });
    const input = w.find('input[type="range"]');
    expect(w.find('label').attributes('for')).toBe(input.attributes('id'));
    expect(w.find('label').text()).toContain('30');
    await input.setValue('42');
    expect(w.emitted('update:modelValue')?.[0]).toEqual([42]);
  });
});

describe('display', () => {
  it('Accordion: aria-expanded / aria-controls, single and multiple', async () => {
    const w = mount(Accordion, {
      props: { items: [{ key: 'a', title: 'Shipping' }, { key: 'b', title: 'Returns' }], defaultOpen: ['a'] },
      slots: { 'panel-a': 'Fast', 'panel-b': '30 days' },
    });
    const [a, b] = w.findAll('button');
    expect(a.attributes('aria-expanded')).toBe('true');
    expect(w.find('[role="region"]').attributes('id')).toBe(a.attributes('aria-controls'));
    await b.trigger('click');
    expect(a.attributes('aria-expanded')).toBe('false');
    expect(b.attributes('aria-expanded')).toBe('true');
    expect(w.findAll('[role="region"]')).toHaveLength(1);
    await w.setProps({ multiple: true });
    await a.trigger('click');
    expect(w.findAll('[role="region"]')).toHaveLength(2);
  });

  it('Alert: role by urgency and closable emits close', async () => {
    const w = mount(Alert, { props: { variant: 'warning', closable: true }, slots: { default: 'Careful' } });
    expect(w.attributes('role')).toBe('alert');
    await w.find('button[aria-label="Dismiss"]').trigger('click');
    expect(w.emitted('close')).toHaveLength(1);
    const info = mount(Alert, { slots: { default: 'FYI' } });
    expect(info.attributes('role')).toBe('status');
    expect(info.find('button').exists()).toBe(false);
  });

  it('Avatar, Card, EmptyState, Divider, Spinner', () => {
    const avatar = mount(Avatar, { props: { name: 'Grace Hopper', size: 'lg' } });
    expect(avatar.attributes('role')).toBe('img');
    expect(avatar.attributes('aria-label')).toBe('Grace Hopper');
    expect(avatar.text()).toBe('GH');
    const card = mount(Card, { props: { title: 'Plan' }, slots: { default: 'Body', footer: 'Foot' } });
    expect(card.element.tagName).toBe('ARTICLE');
    expect(card.find('footer').text()).toBe('Foot');
    const empty = mount(EmptyState, { props: { title: 'Nothing', description: 'Add one' }, slots: { icon: '★', default: () => h('button', 'Create') } });
    expect(empty.find('.pl-empty__icon').attributes('aria-hidden')).toBe('true');
    expect(empty.find('button').text()).toBe('Create');
    expect(mount(Divider).element.tagName).toBe('HR');
    const spinner = mount(Spinner, { props: { label: 'Saving', size: 'lg' } });
    expect(spinner.attributes('role')).toBe('status');
    expect(spinner.attributes('aria-label')).toBe('Saving');
  });

  it('ProgressBar clamps and supports indeterminate', () => {
    const w = mount(ProgressBar, { props: { value: 150, label: 'Upload' } });
    expect(w.attributes('role')).toBe('progressbar');
    expect(w.attributes('aria-valuenow')).toBe('100');
    expect(w.attributes('aria-label')).toBe('Upload');
    const ind = mount(ProgressBar);
    expect(ind.attributes('aria-valuenow')).toBeUndefined();
  });

  it('Skeleton is hidden; SkeletonText is one busy status', () => {
    const s = mount(Skeleton, { props: { width: 50, height: 10 } });
    expect(s.attributes('aria-hidden')).toBe('true');
    expect((s.element as HTMLElement).style.width).toBe('50px');
    const t = mount(SkeletonText, { props: { lines: 3, label: 'Loading post' } });
    expect(t.attributes('role')).toBe('status');
    expect(t.attributes('aria-busy')).toBe('true');
    expect(t.text()).toContain('Loading post');
    expect(t.findAll('.pl-skeleton')).toHaveLength(3);
  });

  it('Stepper, Timeline, Breadcrumb', () => {
    const st = mount(Stepper, { props: { current: 1, steps: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] } });
    const steps = st.findAll('li');
    expect(steps[1].attributes('aria-current')).toBe('step');
    expect(steps[0].attributes('aria-current')).toBeUndefined();
    const tl = mount(Timeline, { props: { items: [{ title: 'Created', variant: 'danger' }, { title: 'Done' }] } });
    expect(tl.element.tagName).toBe('OL');
    expect(tl.find('.pl-timeline__dot').attributes('aria-hidden')).toBe('true');
    const bc = mount(Breadcrumb, { props: { items: [{ label: 'Home', href: '/' }, { label: 'Now', href: '/n' }] } });
    expect(bc.attributes('aria-label')).toBe('Breadcrumb');
    expect(bc.findAll('a')).toHaveLength(1);
    expect(bc.findAll('li')[1].attributes('aria-current')).toBe('page');
  });

  it('Toast: polite live region, emits dismiss with the id', async () => {
    const w = mount(Toast, { props: { items: [{ id: 7, title: 'Saved', message: 'ok', variant: 'success' }, { id: 8, message: 'fyi' }] } });
    expect(w.attributes('role')).toBe('status');
    expect(w.attributes('aria-live')).toBe('polite');
    expect(w.findAll('.pl-toast')[0].classes()).toContain('pl-toast--success');
    await w.findAll('button[aria-label="Dismiss"]')[1].trigger('click');
    expect(w.emitted('dismiss')?.[0]).toEqual([8]);
  });
});

describe('Drawer', () => {
  it('is a labelled modal that traps focus, closes on Escape / backdrop and restores focus', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const w = mount(Drawer, {
      props: { open: false, title: 'Filters', side: 'left' },
      slots: { default: () => h('input', { 'aria-label': 'Search' }), footer: () => h('button', { type: 'button' }, 'Apply') },
      attachTo: document.body,
    });
    await w.setProps({ open: true });
    await nextTick();
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)!.textContent).toBe('Filters');
    expect(dialog.classList.contains('pl-drawer--right')).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');
    expect(dialog.contains(document.activeElement)).toBe(true);

    const buttons = dialog.querySelectorAll('button');
    const last = buttons[buttons.length - 1] as HTMLElement;
    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(buttons[0]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(w.emitted('close')).toHaveLength(1);
    const overlay = dialog.parentElement!;
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(w.emitted('close')).toHaveLength(2);
    dialog.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(w.emitted('close')).toHaveLength(2);

    await w.setProps({ open: false });
    await nextTick();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
    w.unmount();
  });
});

describe('EmptyState (illustrated)', () => {
  it('renders an h3 title by default and orders primary, secondary, actions and default slots', () => {
    const w = mount(EmptyState, {
      props: { title: 'No results', description: 'Try another search' },
      slots: { primary: () => h('button', 'Clear'), secondary: () => h('button', 'Help'), actions: () => h('button', 'More'), default: () => h('button', 'Legacy') },
    });
    expect(w.find('h3.pl-empty__title').text()).toBe('No results');
    expect(w.find('.pl-empty__desc').text()).toBe('Try another search');
    expect(w.findAll('.pl-empty__actions button').map((b) => b.text())).toEqual(['Clear', 'Help', 'More', 'Legacy']);
  });

  it('maps size, align, layout, tone and headingLevel to markup', () => {
    const w = mount(EmptyState, { props: { title: 'Down', size: 'page', align: 'start', layout: 'split', tone: 'danger', headingLevel: 1 } });
    expect(w.classes()).toEqual(['pl-empty', 'pl-empty--page', 'pl-empty--start', 'pl-empty--split', 'pl-empty--tone-danger']);
    expect(w.find('h1').text()).toBe('Down');
    const p = mount(EmptyState, { props: { title: 'Inline', headingLevel: false, size: 'compact' } });
    expect(p.find('p.pl-empty__title').exists()).toBe(true);
    expect(p.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false);
    expect(p.find('.pl-empty__actions').exists()).toBe(false);
  });

  it('accepts an illustration slot, component or scene name', () => {
    const Art = markRaw({ render: () => h('svg', { class: 'art', 'aria-hidden': 'true' }) });
    expect(mount(EmptyState, { props: { title: 'A', illustration: Art } }).find('.pl-empty__media svg.art').exists()).toBe(true);
    expect(mount(EmptyState, { props: { title: 'A' }, slots: { illustration: () => h('svg', { class: 'slot' }) } }).find('.pl-empty__media svg.slot').exists()).toBe(true);
    const named = mount(EmptyState, { props: { title: 'A', illustration: 'no-results', size: 'compact' } }).find('pl-illustration');
    expect(named.attributes('name')).toBe('no-results');
    expect(named.attributes('compact')).toBe('');
    expect(mount(EmptyState, { props: { title: 'A', illustration: false } }).find('.pl-empty__media').exists()).toBe(false);
  });
});

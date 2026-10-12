import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import {
  Alert,
  Button,
  DataTable,
  Dialog,
  Input,
  Pagination,
  SkeletonCard,
  Switch,
  Tabs,
  Tag,
  Tooltip,
} from '../index';
import { getPageItems } from '../utils';

describe('accessibility', () => {
  it('traps Tab inside an open dialog and locks page scroll', async () => {
    const wrapper = mount(Dialog, {
      props: { open: true, title: 'Edit' },
      slots: { default: () => h('input', { 'aria-label': 'Name' }), footer: () => h('button', { type: 'button' }, 'Save') },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const buttons = dialog.querySelectorAll('button');
    const save = buttons[buttons.length - 1] as HTMLElement;
    save.focus();
    save.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(buttons[0]);
    await wrapper.setProps({ open: false });
    expect(document.body.style.overflow).toBe('');
    wrapper.unmount();
  });

  it('describes the tooltip trigger and hides on Escape', async () => {
    const wrapper = mount(Tooltip, {
      props: { text: 'Copy link' },
      slots: { default: () => h('button', { type: 'button' }, 'Copy') },
    });
    const button = wrapper.find('button');
    const tipId = wrapper.find('[role="tooltip"]').attributes('id');
    expect(button.attributes('aria-describedby')).toBe(tipId);
    await button.trigger('keydown', { key: 'Escape' });
    expect(wrapper.attributes('data-dismissed')).toBeDefined();
  });

  it('announces skeleton cards once as a loading status', () => {
    const wrapper = mount(SkeletonCard, { props: { label: 'Loading profile' } });
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.text()).toBe('Loading profile');
  });
});

describe('Button', () => {
  it('applies variant and size classes', () => {
    const wrapper = mount(Button, { props: { variant: 'outline', size: 'lg' }, slots: { default: 'Save' } });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['oc-btn', 'oc-btn--outline', 'oc-btn--lg']));
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('disables itself while loading', () => {
    const wrapper = mount(Button, { props: { loading: true }, slots: { default: 'Saving' } });
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-busy')).toBe('true');
  });
});

describe('Input', () => {
  it('links the error message and sets aria-invalid', () => {
    const wrapper = mount(Input, { props: { label: 'Email', error: 'Required', modelValue: '' } });
    const input = wrapper.find('input');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toMatch(/-err$/);
    expect(wrapper.find('.oc-error-text').text()).toBe('Required');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(Input, { props: { modelValue: '' } });
    await wrapper.find('input').setValue('hello');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hello']);
  });
});

describe('Switch', () => {
  it('emits the toggled value', async () => {
    const wrapper = mount(Switch, { props: { modelValue: false, label: 'Notifications' } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    expect(wrapper.attributes('aria-checked')).toBe('false');
  });
});

describe('Tabs', () => {
  it('moves selection with arrow keys', async () => {
    const wrapper = mount(Tabs, {
      props: {
        tabs: [
          { key: 'a', label: 'First' },
          { key: 'b', label: 'Second' },
        ],
      },
      slots: { 'panel-a': 'Panel A', 'panel-b': 'Panel B' },
      attachTo: document.body,
    });
    const first = wrapper.find('[role="tab"]');
    await first.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b']);
    wrapper.unmount();
  });
});

describe('Pagination', () => {
  it('emits the clicked page', async () => {
    const wrapper = mount(Pagination, { props: { modelValue: 1, pageCount: 5 } });
    await wrapper.find('[aria-label="Page 3"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3]);
  });

  it('compacts long page lists with ellipses', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    expect(getPageItems(1, 4)).toEqual([1, 2, 3, 4]);
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'qty', label: 'Qty', sortable: true, align: 'end' as const },
  ];
  const rows = [
    { id: 1, name: 'Banana', qty: 3 },
    { id: 2, name: 'Apple', qty: 10 },
    { id: 3, name: 'Cherry', qty: 2 },
  ];

  it('sorts numerically and toggles direction on repeated clicks', async () => {
    const wrapper = mount(DataTable, { props: { columns, rows } });
    const qtyButton = () => wrapper.findAll('.oc-table__sort')[1];
    await qtyButton().trigger('click');
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Cherry');
    await qtyButton().trigger('click');
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Apple');
  });

  it('shows the empty message when there are no rows', () => {
    const wrapper = mount(DataTable, { props: { columns, rows: [], emptyMessage: 'Nothing here' } });
    expect(wrapper.text()).toContain('Nothing here');
  });
});

describe('Dialog', () => {
  it('renders when open and emits close on Escape', async () => {
    const wrapper = mount(Dialog, {
      props: { open: true, title: 'Hi' },
      slots: { default: 'Body' },
      attachTo: document.body,
    });
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('close')).toBeTruthy();
    wrapper.unmount();
  });

  it('renders nothing when closed', () => {
    mount(Dialog, { props: { open: false, title: 'Hi' } });
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('Tag and Alert', () => {
  it('emits remove from the remove button', async () => {
    const wrapper = mount(Tag, { props: { removable: true }, slots: { default: 'Vue' } });
    await wrapper.find('.oc-tag__remove').trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
  });

  it('uses role=alert for danger messages', () => {
    const wrapper = mount(Alert, { props: { variant: 'danger', title: 'Failed' }, slots: { default: 'Try again' } });
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.text()).toContain('Try again');
  });
});

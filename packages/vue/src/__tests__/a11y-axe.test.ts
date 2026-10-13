// Automated accessibility audit of the Vue components with axe-core.
//
// Rules disabled only because jsdom cannot evaluate them (no layout engine, no CSS cascade):
//   - color-contrast: needs computed colours and geometry (covered by packages/core contrast checks
//     and the real-browser e2e axe run in tests/e2e).
//   - target-size: needs element boxes; jsdom reports 0×0 rects.
import { mount, type VueWrapper } from '@vue/test-utils';
import axe, { type Result } from 'axe-core';
import { defineComponent, h, nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  DataTable,
  Dialog,
  Divider,
  Drawer,
  EmptyState,
  Input,
  Pagination,
  ProgressBar,
  RadioGroup,
  Segmented,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Slider,
  Spinner,
  Stepper,
  Switch,
  Tabs,
  Tag,
  Textarea,
  Timeline,
  Toast,
  Tooltip,
} from '../index';

const AXE_OPTIONS: axe.RunOptions = {
  rules: {
    'color-contrast': { enabled: false },
    'target-size': { enabled: false },
  },
  resultTypes: ['violations'],
};

const format = (violations: Result[]) =>
  violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `    ${n.target.join(' ')}\n      ${n.failureSummary}`).join('\n')}`).join('\n');

let wrapper: VueWrapper | undefined;
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
});

const fruits = [
  { label: 'Apple', value: 'apple' },
  { label: 'Pear', value: 'pear', disabled: true },
];

const Page = defineComponent({
  setup() {
    return () =>
      h('main', [
        h('h1', 'Pelagic UI (Vue)'),
        // Accordion renders its triggers inside <h3>, so give it a realistic outline.
        h('h2', 'Components'),
        h(Breadcrumb, { items: [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'All' }] }),
        h(Button, null, () => 'Save'),
        h(Button, { variant: 'outline', loading: true }, () => 'Saving'),
        h(Button, { iconOnly: true, 'aria-label': 'Settings' }, () => '⚙'),
        h(Input, { label: 'Email', hint: 'Work address', modelValue: '' }),
        h(Input, { label: 'Name', error: 'Required', modelValue: '' }),
        h(Textarea, { label: 'Bio', modelValue: '' }),
        h(Select, { label: 'Fruit', placeholder: 'Pick one', options: fruits, modelValue: '' }),
        h(Checkbox, { label: 'Accept terms', modelValue: false }),
        h(Switch, { label: 'Notifications', modelValue: true }),
        h(RadioGroup, { name: 'size', label: 'Size', modelValue: 'm', options: [{ label: 'S', value: 's' }, { label: 'M', value: 'm' }] }),
        h(Slider, { label: 'Volume', modelValue: 30, showValue: true }),
        h(Segmented, { label: 'View', modelValue: 'list', options: [{ label: 'List', value: 'list' }, { label: 'Grid', value: 'grid' }] }),
        h(Badge, { variant: 'success' }, () => 'Active'),
        h(Tag, { removable: true }, () => 'design'),
        h(Avatar, { name: 'Ada Lovelace' }),
        h(Card, { title: 'Plan' }, { default: () => 'Body', footer: () => 'Footer' }),
        h(Spinner),
        h(Skeleton, { width: 100 }),
        h(SkeletonText, { lines: 2 }),
        h(SkeletonCard),
        h(ProgressBar, { value: 40, label: 'Upload' }),
        h(ProgressBar),
        h(Stepper, { current: 1, steps: [{ label: 'Cart' }, { label: 'Pay' }, { label: 'Done' }] }),
        h(Timeline, { items: [{ title: 'Created', time: '9:00' }, { title: 'Shipped', variant: 'success' }] }),
        h(Alert, { variant: 'danger', title: 'Failed', closable: true }, () => 'Try again'),
        h(Alert, null, () => 'Heads up'),
        h(EmptyState, { title: 'Nothing here', description: 'Add one' }, { icon: () => '★', default: () => h(Button, null, () => 'Create') }),
        h(Tooltip, { text: 'Copy link' }, () => h('button', { type: 'button' }, 'Copy')),
        h(Divider),
        h(Tabs, { tabs: [{ key: 'a', label: 'First' }, { key: 'b', label: 'Second' }] }, { 'panel-a': () => 'Panel A', 'panel-b': () => 'Panel B' }),
        h(Pagination, { modelValue: 2, pageCount: 9 }),
        h(Accordion, { items: [{ key: 'a', title: 'Shipping' }, { key: 'b', title: 'Returns' }], defaultOpen: ['a'] }, { 'panel-a': () => 'Fast', 'panel-b': () => '30 days' }),
        h(DataTable, {
          caption: 'People',
          columns: [{ key: 'name', label: 'Name', sortable: true }, { key: 'age', label: 'Age', align: 'end' }],
          rows: [{ id: 1, name: 'Ada', age: 36 }, { id: 2, name: 'Alan', age: 41 }],
        }),
        h(DataTable, { caption: 'Loading people', loading: true, columns: [{ key: 'name', label: 'Name' }], rows: [] }),
        h(Toast, { items: [{ id: 1, title: 'Saved', message: 'All good', variant: 'success' }] }),
      ]);
  },
});

// axe's first run is slow (rule setup) when the whole suite runs in parallel.
describe('axe-core (jsdom)', { timeout: 30000 }, () => {
  it('a page of every Vue component has no violations', async () => {
    wrapper = mount(Page, { attachTo: document.body });
    await nextTick();
    const { violations } = await axe.run(document.body, AXE_OPTIONS);
    expect(violations, format(violations)).toEqual([]);
  });

  it.each([
    ['Dialog', Dialog, {}],
    ['Drawer', Drawer, { side: 'left' }],
  ] as const)('open %s has no violations', async (_name, Overlay, extra) => {
    const Host = defineComponent({
      setup: () => () =>
        h('main', [
          h('h1', 'Overlay'),
          h(Overlay, { open: true, title: 'Edit profile', ...extra }, { default: () => h(Input, { label: 'Display name', modelValue: '' }), footer: () => h(Button, null, () => 'Save') }),
        ]),
    });
    wrapper = mount(Host, { attachTo: document.body });
    await nextTick();
    await nextTick();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    const { violations } = await axe.run(document.body, AXE_OPTIONS);
    expect(violations, format(violations)).toEqual([]);
  });
});

import type { CategoryDoc } from './types';
import { snippets } from '../snippets';

export const panels: CategoryDoc = {
  slug: 'panels',
  nav: 'Panels & layout',
  icon: '🧱',
  title: 'Panel & layout components — Card, Tabs, Accordion, Splitter, Toolbar',
  h1: 'Panels & layout',
  description:
    'Accessible layout components with live demos: Card, Accordion, Tabs, Panel, Fieldset, ScrollPanel, resizable Splitter, Toolbar, Divider and Stepper — for React, Vue, Svelte, Astro and React Native.',
  intro: 'Containers that group, reveal and arrange content. Disclosure widgets use real buttons with aria-expanded; tabs and toolbars use roving focus.',
  entries: [
    {
      id: 'card',
      name: 'Card',
      description: 'A surface with optional title and footer for grouping related content.',
      props: [
        ['title', 'ReactNode', 'Heading area.'],
        ['footer', 'ReactNode', 'Actions area.'],
        ['children', 'ReactNode', 'Body.'],
      ],
      code: {
        react: `<Card title="Quarterly report" footer={<Button size="sm">Open</Button>}>
  Revenue grew 24% with the new onboarding flow.
</Card>`,
        vue: `<Card title="Quarterly report">
  Revenue grew 24%.
  <template #footer><Button size="sm">Open</Button></template>
</Card>`,
        svelte: `<Card title="Quarterly report">
  Revenue grew 24%.
  {#snippet footer()}<Button size="sm">Open</Button>{/snippet}
</Card>`,
        astro: `<Card title="Quarterly report">
  Revenue grew 24%.
  <Button slot="footer" size="sm">Open</Button>
</Card>`,
        rn: `<Card title="Quarterly report" footer={<Button title="Open" size="sm" />}>
  <Text>Revenue grew 24%.</Text>
</Card>`,
      },
    },
    {
      id: 'accordion',
      name: 'Accordion',
      description: 'Stacked disclosure sections; one or several can be open.',
      props: [
        ['items', '{ key, title, content }[]', 'Sections.'],
        ['multiple', 'boolean', 'Allow several open at once.'],
        ['defaultOpen', 'string[]', 'Keys open initially.'],
      ],
      keys: [
        ['Enter / Space', 'Expand or collapse the focused section'],
        ['Tab', 'Move to the next header or into an open panel'],
      ],
      a11y: 'Each header is a <button> inside a heading with aria-expanded and aria-controls.',
      code: {
        react: `<Accordion defaultOpen={['free']} items={[
  { key: 'free', title: 'Is Orca UI free?', content: 'Yes, MIT licensed.' },
  { key: 'rtl', title: 'Does it support RTL?', content: 'Yes, it mirrors automatically.' },
]} />`,
        vue: `<Accordion :items="faq" :default-open="['free']" />`,
        svelte: `<Accordion items={faq} defaultOpen={['free']} />`,
        astro: `<Accordion exclusive items={[{ title: 'Is Orca UI free?', content: 'Yes.', open: true }]} />`,
        rn: `<Accordion items={faq} defaultOpen={['free']} />`,
      },
    },
    {
      id: 'tabs',
      name: 'Tabs',
      description: 'Switch between panels of related content in the same place.',
      props: [
        ['tabs', '{ key, label, content?, disabled? }[]', 'Tabs and their panels.'],
        ['value / defaultValue', 'string', 'Selected tab key.'],
        ['onChange', '(key) => void', 'Called when the tab changes.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Previous / next tab (mirrored in RTL)'],
        ['Home / End', 'First / last tab'],
        ['Tab', 'Move into the active panel'],
      ],
      a11y: 'WAI-ARIA tabs pattern: role="tablist", aria-selected and roving tabindex.',
      code: snippets.tabs!,
    },
    {
      id: 'panel',
      name: 'Panel',
      description: 'A titled container that can collapse, with header actions and a footer.',
      props: [
        ['header', 'ReactNode', 'Title.'],
        ['toggleable', 'boolean', 'Adds a collapse button.'],
        ['collapsed / defaultCollapsed / onToggle', 'boolean', 'Collapse state.'],
        ['actions / footer', 'ReactNode', 'Header actions and footer.'],
        ['headingLevel', '2 – 6', 'Heading level for the header.'],
      ],
      keys: [['Enter / Space', 'Toggle the panel (on the collapse button)']],
      code: {
        react: `<Panel header="Activity" toggleable actions={<Button size="sm" variant="ghost">Refresh</Button>}>
  12 new events today.
</Panel>`,
      },
    },
    {
      id: 'fieldset',
      name: 'Fieldset',
      description: 'A native fieldset with legend that can optionally collapse.',
      props: [
        ['legend', 'ReactNode', 'Group title.'],
        ['toggleable', 'boolean', 'Legend becomes a toggle button.'],
        ['collapsed / defaultCollapsed / onToggle', 'boolean', 'Collapse state.'],
      ],
      keys: [['Enter / Space', 'Toggle (when toggleable)']],
      a11y: 'Real <fieldset>/<legend>, so grouped controls are announced with their group name.',
      code: {
        react: `<Fieldset legend="Shipping address" toggleable>
  <Input label="Street" />
</Fieldset>`,
      },
    },
    {
      id: 'scrollpanel',
      name: 'ScrollPanel',
      description: 'A scrollable region with themed scrollbars that keyboard users can reach.',
      props: [
        ['label', 'string', 'Accessible name of the region (required).'],
        ['height', 'number | string', 'Viewport height.'],
      ],
      keys: [
        ['Tab', 'Focus the region'],
        ['Arrow keys / Page Up / Page Down', 'Scroll the focused region'],
      ],
      a11y: 'When content overflows, the container becomes a focusable, labelled region (tabindex="0") so keyboard users can scroll it (WCAG 2.1.1).',
      code: {
        react: `<ScrollPanel label="Terms of service" height={200}>
  <p>…long content…</p>
</ScrollPanel>`,
      },
    },
    {
      id: 'splitter',
      name: 'Splitter',
      description: 'Resizable panes separated by draggable, keyboard-operable gutters.',
      props: [
        ['layout', "'horizontal' | 'vertical'", 'Direction.'],
        ['SplitterPanel size / minSize', 'number (%)', 'Initial and minimum sizes.'],
        ['stateKey', 'string', 'Persist sizes in localStorage.'],
        ['step', 'number', 'Keyboard step in %.'],
        ['onResize / onResizeEnd', '(sizes) => void', 'Size callbacks.'],
      ],
      keys: [
        ['Arrow keys', 'Move the focused gutter (mirrored in RTL)'],
        ['Home / End', 'Collapse to the minimum / maximum'],
      ],
      a11y: 'Gutters are role="separator" with aria-valuenow, so screen readers announce the pane size.',
      code: {
        react: `<Splitter stateKey="editor-split" className="editor-split">
  <SplitterPanel size={30} minSize={15}>Files</SplitterPanel>
  <SplitterPanel size={70}>Editor</SplitterPanel>
</Splitter>`,
      },
    },
    {
      id: 'toolbar',
      name: 'Toolbar',
      description: 'Groups controls into start, center and end areas with a single tab stop.',
      props: [
        ['label', 'string', 'Accessible name (required).'],
        ['start / center / end', 'ReactNode', 'Areas.'],
        ['orientation', "'horizontal' | 'vertical'", 'Arrow-key direction.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Move between controls'],
        ['Home / End', 'First / last control'],
        ['Tab', 'Leave the toolbar'],
      ],
      a11y: 'role="toolbar" with roving tabindex, so the whole toolbar is one tab stop.',
      code: {
        react: `<Toolbar label="Formatting"
  start={<><Button size="sm">Bold</Button><Button size="sm">Italic</Button></>}
  end={<Button size="sm" variant="secondary">Share</Button>} />`,
      },
    },
    {
      id: 'divider',
      name: 'Divider',
      description: 'A thin separator between sections.',
      props: [['className', 'string', 'Extra classes.']],
      a11y: 'Renders <hr>, which screen readers announce as a separator.',
      code: {
        react: `<Divider />`,
        vue: `<Divider />`,
        svelte: `<Divider />`,
        astro: `<Divider />`,
        rn: `<Divider />`,
      },
    },
    {
      id: 'stepper',
      name: 'Stepper',
      description: 'Shows progress through a multi-step flow.',
      props: [
        ['steps', '{ label, description? }[]', 'Steps.'],
        ['current', 'number', 'Zero-based index of the active step.'],
      ],
      a11y: 'An ordered list; the active step has aria-current="step".',
      code: {
        react: `<Stepper current={1} steps={[{ label: 'Account' }, { label: 'Workspace' }, { label: 'Invite' }]} />`,
        vue: `<Stepper :current="1" :steps="steps" />`,
        svelte: `<Stepper current={1} {steps} />`,
        astro: `<Stepper current={1} steps={steps} />`,
        rn: `<Stepper current={1} steps={steps} />`,
      },
    },
  ],
};

// Automated accessibility audit: render a representative page of components and run axe-core.
//
// Rules disabled here only because jsdom cannot evaluate them (no layout engine, no CSS cascade):
//   - color-contrast: needs computed colours and rendered geometry. Contrast is covered by
//     packages/core (check-contrast + token tests) and by the real-browser e2e axe run (tests/e2e).
//   - target-size: needs element boxes; jsdom reports every rect as 0×0.
// Every other axe rule (ARIA validity, names, roles, landmarks, lists, tables, labels, ids …) runs.
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe, { type Result } from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Accordion,
  Alert,
  AreaChart,
  AutoComplete,
  Avatar,
  Badge,
  BarChart,
  BlockUI,
  Breadcrumb,
  Button,
  Card,
  Carousel,
  CascadeSelect,
  Checkbox,
  Chip,
  ColorPicker,
  CubeCarousel,
  DataTable,
  DataView,
  DatePicker,
  Dialog,
  Divider,
  DonutChart,
  Drawer,
  EmptyState,
  Fieldset,
  FileUpload,
  FlipCard,
  FloatLabel,
  Floating3DIcon,
  GaugeChart,
  Heatmap,
  Image,
  ImageCompare,
  Inplace,
  Input,
  InputMask,
  InputNumber,
  InputOtp,
  Knob,
  LineChart,
  Listbox,
  Menu,
  Menubar,
  Message,
  MeterGroup,
  MultiSelect,
  OrbitBadge,
  OrderList,
  OrganizationChart,
  Pagination,
  Paginator,
  Panel,
  PanelMenu,
  Password,
  Perspective3DStack,
  PickList,
  PieChart,
  ProgressBar,
  RadarChart,
  RadialProgress,
  RadioGroup,
  Rating,
  Segmented,
  Select,
  SelectButton,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Slider,
  Sparkline,
  SpeedDial,
  Spinner,
  SplitButton,
  Splitter,
  SplitterPanel,
  Stepper,
  Switch,
  Tabs,
  Tag,
  Text3D,
  Textarea,
  TieredMenu,
  TiltCard,
  Timeline,
  Toast,
  ToggleButton,
  Toolbar,
  Tooltip,
  Tree,
  TreeSelect,
  TreeTable,
  calendarHeatmapData,
} from '../index';

const AXE_OPTIONS: axe.RunOptions = {
  rules: {
    'color-contrast': { enabled: false },
    'target-size': { enabled: false },
  },
  resultTypes: ['violations'],
};

function format(violations: Result[]): string {
  return violations
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `    ${n.target.join(' ')}\n      ${n.failureSummary?.replace(/\n/g, '\n      ')}`).join('\n')}`)
    .join('\n');
}

async function audit(root: Element = document.body) {
  const results = await axe.run(root, AXE_OPTIONS);
  return results.violations;
}

beforeEach(() => {
  // Effects and charts read prefers-reduced-motion; jsdom has no matchMedia.
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const fruits = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry', disabled: true },
  { label: 'Cherry', value: 'cherry' },
];
const treeNodes = [
  { key: 'docs', label: 'Documents', children: [{ key: 'cv', label: 'CV.pdf' }, { key: 'tax', label: 'Tax.pdf' }] },
  { key: 'pics', label: 'Pictures' },
];
const sales = [
  { month: 'Jan', revenue: 12000, cost: 9000 },
  { month: 'Feb', revenue: 18000, cost: 9500 },
  { month: 'Mar', revenue: 24000, cost: 11000 },
  { month: 'Apr', revenue: 21000, cost: 10000 },
];
const salesSeries = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'cost', label: 'Cost' },
];
const noop = () => {};

function CoreSection() {
  return (
    <section aria-labelledby="h-core">
      <h2 id="h-core">Core</h2>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Components', href: '/c' }, { label: 'All' }]} />
      <Button>Save</Button>
      <Button variant="outline" loading>
        Saving
      </Button>
      <Button iconOnly aria-label="Settings">
        ⚙
      </Button>
      <Input label="Email" hint="Work address" />
      <Input label="Name" error="Required" />
      <Textarea label="Bio" />
      <Select label="Fruit" placeholder="Pick one" options={fruits} />
      <Checkbox label="Accept terms" />
      <Switch label="Notifications" checked={false} onChange={noop} />
      <RadioGroup name="size" label="Size" value="m" onChange={noop} options={[{ label: 'S', value: 's' }, { label: 'M', value: 'm' }]} />
      <Slider label="Volume" value={30} onChange={noop} showValue />
      <Segmented label="View" value="list" onChange={noop} options={[{ label: 'List', value: 'list' }, { label: 'Grid', value: 'grid' }]} />
      <Badge variant="success">Active</Badge>
      <Tag removable onRemove={noop}>
        design
      </Tag>
      <Avatar name="Ada Lovelace" />
      <Card title="Plan" footer={<span>Footer</span>}>
        Body
      </Card>
      <Spinner />
      <Skeleton width={100} />
      <SkeletonText lines={2} />
      <SkeletonCard />
      <ProgressBar value={40} label="Upload" />
      <Stepper current={1} steps={[{ label: 'Cart' }, { label: 'Pay' }, { label: 'Done' }]} />
      <Timeline items={[{ title: 'Created', time: '9:00' }, { title: 'Shipped', variant: 'success' }]} />
      <Alert variant="danger" title="Failed">
        Try again
      </Alert>
      <Alert>Heads up</Alert>
      <EmptyState title="Nothing here" description="Add one" icon="★" />
      <Tooltip text="Copy link">
        <button type="button">Copy</button>
      </Tooltip>
      <Divider />
      <Tabs tabs={[{ key: 'a', label: 'First', content: 'Panel A' }, { key: 'b', label: 'Second', content: 'Panel B' }]} />
      <Pagination value={2} pageCount={9} onChange={noop} />
      <Accordion items={[{ key: 'a', title: 'Shipping', content: 'Fast' }, { key: 'b', title: 'Returns', content: '30 days' }]} defaultOpen={['a']} />
      <DataTable
        caption="People"
        columns={[{ key: 'name', label: 'Name', sortable: true }, { key: 'age', label: 'Age', align: 'end' }]}
        rows={[{ id: 1, name: 'Ada', age: 36 }, { id: 2, name: 'Alan', age: 41 }]}
      />
      <DataTable caption="Loading" loading columns={[{ key: 'name', label: 'Name' }]} rows={[]} />
      <Toast items={[{ id: 1, title: 'Saved', message: 'All good', variant: 'success' }]} onDismiss={noop} />
    </section>
  );
}

function FormsAdvancedSection() {
  return (
    <section aria-labelledby="h-forms">
      <h2 id="h-forms">Forms advanced</h2>
      <AutoComplete label="Fruit search" suggestions={fruits} />
      <MultiSelect label="Fruits" options={fruits} />
      <Listbox label="Fruit list" options={fruits} />
      <CascadeSelect label="City" options={[{ label: 'Australia', children: [{ label: 'Sydney', value: 'syd' }] }]} />
      <TreeSelect label="File" nodes={treeNodes} />
      <InputNumber label="Quantity" defaultValue={2} min={0} max={10} showButtons locale="en-US" />
      <InputMask label="Phone" mask="(999) 999-9999" />
      <InputOtp label="Code" length={4} integerOnly />
      <Password label="Password" requirements />
      <Rating label="Quality" defaultValue={3} />
      <Knob label="Level" defaultValue={50} />
      <ColorPicker label="Brand" presets={[{ value: '#ff0000', label: 'Red' }]} />
      <DatePicker label="Start" locale="en-US" />
      <ToggleButton onLabel="Following" offLabel="Follow" />
      <SelectButton label="Range" options={[{ label: 'Day', value: 'd' }, { label: 'Week', value: 'w' }]} defaultValue="d" />
      <FloatLabel label="Floating email">
        <input className="pl-input" />
      </FloatLabel>
    </section>
  );
}

function MenusSection() {
  return (
    <section aria-labelledby="h-menus">
      <h2 id="h-menus">Menus and overlays</h2>
      <Menu aria-label="File" model={[{ label: 'New' }, { separator: true }, { label: 'Delete', disabled: true }]} />
      <TieredMenu aria-label="Tiered" model={[{ label: 'File', items: [{ label: 'Recent' }] }, { label: 'Quit' }]} />
      <Menubar aria-label="Main" model={[{ label: 'File', items: [{ label: 'New' }] }, { label: 'Help', url: '#help' }]} />
      <PanelMenu aria-label="Sections" model={[{ label: 'Files', items: [{ label: 'Docs' }] }, { label: 'Cloud', items: [{ label: 'Upload' }] }]} />
      <SplitButton label="Save draft" model={[{ label: 'Save as' }, { label: 'Export' }]} />
      <SpeedDial aria-label="Quick actions" model={[{ label: 'Add', icon: '+' }, { label: 'Edit', icon: '✎' }]} />
      <Inplace display="Click to edit">
        <input aria-label="Inline value" />
      </Inplace>
      <BlockUI blocked label="Saving">
        <p>Blocked content</p>
      </BlockUI>
    </section>
  );
}

function DataPanelsSection() {
  return (
    <section aria-labelledby="h-data">
      <h2 id="h-data">Data, panels and media</h2>
      <Tree nodes={treeNodes} label="Files" selectionMode="single" />
      <TreeTable
        caption="Sizes"
        columns={[{ key: 'name', label: 'Name', sortable: true }, { key: 'size', label: 'Size' }]}
        nodes={[{ key: 'b', data: { name: 'Beta', size: '1 MB' }, children: [{ key: 'b1', data: { name: 'Child', size: '1 KB' } }] }]}
      />
      {/* Pagination (core) has a fixed aria-label="Pagination"; Paginator gets a distinct name so landmarks stay unique. */}
      <Paginator label="Result pages" totalRecords={120} rowsPerPageOptions={[10, 25]} />
      <DataView items={[{ id: 1, name: 'Chair' }, { id: 2, name: 'Desk' }]} label="Products" itemTemplate={(it) => it.name} getKey={(it) => it.id} />
      <OrderList header="Priority" defaultValue={['A', 'B', 'C']} getKey={(s) => s} getLabel={(s) => s} />
      <PickList defaultValue={{ source: ['Red', 'Green'], target: ['Blue'] }} getKey={(s) => s} getLabel={(s) => s} />
      <OrganizationChart label="Company" collapsible value={{ key: 'ceo', label: 'CEO', children: [{ key: 'cto', label: 'CTO' }] }} />
      <Panel header="Details" toggleable footer="Foot">
        Body text
      </Panel>
      <Fieldset legend="Address" toggleable>
        Street
      </Fieldset>
      <Splitter>
        <SplitterPanel>One</SplitterPanel>
        <SplitterPanel>Two</SplitterPanel>
      </Splitter>
      <Toolbar label="Formatting" start={<button type="button">Bold</button>} end={<button type="button">Save</button>} />
      <Carousel label="Featured" items={['a', 'b', 'c']} itemTemplate={(t) => <span>{t}</span>} />
      <Image src="/cat.jpg" alt="A cat" preview />
      <ImageCompare before={{ src: '/a.jpg', alt: 'Before' }} after={{ src: '/b.jpg', alt: 'After' }} />
      <MeterGroup label="Storage" value={[{ label: 'Apps', value: 16 }, { label: 'Photos', value: 30, color: 'success' }]} />
      <Chip label="React" removable />
      <Message severity="error" text="Required" />
      <Message severity="info" text="Saved" />
      <FileUpload accept="image/*" />
    </section>
  );
}

function ChartsSection() {
  const cal = calendarHeatmapData(
    Array.from({ length: 14 }, (_, i) => ({ date: new Date(2024, 0, 7 + i), value: i % 5 })),
    { locale: 'en-US' },
  );
  return (
    <section aria-labelledby="h-charts">
      <h2 id="h-charts">Charts</h2>
      <BarChart title="Sales" data={sales} x="month" series={salesSeries} locale="en-US" />
      <LineChart title="Trend" data={sales} x="month" series={salesSeries} locale="en-US" />
      <AreaChart title="Area" data={sales} x="month" series={salesSeries} locale="en-US" />
      <PieChart title="Pie" data={[{ k: 'A', v: 3 }, { k: 'B', v: 1 }]} label="k" value="v" locale="en-US" />
      <DonutChart title="Browsers" data={[{ name: 'Chrome', share: 0.6 }, { name: 'Safari', share: 0.4 }]} label="name" value="share" locale="en-US" />
      <RadarChart title="Radar" data={[{ k: 'Speed', a: 8 }, { k: 'Cost', a: 3 }, { k: 'Quality', a: 6 }]} x="k" series={[{ key: 'a', label: 'Team A' }]} />
      <Sparkline data={[100, 104, 103, 108]} label="Sign-ups" period="7 days" locale="en-US" />
      <GaugeChart title="CPU" value={72} locale="en-US" />
      <RadialProgress title="Upload progress" value={40} locale="en-US" />
      <Heatmap
        title="Activity"
        data={cal.data}
        x="week"
        y="weekday"
        value="value"
        cellLabel="label"
        xCategories={cal.xCategories}
        yCategories={cal.yCategories}
        locale="en-US"
      />
    </section>
  );
}

function EffectsSection() {
  return (
    <section aria-labelledby="h-fx">
      <h2 id="h-fx">Effects 3D</h2>
      <TiltCard>Tilt me</TiltCard>
      <FlipCard front={<p>Front side</p>} back={<a href="#x">Back link</a>} />
      <CubeCarousel label="Features" slides={[{ title: 'One', content: 'First' }, { title: 'Two', content: 'Second' }]} />
      <Text3D as="p">Deep title</Text3D>
      <Floating3DIcon icon="★" />
      <OrbitBadge>New</OrbitBadge>
      <Perspective3DStack label="Plans" items={['A', 'B', 'C']} />
    </section>
  );
}

function Page() {
  return (
    <main>
      <h1>Pelagic UI kitchen sink</h1>
      <CoreSection />
      <FormsAdvancedSection />
      <MenusSection />
      <DataPanelsSection />
      <ChartsSection />
      <EffectsSection />
    </main>
  );
}

describe('axe-core (jsdom)', { timeout: 30000 }, () => {
  it('a page of every component group has no violations', async () => {
    render(<Page />);
    await act(async () => {});
    const violations = await audit();
    expect(violations, format(violations)).toEqual([]);
  }, 30000);

  it('open overlays (Dialog, Drawer) have no violations', async () => {
    const first = render(
      <main>
        <h1>Overlays</h1>
        <Dialog open title="Edit profile" onClose={noop} footer={<button type="button">Save</button>}>
          <Input label="Display name" />
        </Dialog>
      </main>,
    );
    let violations = await audit();
    expect(violations, format(violations)).toEqual([]);
    first.unmount();
    render(
      <main>
        <h1>Drawer</h1>
        <Drawer open title="Filters" onClose={noop}>
          <Checkbox label="In stock" />
        </Drawer>
      </main>,
    );
    violations = await audit();
    expect(violations, format(violations)).toEqual([]);
  });

  it('expanded popups (combobox listboxes, menus, date picker) have no violations', async () => {
    const user = userEvent.setup();
    render(
      <main>
        <h1>Popups</h1>
        <AutoComplete label="Fruit search" suggestions={fruits} />
        <MultiSelect label="Fruits" options={fruits} filter />
        <TreeSelect label="File" nodes={treeNodes} />
        <DatePicker label="Start" locale="en-US" />
      </main>,
    );
    await user.type(screen.getByRole('combobox', { name: 'Fruit search' }), 'b');
    let violations = await audit();
    expect(violations, `AutoComplete open:\n${format(violations)}`).toEqual([]);
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('combobox', { name: 'Fruits' }));
    violations = await audit();
    expect(violations, `MultiSelect open:\n${format(violations)}`).toEqual([]);
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('combobox', { name: 'File' }));
    violations = await audit();
    expect(violations, `TreeSelect open:\n${format(violations)}`).toEqual([]);
    await user.keyboard('{Escape}');

    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    violations = await audit();
    expect(violations, `DatePicker open:\n${format(violations)}`).toEqual([]);
  }, 30000);

  it('popup menus stay inside a landmark when open', async () => {
    const user = userEvent.setup();
    render(
      <main>
        <h1>Menu popup</h1>
        <SplitButton label="Save draft" model={[{ label: 'Save as' }, { label: 'Export' }]} />
      </main>,
    );
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    const violations = await audit();
    expect(violations, format(violations)).toEqual([]);
  });
});

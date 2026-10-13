/**
 * Component registry: every node type the builder knows, its palette entry, inspector fields,
 * defaults and how it renders with REAL @pelagic-ui/react components.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  Accordion,
  Alert,
  AreaChart,
  Avatar,
  Badge,
  BarChart,
  Breadcrumb,
  Button,
  Card,
  Carousel,
  Checkbox,
  DataTable,
  DatePicker,
  Divider,
  DonutChart,
  EmptyState,
  Input,
  InputOtp,
  LineChart,
  ProgressBar,
  Select,
  SkeletonCard,
  SkeletonText,
  Sparkline,
  Stepper,
  Switch,
  Tabs,
  Timeline,
  toast,
} from '@pelagic-ui/react';
import type { NodeProps, NodeType, SpaceNode } from './types';
import { cardBodyStyle, gridStyle, headingStyle, sectionInner, sectionOuter, spacerStyle, stackStyle, textStyle, type Css } from './styles';
import { cells, chartModel, isNumericCell, lines, placeholderImage, rows, statusTone, toNumber } from './data';

export type GroupId = 'layout' | 'typography' | 'forms' | 'data' | 'feedback' | 'navigation' | 'media';

export const GROUPS: { id: GroupId | 'blocks'; label: string }[] = [
  { id: 'blocks', label: 'Blocks' },
  { id: 'layout', label: 'Layout' },
  { id: 'typography', label: 'Typography' },
  { id: 'forms', label: 'Forms' },
  { id: 'data', label: 'Data' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'media', label: 'Media' },
];

export type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'lines';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  hint?: string;
}

export interface RenderCtx {
  editing: boolean;
}

export interface NodeDef {
  type: NodeType;
  label: string;
  group: GroupId;
  icon: string;
  description: string;
  keywords?: string;
  container?: boolean;
  defaults: NodeProps;
  defaultChildren?: () => SpaceNode[];
  fields: FieldDef[];
  /** Short text for the layer tree and announcements. */
  summary?: (p: NodeProps) => string;
  render: (node: SpaceNode, kids: ReactNode[], ctx: RenderCtx) => ReactNode;
}

const o = (...values: string[]) => values.map((v) => ({ label: v[0].toUpperCase() + v.slice(1), value: v }));
const S = (v: unknown, f = '') => (v === undefined || v === null ? f : String(v));
const N = (v: unknown, f: number) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : f);
const css = (c: Css) => c as CSSProperties;

const ALIGN_FIELD: FieldDef = { key: 'align', label: 'Alignment', kind: 'select', options: o('start', 'center', 'end') };
const GAP_FIELD: FieldDef = { key: 'gap', label: 'Gap', kind: 'select', options: o('none', 'sm', 'md', 'lg', 'xl') };
const VARIANT_BUTTON = o('primary', 'secondary', 'outline', 'ghost', 'danger');
const TONES = o('info', 'success', 'warning', 'danger');

function node(type: NodeType, props: NodeProps = {}, children?: SpaceNode[]): SpaceNode {
  const def = REGISTRY[type];
  return {
    id: '',
    type,
    props: { ...def.defaults, ...props },
    ...(def.container ? { children: children ?? def.defaultChildren?.() ?? [] } : {}),
  };
}
/** Template node (ids are assigned by cloneFresh on insert). */
export const tpl = node;

const statusCell = (value: string) => {
  const tone = statusTone(value);
  return tone ? <Badge variant={tone}>{value}</Badge> : value;
};

function TableView({ p }: { p: NodeProps }) {
  const head = cells(lines(p.columns)[0] ?? 'Name');
  const body = rows(p.rows);
  const numeric = head.map((_, c) => body.length > 0 && body.every((r) => !r[c] || isNumericCell(r[c])));
  const columns = head.map((label, c) => ({
    key: `c${c}`,
    label,
    sortable: true,
    align: numeric[c] ? ('end' as const) : undefined,
    render: (row: Record<string, unknown>) => statusCell(String(row[`c${c}`] ?? '')),
    sortValue: (row: Record<string, unknown>) => (numeric[c] ? toNumber(String(row[`c${c}`] ?? '')) : String(row[`c${c}`] ?? '')),
  }));
  const data = body.map((r, i) => Object.fromEntries([['id', i], ...head.map((_, c) => [`c${c}`, r[c] ?? ''])]));
  return <DataTable columns={columns} rows={data} caption={S(p.caption) || 'Table'} captionVisible={Boolean(p.showCaption)} />;
}

function ChartView({ p }: { p: NodeProps }) {
  const { series, data } = chartModel(p.data, p.series);
  const title = S(p.title, 'Chart');
  const height = N(p.height, 280);
  const kind = S(p.kind, 'bar');
  if (kind === 'donut') {
    const first = series[0]?.key ?? 's0';
    return <DonutChart title={title} data={data} label={(d) => String(d.label)} value={(d) => Number(d[first]) || 0} height={height} table="toggle" />;
  }
  const common = { title, data, x: (d: Record<string, string | number>) => String(d.label), series, height, table: 'toggle' as const };
  if (kind === 'line') return <LineChart {...common} curve="monotone" />;
  if (kind === 'area') return <AreaChart {...common} curve="monotone" />;
  return <BarChart {...common} stacked={Boolean(p.stacked)} />;
}

function StatView({ p }: { p: NodeProps }) {
  const delta = S(p.delta);
  const down = delta.trim().startsWith('-') || delta.trim().startsWith('−');
  const spark = S(p.spark)
    .split(/[,|\s]+/)
    .map((v) => toNumber(v))
    .filter((v) => !Number.isNaN(v));
  return (
    <div className="pl-card sp-stat">
      <div className="pl-card__body">
        <p className="sp-stat__label">{S(p.label)}</p>
        <p className="sp-stat__value">{S(p.value)}</p>
        <div className="sp-stat__foot">
          {delta && <Badge variant={down ? 'danger' : 'success'}>{delta}</Badge>}
          {S(p.period) && <span className="sp-stat__period">{S(p.period)}</span>}
          {spark.length > 1 && (
            <span className="sp-stat__spark">
              <Sparkline data={spark} label={S(p.label)} width={84} height={28} tone={down ? 'danger' : 'success'} area />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CaptchaView({ p }: { p: NodeProps }) {
  return (
    <div className="sp-captcha">
      <Checkbox label={S(p.label, "I'm not a robot")} />
      <span className="sp-captcha__brand" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4" />
        </svg>
        <small>{S(p.provider, 'Captcha')}</small>
      </span>
    </div>
  );
}

const fire = (variant: string, message: string) => {
  const fn = (toast as unknown as Record<string, (m: string) => void>)[variant] ?? toast;
  fn(message);
};

export const REGISTRY: Record<NodeType, NodeDef> = {
  /* ---------------- Layout ---------------- */
  section: {
    type: 'section',
    label: 'Section',
    group: 'layout',
    icon: 'section',
    description: 'Full-width band with padding and a max width',
    keywords: 'band container wrapper block',
    container: true,
    defaults: { padding: 'md', width: 'normal', tone: 'plain', align: 'start', gap: 'md' },
    fields: [
      { key: 'padding', label: 'Padding', kind: 'select', options: o('sm', 'md', 'lg') },
      { key: 'width', label: 'Content width', kind: 'select', options: o('narrow', 'normal', 'wide', 'full') },
      { key: 'tone', label: 'Background', kind: 'select', options: o('plain', 'canvas', 'accent', 'inverse') },
      { key: 'align', label: 'Alignment', kind: 'select', options: o('start', 'center') },
      GAP_FIELD,
    ],
    render: (n, kids) => (
      <div style={css(sectionOuter(n.props))} data-theme={n.props.tone === 'inverse' ? 'dark' : undefined} className="sp-r-section">
        <div style={css(sectionInner(n.props))} data-align={n.props.align === 'center' ? 'center' : undefined}>
          {kids}
        </div>
      </div>
    ),
  },
  grid: {
    type: 'grid',
    label: 'Grid',
    group: 'layout',
    icon: 'grid',
    description: 'Responsive columns that wrap on small screens',
    keywords: 'columns cols row layout',
    container: true,
    defaults: { columns: 3, gap: 'md', align: 'stretch' },
    fields: [
      { key: 'columns', label: 'Columns', kind: 'number', min: 1, max: 6 },
      GAP_FIELD,
      { key: 'align', label: 'Vertical alignment', kind: 'select', options: o('stretch', 'start', 'center', 'end') },
    ],
    summary: (p) => `${p.columns} columns`,
    render: (n, kids) => <div style={css(gridStyle(n.props))}>{kids}</div>,
  },
  stack: {
    type: 'stack',
    label: 'Stack',
    group: 'layout',
    icon: 'stack',
    description: 'Vertical or horizontal flow with a gap',
    keywords: 'flex row column group',
    container: true,
    defaults: { direction: 'column', gap: 'md', align: 'stretch', justify: 'start', wrap: true },
    fields: [
      { key: 'direction', label: 'Direction', kind: 'select', options: [{ label: 'Vertical', value: 'column' }, { label: 'Horizontal', value: 'row' }] },
      GAP_FIELD,
      { key: 'align', label: 'Align items', kind: 'select', options: o('stretch', 'start', 'center', 'end') },
      { key: 'justify', label: 'Justify', kind: 'select', options: o('start', 'center', 'end', 'between') },
      { key: 'wrap', label: 'Wrap (horizontal)', kind: 'boolean' },
    ],
    summary: (p) => (p.direction === 'row' ? 'horizontal' : 'vertical'),
    render: (n, kids) => <div style={css(stackStyle(n.props))}>{kids}</div>,
  },
  card: {
    type: 'card',
    label: 'Card',
    group: 'layout',
    icon: 'card',
    description: 'Raised surface with an optional title',
    keywords: 'panel box tile surface',
    container: true,
    defaults: { title: 'Card title', gap: 'md' },
    fields: [{ key: 'title', label: 'Title', kind: 'text', hint: 'Leave empty for no header' }, GAP_FIELD],
    summary: (p) => S(p.title),
    render: (n, kids) => (
      <Card title={S(n.props.title) || undefined}>
        <div style={css(cardBodyStyle(n.props))}>{kids}</div>
      </Card>
    ),
  },
  spacer: {
    type: 'spacer',
    label: 'Spacer',
    group: 'layout',
    icon: 'spacer',
    description: 'Empty vertical space',
    defaults: { size: 'md' },
    fields: [{ key: 'size', label: 'Size', kind: 'select', options: o('sm', 'md', 'lg', 'xl') }],
    summary: (p) => S(p.size),
    render: (n, _k, ctx) => <div style={css(spacerStyle(n.props))} className={ctx.editing ? 'sp-spacer' : undefined} />,
  },
  divider: {
    type: 'divider',
    label: 'Divider',
    group: 'layout',
    icon: 'divider',
    description: 'Hairline separator',
    keywords: 'hr line separator rule',
    defaults: {},
    fields: [],
    render: () => <Divider />,
  },

  /* ---------------- Typography ---------------- */
  heading: {
    type: 'heading',
    label: 'Heading',
    group: 'typography',
    icon: 'heading',
    description: 'Page or section title (h1–h4)',
    keywords: 'title h1 h2 h3 headline',
    defaults: { text: 'Section heading', level: 2, align: 'start', eyebrow: '' },
    fields: [
      { key: 'text', label: 'Text', kind: 'text' },
      { key: 'eyebrow', label: 'Overline', kind: 'text', hint: 'Small label above the heading (optional)' },
      { key: 'level', label: 'Level', kind: 'select', options: [1, 2, 3, 4].map((l) => ({ label: `H${l}`, value: String(l) })) },
      ALIGN_FIELD,
    ],
    summary: (p) => S(p.text),
    render: (n) => {
      const level = Math.min(4, Math.max(1, N(n.props.level, 2)));
      const H = `h${level}` as 'h2';
      return (
        <div className="sp-heading" style={{ textAlign: S(n.props.align, 'start') as CSSProperties['textAlign'] }}>
          {S(n.props.eyebrow) && <p className="sp-eyebrow">{S(n.props.eyebrow)}</p>}
          <H style={css(headingStyle(n.props))}>{S(n.props.text)}</H>
        </div>
      );
    },
  },
  text: {
    type: 'text',
    label: 'Text',
    group: 'typography',
    icon: 'text',
    description: 'Paragraph of body copy',
    keywords: 'paragraph copy body p lead',
    defaults: { text: 'Write a short, helpful paragraph here.', size: 'md', tone: 'default', align: 'start', weight: 'regular' },
    fields: [
      { key: 'text', label: 'Text', kind: 'textarea' },
      { key: 'size', label: 'Size', kind: 'select', options: [{ label: 'Small', value: 'sm' }, { label: 'Body', value: 'md' }, { label: 'Lead', value: 'lg' }] },
      { key: 'tone', label: 'Tone', kind: 'select', options: o('default', 'muted') },
      { key: 'weight', label: 'Weight', kind: 'select', options: o('regular', 'bold') },
      ALIGN_FIELD,
    ],
    summary: (p) => S(p.text),
    render: (n) => <p style={css(textStyle(n.props))}>{S(n.props.text)}</p>,
  },
  list: {
    type: 'list',
    label: 'List',
    group: 'typography',
    icon: 'list',
    description: 'Bulleted or checkmark list',
    keywords: 'bullets checklist ul features',
    defaults: { items: 'First point\nSecond point\nThird point', marker: 'check' },
    fields: [
      { key: 'items', label: 'Items', kind: 'lines', hint: 'One item per line' },
      { key: 'marker', label: 'Marker', kind: 'select', options: o('check', 'bullet') },
    ],
    summary: (p) => `${lines(p.items).length} items`,
    render: (n) => (
      <ul className={n.props.marker === 'check' ? 'sp-list sp-list--check' : 'sp-list'}>
        {lines(n.props.items).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    ),
  },
  badge: {
    type: 'badge',
    label: 'Badge',
    group: 'typography',
    icon: 'badge',
    description: 'Small status or category label',
    keywords: 'tag label pill chip status',
    defaults: { text: 'New', variant: 'primary' },
    fields: [
      { key: 'text', label: 'Text', kind: 'text' },
      { key: 'variant', label: 'Variant', kind: 'select', options: o('neutral', 'primary', 'info', 'success', 'warning', 'danger') },
    ],
    summary: (p) => S(p.text),
    render: (n) => (
      <span>
        <Badge variant={S(n.props.variant, 'neutral') as 'primary'}>{S(n.props.text)}</Badge>
      </span>
    ),
  },

  /* ---------------- Forms ---------------- */
  input: {
    type: 'input',
    label: 'Input',
    group: 'forms',
    icon: 'input',
    description: 'Labelled text field',
    keywords: 'text field email password textbox',
    defaults: { label: 'Email', type: 'email', placeholder: 'you@example.com', hint: '' },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'type', label: 'Type', kind: 'select', options: o('text', 'email', 'password', 'number', 'search', 'tel', 'url') },
      { key: 'placeholder', label: 'Placeholder', kind: 'text' },
      { key: 'hint', label: 'Hint', kind: 'text' },
    ],
    summary: (p) => S(p.label),
    render: (n) => (
      <Input label={S(n.props.label, 'Field')} type={S(n.props.type, 'text')} placeholder={S(n.props.placeholder) || undefined} hint={S(n.props.hint) || undefined} />
    ),
  },
  select: {
    type: 'select',
    label: 'Select',
    group: 'forms',
    icon: 'select',
    description: 'Native dropdown with options',
    keywords: 'dropdown combobox picker options',
    defaults: { label: 'Country', options: 'Jordan\nSaudi Arabia\nUnited Arab Emirates\nEgypt', placeholder: 'Choose…' },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'options', label: 'Options', kind: 'lines', hint: 'One option per line' },
      { key: 'placeholder', label: 'Placeholder', kind: 'text' },
    ],
    summary: (p) => S(p.label),
    render: (n) => (
      <Select
        label={S(n.props.label, 'Select')}
        placeholder={S(n.props.placeholder) || undefined}
        options={lines(n.props.options).map((l) => ({ label: l, value: l }))}
        defaultValue=""
      />
    ),
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    group: 'forms',
    icon: 'checkbox',
    description: 'Single checkbox with label',
    keywords: 'check tick agree terms',
    defaults: { label: 'Remember me', checked: false },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'checked', label: 'Checked', kind: 'boolean' },
    ],
    summary: (p) => S(p.label),
    render: (n) => <Checkbox key={String(n.props.checked)} label={S(n.props.label)} defaultChecked={Boolean(n.props.checked)} />,
  },
  switch: {
    type: 'switch',
    label: 'Switch',
    group: 'forms',
    icon: 'switch',
    description: 'On/off toggle with label',
    keywords: 'toggle on off setting',
    defaults: { label: 'Email notifications', checked: true },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'checked', label: 'On', kind: 'boolean' },
    ],
    summary: (p) => S(p.label),
    render: (n) => <SwitchView label={S(n.props.label)} initial={Boolean(n.props.checked)} />,
  },
  datepicker: {
    type: 'datepicker',
    label: 'Date picker',
    group: 'forms',
    icon: 'datepicker',
    description: 'Calendar popup, single date or range',
    keywords: 'date calendar range day',
    defaults: { label: 'Date', mode: 'single' },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'mode', label: 'Selection', kind: 'select', options: o('single', 'range') },
    ],
    summary: (p) => S(p.label),
    render: (n) => <DatePicker key={S(n.props.mode)} label={S(n.props.label, 'Date')} selectionMode={n.props.mode === 'range' ? 'range' : 'single'} showButtonBar />,
  },
  otp: {
    type: 'otp',
    label: 'Input OTP',
    group: 'forms',
    icon: 'otp',
    description: 'One-time code boxes',
    keywords: 'otp code verification pin 2fa',
    defaults: { label: 'Verification code', length: 6 },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'length', label: 'Digits', kind: 'number', min: 4, max: 8 },
    ],
    summary: (p) => `${p.length} digits`,
    render: (n) => <InputOtp key={String(n.props.length)} label={S(n.props.label)} length={Math.min(8, Math.max(4, N(n.props.length, 6)))} integerOnly />,
  },
  button: {
    type: 'button',
    label: 'Button',
    group: 'forms',
    icon: 'button',
    description: 'Action button',
    keywords: 'cta action submit link',
    defaults: { text: 'Get started', variant: 'primary', size: 'md', block: false },
    fields: [
      { key: 'text', label: 'Text', kind: 'text' },
      { key: 'variant', label: 'Variant', kind: 'select', options: VARIANT_BUTTON },
      { key: 'size', label: 'Size', kind: 'select', options: o('sm', 'md', 'lg') },
      { key: 'block', label: 'Full width', kind: 'boolean' },
    ],
    summary: (p) => S(p.text),
    render: (n) => (
      <Button variant={S(n.props.variant, 'primary') as 'primary'} size={S(n.props.size, 'md') as 'md'} block={Boolean(n.props.block)}>
        {S(n.props.text, 'Button')}
      </Button>
    ),
  },
  captcha: {
    type: 'captcha',
    label: 'Captcha',
    group: 'forms',
    icon: 'captcha',
    description: 'Placeholder for your captcha provider',
    keywords: 'robot bot human verification recaptcha turnstile hcaptcha',
    defaults: { label: "I'm not a robot", provider: 'Captcha' },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'provider', label: 'Provider name', kind: 'text', hint: 'Replace with Turnstile, hCaptcha or reCAPTCHA in your app' },
    ],
    render: (n) => <CaptchaView p={n.props} />,
  },

  /* ---------------- Data ---------------- */
  table: {
    type: 'table',
    label: 'Data table',
    group: 'data',
    icon: 'table',
    description: 'Sortable table; stacks on phones',
    keywords: 'datatable grid rows orders list',
    defaults: {
      caption: 'Recent orders',
      showCaption: false,
      columns: 'Order | Customer | Status | Total',
      rows: '#1042 | Lina Haddad | Paid | $1,240\n#1041 | Omar Khalil | Pending | $320\n#1040 | Sara Nasser | Shipped | $86\n#1039 | Yousef Amin | Refunded | $45',
    },
    fields: [
      { key: 'caption', label: 'Caption (accessible name)', kind: 'text' },
      { key: 'showCaption', label: 'Show caption', kind: 'boolean' },
      { key: 'columns', label: 'Columns', kind: 'text', hint: 'Separate with |' },
      { key: 'rows', label: 'Rows', kind: 'lines', hint: 'One row per line, cells separated by |' },
    ],
    summary: (p) => S(p.caption),
    render: (n) => <TableView p={n.props} />,
  },
  stat: {
    type: 'stat',
    label: 'Stat / KPI',
    group: 'data',
    icon: 'stat',
    description: 'Key number with trend and sparkline',
    keywords: 'kpi metric number stat figure',
    defaults: { label: 'Revenue', value: '$48,250', delta: '+12.4%', period: 'vs last month', spark: '12, 14, 13, 17, 16, 19, 22' },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'value', label: 'Value', kind: 'text' },
      { key: 'delta', label: 'Change', kind: 'text', hint: 'Start with - for a decrease' },
      { key: 'period', label: 'Period', kind: 'text' },
      { key: 'spark', label: 'Trend values', kind: 'text', hint: 'Comma-separated numbers (optional)' },
    ],
    summary: (p) => S(p.label),
    render: (n) => <StatView p={n.props} />,
  },
  chart: {
    type: 'chart',
    label: 'Chart',
    group: 'data',
    icon: 'chart',
    description: 'Bar, line, area or donut chart',
    keywords: 'graph bar line donut pie area plot revenue',
    defaults: {
      kind: 'bar',
      title: 'Revenue by month',
      series: 'Revenue | Costs',
      data: 'Jan | 42 | 28\nFeb | 48 | 30\nMar | 55 | 31\nApr | 51 | 33\nMay | 63 | 35\nJun | 72 | 38',
      height: 280,
      stacked: false,
    },
    fields: [
      { key: 'kind', label: 'Type', kind: 'select', options: o('bar', 'line', 'area', 'donut') },
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'series', label: 'Series names', kind: 'text', hint: 'Separate with |' },
      { key: 'data', label: 'Data', kind: 'lines', hint: 'Label | value | value… one per line' },
      { key: 'height', label: 'Height (px)', kind: 'number', min: 160, max: 520 },
      { key: 'stacked', label: 'Stacked bars', kind: 'boolean' },
    ],
    summary: (p) => `${S(p.kind)} · ${S(p.title)}`,
    render: (n) => <ChartView key={S(n.props.kind)} p={n.props} />,
  },
  timeline: {
    type: 'timeline',
    label: 'Timeline',
    group: 'data',
    icon: 'timeline',
    description: 'Ordered events with time',
    keywords: 'activity history events log feed',
    defaults: { items: 'Order placed | Payment confirmed | 09:12\nPacked | Ready for courier | 11:40\nShipped | Tracking number sent | 14:05' },
    fields: [{ key: 'items', label: 'Events', kind: 'lines', hint: 'Title | description | time' }],
    summary: (p) => `${lines(p.items).length} events`,
    render: (n) => <Timeline items={rows(n.props.items).map((r) => ({ title: r[0], description: r[1] || undefined, time: r[2] || undefined }))} />,
  },
  progress: {
    type: 'progress',
    label: 'Progress',
    group: 'data',
    icon: 'progress',
    description: 'Labelled progress bar',
    keywords: 'progressbar meter completion',
    defaults: { label: 'Profile completion', value: 64 },
    fields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'value', label: 'Value (0–100)', kind: 'number', min: 0, max: 100 },
    ],
    summary: (p) => `${p.value}%`,
    render: (n) => (
      <div className="sp-progress">
        <div className="sp-progress__row">
          <span>{S(n.props.label)}</span>
          <span className="sp-progress__value">{N(n.props.value, 0)}%</span>
        </div>
        <ProgressBar value={N(n.props.value, 0)} label={S(n.props.label, 'Progress')} />
      </div>
    ),
  },

  /* ---------------- Feedback ---------------- */
  alert: {
    type: 'alert',
    label: 'Alert',
    group: 'feedback',
    icon: 'alert',
    description: 'Inline status message',
    keywords: 'message notice banner callout warning error',
    defaults: { variant: 'info', title: 'Heads up', text: 'Your trial ends in 5 days.' },
    fields: [
      { key: 'variant', label: 'Variant', kind: 'select', options: TONES },
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'text', label: 'Message', kind: 'textarea' },
    ],
    summary: (p) => S(p.title),
    render: (n) => (
      <Alert variant={S(n.props.variant, 'info') as 'info'} title={S(n.props.title) || undefined}>
        {S(n.props.text)}
      </Alert>
    ),
  },
  empty: {
    type: 'empty',
    label: 'Empty state',
    group: 'feedback',
    icon: 'empty',
    description: 'Nothing-here-yet message with actions',
    keywords: 'empty no results zero blank 404 onboarding',
    defaults: { title: 'No projects yet', description: 'Create your first project to start collaborating with your team.', action: 'New project', secondary: 'Import', icon: '📁', size: 'default' },
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'icon', label: 'Icon (emoji)', kind: 'text' },
      { key: 'action', label: 'Primary action', kind: 'text' },
      { key: 'secondary', label: 'Secondary action', kind: 'text' },
      { key: 'size', label: 'Size', kind: 'select', options: o('compact', 'default', 'page') },
    ],
    summary: (p) => S(p.title),
    render: (n) => (
      <EmptyState
        title={S(n.props.title)}
        description={S(n.props.description) || undefined}
        icon={S(n.props.icon) || undefined}
        size={S(n.props.size, 'default') as 'default'}
        primaryAction={S(n.props.action) ? <Button>{S(n.props.action)}</Button> : undefined}
        secondaryAction={S(n.props.secondary) ? <Button variant="ghost">{S(n.props.secondary)}</Button> : undefined}
      />
    ),
  },
  skeleton: {
    type: 'skeleton',
    label: 'Skeleton',
    group: 'feedback',
    icon: 'skeleton',
    description: 'Loading placeholder (text or card)',
    keywords: 'loading placeholder shimmer',
    defaults: { kind: 'card', lines: 3 },
    fields: [
      { key: 'kind', label: 'Shape', kind: 'select', options: o('text', 'card') },
      { key: 'lines', label: 'Lines', kind: 'number', min: 1, max: 8 },
    ],
    render: (n) =>
      n.props.kind === 'text' ? <SkeletonText lines={N(n.props.lines, 3)} /> : <SkeletonCard lines={N(n.props.lines, 3)} />,
  },
  toast: {
    type: 'toast',
    label: 'Toast trigger',
    group: 'feedback',
    icon: 'toast',
    description: 'Button that shows a toast (try it in Preview)',
    keywords: 'notification snackbar toaster message',
    defaults: { text: 'Save changes', message: 'Changes saved', variant: 'success', buttonVariant: 'secondary' },
    fields: [
      { key: 'text', label: 'Button text', kind: 'text' },
      { key: 'message', label: 'Toast message', kind: 'text' },
      { key: 'variant', label: 'Toast type', kind: 'select', options: o('success', 'info', 'warning', 'error') },
      { key: 'buttonVariant', label: 'Button variant', kind: 'select', options: VARIANT_BUTTON },
    ],
    summary: (p) => S(p.text),
    render: (n, _k, ctx) => (
      <span>
        <Button variant={S(n.props.buttonVariant, 'secondary') as 'secondary'} onClick={() => !ctx.editing && fire(S(n.props.variant, 'success'), S(n.props.message))}>
          {S(n.props.text, 'Show toast')}
        </Button>
      </span>
    ),
  },

  /* ---------------- Navigation ---------------- */
  tabs: {
    type: 'tabs',
    label: 'Tabs',
    group: 'navigation',
    icon: 'tabs',
    description: 'Each child becomes one tab panel',
    keywords: 'tab panels sections settings',
    container: true,
    defaults: { labels: 'Profile\nNotifications\nSecurity' },
    defaultChildren: () => [
      node('stack', {}, [node('input', { label: 'Full name', type: 'text', placeholder: 'Lina Haddad' })]),
      node('stack', {}, [node('switch', { label: 'Product updates', checked: true })]),
      node('stack', {}, [node('input', { label: 'Password', type: 'password', placeholder: '' })]),
    ],
    fields: [{ key: 'labels', label: 'Tab labels', kind: 'lines', hint: 'One per line; tab N shows child N' }],
    summary: (p) => lines(p.labels).join(', '),
    render: (n, kids) => {
      const labels = lines(n.props.labels);
      const count = Math.max(kids.length, 1);
      const tabs = Array.from({ length: count }, (_, i) => ({ key: `t${i}`, label: labels[i] ?? `Tab ${i + 1}`, content: kids[i] ?? null }));
      return <Tabs tabs={tabs} />;
    },
  },
  breadcrumb: {
    type: 'breadcrumb',
    label: 'Breadcrumb',
    group: 'navigation',
    icon: 'breadcrumb',
    description: 'Where-am-I trail',
    keywords: 'path trail crumbs',
    defaults: { items: 'Home\nSettings\nProfile' },
    fields: [{ key: 'items', label: 'Items', kind: 'lines', hint: 'One per line; the last is the current page' }],
    summary: (p) => lines(p.items).join(' / '),
    render: (n) => <Breadcrumb items={lines(n.props.items).map((l) => ({ label: l, href: '#' }))} label={`Breadcrumb: ${lines(n.props.items).slice(-1)[0] ?? ''}`} />,
  },
  stepper: {
    type: 'stepper',
    label: 'Stepper',
    group: 'navigation',
    icon: 'stepper',
    description: 'Progress through steps',
    keywords: 'steps wizard progress onboarding checkout',
    defaults: { steps: 'Account\nProfile\nPlan\nDone', current: 1 },
    fields: [
      { key: 'steps', label: 'Steps', kind: 'lines', hint: 'One per line' },
      { key: 'current', label: 'Current step (from 1)', kind: 'number', min: 1, max: 10 },
    ],
    summary: (p) => `${lines(p.steps).length} steps`,
    render: (n) => <Stepper steps={lines(n.props.steps).map((l) => ({ label: l }))} current={Math.max(0, N(n.props.current, 1) - 1)} />,
  },
  accordion: {
    type: 'accordion',
    label: 'Accordion',
    group: 'navigation',
    icon: 'accordion',
    description: 'Collapsible questions and answers',
    keywords: 'faq collapse expand disclosure questions',
    defaults: { items: 'Can I cancel anytime? | Yes. Plans are month to month and you can cancel from Settings.\nDo you offer refunds? | We refund any payment within 14 days, no questions asked.\nIs there a free trial? | Every plan starts with a 14-day trial. No card required.' },
    fields: [{ key: 'items', label: 'Items', kind: 'lines', hint: 'Question | answer, one per line' }],
    summary: (p) => `${lines(p.items).length} items`,
    render: (n) => <Accordion items={rows(n.props.items).map((r, i) => ({ key: `q${i}`, title: r[0], content: <p style={{ margin: 0 }}>{r[1] ?? ''}</p> }))} defaultOpen={['q0']} />,
  },

  /* ---------------- Media ---------------- */
  avatar: {
    type: 'avatar',
    label: 'Avatar',
    group: 'media',
    icon: 'avatar',
    description: 'Initials avatar, optionally with name',
    keywords: 'user profile person photo',
    defaults: { name: 'Lina Haddad', subtitle: 'Product designer', size: 'md', showName: true },
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'text' },
      { key: 'size', label: 'Size', kind: 'select', options: o('sm', 'md', 'lg') },
      { key: 'showName', label: 'Show name', kind: 'boolean' },
    ],
    summary: (p) => S(p.name),
    render: (n) =>
      n.props.showName ? (
        <span className="sp-person">
          <Avatar name={S(n.props.name, 'User')} size={S(n.props.size, 'md') as 'md'} />
          <span>
            <strong>{S(n.props.name)}</strong>
            {S(n.props.subtitle) && <span className="sp-person__sub">{S(n.props.subtitle)}</span>}
          </span>
        </span>
      ) : (
        <span>
          <Avatar name={S(n.props.name, 'User')} size={S(n.props.size, 'md') as 'md'} />
        </span>
      ),
  },
  image: {
    type: 'image',
    label: 'Image',
    group: 'media',
    icon: 'image',
    description: 'Image placeholder with alt text',
    keywords: 'photo picture illustration media',
    defaults: { alt: 'Product screenshot', ratio: '16/9', hue: 262, caption: '' },
    fields: [
      { key: 'alt', label: 'Alt text', kind: 'text', hint: 'Describe the image for screen readers' },
      { key: 'ratio', label: 'Aspect ratio', kind: 'select', options: ['16/9', '4/3', '1/1', '3/4', '21/9'].map((r) => ({ label: r.replace('/', ':'), value: r })) },
      { key: 'hue', label: 'Placeholder hue (0–360)', kind: 'number', min: 0, max: 360 },
      { key: 'caption', label: 'Caption', kind: 'text' },
    ],
    summary: (p) => S(p.alt),
    render: (n) => (
      <figure className="sp-figure">
        <img src={placeholderImage(S(n.props.alt), N(n.props.hue, 262), S(n.props.ratio, '16/9'))} alt={S(n.props.alt)} style={{ aspectRatio: S(n.props.ratio, '16/9') }} />
        {S(n.props.caption) && <figcaption>{S(n.props.caption)}</figcaption>}
      </figure>
    ),
  },
  carousel: {
    type: 'carousel',
    label: 'Carousel',
    group: 'media',
    icon: 'carousel',
    description: 'Sliding cards with navigation',
    keywords: 'slider gallery slides',
    defaults: { label: 'Featured', items: 'Wadi Rum | from $380\nAqaba | from $310\nDead Sea | from $290\nPetra | from $420', visible: 3 },
    fields: [
      { key: 'label', label: 'Accessible name', kind: 'text' },
      { key: 'items', label: 'Slides', kind: 'lines', hint: 'Title | caption, one per line' },
      { key: 'visible', label: 'Visible at once', kind: 'number', min: 1, max: 4 },
    ],
    summary: (p) => `${lines(p.items).length} slides`,
    render: (n) => {
      const items = rows(n.props.items).map((r, i) => ({ title: r[0], caption: r[1] ?? '', hue: (i * 47 + 20) % 360 }));
      return (
        <Carousel
          key={`${n.props.visible}-${items.length}`}
          label={S(n.props.label, 'Carousel')}
          items={items}
          numVisible={Math.min(4, Math.max(1, N(n.props.visible, 3)))}
          responsiveOptions={[{ breakpoint: '640px', numVisible: 1 }]}
          getKey={(it, i) => `${it.title}-${i}`}
          itemTemplate={(it) => (
            <figure className="sp-slide">
              <img src={placeholderImage(it.title, it.hue, '3/2')} alt={it.title} />
              <figcaption>
                <strong>{it.title}</strong>
                <span>{it.caption}</span>
              </figcaption>
            </figure>
          )}
        />
      );
    },
  },
};

function SwitchView({ label, initial }: { label: string; initial: boolean }) {
  return <SwitchState key={String(initial)} label={label} initial={initial} />;
}
function SwitchState({ label, initial }: { label: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <span className="sp-switch-row">
      <Switch checked={on} onChange={setOn} label={label} showLabel />
    </span>
  );
}

export const NODE_TYPES = Object.keys(REGISTRY) as NodeType[];

export function isContainer(type: NodeType): boolean {
  return Boolean(REGISTRY[type]?.container);
}

export function nodeLabel(n: SpaceNode): string {
  const def = REGISTRY[n.type];
  const s = def.summary?.(n.props) ?? '';
  const short = s.length > 34 ? `${s.slice(0, 33)}…` : s;
  return short ? `${def.label}: ${short}` : def.label;
}

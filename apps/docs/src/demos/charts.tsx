import { useState } from 'react';
import {
  AreaChart,
  Axis,
  BarChart,
  BarSeries,
  BubbleChart,
  ChartContainer,
  ChartPlot,
  ComboChart,
  DonutChart,
  GaugeChart,
  Gridlines,
  Heatmap,
  Legend,
  LineChart,
  LineSeries,
  PieChart,
  RadarChart,
  RadialProgress,
  ReferenceLine,
  Annotation,
  ScatterChart,
  Segmented,
  Sparkline,
  WaterfallChart,
  bandScale,
  calendarHeatmapData,
  linearScale,
  type ChartPoint,
} from '@pelagic-ui/react';
import { createDemoIsland, Row, SwitchField } from './shared';

/* ---------- Realistic datasets (a fictional SaaS company) ---------- */

const revenue = [
  { quarter: 'Q1 2025', product: 182000, services: 64000 },
  { quarter: 'Q2 2025', product: 214000, services: 71000 },
  { quarter: 'Q3 2025', product: 236000, services: 69000 },
  { quarter: 'Q4 2025', product: 281000, services: 88000 },
  { quarter: 'Q1 2026', product: 302000, services: 92000 },
  { quarter: 'Q2 2026', product: 338000, services: 101000 },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const users = months.map((month, i) => ({
  month,
  web: Math.round(18400 + i * 1650 + Math.sin(i / 1.6) * 1400),
  mobile: Math.round(9200 + i * 2100 + Math.cos(i / 2) * 900),
}));

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const traffic = days.map((day, i) => ({
  day,
  organic: [4200, 4650, 4810, 4720, 4390, 2950, 2710][i]!,
  social: [1300, 1420, 1610, 1980, 2310, 2620, 2240][i]!,
  paid: [900, 980, 1010, 1050, 990, 640, 600][i]!,
}));

const orders = months.slice(0, 8).map((month, i) => ({
  month,
  orders: [1180, 1320, 1290, 1510, 1640, 1720, 1910, 2080][i]!,
  conversion: [0.021, 0.023, 0.022, 0.026, 0.027, 0.028, 0.031, 0.033][i]!,
}));

const sources = [
  { source: 'Organic search', visits: 48200 },
  { source: 'Direct', visits: 26100 },
  { source: 'Social', visits: 15400 },
  { source: 'Referral', visits: 9800 },
  { source: 'Email', visits: 6200 },
  { source: 'Paid search', visits: 4900 },
  { source: 'Other', visits: 1300 },
];

const plans = [
  { plan: 'Free', users: 7420 },
  { plan: 'Pro', users: 3810 },
  { plan: 'Team', users: 960 },
  { plan: 'Enterprise', users: 210 },
];

// Deterministic pseudo-random so server and client render the same numbers.
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const sessions = Array.from({ length: 45 }, (_, i) => {
  const device = ['Desktop', 'Mobile', 'Tablet'][i % 3]!;
  const minutes = Math.round((1 + rand(i) * 14 + (device === 'Desktop' ? 3 : 0)) * 10) / 10;
  return { id: `Session ${i + 1}`, device, minutes, pages: Math.max(1, Math.round(minutes * (0.7 + rand(i + 100) * 0.6))) };
});

const markets = [
  { country: 'Jordan', growth: 18, margin: 22, revenue: 1.4 },
  { country: 'UAE', growth: 24, margin: 31, revenue: 4.2 },
  { country: 'Saudi Arabia', growth: 29, margin: 27, revenue: 6.1 },
  { country: 'Egypt', growth: 35, margin: 14, revenue: 2.3 },
  { country: 'Germany', growth: 8, margin: 34, revenue: 5.4 },
  { country: 'UK', growth: 6, margin: 29, revenue: 3.9 },
  { country: 'Morocco', growth: 21, margin: 18, revenue: 1.1 },
];

const scores = [
  { metric: 'Accessibility', pelagic: 9.6, avg: 6.8 },
  { metric: 'Theming', pelagic: 9.2, avg: 7.1 },
  { metric: 'Bundle size', pelagic: 8.4, avg: 6.2 },
  { metric: 'Docs', pelagic: 8.8, avg: 7.4 },
  { metric: 'RTL', pelagic: 9.4, avg: 4.9 },
  { metric: 'Frameworks', pelagic: 9.0, avg: 5.6 },
];

const hours = ['00', '03', '06', '09', '12', '15', '18', '21'];
const visits = days.flatMap((day, d) =>
  hours.map((hour, h) => ({
    day,
    hour,
    count: Math.round((d < 5 ? 1 : 0.55) * [40, 18, 30, 210, 260, 240, 190, 120][h]! * (0.85 + rand(d * 10 + h) * 0.3)),
  })),
);

const commits = Array.from({ length: 16 * 7 }, (_, i) => {
  const date = new Date(2026, 5, 1);
  date.setDate(date.getDate() + i);
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  return { date, value: Math.max(0, Math.round(rand(i + 7) * (weekend ? 3 : 9) - (weekend ? 1 : 0))) };
});

const usd = { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 } as const;

/* ---------- Demos ---------- */

function BarDemo() {
  const [stacked, setStacked] = useState(false);
  const [horizontal, setHorizontal] = useState(false);
  return (
    <div className="demo-col">
      <Row>
        <SwitchField label="Stacked" checked={stacked} onChange={setStacked} />
        <SwitchField label="Horizontal" checked={horizontal} onChange={setHorizontal} />
      </Row>
      <BarChart
        title="Revenue by quarter"
        description="Product subscriptions and professional services, USD."
        data={revenue}
        x="quarter"
        series={[
          { key: 'product', label: 'Product' },
          { key: 'services', label: 'Services' },
        ]}
        stacked={stacked}
        orientation={horizontal ? 'horizontal' : 'vertical'}
        valueFormat={usd}
        height={320}
        table="toggle"
      />
    </div>
  );
}

function LineDemo() {
  const [curve, setCurve] = useState('monotone');
  return (
    <div className="demo-col">
      <Segmented
        label="Curve"
        value={curve}
        onChange={setCurve}
        options={[
          { label: 'Monotone', value: 'monotone' },
          { label: 'Linear', value: 'linear' },
          { label: 'Step', value: 'step' },
        ]}
      />
      <LineChart
        title="Monthly active users, 2026"
        data={users}
        x="month"
        curve={curve as 'monotone' | 'linear' | 'step'}
        series={[
          { key: 'web', label: 'Web' },
          { key: 'mobile', label: 'Mobile app' },
        ]}
        valueFormat={{ notation: 'compact', maximumFractionDigits: 1 }}
        yLabel="Users"
        height={300}
      />
    </div>
  );
}

function AreaDemo() {
  const [mode, setMode] = useState('stacked');
  return (
    <div className="demo-col">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ label: 'Stacked', value: 'stacked' }, { label: 'Overlap', value: 'overlap' }]} />
      <AreaChart
        title="Website traffic by source, last week"
        data={traffic}
        x="day"
        mode={mode as 'stacked' | 'overlap'}
        gradient
        series={[
          { key: 'organic', label: 'Organic' },
          { key: 'social', label: 'Social' },
          { key: 'paid', label: 'Paid' },
        ]}
        valueFormat={{ notation: 'compact' }}
        height={300}
      />
    </div>
  );
}

function ComboDemo() {
  return (
    <ComboChart
      title="Orders and conversion rate"
      data={orders}
      x="month"
      series={[
        { key: 'orders', label: 'Orders', type: 'bar' },
        { key: 'conversion', label: 'Conversion rate', type: 'line', axis: 'secondary' },
      ]}
      secondaryFormat={{ style: 'percent', maximumFractionDigits: 1 }}
      primaryLabel="Orders"
      secondaryLabel="Conversion"
      height={300}
    />
  );
}

function PieDemo() {
  return <PieChart title="Traffic sources, last 30 days" data={sources} label="source" value="visits" otherThreshold={0.03} valueFormat={{ notation: 'compact' }} height={300} />;
}

function DonutDemo() {
  const total = plans.reduce((n, p) => n + p.users, 0);
  return (
    <DonutChart
      title="Users by plan"
      data={plans}
      label="plan"
      value="users"
      centerLabel={new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(total)}
      centerSubLabel="users"
      height={300}
    />
  );
}

function ScatterDemo() {
  return (
    <ScatterChart
      title="Session length vs pages viewed"
      data={sessions}
      x="minutes"
      y="pages"
      group="device"
      pointLabel="id"
      xLabel="Minutes on site"
      yLabel="Pages viewed"
      height={320}
    />
  );
}

function BubbleDemo() {
  return (
    <BubbleChart
      title="Markets: growth, margin and revenue"
      data={markets}
      x="growth"
      y="margin"
      size="revenue"
      pointLabel="country"
      xLabel="Growth (%)"
      yLabel="Margin (%)"
      sizeLabel="Revenue ($M)"
      height={340}
    />
  );
}

function RadarDemo() {
  return (
    <RadarChart
      title="UI library scorecard"
      data={scores}
      x="metric"
      max={10}
      series={[
        { key: 'pelagic', label: 'Pelagic UI' },
        { key: 'avg', label: 'Category average' },
      ]}
      height={340}
    />
  );
}

function HeatmapDemo() {
  const cal = calendarHeatmapData(commits, { weekStartsOn: 1 });
  return (
    <div className="demo-col">
      <Heatmap title="Visits by weekday and hour" data={visits} x="hour" y="day" value="count" xCategories={hours} yCategories={days} showValues height={300} />
      <Heatmap
        title="Contributions, June – September 2026"
        data={cal.data}
        x="week"
        y="weekday"
        value="value"
        cellLabel="label"
        xCategories={cal.xCategories}
        yCategories={cal.yCategories}
        lessLabel="Less"
        moreLabel="More"
        height={220}
      />
    </div>
  );
}

function GaugeDemo() {
  const [load, setLoad] = useState(72);
  return (
    <div className="demo-col">
      <Row style={{ justifyContent: 'center', gap: '2rem' }}>
        <GaugeChart
          title="Server load"
          value={load}
          target={80}
          valueFormat={{ maximumFractionDigits: 0 }}
          thresholds={[
            { upTo: 60, tone: 'success' },
            { upTo: 85, tone: 'warning' },
            { upTo: 100, tone: 'danger' },
          ]}
        />
      </Row>
      <Row style={{ justifyContent: 'center' }}>
        <button type="button" className="pl-btn pl-btn--secondary pl-btn--sm" onClick={() => setLoad((v) => Math.max(0, v - 10))}>
          −10
        </button>
        <button type="button" className="pl-btn pl-btn--secondary pl-btn--sm" onClick={() => setLoad((v) => Math.min(100, v + 10))}>
          +10
        </button>
      </Row>
    </div>
  );
}

function RadialDemo() {
  return (
    <Row style={{ justifyContent: 'center', gap: '2rem' }}>
      <RadialProgress title="Quarterly sales goal" value={68} max={100} valueFormat={{ maximumFractionDigits: 0 }} size={160} />
      <RadialProgress title="Onboarding completed" value={412} max={500} size={160} thresholds={[{ upTo: 500, tone: 'success' }]} />
    </Row>
  );
}

function WaterfallDemo() {
  return (
    <WaterfallChart
      title="Profit bridge, FY 2025"
      valueFormat={usd}
      height={320}
      data={[
        { label: 'Revenue', value: 1_480_000, total: true },
        { label: 'Cost of sales', value: -520_000 },
        { label: 'Salaries', value: -410_000 },
        { label: 'Marketing', value: -160_000 },
        { label: 'Cloud', value: -90_000 },
        { label: 'Other income', value: 45_000 },
        { label: 'Net profit', value: 345_000, total: true },
      ]}
    />
  );
}

function SparkDemo() {
  const rows = [
    { label: 'Revenue', data: revenue.map((r) => r.product + r.services), tone: 'success' as const, value: '$439k' },
    { label: 'Active users', data: users.map((u) => u.web + u.mobile), tone: 'primary' as const, value: '71.2k' },
    { label: 'Churn', data: [3.1, 3.0, 2.9, 3.3, 2.7, 2.5, 2.4, 2.6, 2.2, 2.1], tone: 'danger' as const, value: '2.1%' },
  ];
  return (
    <div className="demo-col">
      <table className="props-table" style={{ maxWidth: '32rem' }}>
        <caption className="pl-sr-only">Key metrics with trends</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Now</th>
            <th scope="col">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{r.value}</td>
              <td>
                <Sparkline data={r.data} label={r.label} period="this year" tone={r.tone} area showEnd width={140} height={32} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A custom chart built only from the public primitives. */
function PrimitivesDemo() {
  const visitors = [620, 710, 680, 790, 940, 520, 480];
  const target = 700;
  const max = 1000;
  return (
    <ChartContainer
      title="Visitors per day (custom chart)"
      summary="Visitors peak on Friday at 940; four of seven days beat the 700 target."
      legend={
        <Legend
          items={[
            { label: 'Visitors', seriesIndex: 0, kind: 'bar' },
            { label: '3-day average', seriesIndex: 1, kind: 'line' },
          ]}
        />
      }
      height={300}
      tableData={{
        columns: ['Day', 'Visitors'],
        rows: days.map((d, i) => ({ header: d, cells: [visitors[i]!.toLocaleString('en')] })),
      }}
    >
      {(frame) => {
        const x = bandScale(days, frame.rtl ? [frame.innerWidth, 0] : [0, frame.innerWidth], { paddingInner: 0.3 });
        const y = linearScale([0, max], [frame.innerHeight, 0], { nice: true });
        const avg = visitors.map((_, i) => {
          const win = visitors.slice(Math.max(0, i - 2), i + 1);
          return win.reduce((a, b) => a + b, 0) / win.length;
        });
        const points: ChartPoint[][] = [
          days.map((d, i) => ({ x: x.center(d), y: y(visitors[i]!), title: d, series: 'Visitors', value: visitors[i]!.toLocaleString('en') })),
          days.map((d, i) => ({ x: x.center(d), y: y(avg[i]!), title: d, series: '3-day average', value: Math.round(avg[i]!).toLocaleString('en') })),
        ];
        return (
          <ChartPlot points={points}>
            <Gridlines scale={y} orientation="horizontal" />
            <BarSeries seriesIndex={0} bars={days.map((d, i) => ({ x: x(d), y: y(visitors[i]!), width: x.bandwidth, height: y(0) - y(visitors[i]!), key: d }))} />
            <LineSeries seriesIndex={1} curve="monotone" markers points={days.map((d, i) => ({ x: x.center(d), y: y(avg[i]!) }))} />
            <ReferenceLine y={y(target)} label="Target 700" tone="danger" />
            <Annotation x={x.center('Fri')} y={y(940)} dy={-18} label="Launch day" />
            <Axis scale={x} position="bottom" />
            <Axis scale={y} position="start" />
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

export default createDemoIsland(
  {
    barchart: BarDemo,
    linechart: LineDemo,
    areachart: AreaDemo,
    combochart: ComboDemo,
    piechart: PieDemo,
    donutchart: DonutDemo,
    scatterchart: ScatterDemo,
    bubblechart: BubbleDemo,
    radarchart: RadarDemo,
    heatmap: HeatmapDemo,
    gaugechart: GaugeDemo,
    radialprogress: RadialDemo,
    waterfallchart: WaterfallDemo,
    sparkline: SparkDemo,
    primitives: PrimitivesDemo,
  },
  ['barchart', 'linechart', 'areachart', 'combochart', 'piechart', 'donutchart', 'scatterchart', 'bubblechart', 'radarchart', 'heatmap', 'gaugechart', 'waterfallchart', 'sparkline', 'primitives'],
);

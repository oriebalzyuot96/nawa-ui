import type { CategoryDoc } from './types';

const chartKeys: [string, string][] = [
  ['Tab', 'Focus the plot (one tab stop per chart)'],
  ['Arrow Left / Arrow Right', 'Previous / next data point (mirrored in RTL)'],
  ['Arrow Up / Arrow Down', 'Switch series'],
  ['Home / End', 'First / last point'],
  ['Escape', 'Hide the tooltip'],
];

const chartA11y =
  'A <figure> with caption and an automatic text summary. The focused point is announced in a live region, patterns back up colour, and “Show data table” reveals the numbers as a real table.';

const base: [string, string, string][] = [
  ['title', 'ReactNode', 'Caption and accessible name (required).'],
  ['description / summary', 'ReactNode', 'Extra context; summary overrides the automatic one.'],
  ['table', "'toggle' | 'visible' | 'none'", 'Data-table fallback. Default toggle.'],
  ['valueFormat / locale', 'Intl.NumberFormatOptions | fn / string', 'Number formatting (e.g. currency, compact).'],
];

export const charts: CategoryDoc = {
  slug: 'charts',
  nav: 'Charts',
  icon: '📊',
  callout:
    'Keyboard: press Tab to focus a chart, then Arrow Left / Right to move between points and Arrow Up / Down to switch series. Home and End jump to the ends, Escape hides the tooltip. Every chart also has a “Show data table” button.',
  title: 'Accessible React charts — bar, line, area, pie, donut, scatter, radar, heatmap, gauge',
  h1: 'Charts',
  description:
    'Dependency-free, accessible SVG charts for React: Bar, Line, Area, Combo, Pie, Donut, Scatter, Bubble, Radar, Heatmap, Gauge, RadialProgress, Waterfall and Sparkline — keyboard navigable with data tables.',
  intro:
    'Every chart is keyboard navigable: tab to a chart, then use the arrow keys to move between points — each one is read aloud. Press “Show data table” under any chart to see the numbers as a table. Colours follow the theme and charts mirror in RTL.',
  entries: [
    {
      id: 'barchart',
      name: 'BarChart',
      description: 'Grouped or stacked bars, vertical or horizontal.',
      props: [
        ...base,
        ['data / x / series', 'T[] / keyof T | fn / { key, label, value? }[]', 'Data, category accessor and series.'],
        ['orientation', "'vertical' | 'horizontal'", 'Bar direction.'],
        ['stacked', 'boolean', 'Stack the series.'],
        ['directLabels', 'boolean', 'Print values on the bars.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<BarChart title="Revenue by quarter" data={revenue} x="quarter"
  series={[{ key: 'product', label: 'Product' }, { key: 'services', label: 'Services' }]}
  valueFormat={{ style: 'currency', currency: 'USD', notation: 'compact' }} />`,
      },
    },
    {
      id: 'linechart',
      name: 'LineChart',
      description: 'Trends over time with band, time or linear x scales and smooth or step curves.',
      props: [
        ...base,
        ['data / x / series', '…', 'As BarChart.'],
        ['xScale', "'auto' | 'band' | 'time' | 'linear'", 'X axis type.'],
        ['curve', "'linear' | 'monotone' | 'step'", 'Line shape.'],
        ['markers', "boolean | 'auto'", 'Point markers.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<LineChart title="Monthly active users" data={users} x="month" curve="monotone"
  series={[{ key: 'web', label: 'Web' }, { key: 'mobile', label: 'Mobile' }]}
  valueFormat={{ notation: 'compact' }} />`,
      },
    },
    {
      id: 'areachart',
      name: 'AreaChart',
      description: 'Stacked or overlapping areas with optional gradient fill.',
      props: [
        ...base,
        ['mode', "'stacked' | 'overlap'", 'How series combine.'],
        ['gradient', 'boolean', 'Gradient fill.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<AreaChart title="Traffic by source" data={traffic} x="day" mode="stacked" gradient
  series={[{ key: 'organic', label: 'Organic' }, { key: 'social', label: 'Social' }, { key: 'paid', label: 'Paid' }]} />`,
      },
    },
    {
      id: 'combochart',
      name: 'ComboChart',
      description: 'Bars and lines together, with an optional secondary axis.',
      props: [
        ...base,
        ['series', '{ key, label, type: "bar" | "line", axis?: "primary" | "secondary" }[]', 'Mixed series.'],
        ['secondaryFormat / primaryLabel / secondaryLabel', '…', 'Axis formatting and titles.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<ComboChart title="Orders and conversion" data={orders} x="month"
  series={[{ key: 'orders', label: 'Orders', type: 'bar' },
           { key: 'conversion', label: 'Conversion', type: 'line', axis: 'secondary' }]}
  secondaryFormat={{ style: 'percent' }} />`,
      },
    },
    {
      id: 'piechart',
      name: 'PieChart',
      description: 'Parts of a whole; small slices are grouped into “Other”.',
      props: [
        ...base,
        ['data / label / value', 'T[] / accessor / accessor', 'Slices.'],
        ['otherThreshold / maxSlices', 'number', 'Group small slices.'],
        ['sort', 'boolean', 'Largest first.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<PieChart title="Traffic sources" data={sources} label="source" value="visits" />`,
      },
    },
    {
      id: 'donutchart',
      name: 'DonutChart',
      description: 'A pie with a hole for a headline number.',
      props: [
        ...base,
        ['innerRadius', 'number (0–1)', 'Hole size. Default 0.6.'],
        ['centerLabel / centerSubLabel', 'ReactNode', 'Text in the middle.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<DonutChart title="Plan mix" data={plans} label="plan" value="users"
  centerLabel="12.4k" centerSubLabel="users" />`,
      },
    },
    {
      id: 'scatterchart',
      name: 'ScatterChart',
      description: 'Relationships between two measures, grouped by category with distinct marker shapes.',
      props: [
        ...base,
        ['x / y', 'accessor', 'Numeric axes.'],
        ['group / pointLabel', 'accessor', 'Series grouping and point names.'],
        ['xLabel / yLabel', 'string', 'Axis titles.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<ScatterChart title="Session length vs pages" data={sessions} x="minutes" y="pages"
  group="device" pointLabel="id" xLabel="Minutes" yLabel="Pages" />`,
      },
    },
    {
      id: 'bubblechart',
      name: 'BubbleChart',
      description: 'A scatter chart whose point size encodes a third value.',
      props: [
        ...base,
        ['size', 'accessor', 'Bubble size value (required).'],
        ['minRadius / maxRadius / sizeLabel', 'number / string', 'Size scale.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<BubbleChart title="Markets" data={markets} x="growth" y="margin" size="revenue"
  pointLabel="country" xLabel="Growth %" yLabel="Margin %" sizeLabel="Revenue" />`,
      },
    },
    {
      id: 'radarchart',
      name: 'RadarChart',
      description: 'Compare several series across the same set of dimensions.',
      props: [
        ...base,
        ['data / x / series', '…', 'Axes are the x categories.'],
        ['max', 'number', 'Outer ring value.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<RadarChart title="Framework scores" data={scores} x="metric" max={10}
  series={[{ key: 'orca', label: 'Orca UI' }, { key: 'other', label: 'Average' }]} />`,
      },
    },
    {
      id: 'heatmap',
      name: 'Heatmap',
      description: 'Values on a grid of two categories — plus calendarHeatmapData() for GitHub-style calendars.',
      props: [
        ...base,
        ['data / x / y / value', 'T[] / accessors', 'Cells.'],
        ['xCategories / yCategories', 'string[]', 'Order of rows and columns.'],
        ['showValues', 'boolean', 'Print values in cells.'],
        ['calendarHeatmapData(entries)', 'helper', 'Turns { date, value }[] into weeks × weekdays.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<Heatmap title="Visits by hour" data={visits} x="hour" y="day" value="count" showValues />

const cal = calendarHeatmapData(commits);
<Heatmap title="Contributions" {...cal} x="week" y="weekday" value="value" cellLabel="label" />`,
      },
    },
    {
      id: 'gaugechart',
      name: 'GaugeChart',
      description: 'A single value against a range, with coloured thresholds and a target.',
      props: [
        ['title / value', 'ReactNode / number', 'Required.'],
        ['min / max / target', 'number', 'Scale and target marker.'],
        ['thresholds', '{ upTo, tone }[]', 'Coloured bands.'],
        ['variant', "'semi' | 'radial'", 'Shape.'],
      ],
      a11y: 'The summary states the value, percentage and distance from the target (“72 of 100 (72%). Target 80: 8 below target.”).',
      code: {
        react: `<GaugeChart title="Server load" value={72} target={80} valueFormat={{ style: 'unit', unit: 'percent' }}
  thresholds={[{ upTo: 60, tone: 'success' }, { upTo: 85, tone: 'warning' }, { upTo: 100, tone: 'danger' }]} />`,
      },
    },
    {
      id: 'radialprogress',
      name: 'RadialProgress',
      description: 'A full-circle gauge for goals and completion.',
      props: [
        ['title / value / max', '…', 'As GaugeChart.'],
        ['size', 'number', 'Diameter (px).'],
      ],
      code: {
        react: `<RadialProgress title="Quarterly goal" value={68} max={100} size={160} />`,
      },
    },
    {
      id: 'waterfallchart',
      name: 'WaterfallChart',
      description: 'How a starting value becomes an ending value through increases and decreases.',
      props: [
        ['title', 'ReactNode', 'Required.'],
        ['data', '{ label, value, total? }[]', 'Steps; total marks subtotal bars.'],
        ['increaseLabel / decreaseLabel / totalLabel', 'string', 'Legend text.'],
        ['valueFormat', 'ValueFormat', 'Number format.'],
      ],
      keys: chartKeys,
      a11y: chartA11y,
      code: {
        react: `<WaterfallChart title="Profit bridge" valueFormat={{ style: 'currency', currency: 'USD', notation: 'compact' }}
  data={[{ label: 'Revenue', value: 420000, total: true }, { label: 'COGS', value: -160000 }, { label: 'Profit', value: 260000, total: true }]} />`,
      },
    },
    {
      id: 'sparkline',
      name: 'Sparkline',
      description: 'A tiny inline trend line for tables and stat cards.',
      props: [
        ['data', 'number[]', 'Values.'],
        ['label / period', 'string', 'Used in the generated text summary.'],
        ['area / showEnd', 'boolean', 'Fill and end dot.'],
        ['tone', 'ChartTone', 'Colour.'],
      ],
      a11y: 'role="img" with a generated text summary of the trend as its accessible name.',
      code: {
        react: `<Sparkline data={[12, 14, 13, 17, 19, 18, 24]} label="Signups" period="last 7 days" area showEnd />`,
      },
    },
    {
      id: 'primitives',
      name: 'Chart primitives',
      description: 'Build your own chart from ChartContainer, ChartPlot, scales, Axis, Gridlines, series, ReferenceLine, Annotation and Legend — accessibility included.',
      props: [
        ['ChartContainer', 'title, summary, legend, tableData, children(frame)', 'Accessible shell; measures width.'],
        ['ChartPlot points', 'ChartPoint[][]', 'Keyboard navigation, tooltip and announcements.'],
        ['linearScale / bandScale / timeScale', 'functions', 'Scales with ticks and invert.'],
        ['Axis / Gridlines', 'scale, position / orientation', 'Axes and grid.'],
        ['BarSeries / LineSeries / AreaSeries / PointSeries / ArcSeries', 'geometry', 'Marks.'],
        ['ReferenceLine / Annotation / Legend', '…', 'Context.'],
      ],
      keys: chartKeys,
      code: {
        react: `<ChartContainer title="Visitors" tableData={table}>
  {(frame) => {
    const x = bandScale(days, frame.rtl ? [frame.innerWidth, 0] : [0, frame.innerWidth]);
    const y = linearScale([0, max], [frame.innerHeight, 0], { nice: true });
    return (
      <ChartPlot points={[days.map((d, i) => ({ x: x.center(d), y: y(values[i]), title: d, series: 'Visitors', value: String(values[i]) }))]}>
        <Gridlines scale={y} orientation="horizontal" />
        <BarSeries bars={days.map((d, i) => ({ x: x(d), y: y(values[i]), width: x.bandwidth, height: y(0) - y(values[i]) }))} />
        <ReferenceLine y={y(target)} label="Target" dashed />
        <Axis scale={x} position="bottom" />
        <Axis scale={y} position="start" />
      </ChartPlot>
    );
  }}
</ChartContainer>`,
      },
    },
  ],
};

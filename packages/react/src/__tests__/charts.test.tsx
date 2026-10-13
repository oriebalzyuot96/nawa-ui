import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
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
  AreaChart,
  PieChart,
  RadarChart,
  RadialProgress,
  ReferenceLine,
  ScatterChart,
  Sparkline,
  WaterfallChart,
  Annotation,
  bandScale,
  calendarHeatmapData,
  describeSeries,
  groupSlices,
  linePath,
  linearScale,
  markerPath,
  niceDomain,
  niceTicks,
  summarizeChart,
  tickStep,
  timeScale,
  trendSummary,
} from '../index';

const sales = [
  { month: 'Jan', revenue: 12000, cost: 9000 },
  { month: 'Feb', revenue: 18000, cost: 9500 },
  { month: 'Mar', revenue: 24000, cost: 11000 },
  { month: 'Apr', revenue: 21000, cost: 10000 },
  { month: 'May', revenue: 31000, cost: 12000 },
  { month: 'Jun', revenue: 30000, cost: 12500 },
];
const salesSeries = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'cost', label: 'Cost' },
];

const live = (container: HTMLElement) => container.querySelector('[aria-live="polite"]') as HTMLElement;

describe('scales', () => {
  it('computes nice steps, domains and ticks', () => {
    expect(tickStep(0, 97, 5)).toBe(20);
    expect(tickStep(0, 1, 5)).toBe(0.2);
    expect(niceDomain(0, 97)).toEqual([0, 100]);
    expect(niceDomain(-3.2, 47)).toEqual([-10, 50]);
    expect(niceDomain(5, 5)).toEqual([2, 8]);
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    // No floating point noise.
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('maps and inverts linear scales, with nice domains and reversed ranges', () => {
    const y = linearScale([0, 97], [200, 0], { nice: true });
    expect(y.domain).toEqual([0, 100]);
    expect(y(0)).toBe(200);
    expect(y(50)).toBe(100);
    expect(y.invert(0)).toBe(100);
    expect(y.ticks()).toEqual([0, 20, 40, 60, 80, 100]);
    const clamped = linearScale([0, 10], [0, 100], { clamp: true });
    expect(clamped(20)).toBe(100);
  });

  it('lays out bands and mirrors them for RTL ranges', () => {
    const x = bandScale(['a', 'b', 'c', 'd'], [0, 400], { paddingInner: 0, paddingOuter: 0 });
    expect(x.bandwidth).toBe(100);
    expect(x('a')).toBe(0);
    expect(x.center('c')).toBe(250);
    expect(Number.isNaN(x('zzz'))).toBe(true);
    const rtl = bandScale(['a', 'b', 'c', 'd'], [400, 0], { paddingInner: 0, paddingOuter: 0 });
    expect(rtl('a')).toBe(300);
    expect(rtl('d')).toBe(0);
  });

  it('produces calendar-aligned time ticks', () => {
    const t = timeScale([new Date(2024, 0, 15), new Date(2024, 11, 10)], [0, 1000]);
    const ticks = t.ticks(6);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
    for (const d of ticks) {
      expect(d.getDate()).toBe(1); // month starts
      expect(d.getHours()).toBe(0);
    }
    expect(t(new Date(2024, 0, 15))).toBe(0);
    expect(t.tickFormat('en-US', 6)(new Date(2024, 2, 1))).toMatch(/Mar/);
    const nice = timeScale([new Date(2024, 0, 15), new Date(2024, 11, 10)], [0, 1000], { nice: true });
    expect(nice.domain[0].getDate()).toBe(1);
  });

  it('builds paths with gaps and monotone curves, and distinct marker shapes', () => {
    const d = linePath([{ x: 0, y: 0 }, { x: 10, y: 5 }, null, { x: 30, y: 5 }, { x: 40, y: 0 }]);
    expect(d.match(/M/g)).toHaveLength(2);
    const smooth = linePath([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 5 }], 'monotone');
    expect(smooth).toContain('C');
    const shapes = ['circle', 'square', 'triangle', 'diamond'] as const;
    const paths = shapes.map((s) => markerPath(s, 0, 0, 4));
    expect(new Set(paths).size).toBe(4);
  });
});

describe('summaries', () => {
  const compact = (v: number) => `${Math.round(v / 1000)}k`;

  it('describes a series with trend, endpoints and peak', () => {
    expect(
      describeSeries({ label: 'Revenue', values: sales.map((s) => s.revenue), categories: sales.map((s) => s.month) }, compact),
    ).toBe('Revenue rises from 12k in Jan to 30k in Jun, peak 31k in May.');
    expect(describeSeries({ label: 'Churn', values: [9, 7, 3, 4], categories: ['Q1', 'Q2', 'Q3', 'Q4'] })).toBe(
      'Churn falls from 9 in Q1 to 4 in Q4, low 3 in Q3.',
    );
    expect(describeSeries({ label: 'Flat', values: [5, 5, 5], categories: ['a', 'b', 'c'] })).toMatch(/stays flat at about 5/);
    expect(describeSeries({ label: 'Empty', values: [null, null], categories: ['a', 'b'] })).toBe('Empty: no data.');
    expect(describeSeries({ label: 'Gappy', values: [1, null, 3], categories: ['a', 'b', 'c'] })).toBe('Gappy rises from 1 in a to 3 in c.');
  });

  it('summarizes a chart and a sparkline trend', () => {
    const s = summarizeChart('Line chart', ['a', 'b'], [{ label: 'A', values: [1, 2] }, { label: 'B', values: [2, 1] }]);
    expect(s).toBe('Line chart with 2 categories and 2 series: A, B. A rises from 1 in a to 2 in b. B falls from 2 in a to 1 in b.');
    expect(trendSummary([100, 104, 103, 108, 112], { period: '7 days', locale: 'en-US' })).toBe('Up 12% over 7 days');
    expect(trendSummary([50, 40], { period: '2 weeks', locale: 'en-US' })).toBe('Down 20% over 2 weeks');
    expect(trendSummary([3, 3], { period: 'a day' })).toBe('Flat over a day');
  });

  it('adds an auto-generated summary to every chart', () => {
    render(<LineChart title="Sales" data={sales} x="month" series={salesSeries} locale="en-US" />);
    const plot = screen.getByRole('group', { name: 'Sales' });
    const summaryId = plot.getAttribute('aria-describedby')!.split(' ')[0];
    expect(document.getElementById(summaryId)).toHaveTextContent(/Revenue rises from 12K in Jan to 30K in Jun, peak 31K in May\./);
  });
});

describe('keyboard navigation and announcements', () => {
  it('is one tab stop; arrows move across points and series and are announced', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <button>before</button>
        <LineChart title="Sales" data={sales} x="month" series={salesSeries} locale="en-US" />
        <button>after</button>
      </>,
    );
    await user.click(screen.getByText('before'));
    await user.tab();
    const plot = screen.getByRole('group', { name: 'Sales' });
    expect(plot).toHaveFocus();
    expect(plot).toHaveAttribute('aria-roledescription', 'chart');

    await user.keyboard('{ArrowRight}');
    expect(live(container)).toHaveTextContent('Jan, Revenue: 12,000');
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('Jan');
    expect(screen.getByTestId('chart-focus-ring')).toBeInTheDocument();

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(live(container)).toHaveTextContent('Mar, Revenue: 24,000');
    await user.keyboard('{ArrowDown}');
    expect(live(container)).toHaveTextContent('Mar, Cost: 11,000');
    await user.keyboard('{End}');
    expect(live(container)).toHaveTextContent('Jun, Cost: 12,500');
    await user.keyboard('{Home}');
    expect(live(container)).toHaveTextContent('Jan, Cost: 9,000');
    await user.keyboard('{ArrowUp}');
    expect(live(container)).toHaveTextContent('Jan, Revenue: 12,000');

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument();
    expect(plot).toHaveFocus();

    // Next tab stop is the data-table toggle, then whatever follows the chart.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Show data table' })).toHaveFocus();
    await user.tab();
    expect(screen.getByText('after')).toHaveFocus();
  });

  it('skips missing values (gaps) and mirrors Left/Right in RTL', async () => {
    const user = userEvent.setup();
    const data = [
      { m: 'A', v: 1 },
      { m: 'B', v: null },
      { m: 'C', v: 3 },
    ];
    const { container } = render(<LineChart title="Gaps" dir="rtl" data={data} x="m" series={[{ key: 'v', label: 'V' }]} />);
    act(() => screen.getByRole('group', { name: 'Gaps' }).focus());
    await user.keyboard('{ArrowLeft}'); // first press selects the first point
    expect(live(container)).toHaveTextContent('A, V: 1');
    await user.keyboard('{ArrowLeft}'); // in RTL, Left moves forward
    expect(live(container)).toHaveTextContent('C, V: 3');
    await user.keyboard('{ArrowRight}');
    expect(live(container)).toHaveTextContent('A, V: 1');
  });

  it('shows the same tooltip on pointer hover', () => {
    render(<BarChart title="Hover" data={sales} x="month" series={[{ key: 'revenue', label: 'Revenue' }]} width={600} />);
    const svg = document.querySelector('.pl-chart__svg') as SVGSVGElement;
    // jsdom has no layout: the bounding rect is 0, so client coords map 1:1 to the viewBox.
    const firstBar = document.querySelector('.pl-chart__bar') as SVGRectElement;
    const bx = Number(firstBar.getAttribute('x')) + Number(firstBar.getAttribute('width')) / 2 + 48;
    const by = Number(firstBar.getAttribute('y')) + 16;
    fireEvent.mouseMove(svg, { clientX: bx, clientY: by });
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent(/Jan.*Revenue.*12,000/);
    fireEvent.mouseLeave(svg);
    expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument();
  });

  it('navigates horizontal bars with Up/Down', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BarChart title="H" orientation="horizontal" data={sales.slice(0, 3)} x="month" series={salesSeries} locale="en-US" />,
    );
    act(() => screen.getByRole('group', { name: 'H' }).focus());
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(live(container)).toHaveTextContent('Feb, Revenue: 18,000');
    await user.keyboard('{ArrowRight}');
    expect(live(container)).toHaveTextContent('Feb, Cost: 9,500');
  });
});

describe('data table fallback', () => {
  it('toggles a table that is always available to screen readers', async () => {
    const user = userEvent.setup();
    render(<BarChart title="Sales" data={sales} x="month" series={salesSeries} locale="en-US" />);
    const toggle = screen.getByRole('button', { name: 'Show data table' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const table = screen.getByRole('table', { name: 'Sales' });
    const wrap = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(wrap).toContainElement(table);
    expect(wrap).toHaveClass('pl-sr-only');

    const headers = within(table).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['Category', 'Revenue', 'Cost']);
    const firstRow = within(table).getAllByRole('row')[1];
    expect(within(firstRow).getByRole('rowheader')).toHaveTextContent('Jan');
    expect(within(firstRow).getAllByRole('cell').map((c) => c.textContent)).toEqual(['12,000', '9,000']);

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveTextContent('Hide data table');
    expect(wrap).not.toHaveClass('pl-sr-only');
  });

  it('omits the table with table="none" and formats numbers with the locale', () => {
    const { unmount } = render(<BarChart title="None" table="none" data={sales} x="month" series={salesSeries} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /data table/ })).not.toBeInTheDocument();
    unmount();
    render(<BarChart title="Arabic" data={sales} x="month" series={salesSeries} locale="ar-EG" />);
    const firstRow = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(within(firstRow).getAllByRole('cell')[0].textContent).toMatch(/[٠-٩]/);
  });

  it('marks missing values in the table', () => {
    render(<LineChart title="Gaps" data={[{ m: 'A', v: 1 }, { m: 'B', v: null }]} x="m" series={[{ key: 'v', label: 'V' }]} />);
    expect(within(screen.getByRole('table')).getByText('No data')).toBeInTheDocument();
  });
});

describe('non-color cues', () => {
  it('turns on patterns automatically in the high-contrast theme', () => {
    const { container } = render(
      <div data-theme="hc">
        <BarChart title="HC" data={sales} x="month" series={salesSeries} />
        <LineChart title="HC lines" data={sales} x="month" series={salesSeries} markers={false} />
      </div>,
    );
    const figures = container.querySelectorAll('figure');
    expect(figures[0]).toHaveClass('pl-chart--patterns');
    // Second series bars carry a pattern overlay referencing a defined <pattern>.
    const overlay = figures[0].querySelector('.pl-chart-s1 .pl-chart__pattern') as SVGRectElement;
    const id = overlay.getAttribute('fill')!.match(/url\(#(.+)\)/)![1];
    expect(document.getElementById(id)?.tagName.toLowerCase()).toBe('pattern');
    // Legend swatches repeat the pattern.
    expect(figures[0].querySelector('.pl-chart-legend .pl-chart-s1 .pl-chart__pattern')).not.toBeNull();
  });

  it('keeps patterns off by default outside high contrast, and on with patterns', () => {
    const { container, rerender } = render(<BarChart title="Plain" data={sales} x="month" series={salesSeries} />);
    expect(container.querySelector('figure')).not.toHaveClass('pl-chart--patterns');
    rerender(<BarChart title="Plain" data={sales} x="month" series={salesSeries} patterns />);
    expect(container.querySelector('figure')).toHaveClass('pl-chart--patterns');
    rerender(
      <div data-theme="hc">
        <BarChart title="Plain" data={sales} x="month" series={salesSeries} patterns={false} />
      </div>,
    );
    expect(container.querySelector('figure')).toHaveClass('pl-chart--no-patterns');
  });

  it('gives each line series its own marker shape', () => {
    const { container } = render(<LineChart title="Shapes" data={sales} x="month" series={salesSeries} />);
    const a = container.querySelector('.pl-chart-s0 .pl-chart__marker')!.getAttribute('data-shape');
    const b = container.querySelector('.pl-chart-s1 .pl-chart__marker')!.getAttribute('data-shape');
    expect(a).toBe('circle');
    expect(b).toBe('square');
  });
});

describe('ready-made charts', () => {
  it('stacks negative values downward from zero', () => {
    const data = [
      { q: 'Q1', a: 10, b: -4 },
      { q: 'Q2', a: 6, b: -8 },
    ];
    const { container } = render(
      <BarChart title="Stacked" stacked data={data} x="q" series={[{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]} height={300} />,
    );
    const a = container.querySelector('.pl-chart__plot .pl-chart-s0 .pl-chart__bar')!;
    const b = container.querySelector('.pl-chart__plot .pl-chart-s1 .pl-chart__bar')!;
    // B (negative) starts where A's baseline is (zero) and extends down.
    const aBottom = Number(a.getAttribute('y')) + Number(a.getAttribute('height'));
    expect(Number(b.getAttribute('y'))).toBeCloseTo(aBottom, 1);
    expect(container.querySelector('.pl-chart-ref--baseline')).not.toBeNull();
  });

  it('mirrors horizontal layout in RTL', () => {
    const { container } = render(<BarChart title="RTL" dir="rtl" data={sales} x="month" series={[{ key: 'revenue', label: 'Revenue' }]} />);
    const bars = container.querySelectorAll('.pl-chart__bar');
    expect(Number(bars[0].getAttribute('x'))).toBeGreaterThan(Number(bars[5].getAttribute('x')));
    expect(container.querySelector('figure')).toHaveAttribute('dir', 'rtl');
  });

  it('groups small pie slices into Other and describes shares', () => {
    expect(
      groupSlices(
        [
          { label: 'A', value: 60 },
          { label: 'B', value: 36 },
          { label: 'C', value: 2 },
          { label: 'D', value: 2 },
        ],
        { threshold: 0.05 },
      ).map((s) => [s.label, s.value]),
    ).toEqual([
      ['A', 60],
      ['B', 36],
      ['Other', 4],
    ]);
    const data = [
      { name: 'Chrome', share: 62 },
      { name: 'Safari', share: 20 },
      { name: 'Edge', share: 14 },
      { name: 'Opera', share: 2 },
      { name: 'Lynx', share: 2 },
    ];
    render(<DonutChart title="Browsers" data={data} label="name" value="share" otherThreshold={0.05} locale="en-US" />);
    const table = screen.getByRole('table');
    expect(within(table).getByText('Other (Opera, Lynx)')).toBeInTheDocument();
    expect(screen.getByText(/Donut chart with 4 slices, total 100\. Chrome 62% \(62\)/)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Legend' }).children).toHaveLength(4);
  });

  it('navigates pie slices', async () => {
    const user = userEvent.setup();
    const { container } = render(<PieChart title="Pie" data={[{ k: 'A', v: 3 }, { k: 'B', v: 1 }]} label="k" value="v" locale="en-US" />);
    act(() => screen.getByRole('group', { name: 'Pie' }).focus());
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(live(container)).toHaveTextContent('B: 1 (25%)');
  });

  it('renders area, combo, radar, scatter and bubble charts', () => {
    const { container } = render(
      <>
        <AreaChart title="Area" data={sales} x="month" series={salesSeries} curve="monotone" />
        <ComboChart
          title="Combo"
          data={sales.map((s) => ({ ...s, margin: (s.revenue - s.cost) / s.revenue }))}
          x="month"
          series={[
            { key: 'revenue', label: 'Revenue', type: 'bar' },
            { key: 'margin', label: 'Margin', type: 'line', axis: 'secondary' },
          ]}
          secondaryFormat={{ style: 'percent' }}
          locale="en-US"
        />
        <RadarChart title="Radar" data={[{ k: 'Speed', a: 8 }, { k: 'Cost', a: 3 }, { k: 'Quality', a: 6 }]} x="k" series={[{ key: 'a', label: 'Team A' }]} />
        <ScatterChart title="Scatter" data={[{ h: 1, w: 2 }, { h: 2, w: 4 }, { h: 3, w: 6.5 }]} x="h" y="w" xLabel="Height" yLabel="Weight" />
        <BubbleChart title="Bubble" data={[{ a: 1, b: 2, c: 10, g: 'X' }, { a: 2, b: 1, c: 40, g: 'Y' }]} x="a" y="b" size="c" group="g" />
      </>,
    );
    expect(container.querySelectorAll('.pl-chart__area--gradient').length).toBe(2);
    expect(container.querySelectorAll('.pl-chart-axis--end').length).toBe(1);
    expect(screen.getByText(/Radar chart with 3 axes\. Team A: highest Speed \(8\), lowest Cost \(3\)\./)).toBeInTheDocument();
    expect(screen.getByText(/strong positive correlation/)).toBeInTheDocument();
    expect(within(screen.getAllByRole('table')[1]).getAllByRole('row')[1]).toHaveTextContent(/Jan.*12,000.*25%/);
    const bubbles = container.querySelectorAll('.pl-chart__series--bubble .pl-chart__point');
    expect(bubbles).toHaveLength(2);
  });

  it('summarizes a sparkline accessibly', () => {
    render(<Sparkline data={[100, 104, 103, 108, 112]} label="Sign-ups" period="7 days" locale="en-US" />);
    expect(screen.getByRole('img', { name: 'Sign-ups: Up 12% over 7 days' })).toBeInTheDocument();
  });

  it('exposes gauges as meters with a target summary', () => {
    render(
      <>
        <GaugeChart title="CPU" value={72} target={80} thresholds={[{ upTo: 80, tone: 'success' }, { upTo: 100, tone: 'danger' }]} locale="en-US" />
        <RadialProgress title="Upload" value={40} locale="en-US" />
      </>,
    );
    const meter = screen.getByRole('meter', { name: 'CPU' });
    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(meter).toHaveAttribute('aria-valuetext', '72 of 100 (72%)');
    expect(screen.getByText(/Target 80: 8 below target/)).toBeInTheDocument();
    expect(document.querySelector('.pl-chart-gauge__value--success')).not.toBeNull();
    expect(screen.getByRole('meter', { name: 'Upload' })).toHaveAttribute('aria-valuenow', '40');
  });

  it('renders a navigable calendar heatmap', async () => {
    const user = userEvent.setup();
    const entries = Array.from({ length: 14 }, (_, i) => ({ date: new Date(2024, 0, 7 + i), value: i % 5 }));
    const cal = calendarHeatmapData(entries, { locale: 'en-US' });
    expect(cal.yCategories).toHaveLength(7);
    expect(cal.xCategories).toHaveLength(2);
    const { container } = render(
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
      />,
    );
    expect(container.querySelectorAll('.pl-chart__cell')).toHaveLength(14 + 5); // 14 cells + 5 legend swatches
    act(() => screen.getByRole('group', { name: 'Activity' }).focus());
    await user.keyboard('{ArrowRight}');
    expect(live(container)).toHaveTextContent('Jan 7, 2024: 0');
    await user.keyboard('{ArrowDown}');
    expect(live(container)).toHaveTextContent('Jan 8, 2024: 1');
  });
});

describe('custom charts from primitives', () => {
  it('renders the WaterfallChart example and navigates it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <WaterfallChart
        title="Profit bridge"
        locale="en-US"
        data={[
          { label: 'Start', value: 100, total: true },
          { label: 'Sales', value: 40 },
          { label: 'Costs', value: -25 },
          { label: 'End', value: 115, total: true },
        ]}
      />,
    );
    expect(container.querySelectorAll('.pl-chart__bar')).toHaveLength(4 + 3); // bars + legend swatches
    expect(screen.getByText(/ending at 115\. Largest increase: Sales \(\+40\)\. Largest decrease: Costs \(-25\)\./)).toBeInTheDocument();
    act(() => screen.getByRole('group', { name: 'Profit bridge' }).focus());
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(live(container)).toHaveTextContent('Costs, Decrease: -25 → 115');
  });

  it('composes a bespoke chart with ChartContainer + primitives', async () => {
    const user = userEvent.setup();
    const days = ['Mon', 'Tue', 'Wed'];
    const values = [3, 7, 5];
    const { container } = render(
      <ChartContainer
        title="Visitors"
        summary="Visitors peak on Tuesday at 7."
        legend={<Legend items={[{ label: 'Visitors', seriesIndex: 0 }]} />}
        tableData={{ columns: ['Day', 'Visitors'], rows: days.map((d, i) => ({ header: d, cells: [String(values[i])] })) }}
      >
        {(frame) => {
          const x = bandScale(days, [0, frame.innerWidth]);
          const y = linearScale([0, 7], [frame.innerHeight, 0], { nice: true });
          return (
            <ChartPlot
              points={[days.map((d, i) => ({ x: x.center(d), y: y(values[i]), title: d, series: 'Visitors', value: String(values[i]) }))]}
            >
              <Gridlines scale={y} orientation="horizontal" />
              <BarSeries bars={days.map((d, i) => ({ x: x(d), y: y(values[i]), width: x.bandwidth, height: y(0) - y(values[i]) }))} />
              <ReferenceLine y={y(5)} label="Goal" tone="success" />
              <Annotation x={x.center('Tue')} y={y(7)} label="Peak" />
              <Axis scale={x} position="bottom" />
              <Axis scale={y} position="start" />
            </ChartPlot>
          );
        }}
      </ChartContainer>,
    );
    expect(screen.getByRole('figure', { name: 'Visitors' })).toBeInTheDocument();
    expect(container.querySelectorAll('.pl-chart-axis__tick text')[0]).toHaveTextContent('Mon');
    expect(screen.getByText('Goal')).toBeInTheDocument();
    act(() => screen.getByRole('group', { name: 'Visitors' }).focus());
    await user.keyboard('{End}');
    expect(live(container)).toHaveTextContent('Wed, Visitors: 5');
  });

  it('renders a static (non-navigable) plot as an image', () => {
    render(
      <ChartContainer title="Static" summary="Nothing to navigate.">
        <ChartPlot>
          <ReferenceLine y={10} />
        </ChartPlot>
      </ChartContainer>,
    );
    const img = screen.getByRole('img', { name: 'Static' });
    expect(img).not.toHaveAttribute('tabindex');
    expect(img).toHaveAccessibleDescription('Nothing to navigate.');
  });
});

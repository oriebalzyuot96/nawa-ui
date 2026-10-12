/**
 * Orca UI Charts — dependency-free, accessible SVG charts.
 *
 * Two layers:
 *  1. Ready-made charts: BarChart, LineChart, AreaChart, PieChart, DonutChart, ScatterChart,
 *     BubbleChart, RadarChart, Sparkline, GaugeChart, RadialProgress, Heatmap, ComboChart, WaterfallChart.
 *  2. Primitives for custom charts: ChartContainer, ChartPlot, scales (linearScale, bandScale, timeScale),
 *     Axis, Gridlines, BarSeries, LineSeries, AreaSeries, PointSeries, ArcSeries, Legend, ChartTooltip,
 *     ReferenceLine, Annotation, plus helpers (describeSeries, trendSummary, markerPath, arcPath, linePath …).
 *
 * Every chart is a <figure> with a <figcaption>, an auto-generated text summary, a keyboard-navigable
 * plot (one tab stop; arrows / Home / End / Escape) whose focused point is announced in an aria-live
 * region, and an accessible data-table fallback ("Show data table").
 *
 * ## Composing a custom chart
 *
 * `ChartContainer` owns the accessible shell (caption, summary, legend, live region, data table) and
 * measures its width (ResizeObserver, with a `width` fallback). Its child is a render function that
 * receives the `ChartFrame` (inner width/height, margins, rtl, locale). Inside, build scales for the
 * frame, compute pixel geometry, and render primitives inside a `ChartPlot`. Pass `points` (one array
 * per series, `null` for gaps) to `ChartPlot` to get keyboard navigation, tooltips and announcements.
 *
 * ```tsx
 * <ChartContainer title="Visitors" summary="Visitors peak on Friday at 940." tableData={table}
 *   legend={<Legend items={[{ label: 'Visitors', seriesIndex: 0 }]} />}>
 *   {(frame) => {
 *     const x = bandScale(days, frame.rtl ? [frame.innerWidth, 0] : [0, frame.innerWidth]);
 *     const y = linearScale([0, max], [frame.innerHeight, 0], { nice: true });
 *     const bars = days.map((d, i) => ({ x: x(d), y: y(values[i]), width: x.bandwidth, height: y(0) - y(values[i]) }));
 *     const points = [days.map((d, i) => ({ x: x.center(d), y: y(values[i]), title: d, series: 'Visitors', value: String(values[i]) }))];
 *     return (
 *       <ChartPlot points={points}>
 *         <Gridlines scale={y} orientation="horizontal" />
 *         <BarSeries bars={bars} seriesIndex={0} />
 *         <Axis scale={x} position="bottom" />
 *         <Axis scale={y} position="start" />
 *       </ChartPlot>
 *     );
 *   }}
 * </ChartContainer>
 * ```
 *
 * `WaterfallChart` at the bottom of this file is built only from these public primitives.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { cx } from '../utils';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* =========================================================================================
 * Formatting
 * ========================================================================================= */

export type ValueFormat = ((value: number) => string) | Intl.NumberFormatOptions;

function safeNumberFormat(locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat(undefined, options);
  }
}

function safeDateFormat(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, options);
  } catch {
    return new Intl.DateTimeFormat(undefined, options);
  }
}

/** Number formatter honoring `locale` (e.g. 'ar-EG' renders Arabic-Indic digits). */
export function numberFormatter(locale?: string, format?: ValueFormat): (value: number) => string {
  if (typeof format === 'function') return format;
  const nf = safeNumberFormat(locale, format ?? { maximumFractionDigits: 2 });
  return (value) => nf.format(value);
}

/** Compact formatter ("12K", "3.4M") used for axis ticks and summaries. */
export function compactFormatter(locale?: string): (value: number) => string {
  const nf = safeNumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  return (value) => nf.format(value);
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const r2 = (n: number) => Math.round(n * 100) / 100;

/* =========================================================================================
 * Scales
 * ========================================================================================= */

/** A "nice" step (1, 2, 5 × 10ⁿ) that splits [start, stop] into about `count` intervals. */
export function tickStep(start: number, stop: number, count = 5): number {
  const span = Math.abs(stop - start);
  if (!(span > 0) || !Number.isFinite(span)) return 1;
  const raw = span / Math.max(1, count);
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const err = raw / power;
  const factor = err >= 7.07 ? 10 : err >= 3.16 ? 5 : err >= 1.41 ? 2 : 1;
  return factor * power;
}

const roundP = (v: number) => Number(v.toPrecision(12));

/** Extends [min, max] outward to round tick values. */
export function niceDomain(min: number, max: number, count = 5): [number, number] {
  if (!isNum(min) || !isNum(max)) return [0, 1];
  let lo0 = Math.min(min, max);
  let hi0 = Math.max(min, max);
  if (lo0 === hi0) {
    if (lo0 === 0) return [0, 1];
    const pad = Math.abs(lo0) * 0.5;
    lo0 -= pad;
    hi0 += pad;
  }
  let lo = lo0;
  let hi = hi0;
  let prev = NaN;
  for (let k = 0; k < 10; k++) {
    const step = tickStep(lo, hi, count);
    if (step === prev) break;
    prev = step;
    lo = Math.floor(lo0 / step) * step;
    hi = Math.ceil(hi0 / step) * step;
  }
  return [roundP(lo), roundP(hi)];
}

/** Round tick values inside [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (lo === hi) return [lo];
  const step = tickStep(lo, hi, count);
  const start = Math.ceil(lo / step - 1e-9);
  const stop = Math.floor(hi / step + 1e-9);
  const out: number[] = [];
  for (let i = start; i <= stop; i++) out.push(roundP(i * step));
  return out;
}

export interface LinearScale {
  (value: number): number;
  readonly kind: 'linear';
  readonly domain: [number, number];
  readonly range: [number, number];
  ticks: (count?: number) => number[];
  invert: (px: number) => number;
}

export interface LinearScaleOptions {
  /** Round the domain to nice ticks; a number sets the target tick count (default 5). */
  nice?: boolean | number;
  clamp?: boolean;
}

/** Continuous linear scale. `range` may be reversed (e.g. [height, 0] or RTL [width, 0]). */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
  options: LinearScaleOptions = {},
): LinearScale {
  let [d0, d1] = domain;
  if (!isNum(d0) || !isNum(d1)) [d0, d1] = [0, 1];
  const count = typeof options.nice === 'number' ? options.nice : 5;
  if (options.nice) [d0, d1] = niceDomain(d0, d1, count);
  if (d0 === d1) d1 = d0 + 1;
  const [r0, r1] = range;
  const k = (r1 - r0) / (d1 - d0);
  const lo = Math.min(r0, r1);
  const hi = Math.max(r0, r1);
  const fn = (value: number) => {
    const px = r0 + (value - d0) * k;
    return options.clamp ? Math.min(hi, Math.max(lo, px)) : px;
  };
  const dom: [number, number] = [d0, d1];
  return Object.assign(fn, {
    kind: 'linear' as const,
    domain: dom,
    range: [r0, r1] as [number, number],
    ticks: (n = count) => niceTicks(dom[0], dom[1], n),
    invert: (px: number) => d0 + (px - r0) / k,
  });
}

export interface BandScale {
  /** Start (physical left/top) of the band for `value`; NaN if unknown. */
  (value: string): number;
  readonly kind: 'band';
  readonly domain: readonly string[];
  readonly range: [number, number];
  readonly bandwidth: number;
  readonly step: number;
  center: (value: string) => number;
}

export interface BandScaleOptions {
  paddingInner?: number;
  paddingOuter?: number;
}

/** Categorical band scale. A reversed range ([width, 0]) mirrors the order for RTL. */
export function bandScale(
  domain: readonly string[],
  range: readonly [number, number],
  { paddingInner = 0.2, paddingOuter = 0.1 }: BandScaleOptions = {},
): BandScale {
  const n = domain.length;
  const [r0, r1] = range;
  const reverse = r1 < r0;
  const lo = Math.min(r0, r1);
  const hi = Math.max(r0, r1);
  const step = (hi - lo) / Math.max(1, n - paddingInner + paddingOuter * 2);
  const bandwidth = step * (1 - paddingInner);
  const start = lo + step * paddingOuter;
  const index = new Map<string, number>();
  domain.forEach((d, i) => {
    if (!index.has(d)) index.set(d, i);
  });
  const fn = (value: string) => {
    const i = index.get(value);
    if (i === undefined) return NaN;
    const p = start + i * step;
    return reverse ? lo + hi - p - bandwidth : p;
  };
  return Object.assign(fn, {
    kind: 'band' as const,
    domain: [...domain],
    range: [r0, r1] as [number, number],
    bandwidth,
    step,
    center: (value: string) => fn(value) + bandwidth / 2,
  });
}

type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
const SEC = 1e3;
const MIN = 6e4;
const HOUR = 36e5;
const DAY = 864e5;
const TIME_INTERVALS: Array<[TimeUnit, number, number]> = [
  ['second', 1, SEC], ['second', 5, 5 * SEC], ['second', 15, 15 * SEC], ['second', 30, 30 * SEC],
  ['minute', 1, MIN], ['minute', 5, 5 * MIN], ['minute', 15, 15 * MIN], ['minute', 30, 30 * MIN],
  ['hour', 1, HOUR], ['hour', 3, 3 * HOUR], ['hour', 6, 6 * HOUR], ['hour', 12, 12 * HOUR],
  ['day', 1, DAY], ['day', 2, 2 * DAY], ['day', 7, 7 * DAY],
  ['month', 1, 30 * DAY], ['month', 3, 91 * DAY], ['month', 6, 182 * DAY],
  ['year', 1, 365 * DAY],
];

function pickInterval(span: number, count: number): [TimeUnit, number] {
  const target = span / Math.max(1, count);
  if (target > 365 * DAY) return ['year', Math.max(1, tickStep(0, span / (365 * DAY), count))];
  let best = TIME_INTERVALS[0];
  let bestErr = Infinity;
  for (const iv of TIME_INTERVALS) {
    const err = Math.abs(Math.log(iv[2] / target));
    if (err < bestErr) {
      bestErr = err;
      best = iv;
    }
  }
  return [best[0], best[1]];
}

function floorDate(t: number, unit: TimeUnit, step: number): Date {
  const d = new Date(t);
  switch (unit) {
    case 'second':
      d.setMilliseconds(0);
      d.setSeconds(Math.floor(d.getSeconds() / step) * step);
      break;
    case 'minute':
      d.setSeconds(0, 0);
      d.setMinutes(Math.floor(d.getMinutes() / step) * step);
      break;
    case 'hour':
      d.setMinutes(0, 0, 0);
      d.setHours(Math.floor(d.getHours() / step) * step);
      break;
    case 'day':
      d.setHours(0, 0, 0, 0);
      break;
    case 'month':
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      d.setMonth(Math.floor(d.getMonth() / step) * step);
      break;
    case 'year':
      d.setHours(0, 0, 0, 0);
      d.setMonth(0, 1);
      d.setFullYear(Math.floor(d.getFullYear() / step) * step);
      break;
  }
  return d;
}

function addUnits(date: Date, unit: TimeUnit, step: number): Date {
  const d = new Date(date.getTime());
  switch (unit) {
    case 'second': d.setSeconds(d.getSeconds() + step); break;
    case 'minute': d.setMinutes(d.getMinutes() + step); break;
    case 'hour': d.setHours(d.getHours() + step); break;
    case 'day': d.setDate(d.getDate() + step); break;
    case 'month': d.setMonth(d.getMonth() + step); break;
    case 'year': d.setFullYear(d.getFullYear() + step); break;
  }
  return d;
}

const TIME_FORMATS: Record<TimeUnit, Intl.DateTimeFormatOptions> = {
  second: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
  minute: { hour: 'numeric', minute: '2-digit' },
  hour: { hour: 'numeric', minute: '2-digit' },
  day: { month: 'short', day: 'numeric' },
  month: { month: 'short', year: 'numeric' },
  year: { year: 'numeric' },
};

export interface TimeScale {
  (value: Date | number): number;
  readonly kind: 'time';
  readonly domain: [Date, Date];
  readonly range: [number, number];
  /** Calendar-aligned ticks (whole hours, days, months, years …). */
  ticks: (count?: number) => Date[];
  /** Locale-aware label formatter matched to the tick interval. */
  tickFormat: (locale?: string, count?: number) => (date: Date) => string;
  invert: (px: number) => Date;
}

/** Time scale with calendar-aware "nice" ticks. */
export function timeScale(
  domain: readonly [Date | number, Date | number],
  range: readonly [number, number],
  options: { nice?: boolean } = {},
): TimeScale {
  let t0 = +domain[0];
  let t1 = +domain[1];
  if (t0 > t1) [t0, t1] = [t1, t0];
  if (t0 === t1) t1 = t0 + DAY;
  if (options.nice) {
    const [unit, step] = pickInterval(t1 - t0, 5);
    t0 = floorDate(t0, unit, step).getTime();
    const end = floorDate(t1, unit, step);
    t1 = (end.getTime() < t1 ? addUnits(end, unit, step) : end).getTime();
  }
  const lin = linearScale([t0, t1], range);
  const ticks = (count = 5): Date[] => {
    const [unit, step] = pickInterval(t1 - t0, count);
    const out: Date[] = [];
    let d = floorDate(t0, unit, step);
    if (d.getTime() < t0) d = addUnits(d, unit, step);
    for (let guard = 0; d.getTime() <= t1 && guard < 1000; guard++) {
      out.push(d);
      d = addUnits(d, unit, step);
    }
    return out;
  };
  return Object.assign((value: Date | number) => lin(+value), {
    kind: 'time' as const,
    domain: [new Date(t0), new Date(t1)] as [Date, Date],
    range: [range[0], range[1]] as [number, number],
    ticks,
    tickFormat: (locale?: string, count = 5) => {
      const [unit] = pickInterval(t1 - t0, count);
      const df = safeDateFormat(locale, TIME_FORMATS[unit]);
      return (date: Date) => df.format(date);
    },
    invert: (px: number) => new Date(lin.invert(px)),
  });
}

export type ChartScale = LinearScale | BandScale | TimeScale;

/* =========================================================================================
 * Text summaries
 * ========================================================================================= */

export interface SeriesSummaryInput {
  label: string;
  values: ReadonlyArray<number | null | undefined>;
  categories: ReadonlyArray<string>;
}

/**
 * One sentence describing a series: direction, endpoints, peak and low.
 * e.g. "Revenue rises from 12K in Jan to 30K in Jun, peak 31K in May."
 */
export function describeSeries(input: SeriesSummaryInput, format: (v: number) => string = String): string {
  const pts = input.values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => isNum(p.v));
  const cat = (i: number) => input.categories[i] ?? String(i + 1);
  if (pts.length === 0) return `${input.label}: no data.`;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (pts.length === 1) return `${input.label}: ${format(first.v)} in ${cat(first.i)}.`;
  let max = first;
  let min = first;
  for (const p of pts) {
    if (p.v > max.v) max = p;
    if (p.v < min.v) min = p;
  }
  const range = max.v - min.v;
  const scale = Math.max(Math.abs(max.v), Math.abs(min.v), 1e-12);
  if (range <= scale * 0.02) {
    return `${input.label} stays flat at about ${format((max.v + min.v) / 2)} from ${cat(first.i)} to ${cat(last.i)}.`;
  }
  const delta = last.v - first.v;
  let sentence: string;
  if (Math.abs(delta) <= range * 0.05) {
    sentence = `${input.label} starts at ${format(first.v)} in ${cat(first.i)} and ends at ${format(last.v)} in ${cat(last.i)}`;
  } else {
    sentence = `${input.label} ${delta > 0 ? 'rises' : 'falls'} from ${format(first.v)} in ${cat(first.i)} to ${format(last.v)} in ${cat(last.i)}`;
  }
  const extras: string[] = [];
  if (max.i !== first.i && max.i !== last.i) extras.push(`peak ${format(max.v)} in ${cat(max.i)}`);
  if (min.i !== first.i && min.i !== last.i) extras.push(`low ${format(min.v)} in ${cat(min.i)}`);
  return `${sentence}${extras.length ? `, ${extras.join(', ')}` : ''}.`;
}

/** Summary for a multi-series chart: a lead sentence plus one sentence per series. */
export function summarizeChart(
  kind: string,
  categories: ReadonlyArray<string>,
  series: ReadonlyArray<{ label: string; values: ReadonlyArray<number | null | undefined> }>,
  format: (v: number) => string = String,
): string {
  const lead = `${kind} with ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}${
    series.length > 1 ? ` and ${series.length} series: ${series.map((s) => s.label).join(', ')}` : ''
  }.`;
  return [lead, ...series.map((s) => describeSeries({ label: s.label, values: s.values, categories }, format))].join(' ');
}

/**
 * Short trend phrase for sparklines: "Up 12% over 7 days", "Down 3% over 4 weeks", "Flat over 7 days".
 * Falls back to an absolute change when the first value is 0.
 */
export function trendSummary(
  values: ReadonlyArray<number | null | undefined>,
  options: { period?: string; locale?: string; format?: ValueFormat } = {},
): string {
  const nums = values.filter(isNum);
  const period = options.period ?? `${values.length} points`;
  if (nums.length < 2) return nums.length ? `${numberFormatter(options.locale, options.format)(nums[0])}, no trend` : 'No data';
  const first = nums[0];
  const last = nums[nums.length - 1];
  const delta = last - first;
  if (delta === 0) return `Flat over ${period}`;
  const dir = delta > 0 ? 'Up' : 'Down';
  if (first === 0) return `${dir} ${numberFormatter(options.locale, options.format)(Math.abs(delta))} over ${period}`;
  const pct = safeNumberFormat(options.locale, { style: 'percent', maximumFractionDigits: 0 }).format(Math.abs(delta / first));
  return `${dir} ${pct} over ${period}`;
}

/* =========================================================================================
 * Geometry helpers
 * ========================================================================================= */

export interface XY {
  x: number;
  y: number;
}

export type CurveType = 'linear' | 'monotone' | 'step';

function splitSegments<P>(points: ReadonlyArray<P | null | undefined>): P[][] {
  const out: P[][] = [];
  let cur: P[] = [];
  for (const p of points) {
    if (p == null) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push(p);
  }
  if (cur.length) out.push(cur);
  return out;
}

function segmentPath(seg: ReadonlyArray<XY>, curve: CurveType, cmd: 'M' | 'L'): string {
  if (!seg.length) return '';
  let d = `${cmd}${r2(seg[0].x)},${r2(seg[0].y)}`;
  const n = seg.length;
  if (curve === 'step') {
    for (let k = 1; k < n; k++) d += `L${r2(seg[k].x)},${r2(seg[k - 1].y)}L${r2(seg[k].x)},${r2(seg[k].y)}`;
    return d;
  }
  if (curve === 'linear' || n < 3) {
    for (let k = 1; k < n; k++) d += `L${r2(seg[k].x)},${r2(seg[k].y)}`;
    return d;
  }
  // Monotone cubic interpolation (Fritsch–Carlson): smooth, never overshoots the data.
  const h: number[] = [];
  const m: number[] = [];
  for (let k = 0; k < n - 1; k++) {
    const ah = Math.abs(seg[k + 1].x - seg[k].x) || 1e-9;
    h.push(ah);
    m.push((seg[k + 1].y - seg[k].y) / ah);
  }
  const t: number[] = new Array<number>(n).fill(0);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let k = 1; k < n - 1; k++) {
    const a = m[k - 1];
    const b = m[k];
    t[k] = a * b <= 0 ? 0 : (3 * (h[k - 1] + h[k])) / ((2 * h[k] + h[k - 1]) / a + (h[k] + 2 * h[k - 1]) / b);
  }
  for (let k = 0; k < n - 1; k++) {
    const p = seg[k];
    const q = seg[k + 1];
    const dx = q.x - p.x;
    const third = h[k] / 3;
    d += `C${r2(p.x + dx / 3)},${r2(p.y + t[k] * third)},${r2(q.x - dx / 3)},${r2(q.y - t[k + 1] * third)},${r2(q.x)},${r2(q.y)}`;
  }
  return d;
}

/** SVG path for a line; `null` entries create gaps. */
export function linePath(points: ReadonlyArray<XY | null | undefined>, curve: CurveType = 'linear'): string {
  return splitSegments(points)
    .map((seg) => segmentPath(seg, curve, 'M'))
    .join('');
}

export interface AreaPoint {
  x: number;
  /** Baseline (bottom) y. */
  y0: number;
  /** Top y. */
  y1: number;
}

/** SVG path for an area between y0 and y1; `null` entries create gaps. */
export function areaPath(points: ReadonlyArray<AreaPoint | null | undefined>, curve: CurveType = 'linear'): string {
  return splitSegments(points)
    .map((seg) => {
      const top = seg.map((p) => ({ x: p.x, y: p.y1 }));
      const bottom = seg.map((p) => ({ x: p.x, y: p.y0 })).reverse();
      return `${segmentPath(top, curve, 'M')}${segmentPath(bottom, curve, 'L')}Z`;
    })
    .join('');
}

/** Point on a circle; angle in radians, clockwise from 12 o'clock. */
export function polar(cx: number, cy: number, r: number, angle: number): XY {
  return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) };
}

/** Annular sector path. Angles in radians, clockwise from 12 o'clock; order does not matter. */
export function arcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const a0 = Math.min(startAngle, endAngle);
  const a1 = Math.max(startAngle, endAngle);
  const R = outerRadius;
  const r = Math.max(0, innerRadius);
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    let d = `M${r2(cx)},${r2(cy - R)}A${r2(R)},${r2(R)} 0 1 1 ${r2(cx)},${r2(cy + R)}A${r2(R)},${r2(R)} 0 1 1 ${r2(cx)},${r2(cy - R)}Z`;
    if (r > 0) d += `M${r2(cx)},${r2(cy - r)}A${r2(r)},${r2(r)} 0 1 0 ${r2(cx)},${r2(cy + r)}A${r2(r)},${r2(r)} 0 1 0 ${r2(cx)},${r2(cy - r)}Z`;
    return d;
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p0 = polar(cx, cy, R, a0);
  const p1 = polar(cx, cy, R, a1);
  let d = `M${r2(p0.x)},${r2(p0.y)}A${r2(R)},${r2(R)} 0 ${large} 1 ${r2(p1.x)},${r2(p1.y)}`;
  if (r > 0) {
    const p2 = polar(cx, cy, r, a1);
    const p3 = polar(cx, cy, r, a0);
    d += `L${r2(p2.x)},${r2(p2.y)}A${r2(r)},${r2(r)} 0 ${large} 0 ${r2(p3.x)},${r2(p3.y)}Z`;
  } else d += `L${r2(cx)},${r2(cy)}Z`;
  return d;
}

export type MarkerShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'triangle-down' | 'cross' | 'plus' | 'hexagon';
/** Marker shapes cycle with the series index so series differ by shape, not only color. */
export const MARKER_SHAPES: readonly MarkerShape[] = ['circle', 'square', 'triangle', 'diamond', 'triangle-down', 'cross', 'plus', 'hexagon'];
const mod8 = (i: number) => ((i % 8) + 8) % 8;
export const markerShapeFor = (seriesIndex: number): MarkerShape => MARKER_SHAPES[mod8(seriesIndex)];

/** SVG path for a marker centered on (cx, cy) with radius ~r. */
export function markerPath(shape: MarkerShape, cx: number, cy: number, r: number): string {
  const poly = (pts: Array<[number, number]>) => `M${pts.map(([x, y]) => `${r2(cx + x)},${r2(cy + y)}`).join('L')}Z`;
  const w = r * 0.4;
  const plus: Array<[number, number]> = [
    [-w, -r], [w, -r], [w, -w], [r, -w], [r, w], [w, w], [w, r], [-w, r], [-w, w], [-r, w], [-r, -w], [-w, -w],
  ];
  switch (shape) {
    case 'circle':
      return `M${r2(cx - r)},${r2(cy)}a${r2(r)},${r2(r)} 0 1,0 ${r2(2 * r)},0a${r2(r)},${r2(r)} 0 1,0 ${r2(-2 * r)},0Z`;
    case 'square': {
      const s = r * 0.88;
      return poly([[-s, -s], [s, -s], [s, s], [-s, s]]);
    }
    case 'triangle':
      return poly([[0, -r * 1.15], [r * 1.05, r * 0.8], [-r * 1.05, r * 0.8]]);
    case 'triangle-down':
      return poly([[0, r * 1.15], [r * 1.05, -r * 0.8], [-r * 1.05, -r * 0.8]]);
    case 'diamond':
      return poly([[0, -r * 1.25], [r, 0], [0, r * 1.25], [-r, 0]]);
    case 'plus':
      return poly(plus);
    case 'cross': {
      const c = Math.SQRT1_2;
      return poly(plus.map(([x, y]) => [(x - y) * c * 1.1, (x + y) * c * 1.1]));
    }
    case 'hexagon':
      return poly(Array.from({ length: 6 }, (_, k) => [r * 1.05 * Math.sin((k * Math.PI) / 3), -r * 1.05 * Math.cos((k * Math.PI) / 3)] as [number, number]));
  }
}

/* =========================================================================================
 * Context, labels, patterns
 * ========================================================================================= */

export interface ChartMargin {
  top: number;
  bottom: number;
  /** Inline-start side (left in LTR, right in RTL). */
  start: number;
  /** Inline-end side. */
  end: number;
}

export interface ChartFrame {
  width: number;
  height: number;
  margin: ChartMargin;
  innerWidth: number;
  innerHeight: number;
  rtl: boolean;
  locale?: string;
}

export interface ChartLabels {
  showTable: string;
  hideTable: string;
  instructions: string;
  legend: string;
  noData: string;
  category: string;
  value: string;
  other: string;
  total: string;
  percent: string;
}

export const defaultChartLabels: ChartLabels = {
  showTable: 'Show data table',
  hideTable: 'Hide data table',
  instructions: 'Use the arrow keys to move between data points, Home and End to jump to the first or last point, Escape to hide the tooltip.',
  legend: 'Legend',
  noData: 'No data',
  category: 'Category',
  value: 'Value',
  other: 'Other',
  total: 'Total',
  percent: 'Share',
};

export interface ChartContextValue {
  frame: ChartFrame;
  uid: string;
  locale?: string;
  rtl: boolean;
  patterns: boolean;
  labels: ChartLabels;
  titleId: string;
  descriptionId?: string;
  summaryId?: string;
  announce: (message: string) => void;
}

const DEFAULT_FRAME: ChartFrame = {
  width: 600,
  height: 300,
  margin: { top: 16, bottom: 32, start: 48, end: 16 },
  innerWidth: 536,
  innerHeight: 252,
  rtl: false,
};

const ChartContext = createContext<ChartContextValue>({
  frame: DEFAULT_FRAME,
  uid: 'nwchart',
  rtl: false,
  patterns: false,
  labels: defaultChartLabels,
  titleId: '',
  announce: () => {},
});

/** Access the surrounding chart (frame, ids, locale, announce) from custom primitives. */
export function useChart(): ChartContextValue {
  return useContext(ChartContext);
}

/** CSS class that binds the palette color (and pattern/dash/marker) of series `i`. */
export const seriesClass = (i: number) => `oc-chart-s${mod8(i)}`;
const colorStyle = (color?: string): CSSProperties | undefined =>
  color ? ({ '--oc-chart-c': color } as CSSProperties) : undefined;
/** `url(#…)` of the fill pattern for series `i` (series 0 is solid, so returns null). */
export const patternFill = (uid: string, i: number) => (mod8(i) === 0 ? null : `url(#${uid}-pat-${mod8(i)})`);

const PATTERN_SHAPES: ReactNode[] = [
  null,
  <path d="M-2,2l4,-4M0,8l8,-8M6,10l4,-4" />,
  <>
    <circle cx="2" cy="2" r="1.3" />
    <circle cx="6" cy="6" r="1.3" />
  </>,
  <path d="M0,2h8M0,6h8" />,
  <path d="M-2,2l4,-4M0,8l8,-8M6,10l4,-4M-2,6l4,4M0,0l8,8M6,-2l4,4" />,
  <path d="M2,0v8M6,0v8" />,
  <path d="M-2,6l4,4M0,0l8,8M6,-2l4,4" />,
  <>
    <rect x="0" y="0" width="4" height="4" />
    <rect x="4" y="4" width="4" height="4" />
  </>,
];

/** Hatch/dot/stripe patterns (one per series) referenced by `url(#<uid>-pat-<n>)`. */
export function PatternDefs({ uid }: { uid: string }) {
  return (
    <svg className="oc-chart__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {PATTERN_SHAPES.map((shape, k) =>
          k === 0 ? null : (
            <pattern key={k} id={`${uid}-pat-${k}`} width="8" height="8" patternUnits="userSpaceOnUse">
              <g className="oc-chart__hatch">{shape}</g>
            </pattern>
          ),
        )}
      </defs>
    </svg>
  );
}

/* =========================================================================================
 * ChartContainer
 * ========================================================================================= */

export type ChartTableMode = 'toggle' | 'visible' | 'none';

export interface ChartTableData {
  /** Column headers; the first one labels the row-header column. */
  columns: ReactNode[];
  rows: Array<{ header: ReactNode; cells: ReactNode[] }>;
  caption?: ReactNode;
}

export interface ChartContainerProps {
  title: ReactNode;
  description?: ReactNode;
  /** Text alternative read by screen readers (auto-generated by ready-made charts). */
  summary?: ReactNode;
  /** Also show the summary visually below the caption. */
  showSummary?: boolean;
  legend?: ReactNode;
  legendPosition?: 'top' | 'bottom';
  /** 'toggle' (default): visually hidden table + "Show data table" button; 'visible'; 'none'. */
  table?: ChartTableMode;
  tableData?: ChartTableData;
  /** Fixed height in px (default 300, or derived from `aspectRatio`). */
  height?: number;
  aspectRatio?: number;
  /** Fallback width before/without ResizeObserver (default 600). */
  width?: number;
  margin?: Partial<ChartMargin>;
  locale?: string;
  /** Text direction; detected from the closest [dir] ancestor when omitted. */
  dir?: 'ltr' | 'rtl';
  /** Fill patterns + line dashes + always-on markers. 'auto' (default) turns them on in high contrast. */
  patterns?: boolean | 'auto';
  labels?: Partial<ChartLabels>;
  className?: string;
  footer?: ReactNode;
  children?: ReactNode | ((frame: ChartFrame) => ReactNode);
}

function matches(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Accessible, responsive shell: figure, caption, summary, legend, live region and data table. */
export function ChartContainer({
  title,
  description,
  summary,
  showSummary = false,
  legend,
  legendPosition = 'top',
  table = 'toggle',
  tableData,
  height: heightProp,
  aspectRatio,
  width: fallbackWidth = 600,
  margin,
  locale,
  dir,
  patterns = 'auto',
  labels: labelOverrides,
  className,
  footer,
  children,
}: ChartContainerProps) {
  const uid = `nwc${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const figureRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallbackWidth);
  const [autoRtl, setAutoRtl] = useState(false);
  const [autoHc, setAutoHc] = useState(false);
  const [tableOpen, setTableOpen] = useState(table === 'visible');
  const [message, setMessage] = useState('');

  useIsoLayoutEffect(() => {
    const el = figureRef.current;
    if (!el) return;
    setAutoRtl(el.parentElement?.closest('[dir]')?.getAttribute('dir') === 'rtl');
    const themed = el.closest('[data-theme]');
    setAutoHc(
      (themed ? themed.getAttribute('data-theme') === 'hc' : matches('(prefers-contrast: more)')) || matches('(forced-colors: active)'),
    );
  }, []);

  useIsoLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(Math.round(w));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const labels = useMemo(() => ({ ...defaultChartLabels, ...labelOverrides }), [labelOverrides]);
  const rtl = dir ? dir === 'rtl' : autoRtl;
  const patternsOn = patterns === true || (patterns === 'auto' && autoHc);
  const height = heightProp ?? (aspectRatio ? Math.max(140, Math.round(width / aspectRatio)) : 300);
  const m: ChartMargin = { ...DEFAULT_FRAME.margin, ...margin };
  const frame: ChartFrame = {
    width,
    height,
    margin: m,
    innerWidth: Math.max(1, width - m.start - m.end),
    innerHeight: Math.max(1, height - m.top - m.bottom),
    rtl,
    locale,
  };
  const announce = useCallback((msg: string) => setMessage((prev) => (prev === msg ? `${msg} ` : msg)), []);
  const titleId = `${uid}-title`;
  const descriptionId = description ? `${uid}-desc` : undefined;
  const summaryId = summary ? `${uid}-summary` : undefined;
  const tableId = `${uid}-table`;

  const ctx: ChartContextValue = { frame, uid, locale, rtl, patterns: patternsOn, labels, titleId, descriptionId, summaryId, announce };
  const legendNode = legend ? <div className="oc-chart__legend">{legend}</div> : null;

  return (
    <ChartContext.Provider value={ctx}>
      <figure
        ref={figureRef}
        className={cx('oc-chart', patternsOn && 'oc-chart--patterns', patterns === false && 'oc-chart--no-patterns', className)}
        aria-labelledby={titleId}
        dir={dir}
      >
        <PatternDefs uid={uid} />
        <figcaption className="oc-chart__caption">
          <span id={titleId} className="oc-chart__title">
            {title}
          </span>
          {description && (
            <span id={descriptionId} className="oc-chart__desc">
              {description}
            </span>
          )}
        </figcaption>
        {summary && (
          <p id={summaryId} className={showSummary ? 'oc-chart__summary' : 'oc-sr-only'}>
            {summary}
          </p>
        )}
        {legendPosition === 'top' && legendNode}
        <div ref={bodyRef} className="oc-chart__body">
          {typeof children === 'function' ? children(frame) : children}
        </div>
        {legendPosition === 'bottom' && legendNode}
        <div className="oc-sr-only" aria-live="polite" aria-atomic="true" data-chart-live="">
          {message}
        </div>
        {table !== 'none' && tableData && (
          <div className="oc-chart__data">
            {table === 'toggle' && (
              <button
                type="button"
                className="oc-btn oc-btn--ghost oc-btn--sm oc-chart__table-toggle"
                aria-expanded={tableOpen}
                aria-controls={tableId}
                onClick={() => setTableOpen((o) => !o)}
              >
                {tableOpen ? labels.hideTable : labels.showTable}
              </button>
            )}
            {/* Focusable, named region so keyboard users can scroll a wide table (axe scrollable-region-focusable). */}
            <div
              id={tableId}
              className={cx('oc-chart__table oc-table-wrap', !tableOpen && 'oc-sr-only')}
              role="region"
              aria-label={`${tableData.caption ?? title} data table`}
              tabIndex={tableOpen ? 0 : -1}
            >
              <table className="oc-table">
                <caption className="oc-chart__table-caption">{tableData.caption ?? title}</caption>
                <thead>
                  <tr>
                    {tableData.columns.map((c, i) => (
                      <th key={i} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, r) => (
                    <tr key={r}>
                      <th scope="row">{row.header}</th>
                      {row.cells.map((cell, c) => (
                        <td key={c} className="oc-table__align-end">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {footer && <div className="oc-chart__footer">{footer}</div>}
      </figure>
    </ChartContext.Provider>
  );
}

/* =========================================================================================
 * ChartPlot (keyboard navigation, hover, tooltip, focus ring)
 * ========================================================================================= */

/** A navigable data point in plot (inner) coordinates. */
export interface ChartPoint extends XY {
  /** Category / point name, e.g. "March". */
  title: string;
  /** Series name, e.g. "Revenue" (may be empty for single-series charts). */
  series: string;
  /** Formatted value, e.g. "24,000". */
  value: string;
  /** Full announcement; defaults to "title, series: value". */
  label?: string;
}

export const pointAnnouncement = (p: ChartPoint) =>
  p.label ?? (p.series ? `${p.title}, ${p.series}: ${p.value}` : `${p.title}: ${p.value}`);

export interface ChartPlotProps {
  /** One array per series; `null` marks a missing value. Enables keyboard navigation. */
  points?: ReadonlyArray<ReadonlyArray<ChartPoint | null | undefined>>;
  /** 'x' (default): Left/Right within a series, Up/Down between series. 'y' swaps them (horizontal bars). */
  navigation?: 'x' | 'y';
  /** Max distance (px) from the pointer to a point for hover. */
  hoverRadius?: number;
  className?: string;
  children?: ReactNode;
}

interface Cursor {
  s: number;
  i: number;
}

/** SVG surface of a chart: one tab stop, arrow-key navigation over `points`, hover tooltip. */
export function ChartPlot({ points, navigation = 'x', hoverRadius = 64, className, children }: ChartPlotProps) {
  const { frame, labels, titleId, descriptionId, summaryId, announce, uid } = useChart();
  const grid = points ?? [];
  const interactive = grid.some((row) => row.some(Boolean));
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<Cursor | null>(null);
  const [mode, setMode] = useState<'key' | 'pointer' | null>(null);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ox = frame.rtl ? frame.margin.end : frame.margin.start;
  const oy = frame.margin.top;
  const activePoint = active ? grid[active.s]?.[active.i] ?? null : null;

  const valid = (s: number, i: number) => !!grid[s]?.[i];
  const firstIn = (s: number): Cursor | null => {
    const row = grid[s] ?? [];
    for (let i = 0; i < row.length; i++) if (row[i]) return { s, i };
    return null;
  };
  const lastIn = (s: number): Cursor | null => {
    const row = grid[s] ?? [];
    for (let i = row.length - 1; i >= 0; i--) if (row[i]) return { s, i };
    return null;
  };
  const firstAny = (fromEnd = false): Cursor | null => {
    for (let s = 0; s < grid.length; s++) {
      const c = fromEnd ? lastIn(s) : firstIn(s);
      if (c) return c;
    }
    return null;
  };
  const within = (c: Cursor, d: number): Cursor | null => {
    const len = grid[c.s]?.length ?? 0;
    for (let i = c.i + d; i >= 0 && i < len; i += d) if (valid(c.s, i)) return { s: c.s, i };
    return null;
  };
  const across = (c: Cursor, d: number): Cursor | null => {
    for (let s = c.s + d; s >= 0 && s < grid.length; s += d) {
      if (valid(s, c.i)) return { s, i: c.i };
      const row = grid[s] ?? [];
      let best: Cursor | null = null;
      for (let i = 0; i < row.length; i++) {
        if (row[i] && (!best || Math.abs(i - c.i) < Math.abs(best.i - c.i))) best = { s, i };
      }
      if (best) return best;
    }
    return null;
  };

  const select = (c: Cursor | null) => {
    if (!c) return;
    const p = grid[c.s]?.[c.i];
    if (!p) return;
    setActive(c);
    setMode('key');
    setHidden(false);
    announce(pointAnnouncement(p));
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const flip = frame.rtl ? -1 : 1;
    let withinDir = 0;
    let acrossDir = 0;
    switch (e.key) {
      case 'ArrowRight':
        if (navigation === 'x') withinDir = flip;
        else acrossDir = flip;
        break;
      case 'ArrowLeft':
        if (navigation === 'x') withinDir = -flip;
        else acrossDir = -flip;
        break;
      case 'ArrowDown':
        if (navigation === 'x') acrossDir = 1;
        else withinDir = 1;
        break;
      case 'ArrowUp':
        if (navigation === 'x') acrossDir = -1;
        else withinDir = -1;
        break;
      case 'Home':
        e.preventDefault();
        select(active && valid(active.s, active.i) ? firstIn(active.s) : firstAny());
        return;
      case 'End':
        e.preventDefault();
        select(active && valid(active.s, active.i) ? lastIn(active.s) : firstAny(true));
        return;
      case 'Escape':
        if (activePoint && !hidden) {
          e.preventDefault();
          setHidden(true);
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    const cur = active && valid(active.s, active.i) ? active : null;
    if (!cur) {
      select(firstAny());
      return;
    }
    // Single-series charts: let Up/Down also step through points.
    if (acrossDir && grid.length === 1) {
      withinDir = acrossDir;
      acrossDir = 0;
    }
    select(withinDir ? within(cur, withinDir) : across(cur, acrossDir));
  };

  const onMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const k = rect.width ? frame.width / rect.width : 1;
    const px = (e.clientX - rect.left) * k - ox;
    const py = (e.clientY - rect.top) * k - oy;
    let best: Cursor | null = null;
    let bestD = hoverRadius * hoverRadius;
    for (let s = 0; s < grid.length; s++) {
      const row = grid[s];
      for (let i = 0; i < row.length; i++) {
        const p = row[i];
        if (!p) continue;
        const d = (p.x - px) ** 2 + (p.y - py) ** 2;
        if (d <= bestD) {
          bestD = d;
          best = { s, i };
        }
      }
    }
    if (best) {
      setActive(best);
      setMode('pointer');
      setHidden(false);
    } else if (mode === 'pointer') setActive(null);
  };

  const onMouseLeave = () => {
    if (mode === 'pointer') {
      setActive(null);
      setMode(null);
    }
  };

  const showTooltip = !!activePoint && !hidden && (mode === 'pointer' || (mode === 'key' && focused));
  const showRing = !!activePoint && mode === 'key' && focused;
  const instructionsId = `${uid}-instr`;
  const describedBy = [descriptionId, summaryId, interactive ? instructionsId : undefined].filter(Boolean).join(' ') || undefined;

  const svg = (
    <svg
      ref={svgRef}
      className="oc-chart__svg"
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      width={frame.width}
      height={frame.height}
      aria-hidden="true"
      focusable="false"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <g transform={`translate(${ox},${oy})`}>
        {children}
        {showRing && activePoint && (
          <circle className="oc-chart__focus-ring" cx={activePoint.x} cy={activePoint.y} r={8} data-testid="chart-focus-ring" />
        )}
        {mode === 'pointer' && activePoint && <circle className="oc-chart__hover-dot" cx={activePoint.x} cy={activePoint.y} r={5} />}
      </g>
    </svg>
  );

  if (!interactive) {
    return (
      <div className={cx('oc-chart__plot', className)} role="img" aria-labelledby={titleId || undefined} aria-describedby={describedBy}>
        {svg}
      </div>
    );
  }

  return (
    <div
      className={cx('oc-chart__plot', className)}
      role="group"
      aria-roledescription="chart"
      aria-labelledby={titleId || undefined}
      aria-describedby={describedBy}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={() => {
        setFocused(true);
        setHidden(false);
      }}
      onBlur={() => setFocused(false)}
    >
      {svg}
      <span id={instructionsId} hidden>
        {labels.instructions}
      </span>
      {showTooltip && activePoint && (
        <ChartTooltip x={activePoint.x + ox} y={activePoint.y + oy} width={frame.width} height={frame.height} title={activePoint.title}>
          {activePoint.series ? (
            <>
              <span className="oc-chart-tooltip__series">{activePoint.series}</span> <strong>{activePoint.value}</strong>
            </>
          ) : (
            <strong>{activePoint.value}</strong>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}

export interface ChartTooltipProps {
  /** Anchor in viewBox units (outer SVG coordinates). */
  x: number;
  y: number;
  /** ViewBox size, used to place the tooltip responsively in %. */
  width: number;
  height: number;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Visual tooltip. It is aria-hidden: the same text is announced through the chart's live region.
 */
export function ChartTooltip({ x, y, width, height, title, children, className }: ChartTooltipProps) {
  const align = x < width * 0.2 ? 'left' : x > width * 0.8 ? 'right' : 'center';
  const below = y < 56;
  return (
    <div
      className={cx('oc-chart-tooltip', `oc-chart-tooltip--${align}`, below && 'oc-chart-tooltip--below', className)}
      style={{ left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%` }}
      aria-hidden="true"
      data-testid="chart-tooltip"
    >
      {title != null && <div className="oc-chart-tooltip__title">{title}</div>}
      {children != null && <div className="oc-chart-tooltip__body">{children}</div>}
    </div>
  );
}

/* =========================================================================================
 * Axis & gridlines
 * ========================================================================================= */

type BivariantFormat = { bivarianceHack(value: number | string | Date): string }['bivarianceHack'];

interface TickItem {
  key: string;
  pos: number;
  text: string;
}

function scaleTicks(
  scale: ChartScale,
  opts: { count: number; tickValues?: ReadonlyArray<number | string | Date>; format?: BivariantFormat; locale?: string; length: number; minSpacing: number },
): TickItem[] {
  if (scale.kind === 'band') {
    const values = (opts.tickValues as string[] | undefined) ?? [...scale.domain];
    const every = Math.max(1, Math.ceil(values.length / Math.max(1, Math.floor(opts.length / opts.minSpacing))));
    return values
      .filter((_, i) => i % every === 0)
      .map((v) => ({ key: v, pos: scale.center(v), text: opts.format ? opts.format(v) : v }));
  }
  if (scale.kind === 'time') {
    const values = (opts.tickValues as Date[] | undefined) ?? scale.ticks(opts.count);
    const f = opts.format ?? scale.tickFormat(opts.locale, opts.count);
    return values.map((v) => ({ key: String(+v), pos: scale(v), text: f(v) }));
  }
  const values = (opts.tickValues as number[] | undefined) ?? scale.ticks(opts.count);
  const f = opts.format ?? compactFormatter(opts.locale);
  return values.map((v) => ({ key: String(v), pos: scale(v), text: f(v) }));
}

export interface AxisProps {
  scale: ChartScale;
  /** 'start' = left in LTR / right in RTL. */
  position: 'bottom' | 'top' | 'start' | 'end';
  /** Approximate tick count for continuous scales. */
  ticks?: number;
  tickValues?: ReadonlyArray<number | string | Date>;
  /** Tick label formatter (defaults: Intl compact numbers, interval-aware dates, raw category text). */
  format?: (value: never) => string;
  label?: ReactNode;
  tickSize?: number;
  /** Override the axis position (px along the cross dimension). */
  offset?: number;
  className?: string;
}

/** Axis with locale-aware (Intl) tick labels. Mirrors automatically in RTL. */
export function Axis({ scale, position, ticks, tickValues, format, label, tickSize = 5, offset, className }: AxisProps) {
  const { frame, locale } = useChart();
  const { innerWidth: w, innerHeight: h, rtl, margin } = frame;
  const horizontal = position === 'bottom' || position === 'top';
  const length = horizontal ? w : h;
  const items = scaleTicks(scale, {
    count: ticks ?? Math.max(2, Math.floor(length / (horizontal ? 90 : 48))),
    tickValues,
    format: format as BivariantFormat | undefined,
    locale: locale ?? frame.locale,
    length,
    minSpacing: horizontal ? 64 : 22,
  });
  const atRight = (position === 'start' && rtl) || (position === 'end' && !rtl);
  const base = offset ?? (position === 'bottom' ? h : position === 'top' ? 0 : atRight ? w : 0);
  const out = horizontal ? (position === 'bottom' ? 1 : -1) : atRight ? 1 : -1;
  const sideMargin = horizontal ? (position === 'bottom' ? margin.bottom : margin.top) : position === 'start' ? margin.start : margin.end;
  return (
    <g
      className={cx('oc-chart-axis', `oc-chart-axis--${position}`, className)}
      transform={horizontal ? `translate(0,${r2(base)})` : `translate(${r2(base)},0)`}
    >
      {horizontal ? <line className="oc-chart-axis__line" x1={0} x2={w} /> : <line className="oc-chart-axis__line" y1={0} y2={h} />}
      {items.map((t) =>
        horizontal ? (
          <g key={t.key} className="oc-chart-axis__tick" transform={`translate(${r2(t.pos)},0)`}>
            <line y2={out * tickSize} />
            <text y={out * (tickSize + 3)} dy={out > 0 ? '0.71em' : '0'} textAnchor="middle">
              {t.text}
            </text>
          </g>
        ) : (
          <g key={t.key} className="oc-chart-axis__tick" transform={`translate(0,${r2(t.pos)})`}>
            <line x2={out * tickSize} />
            <text x={out * (tickSize + 3)} dy="0.32em" textAnchor={out > 0 ? 'start' : 'end'}>
              {t.text}
            </text>
          </g>
        ),
      )}
      {label != null &&
        (horizontal ? (
          <text className="oc-chart-axis__label" x={w / 2} y={out * (sideMargin - 6)} textAnchor="middle">
            {label}
          </text>
        ) : (
          <text
            className="oc-chart-axis__label"
            transform={`translate(${out * (sideMargin - 12)},${h / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
    </g>
  );
}

export interface GridlinesProps {
  scale: ChartScale;
  /** 'horizontal' lines for a y scale, 'vertical' lines for an x scale. */
  orientation: 'horizontal' | 'vertical';
  ticks?: number;
  tickValues?: ReadonlyArray<number | string | Date>;
  className?: string;
}

export function Gridlines({ scale, orientation, ticks, tickValues, className }: GridlinesProps) {
  const { frame } = useChart();
  const horizontal = orientation === 'horizontal';
  const length = horizontal ? frame.innerHeight : frame.innerWidth;
  const items = scaleTicks(scale, {
    count: ticks ?? Math.max(2, Math.floor(length / (horizontal ? 48 : 90))),
    tickValues,
    length,
    minSpacing: horizontal ? 22 : 64,
  });
  return (
    <g className={cx('oc-chart-grid', className)}>
      {items.map((t) =>
        horizontal ? (
          <line key={t.key} x1={0} x2={frame.innerWidth} y1={r2(t.pos)} y2={r2(t.pos)} />
        ) : (
          <line key={t.key} y1={0} y2={frame.innerHeight} x1={r2(t.pos)} x2={r2(t.pos)} />
        ),
      )}
    </g>
  );
}

/* =========================================================================================
 * Series primitives
 * ========================================================================================= */

export interface BarRect {
  x: number;
  y: number;
  width: number;
  height: number;
  key?: string | number;
  /** Per-bar palette index / color override (e.g. waterfall up/down). */
  seriesIndex?: number;
  color?: string;
}

export interface BarSeriesProps {
  bars: ReadonlyArray<BarRect | null | undefined>;
  seriesIndex?: number;
  color?: string;
  radius?: number;
  className?: string;
}

/** Rectangles in plot coordinates, with a pattern overlay used in high contrast / `patterns`. */
export function BarSeries({ bars, seriesIndex = 0, color, radius = 2, className }: BarSeriesProps) {
  const { uid } = useChart();
  return (
    <g className={cx('oc-chart__series', seriesClass(seriesIndex), className)} style={colorStyle(color)}>
      {bars.map((b, k) => {
        if (!b) return null;
        const si = b.seriesIndex ?? seriesIndex;
        const fill = patternFill(uid, si);
        const rx = Math.min(radius, b.width / 2, b.height / 2);
        return (
          <g key={b.key ?? k} className={b.seriesIndex != null ? seriesClass(si) : undefined} style={colorStyle(b.color)}>
            <rect className="oc-chart__bar" x={r2(b.x)} y={r2(b.y)} width={r2(Math.max(0, b.width))} height={r2(Math.max(0, b.height))} rx={rx} />
            {fill && (
              <rect className="oc-chart__pattern" x={r2(b.x)} y={r2(b.y)} width={r2(Math.max(0, b.width))} height={r2(Math.max(0, b.height))} rx={rx} fill={fill} />
            )}
          </g>
        );
      })}
    </g>
  );
}

export interface LineSeriesProps {
  points: ReadonlyArray<XY | null | undefined>;
  seriesIndex?: number;
  color?: string;
  curve?: CurveType;
  /** true: always; false: never; 'auto' (default): shown when patterns are on. */
  markers?: boolean | 'auto';
  markerSize?: number;
  className?: string;
}

/** Polyline/curve with gaps for missing values, plus series-specific marker shapes. */
export function LineSeries({ points, seriesIndex = 0, color, curve = 'linear', markers = 'auto', markerSize = 3.5, className }: LineSeriesProps) {
  const shape = markerShapeFor(seriesIndex);
  return (
    <g className={cx('oc-chart__series', seriesClass(seriesIndex), className)} style={colorStyle(color)}>
      <path className="oc-chart__line" d={linePath(points, curve)} />
      {markers !== false &&
        points.map((p, k) =>
          p ? (
            <path
              key={k}
              className={cx('oc-chart__marker', markers === 'auto' && 'oc-chart__marker--auto')}
              d={markerPath(shape, p.x, p.y, markerSize)}
              data-shape={shape}
            />
          ) : null,
        )}
    </g>
  );
}

export interface AreaSeriesProps {
  points: ReadonlyArray<AreaPoint | null | undefined>;
  seriesIndex?: number;
  color?: string;
  curve?: CurveType;
  /** Vertical gradient from the series color (default true). */
  gradient?: boolean;
  /** Draw the top edge as a line (default true). */
  line?: boolean;
  className?: string;
}

export function AreaSeries({ points, seriesIndex = 0, color, curve = 'linear', gradient = true, line = true, className }: AreaSeriesProps) {
  const { uid } = useChart();
  const gid = `${uid}-grad-${seriesIndex}`;
  const fill = patternFill(uid, seriesIndex);
  const d = areaPath(points, curve);
  return (
    <g className={cx('oc-chart__series', seriesClass(seriesIndex), className)} style={colorStyle(color)}>
      {gradient && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1" className={seriesClass(seriesIndex)} style={colorStyle(color)}>
            <stop offset="0%" className="oc-chart__stop oc-chart__stop--top" />
            <stop offset="100%" className="oc-chart__stop oc-chart__stop--bottom" />
          </linearGradient>
        </defs>
      )}
      <path className={cx('oc-chart__area', gradient && 'oc-chart__area--gradient')} d={d} style={gradient ? { fill: `url(#${gid})` } : undefined} />
      {fill && <path className="oc-chart__pattern oc-chart__pattern--area" d={d} fill={fill} />}
      {line && <path className="oc-chart__line" d={linePath(points.map((p) => (p ? { x: p.x, y: p.y1 } : null)), curve)} />}
    </g>
  );
}

export interface PointSeriesProps {
  points: ReadonlyArray<(XY & { r?: number; key?: string | number }) | null | undefined>;
  seriesIndex?: number;
  color?: string;
  shape?: MarkerShape;
  radius?: number;
  className?: string;
}

/** Scatter/bubble markers; the shape follows the series index unless given. */
export function PointSeries({ points, seriesIndex = 0, color, shape, radius = 4.5, className }: PointSeriesProps) {
  const sh = shape ?? markerShapeFor(seriesIndex);
  return (
    <g className={cx('oc-chart__series', seriesClass(seriesIndex), className)} style={colorStyle(color)}>
      {points.map((p, k) =>
        p ? <path key={p.key ?? k} className="oc-chart__point" d={markerPath(sh, p.x, p.y, p.r ?? radius)} data-shape={sh} /> : null,
      )}
    </g>
  );
}

export interface ArcDatum {
  startAngle: number;
  endAngle: number;
  seriesIndex?: number;
  color?: string;
  key?: string | number;
}

export interface ArcSeriesProps {
  cx: number;
  cy: number;
  innerRadius?: number;
  outerRadius: number;
  arcs: ReadonlyArray<ArcDatum>;
  /** Radians of space between arcs. */
  padAngle?: number;
  className?: string;
}

/** Pie/donut/gauge sectors; each arc takes the palette color + pattern of its `seriesIndex`. */
export function ArcSeries({ cx: x, cy: y, innerRadius = 0, outerRadius, arcs, padAngle = 0, className }: ArcSeriesProps) {
  const { uid } = useChart();
  return (
    <g className={cx('oc-chart__series', className)}>
      {arcs.map((a, k) => {
        const si = a.seriesIndex ?? k;
        const pad = arcs.length > 1 ? Math.min(padAngle, Math.abs(a.endAngle - a.startAngle) / 3) / 2 : 0;
        const lo = Math.min(a.startAngle, a.endAngle) + pad;
        const hi = Math.max(a.startAngle, a.endAngle) - pad;
        const d = arcPath(x, y, innerRadius, outerRadius, lo, hi);
        const fill = patternFill(uid, si);
        return (
          <g key={a.key ?? k} className={seriesClass(si)} style={colorStyle(a.color)}>
            <path className="oc-chart__arc" d={d} fillRule="evenodd" />
            {fill && <path className="oc-chart__pattern" d={d} fill={fill} fillRule="evenodd" />}
          </g>
        );
      })}
    </g>
  );
}

export type ChartTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface ReferenceLineProps {
  /** Vertical line at this x (plot px). */
  x?: number;
  /** Horizontal line at this y (plot px). */
  y?: number;
  label?: ReactNode;
  tone?: ChartTone;
  dashed?: boolean;
  className?: string;
}

/** Target / threshold / average line spanning the plot. */
export function ReferenceLine({ x, y, label, tone = 'neutral', dashed = true, className }: ReferenceLineProps) {
  const { frame } = useChart();
  const { innerWidth: w, innerHeight: h, rtl } = frame;
  const cls = cx('oc-chart-ref', `oc-chart-ref--${tone}`, dashed && 'oc-chart-ref--dashed', className);
  if (y != null) {
    return (
      <g className={cls}>
        <line x1={0} x2={w} y1={r2(y)} y2={r2(y)} />
        {label != null && (
          <text x={rtl ? 4 : w - 4} y={r2(y) - 5} textAnchor={rtl ? 'start' : 'end'} className="oc-chart-ref__label">
            {label}
          </text>
        )}
      </g>
    );
  }
  if (x != null) {
    return (
      <g className={cls}>
        <line x1={r2(x)} x2={r2(x)} y1={0} y2={h} />
        {label != null && (
          <text x={r2(x) + (rtl ? -4 : 4)} y={12} textAnchor={rtl ? 'end' : 'start'} className="oc-chart-ref__label">
            {label}
          </text>
        )}
      </g>
    );
  }
  return null;
}

export interface AnnotationProps {
  /** Target point (plot px). */
  x: number;
  y: number;
  /** Label offset from the target. */
  dx?: number;
  dy?: number;
  label: ReactNode;
  className?: string;
}

/** Callout: a connector from (x, y) to a text label. */
export function Annotation({ x, y, dx = 0, dy = -28, label, className }: AnnotationProps) {
  const tx = x + dx;
  const ty = y + dy;
  const anchor = dx > 4 ? 'start' : dx < -4 ? 'end' : 'middle';
  return (
    <g className={cx('oc-chart-annotation', className)}>
      <line x1={r2(x)} y1={r2(y)} x2={r2(tx)} y2={r2(ty + (dy < 0 ? 4 : -4))} />
      <circle cx={r2(x)} cy={r2(y)} r={3} />
      <text x={r2(tx)} y={r2(ty)} textAnchor={anchor} dy={dy < 0 ? '-0.2em' : '0.9em'}>
        {label}
      </text>
    </g>
  );
}

/* =========================================================================================
 * Legend
 * ========================================================================================= */

export interface LegendItem {
  label: ReactNode;
  seriesIndex: number;
  color?: string;
  kind?: 'bar' | 'line' | 'point' | 'area';
  /** Optional value shown after the label (e.g. "42%"). */
  value?: ReactNode;
}

export interface LegendProps {
  items: ReadonlyArray<LegendItem>;
  title?: ReactNode;
  className?: string;
}

/** Legend whose swatches repeat the series color, fill pattern, dash and marker shape. */
export function Legend({ items, title, className }: LegendProps) {
  const { uid, labels } = useChart();
  return (
    <div className={cx('oc-chart-legend', className)}>
      {title && <span className="oc-chart-legend__title">{title}</span>}
      <ul className="oc-chart-legend__list" aria-label={typeof title === 'string' ? title : labels.legend}>
        {items.map((item, k) => {
          const fill = patternFill(uid, item.seriesIndex);
          const shape = markerShapeFor(item.seriesIndex);
          return (
            <li key={k} className={cx('oc-chart-legend__item', seriesClass(item.seriesIndex))} style={colorStyle(item.color)}>
              <svg className="oc-chart-legend__swatch" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" focusable="false">
                {item.kind === 'line' || item.kind === 'point' ? (
                  <>
                    {item.kind === 'line' && <path className="oc-chart__line" d="M1,6H17" />}
                    <path className={item.kind === 'line' ? 'oc-chart__marker' : 'oc-chart__point'} d={markerPath(shape, 9, 6, 3.5)} data-shape={shape} />
                  </>
                ) : (
                  <>
                    <rect className="oc-chart__bar" x="1" y="1" width="16" height="10" rx="2" />
                    {fill && <rect className="oc-chart__pattern" x="1" y="1" width="16" height="10" rx="2" fill={fill} />}
                  </>
                )}
              </svg>
              <span className="oc-chart-legend__label">{item.label}</span>
              {item.value != null && <span className="oc-chart-legend__value">{item.value}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================================================================
 * Ready-made charts: shared model
 * ========================================================================================= */

export type Accessor<T, V> = keyof T | ((d: T, index: number) => V);
export type XValue = string | number | Date;

function read<T, V>(d: T, i: number, a: Accessor<T, V>): V {
  return typeof a === 'function' ? (a as (d: T, i: number) => V)(d, i) : (d[a as keyof T] as unknown as V);
}

export interface ChartSeries<T> {
  /** Field name; also the default value accessor (`d[key]`). */
  key: string;
  label: string;
  value?: (d: T, index: number) => number | null | undefined;
  /** Override the palette color (any CSS color or var()). */
  color?: string;
}

export interface BaseChartProps {
  title: ReactNode;
  description?: ReactNode;
  /** Override the auto-generated summary. */
  summary?: ReactNode;
  showSummary?: boolean;
  height?: number;
  width?: number;
  margin?: Partial<ChartMargin>;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  patterns?: boolean | 'auto';
  table?: ChartTableMode;
  /** Legend visibility/position (default: shown when there is more than one series). */
  legend?: boolean | 'top' | 'bottom';
  labels?: Partial<ChartLabels>;
  className?: string;
  /** Value formatting for tables, tooltips and announcements. */
  valueFormat?: ValueFormat;
  /** Print values / series names next to the marks. */
  directLabels?: boolean;
}

interface SeriesModel {
  key: string;
  label: string;
  color?: string;
  index: number;
  values: Array<number | null>;
}

interface CartesianModel {
  categories: string[];
  keys: string[];
  raw: XValue[];
  series: SeriesModel[];
}

function defaultXFormat(locale?: string): (v: XValue) => string {
  const df = safeDateFormat(locale, { dateStyle: 'medium' });
  const nf = safeNumberFormat(locale, {});
  return (v) => (v instanceof Date ? df.format(v) : typeof v === 'number' ? nf.format(v) : String(v));
}

function buildModel<T>(
  data: ReadonlyArray<T>,
  x: Accessor<T, XValue>,
  series: ReadonlyArray<ChartSeries<T>>,
  xFormat: ((v: XValue) => string) | undefined,
  locale: string | undefined,
): CartesianModel {
  const fx = xFormat ?? defaultXFormat(locale);
  const raw = data.map((d, i) => read(d, i, x));
  return {
    categories: raw.map((v) => fx(v)),
    keys: raw.map((_, i) => String(i)),
    raw,
    series: series.map((s, index) => ({
      key: s.key,
      label: s.label,
      color: s.color,
      index,
      values: data.map((d, i) => {
        const v = s.value ? s.value(d, i) : (d as Record<string, unknown>)[s.key];
        return isNum(v) ? v : null;
      }),
    })),
  };
}

function cartesianTable(model: CartesianModel, fmt: (v: number) => string, labels: ChartLabels, xLabel?: string): ChartTableData {
  return {
    columns: [xLabel ?? labels.category, ...model.series.map((s) => s.label)],
    rows: model.categories.map((c, i) => ({
      header: c,
      cells: model.series.map((s) => {
        const v = s.values[i];
        return v == null ? labels.noData : fmt(v);
      }),
    })),
  };
}

function legendFor(
  legend: BaseChartProps['legend'],
  count: number,
): { show: boolean; position: 'top' | 'bottom' } {
  if (legend === false) return { show: false, position: 'top' };
  if (legend === 'top' || legend === 'bottom') return { show: true, position: legend };
  return { show: legend === true || count > 1, position: 'top' };
}

function containerProps(p: BaseChartProps) {
  return {
    title: p.title,
    description: p.description,
    showSummary: p.showSummary,
    height: p.height,
    width: p.width,
    locale: p.locale,
    dir: p.dir,
    patterns: p.patterns,
    table: p.table,
    labels: p.labels,
    className: p.className,
  };
}

const mergeLabels = (l?: Partial<ChartLabels>): ChartLabels => ({ ...defaultChartLabels, ...l });
const mergeMargin = (base: Partial<ChartMargin>, over?: Partial<ChartMargin>): Partial<ChartMargin> => ({ ...base, ...over });
const hRange = (frame: ChartFrame): [number, number] => (frame.rtl ? [frame.innerWidth, 0] : [0, frame.innerWidth]);

/* =========================================================================================
 * BarChart
 * ========================================================================================= */

export interface BarChartProps<T> extends BaseChartProps {
  data: ReadonlyArray<T>;
  x: Accessor<T, XValue>;
  series: ReadonlyArray<ChartSeries<T>>;
  orientation?: 'vertical' | 'horizontal';
  /** Stack series (negative values stack downward from zero). */
  stacked?: boolean;
  xFormat?: (v: XValue) => string;
  xLabel?: string;
  yLabel?: string;
}

/** Vertical/horizontal, grouped/stacked bar chart supporting negative values. */
export function BarChart<T>(props: BarChartProps<T>) {
  const { data, x, series, orientation = 'vertical', stacked = false, xFormat, xLabel, yLabel, locale, valueFormat, directLabels } = props;
  const labels = mergeLabels(props.labels);
  const fmt = numberFormatter(locale, valueFormat);
  const compact = compactFormatter(locale);
  const model = buildModel(data, x, series, xFormat, locale);
  let lo = 0;
  let hi = 0;
  model.keys.forEach((_, i) => {
    let pos = 0;
    let neg = 0;
    for (const s of model.series) {
      const v = s.values[i];
      if (v == null) continue;
      if (stacked) {
        if (v >= 0) pos += v;
        else neg += v;
      } else {
        hi = Math.max(hi, v);
        lo = Math.min(lo, v);
      }
    }
    if (stacked) {
      hi = Math.max(hi, pos);
      lo = Math.min(lo, neg);
    }
  });
  const horizontal = orientation === 'horizontal';
  const lg = legendFor(props.legend, series.length);
  const summary = props.summary ?? summarizeChart(`${stacked ? 'Stacked bar chart' : 'Bar chart'}`, model.categories, model.series, compact);
  const margin = mergeMargin(
    horizontal ? { start: 88, bottom: xLabel ? 48 : 32, end: directLabels ? 48 : 16 } : { start: yLabel ? 64 : 48, bottom: xLabel ? 52 : 32, top: directLabels ? 24 : 16 },
    props.margin,
  );
  return (
    <ChartContainer
      {...containerProps(props)}
      margin={margin}
      summary={summary}
      tableData={cartesianTable(model, fmt, labels, xLabel)}
      legendPosition={lg.position}
      legend={lg.show ? <Legend items={model.series.map((s) => ({ label: s.label, seriesIndex: s.index, color: s.color, kind: 'bar' }))} /> : undefined}
    >
      {(frame) => {
        const catRange: [number, number] = horizontal ? [0, frame.innerHeight] : hRange(frame);
        const band = bandScale(model.keys, catRange, { paddingInner: 0.25, paddingOuter: 0.15 });
        const valRange: [number, number] = horizontal ? hRange(frame) : [frame.innerHeight, 0];
        const val = linearScale([lo, hi], valRange, { nice: true });
        const innerRange: [number, number] = horizontal || !frame.rtl ? [0, band.bandwidth] : [band.bandwidth, 0];
        const inner = bandScale(model.series.map((s) => s.key), innerRange, { paddingInner: 0.08, paddingOuter: 0 });
        const bars: BarRect[][] = model.series.map(() => []);
        const pts: Array<Array<ChartPoint | null>> = model.series.map(() => []);
        const texts: ReactNode[] = [];
        model.keys.forEach((key, i) => {
          let pos = 0;
          let neg = 0;
          model.series.forEach((s, si) => {
            const v = s.values[i];
            if (v == null) {
              pts[si].push(null);
              return;
            }
            let a = 0;
            let b = v;
            if (stacked) {
              if (v >= 0) {
                a = pos;
                b = pos += v;
              } else {
                a = neg;
                b = neg += v;
              }
            }
            const p0 = val(a);
            const p1 = val(b);
            const offset = stacked ? band(key) : band(key) + inner(s.key);
            const thick = stacked ? band.bandwidth : inner.bandwidth;
            let point: XY;
            if (!horizontal) {
              bars[si].push({ key, x: offset, y: Math.min(p0, p1), width: thick, height: Math.abs(p1 - p0) });
              point = { x: offset + thick / 2, y: p1 };
            } else {
              bars[si].push({ key, x: Math.min(p0, p1), y: offset, width: Math.abs(p1 - p0), height: thick });
              point = { x: p1, y: offset + thick / 2 };
            }
            pts[si].push({ ...point, title: model.categories[i], series: s.label, value: fmt(v) });
            if (directLabels && !stacked) {
              const outward = horizontal ? (v >= 0 ? 1 : -1) * (frame.rtl ? -1 : 1) : v >= 0 ? -1 : 1;
              texts.push(
                <text
                  key={`${si}-${i}`}
                  className="oc-chart__label"
                  x={horizontal ? point.x + outward * 4 : point.x}
                  y={horizontal ? point.y : point.y + outward * 4}
                  dy={horizontal ? '0.32em' : outward > 0 ? '0.8em' : '0'}
                  textAnchor={horizontal ? (outward > 0 ? 'start' : 'end') : 'middle'}
                >
                  {compact(v)}
                </text>,
              );
            }
          });
        });
        return (
          <ChartPlot points={pts} navigation={horizontal ? 'y' : 'x'}>
            <Gridlines scale={val} orientation={horizontal ? 'vertical' : 'horizontal'} />
            {model.series.map((s) => (
              <BarSeries key={s.key} bars={bars[s.index]} seriesIndex={s.index} color={s.color} />
            ))}
            {horizontal ? (
              <ReferenceLine x={val(0)} dashed={false} className="oc-chart-ref--baseline" />
            ) : (
              <ReferenceLine y={val(0)} dashed={false} className="oc-chart-ref--baseline" />
            )}
            <Axis scale={band} position={horizontal ? 'start' : 'bottom'} format={(k: string) => model.categories[Number(k)] ?? k} label={xLabel} />
            <Axis scale={val} position={horizontal ? 'bottom' : 'start'} label={yLabel} />
            {texts}
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

/* =========================================================================================
 * LineChart / AreaChart
 * ========================================================================================= */

export interface LineChartProps<T> extends BaseChartProps {
  data: ReadonlyArray<T>;
  x: Accessor<T, XValue>;
  series: ReadonlyArray<ChartSeries<T>>;
  /** 'auto' (default): time scale for Date x values, otherwise categorical. */
  xScale?: 'auto' | 'band' | 'time' | 'linear';
  curve?: CurveType;
  /** Show markers: true / false / 'auto' (default: shown for ≤ 24 points, and always in pattern mode). */
  markers?: boolean | 'auto';
  /** Include zero in the value axis. */
  zero?: boolean;
  xFormat?: (v: XValue) => string;
  xLabel?: string;
  yLabel?: string;
}

export interface AreaChartProps<T> extends LineChartProps<T> {
  /** 'stacked' (default) or 'overlap'. */
  mode?: 'stacked' | 'overlap';
  gradient?: boolean;
}

function xPositioner(model: CartesianModel, kind: LineChartProps<unknown>['xScale'], range: [number, number]) {
  const allDates = model.raw.length > 0 && model.raw.every((v) => v instanceof Date);
  const allNums = model.raw.length > 0 && model.raw.every((v) => typeof v === 'number');
  const type = kind === 'auto' || !kind ? (allDates ? 'time' : 'band') : kind;
  if (type === 'time' && (allDates || allNums)) {
    const ts = model.raw.map((v) => +(v as Date | number));
    const s = timeScale([Math.min(...ts), Math.max(...ts)], range);
    return { scale: s as ChartScale, pos: (i: number) => s(ts[i]) };
  }
  if (type === 'linear' && allNums) {
    const ns = model.raw as number[];
    const s = linearScale([Math.min(...ns), Math.max(...ns)], range);
    return { scale: s as ChartScale, pos: (i: number) => s(ns[i]) };
  }
  const s = bandScale(model.keys, range, { paddingInner: 1, paddingOuter: model.keys.length === 1 ? 0.5 : 0.25 });
  return { scale: s as ChartScale, pos: (i: number) => s.center(model.keys[i]), band: true };
}

function LinesImpl<T>(props: AreaChartProps<T> & { kind: 'line' | 'area' }) {
  const { kind, data, x, series, curve = 'linear', markers = 'auto', xFormat, xLabel, yLabel, locale, valueFormat, directLabels } = props;
  const mode = props.mode ?? 'stacked';
  const stacked = kind === 'area' && mode === 'stacked';
  const labels = mergeLabels(props.labels);
  const fmt = numberFormatter(locale, valueFormat);
  const compact = compactFormatter(locale);
  const model = buildModel(data, x, series, xFormat, locale);
  const n = model.keys.length;
  // Stacked cumulative values (missing values count as 0 when stacking).
  const cum: number[][] = [];
  if (stacked) {
    const acc = new Array<number>(n).fill(0);
    for (const s of model.series) {
      cum.push(
        s.values.map((v, i) => {
          acc[i] += v ?? 0;
          return acc[i];
        }),
      );
    }
  }
  const all = stacked ? cum.flat() : model.series.flatMap((s) => s.values.filter(isNum));
  const zero = props.zero ?? kind === 'area';
  let lo = all.length ? Math.min(...all) : 0;
  let hi = all.length ? Math.max(...all) : 1;
  if (zero) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  const lg = legendFor(props.legend, series.length);
  const kindLabel = kind === 'area' ? (stacked ? 'Stacked area chart' : 'Area chart') : 'Line chart';
  const summary = props.summary ?? summarizeChart(kindLabel, model.categories, model.series, compact);
  const showMarkers: boolean | 'auto' = markers === 'auto' ? (n <= 24 && kind === 'line' ? true : 'auto') : markers;
  const margin = mergeMargin({ start: yLabel ? 64 : 48, bottom: xLabel ? 52 : 32, end: directLabels ? 80 : 20 }, props.margin);
  return (
    <ChartContainer
      {...containerProps(props)}
      margin={margin}
      summary={summary}
      tableData={cartesianTable(model, fmt, labels, xLabel)}
      legendPosition={lg.position}
      legend={
        lg.show ? (
          <Legend items={model.series.map((s) => ({ label: s.label, seriesIndex: s.index, color: s.color, kind: kind === 'area' ? 'area' : 'line' }))} />
        ) : undefined
      }
    >
      {(frame) => {
        const xp = xPositioner(model, props.xScale, hRange(frame));
        const y = linearScale([lo, hi], [frame.innerHeight, 0], { nice: true });
        const baseline = y(Math.min(Math.max(0, y.domain[0]), y.domain[1]));
        const pts: Array<Array<ChartPoint | null>> = [];
        const marks = model.series.map((s, si) => {
          const top = s.values.map((v, i) => {
            if (stacked) return y(cum[si][i]);
            return v == null ? null : y(v);
          });
          pts.push(
            s.values.map((v, i) => {
              const ty = top[i];
              return v == null || ty == null ? null : { x: xp.pos(i), y: ty, title: model.categories[i], series: s.label, value: fmt(v) };
            }),
          );
          if (kind === 'area') {
            const area = s.values.map((v, i): AreaPoint | null => {
              const ty = top[i];
              if (ty == null || (!stacked && v == null)) return null;
              return { x: xp.pos(i), y1: ty, y0: stacked && si > 0 ? y(cum[si - 1][i]) : baseline };
            });
            return <AreaSeries key={s.key} points={area} seriesIndex={s.index} color={s.color} curve={curve} gradient={props.gradient ?? true} />;
          }
          return (
            <LineSeries
              key={s.key}
              points={top.map((ty, i) => (ty == null ? null : { x: xp.pos(i), y: ty }))}
              seriesIndex={s.index}
              color={s.color}
              curve={curve}
              markers={showMarkers}
            />
          );
        });
        const direct = directLabels
          ? model.series.map((s, si) => {
              const row = pts[si];
              const last = [...row].reverse().find(Boolean);
              return last ? (
                <text
                  key={s.key}
                  className={cx('oc-chart__label oc-chart__label--series', seriesClass(s.index))}
                  x={last.x + (frame.rtl ? -8 : 8)}
                  y={last.y}
                  dy="0.32em"
                  textAnchor={frame.rtl ? 'end' : 'start'}
                >
                  {s.label}
                </text>
              ) : null;
            })
          : null;
        return (
          <ChartPlot points={pts}>
            <Gridlines scale={y} orientation="horizontal" />
            {marks}
            <Axis
              scale={xp.scale}
              position="bottom"
              format={xp.band ? (k: string) => model.categories[Number(k)] ?? k : undefined}
              label={xLabel}
            />
            <Axis scale={y} position="start" label={yLabel} />
            {direct}
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

/** Multi-series line chart: optional monotone smoothing, markers by shape, gaps for missing values. */
export function LineChart<T>(props: LineChartProps<T>) {
  return <LinesImpl {...props} kind="line" />;
}

/** Stacked or overlapping area chart with token-based gradient fills. */
export function AreaChart<T>(props: AreaChartProps<T>) {
  return <LinesImpl {...props} kind="area" />;
}

/* =========================================================================================
 * ComboChart (bars + lines, dual axes)
 * ========================================================================================= */

export interface ComboSeries<T> extends ChartSeries<T> {
  type: 'bar' | 'line';
  /** 'primary' (start axis, default) or 'secondary' (end axis). */
  axis?: 'primary' | 'secondary';
}

export interface ComboChartProps<T> extends BaseChartProps {
  data: ReadonlyArray<T>;
  x: Accessor<T, XValue>;
  series: ReadonlyArray<ComboSeries<T>>;
  curve?: CurveType;
  xFormat?: (v: XValue) => string;
  secondaryFormat?: ValueFormat;
  primaryLabel?: string;
  secondaryLabel?: string;
}

/** Bars and lines over shared categories with independent primary/secondary value axes. */
export function ComboChart<T>(props: ComboChartProps<T>) {
  const { data, x, series, curve = 'linear', xFormat, locale, valueFormat, secondaryFormat, primaryLabel, secondaryLabel } = props;
  const labels = mergeLabels(props.labels);
  const fmt = numberFormatter(locale, valueFormat);
  const fmt2 = secondaryFormat ? numberFormatter(locale, secondaryFormat) : fmt;
  const compact = compactFormatter(locale);
  const model = buildModel(data, x, series, xFormat, locale);
  const isSecondary = (i: number) => series[i]?.axis === 'secondary';
  const extent = (secondary: boolean): [number, number] => {
    const vals = model.series.filter((s) => isSecondary(s.index) === secondary).flatMap((s) => s.values.filter(isNum));
    return vals.length ? [Math.min(0, ...vals), Math.max(0, ...vals)] : [0, 1];
  };
  const hasSecondary = series.some((s) => s.axis === 'secondary');
  const fmtFor = (i: number) => (isSecondary(i) ? fmt2 : fmt);
  const lg = legendFor(props.legend, series.length);
  const summary = props.summary ?? summarizeChart('Combination chart', model.categories, model.series, compact);
  const table: ChartTableData = {
    columns: [labels.category, ...model.series.map((s) => s.label)],
    rows: model.categories.map((c, i) => ({
      header: c,
      cells: model.series.map((s) => (s.values[i] == null ? labels.noData : fmtFor(s.index)(s.values[i] as number))),
    })),
  };
  const margin = mergeMargin({ start: primaryLabel ? 64 : 48, end: hasSecondary ? (secondaryLabel ? 64 : 48) : 16 }, props.margin);
  return (
    <ChartContainer
      {...containerProps(props)}
      margin={margin}
      summary={summary}
      tableData={table}
      legendPosition={lg.position}
      legend={
        lg.show ? <Legend items={model.series.map((s) => ({ label: s.label, seriesIndex: s.index, color: s.color, kind: series[s.index].type }))} /> : undefined
      }
    >
      {(frame) => {
        const band = bandScale(model.keys, hRange(frame), { paddingInner: 0.25, paddingOuter: 0.15 });
        const y1 = linearScale(extent(false), [frame.innerHeight, 0], { nice: true });
        const y2 = linearScale(extent(true), [frame.innerHeight, 0], { nice: true });
        const barSeries = model.series.filter((s) => series[s.index].type === 'bar');
        const inner = bandScale(barSeries.map((s) => s.key), frame.rtl ? [band.bandwidth, 0] : [0, band.bandwidth], { paddingInner: 0.08, paddingOuter: 0 });
        const pts: Array<Array<ChartPoint | null>> = [];
        const marks = model.series.map((s) => {
          const y = isSecondary(s.index) ? y2 : y1;
          const f = fmtFor(s.index);
          if (series[s.index].type === 'bar') {
            const bars = s.values.map((v, i): BarRect | null => {
              if (v == null) return null;
              const bx = band(model.keys[i]) + inner(s.key);
              return { key: i, x: bx, y: Math.min(y(0), y(v)), width: inner.bandwidth, height: Math.abs(y(v) - y(0)) };
            });
            pts.push(
              s.values.map((v, i) => {
                const b = bars[i];
                return v == null || !b ? null : { x: b.x + b.width / 2, y: y(v), title: model.categories[i], series: s.label, value: f(v) };
              }),
            );
            return <BarSeries key={s.key} bars={bars} seriesIndex={s.index} color={s.color} />;
          }
          const line = s.values.map((v, i) => (v == null ? null : { x: band.center(model.keys[i]), y: y(v) }));
          pts.push(s.values.map((v, i) => (v == null ? null : { x: band.center(model.keys[i]), y: y(v), title: model.categories[i], series: s.label, value: f(v) })));
          return <LineSeries key={s.key} points={line} seriesIndex={s.index} color={s.color} curve={curve} markers />;
        });
        // Bars first so lines stay visible on top.
        const order = model.series.map((s, i) => ({ s, i })).sort((a, b) => Number(series[a.s.index].type === 'line') - Number(series[b.s.index].type === 'line'));
        return (
          <ChartPlot points={pts}>
            <Gridlines scale={y1} orientation="horizontal" />
            {order.map(({ i }) => marks[i])}
            <ReferenceLine y={y1(0)} dashed={false} className="oc-chart-ref--baseline" />
            <Axis scale={band} position="bottom" format={(k: string) => model.categories[Number(k)] ?? k} />
            <Axis scale={y1} position="start" label={primaryLabel} />
            {hasSecondary && (
              <Axis
                scale={y2}
                position="end"
                label={secondaryLabel}
                format={secondaryFormat && typeof secondaryFormat !== 'function' ? numberFormatter(locale, { notation: 'compact', ...secondaryFormat }) : undefined}
              />
            )}
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

/* =========================================================================================
 * PieChart / DonutChart
 * ========================================================================================= */

export interface PieChartProps<T> extends BaseChartProps {
  data: ReadonlyArray<T>;
  label: Accessor<T, string>;
  value: Accessor<T, number>;
  color?: (d: T, index: number) => string | undefined;
  /** Inner radius as a fraction of the outer radius (0 = pie). */
  innerRadius?: number;
  /** Donut center content (default: formatted total + "Total"). */
  centerLabel?: ReactNode;
  centerSubLabel?: ReactNode;
  /** Slices below this share (0–1) are grouped into "Other" (default 0.03). */
  otherThreshold?: number;
  /** Keep at most this many slices; the rest are grouped into "Other" (default 8). */
  maxSlices?: number;
  otherLabel?: string;
  /** Sort slices by value, largest first (default true). */
  sort?: boolean;
}

interface Slice {
  label: string;
  value: number;
  color?: string;
  members: string[];
}

/** Groups small slices into "Other" (exported for custom charts and tests). */
export function groupSlices(
  items: ReadonlyArray<{ label: string; value: number; color?: string }>,
  { threshold = 0.03, maxSlices = 8, otherLabel = 'Other', sort = true }: { threshold?: number; maxSlices?: number; otherLabel?: string; sort?: boolean } = {},
): Array<{ label: string; value: number; color?: string; members: string[] }> {
  const positive = items.filter((d) => isNum(d.value) && d.value > 0);
  const total = positive.reduce((a, d) => a + d.value, 0);
  const ordered = sort ? [...positive].sort((a, b) => b.value - a.value) : [...positive];
  const keep: Slice[] = [];
  const other: Slice = { label: otherLabel, value: 0, members: [] };
  const byRank = [...positive].sort((a, b) => b.value - a.value);
  const allowed = new Set(byRank.slice(0, Math.max(1, maxSlices - 1)).map((d) => d));
  const overflow = byRank.length > maxSlices;
  for (const d of ordered) {
    const small = total > 0 && d.value / total < threshold;
    if (small || (overflow && !allowed.has(d))) {
      other.value += d.value;
      other.members.push(d.label);
    } else keep.push({ ...d, members: [d.label] });
  }
  if (other.members.length === 1) {
    const only = ordered.find((d) => d.label === other.members[0]);
    if (only) keep.push({ ...only, members: [only.label] });
  } else if (other.members.length > 1) keep.push(other);
  return keep;
}

/** Pie chart (or donut with `innerRadius`), with small-slice grouping and accessible summary. */
export function PieChart<T>(props: PieChartProps<T>) {
  const { data, label, value, color, innerRadius = 0, locale, valueFormat, directLabels, otherThreshold = 0.03, maxSlices = 8, sort = true } = props;
  const labels = mergeLabels(props.labels);
  const otherLabel = props.otherLabel ?? labels.other;
  const fmt = numberFormatter(locale, valueFormat);
  const pctFmt = safeNumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
  const items = data.map((d, i) => ({ label: String(read(d, i, label)), value: Number(read(d, i, value)), color: color?.(d, i) }));
  const slices = groupSlices(items, { threshold: otherThreshold, maxSlices, otherLabel, sort });
  const total = slices.reduce((a, s) => a + s.value, 0);
  const share = (v: number) => (total > 0 ? v / total : 0);
  const kind = innerRadius > 0 ? 'Donut chart' : 'Pie chart';
  const listed = slices.slice(0, 6).map((s) => `${s.label} ${pctFmt.format(share(s.value))} (${fmt(s.value)})`);
  const summary =
    props.summary ??
    (slices.length
      ? `${kind} with ${slices.length} slices, total ${fmt(total)}. ${listed.join(', ')}${slices.length > 6 ? `, and ${slices.length - 6} more` : ''}.${
          slices.some((s) => s.members.length > 1) ? ` ${otherLabel} groups ${slices.find((s) => s.members.length > 1)?.members.join(', ')}.` : ''
        }`
      : `${kind}: ${labels.noData}.`);
  const lg = legendFor(props.legend === undefined ? true : props.legend, slices.length);
  const table: ChartTableData = {
    columns: [labels.category, labels.value, labels.percent],
    rows: slices.map((s) => ({ header: s.members.length > 1 ? `${s.label} (${s.members.join(', ')})` : s.label, cells: [fmt(s.value), pctFmt.format(share(s.value))] })),
  };
  const height = props.height ?? 280;
  return (
    <ChartContainer
      {...containerProps(props)}
      height={height}
      margin={mergeMargin({ top: 8, bottom: 8, start: 8, end: 8 }, props.margin)}
      summary={summary}
      tableData={table}
      legendPosition={lg.position}
      legend={
        lg.show ? (
          <Legend items={slices.map((s, i) => ({ label: s.label, seriesIndex: i, color: s.color, kind: 'bar', value: pctFmt.format(share(s.value)) }))} />
        ) : undefined
      }
    >
      {(frame) => {
        const r = Math.max(10, Math.min(frame.innerWidth, frame.innerHeight) / 2 - 2);
        const r0 = r * Math.min(0.9, Math.max(0, innerRadius));
        const cxp = frame.innerWidth / 2;
        const cyp = frame.innerHeight / 2;
        const sign = frame.rtl ? -1 : 1;
        let acc = 0;
        const arcs: ArcDatum[] = [];
        const row: ChartPoint[] = [];
        const texts: ReactNode[] = [];
        slices.forEach((s, i) => {
          const a0 = sign * acc * Math.PI * 2;
          acc += share(s.value);
          const a1 = sign * acc * Math.PI * 2;
          arcs.push({ startAngle: a0, endAngle: a1, seriesIndex: i, color: s.color, key: s.label });
          const c = polar(cxp, cyp, r0 > 0 ? (r0 + r) / 2 : r * 0.62, (a0 + a1) / 2);
          row.push({ ...c, title: s.label, series: '', value: `${fmt(s.value)} (${pctFmt.format(share(s.value))})` });
          if (directLabels && share(s.value) >= 0.06) {
            texts.push(
              <text key={i} className="oc-chart__label oc-chart__label--inside" x={c.x} y={c.y} dy="0.32em" textAnchor="middle">
                {pctFmt.format(share(s.value))}
              </text>,
            );
          }
        });
        return (
          <ChartPlot points={[row]}>
            <ArcSeries cx={cxp} cy={cyp} innerRadius={r0} outerRadius={r} arcs={arcs} padAngle={0.012} />
            {texts}
            {r0 > 0 && (
              <g className="oc-chart__center">
                <text x={cxp} y={cyp} className="oc-chart__center-value" textAnchor="middle" dy={props.centerSubLabel === null ? '0.32em' : '0.1em'}>
                  {props.centerLabel ?? compactFormatter(locale)(total)}
                </text>
                {props.centerSubLabel !== null && (
                  <text x={cxp} y={cyp} className="oc-chart__center-sub" textAnchor="middle" dy="1.5em">
                    {props.centerSubLabel ?? labels.total}
                  </text>
                )}
              </g>
            )}
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

/** Donut chart: a PieChart with an inner radius (default 0.6) and a center label. */
export function DonutChart<T>(props: PieChartProps<T>) {
  return <PieChart {...props} innerRadius={props.innerRadius ?? 0.6} />;
}

/* =========================================================================================
 * ScatterChart / BubbleChart
 * ========================================================================================= */

export interface ScatterChartProps<T> extends BaseChartProps {
  data: ReadonlyArray<T>;
  x: Accessor<T, number>;
  y: Accessor<T, number>;
  /** Bubble size (area-proportional radius). */
  size?: Accessor<T, number>;
  /** Group points into series. */
  group?: Accessor<T, string>;
  pointLabel?: Accessor<T, string>;
  xLabel?: string;
  yLabel?: string;
  sizeLabel?: string;
  xFormat?: ValueFormat;
  minRadius?: number;
  maxRadius?: number;
}

/** Pearson correlation coefficient (NaN if undefined). */
export function correlation(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return NaN;
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += xs[i];
    my += ys[i];
  }
  mx /= n;
  my /= n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
}

function describeCorrelation(r: number): string {
  if (!Number.isFinite(r)) return 'no measurable correlation';
  const a = Math.abs(r);
  const strength = a >= 0.7 ? 'strong' : a >= 0.4 ? 'moderate' : a >= 0.2 ? 'weak' : '';
  if (!strength) return 'no clear correlation';
  return `${strength} ${r > 0 ? 'positive' : 'negative'} correlation`;
}

/** Scatter plot (and bubble chart with `size`); series via `group`, distinct marker shapes per group. */
export function ScatterChart<T>(props: ScatterChartProps<T>) {
  const { data, x, y, size, group, pointLabel, xLabel = 'x', yLabel = 'y', sizeLabel = 'size', locale, valueFormat, minRadius = 3, maxRadius = 22 } = props;
  const labels = mergeLabels(props.labels);
  const fy = numberFormatter(locale, valueFormat);
  const fx = numberFormatter(locale, props.xFormat ?? valueFormat);
  const rows = data
    .map((d, i) => ({
      d,
      i,
      x: Number(read(d, i, x)),
      y: Number(read(d, i, y)),
      size: size ? Number(read(d, i, size)) : NaN,
      group: group ? String(read(d, i, group)) : '',
      name: pointLabel ? String(read(d, i, pointLabel)) : '',
    }))
    .filter((r) => isNum(r.x) && isNum(r.y));
  const groups = [...new Set(rows.map((r) => r.group))];
  const byGroup = groups.map((g) => rows.filter((r) => r.group === g).sort((a, b) => a.x - b.x));
  const sizes = rows.map((r) => r.size).filter(isNum);
  const maxSize = sizes.length ? Math.max(...sizes) : 1;
  const radius = (s: number) => (size && isNum(s) && maxSize > 0 ? Math.max(minRadius, Math.sqrt(Math.max(0, s) / maxSize) * maxRadius) : 4.5);
  const kind = size ? 'Bubble chart' : 'Scatter chart';
  const summary =
    props.summary ??
    [
      `${kind} of ${yLabel} against ${xLabel}, ${rows.length} points${groups.length > 1 ? ` in ${groups.length} groups` : ''}.`,
      ...byGroup.map((g, k) => {
        if (!g.length) return '';
        const xs = g.map((r) => r.x);
        const ys = g.map((r) => r.y);
        return `${groups[k] ? `${groups[k]}: ` : ''}${xLabel} ${fx(Math.min(...xs))} to ${fx(Math.max(...xs))}, ${yLabel} ${fy(Math.min(...ys))} to ${fy(Math.max(...ys))}; ${describeCorrelation(correlation(xs, ys))}.`;
      }),
    ]
      .filter(Boolean)
      .join(' ');
  const lg = legendFor(props.legend, groups.length);
  const table: ChartTableData = {
    columns: [pointLabel ? labels.category : '#', ...(group ? [labels.legend] : []), xLabel, yLabel, ...(size ? [sizeLabel] : [])],
    rows: byGroup.flat().map((r) => ({
      header: r.name || String(r.i + 1),
      cells: [...(group ? [r.group] : []), fx(r.x), fy(r.y), ...(size ? [isNum(r.size) ? fy(r.size) : labels.noData] : [])],
    })),
  };
  return (
    <ChartContainer
      {...containerProps(props)}
      margin={mergeMargin({ start: 64, bottom: 52, top: size ? 24 : 16, end: size ? 28 : 16 }, props.margin)}
      summary={summary}
      tableData={table}
      legendPosition={lg.position}
      legend={lg.show ? <Legend items={groups.map((g, k) => ({ label: g, seriesIndex: k, kind: 'point' }))} /> : undefined}
    >
      {(frame) => {
        const xs = rows.map((r) => r.x);
        const ys = rows.map((r) => r.y);
        const sx = linearScale([Math.min(...xs, Infinity), Math.max(...xs, -Infinity)], hRange(frame), { nice: true });
        const sy = linearScale([Math.min(...ys, Infinity), Math.max(...ys, -Infinity)], [frame.innerHeight, 0], { nice: true });
        const pts = byGroup.map((g, k) =>
          g.map((r) => ({
            x: sx(r.x),
            y: sy(r.y),
            title: r.name || `${xLabel} ${fx(r.x)}`,
            series: groups[k],
            value: `${xLabel} ${fx(r.x)}, ${yLabel} ${fy(r.y)}${size && isNum(r.size) ? `, ${sizeLabel} ${fy(r.size)}` : ''}`,
          })),
        );
        return (
          <ChartPlot points={pts} hoverRadius={maxRadius + 16}>
            <Gridlines scale={sy} orientation="horizontal" />
            <Gridlines scale={sx} orientation="vertical" />
            {byGroup.map((g, k) => (
              <PointSeries
                key={k}
                seriesIndex={k}
                className={size ? 'oc-chart__series--bubble' : undefined}
                points={g.map((r) => ({ x: sx(r.x), y: sy(r.y), r: radius(r.size), key: r.i }))}
              />
            ))}
            <Axis scale={sx} position="bottom" label={xLabel} />
            <Axis scale={sy} position="start" label={yLabel} />
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

/** Bubble chart: ScatterChart with a required `size` accessor. */
export function BubbleChart<T>(props: ScatterChartProps<T> & { size: Accessor<T, number> }) {
  return <ScatterChart {...props} />;
}

/* =========================================================================================
 * RadarChart
 * ========================================================================================= */

export interface RadarChartProps<T> extends BaseChartProps {
  data: ReadonlyArray<T>;
  /** Axis (spoke) name per datum. */
  x: Accessor<T, XValue>;
  series: ReadonlyArray<ChartSeries<T>>;
  /** Fixed maximum of the radial scale (default: nice max of the data). */
  max?: number;
  xFormat?: (v: XValue) => string;
}

/** Radar / spider chart: one spoke per datum, one polygon per series. */
export function RadarChart<T>(props: RadarChartProps<T>) {
  const { data, x, series, xFormat, locale, valueFormat, max } = props;
  const labels = mergeLabels(props.labels);
  const fmt = numberFormatter(locale, valueFormat);
  const model = buildModel(data, x, series, xFormat, locale);
  const all = model.series.flatMap((s) => s.values.filter(isNum));
  const top = max ?? Math.max(1, ...all);
  const summary =
    props.summary ??
    [
      `Radar chart with ${model.categories.length} axes${model.series.length > 1 ? ` and ${model.series.length} series` : ''}.`,
      ...model.series.map((s) => {
        const pts = s.values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => isNum(p.v));
        if (!pts.length) return `${s.label}: ${labels.noData}.`;
        const hi = pts.reduce((a, b) => (b.v > a.v ? b : a));
        const lo = pts.reduce((a, b) => (b.v < a.v ? b : a));
        return `${s.label}: highest ${model.categories[hi.i]} (${fmt(hi.v)}), lowest ${model.categories[lo.i]} (${fmt(lo.v)}).`;
      }),
    ].join(' ');
  const lg = legendFor(props.legend, series.length);
  return (
    <ChartContainer
      {...containerProps(props)}
      height={props.height ?? 340}
      margin={mergeMargin({ top: 28, bottom: 28, start: 72, end: 72 }, props.margin)}
      summary={summary}
      tableData={cartesianTable(model, fmt, labels)}
      legendPosition={lg.position}
      legend={lg.show ? <Legend items={model.series.map((s) => ({ label: s.label, seriesIndex: s.index, color: s.color, kind: 'area' }))} /> : undefined}
    >
      {(frame) => {
        const n = Math.max(1, model.keys.length);
        const R = Math.max(10, Math.min(frame.innerWidth, frame.innerHeight) / 2);
        const cxp = frame.innerWidth / 2;
        const cyp = frame.innerHeight / 2;
        const rs = linearScale([0, top], [0, R], { nice: max == null ? 4 : false });
        const ang = (i: number) => (frame.rtl ? -1 : 1) * ((i / n) * Math.PI * 2);
        const ring = (v: number) => `M${model.keys.map((_, i) => { const p = polar(cxp, cyp, rs(v), ang(i)); return `${r2(p.x)},${r2(p.y)}`; }).join('L')}Z`;
        const pts = model.series.map((s) =>
          s.values.map((v, i) => (v == null ? null : { ...polar(cxp, cyp, rs(v), ang(i)), title: model.categories[i], series: s.label, value: fmt(v) })),
        );
        return (
          <ChartPlot points={pts}>
            <g className="oc-chart-grid">
              {rs.ticks(4).filter((t) => t > 0).map((t) => <path key={t} d={ring(t)} fill="none" />)}
              {model.keys.map((k, i) => {
                const p = polar(cxp, cyp, R, ang(i));
                return <line key={k} x1={cxp} y1={cyp} x2={r2(p.x)} y2={r2(p.y)} />;
              })}
            </g>
            <g className="oc-chart-axis">
              {model.keys.map((k, i) => {
                const p = polar(cxp, cyp, R + 12, ang(i));
                const sx = Math.sin(ang(i));
                return (
                  <g key={k} className="oc-chart-axis__tick">
                    <text x={r2(p.x)} y={r2(p.y)} dy="0.32em" textAnchor={Math.abs(sx) < 0.2 ? 'middle' : sx > 0 ? 'start' : 'end'}>
                      {model.categories[i]}
                    </text>
                  </g>
                );
              })}
              {rs.ticks(4).filter((t) => t > 0).map((t) => (
                <text key={t} className="oc-chart-axis__ring-label" x={cxp + 3} y={cyp - rs(t)} dy="-0.2em">
                  {compactFormatter(locale)(t)}
                </text>
              ))}
            </g>
            {model.series.map((s) => {
              const poly = s.values.map((v, i) => polar(cxp, cyp, rs(v ?? 0), ang(i)));
              const d = `M${poly.map((p) => `${r2(p.x)},${r2(p.y)}`).join('L')}Z`;
              return (
                <g key={s.key} className={cx('oc-chart__series', seriesClass(s.index))} style={colorStyle(s.color)}>
                  <path className="oc-chart__area oc-chart__area--radar" d={d} />
                  <path className="oc-chart__line" d={d} />
                  {s.values.map((v, i) =>
                    v == null ? null : <path key={i} className="oc-chart__marker" d={markerPath(markerShapeFor(s.index), poly[i].x, poly[i].y, 3.5)} />,
                  )}
                </g>
              );
            })}
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

/* =========================================================================================
 * Sparkline
 * ========================================================================================= */

export interface SparklineProps {
  data: ReadonlyArray<number | null | undefined>;
  /** What the numbers are, e.g. "Sign-ups". Prefixed to the accessible summary. */
  label?: string;
  /** Period phrase for the summary, e.g. "7 days" → "Up 12% over 7 days". */
  period?: string;
  /** Override the generated summary. */
  summary?: string;
  width?: number;
  height?: number;
  area?: boolean;
  curve?: CurveType;
  /** Mark the last point (default true). */
  showEnd?: boolean;
  tone?: ChartTone;
  locale?: string;
  valueFormat?: ValueFormat;
  className?: string;
}

/** Tiny inline trend with an accessible summary ("Sign-ups: Up 12% over 7 days"). */
export function Sparkline({
  data,
  label,
  period,
  summary,
  width = 96,
  height = 28,
  area = false,
  curve = 'monotone',
  showEnd = true,
  tone = 'primary',
  locale,
  valueFormat,
  className,
}: SparklineProps) {
  const uid = `nws${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const trend = summary ?? trendSummary(data, { period, locale, format: valueFormat });
  const text = label ? `${label}: ${trend}` : trend;
  const nums = data.filter(isNum);
  const pad = 3;
  const sx = linearScale([0, Math.max(1, data.length - 1)], [pad, width - pad]);
  const sy = linearScale([nums.length ? Math.min(...nums) : 0, nums.length ? Math.max(...nums) : 1], [height - pad, pad]);
  const pts = data.map((v, i) => (isNum(v) ? { x: sx(i), y: sy(v) } : null));
  const lastIdx = pts.map((p, i) => (p ? i : -1)).filter((i) => i >= 0).pop();
  const last = lastIdx != null ? pts[lastIdx] : null;
  return (
    <span className={cx('oc-sparkline', `oc-sparkline--${tone}`, className)} role="img" aria-label={text} title={text}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        {area && (
          <>
            <defs>
              <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="oc-chart__stop oc-chart__stop--top" />
                <stop offset="100%" className="oc-chart__stop oc-chart__stop--bottom" />
              </linearGradient>
            </defs>
            <path
              className="oc-chart__area oc-chart__area--gradient"
              style={{ fill: `url(#${uid}-g)` }}
              d={areaPath(pts.map((p) => (p ? { x: p.x, y1: p.y, y0: height - pad } : null)), curve)}
            />
          </>
        )}
        <path className="oc-chart__line" d={linePath(pts, curve)} />
        {showEnd && last && <circle className="oc-sparkline__end" cx={last.x} cy={last.y} r={2.5} />}
      </svg>
    </span>
  );
}

/* =========================================================================================
 * GaugeChart / RadialProgress
 * ========================================================================================= */

export interface GaugeThreshold {
  /** Applies while value ≤ upTo. */
  upTo: number;
  tone: ChartTone;
}

export interface GaugeChartProps {
  title: ReactNode;
  description?: ReactNode;
  value: number;
  min?: number;
  max?: number;
  target?: number;
  targetLabel?: string;
  valueFormat?: ValueFormat;
  /** Color the value arc by range (the value is always printed, so color is not the only cue). */
  thresholds?: ReadonlyArray<GaugeThreshold>;
  /** 'semi' (default) half-circle gauge, or 'radial' full ring. */
  variant?: 'semi' | 'radial';
  /** Diameter in px (default 220 semi / 140 radial). */
  size?: number;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  patterns?: boolean | 'auto';
  summary?: ReactNode;
  showSummary?: boolean;
  table?: ChartTableMode;
  labels?: Partial<ChartLabels>;
  className?: string;
}

function GaugeBody({
  value,
  min,
  max,
  target,
  targetLabel,
  fmt,
  tone,
  variant,
  size,
  valueText,
}: {
  value: number;
  min: number;
  max: number;
  target?: number;
  targetLabel: string;
  fmt: (v: number) => string;
  tone: ChartTone;
  variant: 'semi' | 'radial';
  size: number;
  valueText: string;
}) {
  const { titleId, summaryId, descriptionId, rtl } = useChart();
  const semi = variant === 'semi';
  const thick = Math.max(8, size * 0.11);
  const R = size / 2 - 4;
  const r = R - thick;
  const h = semi ? size / 2 + 8 : size;
  const cxp = size / 2;
  const cyp = semi ? size / 2 : size / 2;
  const span = semi ? Math.PI : Math.PI * 2;
  const start = semi ? -Math.PI / 2 : 0;
  const sign = rtl && !semi ? -1 : 1;
  const frac = (v: number) => Math.min(1, Math.max(0, (v - min) / (max - min || 1)));
  const ang = (v: number) => (semi ? (rtl ? Math.PI / 2 - frac(v) * span : start + frac(v) * span) : sign * frac(v) * span);
  const trackA0 = semi ? -Math.PI / 2 : 0;
  const trackA1 = semi ? Math.PI / 2 : Math.PI * 2;
  const valueA0 = semi ? (rtl ? Math.PI / 2 : -Math.PI / 2) : 0;
  const tp = target != null ? [polar(cxp, cyp, r - 3, ang(target)), polar(cxp, cyp, R + 3, ang(target))] : null;
  return (
    <div
      className={cx('oc-chart-gauge', `oc-chart-gauge--${variant}`)}
      role="meter"
      aria-labelledby={titleId}
      aria-describedby={[descriptionId, summaryId].filter(Boolean).join(' ') || undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
    >
      <svg className="oc-chart__svg oc-chart-gauge__svg" width={size} height={h} viewBox={`0 0 ${size} ${h}`} aria-hidden="true" focusable="false">
        <path className="oc-chart-gauge__track" d={arcPath(cxp, cyp, r, R, trackA0, trackA1)} fillRule="evenodd" />
        {frac(value) > 0 && (
          <path className={cx('oc-chart-gauge__value', `oc-chart-gauge__value--${tone}`)} d={arcPath(cxp, cyp, r, R, valueA0, ang(value))} fillRule="evenodd" />
        )}
        {tp && (
          <g className="oc-chart-gauge__target">
            <line x1={r2(tp[0].x)} y1={r2(tp[0].y)} x2={r2(tp[1].x)} y2={r2(tp[1].y)} />
          </g>
        )}
        <text className="oc-chart-gauge__text" x={cxp} y={semi ? cyp - 6 : cyp} dy={semi ? 0 : '0.32em'} textAnchor="middle">
          {fmt(value)}
        </text>
        {target != null && semi && (
          <text className="oc-chart-gauge__sub" x={cxp} y={cyp + 2} dy="0.9em" textAnchor="middle">
            {targetLabel} {fmt(target)}
          </text>
        )}
      </svg>
    </div>
  );
}

/** Single value against a range and optional target. Exposed as role="meter". */
export function GaugeChart({
  title,
  description,
  value,
  min = 0,
  max = 100,
  target,
  targetLabel = 'Target',
  valueFormat,
  thresholds,
  variant = 'semi',
  size,
  locale,
  dir,
  patterns,
  summary,
  showSummary,
  table = 'none',
  labels,
  className,
}: GaugeChartProps) {
  const fmt = numberFormatter(locale, valueFormat);
  const pct = safeNumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format((value - min) / (max - min || 1));
  const tone = thresholds?.slice().sort((a, b) => a.upTo - b.upTo).find((t) => value <= t.upTo)?.tone ?? 'primary';
  const s = size ?? (variant === 'semi' ? 220 : 140);
  let targetText = '';
  if (target != null) {
    const diff = value - target;
    targetText = ` ${targetLabel} ${fmt(target)}: ${diff === 0 ? 'on target' : `${fmt(Math.abs(diff))} ${diff > 0 ? 'above' : 'below'} target`}.`;
  }
  const valueText = `${fmt(value)} of ${fmt(max)} (${pct})`;
  const text = summary ?? `${valueText}.${targetText}`;
  const l = mergeLabels(labels);
  return (
    <ChartContainer
      title={title}
      description={description}
      summary={text}
      showSummary={showSummary}
      locale={locale}
      dir={dir}
      patterns={patterns}
      table={table}
      labels={labels}
      className={cx('oc-chart--gauge', className)}
      width={s}
      height={variant === 'semi' ? s / 2 + 8 : s}
      tableData={{
        columns: [l.category, l.value],
        rows: [
          { header: l.value, cells: [fmt(value)] },
          { header: 'Min', cells: [fmt(min)] },
          { header: 'Max', cells: [fmt(max)] },
          ...(target != null ? [{ header: targetLabel, cells: [fmt(target)] }] : []),
        ],
      }}
    >
      <GaugeBody value={value} min={min} max={max} target={target} targetLabel={targetLabel} fmt={fmt} tone={tone} variant={variant} size={s} valueText={valueText} />
    </ChartContainer>
  );
}

/** Full-ring progress indicator (GaugeChart variant="radial"). */
export function RadialProgress(props: Omit<GaugeChartProps, 'variant'>) {
  return <GaugeChart {...props} variant="radial" />;
}

/* =========================================================================================
 * Heatmap
 * ========================================================================================= */

export interface HeatmapProps<T> extends BaseChartProps {
  data: ReadonlyArray<T>;
  x: Accessor<T, string>;
  y: Accessor<T, string>;
  value: Accessor<T, number | null | undefined>;
  /** Column / row order (default: order of appearance). */
  xCategories?: ReadonlyArray<string>;
  yCategories?: ReadonlyArray<string>;
  /** Name for a cell in announcements (e.g. a full date). */
  cellLabel?: Accessor<T, string>;
  showValues?: boolean;
  /** Text for the legend ends. */
  lessLabel?: string;
  moreLabel?: string;
  gap?: number;
}

const HEAT_STEPS = 5;

/** Grid of cells shaded in 5 lightness steps (plus empty), e.g. an activity calendar. */
export function Heatmap<T>(props: HeatmapProps<T>) {
  const { data, x, y, value, cellLabel, showValues, locale, valueFormat, gap = 2, lessLabel = 'Less', moreLabel = 'More' } = props;
  const labels = mergeLabels(props.labels);
  const fmt = numberFormatter(locale, valueFormat);
  const cells = data.map((d, i) => ({
    x: String(read(d, i, x)),
    y: String(read(d, i, y)),
    v: (() => {
      const v = read(d, i, value);
      return isNum(v) ? v : null;
    })(),
    name: cellLabel ? String(read(d, i, cellLabel)) : '',
  }));
  const xs = props.xCategories ? [...props.xCategories] : [...new Set(cells.map((c) => c.x))];
  const ys = props.yCategories ? [...props.yCategories] : [...new Set(cells.map((c) => c.y))];
  const lookup = new Map(cells.map((c) => [`${c.y}\u0000${c.x}`, c]));
  const vals = cells.map((c) => c.v).filter(isNum);
  const lo = vals.length ? Math.min(...vals) : 0;
  const hi = vals.length ? Math.max(...vals) : 1;
  const stepOf = (v: number | null) => (v == null ? 0 : hi === lo ? HEAT_STEPS : Math.max(1, Math.ceil(((v - lo) / (hi - lo)) * HEAT_STEPS)));
  const bounds = Array.from({ length: HEAT_STEPS }, (_, k) => [lo + ((hi - lo) * k) / HEAT_STEPS, lo + ((hi - lo) * (k + 1)) / HEAT_STEPS]);
  let maxCell = cells[0];
  for (const c of cells) if (c.v != null && (maxCell?.v == null || c.v > maxCell.v)) maxCell = c;
  const summary =
    props.summary ??
    `Heatmap with ${ys.length} rows and ${xs.length} columns. Values range from ${fmt(lo)} to ${fmt(hi)}${
      maxCell?.v != null ? `; highest ${fmt(maxCell.v)} at ${maxCell.name || `${maxCell.x}, ${maxCell.y}`}` : ''
    }. Total ${fmt(vals.reduce((a, b) => a + b, 0))}.`;
  const table: ChartTableData = {
    columns: [labels.category, ...xs],
    rows: ys.map((row) => ({
      header: row,
      cells: xs.map((col) => {
        const c = lookup.get(`${row}\u0000${col}`);
        return c?.v == null ? labels.noData : fmt(c.v);
      }),
    })),
  };
  const legend =
    props.legend === false ? undefined : (
      <div className="oc-chart-legend oc-chart-legend--scale">
        <span className="oc-chart-legend__label">{lessLabel}</span>
        <ul className="oc-chart-legend__list" aria-label={labels.legend}>
          {bounds.map(([a, b], k) => (
            <li key={k} className="oc-chart-legend__item">
              <svg className="oc-chart-legend__swatch" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                <rect className={cx('oc-chart__cell', `oc-chart__cell--${k + 1}`)} width="12" height="12" rx="2" />
              </svg>
              <span className="oc-sr-only">
                {fmt(a)}–{fmt(b)}
              </span>
            </li>
          ))}
        </ul>
        <span className="oc-chart-legend__label">{moreLabel}</span>
      </div>
    );
  return (
    <ChartContainer
      {...containerProps(props)}
      height={props.height ?? Math.max(120, ys.length * 26 + 44)}
      margin={mergeMargin({ start: 56, bottom: 28, top: 8, end: 8 }, props.margin)}
      summary={summary}
      tableData={table}
      legend={legend}
      legendPosition={props.legend === 'top' ? 'top' : 'bottom'}
    >
      {(frame) => {
        const bx = bandScale(xs, hRange(frame), { paddingInner: 0, paddingOuter: 0 });
        const by = bandScale(ys, [0, frame.innerHeight], { paddingInner: 0, paddingOuter: 0 });
        const pts = ys.map((row) =>
          xs.map((col) => {
            const c = lookup.get(`${row}\u0000${col}`);
            if (!c) return null;
            return {
              x: bx.center(col),
              y: by.center(row),
              title: c.name || col,
              series: c.name ? '' : row,
              value: c.v == null ? labels.noData : fmt(c.v),
            };
          }),
        );
        return (
          <ChartPlot points={pts}>
            <g className="oc-chart__heat">
              {ys.map((row) =>
                xs.map((col) => {
                  const c = lookup.get(`${row}\u0000${col}`);
                  if (!c) return null;
                  const k = stepOf(c.v);
                  const w = Math.max(1, bx.bandwidth - gap);
                  const h = Math.max(1, by.bandwidth - gap);
                  return (
                    <g key={`${row}-${col}`}>
                      <rect className={cx('oc-chart__cell', k > 0 && `oc-chart__cell--${k}`)} x={r2(bx(col) + gap / 2)} y={r2(by(row) + gap / 2)} width={r2(w)} height={r2(h)} rx={2} />
                      {showValues && c.v != null && w > 18 && h > 12 && (
                        <text className={cx('oc-chart__cell-text', k >= 4 && 'oc-chart__cell-text--on')} x={bx.center(col)} y={by.center(row)} dy="0.32em" textAnchor="middle">
                          {compactFormatter(locale)(c.v)}
                        </text>
                      )}
                    </g>
                  );
                }),
              )}
            </g>
            <Axis scale={bx} position="bottom" tickSize={0} className="oc-chart-axis--bare" />
            <Axis scale={by} position="start" tickSize={0} className="oc-chart-axis--bare" />
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

export interface CalendarCell {
  date: Date;
  /** Column: week start label. */
  week: string;
  /** Row: weekday name. */
  weekday: string;
  /** Full date label for announcements. */
  label: string;
  value: number | null;
}

/**
 * Turns dated values into an activity-calendar grid for `Heatmap`:
 * `<Heatmap data={cal.data} x="week" y="weekday" value="value" cellLabel="label" xCategories={cal.xCategories} yCategories={cal.yCategories} />`.
 */
export function calendarHeatmapData(
  entries: ReadonlyArray<{ date: Date; value: number }>,
  { locale, weekStartsOn = 0 }: { locale?: string; weekStartsOn?: 0 | 1 | 6 } = {},
): { data: CalendarCell[]; xCategories: string[]; yCategories: string[] } {
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const sums = new Map<string, number>();
  for (const e of entries) sums.set(dayKey(e.date), (sums.get(dayKey(e.date)) ?? 0) + e.value);
  const wd = safeDateFormat(locale, { weekday: 'short' });
  const wk = safeDateFormat(locale, { month: 'short', day: 'numeric' });
  const full = safeDateFormat(locale, { dateStyle: 'medium' });
  const yCategories = Array.from({ length: 7 }, (_, k) => wd.format(new Date(2023, 0, 1 /* a Sunday */ + ((weekStartsOn + k) % 7))));
  if (!entries.length) return { data: [], xCategories: [], yCategories };
  const times = entries.map((e) => new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate()).getTime());
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  const start = new Date(first);
  start.setDate(start.getDate() - ((start.getDay() - weekStartsOn + 7) % 7));
  const data: CalendarCell[] = [];
  const xCategories: string[] = [];
  for (let d = new Date(start), guard = 0; d <= last && guard < 4000; d.setDate(d.getDate() + 1), guard++) {
    const offset = (d.getDay() - weekStartsOn + 7) % 7;
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - offset);
    const week = wk.format(weekStart);
    if (offset === 0 || !xCategories.length) xCategories.push(week);
    const day = new Date(d);
    data.push({ date: day, week, weekday: yCategories[offset], label: full.format(day), value: day < first ? null : sums.get(dayKey(day)) ?? 0 });
  }
  return { data, xCategories, yCategories };
}

/* =========================================================================================
 * WaterfallChart — example custom chart built only from the public primitives above.
 * ========================================================================================= */

export interface WaterfallDatum {
  label: string;
  /** Change (positive / negative), or the running total when `total` is true. */
  value: number;
  /** Render as a total bar from zero (e.g. "Net"). The running value is reset to `value`. */
  total?: boolean;
}

export interface WaterfallChartProps {
  title: ReactNode;
  description?: ReactNode;
  data: ReadonlyArray<WaterfallDatum>;
  locale?: string;
  valueFormat?: ValueFormat;
  height?: number;
  patterns?: boolean | 'auto';
  dir?: 'ltr' | 'rtl';
  increaseLabel?: string;
  decreaseLabel?: string;
  totalLabel?: string;
  className?: string;
}

/**
 * Waterfall (bridge) chart. Built purely with ChartContainer, ChartPlot, bandScale, linearScale,
 * Gridlines, BarSeries, ReferenceLine, Axis and Legend — use it as a template for your own charts.
 */
export function WaterfallChart({
  title,
  description,
  data,
  locale,
  valueFormat,
  height,
  patterns,
  dir,
  increaseLabel = 'Increase',
  decreaseLabel = 'Decrease',
  totalLabel = 'Total',
  className,
}: WaterfallChartProps) {
  const fmt = numberFormatter(locale, valueFormat);
  // 1. Data → running segments.
  let run = 0;
  const steps = data.map((d) => {
    const from = d.total ? 0 : run;
    const to = d.total ? d.value : run + d.value;
    run = to;
    const kind: 'total' | 'up' | 'down' = d.total ? 'total' : d.value >= 0 ? 'up' : 'down';
    return { ...d, from, to, kind };
  });
  const extent = steps.flatMap((s) => [s.from, s.to]);
  const ups = steps.filter((s) => s.kind === 'up');
  const downs = steps.filter((s) => s.kind === 'down');
  const biggest = (list: typeof steps) => list.reduce<(typeof steps)[number] | null>((a, b) => (!a || Math.abs(b.value) > Math.abs(a.value) ? b : a), null);
  const bu = biggest(ups);
  const bd = biggest(downs);
  // 2. Text alternative + table.
  const summary = `Waterfall chart with ${steps.length} steps, ending at ${fmt(run)}.${bu ? ` Largest increase: ${bu.label} (+${fmt(bu.value)}).` : ''}${
    bd ? ` Largest decrease: ${bd.label} (${fmt(bd.value)}).` : ''
  }`;
  const kindText = { up: increaseLabel, down: decreaseLabel, total: totalLabel };
  const tableData: ChartTableData = {
    columns: ['Step', 'Change', 'Running total'],
    rows: steps.map((s) => ({ header: s.label, cells: [s.kind === 'total' ? kindText.total : fmt(s.value), fmt(s.to)] })),
  };
  const palette = { total: { si: 0 }, up: { si: 1, color: 'var(--oc-success)' }, down: { si: 2, color: 'var(--oc-danger)' } };
  return (
    <ChartContainer
      title={title}
      description={description}
      summary={summary}
      tableData={tableData}
      locale={locale}
      height={height}
      patterns={patterns}
      dir={dir}
      className={className}
      legend={
        <Legend
          items={[
            { label: increaseLabel, seriesIndex: 1, color: palette.up.color },
            { label: decreaseLabel, seriesIndex: 2, color: palette.down.color },
            { label: totalLabel, seriesIndex: 0 },
          ]}
        />
      }
    >
      {(frame) => {
        // 3. Scales for the measured frame (RTL-aware range).
        const keys = steps.map((_, i) => String(i));
        const x = bandScale(keys, frame.rtl ? [frame.innerWidth, 0] : [0, frame.innerWidth], { paddingInner: 0.3, paddingOuter: 0.15 });
        const y = linearScale([Math.min(0, ...extent), Math.max(0, ...extent)], [frame.innerHeight, 0], { nice: true });
        // 4. Geometry + navigable points.
        const bars: BarRect[] = steps.map((s, i) => ({
          key: i,
          x: x(keys[i]),
          y: Math.min(y(s.from), y(s.to)),
          width: x.bandwidth,
          height: Math.max(1, Math.abs(y(s.to) - y(s.from))),
          seriesIndex: palette[s.kind].si,
          color: s.kind === 'total' ? undefined : palette[s.kind].color,
        }));
        const points: ChartPoint[][] = [
          steps.map((s, i) => ({
            x: x.center(keys[i]),
            y: y(s.to),
            title: s.label,
            series: kindText[s.kind],
            value: s.kind === 'total' ? fmt(s.to) : `${s.value >= 0 ? '+' : ''}${fmt(s.value)} → ${fmt(s.to)}`,
          })),
        ];
        return (
          <ChartPlot points={points}>
            <Gridlines scale={y} orientation="horizontal" />
            {steps.slice(0, -1).map((s, i) => {
              const a = x(keys[i]);
              const b = x(keys[i + 1]);
              return (
                <line
                  key={`c${i}`}
                  className="oc-chart__connector"
                  x1={frame.rtl ? a : a + x.bandwidth}
                  x2={frame.rtl ? b + x.bandwidth : b}
                  y1={y(s.to)}
                  y2={y(s.to)}
                />
              );
            })}
            <BarSeries bars={bars} />
            <ReferenceLine y={y(0)} dashed={false} className="oc-chart-ref--baseline" />
            <Axis scale={x} position="bottom" format={(k: string) => steps[Number(k)]?.label ?? k} />
            <Axis scale={y} position="start" />
          </ChartPlot>
        );
      }}
    </ChartContainer>
  );
}

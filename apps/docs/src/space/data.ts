/** Parsing helpers for the plain-text data the inspector edits (one item per line, cells split by "|"). */

export function lines(value: unknown): string[] {
  return String(value ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export function cells(line: string): string[] {
  const sep = line.includes('|') ? '|' : ',';
  return line.split(sep).map((c) => c.trim());
}

export function rows(value: unknown): string[][] {
  return lines(value).map(cells);
}

/** "$1,240.50" → 1240.5; "12%" → 12; "١٢" → 12. NaN when not numeric. */
export function toNumber(raw: string): number {
  const western = raw.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const cleaned = western.replace(/[^0-9.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return NaN;
  return Number(cleaned);
}

export function isNumericCell(raw: string): boolean {
  return /\d/.test(raw) && !Number.isNaN(toNumber(raw)) && !/[a-z]{3,}/i.test(raw.replace(/usd|eur|sar|jod|aed/gi, ''));
}

export function slug(text: string, fallback = 'item'): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || fallback;
}

/** camelCase identifier for generated code ("Monthly revenue" → "monthlyRevenue"). */
export function ident(text: string, fallback: string): string {
  const parts = text
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  if (!parts.length || /^\d/.test(parts[0])) return fallback;
  return parts.map((p, i) => (i === 0 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1).toLowerCase())).join('');
}

export interface ChartModel {
  series: { key: string; label: string }[];
  data: Record<string, string | number>[];
}

export function chartModel(dataText: unknown, seriesText: unknown): ChartModel {
  const labels = cells(lines(seriesText)[0] ?? 'Value');
  const series = labels.map((label, i) => ({ key: `s${i}`, label: label || `Series ${i + 1}` }));
  const data = rows(dataText).map((r) => {
    const row: Record<string, string | number> = { label: r[0] ?? '' };
    series.forEach((s, i) => {
      const n = toNumber(r[i + 1] ?? '');
      row[s.key] = Number.isNaN(n) ? 0 : n;
    });
    return row;
  });
  return { series, data };
}

const STATUS_TONE: Array<[RegExp, 'success' | 'warning' | 'danger' | 'info']> = [
  [/^(paid|active|shipped|done|complete|completed|approved|online|delivered|مدفوع|نشط|مكتمل|تم الشحن|تم التوصيل)$/i, 'success'],
  [/^(pending|processing|draft|invited|review|in review|on hold|قيد المعالجة|معلق|مسودة|قيد المراجعة)$/i, 'warning'],
  [/^(failed|refunded|cancelled|canceled|overdue|blocked|offline|declined|فشل|مسترد|ملغي|متأخر)$/i, 'danger'],
  [/^(new|trial|beta|جديد|تجريبي)$/i, 'info'],
];

export function statusTone(value: string): 'success' | 'warning' | 'danger' | 'info' | null {
  for (const [re, tone] of STATUS_TONE) if (re.test(value.trim())) return tone;
  return null;
}

/** Self-contained SVG placeholder "photo" (no network). */
export function placeholderImage(label: string, hue: number, ratio = '16/9'): string {
  const [rw, rh] = ratio.split('/').map((n) => Number(n) || 1);
  const w = 800;
  const h = Math.round((w * rh) / rw);
  const h2 = (hue + 40) % 360;
  const safe = label.replace(/[<>&"']/g, '');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 62%)"/><stop offset="1" stop-color="hsl(${h2} 60% 34%)"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<circle cx="${w * 0.78}" cy="${h * 0.28}" r="${h * 0.12}" fill="hsl(${hue} 90% 88%)" opacity=".85"/>` +
    `<path d="M0 ${h * 0.75} Q ${w * 0.25} ${h * 0.5} ${w * 0.5} ${h * 0.68} T ${w} ${h * 0.6} V${h} H0Z" fill="hsl(${h2} 45% 28%)" opacity=".9"/>` +
    `<path d="M0 ${h * 0.86} Q ${w * 0.3} ${h * 0.7} ${w * 0.62} ${h * 0.84} T ${w} ${h * 0.8} V${h} H0Z" fill="hsl(${h2} 50% 18%)"/>` +
    (safe ? `<text x="32" y="${h - 32}" font-family="system-ui,sans-serif" font-size="30" font-weight="600" fill="#fff" opacity=".92">${safe}</text>` : '') +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

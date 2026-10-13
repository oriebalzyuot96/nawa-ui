/**
 * Code export for the composed page: React (TSX), Vue 3 SFC, Angular standalone component and plain HTML.
 * Each target is built from a tiny element tree (IR) so attribute/escape rules live in one renderer.
 * Vue and Angular use their Pelagic UI packages where the component exists; otherwise the node is exported
 * as static `pl-` markup with a comment, so the page still renders with pelagic.css.
 */
import { cells, chartModel, ident, isNumericCell, lines, rows, slug, toNumber } from './data';
import { cardBodyStyle, cssText, gridStyle, headingStyle, sectionInner, sectionOuter, spacerStyle, stackStyle, textStyle, type Css } from './styles';
import type { SpaceDoc, SpaceNode } from './types';

export type Target = 'react' | 'vue' | 'angular' | 'html';

export const TARGETS: { id: Target; label: string; file: (base: string) => string; lang: string }[] = [
  { id: 'react', label: 'React', file: (b) => `${pascal(b)}.tsx`, lang: 'tsx' },
  { id: 'vue', label: 'Vue 3', file: (b) => `${pascal(b)}.vue`, lang: 'vue' },
  { id: 'angular', label: 'Angular', file: (b) => `${slug(b, 'page')}.component.ts`, lang: 'ts' },
  { id: 'html', label: 'HTML', file: (b) => `${slug(b, 'page')}.html`, lang: 'html' },
];

/* ---------------- IR ---------------- */

type AttrValue = string | number | boolean | undefined | { expr: string } | Css;
interface El {
  tag: string;
  attrs?: Record<string, AttrValue>;
  children?: Child[];
  /** React Tabs: items whose content is JSX, rendered with proper indentation. */
  jsxTabs?: Array<{ key: string; label: string; content: Child | null }>;
}
type Child = El | { text: string } | { comment: string };

const el = (tag: string, attrs: Record<string, AttrValue> = {}, children: Child[] = []): El => ({ tag, attrs, children });
const txt = (text: string): Child => ({ text });
const note = (comment: string): Child => ({ comment });
const expr = (e: string) => ({ expr: e });

interface Ctx {
  target: Target;
  imports: Set<string>;
  consts: Array<{ name: string; code: string }>;
  states: Array<{ name: string; initial: boolean }>;
  names: Set<string>;
  notes: Set<string>;
  uid: number;
  usesToast: boolean;
}

function uniqueName(ctx: Ctx, base: string): string {
  let name = base;
  let i = 2;
  while (ctx.names.has(name)) name = `${base}${i++}`;
  ctx.names.add(name);
  return name;
}

/** JS literal (single quotes, unquoted keys) for generated constants. */
function lit(value: unknown, indent = ''): string {
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const inner = value.map((v) => `${indent}  ${lit(v, `${indent}  `)},`).join('\n');
    return `[\n${inner}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const parts = Object.entries(value as Record<string, unknown>).map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${lit(v, indent)}`);
    return `{ ${parts.join(', ')} }`;
  }
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return String(value);
}

function addConst(ctx: Ctx, base: string, value: unknown): string {
  const name = uniqueName(ctx, base);
  ctx.consts.push({ name, code: lit(value) });
  return name;
}

/* ---------------- Shared data shaping ---------------- */

function tableData(p: SpaceNode['props']) {
  const head = cells(lines(p.columns)[0] ?? 'Name');
  const body = rows(p.rows);
  const used = new Set<string>();
  const keys = head.map((h, i) => {
    let k = ident(h, `col${i + 1}`);
    while (used.has(k)) k += '_';
    used.add(k);
    return k;
  });
  const numeric = head.map((_, c) => body.length > 0 && body.every((r) => !r[c] || isNumericCell(r[c])));
  const columns = head.map((label, i) => ({ key: keys[i], label, sortable: true, ...(numeric[i] ? { align: 'end' } : {}) }));
  const data = body.map((r, i) => ({ id: i + 1, ...Object.fromEntries(keys.map((k, c) => [k, r[c] ?? ''])) }));
  return { head, keys, columns, data, body };
}

function chartData(p: SpaceNode['props']) {
  const { series, data } = chartModel(p.data, p.series);
  const used = new Set<string>(['label']);
  const keys = series.map((s, i) => {
    let k = ident(s.label, `series${i + 1}`);
    while (used.has(k)) k += '_';
    used.add(k);
    return k;
  });
  const rowsOut = data.map((d) => ({ label: String(d.label), ...Object.fromEntries(series.map((s, i) => [keys[i], Number(d[s.key]) || 0])) }));
  return { series: series.map((s, i) => ({ key: keys[i], label: s.label })), data: rowsOut };
}

const S = (v: unknown, f = '') => (v === undefined || v === null || v === '' ? f : String(v));
const N = (v: unknown, f: number) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : f);
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const EYEBROW: Css = { margin: '0 0 0.5rem', color: 'var(--pl-primary-ink)', fontSize: 'var(--pl-text-xs)', fontWeight: 700, letterSpacing: 'var(--pl-tracking-caps)', textTransform: 'uppercase' };
const STAT_LABEL: Css = { margin: 0, color: 'var(--pl-text-muted)', fontSize: 'var(--pl-text-sm)', fontWeight: 600 };
const STAT_VALUE: Css = { margin: '0.25rem 0 0.5rem', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' };
const ROW: Css = { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' };
const MUTED_SM: Css = { color: 'var(--pl-text-muted)', fontSize: 'var(--pl-text-sm)' };

/* ---------------- Plain HTML (also the Vue/Angular fallback) ---------------- */

function fieldId(ctx: Ctx, label: string) {
  ctx.uid += 1;
  return `${slug(label, 'field')}-${ctx.uid}`;
}

function plain(n: SpaceNode, ctx: Ctx, kids: () => Child[]): Child[] {
  const p = n.props;
  switch (n.type) {
    case 'card':
      return [
        el('article', { class: 'pl-card' }, [
          ...(S(p.title) ? [el('header', { class: 'pl-card__header' }, [txt(S(p.title))])] : []),
          el('div', { class: 'pl-card__body', style: cardBodyStyle(p) }, kids()),
        ]),
      ];
    case 'divider':
      return [el('hr', { class: 'pl-divider' })];
    case 'badge':
      return [el('span', { class: `pl-badge${p.variant && p.variant !== 'neutral' ? ` pl-badge--${p.variant}` : ''}` }, [txt(S(p.text))])];
    case 'input': {
      const id = fieldId(ctx, S(p.label));
      return [
        el('div', { class: 'pl-field' }, [
          el('label', { class: 'pl-label', for: id }, [txt(S(p.label))]),
          el('input', { id, class: 'pl-input', type: S(p.type, 'text'), placeholder: S(p.placeholder) || undefined, 'aria-describedby': S(p.hint) ? `${id}-hint` : undefined }),
          ...(S(p.hint) ? [el('span', { id: `${id}-hint`, class: 'pl-hint' }, [txt(S(p.hint))])] : []),
        ]),
      ];
    }
    case 'select': {
      const id = fieldId(ctx, S(p.label));
      return [
        el('div', { class: 'pl-field' }, [
          el('label', { class: 'pl-label', for: id }, [txt(S(p.label))]),
          el('select', { id, class: 'pl-select' }, [
            ...(S(p.placeholder) ? [el('option', { value: '' }, [txt(S(p.placeholder))])] : []),
            ...lines(p.options).map((o) => el('option', {}, [txt(o)])),
          ]),
        ]),
      ];
    }
    case 'checkbox':
    case 'captcha':
      return [
        ...(n.type === 'captcha' ? [note(`Captcha placeholder: replace with your provider's widget (${S(p.provider, 'Turnstile, hCaptcha or reCAPTCHA')}).`)] : []),
        el('label', { class: 'pl-check' }, [el('input', { type: 'checkbox', checked: n.type === 'checkbox' && Boolean(p.checked) }), txt(S(p.label))]),
      ];
    case 'switch': {
      const id = fieldId(ctx, S(p.label));
      return [
        el('span', { class: 'pl-check' }, [
          el('button', { id, type: 'button', role: 'switch', class: 'pl-switch', 'aria-checked': p.checked ? 'true' : 'false', 'aria-labelledby': `${id}-label` }),
          el('span', { id: `${id}-label` }, [txt(S(p.label))]),
        ]),
      ];
    }
    case 'datepicker': {
      const id = fieldId(ctx, S(p.label));
      return [el('div', { class: 'pl-field' }, [el('label', { class: 'pl-label', for: id }, [txt(S(p.label))]), el('input', { id, class: 'pl-input', type: 'date' })])];
    }
    case 'otp': {
      const len = N(p.length, 6);
      return [
        el('div', { class: 'pl-field' }, [
          el('span', { class: 'pl-label', id: `${slug(S(p.label), 'otp')}-label` }, [txt(S(p.label))]),
          el('div', { role: 'group', 'aria-labelledby': `${slug(S(p.label), 'otp')}-label`, style: { display: 'flex', gap: '0.5rem' } }, Array.from({ length: len }, (_, i) =>
            el('input', { class: 'pl-input', inputmode: 'numeric', maxlength: 1, autocomplete: i === 0 ? 'one-time-code' : 'off', 'aria-label': `Digit ${i + 1} of ${len}`, style: { inlineSize: '3rem', textAlign: 'center' } }),
          )),
        ]),
      ];
    }
    case 'button': {
      const cls = ['pl-btn', `pl-btn--${S(p.variant, 'primary')}`, p.size && p.size !== 'md' ? `pl-btn--${p.size}` : '', p.block ? 'pl-btn--block' : ''].filter(Boolean).join(' ');
      return [el('button', { type: 'button', class: cls }, [txt(S(p.text))])];
    }
    case 'toast':
      return [note(`Shows a "${S(p.variant)}" toast: "${S(p.message)}". Wire it to your toast system.`), el('button', { type: 'button', class: `pl-btn pl-btn--${S(p.buttonVariant, 'secondary')}` }, [txt(S(p.text))])];
    case 'table': {
      const t = tableData(p);
      return [
        el('div', { class: 'pl-table-wrap' }, [
          el('table', { class: 'pl-table' }, [
            el('caption', { class: p.showCaption ? undefined : 'pl-sr-only' }, [txt(S(p.caption, 'Table'))]),
            el('thead', {}, [el('tr', {}, t.columns.map((c) => el('th', { scope: 'col', class: c.align ? 'pl-table__align-end' : undefined }, [txt(c.label)])))]),
            el('tbody', {}, t.body.map((r) => el('tr', {}, t.columns.map((c, i) => el('td', { class: c.align ? 'pl-table__align-end' : undefined }, [txt(r[i] ?? '')]))))),
          ]),
        ]),
      ];
    }
    case 'stat':
      return [
        el('article', { class: 'pl-card' }, [
          el('div', { class: 'pl-card__body' }, [
            el('p', { style: STAT_LABEL }, [txt(S(p.label))]),
            el('p', { style: STAT_VALUE }, [txt(S(p.value))]),
            el('div', { style: ROW }, [
              ...(S(p.delta) ? [el('span', { class: `pl-badge pl-badge--${/^[-−]/.test(S(p.delta)) ? 'danger' : 'success'}` }, [txt(S(p.delta))])] : []),
              ...(S(p.period) ? [el('span', { style: MUTED_SM }, [txt(S(p.period))])] : []),
            ]),
          ]),
        ]),
      ];
    case 'chart': {
      const c = chartData(p);
      return [
        note(`Chart "${S(p.title)}": interactive charts ship in @pelagic-ui/react; this is the accessible data table.`),
        el('figure', { style: { margin: 0 } }, [
          el('figcaption', { style: { fontWeight: 600, marginBlockEnd: '0.5rem' } }, [txt(S(p.title))]),
          el('div', { class: 'pl-table-wrap' }, [
            el('table', { class: 'pl-table' }, [
              el('thead', {}, [el('tr', {}, [el('th', { scope: 'col' }, [txt('')]), ...c.series.map((s) => el('th', { scope: 'col', class: 'pl-table__align-end' }, [txt(s.label)]))])]),
              el('tbody', {}, c.data.map((d) => el('tr', {}, [el('th', { scope: 'row' }, [txt(d.label)]), ...c.series.map((s) => el('td', { class: 'pl-table__align-end' }, [txt(String((d as Record<string, unknown>)[s.key]))]))]))),
            ]),
          ]),
        ]),
      ];
    }
    case 'timeline':
      return [
        el('ol', { class: 'pl-timeline' }, rows(p.items).map((r) =>
          el('li', { class: 'pl-timeline__item' }, [
            el('span', { class: 'pl-timeline__dot', 'aria-hidden': 'true' }),
            ...(r[2] ? [el('div', { class: 'pl-timeline__time' }, [txt(r[2])])] : []),
            el('div', { class: 'pl-timeline__title' }, [txt(r[0])]),
            ...(r[1] ? [el('div', { class: 'pl-timeline__desc' }, [txt(r[1])])] : []),
          ]),
        )),
      ];
    case 'progress': {
      const v = N(p.value, 0);
      return [
        el('div', { style: { display: 'grid', gap: '0.375rem' } }, [
          el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--pl-text-sm)', fontWeight: 600 } }, [el('span', {}, [txt(S(p.label))]), el('span', {}, [txt(`${v}%`)])]),
          el('div', { role: 'progressbar', class: 'pl-progress', 'aria-label': S(p.label, 'Progress'), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': v }, [el('div', { class: 'pl-progress__bar', style: { width: `${v}%` } })]),
        ]),
      ];
    }
    case 'alert': {
      const urgent = p.variant === 'danger' || p.variant === 'warning';
      return [
        el('div', { role: urgent ? 'alert' : 'status', class: `pl-alert${p.variant && p.variant !== 'info' ? ` pl-alert--${p.variant}` : ''}` }, [
          el('div', { class: 'pl-alert__body' }, [...(S(p.title) ? [el('div', { class: 'pl-alert__title' }, [txt(S(p.title))])] : []), txt(S(p.text))]),
        ]),
      ];
    }
    case 'empty':
      return [
        el('div', { class: `pl-empty${p.size && p.size !== 'default' ? ` pl-empty--${p.size}` : ''}` }, [
          el('div', { class: 'pl-empty__inner' }, [
            ...(S(p.icon) ? [el('div', { class: 'pl-empty__icon', 'aria-hidden': 'true' }, [txt(S(p.icon))])] : []),
            el('div', { class: 'pl-empty__body' }, [
              el('h3', { class: 'pl-empty__title' }, [txt(S(p.title))]),
              ...(S(p.description) ? [el('p', { class: 'pl-empty__desc' }, [txt(S(p.description))])] : []),
              el('div', { class: 'pl-empty__actions pl-empty__action' }, [
                ...(S(p.action) ? [el('button', { type: 'button', class: 'pl-btn pl-btn--primary' }, [txt(S(p.action))])] : []),
                ...(S(p.secondary) ? [el('button', { type: 'button', class: 'pl-btn pl-btn--ghost' }, [txt(S(p.secondary))])] : []),
              ]),
            ]),
          ]),
        ]),
      ];
    case 'skeleton':
      return [
        el('div', { role: 'status', 'aria-busy': 'true', class: 'pl-skeleton-text' }, [
          el('span', { class: 'pl-sr-only' }, [txt('Loading…')]),
          ...Array.from({ length: N(p.lines, 3) }, () => el('span', { class: 'pl-skeleton', 'aria-hidden': 'true', style: { height: '12px' } })),
        ]),
      ];
    case 'tabs': {
      const labels = lines(p.labels);
      const panels = kids();
      const base = slug(labels[0] ?? 'tabs', 'tabs');
      return [
        note('Tabs: add a small script (or use a framework package) to switch panels with arrow keys.'),
        el('div', { class: 'pl-tabs' }, [
          el('div', { role: 'tablist', class: 'pl-tabs__list' }, (n.children ?? []).map((_, i) =>
            el('button', { type: 'button', role: 'tab', id: `${base}-tab-${i}`, class: 'pl-tabs__tab', 'aria-selected': i === 0 ? 'true' : 'false', 'aria-controls': `${base}-panel-${i}`, tabindex: i === 0 ? 0 : -1 }, [txt(labels[i] ?? `Tab ${i + 1}`)]),
          )),
          ...(n.children ?? []).map((_, i) => el('div', { role: 'tabpanel', id: `${base}-panel-${i}`, 'aria-labelledby': `${base}-tab-${i}`, class: 'pl-tabs__panel', hidden: i !== 0 }, [panels[i]].filter(Boolean) as Child[])),
        ]),
      ];
    }
    case 'breadcrumb': {
      const items = lines(p.items);
      return [
        el('nav', { 'aria-label': 'Breadcrumb' }, [
          el('ol', { class: 'pl-breadcrumb' }, items.map((it, i) =>
            el('li', { class: 'pl-breadcrumb__item', 'aria-current': i === items.length - 1 ? 'page' : undefined }, [i === items.length - 1 ? txt(it) : el('a', { href: '#' }, [txt(it)])]),
          )),
        ]),
      ];
    }
    case 'stepper': {
      const cur = N(p.current, 1) - 1;
      return [
        el('ol', { class: 'pl-stepper' }, lines(p.steps).map((s, i) =>
          el('li', { class: 'pl-stepper__step', 'data-state': i < cur ? 'complete' : i === cur ? 'current' : 'upcoming', 'aria-current': i === cur ? 'step' : undefined }, [el('span', {}, [txt(s)])]),
        )),
      ];
    }
    case 'accordion':
      return [
        el('div', { class: 'pl-accordion' }, rows(p.items).map((r, i) =>
          el('details', { class: 'pl-accordion__item', open: i === 0 }, [el('summary', { class: 'pl-accordion__trigger' }, [txt(r[0])]), el('div', { class: 'pl-accordion__panel' }, [el('p', { style: { margin: 0 } }, [txt(r[1] ?? '')])])]),
        )),
      ];
    case 'avatar': {
      const size = S(p.size, 'md');
      const av = el('span', { class: `pl-avatar${size !== 'md' ? ` pl-avatar--${size}` : ''}`, role: 'img', 'aria-label': S(p.name) }, [txt(initials(S(p.name, 'User')))]);
      if (!p.showName) return [av];
      return [el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '0.75rem' } }, [av, el('span', { style: { display: 'grid' } }, [el('strong', {}, [txt(S(p.name))]), ...(S(p.subtitle) ? [el('span', { style: MUTED_SM }, [txt(S(p.subtitle))])] : [])])])];
    }
    case 'carousel':
      return [
        note('Carousel: interactive in @pelagic-ui/react; exported here as a scrollable list.'),
        el('ul', { 'aria-label': S(p.label, 'Gallery'), style: { display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(14rem, 1fr)', gap: '1rem', overflowX: 'auto', listStyle: 'none', margin: 0, padding: 0 } }, rows(p.items).map((r) =>
          el('li', {}, [el('figure', { class: 'pl-card', style: { margin: 0, overflow: 'hidden' } }, [el('img', { src: `/images/${slug(r[0], 'slide')}.jpg`, alt: r[0], style: { display: 'block', width: '100%', aspectRatio: '3 / 2', objectFit: 'cover' } }), el('figcaption', { style: { display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem' } }, [el('strong', {}, [txt(r[0])]), el('span', { style: MUTED_SM }, [txt(r[1] ?? '')])])])]),
        )),
      ];
    default:
      return common(n, ctx, kids) ?? [];
  }
}

/** Layout and typography: identical plain elements in every target. */
function common(n: SpaceNode, _ctx: Ctx, kids: () => Child[]): Child[] | null {
  const p = n.props;
  switch (n.type) {
    case 'section':
      return [el('section', { style: sectionOuter(p), 'data-theme': p.tone === 'inverse' ? 'dark' : undefined }, [el('div', { style: sectionInner(p) }, kids())])];
    case 'grid':
      return [el('div', { style: gridStyle(p) }, kids())];
    case 'stack':
      return [el('div', { style: stackStyle(p) }, kids())];
    case 'spacer':
      return [el('div', { style: spacerStyle(p), 'aria-hidden': 'true' })];
    case 'heading': {
      const level = Math.min(4, Math.max(1, N(p.level, 2)));
      const h = el(`h${level}`, { style: headingStyle(p) }, [txt(S(p.text))]);
      if (!S(p.eyebrow)) return [h];
      return [el('div', { style: { textAlign: S(p.align, 'start') } }, [el('p', { style: EYEBROW }, [txt(S(p.eyebrow))]), h])];
    }
    case 'text':
      return [el('p', { style: textStyle(p) }, [txt(S(p.text))])];
    case 'list': {
      const check = p.marker === 'check';
      return [
        el('ul', { style: check ? { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' } : { margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.375rem' } }, lines(p.items).map((it) =>
          el('li', check ? { style: { display: 'flex', gap: '0.5rem' } } : {}, check ? [el('span', { 'aria-hidden': 'true', style: { color: 'var(--pl-success)', fontWeight: 700 } }, [txt('✓')]), txt(it)] : [txt(it)]),
        )),
      ];
    }
    case 'image':
      return [
        el('figure', { style: { margin: 0 } }, [
          el('img', { src: `/images/${slug(S(p.alt), 'image')}.jpg`, alt: S(p.alt), style: { display: 'block', width: '100%', aspectRatio: S(p.ratio, '16/9').replace('/', ' / '), objectFit: 'cover', borderRadius: 'var(--pl-radius-lg)' } }),
          ...(S(p.caption) ? [el('figcaption', { style: { ...MUTED_SM, marginBlockStart: '0.5rem' } }, [txt(S(p.caption))])] : []),
        ]),
      ];
    default:
      return null;
  }
}

/* ---------------- React ---------------- */

function react(n: SpaceNode, ctx: Ctx, kids: () => Child[]): Child[] {
  const p = n.props;
  const use = (...names: string[]) => names.forEach((x) => ctx.imports.add(x));
  switch (n.type) {
    case 'card':
      use('Card');
      return [el('Card', { title: S(p.title) || undefined }, [el('div', { style: cardBodyStyle(p) }, kids())])];
    case 'divider':
      use('Divider');
      return [el('Divider')];
    case 'badge':
      use('Badge');
      return [el('Badge', { variant: S(p.variant) !== 'neutral' ? S(p.variant) : undefined }, [txt(S(p.text))])];
    case 'input':
      use('Input');
      return [el('Input', { label: S(p.label), type: S(p.type, 'text'), placeholder: S(p.placeholder) || undefined, hint: S(p.hint) || undefined })];
    case 'select': {
      use('Select');
      const opts = addConst(ctx, `${ident(S(p.label), 'select')}Options`, lines(p.options).map((o) => ({ label: o, value: slug(o, o) })));
      return [el('Select', { label: S(p.label), placeholder: S(p.placeholder) || undefined, options: expr(opts) })];
    }
    case 'checkbox':
      use('Checkbox');
      return [el('Checkbox', { label: S(p.label), defaultChecked: Boolean(p.checked) || undefined })];
    case 'captcha':
      use('Checkbox');
      return [note(`Captcha placeholder: render your provider's widget here (${S(p.provider, 'Turnstile, hCaptcha or reCAPTCHA')}).`), el('Checkbox', { label: S(p.label) })];
    case 'switch': {
      use('Switch');
      const name = uniqueName(ctx, ident(S(p.label), 'enabled'));
      ctx.states.push({ name, initial: Boolean(p.checked) });
      const setter = `set${name[0].toUpperCase()}${name.slice(1)}`;
      return [el('Switch', { label: S(p.label), showLabel: true, checked: expr(name), onChange: expr(setter) })];
    }
    case 'datepicker':
      use('DatePicker');
      return [el('DatePicker', { label: S(p.label), selectionMode: p.mode === 'range' ? 'range' : undefined, showButtonBar: true })];
    case 'otp':
      use('InputOtp');
      return [el('InputOtp', { label: S(p.label), length: N(p.length, 6), integerOnly: true })];
    case 'button':
      use('Button');
      return [el('Button', { variant: S(p.variant) !== 'primary' ? S(p.variant) : undefined, size: S(p.size) !== 'md' ? S(p.size) : undefined, block: Boolean(p.block) || undefined }, [txt(S(p.text))])];
    case 'toast': {
      use('Button', 'toast');
      ctx.usesToast = true;
      const fn = ['success', 'info', 'warning', 'error'].includes(S(p.variant)) ? `toast.${S(p.variant)}` : 'toast';
      return [el('Button', { variant: S(p.buttonVariant, 'secondary'), onClick: expr(`() => ${fn}(${lit(S(p.message))})`) }, [txt(S(p.text))])];
    }
    case 'table': {
      use('DataTable');
      const t = tableData(p);
      const base = ident(S(p.caption), 'table');
      const cols = addConst(ctx, `${base}Columns`, t.columns);
      const data = addConst(ctx, `${base}Rows`, t.data);
      return [el('DataTable', { columns: expr(cols), rows: expr(data), caption: S(p.caption, 'Table'), captionVisible: Boolean(p.showCaption) || undefined })];
    }
    case 'stat': {
      use('Card', 'Badge');
      const spark = S(p.spark).split(/[,|\s]+/).map(toNumber).filter((v) => !Number.isNaN(v));
      const down = /^[-−]/.test(S(p.delta));
      if (spark.length > 1) use('Sparkline');
      return [
        el('Card', {}, [
          el('p', { style: STAT_LABEL }, [txt(S(p.label))]),
          el('p', { style: STAT_VALUE }, [txt(S(p.value))]),
          el('div', { style: ROW }, [
            ...(S(p.delta) ? [el('Badge', { variant: down ? 'danger' : 'success' }, [txt(S(p.delta))])] : []),
            ...(S(p.period) ? [el('span', { style: MUTED_SM }, [txt(S(p.period))])] : []),
            ...(spark.length > 1 ? [el('Sparkline', { data: expr(`[${spark.join(', ')}]`), label: S(p.label), width: 84, height: 28, tone: down ? 'danger' : 'success', area: true })] : []),
          ]),
        ]),
      ];
    }
    case 'chart': {
      const c = chartData(p);
      const kind = S(p.kind, 'bar');
      const data = addConst(ctx, `${ident(S(p.title), 'chart')}Data`, c.data);
      if (kind === 'donut') {
        use('DonutChart');
        return [el('DonutChart', { title: S(p.title), data: expr(data), label: 'label', value: c.series[0]?.key ?? 'value', height: N(p.height, 280) })];
      }
      const comp = kind === 'line' ? 'LineChart' : kind === 'area' ? 'AreaChart' : 'BarChart';
      use(comp);
      return [el(comp, { title: S(p.title), data: expr(data), x: 'label', series: expr(lit(c.series)), height: N(p.height, 280), curve: kind !== 'bar' ? 'monotone' : undefined, stacked: kind === 'bar' && p.stacked ? true : undefined })];
    }
    case 'timeline': {
      use('Timeline');
      const items = addConst(ctx, 'timelineItems', rows(p.items).map((r) => ({ title: r[0], ...(r[1] ? { description: r[1] } : {}), ...(r[2] ? { time: r[2] } : {}) })));
      return [el('Timeline', { items: expr(items) })];
    }
    case 'progress':
      use('ProgressBar');
      return [el('ProgressBar', { value: N(p.value, 0), label: S(p.label, 'Progress') })];
    case 'alert':
      use('Alert');
      return [el('Alert', { variant: S(p.variant) !== 'info' ? S(p.variant) : undefined, title: S(p.title) || undefined }, [txt(S(p.text))])];
    case 'empty':
      use('EmptyState', 'Button');
      return [
        el('EmptyState', {
          title: S(p.title),
          description: S(p.description) || undefined,
          icon: S(p.icon) || undefined,
          size: S(p.size) !== 'default' ? S(p.size) : undefined,
          primaryAction: S(p.action) ? expr(`<Button>${escText(S(p.action), 'react')}</Button>`) : undefined,
          secondaryAction: S(p.secondary) ? expr(`<Button variant="ghost">${escText(S(p.secondary), 'react')}</Button>`) : undefined,
        }),
      ];
    case 'skeleton':
      use(p.kind === 'text' ? 'SkeletonText' : 'SkeletonCard');
      return [el(p.kind === 'text' ? 'SkeletonText' : 'SkeletonCard', { lines: N(p.lines, 3) })];
    case 'tabs': {
      use('Tabs');
      const labels = lines(p.labels);
      const panels = kids();
      const jsxTabs = (n.children ?? []).map((_, i) => ({ key: slug(labels[i] ?? `tab-${i + 1}`, `tab-${i + 1}`), label: labels[i] ?? `Tab ${i + 1}`, content: panels[i] ?? null }));
      return [{ tag: 'Tabs', attrs: {}, jsxTabs }];
    }
    case 'breadcrumb': {
      use('Breadcrumb');
      const items = lines(p.items);
      return [el('Breadcrumb', { items: expr(addConst(ctx, 'breadcrumb', items.map((l, i) => (i < items.length - 1 ? { label: l, href: '#' } : { label: l })))) })];
    }
    case 'stepper':
      use('Stepper');
      return [el('Stepper', { steps: expr(addConst(ctx, 'steps', lines(p.steps).map((l) => ({ label: l })))), current: Math.max(0, N(p.current, 1) - 1) })];
    case 'accordion': {
      use('Accordion');
      const items = addConst(ctx, 'faqItems', rows(p.items).map((r, i) => ({ key: `q${i + 1}`, title: r[0], content: r[1] ?? '' })));
      return [el('Accordion', { items: expr(items), defaultOpen: expr("['q1']") })];
    }
    case 'avatar': {
      use('Avatar');
      const av = el('Avatar', { name: S(p.name, 'User'), size: S(p.size) !== 'md' ? S(p.size) : undefined });
      if (!p.showName) return [av];
      return [el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '0.75rem' } }, [av, el('span', { style: { display: 'grid' } }, [el('strong', {}, [txt(S(p.name))]), ...(S(p.subtitle) ? [el('span', { style: MUTED_SM }, [txt(S(p.subtitle))])] : [])])])];
    }
    case 'carousel': {
      use('Carousel');
      const items = addConst(ctx, 'slides', rows(p.items).map((r) => ({ title: r[0], caption: r[1] ?? '', image: `/images/${slug(r[0], 'slide')}.jpg` })));
      return [
        el('Carousel', {
          label: S(p.label, 'Gallery'),
          items: expr(items),
          numVisible: N(p.visible, 3),
          getKey: expr('(slide) => slide.title'),
          itemTemplate: expr(
            "(slide) => (\n        <figure className=\"pl-card\" style={{ margin: 0, overflow: 'hidden' }}>\n          <img src={slide.image} alt={slide.title} style={{ display: 'block', width: '100%', aspectRatio: '3 / 2', objectFit: 'cover' }} />\n          <figcaption style={{ padding: '0.6rem 0.75rem' }}><strong>{slide.title}</strong> {slide.caption}</figcaption>\n        </figure>\n      )",
          ),
        }),
      ];
    }
    default:
      return common(n, ctx, kids) ?? [];
  }
}

/* ---------------- Vue ---------------- */

function vue(n: SpaceNode, ctx: Ctx, kids: () => Child[]): Child[] | null {
  const p = n.props;
  const use = (...names: string[]) => names.forEach((x) => ctx.imports.add(x));
  switch (n.type) {
    case 'card':
      use('Card');
      return [el('Card', { title: S(p.title) || undefined }, [el('div', { style: cardBodyStyle(p) }, kids())])];
    case 'divider':
      use('Divider');
      return [el('Divider')];
    case 'badge':
      use('Badge');
      return [el('Badge', { variant: S(p.variant) !== 'neutral' ? S(p.variant) : undefined }, [txt(S(p.text))])];
    case 'input':
      use('Input');
      return [el('Input', { label: S(p.label), type: S(p.type, 'text'), placeholder: S(p.placeholder) || undefined, hint: S(p.hint) || undefined })];
    case 'select': {
      use('Select');
      const opts = addConst(ctx, `${ident(S(p.label), 'select')}Options`, lines(p.options).map((o) => ({ label: o, value: slug(o, o) })));
      return [el('Select', { label: S(p.label), placeholder: S(p.placeholder) || undefined, options: expr(opts) })];
    }
    case 'checkbox':
      use('Checkbox');
      return [el('Checkbox', { label: S(p.label), modelValue: p.checked ? expr('true') : undefined })];
    case 'switch': {
      use('Switch');
      const name = uniqueName(ctx, ident(S(p.label), 'enabled'));
      ctx.states.push({ name, initial: Boolean(p.checked) });
      return [el('div', { style: ROW }, [el('Switch', { 'v-model': name, label: S(p.label) }), el('span', { 'aria-hidden': 'true' }, [txt(S(p.label))])])];
    }
    case 'button':
      use('Button');
      return [el('Button', { variant: S(p.variant) !== 'primary' ? S(p.variant) : undefined, size: S(p.size) !== 'md' ? S(p.size) : undefined, block: Boolean(p.block) || undefined }, [txt(S(p.text))])];
    case 'table': {
      use('DataTable');
      const t = tableData(p);
      const base = ident(S(p.caption), 'table');
      return [el('DataTable', { columns: expr(addConst(ctx, `${base}Columns`, t.columns)), rows: expr(addConst(ctx, `${base}Rows`, t.data)), caption: S(p.caption, 'Table'), captionVisible: Boolean(p.showCaption) || undefined })];
    }
    case 'stat':
      use('Card', 'Badge');
      return [
        el('Card', {}, [
          el('p', { style: STAT_LABEL }, [txt(S(p.label))]),
          el('p', { style: STAT_VALUE }, [txt(S(p.value))]),
          el('div', { style: ROW }, [
            ...(S(p.delta) ? [el('Badge', { variant: /^[-−]/.test(S(p.delta)) ? 'danger' : 'success' }, [txt(S(p.delta))])] : []),
            ...(S(p.period) ? [el('span', { style: MUTED_SM }, [txt(S(p.period))])] : []),
          ]),
        ]),
      ];
    case 'timeline':
      use('Timeline');
      return [el('Timeline', { items: expr(addConst(ctx, 'timelineItems', rows(p.items).map((r) => ({ title: r[0], ...(r[1] ? { description: r[1] } : {}), ...(r[2] ? { time: r[2] } : {}) })))) })];
    case 'progress':
      use('ProgressBar');
      return [el('ProgressBar', { value: N(p.value, 0), label: S(p.label, 'Progress') })];
    case 'alert':
      use('Alert');
      return [el('Alert', { variant: S(p.variant) !== 'info' ? S(p.variant) : undefined, title: S(p.title) || undefined }, [txt(S(p.text))])];
    case 'empty':
      use('EmptyState', 'Button');
      return [
        el('EmptyState', { title: S(p.title), description: S(p.description) || undefined, size: S(p.size) !== 'default' ? S(p.size) : undefined }, [
          ...(S(p.icon) ? [el('template', { '#icon': true }, [txt(S(p.icon))])] : []),
          ...(S(p.action) ? [el('template', { '#primary': true }, [el('Button', {}, [txt(S(p.action))])])] : []),
          ...(S(p.secondary) ? [el('template', { '#secondary': true }, [el('Button', { variant: 'ghost' }, [txt(S(p.secondary))])])] : []),
        ]),
      ];
    case 'skeleton':
      use(p.kind === 'text' ? 'SkeletonText' : 'SkeletonCard');
      return [el(p.kind === 'text' ? 'SkeletonText' : 'SkeletonCard', { lines: N(p.lines, 3) })];
    case 'tabs': {
      use('Tabs');
      const labels = lines(p.labels);
      const keys = (n.children ?? []).map((_, i) => slug(labels[i] ?? `tab-${i + 1}`, `tab-${i + 1}`));
      const tabs = addConst(ctx, 'tabs', keys.map((k, i) => ({ key: k, label: labels[i] ?? `Tab ${i + 1}` })));
      const panels = kids();
      return [el('Tabs', { tabs: expr(tabs) }, keys.map((k, i) => el('template', { [`#panel-${k}`]: true }, panels[i] ? [panels[i]] : [])))];
    }
    case 'breadcrumb': {
      use('Breadcrumb');
      const items = lines(p.items);
      return [el('Breadcrumb', { items: expr(addConst(ctx, 'breadcrumb', items.map((l, i) => (i < items.length - 1 ? { label: l, href: '#' } : { label: l })))) })];
    }
    case 'stepper':
      use('Stepper');
      return [el('Stepper', { steps: expr(addConst(ctx, 'steps', lines(p.steps).map((l) => ({ label: l })))), current: Math.max(0, N(p.current, 1) - 1) })];
    case 'accordion': {
      use('Accordion');
      const r = rows(p.items);
      const items = addConst(ctx, 'faqItems', r.map((row, i) => ({ key: `q${i + 1}`, title: row[0] })));
      return [el('Accordion', { items: expr(items), defaultOpen: expr("['q1']") }, r.map((row, i) => el('template', { [`#panel-q${i + 1}`]: true }, [el('p', { style: { margin: 0 } }, [txt(row[1] ?? '')])])))];
    }
    case 'avatar': {
      use('Avatar');
      const av = el('Avatar', { name: S(p.name, 'User'), size: S(p.size) !== 'md' ? S(p.size) : undefined });
      if (!p.showName) return [av];
      return [el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '0.75rem' } }, [av, el('span', { style: { display: 'grid' } }, [el('strong', {}, [txt(S(p.name))]), ...(S(p.subtitle) ? [el('span', { style: MUTED_SM }, [txt(S(p.subtitle))])] : [])])])];
    }
    default:
      return common(n, ctx, kids);
  }
}

/* ---------------- Angular ---------------- */

function angular(n: SpaceNode, ctx: Ctx, kids: () => Child[]): Child[] | null {
  const p = n.props;
  switch (n.type) {
    case 'card':
      return [el('pl-card', { title: S(p.title) || undefined }, [el('div', { style: cardBodyStyle(p) }, kids())])];
    case 'divider':
      return [el('pl-divider')];
    case 'badge':
      return [el('pl-badge', { variant: S(p.variant) !== 'neutral' ? S(p.variant) : undefined }, [txt(S(p.text))])];
    case 'input':
      return [el('pl-input', { label: S(p.label), type: S(p.type, 'text'), placeholder: S(p.placeholder) || undefined, hint: S(p.hint) || undefined })];
    case 'select':
      return [el('pl-select', { label: S(p.label), placeholder: S(p.placeholder) || undefined, options: expr(addConst(ctx, `${ident(S(p.label), 'select')}Options`, lines(p.options).map((o) => ({ label: o, value: slug(o, o) })))) })];
    case 'checkbox':
      return [el('pl-checkbox', { label: S(p.label), value: p.checked ? expr('true') : undefined })];
    case 'switch': {
      const name = uniqueName(ctx, ident(S(p.label), 'enabled'));
      ctx.states.push({ name, initial: Boolean(p.checked) });
      return [el('div', { style: ROW }, [el('pl-switch', { label: S(p.label), '[(value)]': name }), el('span', { 'aria-hidden': 'true' }, [txt(S(p.label))])])];
    }
    case 'button':
      return [el('button', { plButton: true, variant: S(p.variant) !== 'primary' ? S(p.variant) : undefined, size: S(p.size) !== 'md' ? S(p.size) : undefined, block: Boolean(p.block) || undefined }, [txt(S(p.text))])];
    case 'table': {
      const t = tableData(p);
      const base = ident(S(p.caption), 'table');
      return [el('pl-data-table', { columns: expr(addConst(ctx, `${base}Columns`, t.columns)), rows: expr(addConst(ctx, `${base}Rows`, t.data)), caption: S(p.caption, 'Table'), captionVisible: Boolean(p.showCaption) || undefined })];
    }
    case 'stat':
      return [
        el('pl-card', {}, [
          el('p', { style: STAT_LABEL }, [txt(S(p.label))]),
          el('p', { style: STAT_VALUE }, [txt(S(p.value))]),
          el('div', { style: ROW }, [
            ...(S(p.delta) ? [el('pl-badge', { variant: /^[-−]/.test(S(p.delta)) ? 'danger' : 'success' }, [txt(S(p.delta))])] : []),
            ...(S(p.period) ? [el('span', { style: MUTED_SM }, [txt(S(p.period))])] : []),
          ]),
        ]),
      ];
    case 'timeline':
      return [el('pl-timeline', { items: expr(addConst(ctx, 'timelineItems', rows(p.items).map((r) => ({ title: r[0], ...(r[1] ? { description: r[1] } : {}), ...(r[2] ? { time: r[2] } : {}) })))) })];
    case 'progress':
      return [el('pl-progress-bar', { value: N(p.value, 0), label: S(p.label, 'Progress') })];
    case 'alert':
      return [el('pl-alert', { variant: S(p.variant) !== 'info' ? S(p.variant) : undefined, title: S(p.title) || undefined }, [txt(S(p.text))])];
    case 'empty':
      return [
        el('pl-empty-state', { title: S(p.title), description: S(p.description) || undefined, icon: S(p.icon) || undefined, size: S(p.size) !== 'default' ? S(p.size) : undefined }, [
          ...(S(p.action) ? [el('button', { plButton: true, plEmptyPrimary: true }, [txt(S(p.action))])] : []),
          ...(S(p.secondary) ? [el('button', { plButton: true, plEmptySecondary: true, variant: 'ghost' }, [txt(S(p.secondary))])] : []),
        ]),
      ];
    case 'skeleton':
      return [el(p.kind === 'text' ? 'pl-skeleton-text' : 'pl-skeleton-card', { lines: N(p.lines, 3) })];
    case 'tabs': {
      const labels = lines(p.labels);
      const keys = (n.children ?? []).map((_, i) => slug(labels[i] ?? `tab-${i + 1}`, `tab-${i + 1}`));
      const tabs = addConst(ctx, 'tabs', keys.map((k, i) => ({ key: k, label: labels[i] ?? `Tab ${i + 1}` })));
      const panels = kids();
      return [el('pl-tabs', { tabs: expr(tabs) }, keys.map((k, i) => el('ng-template', { plTabPanel: k }, panels[i] ? [panels[i]] : [])))];
    }
    case 'breadcrumb': {
      const items = lines(p.items);
      return [el('pl-breadcrumb', { items: expr(addConst(ctx, 'breadcrumb', items.map((l, i) => (i < items.length - 1 ? { label: l, href: '#' } : { label: l })))) })];
    }
    case 'stepper':
      return [el('pl-stepper', { steps: expr(addConst(ctx, 'steps', lines(p.steps).map((l) => ({ label: l })))), current: Math.max(0, N(p.current, 1) - 1) })];
    case 'accordion': {
      const r = rows(p.items);
      const items = addConst(ctx, 'faqItems', r.map((row, i) => ({ key: `q${i + 1}`, title: row[0] })));
      return [el('pl-accordion', { items: expr(items), defaultOpen: expr("['q1']") }, r.map((row, i) => el('ng-template', { plAccordionPanel: `q${i + 1}` }, [el('p', { style: { margin: 0 } }, [txt(row[1] ?? '')])])))];
    }
    case 'avatar': {
      const av = el('pl-avatar', { name: S(p.name, 'User'), size: S(p.size) !== 'md' ? S(p.size) : undefined });
      if (!p.showName) return [av];
      return [el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '0.75rem' } }, [av, el('span', { style: { display: 'grid' } }, [el('strong', {}, [txt(S(p.name))]), ...(S(p.subtitle) ? [el('span', { style: MUTED_SM }, [txt(S(p.subtitle))])] : [])])])];
    }
    default:
      return common(n, ctx, kids);
  }
}

const COMPONENT_NAME: Partial<Record<SpaceNode['type'], string>> = {
  datepicker: 'DatePicker',
  otp: 'InputOtp',
  chart: 'Charts',
  carousel: 'Carousel',
  toast: 'Toaster',
  captcha: 'Captcha',
};

function toChildren(n: SpaceNode, ctx: Ctx): Child[] {
  const kids = () => (n.children ?? []).flatMap((c) => toChildren(c, ctx));
  if (ctx.target === 'html') return common(n, ctx, kids) ?? plain(n, ctx, kids);
  if (ctx.target === 'react') return react(n, ctx, kids);
  const out = ctx.target === 'vue' ? vue(n, ctx, kids) : angular(n, ctx, kids);
  if (out) return out;
  const name = COMPONENT_NAME[n.type] ?? n.type;
  const pkg = ctx.target === 'vue' ? '@pelagic-ui/vue' : '@pelagic-ui/angular';
  if (n.type !== 'captcha') ctx.notes.add(`${name} is not in ${pkg} yet; it is exported as static pl- markup (see the React export for the interactive version).`);
  return [...(n.type === 'captcha' ? [] : [note(`${name}: not in ${pkg} yet — static Pelagic markup`)]), ...plain(n, ctx, kids)];
}

/* ---------------- Rendering ---------------- */

const VOID = new Set(['input', 'img', 'hr', 'br', 'meta', 'link']);
const isComponent = (tag: string) => /^[A-Z]/.test(tag) || tag.startsWith('pl-');

function escText(s: string, t: Target): string {
  if (t === 'react') return /[{}<>]/.test(s) ? `{${lit(s)}}` : s;
  let out = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (t !== 'html') out = out.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
  if (t === 'angular') out = out.replace(/@/g, '&#64;');
  return out;
}

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function reactStyle(css: Css): string {
  return `{{ ${Object.entries(css)
    .map(([k, v]) => `${k}: ${typeof v === 'number' ? v : lit(v)}`)
    .join(', ')} }}`;
}

function attrs(a: Record<string, AttrValue> | undefined, t: Target): string[] {
  const out: string[] = [];
  for (const [rawName, v] of Object.entries(a ?? {})) {
    if (v === undefined || v === false) continue;
    let name = rawName;
    if (t === 'react') name = rawName === 'class' ? 'className' : rawName === 'for' ? 'htmlFor' : rawName === 'tabindex' ? 'tabIndex' : rawName === 'maxlength' ? 'maxLength' : rawName === 'inputmode' ? 'inputMode' : rawName === 'autocomplete' ? 'autoComplete' : rawName;
    if (rawName === 'style' && typeof v === 'object' && !('expr' in v)) {
      out.push(t === 'react' ? `style=${reactStyle(v as Css)}` : `style="${escAttr(cssText(v as Css))}"`);
    } else if (typeof v === 'object' && 'expr' in v) {
      if (t === 'react') out.push(`${name}={${v.expr}}`);
      else if (t === 'vue') out.push(`:${name}="${escAttr(String(v.expr))}"`);
      else if (t === 'angular') out.push(`[${name}]="${escAttr(String(v.expr))}"`);
      else out.push(`${name}="${escAttr(String(v.expr))}"`);
    } else if (v === true) {
      out.push(name);
    } else if (typeof v === 'number') {
      if (t === 'react') out.push(`${name}={${v}}`);
      else if (t === 'vue' && isComponentAttrCtx(name)) out.push(`:${name}="${v}"`);
      else if (t === 'angular' && isComponentAttrCtx(name)) out.push(`[${name}]="${v}"`);
      else out.push(`${name}="${v}"`);
    } else if (rawName === 'v-model' || rawName.startsWith('[(')) {
      out.push(`${rawName}="${escAttr(String(v))}"`);
    } else {
      const s = String(v);
      out.push(t === 'react' && /["\\{]/.test(s) ? `${name}={${lit(s)}}` : `${name}="${escAttr(s)}"`);
    }
  }
  return out;
}
/** Numeric component inputs are bound (`:length="6"`), plain HTML attributes stay strings. */
const NUMERIC_INPUTS = new Set(['length', 'lines', 'value', 'current', 'height', 'width', 'numVisible']);
const isComponentAttrCtx = (name: string) => NUMERIC_INPUTS.has(name);

/** Indent every line of a (possibly multi-line) attribute under `prefix`, keeping relative indentation. */
function reindent(text: string, prefix: string): string {
  const [first, ...rest] = text.split('\n');
  if (!rest.length) return prefix + first;
  const min = Math.min(...rest.filter((l) => l.trim()).map((l) => l.length - l.trimStart().length));
  return [prefix + first, ...rest.map((l) => prefix + l.slice(min))].join('\n');
}

function renderChild(c: Child, depth: number, t: Target): string[] {
  const pad = '  '.repeat(depth);
  if ('text' in c) return c.text ? [pad + escText(c.text, t)] : [];
  if ('comment' in c) return [t === 'react' ? `${pad}{/* ${c.comment.replace(/\*\//g, '* /')} */}` : `${pad}<!-- ${c.comment.replace(/--/g, '—')} -->`];
  if (c.jsxTabs) {
    const out = [`${pad}<${c.tag}`, `${pad}  tabs={[`];
    for (const tab of c.jsxTabs) {
      out.push(`${pad}    {`, `${pad}      key: ${lit(tab.key)},`, `${pad}      label: ${lit(tab.label)},`);
      if (tab.content) out.push(`${pad}      content: (`, ...renderChild(tab.content, depth + 4, t), `${pad}      ),`);
      out.push(`${pad}    },`);
    }
    return [...out, `${pad}  ]}`, `${pad}/>`];
  }
  const a = attrs(c.attrs, t);
  const open = a.length ? `<${c.tag} ${a.join(' ')}` : `<${c.tag}`;
  const multiline = (open.length + pad.length > 110 && a.length > 1) || open.includes('\n');
  const head = multiline ? [`${pad}<${c.tag}`, ...a.map((x) => reindent(x, `${pad}  `))] : [pad + open];
  const children = c.children ?? [];
  if (!children.length) {
    if (VOID.has(c.tag) && t === 'html') return multiline ? [...head, `${pad}>`] : [`${head[0]}>`];
    if (t === 'react' || isComponent(c.tag) || VOID.has(c.tag)) return multiline ? [...head, `${pad}/>`] : [`${head[0]} />`];
    return multiline ? [...head, `${pad}></${c.tag}>`] : [`${head[0]}></${c.tag}>`];
  }
  if (!multiline && children.length === 1 && 'text' in children[0]) {
    const one = `${head[0]}>${escText(children[0].text, t)}</${c.tag}>`;
    if (one.length <= 120) return [one];
  }
  const close = multiline ? [...head, `${pad}>`] : [`${head[0]}>`];
  return [...close, ...children.flatMap((k) => renderChild(k, depth + 1, t)), `${pad}</${c.tag}>`];
}

/* ---------------- Entry ---------------- */

export function pascal(name: string): string {
  const s = name
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return /^[A-Z]/.test(s) ? `${s}Page`.replace(/PagePage$/, 'Page') : 'GeneratedPage';
}

function rootAttrs(doc: SpaceDoc): Record<string, AttrValue> {
  return {
    class: 'page',
    dir: doc.rtl ? 'rtl' : undefined,
    lang: doc.lang === 'ar' ? 'ar' : undefined,
    'data-theme': doc.theme.mode !== 'page' ? doc.theme.mode : undefined,
    'data-accent': doc.theme.accent !== 'violet' ? doc.theme.accent : undefined,
    'data-shape': doc.theme.shape !== 'default' ? doc.theme.shape : undefined,
    'data-density': doc.theme.density === 'compact' ? 'compact' : undefined,
  };
}

export interface ExportResult {
  code: string;
  filename: string;
  notes: string[];
}

export function exportCode(doc: SpaceDoc, target: Target): ExportResult {
  const ctx: Ctx = { target, imports: new Set(), consts: [], states: [], names: new Set(), notes: new Set(), uid: 0, usesToast: false };
  const body = doc.nodes.flatMap((n) => toChildren(n, ctx));
  const root = el(target === 'html' ? 'main' : 'div', { ...rootAttrs(doc), style: { background: 'var(--pl-surface)', color: 'var(--pl-text)' } }, body);
  const name = pascal(doc.name || 'Generated page');
  const info = TARGETS.find((x) => x.id === target)!;
  const filename = info.file(doc.name || 'page');
  const notes = [...ctx.notes];

  if (target === 'react') {
    const imports = [...ctx.imports].sort();
    if (ctx.usesToast) imports.push('Toaster');
    const tree = renderChild(root, 2, 'react');
    if (ctx.usesToast) tree.splice(tree.length - 1, 0, '      <Toaster />');
    const states = ctx.states.map((s) => `  const [${s.name}, set${s.name[0].toUpperCase()}${s.name.slice(1)}] = useState(${s.initial});`);
    const code = [
      ...(states.length ? ["import { useState } from 'react';"] : []),
      `import { ${[...new Set(imports)].join(', ')} } from '@pelagic-ui/react';`,
      "import '@pelagic-ui/core/style.css'; // once, in your app entry",
      '',
      ...ctx.consts.map((c) => `const ${c.name} = ${c.code};\n`),
      `export default function ${name}() {`,
      ...states,
      ...(states.length ? [''] : []),
      '  return (',
      ...tree,
      '  );',
      '}',
      '',
    ].join('\n');
    return { code, filename, notes };
  }

  if (target === 'vue') {
    const tree = renderChild(root, 1, 'vue');
    const imports = [...ctx.imports].sort();
    const code = [
      '<script setup lang="ts">',
      ...(ctx.states.length ? ["import { ref } from 'vue';"] : []),
      ...(imports.length ? [`import { ${imports.join(', ')} } from '@pelagic-ui/vue';`] : []),
      "import '@pelagic-ui/core/style.css'; // once, in your app entry",
      ...(ctx.consts.length || ctx.states.length ? [''] : []),
      ...ctx.consts.map((c) => `const ${c.name} = ${c.code};`),
      ...ctx.states.map((s) => `const ${s.name} = ref(${s.initial});`),
      '</script>',
      '',
      '<template>',
      ...tree,
      '</template>',
      '',
    ].join('\n');
    return { code, filename, notes };
  }

  if (target === 'angular') {
    const tree = renderChild(root, 2, 'angular').map((l) => l.replace(/`/g, '\\`').replace(/\$\{/g, '\\${'));
    const fields = [...ctx.consts.map((c) => `  readonly ${c.name} = ${c.code.split('\n').join('\n  ')};`), ...ctx.states.map((s) => `  ${s.name} = ${s.initial};`)];
    const code = [
      "import { Component } from '@angular/core';",
      "import { PELAGIC_UI } from '@pelagic-ui/angular';",
      "// Add '@pelagic-ui/core/style.css' to the global styles in angular.json once.",
      '',
      '@Component({',
      `  selector: 'app-${slug(doc.name || 'page', 'page')}',`,
      '  standalone: true,',
      '  imports: [PELAGIC_UI],',
      '  template: `',
      ...tree,
      '  `,',
      '})',
      `export class ${name}Component {`,
      ...fields,
      '}',
      '',
    ].join('\n');
    return { code, filename, notes };
  }

  const tree = renderChild(root, 2, 'html');
  const code = [
    '<!doctype html>',
    `<html lang="${doc.lang}"${doc.rtl ? ' dir="rtl"' : ''}>`,
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${escText(doc.name || 'Page', 'html')}</title>`,
    '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@pelagic-ui/core/pelagic.css" />',
    '    <style>body { margin: 0; font-family: var(--pl-font); }</style>',
    '  </head>',
    '  <body>',
    ...tree,
    '  </body>',
    '</html>',
    '',
  ].join('\n');
  return { code, filename, notes };
}

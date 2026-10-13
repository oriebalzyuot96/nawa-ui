import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { inView, prefersReducedMotion } from '@orca-ui/core/motion';
import { cx } from '../utils';

export type Variant = 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  variant?: 'neutral' | 'primary' | Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return <span className={cx('oc-badge', variant !== 'neutral' && `oc-badge--${variant}`, className)}>{children}</span>;
}

export interface TagProps {
  children: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, removable = false, onRemove, className }: TagProps) {
  return (
    <span className={cx('oc-tag', className)}>
      {children}
      {removable && (
        <button type="button" className="oc-tag__remove" aria-label="Remove" onClick={onRemove}>
          ×
        </button>
      )}
    </span>
  );
}

export interface AvatarProps {
  src?: string;
  /** Used for alt text and initials when no image is given. */
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <span className={cx('oc-avatar', size !== 'md' && `oc-avatar--${size}`, className)} aria-label={name} role="img">
      {src ? <img src={src} alt="" /> : initialsOf(name)}
    </span>
  );
}

export interface CardProps {
  title?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Card({ title, footer, children, className }: CardProps) {
  return (
    <article className={cx('oc-card', className)}>
      {title && <header className="oc-card__header">{title}</header>}
      {children && <div className="oc-card__body">{children}</div>}
      {footer && <footer className="oc-card__footer">{footer}</footer>}
    </article>
  );
}

export function Spinner({ size = 'md', label = 'Loading' }: { size?: 'md' | 'lg'; label?: string }) {
  return <span role="status" aria-label={label} className={cx('oc-spinner', size === 'lg' && 'oc-spinner--lg')} />;
}

export function Skeleton({ width, height, circle = false, className }: { width?: number | string; height?: number | string; circle?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx('oc-skeleton', circle && 'oc-skeleton--circle', className)}
      style={{ width: circle ? height ?? width : width, height }}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  /** Announced to screen readers while loading. */
  label?: string;
  className?: string;
}

/** Paragraph placeholder. The last line is shorter. Announced once as a loading status. */
export function SkeletonText({ lines = 3, label = 'Loading…', className }: SkeletonTextProps) {
  return (
    <div role="status" aria-busy="true" className={cx('oc-skeleton-text', className)}>
      <span className="oc-sr-only">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={12} />
      ))}
    </div>
  );
}

/** Card placeholder: avatar, title lines and a body paragraph. */
export function SkeletonCard({ lines = 3, label = 'Loading…', className }: SkeletonTextProps) {
  return (
    <div role="status" aria-busy="true" className={cx('oc-skeleton-card', className)}>
      <span className="oc-sr-only">{label}</span>
      <div className="oc-skeleton-card__head">
        <Skeleton circle height={40} />
        <div className="oc-skeleton-text" aria-hidden="true">
          <Skeleton height={12} width="50%" />
          <Skeleton height={10} width="30%" />
        </div>
      </div>
      <div className="oc-skeleton-text" aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} height={12} />
        ))}
      </div>
    </div>
  );
}

export interface ProgressBarProps {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label = 'Progress', className }: ProgressBarProps) {
  const indeterminate = value === undefined;
  const clamped = indeterminate ? undefined : Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cx('oc-progress', indeterminate && 'oc-progress--indeterminate', className)}
    >
      <div className="oc-progress__bar" style={indeterminate ? undefined : { width: `${clamped}%` }} />
    </div>
  );
}

export interface StepperStep {
  label: ReactNode;
  description?: ReactNode;
}

/** `current` is the zero-based index of the active step. */
export function Stepper({ steps, current, className }: { steps: StepperStep[]; current: number; className?: string }) {
  return (
    <ol className={cx('oc-stepper', className)}>
      {steps.map((s, i) => {
        const state = i < current ? 'complete' : i === current ? 'current' : 'upcoming';
        return (
          <li key={i} className="oc-stepper__step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            <span>{s.label}</span>
            {s.description && <span className="oc-stepper__desc">{s.description}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export interface TimelineItem {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Free-form time label, shown as is. */
  time?: ReactNode;
  /** When it happened: enables relative time, date grouping and a machine-readable <time>. */
  date?: Date | string | number;
  variant?: 'primary' | 'neutral' | Variant;
  /** Progress: complete items fill the connector, current pulses, upcoming is hollow. */
  status?: 'complete' | 'current' | 'upcoming';
  /** Marker icon (decorative). */
  icon?: ReactNode;
  /** Marker avatar; the name is read before the title. */
  avatar?: { name: string; src?: string };
  /** Extra content behind a "Show details" toggle. */
  details?: ReactNode;
  /** Trailing content: badges, links, actions. */
  meta?: ReactNode;
}

export interface TimelineLabels {
  showDetails: string;
  hideDetails: string;
  loading: string;
  today: string;
  yesterday: string;
  complete: string;
  current: string;
}

const TIMELINE_LABELS: TimelineLabels = {
  showDetails: 'Show details',
  hideDetails: 'Hide details',
  loading: 'Loading timeline…',
  today: 'Today',
  yesterday: 'Yesterday',
  complete: 'completed',
  current: 'current',
};

export interface TimelineProps {
  items: TimelineItem[];
  /** 'vertical' (default), 'horizontal' or 'alternate'. Horizontal and alternate become vertical in narrow containers. */
  layout?: 'vertical' | 'horizontal' | 'alternate';
  /** Group items under date headings ('day', 'month') or by a custom key/label. */
  groupBy?: 'day' | 'month' | ((item: TimelineItem) => string);
  /** Show "2h ago" style times (absolute time in the tooltip and for screen readers). Needs `date`. */
  relative?: boolean;
  locale?: string;
  /** Reference time for relative labels (default: now). */
  now?: Date;
  /** Render a skeleton while data loads. */
  loading?: boolean;
  skeletonCount?: number;
  /** Fade items in as they scroll into view (off under reduced motion). */
  reveal?: boolean;
  /** Accessible name of the list. */
  label?: string;
  /** Heading level of group headings. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<TimelineLabels>;
  className?: string;
}

const toDate = (d: TimelineItem['date']) => {
  if (d === undefined || d === null || d === '') return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "2h ago", "in 3 days", "yesterday" … */
export function relativeTimeLabel(date: Date, now: Date = new Date(), locale?: string): string {
  const diff = (date.getTime() - now.getTime()) / 1000;
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(diff) >= size) {
      const style = size < 86400 ? 'narrow' : 'long';
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style }).format(Math.round(diff / size), unit);
    }
  }
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second');
}

function TimelineEntry({
  item,
  side,
  relative,
  locale,
  now,
  labels,
  dayGrouped,
}: {
  item: TimelineItem;
  side?: 'start' | 'end';
  dayGrouped?: boolean;
  relative: boolean;
  locale?: string;
  now: Date;
  labels: TimelineLabels;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const date = toDate(item.date);
  const absolute = date ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : '';
  // Under a day heading, older items show their time of day (the heading already says which day).
  const label = !date
    ? ''
    : relative && !(dayGrouped && dayKey(date) !== dayKey(now))
      ? relativeTimeLabel(date, now, locale)
      : relative
        ? new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date)
        : null;
  const media = item.avatar ? (
    item.avatar.src ? <img src={item.avatar.src} alt="" /> : <span className="oc-timeline__initials">{initialsOf(item.avatar.name)}</span>
  ) : (
    item.icon ?? null
  );
  return (
    <li className="oc-timeline__item" data-status={item.status} data-side={side} aria-current={item.status === 'current' ? 'step' : undefined}>
      <span
        className={cx('oc-timeline__dot', item.variant && item.variant !== 'primary' && `oc-timeline__dot--${item.variant}`, Boolean(media) && 'oc-timeline__dot--media')}
        aria-hidden="true"
      >
        {media}
      </span>
      <div className="oc-timeline__content">
        {(item.time || date) && (
          <div className="oc-timeline__time">
            {date ? (
              <>
                <time dateTime={date.toISOString()} title={relative ? absolute : undefined} dir="auto" suppressHydrationWarning>
                  {label ?? item.time ?? absolute}
                </time>
                {relative && <span className="oc-sr-only" suppressHydrationWarning> ({absolute})</span>}
              </>
            ) : (
              item.time
            )}
          </div>
        )}
        <div className="oc-timeline__title">
          {item.avatar && <span className="oc-sr-only">{item.avatar.name}: </span>}
          {item.title}
          {item.status === 'complete' && <span className="oc-sr-only"> ({labels.complete})</span>}
          {item.status === 'current' && <span className="oc-sr-only"> ({labels.current})</span>}
        </div>
        {item.description && <div className="oc-timeline__desc">{item.description}</div>}
        {item.meta && <div className="oc-timeline__meta">{item.meta}</div>}
        {item.details && (
          <>
            <button type="button" className="oc-timeline__toggle" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen((o) => !o)}>
              {open ? labels.hideDetails : labels.showDetails}
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div id={detailsId} className="oc-timeline__details" hidden={!open}>
              {item.details}
            </div>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Event timeline: vertical, horizontal or alternating, with markers (status, icon, avatar),
 * relative timestamps, date groups, expandable details, a progress connector, a loading skeleton
 * and optional scroll reveal. Renders semantic ordered lists.
 */
export function Timeline({
  items,
  layout = 'vertical',
  groupBy,
  relative = false,
  locale,
  now,
  loading = false,
  skeletonCount = 3,
  reveal = false,
  label,
  headingLevel = 3,
  labels: labelOverrides,
  className,
}: TimelineProps) {
  const labels = { ...TIMELINE_LABELS, ...labelOverrides };
  const rootRef = useRef<HTMLElement>(null);
  const baseId = useId();
  const reference = now ?? new Date();
  const media = items.some((it) => it.icon || it.avatar);
  const listClass = cx('oc-timeline', layout !== 'vertical' && `oc-timeline--${layout}`, media && 'oc-timeline--media');

  useEffect(() => {
    const root = rootRef.current;
    if (!reveal || !root || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    const lis = Array.from(root.querySelectorAll<HTMLElement>('.oc-timeline__item'));
    lis.forEach((li) => li.setAttribute('data-reveal', 'armed'));
    const stop = inView(lis, (entry) => {
      (entry.target as HTMLElement).setAttribute('data-reveal', 'in');
    }, { once: true, amount: 0.2 });
    return () => {
      stop();
      lis.forEach((li) => li.removeAttribute('data-reveal'));
    };
  }, [reveal, items]);

  if (loading) {
    return (
      <div role="status" aria-busy="true" className={cx('oc-timeline-wrap', className)}>
        <span className="oc-sr-only">{labels.loading}</span>
        <ol className="oc-timeline oc-timeline--loading" aria-hidden="true">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <li key={i} className="oc-timeline__item">
              <span className="oc-timeline__dot" />
              <div className="oc-timeline__content">
                <Skeleton height={10} width="5rem" />
                <Skeleton height={14} width={`${60 - (i % 3) * 12}%`} />
                <Skeleton height={10} width="85%" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const renderList = (list: TimelineItem[], props: { 'aria-label'?: string; 'aria-labelledby'?: string; className?: string }, offset = 0) => (
    <ol className={cx(listClass, props.className)} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']}>
      {list.map((item, i) => (
        <TimelineEntry
          key={item.id ?? i}
          item={item}
          side={layout === 'alternate' ? ((offset + i) % 2 === 0 ? 'end' : 'start') : undefined}
          relative={relative}
          locale={locale}
          now={reference}
          labels={labels}
          dayGrouped={groupBy === 'day'}
        />
      ))}
    </ol>
  );

  if (!groupBy && layout === 'vertical') {
    return (
      <ol ref={rootRef as RefObject<HTMLOListElement>} className={cx(listClass, className)} aria-label={label}>
        {items.map((item, i) => (
          <TimelineEntry key={item.id ?? i} item={item} relative={relative} locale={locale} now={reference} labels={labels} />
        ))}
      </ol>
    );
  }

  if (!groupBy) {
    return (
      <div ref={rootRef as RefObject<HTMLDivElement>} className={cx('oc-timeline-wrap', className)}>
        {renderList(items, { 'aria-label': label })}
      </div>
    );
  }

  const groups: Array<{ key: string; label: string; items: TimelineItem[] }> = [];
  const todayKey = dayKey(reference);
  const yesterday = new Date(reference);
  yesterday.setDate(yesterday.getDate() - 1);
  for (const item of items) {
    const d = toDate(item.date);
    let key: string;
    let name: string;
    if (typeof groupBy === 'function') {
      key = name = groupBy(item);
    } else if (!d) {
      // Undated items (e.g. upcoming steps) stay with the group before them.
      const prev = groups[groups.length - 1];
      key = prev?.key ?? '';
      name = prev?.label ?? '';
    } else if (groupBy === 'month') {
      key = `${d.getFullYear()}-${d.getMonth()}`;
      name = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
    } else {
      key = dayKey(d);
      name =
        key === todayKey
          ? labels.today
          : key === dayKey(yesterday)
            ? labels.yesterday
            : new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric', ...(d.getFullYear() !== reference.getFullYear() ? { year: 'numeric' } : {}) }).format(d);
    }
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: name, items: [item] });
  }
  const H = `h${headingLevel}` as 'h3';
  let offset = 0;
  return (
    <div ref={rootRef as RefObject<HTMLDivElement>} className={cx('oc-timeline-wrap oc-timeline-groups', className)} role={label ? 'group' : undefined} aria-label={label}>
      {groups.map((g, gi) => {
        const headingId = `${baseId}-g${gi}`;
        const list = renderList(g.items, { 'aria-labelledby': g.label ? headingId : undefined }, offset);
        offset += g.items.length;
        return (
          <section key={g.key || '_'} className="oc-timeline__group" aria-labelledby={g.label ? headingId : undefined}>
            {g.label && (
              <H id={headingId} className="oc-timeline__group-title" suppressHydrationWarning>
                {g.label}
              </H>
            )}
            {list}
          </section>
        );
      })}
    </div>
  );
}

export interface AlertProps {
  variant?: Variant;
  title?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  const urgent = variant === 'danger' || variant === 'warning';
  return (
    <div role={urgent ? 'alert' : 'status'} className={cx('oc-alert', variant !== 'info' && `oc-alert--${variant}`, className)}>
      <div className="oc-alert__body">
        {title && <div className="oc-alert__title">{title}</div>}
        {children}
      </div>
      {onClose && (
        <button type="button" className="oc-close" aria-label="Dismiss" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}

export type EmptyStateSize = 'compact' | 'default' | 'page';
export type EmptyStateTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /**
   * Scene shown above (or beside) the text. Pass an element — e.g. `<NoResultsIllustration />`
   * from `@orca-ui/illustrations/react` — or a scene name such as `"no-results"`, which renders
   * `<oc-illustration>` (register it with `import '@orca-ui/illustrations/element'`).
   * Treated as decorative; `false` hides it.
   */
  illustration?: ReactNode | string | false;
  /** Legacy small decorative glyph (emoji / icon). */
  icon?: ReactNode;
  /** Main call to action (usually a primary Button). */
  primaryAction?: ReactNode;
  /** Secondary call to action (usually a ghost Button or link). */
  secondaryAction?: ReactNode;
  /** Any extra actions, rendered after primary/secondary. */
  actions?: ReactNode;
  /** `compact` for inline/table use, `page` for full-page states (404, onboarding). */
  size?: EmptyStateSize;
  align?: 'center' | 'start';
  /** `split` puts the illustration beside the text when the component is ≥ 36rem wide (container query). */
  layout?: 'stack' | 'split';
  /** Retints the illustration: neutral (grey), info, success, warning, danger (error states). */
  tone?: EmptyStateTone;
  /** Heading level for the title (default 3); `false` renders a paragraph instead of a heading. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | false;
  /** Rendered in the action area (backwards compatible). */
  children?: ReactNode;
  className?: string;
  id?: string;
}

export function EmptyState({
  title,
  description,
  illustration,
  icon,
  primaryAction,
  secondaryAction,
  actions,
  size = 'default',
  align = 'center',
  layout = 'stack',
  tone,
  headingLevel = 3,
  children,
  className,
  id,
}: EmptyStateProps) {
  const Heading = (headingLevel ? `h${headingLevel}` : 'p') as 'h3';
  const hasActions = Boolean(primaryAction || secondaryAction || actions || children);
  const media =
    typeof illustration === 'string' && illustration ? (
      <oc-illustration name={illustration} compact={size === 'compact' ? '' : undefined} />
    ) : illustration || null;
  return (
    <div
      id={id}
      className={cx(
        'oc-empty',
        size !== 'default' && `oc-empty--${size}`,
        align === 'start' && 'oc-empty--start',
        layout === 'split' && 'oc-empty--split',
        tone && `oc-empty--tone-${tone}`,
        className,
      )}
    >
      <div className="oc-empty__inner">
        {media && <div className="oc-empty__media">{media}</div>}
        {icon && <div className="oc-empty__icon" aria-hidden="true">{icon}</div>}
        <div className="oc-empty__body">
          <Heading className="oc-empty__title">{title}</Heading>
          {description && <p className="oc-empty__desc">{description}</p>}
          {hasActions && (
            <div className="oc-empty__actions oc-empty__action">
              {primaryAction}
              {secondaryAction}
              {actions}
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'oc-illustration': { name: string; compact?: ''; label?: string; static?: '' };
    }
  }
}

/**
 * Hover/focus tooltip. The trigger (a single element child) gets aria-describedby,
 * and Escape hides the bubble until the pointer leaves or focus moves (WCAG 1.4.13).
 */
export function Tooltip({ text, placement = 'top', children, className }: { text: string; placement?: 'top' | 'bottom'; children: ReactNode; className?: string }) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  const trigger = isValidElement<{ 'aria-describedby'?: string }>(children)
    ? cloneElement(children, { 'aria-describedby': cx(children.props['aria-describedby'], id) })
    : children;
  return (
    <span
      className={cx('oc-tooltip', placement === 'bottom' && 'oc-tooltip--bottom', className)}
      data-dismissed={dismissed ? '' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setDismissed(true);
      }}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      {trigger}
      <span role="tooltip" id={id} className="oc-tooltip__bubble">
        {text}
      </span>
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('oc-divider', className)} />;
}

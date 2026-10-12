import { cloneElement, isValidElement, useId, useState, type ReactNode } from 'react';
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
  title: ReactNode;
  description?: ReactNode;
  time?: ReactNode;
  variant?: 'primary' | Variant;
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cx('oc-timeline', className)}>
      {items.map((item, i) => (
        <li key={i} className="oc-timeline__item">
          <span className={cx('oc-timeline__dot', item.variant && item.variant !== 'primary' && `oc-timeline__dot--${item.variant}`)} aria-hidden="true" />
          {item.time && <div className="oc-timeline__time">{item.time}</div>}
          <div className="oc-timeline__title">{item.title}</div>
          {item.description && <div className="oc-timeline__desc">{item.description}</div>}
        </li>
      ))}
    </ol>
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

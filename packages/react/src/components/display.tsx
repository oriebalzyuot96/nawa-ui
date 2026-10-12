import { cloneElement, isValidElement, useId, useState, type ReactNode } from 'react';
import { cx } from '../utils';

export type Variant = 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  variant?: 'neutral' | 'primary' | Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return <span className={cx('nw-badge', variant !== 'neutral' && `nw-badge--${variant}`, className)}>{children}</span>;
}

export interface TagProps {
  children: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, removable = false, onRemove, className }: TagProps) {
  return (
    <span className={cx('nw-tag', className)}>
      {children}
      {removable && (
        <button type="button" className="nw-tag__remove" aria-label="Remove" onClick={onRemove}>
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
    <span className={cx('nw-avatar', size !== 'md' && `nw-avatar--${size}`, className)} aria-label={name} role="img">
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
    <article className={cx('nw-card', className)}>
      {title && <header className="nw-card__header">{title}</header>}
      {children && <div className="nw-card__body">{children}</div>}
      {footer && <footer className="nw-card__footer">{footer}</footer>}
    </article>
  );
}

export function Spinner({ size = 'md', label = 'Loading' }: { size?: 'md' | 'lg'; label?: string }) {
  return <span role="status" aria-label={label} className={cx('nw-spinner', size === 'lg' && 'nw-spinner--lg')} />;
}

export function Skeleton({ width, height, circle = false, className }: { width?: number | string; height?: number | string; circle?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx('nw-skeleton', circle && 'nw-skeleton--circle', className)}
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
    <div role="status" aria-busy="true" className={cx('nw-skeleton-text', className)}>
      <span className="nw-sr-only">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={12} />
      ))}
    </div>
  );
}

/** Card placeholder: avatar, title lines and a body paragraph. */
export function SkeletonCard({ lines = 3, label = 'Loading…', className }: SkeletonTextProps) {
  return (
    <div role="status" aria-busy="true" className={cx('nw-skeleton-card', className)}>
      <span className="nw-sr-only">{label}</span>
      <div className="nw-skeleton-card__head">
        <Skeleton circle height={40} />
        <div className="nw-skeleton-text" aria-hidden="true">
          <Skeleton height={12} width="50%" />
          <Skeleton height={10} width="30%" />
        </div>
      </div>
      <div className="nw-skeleton-text" aria-hidden="true">
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
      className={cx('nw-progress', indeterminate && 'nw-progress--indeterminate', className)}
    >
      <div className="nw-progress__bar" style={indeterminate ? undefined : { width: `${clamped}%` }} />
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
    <ol className={cx('nw-stepper', className)}>
      {steps.map((s, i) => {
        const state = i < current ? 'complete' : i === current ? 'current' : 'upcoming';
        return (
          <li key={i} className="nw-stepper__step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            <span>{s.label}</span>
            {s.description && <span className="nw-stepper__desc">{s.description}</span>}
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
    <ol className={cx('nw-timeline', className)}>
      {items.map((item, i) => (
        <li key={i} className="nw-timeline__item">
          <span className={cx('nw-timeline__dot', item.variant && item.variant !== 'primary' && `nw-timeline__dot--${item.variant}`)} aria-hidden="true" />
          {item.time && <div className="nw-timeline__time">{item.time}</div>}
          <div className="nw-timeline__title">{item.title}</div>
          {item.description && <div className="nw-timeline__desc">{item.description}</div>}
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
    <div role={urgent ? 'alert' : 'status'} className={cx('nw-alert', variant !== 'info' && `nw-alert--${variant}`, className)}>
      <div className="nw-alert__body">
        {title && <div className="nw-alert__title">{title}</div>}
        {children}
      </div>
      {onClose && (
        <button type="button" className="nw-close" aria-label="Dismiss" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description, children, className }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx('nw-empty', className)}>
      {icon && <div className="nw-empty__icon" aria-hidden="true">{icon}</div>}
      <div className="nw-empty__title">{title}</div>
      {description && <p className="nw-empty__desc">{description}</p>}
      {children && <div className="nw-empty__action">{children}</div>}
    </div>
  );
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
      className={cx('nw-tooltip', placement === 'bottom' && 'nw-tooltip--bottom', className)}
      data-dismissed={dismissed ? '' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setDismissed(true);
      }}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      {trigger}
      <span role="tooltip" id={id} className="nw-tooltip__bubble">
        {text}
      </span>
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('nw-divider', className)} />;
}

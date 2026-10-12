import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, trapFocus } from '@nawa-ui/core/a11y';
import { cx } from '../utils';
import type { Variant } from './display';

/**
 * Modal behavior: Escape closes, focus moves into the panel and is trapped there,
 * the page behind does not scroll, and focus returns to the opener on close.
 */
function useOverlay(open: boolean, onClose: (() => void) | undefined, panelRef: RefObject<HTMLDivElement>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.focus();
    const releaseFocus = trapFocus(panel);
    const releaseScroll = lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      releaseFocus();
      releaseScroll();
      previous?.focus?.();
    };
  }, [open, panelRef]);
}

export interface DialogProps {
  open: boolean;
  title: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Close when the backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Dialog({ open, title, onClose, footer, size = 'md', closeOnBackdrop = true, children, className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay(open, onClose, panelRef);
  if (!open || typeof document === 'undefined') return null;

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div className="nw-overlay" onMouseDown={onBackdrop}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cx('nw-dialog', size !== 'md' && `nw-dialog--${size}`, className)}>
        <header className="nw-dialog__header">
          <h2 id={titleId} className="nw-dialog__title">
            {title}
          </h2>
          {onClose && (
            <button type="button" className="nw-close" aria-label="Close" onClick={onClose}>
              ×
            </button>
          )}
        </header>
        <div className="nw-dialog__body">{children}</div>
        {footer && <footer className="nw-dialog__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export interface DrawerProps extends Omit<DialogProps, 'size' | 'footer'> {
  side?: 'left' | 'right';
  footer?: ReactNode;
}

export function Drawer({ open, title, onClose, footer, side = 'right', closeOnBackdrop = true, children, className }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay(open, onClose, panelRef);
  if (!open || typeof document === 'undefined') return null;

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div className={cx('nw-overlay', 'nw-overlay--drawer', side === 'right' && 'nw-overlay--right')} onMouseDown={onBackdrop}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cx('nw-drawer', side === 'right' && 'nw-drawer--right', className)}>
        <header className="nw-dialog__header">
          <h2 id={titleId} className="nw-dialog__title">
            {title}
          </h2>
          {onClose && (
            <button type="button" className="nw-close" aria-label="Close" onClick={onClose}>
              ×
            </button>
          )}
        </header>
        <div className="nw-dialog__body">{children}</div>
        {footer && <footer className="nw-dialog__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export interface ToastItem {
  id: string | number;
  title?: ReactNode;
  message: ReactNode;
  variant?: Variant;
}

/** Presentational toast stack. Keep the items list in your state and remove on `onDismiss`. */
export function Toast({ items, onDismiss, className }: { items: ToastItem[]; onDismiss: (id: string | number) => void; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cx('nw-toast-stack', className)}>
      {items.map((t) => (
        <div key={t.id} className={cx('nw-toast', t.variant && t.variant !== 'info' && `nw-toast--${t.variant}`)}>
          <div className="nw-toast__body">
            {t.title && <div className="nw-toast__title">{t.title}</div>}
            <div className="nw-toast__message">{t.message}</div>
          </div>
          <button type="button" className="nw-close" aria-label="Dismiss" onClick={() => onDismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

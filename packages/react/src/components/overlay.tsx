import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, trapFocus } from '@orca-ui/core/a11y';
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
    <div className="oc-overlay" onMouseDown={onBackdrop}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cx('oc-dialog', size !== 'md' && `oc-dialog--${size}`, className)}>
        <div className="oc-dialog__header">
          <h2 id={titleId} className="oc-dialog__title">
            {title}
          </h2>
          {onClose && (
            <button type="button" className="oc-close" aria-label="Close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="oc-dialog__body">{children}</div>
        {footer && <div className="oc-dialog__footer">{footer}</div>}
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
    <div className={cx('oc-overlay', 'oc-overlay--drawer', side === 'right' && 'oc-overlay--right')} onMouseDown={onBackdrop}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cx('oc-drawer', side === 'right' && 'oc-drawer--right', className)}>
        <div className="oc-dialog__header">
          <h2 id={titleId} className="oc-dialog__title">
            {title}
          </h2>
          {onClose && (
            <button type="button" className="oc-close" aria-label="Close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="oc-dialog__body">{children}</div>
        {footer && <div className="oc-dialog__footer">{footer}</div>}
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
    <div role="status" aria-live="polite" className={cx('oc-toast-stack', className)}>
      {items.map((t) => (
        <div key={t.id} className={cx('oc-toast', t.variant && t.variant !== 'info' && `oc-toast--${t.variant}`)}>
          <div className="oc-toast__body">
            {t.title && <div className="oc-toast__title">{t.title}</div>}
            <div className="oc-toast__message">{t.message}</div>
          </div>
          <button type="button" className="oc-close" aria-label="Dismiss" onClick={() => onDismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

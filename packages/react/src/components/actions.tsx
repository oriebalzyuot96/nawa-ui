import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  block?: boolean;
  /** Square button for a single icon. Pass aria-label. */
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, block = false, iconOnly = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'oc-btn',
        `oc-btn--${variant}`,
        size !== 'md' && `oc-btn--${size}`,
        block && 'oc-btn--block',
        iconOnly && 'oc-btn--icon',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="oc-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});

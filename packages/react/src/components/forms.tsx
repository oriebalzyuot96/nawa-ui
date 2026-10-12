import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '../utils';

export interface FieldMetaProps {
  label?: string;
  hint?: string;
  error?: string;
}

function fieldMessage(id: string, error?: string, hint?: string) {
  if (error) return { describedBy: `${id}-err`, node: <span id={`${id}-err`} className="nw-error-text">{error}</span> };
  if (hint) return { describedBy: `${id}-hint`, node: <span id={`${id}-hint`} className="nw-hint">{hint}</span> };
  return { describedBy: undefined, node: null };
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldMetaProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msg = fieldMessage(inputId, error, hint);
  return (
    <div className={cx('nw-field', error && 'nw-field--error')}>
      {label && <label className="nw-label" htmlFor={inputId}>{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className={cx('nw-input', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={msg.describedBy}
        {...rest}
      />
      {msg.node}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldMetaProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msg = fieldMessage(inputId, error, hint);
  return (
    <div className={cx('nw-field', error && 'nw-field--error')}>
      {label && <label className="nw-label" htmlFor={inputId}>{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        className={cx('nw-textarea', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={msg.describedBy}
        {...rest}
      />
      {msg.node}
    </div>
  );
});

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'>, FieldMetaProps {
  options?: SelectOption[];
  placeholder?: string;
  children?: ReactNode;
}

/** Native select for full keyboard and screen-reader support. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className, options, placeholder, children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const msg = fieldMessage(selectId, error, hint);
  return (
    <div className={cx('nw-field', error && 'nw-field--error')}>
      {label && <label className="nw-label" htmlFor={selectId}>{label}</label>}
      <select
        ref={ref}
        id={selectId}
        className={cx('nw-select', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={msg.describedBy}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      {msg.node}
    </div>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export function Checkbox({ label, className, disabled, ...rest }: CheckboxProps) {
  return (
    <label className={cx('nw-check', disabled && 'nw-check--disabled', className)}>
      <input type="checkbox" disabled={disabled} {...rest} />
      {label}
    </label>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Accessible name. */
  label: string;
  id?: string;
}

export function Switch({ checked, onChange, disabled, label, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="nw-switch"
      onClick={() => onChange(!checked)}
    />
  );
}

export interface RadioOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
}

export function RadioGroup({ name, options, value, onChange, label, className }: RadioGroupProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('nw-radio-group', className)}>
      {options.map((o) => (
        <label key={o.value} className={cx('nw-check', o.disabled && 'nw-check--disabled')}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            disabled={o.disabled}
            onChange={() => onChange?.(o.value)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  id?: string;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, showValue = false, disabled, id }: SliderProps) {
  const autoId = useId();
  const sliderId = id ?? autoId;
  return (
    <div className="nw-field">
      {label && (
        <label className="nw-label" htmlFor={sliderId}>
          {label}
          {showValue && <span className="nw-hint"> {value}</span>}
        </label>
      )}
      <input
        id={sliderId}
        type="range"
        className="nw-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export interface SegmentedOption {
  label: ReactNode;
  value: string;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export function Segmented({ options, value, onChange, label, className }: SegmentedProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = options[(index + dir + options.length) % options.length];
    onChange(next.value);
    (e.currentTarget.parentElement?.children[(index + dir + options.length) % options.length] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={cx('nw-segmented', className)}>
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className="nw-segmented__item"
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

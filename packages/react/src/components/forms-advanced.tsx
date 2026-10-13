// forms-advanced — PrimeNG parity form components.
import {
  Children,
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type ClipboardEvent,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { trapFocus } from '@pelagic-ui/core/a11y';
import { cx } from '../utils';
import type { FieldMetaProps } from './forms';

/* ======================================================================
 * Shared helpers
 * ==================================================================== */

export interface FormOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/** Controlled when `value !== undefined`, otherwise keeps its own state. */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [controlled ? (value as T) : inner, set];
}

/** Calls `onDismiss` on a pointer press outside `rootRef` while `open`. */
function useDismiss(open: boolean, rootRef: RefObject<HTMLElement>, onDismiss: () => void) {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) cb.current();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, rootRef]);
}

/** Open state for a popup anchored in `rootRef`: closes on outside press and when focus leaves. */
function usePopup() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismiss(open, rootRef, () => setOpen(false));
  const onBlur = (e: ReactFocusEvent) => {
    if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
  };
  return { open, setOpen, rootRef, onBlur };
}

/** Pressing a non-interactive part of a popup must not steal focus from the active control. */
function keepFocus(e: ReactMouseEvent) {
  if (!(e.target as HTMLElement).closest('input, button, select, textarea')) e.preventDefault();
}

function fieldMessage(id: string, hint?: string, error?: string) {
  if (error) return { describedBy: `${id}-err`, node: <span id={`${id}-err`} className="pl-error-text">{error}</span> };
  if (hint) return { describedBy: `${id}-hint`, node: <span id={`${id}-hint`} className="pl-hint">{hint}</span> };
  return { describedBy: undefined, node: null };
}

const joinIds = (...ids: Array<string | false | null | undefined>) => ids.filter(Boolean).join(' ') || undefined;

const isRtl = (el: Element | null) => el?.closest('[dir]')?.getAttribute('dir') === 'rtl';

/** Next enabled index from `from` in direction `dir`; stays put at the ends. */
function step<T extends { disabled?: boolean }>(items: T[], from: number, dir: 1 | -1): number {
  for (let i = from + dir; i >= 0 && i < items.length; i += dir) if (!items[i].disabled) return i;
  return from;
}

/** First (dir 1) or last (dir -1) enabled index, or -1. */
function edge<T extends { disabled?: boolean }>(items: T[], dir: 1 | -1): number {
  const i = step(items, dir === 1 ? -1 : items.length, dir);
  return i >= 0 && i < items.length ? i : -1;
}

const includesText = (label: string, query: string) => label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

function scrollIntoViewById(id: string) {
  document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' });
}

function assignRef<T>(ref: Ref<T> | undefined, el: T | null) {
  if (typeof ref === 'function') ref(el);
  else if (ref) (ref as MutableRefObject<T | null>).current = el;
}

const Chevron = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MinusIcon = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
    <path d="M4 8h8" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
  </svg>
);

interface ComboTriggerProps {
  id: string;
  labelId?: string;
  ariaLabel?: string;
  popupId: string;
  popupRole: 'listbox' | 'tree';
  open: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  activeDescendant?: string;
  onToggle: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

/** Select-only combobox trigger (APG "select-only combobox"): the text content is the current value. */
const ComboTrigger = forwardRef<HTMLDivElement, ComboTriggerProps>(function ComboTrigger(p, ref) {
  return (
    <div
      ref={ref}
      id={p.id}
      role="combobox"
      tabIndex={p.disabled ? -1 : 0}
      aria-haspopup={p.popupRole}
      aria-expanded={p.open}
      aria-controls={p.open ? p.popupId : undefined}
      aria-labelledby={p.labelId}
      aria-label={p.labelId ? undefined : p.ariaLabel}
      aria-disabled={p.disabled || undefined}
      aria-invalid={p.invalid || undefined}
      aria-describedby={p.describedBy}
      aria-activedescendant={p.activeDescendant}
      className={cx('pl-select-trigger', p.open && 'is-open', p.disabled && 'is-disabled')}
      onClick={() => !p.disabled && p.onToggle()}
      onKeyDown={p.disabled ? undefined : p.onKeyDown}
    >
      <span className="pl-select-trigger__value">{p.children}</span>
      <Chevron className="pl-select-trigger__icon" />
    </div>
  );
});

/* ======================================================================
 * AutoComplete
 * ==================================================================== */

export interface AutoCompleteProps extends FieldMetaProps {
  /** Options to show. With `onSearch`, pass the already-filtered results; without it, they are filtered locally. */
  suggestions: FormOption[];
  /** Called with the query when the user types (at least `minLength` chars). */
  onSearch?: (query: string) => void;
  /** Text in the input. */
  value?: string;
  defaultValue?: string;
  onChange?: (query: string) => void;
  /** Called when an option is chosen. */
  onSelect?: (option: FormOption) => void;
  /** Chips mode: chosen options are listed before the input. */
  multiple?: boolean;
  selected?: FormOption[];
  defaultSelected?: FormOption[];
  onSelectionChange?: (options: FormOption[]) => void;
  loading?: boolean;
  minLength?: number;
  emptyMessage?: string;
  loadingMessage?: string;
  /** "{0} results available" — announced politely. */
  resultsMessage?: string;
  removeLabel?: (option: FormOption) => string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export const AutoComplete = forwardRef<HTMLInputElement, AutoCompleteProps>(function AutoComplete(props, ref) {
  const {
    label,
    hint,
    error,
    suggestions,
    onSearch,
    value,
    defaultValue = '',
    onChange,
    onSelect,
    multiple = false,
    selected,
    defaultSelected,
    onSelectionChange,
    loading = false,
    minLength = 1,
    emptyMessage = 'No results found',
    loadingMessage = 'Loading…',
    resultsMessage = '{0} results available',
    removeLabel = (o) => `Remove ${o.label}`,
    placeholder,
    disabled,
    id,
    name,
    className,
  } = props;
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const [query, setQuery] = useControllable(value, defaultValue, onChange);
  const [chosen, setChosen] = useControllable(selected, defaultSelected ?? [], onSelectionChange);
  const { open, setOpen, rootRef, onBlur } = usePopup();
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const msg = fieldMessage(inputId, hint, error);

  const items = useMemo(() => {
    let list = onSearch ? suggestions : suggestions.filter((o) => includesText(o.label, query));
    if (multiple) list = list.filter((o) => !chosen.some((c) => c.value === o.value));
    return list;
  }, [onSearch, suggestions, query, multiple, chosen]);

  const optionId = (i: number) => `${listId}-${i}`;
  useEffect(() => {
    if (open && active >= 0) scrollIntoViewById(optionId(active));
  });

  const search = (q: string) => {
    setQuery(q);
    setActive(-1);
    if (q.trim().length >= minLength) {
      setOpen(true);
      onSearch?.(q);
    } else {
      setOpen(false);
    }
  };

  const pick = (o: FormOption) => {
    if (o.disabled) return;
    if (multiple) {
      setChosen([...chosen, o]);
      setQuery('');
    } else {
      setQuery(o.label);
    }
    onSelect?.(o);
    setOpen(false);
    setActive(-1);
  };

  const remove = (o: FormOption) => {
    setChosen(chosen.filter((c) => c.value !== o.value));
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(edge(items, 1));
        } else {
          setActive(step(items, active, 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(edge(items, -1));
        } else {
          setActive(step(items, active === -1 ? items.length : active, -1));
        }
        break;
      case 'Home':
      case 'End':
        // Only take over Home/End once an option is active; otherwise they move the caret.
        if (!open || active < 0) return;
        e.preventDefault();
        setActive(edge(items, e.key === 'Home' ? 1 : -1));
        break;
      case 'Enter':
        if (open && active >= 0 && items[active]) {
          e.preventDefault();
          pick(items[active]);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
          setActive(-1);
        } else if (query) {
          e.preventDefault();
          setQuery('');
        }
        break;
      case 'Backspace':
        if (multiple && !query && chosen.length) setChosen(chosen.slice(0, -1));
        break;
    }
  };

  const status = !open ? '' : loading ? loadingMessage : items.length ? resultsMessage.replace('{0}', String(items.length)) : emptyMessage;

  const input = (
    <input
      ref={(el) => {
        inputRef.current = el;
        assignRef(ref, el);
      }}
      id={inputId}
      name={name}
      type="text"
      role="combobox"
      autoComplete="off"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={msg.describedBy}
      aria-busy={loading || undefined}
      className={cx('pl-input', 'pl-autocomplete__input')}
      placeholder={placeholder}
      disabled={disabled}
      value={query}
      onChange={(e) => search(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );

  return (
    <div className={cx('pl-field', error && 'pl-field--error', className)}>
      {label && (
        <label className="pl-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div ref={rootRef} className={cx('pl-autocomplete', multiple && 'pl-autocomplete--multiple')} onBlur={onBlur}>
        {multiple ? (
          <div className={cx('pl-autocomplete__control', disabled && 'is-disabled')}>
            {chosen.map((o) => (
              <span key={o.value} className="pl-tag pl-chip">
                {o.label}
                <button type="button" className="pl-tag__remove" aria-label={removeLabel(o)} disabled={disabled} onClick={() => remove(o)}>
                  ×
                </button>
              </span>
            ))}
            {input}
          </div>
        ) : (
          input
        )}
        {open && (
          <ul id={listId} role="listbox" aria-label={label} className="pl-popup pl-optionlist" onMouseDown={keepFocus}>
            {loading ? (
              <li role="presentation" className="pl-optionlist__message">
                {loadingMessage}
              </li>
            ) : items.length === 0 ? (
              <li role="presentation" className="pl-optionlist__message">
                {emptyMessage}
              </li>
            ) : (
              items.map((o, i) => (
                <li
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  aria-disabled={o.disabled || undefined}
                  className={cx('pl-option', i === active && 'is-active')}
                  onMouseMove={() => !o.disabled && active !== i && setActive(i)}
                  onClick={() => pick(o)}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        )}
        <span role="status" className="pl-sr-only">
          {status}
        </span>
      </div>
      {msg.node}
    </div>
  );
});

/* ======================================================================
 * MultiSelect
 * ==================================================================== */

export interface MultiSelectProps extends FieldMetaProps {
  options: FormOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  filter?: boolean;
  filterPlaceholder?: string;
  filterLabel?: string;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  /** How chosen items show in the trigger. */
  display?: 'comma' | 'chip';
  /** Above this count the trigger shows `selectedItemsLabel` instead of labels. */
  maxSelectedLabels?: number;
  selectedItemsLabel?: string;
  showClear?: boolean;
  clearLabel?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function MultiSelect({
  label,
  hint,
  error,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select',
  filter = false,
  filterPlaceholder,
  filterLabel = 'Filter options',
  showSelectAll = true,
  selectAllLabel = 'Select all',
  display = 'comma',
  maxSelectedLabels = 3,
  selectedItemsLabel = '{0} items selected',
  showClear = false,
  clearLabel = 'Clear selection',
  emptyMessage = 'No results found',
  disabled,
  id,
  className,
}: MultiSelectProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const listId = `${baseId}-list`;
  const [selected, setSelected] = useControllable(value, defaultValue ?? [], onChange);
  const { open, setOpen, rootRef, onBlur } = usePopup();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const msg = fieldMessage(baseId, hint, error);
  const selectedSet = new Set(selected);

  const filterOptions = (q: string) => (filter && q ? options.filter((o) => includesText(o.label, q)) : options);
  const items = filterOptions(query);
  const enabledItems = items.filter((o) => !o.disabled);
  const allSelected = enabledItems.length > 0 && enabledItems.every((o) => selectedSet.has(o.value));
  const someSelected = enabledItems.some((o) => selectedSet.has(o.value));
  const optionId = (i: number) => `${listId}-${i}`;

  useEffect(() => {
    if (open && filter) filterRef.current?.focus();
  }, [open, filter]);
  useEffect(() => {
    if (open && active >= 0) scrollIntoViewById(optionId(active));
  });

  const openPopup = () => {
    setQuery('');
    const firstSelected = options.findIndex((o) => selectedSet.has(o.value) && !o.disabled);
    setActive(firstSelected >= 0 ? firstSelected : edge(options, 1));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const inOrder = (keep: (o: FormOption) => boolean) => options.filter(keep).map((o) => o.value);
  const toggle = (o: FormOption) => {
    if (o.disabled) return;
    setSelected(selectedSet.has(o.value) ? selected.filter((v) => v !== o.value) : inOrder((x) => x.value === o.value || selectedSet.has(x.value)));
  };
  const toggleAll = () => {
    const visible = new Set(enabledItems.map((o) => o.value));
    setSelected(allSelected ? selected.filter((v) => !visible.has(v)) : inOrder((o) => selectedSet.has(o.value) || visible.has(o.value)));
  };

  const onListKey = (e: KeyboardEvent<HTMLElement>, fromFilter: boolean) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(step(items, active, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (e.altKey) close();
        else setActive(step(items, active === -1 ? items.length : active, -1));
        break;
      case 'Home':
      case 'End':
        if (fromFilter) return;
        e.preventDefault();
        setActive(edge(items, e.key === 'Home' ? 1 : -1));
        break;
      case ' ':
        if (fromFilter) return;
        e.preventDefault();
        if (items[active]) toggle(items[active]);
        break;
      case 'Enter':
        e.preventDefault();
        if (items[active]) toggle(items[active]);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
    }
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (open) return onListKey(e, false);
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openPopup();
    }
  };

  const chosen = options.filter((o) => selectedSet.has(o.value));
  let shown: ReactNode;
  if (!chosen.length) shown = <span className="pl-select-trigger__placeholder">{placeholder}</span>;
  else if (chosen.length > maxSelectedLabels) shown = selectedItemsLabel.replace('{0}', String(chosen.length));
  else if (display === 'chip')
    shown = chosen.map((o) => (
      <span key={o.value} className="pl-tag pl-chip">
        {o.label}
      </span>
    ));
  else shown = chosen.map((o) => o.label).join(', ');

  return (
    <div className={cx('pl-field', error && 'pl-field--error', className)}>
      {label && (
        <span id={labelId} className="pl-label" onClick={() => triggerRef.current?.focus()}>
          {label}
        </span>
      )}
      <div ref={rootRef} className={cx('pl-dropdown', showClear && chosen.length > 0 && 'pl-dropdown--clearable')} onBlur={onBlur}>
        <ComboTrigger
          ref={triggerRef}
          id={`${baseId}-trigger`}
          labelId={label ? labelId : undefined}
          ariaLabel={placeholder}
          popupId={listId}
          popupRole="listbox"
          open={open}
          disabled={disabled}
          invalid={!!error}
          describedBy={msg.describedBy}
          activeDescendant={open && !filter && active >= 0 ? optionId(active) : undefined}
          onToggle={() => (open ? setOpen(false) : openPopup())}
          onKeyDown={onTriggerKey}
        >
          {shown}
        </ComboTrigger>
        {showClear && chosen.length > 0 && !disabled && (
          <button
            type="button"
            className="pl-dropdown__clear"
            aria-label={clearLabel}
            onClick={() => {
              setSelected([]);
              triggerRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
        {open && (
          <div className="pl-popup pl-dropdown__panel" onMouseDown={keepFocus}>
            {(showSelectAll || filter) && (
              <div className="pl-dropdown__header">
                {showSelectAll && (
                  <label className="pl-check">
                    <input
                      type="checkbox"
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      checked={allSelected}
                      disabled={!enabledItems.length}
                      onChange={toggleAll}
                    />
                    {selectAllLabel}
                  </label>
                )}
                {filter && (
                  <input
                    ref={filterRef}
                    type="text"
                    className="pl-input pl-dropdown__filter"
                    aria-label={filterLabel}
                    aria-controls={listId}
                    aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                    placeholder={filterPlaceholder}
                    autoComplete="off"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActive(edge(filterOptions(e.target.value), 1));
                    }}
                    onKeyDown={(e) => onListKey(e, true)}
                  />
                )}
              </div>
            )}
            <ul id={listId} role="listbox" aria-multiselectable="true" aria-labelledby={label ? labelId : undefined} aria-label={label ? undefined : placeholder} className="pl-optionlist">
              {items.length === 0 ? (
                <li role="presentation" className="pl-optionlist__message">
                  {emptyMessage}
                </li>
              ) : (
                items.map((o, i) => {
                  const isSel = selectedSet.has(o.value);
                  return (
                    <li
                      key={o.value}
                      id={optionId(i)}
                      role="option"
                      aria-selected={isSel}
                      aria-disabled={o.disabled || undefined}
                      className={cx('pl-option', i === active && 'is-active')}
                      onClick={() => {
                        setActive(i);
                        toggle(o);
                      }}
                    >
                      <span className="pl-option__check" aria-hidden="true">
                        {isSel && <CheckIcon />}
                      </span>
                      {o.label}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
      {msg.node}
    </div>
  );
}

/* ======================================================================
 * Listbox
 * ==================================================================== */

export interface ListboxProps extends FieldMetaProps {
  options: FormOption[];
  multiple?: boolean;
  /** A value (single) or array of values (multiple). */
  value?: string | string[] | null;
  defaultValue?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  filter?: boolean;
  filterPlaceholder?: string;
  filterLabel?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Accessible name when there is no visible `label`. */
  ariaLabel?: string;
}

export function Listbox({
  label,
  hint,
  error,
  options,
  multiple = false,
  value,
  defaultValue,
  onChange,
  filter = false,
  filterPlaceholder,
  filterLabel = 'Filter options',
  emptyMessage = 'No results found',
  disabled,
  id,
  className,
  ariaLabel,
}: ListboxProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const listId = `${baseId}-list`;
  const [raw, setRaw] = useControllable<string | string[] | null>(value, defaultValue ?? (multiple ? [] : null), onChange);
  const selected = new Set(raw == null ? [] : Array.isArray(raw) ? raw : [raw]);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', timer: 0 });
  const msg = fieldMessage(baseId, hint, error);
  const items = filter && query ? options.filter((o) => includesText(o.label, query)) : options;
  const optionId = (i: number) => `${listId}-${i}`;

  useEffect(() => () => window.clearTimeout(typeahead.current.timer), []);
  useEffect(() => {
    if (active >= 0) scrollIntoViewById(optionId(active));
  });

  const choose = (o: FormOption | undefined) => {
    if (!o || o.disabled || disabled) return;
    if (!multiple) return setRaw(o.value);
    setRaw(selected.has(o.value) ? [...selected].filter((v) => v !== o.value) : options.filter((x) => selected.has(x.value) || x.value === o.value).map((x) => x.value));
  };

  const findByPrefix = (key: string) => {
    const t = typeahead.current;
    window.clearTimeout(t.timer);
    t.text += key.toLocaleLowerCase();
    t.timer = window.setTimeout(() => {
      t.text = '';
    }, 500);
    // Repeating one letter cycles through the items that start with it.
    const cycling = [...t.text].every((c) => c === t.text[0]);
    const needle = cycling ? t.text[0] : t.text;
    const start = cycling || active < 0 ? active + 1 : active;
    for (let k = 0; k < items.length; k++) {
      const i = (start + k) % items.length;
      if (!items[i].disabled && items[i].label.toLocaleLowerCase().startsWith(needle)) return setActive(i);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (disabled) return;
    let next = -2;
    switch (e.key) {
      case 'ArrowDown':
        next = step(items, active, 1);
        break;
      case 'ArrowUp':
        next = step(items, active === -1 ? items.length : active, -1);
        break;
      case 'Home':
        next = edge(items, 1);
        break;
      case 'End':
        next = edge(items, -1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        choose(items[active]);
        return;
      default:
        if (multiple && e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          const enabled = options.filter((o) => !o.disabled);
          setRaw(enabled.every((o) => selected.has(o.value)) ? [] : enabled.map((o) => o.value));
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          findByPrefix(e.key);
        }
        return;
    }
    e.preventDefault();
    if (multiple && e.shiftKey && next !== active && items[next]) choose(items[next]);
    setActive(next);
  };

  return (
    <div className={cx('pl-field', error && 'pl-field--error', className)}>
      {label && (
        <span id={labelId} className="pl-label">
          {label}
        </span>
      )}
      <div className={cx('pl-listbox', disabled && 'is-disabled')}>
        {filter && (
          <div className="pl-listbox__header">
            <input
              type="text"
              className="pl-input"
              aria-label={filterLabel}
              aria-controls={listId}
              placeholder={filterPlaceholder}
              value={query}
              disabled={disabled}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  listRef.current?.focus();
                }
              }}
            />
          </div>
        )}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : ariaLabel}
          aria-multiselectable={multiple || undefined}
          aria-activedescendant={active >= 0 && items[active] ? optionId(active) : undefined}
          aria-disabled={disabled || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={msg.describedBy}
          className="pl-optionlist pl-listbox__list"
          onFocus={() => {
            if (active >= 0) return;
            const i = items.findIndex((o) => selected.has(o.value) && !o.disabled);
            setActive(i >= 0 ? i : edge(items, 1));
          }}
          onKeyDown={onKeyDown}
        >
          {items.length === 0 ? (
            <li role="presentation" className="pl-optionlist__message">
              {emptyMessage}
            </li>
          ) : (
            items.map((o, i) => {
              const isSel = selected.has(o.value);
              return (
                <li
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  className={cx('pl-option', i === active && 'is-active')}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setActive(i);
                    choose(o);
                    listRef.current?.focus();
                  }}
                >
                  {multiple && (
                    <span className="pl-option__check" aria-hidden="true">
                      {isSel && <CheckIcon />}
                    </span>
                  )}
                  {o.label}
                </li>
              );
            })
          )}
        </ul>
      </div>
      {msg.node}
    </div>
  );
}

/* ======================================================================
 * CascadeSelect
 * ==================================================================== */

export interface CascadeOption {
  label: string;
  /** Leaf value. Groups (with `children`) are not selectable. */
  value?: string;
  children?: CascadeOption[];
  disabled?: boolean;
}

export interface CascadeSelectProps extends FieldMetaProps {
  options: CascadeOption[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null, option?: CascadeOption) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function findCascadePath(options: CascadeOption[], value: string): number[] | null {
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    if (o.children?.length) {
      const sub = findCascadePath(o.children, value);
      if (sub) return [i, ...sub];
    } else if (o.value === value) {
      return [i];
    }
  }
  return null;
}

const cascadeLevel = (options: CascadeOption[], prefix: number[]) => prefix.reduce<CascadeOption[]>((list, i) => list[i]?.children ?? [], options);

export function CascadeSelect({ label, hint, error, options, value, defaultValue = null, onChange, placeholder = 'Select', disabled, id, className }: CascadeSelectProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const treeId = `${baseId}-tree`;
  const [current, setCurrent] = useControllable<string | null>(value, defaultValue);
  const { open, setOpen, rootRef, onBlur } = usePopup();
  // Index path of the focused item; every item before the last is an expanded group.
  const [path, setPath] = useState<number[]>([]);
  const triggerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const msg = fieldMessage(baseId, hint, error);

  const itemAt = (p: number[]) => cascadeLevel(options, p.slice(0, -1))[p[p.length - 1]];
  const selectedPath = current != null ? findCascadePath(options, current) : null;
  const selectedOption = selectedPath ? itemAt(selectedPath) : undefined;

  useEffect(() => {
    if (open && path.length) itemRefs.current.get(path.join('-'))?.focus();
  }, [open, path]);

  const openPopup = () => {
    setPath(selectedPath ?? [Math.max(0, edge(options, 1))]);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const select = (o: CascadeOption) => {
    if (o.disabled) return;
    setCurrent(o.value ?? null);
    onChange?.(o.value ?? null, o);
    close();
  };
  const activate = (p: number[]) => {
    const o = itemAt(p);
    if (!o || o.disabled) return;
    if (o.children?.length) setPath([...p, Math.max(0, edge(o.children, 1))]);
    else select(o);
  };

  const onTreeKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const level = cascadeLevel(options, path.slice(0, -1));
    const idx = path[path.length - 1];
    const item = level[idx];
    const rtl = isRtl(e.currentTarget);
    const setLast = (i: number) => i >= 0 && setPath([...path.slice(0, -1), i]);
    switch (e.key) {
      case 'ArrowDown':
        setLast(step(level, idx, 1));
        break;
      case 'ArrowUp':
        setLast(step(level, idx, -1));
        break;
      case 'Home':
        setLast(edge(level, 1));
        break;
      case 'End':
        setLast(edge(level, -1));
        break;
      case rtl ? 'ArrowLeft' : 'ArrowRight':
        if (item?.children?.length && !item.disabled) setPath([...path, Math.max(0, edge(item.children, 1))]);
        break;
      case rtl ? 'ArrowRight' : 'ArrowLeft':
        if (path.length > 1) setPath(path.slice(0, -1));
        break;
      case 'Enter':
      case ' ':
        activate(path);
        break;
      case 'Escape':
        close();
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const renderLevel = (items: CascadeOption[], depth: number, prefix: number[]): ReactNode => (
    <ul
      role={depth === 0 ? 'tree' : 'group'}
      id={depth === 0 ? treeId : undefined}
      aria-labelledby={depth === 0 && label ? labelId : undefined}
      aria-label={depth === 0 && !label ? placeholder : undefined}
      className={cx('pl-optionlist', 'pl-cascade__list', depth === 0 ? 'pl-popup' : 'pl-cascade__sublist')}
      onKeyDown={depth === 0 ? onTreeKey : undefined}
      onMouseDown={depth === 0 ? keepFocus : undefined}
    >
      {items.map((item, i) => {
        const p = [...prefix, i];
        const key = p.join('-');
        const onPath = path[depth] === i;
        const hasKids = !!item.children?.length;
        const expanded = hasKids ? onPath && path.length > depth + 1 : undefined;
        const focused = onPath && path.length === depth + 1;
        return (
          <li
            key={key}
            ref={(el) => {
              if (el) itemRefs.current.set(key, el);
              else itemRefs.current.delete(key);
            }}
            role="treeitem"
            aria-level={depth + 1}
            aria-expanded={expanded}
            aria-label={hasKids ? item.label : undefined}
            aria-selected={hasKids ? undefined : item.value === current}
            aria-disabled={item.disabled || undefined}
            tabIndex={focused ? 0 : -1}
            className={cx('pl-option', 'pl-cascade__item', focused && 'is-active', onPath && 'is-on-path')}
            onClick={(e) => {
              e.stopPropagation();
              setPath(p);
              activate(p);
            }}
          >
            <span className="pl-cascade__label">{item.label}</span>
            {hasKids && <Chevron className="pl-cascade__arrow" />}
            {expanded && renderLevel(item.children!, depth + 1, p)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={cx('pl-field', error && 'pl-field--error', className)}>
      {label && (
        <span id={labelId} className="pl-label" onClick={() => triggerRef.current?.focus()}>
          {label}
        </span>
      )}
      <div ref={rootRef} className="pl-dropdown pl-cascade" onBlur={onBlur}>
        <ComboTrigger
          ref={triggerRef}
          id={`${baseId}-trigger`}
          labelId={label ? labelId : undefined}
          ariaLabel={placeholder}
          popupId={treeId}
          popupRole="tree"
          open={open}
          disabled={disabled}
          invalid={!!error}
          describedBy={msg.describedBy}
          onToggle={() => (open ? setOpen(false) : openPopup())}
          onKeyDown={(e) => {
            if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
              e.preventDefault();
              openPopup();
            }
          }}
        >
          {selectedOption ? selectedOption.label : <span className="pl-select-trigger__placeholder">{placeholder}</span>}
        </ComboTrigger>
        {open && renderLevel(options, 0, [])}
      </div>
      {msg.node}
    </div>
  );
}

/* ======================================================================
 * TreeSelect
 * ==================================================================== */

export interface TreeSelectNode {
  key: string;
  label: string;
  children?: TreeSelectNode[];
  disabled?: boolean;
  /** Single mode: set false to make a node only expandable. */
  selectable?: boolean;
}

export interface TreeSelectProps extends FieldMetaProps {
  nodes: TreeSelectNode[];
  /** 'single' selects one node key; 'checkbox' selects leaf keys (parents check all their leaves). */
  selectionMode?: 'single' | 'checkbox';
  value?: string | string[] | null;
  defaultValue?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  defaultExpandedKeys?: string[];
  placeholder?: string;
  maxSelectedLabels?: number;
  selectedItemsLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

interface FlatTreeNode {
  node: TreeSelectNode;
  level: number;
  parent?: string;
  posinset: number;
  setsize: number;
}

function flattenTree(nodes: TreeSelectNode[], expanded: Set<string>, level = 1, parent?: string, out: FlatTreeNode[] = []) {
  nodes.forEach((node, i) => {
    out.push({ node, level, parent, posinset: i + 1, setsize: nodes.length });
    if (node.children?.length && expanded.has(node.key)) flattenTree(node.children, expanded, level + 1, node.key, out);
  });
  return out;
}

function leafKeys(node: TreeSelectNode): string[] {
  if (node.children?.length) return node.children.flatMap(leafKeys);
  return node.disabled ? [] : [node.key];
}

function ancestorsOf(nodes: TreeSelectNode[], key: string, trail: string[] = []): string[] | null {
  for (const n of nodes) {
    if (n.key === key) return trail;
    if (n.children) {
      const found = ancestorsOf(n.children, key, [...trail, n.key]);
      if (found) return found;
    }
  }
  return null;
}

function findTreeNode(nodes: TreeSelectNode[], key: string): TreeSelectNode | undefined {
  for (const n of nodes) {
    if (n.key === key) return n;
    const found = n.children && findTreeNode(n.children, key);
    if (found) return found;
  }
  return undefined;
}

export function TreeSelect({
  label,
  hint,
  error,
  nodes,
  selectionMode = 'single',
  value,
  defaultValue,
  onChange,
  defaultExpandedKeys = [],
  placeholder = 'Select',
  maxSelectedLabels = 3,
  selectedItemsLabel = '{0} items selected',
  disabled,
  id,
  className,
}: TreeSelectProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const treeId = `${baseId}-tree`;
  const checkbox = selectionMode === 'checkbox';
  const [raw, setRaw] = useControllable<string | string[] | null>(value, defaultValue ?? (checkbox ? [] : null), onChange);
  const selectedKeys = new Set(raw == null ? [] : Array.isArray(raw) ? raw : [raw]);
  const { open, setOpen, rootRef, onBlur } = usePopup();
  const [expanded, setExpanded] = useState(() => new Set(defaultExpandedKeys));
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const msg = fieldMessage(baseId, hint, error);
  const visible = useMemo(() => flattenTree(nodes, expanded), [nodes, expanded]);
  const allLeaves = useMemo(() => nodes.flatMap(leafKeys), [nodes]);

  useEffect(() => {
    if (open && focusKey) itemRefs.current.get(focusKey)?.focus();
  }, [open, focusKey]);

  const stateOf = (node: TreeSelectNode): boolean | 'mixed' => {
    const leaves = leafKeys(node);
    const n = leaves.filter((k) => selectedKeys.has(k)).length;
    return n === 0 ? false : n === leaves.length ? true : 'mixed';
  };

  const openPopup = () => {
    const first = [...selectedKeys][0];
    const anc = first ? ancestorsOf(nodes, first) : null;
    if (anc?.length) setExpanded((prev) => new Set([...prev, ...anc]));
    setFocusKey(anc ? first : nodes[0]?.key ?? null);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const toggleExpand = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const choose = (node: TreeSelectNode) => {
    if (node.disabled) return;
    if (checkbox) {
      const all = stateOf(node) === true;
      const next = new Set(selectedKeys);
      for (const k of leafKeys(node)) {
        if (all) next.delete(k);
        else next.add(k);
      }
      setRaw(allLeaves.filter((k) => next.has(k)));
    } else if (node.selectable === false) {
      if (node.children?.length) toggleExpand(node.key);
    } else {
      setRaw(node.key);
      close();
    }
  };

  const onTreeKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const idx = visible.findIndex((f) => f.node.key === focusKey);
    const cur = visible[idx];
    if (!cur) return;
    const rtl = isRtl(e.currentTarget);
    const hasKids = !!cur.node.children?.length;
    const isOpen = expanded.has(cur.node.key);
    switch (e.key) {
      case 'ArrowDown':
        if (idx < visible.length - 1) setFocusKey(visible[idx + 1].node.key);
        break;
      case 'ArrowUp':
        if (idx > 0) setFocusKey(visible[idx - 1].node.key);
        break;
      case 'Home':
        setFocusKey(visible[0].node.key);
        break;
      case 'End':
        setFocusKey(visible[visible.length - 1].node.key);
        break;
      case rtl ? 'ArrowLeft' : 'ArrowRight':
        if (hasKids && !isOpen) toggleExpand(cur.node.key);
        else if (hasKids) setFocusKey(visible[idx + 1].node.key);
        break;
      case rtl ? 'ArrowRight' : 'ArrowLeft':
        if (hasKids && isOpen) toggleExpand(cur.node.key);
        else if (cur.parent) setFocusKey(cur.parent);
        break;
      case 'Enter':
      case ' ':
        choose(cur.node);
        break;
      case 'Escape':
        close();
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  let shown: ReactNode;
  const chosenLabels = checkbox
    ? allLeaves.filter((k) => selectedKeys.has(k)).map((k) => findTreeNode(nodes, k)?.label ?? k)
    : [...selectedKeys].map((k) => findTreeNode(nodes, k)?.label ?? k);
  if (!chosenLabels.length) shown = <span className="pl-select-trigger__placeholder">{placeholder}</span>;
  else if (chosenLabels.length > maxSelectedLabels) shown = selectedItemsLabel.replace('{0}', String(chosenLabels.length));
  else shown = chosenLabels.join(', ');

  return (
    <div className={cx('pl-field', error && 'pl-field--error', className)}>
      {label && (
        <span id={labelId} className="pl-label" onClick={() => triggerRef.current?.focus()}>
          {label}
        </span>
      )}
      <div ref={rootRef} className="pl-dropdown pl-treeselect" onBlur={onBlur}>
        <ComboTrigger
          ref={triggerRef}
          id={`${baseId}-trigger`}
          labelId={label ? labelId : undefined}
          ariaLabel={placeholder}
          popupId={treeId}
          popupRole="tree"
          open={open}
          disabled={disabled}
          invalid={!!error}
          describedBy={msg.describedBy}
          onToggle={() => (open ? setOpen(false) : openPopup())}
          onKeyDown={(e) => {
            if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
              e.preventDefault();
              openPopup();
            }
          }}
        >
          {shown}
        </ComboTrigger>
        {open && (
          <ul
            id={treeId}
            role="tree"
            aria-labelledby={label ? labelId : undefined}
            aria-label={label ? undefined : placeholder}
            aria-multiselectable={checkbox || undefined}
            className="pl-popup pl-optionlist pl-treeselect__tree"
            onKeyDown={onTreeKey}
            onMouseDown={keepFocus}
          >
            {visible.map(({ node, level, posinset, setsize }) => {
              const hasKids = !!node.children?.length;
              const isOpen = expanded.has(node.key);
              const state = checkbox ? stateOf(node) : undefined;
              return (
                <li
                  key={node.key}
                  ref={(el) => {
                    if (el) itemRefs.current.set(node.key, el);
                    else itemRefs.current.delete(node.key);
                  }}
                  role="treeitem"
                  aria-level={level}
                  aria-posinset={posinset}
                  aria-setsize={setsize}
                  aria-expanded={hasKids ? isOpen : undefined}
                  aria-selected={checkbox ? undefined : selectedKeys.has(node.key)}
                  aria-checked={state}
                  aria-disabled={node.disabled || undefined}
                  tabIndex={node.key === focusKey ? 0 : -1}
                  className={cx('pl-option', 'pl-treeselect__item', node.key === focusKey && 'is-active')}
                  style={{ '--pl-level': level - 1 } as CSSProperties}
                  onClick={() => {
                    setFocusKey(node.key);
                    choose(node);
                  }}
                >
                  <span
                    className="pl-treeselect__toggle"
                    aria-hidden="true"
                    onClick={(e) => {
                      if (!hasKids) return;
                      e.stopPropagation();
                      toggleExpand(node.key);
                      setFocusKey(node.key);
                    }}
                  >
                    {hasKids && <Chevron />}
                  </span>
                  {checkbox && (
                    <span className="pl-option__check" aria-hidden="true">
                      {state === true ? <CheckIcon /> : state === 'mixed' ? <MinusIcon /> : null}
                    </span>
                  )}
                  <span>{node.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {msg.node}
    </div>
  );
}

/* ======================================================================
 * InputNumber
 * ==================================================================== */

/** Parses a localized number (any digits, the locale's decimal sign; group signs and symbols are ignored). */
function numberParser(locale?: string) {
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === 'decimal')?.value ?? '.';
  const digits = [...new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210)].reverse();
  return (text: string): number | null => {
    let s = '';
    for (const ch of text) {
      const d = digits.indexOf(ch);
      if (d >= 0) s += d;
      else if (/[0-9]/.test(ch)) s += ch;
      else if (ch === decimal && !s.includes('.')) s += '.';
    }
    if (!/[0-9]/.test(s)) return null;
    const n = Number(s);
    return /[-−]/.test(text) ? -n : n;
  };
}

const roundFloat = (n: number) => Number(n.toFixed(10));

export interface InputNumberProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step' | 'prefix'>,
    FieldMetaProps {
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  /** 'percent' uses Intl semantics: value 0.25 shows as 25 %. */
  mode?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  locale?: string;
  useGrouping?: boolean;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  min?: number;
  max?: number;
  /** Default 1 (0.01 in percent mode). */
  step?: number;
  showButtons?: boolean;
  prefix?: string;
  suffix?: string;
  incrementLabel?: string;
  decrementLabel?: string;
}

export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(function InputNumber(
  {
    label,
    hint,
    error,
    id,
    className,
    value,
    defaultValue = null,
    onChange,
    mode = 'decimal',
    currency = 'USD',
    locale,
    useGrouping = true,
    minFractionDigits,
    maxFractionDigits,
    min,
    max,
    step: stepProp,
    showButtons = false,
    prefix = '',
    suffix = '',
    incrementLabel = 'Increment',
    decrementLabel = 'Decrement',
    disabled,
    readOnly,
    onFocus,
    onBlur,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msg = fieldMessage(inputId, hint, error);
  const [num, setNum] = useControllable<number | null>(value, defaultValue, onChange);
  const [draft, setDraft] = useState<string | null>(null);
  const stepSize = stepProp ?? (mode === 'percent' ? 0.01 : 1);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: mode,
        currency: mode === 'currency' ? currency : undefined,
        useGrouping,
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
      }),
    [locale, mode, currency, useGrouping, minFractionDigits, maxFractionDigits],
  );
  const parse = useMemo(() => numberParser(locale), [locale]);
  const format = (n: number | null) => (n == null ? '' : `${prefix}${formatter.format(n)}${suffix}`);
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

  const toValue = (text: string): number | null => {
    let t = text;
    if (prefix && t.startsWith(prefix)) t = t.slice(prefix.length);
    if (suffix && t.endsWith(suffix)) t = t.slice(0, -suffix.length);
    const n = parse(t);
    return n == null ? null : mode === 'percent' ? roundFloat(n / 100) : n;
  };
  const commit = (n: number | null) => {
    const next = n == null ? null : clamp(n);
    if (next !== num) setNum(next);
    return next;
  };
  const spin = (dir: 1 | -1, times = 1) => {
    if (disabled || readOnly) return;
    const next = commit(roundFloat((num ?? 0) + dir * stepSize * times));
    if (draft !== null) setDraft(format(next));
  };
  const jump = (to: number | undefined) => {
    if (to === undefined || disabled || readOnly) return false;
    commit(to);
    if (draft !== null) setDraft(format(to));
    return true;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    switch (e.key) {
      case 'ArrowUp':
        spin(1);
        break;
      case 'ArrowDown':
        spin(-1);
        break;
      case 'PageUp':
        spin(1, 10);
        break;
      case 'PageDown':
        spin(-1, 10);
        break;
      case 'Home':
        if (!jump(min)) return;
        break;
      case 'End':
        if (!jump(max)) return;
        break;
      case 'Enter':
        setDraft(format(commit(draft == null ? num : toValue(draft))));
        return;
      default:
        return;
    }
    e.preventDefault();
  };

  const atMax = max !== undefined && num != null && num >= max;
  const atMin = min !== undefined && num != null && num <= min;

  return (
    <div className={cx('pl-field', error && 'pl-field--error')}>
      {label && (
        <label className="pl-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={cx('pl-inputnumber', showButtons && 'pl-inputnumber--buttons')}>
        <input
          {...rest}
          ref={ref}
          id={inputId}
          type="text"
          role="spinbutton"
          inputMode={maxFractionDigits === 0 ? 'numeric' : 'decimal'}
          autoComplete="off"
          aria-valuenow={num ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={num == null ? undefined : format(num)}
          aria-invalid={error ? true : undefined}
          aria-describedby={joinIds(msg.describedBy, rest['aria-describedby'])}
          className={cx('pl-input', className)}
          disabled={disabled}
          readOnly={readOnly}
          value={draft ?? format(num)}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = toValue(e.target.value);
            if (n !== num) setNum(n);
          }}
          onFocus={(e) => {
            setDraft(format(num));
            onFocus?.(e);
          }}
          onBlur={(e) => {
            commit(draft == null ? num : toValue(draft));
            setDraft(null);
            onBlur?.(e);
          }}
          onKeyDown={handleKeyDown}
        />
        {showButtons && (
          <span className="pl-inputnumber__buttons">
            <button
              type="button"
              tabIndex={-1}
              className="pl-inputnumber__btn"
              aria-label={incrementLabel}
              aria-controls={inputId}
              disabled={disabled || readOnly || atMax}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => spin(1)}
            >
              <Chevron className="pl-inputnumber__up" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              className="pl-inputnumber__btn"
              aria-label={decrementLabel}
              aria-controls={inputId}
              disabled={disabled || readOnly || atMin}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => spin(-1)}
            >
              <Chevron />
            </button>
          </span>
        )}
      </div>
      {msg.node}
    </div>
  );
});

/* ======================================================================
 * InputMask
 * ==================================================================== */

type MaskToken = { slot: RegExp } | { literal: string };

const MASK_SLOTS: Record<string, RegExp> = {
  '9': /^[0-9]$/,
  a: /^\p{L}$/u,
  '*': /^[\p{L}\p{N}]$/u,
};

function parseMask(mask: string): MaskToken[] {
  return [...mask].map((c) => (MASK_SLOTS[c] ? { slot: MASK_SLOTS[c] } : { literal: c }));
}

export interface InputMaskChange {
  masked: string;
  complete: boolean;
}

export interface InputMaskProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'>, FieldMetaProps {
  /** 9 = digit, a = letter, * = letter or digit; anything else is a literal. */
  mask: string;
  /** Unmasked value (slot characters only). */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, detail: InputMaskChange) => void;
  onComplete?: (value: string) => void;
  slotChar?: string;
  /** Clear an incomplete value on blur. */
  autoClear?: boolean;
}

export const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(function InputMask(
  { label, hint, error, id, className, mask, value, defaultValue = '', onChange, onComplete, slotChar = '_', autoClear = false, onFocus, onBlur, onKeyDown, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msg = fieldMessage(inputId, hint, error);
  const tokens = useMemo(() => parseMask(mask), [mask]);
  const slots = useMemo(() => tokens.flatMap((t, i) => ('slot' in t ? [i] : [])), [tokens]);
  const [raw, setRaw] = useControllable<string>(value, defaultValue);
  const [focused, setFocused] = useState(false);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);

  /** Fill slots in order with the characters that fit them. */
  const fit = (chars: string[]) => {
    let out = '';
    for (const c of chars) {
      if (out.length >= slots.length) break;
      if ((tokens[slots[out.length]] as { slot: RegExp }).slot.test(c)) out += c;
    }
    return out;
  };
  /** Characters of a typed string that may be user input (not slot chars, not literals in place). */
  const candidates = (text: string) =>
    [...text].filter((c, i) => {
      if (c === slotChar) return false;
      const t = tokens[i];
      return !(t && 'literal' in t && t.literal === c);
    });
  const masked = (r: string) => {
    let si = 0;
    return tokens.map((t) => ('literal' in t ? t.literal : r[si++] ?? slotChar)).join('');
  };
  const caretFor = (k: number) => (k < slots.length ? slots[k] : tokens.length);
  const current = fit([...raw]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (caretRef.current != null && el && document.activeElement === el) el.setSelectionRange(caretRef.current, caretRef.current);
    caretRef.current = null;
  });

  const update = (next: string, caret: number) => {
    caretRef.current = caret;
    if (next === current) return rerender();
    setRaw(next);
    const complete = next.length === slots.length;
    onChange?.(next, { masked: masked(next), complete });
    if (complete) onComplete?.(next);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const caret = e.target.selectionStart ?? text.length;
    const next = fit(candidates(text));
    update(next, caretFor(Math.min(fit(candidates(text.slice(0, caret))).length, next.length)));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    if (start !== (el.selectionEnd ?? 0)) return; // range deletes go through onChange
    if (e.key === 'Backspace') {
      e.preventDefault();
      let ord = -1;
      for (let s = slots.length - 1; s >= 0; s--) {
        if (slots[s] < start) {
          ord = s;
          break;
        }
      }
      ord = Math.min(ord, current.length - 1);
      if (ord < 0) return update(current, caretFor(0));
      update(current.slice(0, ord) + current.slice(ord + 1), slots[ord]);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const ord = slots.findIndex((p) => p >= start);
      if (ord < 0 || ord >= current.length) return;
      update(current.slice(0, ord) + current.slice(ord + 1), slots[ord]);
    }
  };

  return (
    <div className={cx('pl-field', error && 'pl-field--error')}>
      {label && (
        <label className="pl-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        {...rest}
        ref={(el) => {
          inputRef.current = el;
          assignRef(ref, el);
        }}
        id={inputId}
        type="text"
        autoComplete="off"
        className={cx('pl-input', 'pl-inputmask', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={joinIds(msg.describedBy, rest['aria-describedby'])}
        value={focused || current ? masked(current) : ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          caretRef.current = caretFor(current.length);
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          if (autoClear && current && current.length < slots.length) update('', 0);
          onBlur?.(e);
        }}
      />
      {msg.node}
    </div>
  );
});

/* ======================================================================
 * InputOtp
 * ==================================================================== */

export interface InputOtpProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  integerOnly?: boolean;
  /** Hide characters like a password. */
  mask?: boolean;
  /** With `mask`: show a button that reveals the code. */
  revealable?: boolean;
  /** Group label. */
  label?: string;
  hint?: string;
  error?: string;
  /** Success state; a string is also shown (and announced) as a message. */
  success?: boolean | string;
  /** Group sizes, e.g. [3, 3] renders 123 – 456. Ignored unless they add up to `length`. */
  groups?: number[];
  /** Decorative separator between groups. Default an en dash. */
  separator?: ReactNode;
  /** Seconds before the resend button unlocks (shows a countdown). */
  resendAfter?: number;
  onResend?: () => void;
  /** Replaces the built-in resend countdown/button. */
  resendSlot?: ReactNode;
  /** Accessible name per cell. */
  cellLabel?: (index: number, length: number) => string;
  labels?: Partial<InputOtpLabels>;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  className?: string;
}

export interface InputOtpLabels {
  show: string;
  hide: string;
  resend: string;
  resendIn: (seconds: number) => string;
}

const DEFAULT_OTP_LABELS: InputOtpLabels = {
  show: 'Show code',
  hide: 'Hide code',
  resend: 'Resend code',
  resendIn: (s) => `Resend code in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
};

/**
 * One-time-code input: one cell per character with an animated caret, paste and SMS autofill
 * (autocomplete="one-time-code"), numeric keypad on mobile, groups, masking with reveal, a resend
 * countdown, an error shake (static under reduced motion) and a success state. Digits stay LTR in RTL.
 */
export function InputOtp({
  length = 4,
  value,
  defaultValue = '',
  onChange,
  onComplete,
  integerOnly = false,
  mask = false,
  revealable = false,
  label,
  hint,
  error,
  success,
  groups,
  separator = '–',
  resendAfter,
  onResend,
  resendSlot,
  cellLabel = (i, n) => `Digit ${i} of ${n}`,
  labels: labelOverrides,
  disabled,
  autoFocus,
  id,
  className,
}: InputOtpProps) {
  const L = { ...DEFAULT_OTP_LABELS, ...labelOverrides };
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const msgId = `${baseId}-msg`;
  const [code, setCode] = useControllable(value, defaultValue, onChange);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const groupRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const [remaining, setRemaining] = useState(resendAfter ?? 0);

  const valid = (c: string) => (integerOnly ? /^[0-9]$/.test(c) : /^[\p{L}\p{N}]$/u.test(c));
  const focusCell = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };
  const emit = (next: string) => {
    const v = next.slice(0, length);
    setCode(v);
    if (v.length === length && v !== code) onComplete?.(v);
  };
  /** Write `chars` starting at cell `i` (cells are contiguous, so never past the current end). */
  const write = (i: number, chars: string) => {
    const pos = Math.min(i, code.length);
    emit(code.slice(0, pos) + chars + code.slice(pos + chars.length));
    focusCell(pos + chars.length);
  };
  const fill = (i: number, text: string) => {
    const chars = [...text].filter(valid).join('');
    if (!chars) return;
    if (chars.length >= length) {
      emit(chars.slice(0, length));
      focusCell(length - 1);
    } else {
      write(i, chars);
    }
  };

  // Error shake: restart the animation each time a (new) error appears.
  useEffect(() => {
    const el = groupRef.current;
    if (!el || !error) return;
    el.removeAttribute('data-shake');
    void el.offsetWidth;
    el.setAttribute('data-shake', '');
    const t = window.setTimeout(() => el.removeAttribute('data-shake'), 600);
    return () => window.clearTimeout(t);
  }, [error]);

  // Resend countdown.
  useEffect(() => {
    if (!resendAfter || remaining <= 0) return;
    const t = window.setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [remaining, resendAfter]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        if (code[i]) emit(code.slice(0, i) + code.slice(i + 1));
        else if (i > 0) {
          const j = Math.min(i - 1, code.length - 1);
          if (j >= 0) emit(code.slice(0, j) + code.slice(j + 1));
          focusCell(i - 1);
        }
        break;
      case 'Delete':
        e.preventDefault();
        if (code[i]) emit(code.slice(0, i) + code.slice(i + 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusCell(i - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        focusCell(i + 1);
        break;
      case 'Home':
        e.preventDefault();
        focusCell(0);
        break;
      case 'End':
        e.preventDefault();
        focusCell(length - 1);
        break;
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>, i: number) => {
    e.preventDefault();
    fill(i, e.clipboardData.getData('text'));
  };

  const groupSizes = groups && groups.reduce((a, b) => a + b, 0) === length && groups.every((g) => g > 0) ? groups : [length];
  const groupEnds = new Set(groupSizes.slice(0, -1).reduce<number[]>((acc, g) => [...acc, (acc[acc.length - 1] ?? 0) + g], []));
  const state = error ? 'error' : success ? 'success' : undefined;
  const hidden = mask && !revealed;
  const message = error ? (
    <span id={msgId} className="pl-error-text" role="alert">
      {error}
    </span>
  ) : typeof success === 'string' ? (
    <span id={msgId} className="pl-otp__success" role="status">
      {success}
    </span>
  ) : hint ? (
    <span id={msgId} className="pl-hint">
      {hint}
    </span>
  ) : null;

  const cells: ReactNode[] = [];
  for (let i = 0; i < length; i++) {
    const ch = code[i] ?? '';
    const active = focused === i;
    cells.push(
      <span key={`c${i}`} className="pl-otp__slot" data-active={active ? '' : undefined} data-filled={ch ? '' : undefined}>
        <input
          ref={(el) => {
            refs.current[i] = el;
          }}
          type={hidden ? 'password' : 'text'}
          inputMode={integerOnly ? 'numeric' : 'text'}
          pattern={integerOnly ? '[0-9]*' : undefined}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus && i === 0}
          aria-label={cellLabel(i + 1, length)}
          aria-invalid={error ? true : undefined}
          className="pl-input pl-otp__cell"
          disabled={disabled}
          value={ch}
          onFocus={(e) => {
            setFocused(i);
            e.target.select();
          }}
          onBlur={() => setFocused((f) => (f === i ? -1 : f))}
          onChange={(e) => {
            const typed = [...e.target.value].filter(valid);
            if (typed.length > 1 && !e.target.value.includes(ch || '\u0000')) {
              // SMS autofill / IME delivered several characters at once.
              fill(i, typed.join(''));
              return;
            }
            const c = typed[typed.length - 1];
            if (c) write(i, c);
          }}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={(e) => onPaste(e, i)}
        />
        <span className="pl-otp__caret" aria-hidden="true" />
      </span>,
    );
    if (groupEnds.has(i + 1)) {
      cells.push(
        <span key={`s${i}`} className="pl-otp__sep" aria-hidden="true">
          {separator}
        </span>,
      );
    }
  }

  return (
    <div className={cx('pl-field pl-otp-field', error && 'pl-field--error', className)}>
      {label && (
        <span id={labelId} className="pl-label">
          {label}
        </span>
      )}
      <div className="pl-otp__row">
        <div
          ref={groupRef}
          role="group"
          dir="ltr"
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={message ? msgId : undefined}
          className="pl-otp"
          data-state={state}
        >
          {cells}
          {success && !error && (
            <span className="pl-otp__check" aria-hidden="true">
              <CheckIcon />
            </span>
          )}
        </div>
        {mask && revealable && (
          <button type="button" className="pl-btn pl-btn--ghost pl-btn--sm pl-otp__reveal" aria-pressed={revealed} disabled={disabled} onClick={() => setRevealed((r) => !r)}>
            <EyeIcon off={revealed} />
            {revealed ? L.hide : L.show}
          </button>
        )}
      </div>
      {message}
      {resendSlot ??
        (resendAfter !== undefined && (
          <div className="pl-otp__resend">
            {remaining > 0 ? (
              <span className="pl-otp__countdown">{L.resendIn(remaining)}</span>
            ) : (
              <button
                type="button"
                className="pl-btn pl-btn--ghost pl-btn--sm"
                disabled={disabled}
                onClick={() => {
                  onResend?.();
                  setRemaining(resendAfter);
                }}
              >
                {L.resend}
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

/* ======================================================================
 * Password
 * ==================================================================== */

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordRequirement {
  label: string;
  test: (value: string) => boolean;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'A lowercase letter', test: (v) => /\p{Ll}/u.test(v) },
  { label: 'An uppercase letter', test: (v) => /\p{Lu}/u.test(v) },
  { label: 'A number', test: (v) => /\p{N}/u.test(v) },
];

const MEDIUM_PASSWORD = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/;
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

export function passwordStrength(value: string, mediumRegex = MEDIUM_PASSWORD, strongRegex = STRONG_PASSWORD): PasswordStrength | null {
  if (!value) return null;
  if (strongRegex.test(value)) return 'strong';
  if (mediumRegex.test(value)) return 'medium';
  return 'weak';
}

export interface PasswordProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>, FieldMetaProps {
  /** Show the strength meter. */
  feedback?: boolean;
  /** Show the show/hide button. */
  toggleMask?: boolean;
  /** `true` for the default list, or your own rules. */
  requirements?: boolean | PasswordRequirement[];
  strengthLabels?: Partial<Record<PasswordStrength, string>>;
  strengthPrefix?: string;
  showLabel?: string;
  requirementsLabel?: string;
  mediumRegex?: RegExp;
  strongRegex?: RegExp;
}

const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

export const Password = forwardRef<HTMLInputElement, PasswordProps>(function Password(
  {
    label,
    hint,
    error,
    id,
    className,
    feedback = true,
    toggleMask = true,
    requirements,
    strengthLabels,
    strengthPrefix = 'Strength:',
    showLabel = 'Show password',
    requirementsLabel = 'Password requirements',
    mediumRegex,
    strongRegex,
    value,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msg = fieldMessage(inputId, hint, error);
  const [inner, setInner] = useState(String(defaultValue ?? ''));
  const current = value !== undefined ? String(value) : inner;
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(current, mediumRegex, strongRegex);
  const labels = { weak: 'Weak', medium: 'Medium', strong: 'Strong', ...strengthLabels };
  const rules = requirements === true ? DEFAULT_PASSWORD_REQUIREMENTS : requirements || [];
  const strengthId = `${inputId}-strength`;
  const reqId = `${inputId}-reqs`;

  return (
    <div className={cx('pl-field', error && 'pl-field--error')}>
      {label && (
        <label className="pl-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={cx('pl-password', toggleMask && 'pl-password--toggle')}>
        <input
          {...rest}
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cx('pl-input', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={joinIds(msg.describedBy, feedback && strengthId, rules.length > 0 && reqId, rest['aria-describedby'])}
          {...(value !== undefined ? { value } : { defaultValue })}
          onChange={(e) => {
            if (value === undefined) setInner(e.target.value);
            onChange?.(e);
          }}
        />
        {toggleMask && (
          <button
            type="button"
            className="pl-password__toggle"
            aria-label={showLabel}
            aria-pressed={visible}
            aria-controls={inputId}
            disabled={rest.disabled}
            onClick={() => setVisible((v) => !v)}
          >
            <EyeIcon off={visible} />
          </button>
        )}
      </div>
      {feedback && (
        <div className="pl-password__meter" data-strength={strength ?? undefined}>
          <span className="pl-password__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span id={strengthId} className="pl-password__strength" aria-live="polite">
            {strength ? `${strengthPrefix} ${labels[strength]}` : ''}
          </span>
        </div>
      )}
      {rules.length > 0 && (
        <ul id={reqId} className="pl-password__reqs" aria-label={requirementsLabel}>
          {rules.map((r) => {
            const met = r.test(current);
            return (
              <li key={r.label} className={cx('pl-password__req', met && 'is-met')}>
                <span aria-hidden="true" className="pl-password__req-icon">
                  {met ? '✓' : '○'}
                </span>
                {r.label}
                <span className="pl-sr-only">{met ? ' (met)' : ' (not met)'}</span>
              </li>
            );
          })}
        </ul>
      )}
      {msg.node}
    </div>
  );
});

/* ======================================================================
 * Rating
 * ==================================================================== */

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  stars?: number;
  readOnly?: boolean;
  disabled?: boolean;
  /** Show a "clear rating" button. */
  cancel?: boolean;
  /** Accessible group name. */
  label?: string;
  clearLabel?: string;
  starLabel?: (n: number) => string;
  className?: string;
}

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path
      d="M12 2.8l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93L12 2.8z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export function Rating({
  value,
  defaultValue = 0,
  onChange,
  stars = 5,
  readOnly = false,
  disabled = false,
  cancel = true,
  label = 'Rating',
  clearLabel = 'Clear rating',
  starLabel = (n) => `${n} star${n === 1 ? '' : 's'}`,
  className,
}: RatingProps) {
  const [current, setCurrent] = useControllable(value, defaultValue, onChange);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const range = Array.from({ length: stars }, (_, i) => i + 1);

  if (readOnly) {
    return (
      <div role="img" aria-label={`${label}: ${current} out of ${stars}`} className={cx('pl-rating', 'pl-rating--readonly', className)}>
        {range.map((n) => (
          <span key={n} className={cx('pl-rating__star', n <= current && 'is-filled')}>
            <StarIcon />
          </span>
        ))}
      </div>
    );
  }

  const choose = (n: number) => {
    const v = Math.max(1, Math.min(stars, n));
    setCurrent(v);
    refs.current[v - 1]?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, n: number) => {
    const rtl = isRtl(e.currentTarget);
    switch (e.key) {
      case 'ArrowUp':
        choose(n + 1);
        break;
      case 'ArrowDown':
        choose(n - 1);
        break;
      case 'ArrowRight':
        choose(rtl ? n - 1 : n + 1);
        break;
      case 'ArrowLeft':
        choose(rtl ? n + 1 : n - 1);
        break;
      case 'Home':
        choose(1);
        break;
      case 'End':
        choose(stars);
        break;
      case ' ':
        choose(n);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div className={cx('pl-rating', disabled && 'is-disabled', className)}>
      <div role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} className="pl-rating__stars">
        {range.map((n) => {
          const checked = current === n;
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[n - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={starLabel(n)}
              tabIndex={(current ? checked : n === 1) ? 0 : -1}
              disabled={disabled}
              className={cx('pl-rating__star', n <= current && 'is-filled')}
              onClick={() => setCurrent(n)}
              onKeyDown={(e) => onKeyDown(e, n)}
            >
              <StarIcon />
            </button>
          );
        })}
      </div>
      {cancel && (
        <button type="button" className="pl-rating__clear" aria-label={clearLabel} disabled={disabled || !current} onClick={() => setCurrent(0)}>
          ×
        </button>
      )}
    </div>
  );
}

/* ======================================================================
 * Knob
 * ==================================================================== */

export interface KnobProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Rendered size in px. */
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  /** e.g. "{value}%" — also used as aria-valuetext. */
  valueTemplate?: string;
  /** Accessible name (required: a dial has no visible label of its own). */
  label: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

const KNOB_ARC = 150; // degrees each side of 12 o'clock

function knobPoint(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return `${(50 + r * Math.sin(rad)).toFixed(3)} ${(50 - r * Math.cos(rad)).toFixed(3)}`;
}
function knobArc(from: number, to: number, r: number) {
  return `M ${knobPoint(from, r)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${knobPoint(to, r)}`;
}

export function Knob({
  value,
  defaultValue = 0,
  onChange,
  min = 0,
  max = 100,
  step: stepSize = 1,
  size = 100,
  strokeWidth = 14,
  showValue = true,
  valueTemplate = '{value}',
  label,
  disabled = false,
  readOnly = false,
  className,
}: KnobProps) {
  const [current, setCurrent] = useControllable(value, defaultValue, onChange);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const interactive = !disabled && !readOnly;
  const r = 50 - strokeWidth / 2;
  const v = Math.min(max, Math.max(min, current));
  const angle = -KNOB_ARC + ((v - min) / (max - min || 1)) * 2 * KNOB_ARC;
  const text = valueTemplate.replace('{value}', String(v));

  const set = (n: number) => {
    const snapped = roundFloat(Math.min(max, Math.max(min, min + Math.round((n - min) / stepSize) * stepSize)));
    if (snapped !== current) setCurrent(snapped);
  };
  const fromPointer = (e: ReactPointerEvent) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const dx = e.clientX - (box.left + box.width / 2);
    const dy = e.clientY - (box.top + box.height / 2);
    const deg = Math.max(-KNOB_ARC, Math.min(KNOB_ARC, (Math.atan2(dx, -dy) * 180) / Math.PI));
    set(min + ((deg + KNOB_ARC) / (2 * KNOB_ARC)) * (max - min));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const big = Math.max(stepSize, (max - min) / 10);
    const moves: Record<string, number> = {
      ArrowUp: v + stepSize,
      ArrowRight: v + stepSize,
      ArrowDown: v - stepSize,
      ArrowLeft: v - stepSize,
      PageUp: v + big,
      PageDown: v - big,
      Home: min,
      End: max,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    set(moves[e.key]);
  };

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={v}
      aria-valuetext={text}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
      className={cx('pl-knob', disabled && 'is-disabled', className)}
      style={{ width: size, height: size }}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (!interactive) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.currentTarget.focus();
        fromPointer(e);
      }}
      onPointerMove={(e) => dragging.current && fromPointer(e)}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <svg ref={svgRef} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
        <path d={knobArc(-KNOB_ARC, KNOB_ARC, r)} className="pl-knob__range" strokeWidth={strokeWidth} />
        {v > min && <path d={knobArc(-KNOB_ARC, angle, r)} className="pl-knob__value" strokeWidth={strokeWidth} />}
        {showValue && (
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="pl-knob__text">
            {text}
          </text>
        )}
      </svg>
    </div>
  );
}

/* ======================================================================
 * ColorPicker
 * ==================================================================== */

export interface ColorPreset {
  value: string;
  label: string;
}

/** '#abc' / 'AABBCC' → '#aabbcc'; null when invalid. */
export function normalizeHex(input: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return `#${h.toLowerCase()}`;
}

/** sRGB channels 0–255 and alpha 0–1. */
export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

const clampN = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};
const pctOr = (s: string, scale: number) => (s.endsWith('%') ? (parseFloat(s) / 100) * scale : parseFloat(s));

function hslToRgb(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hsvToRgb(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 };
}

function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const d = max - Math.min(R, G, B);
  return { h: rgbToHsl({ r, g, b }).h, s: max === 0 ? 0 : d / max, v: max };
}

const toLinear = (c: number) => {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);

function rgbToOklch({ r, g, b }: { r: number; g: number; b: number }) {
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(A * A + Bb * Bb);
  let H = (Math.atan2(Bb, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: C < 0.0002 ? 0 : H };
}

function oklchToRgb(L: number, C: number, H: number) {
  const hr = (H * Math.PI) / 180;
  const A = C * Math.cos(hr);
  const B = C * Math.sin(hr);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: clampN(fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), 0, 255),
    g: clampN(fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), 0, 255),
    b: clampN(fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s), 0, 255),
  };
}

/** Parse #rgb[a] / #rrggbb[aa], rgb()/rgba(), hsl()/hsla() and oklch() (modern or comma syntax). */
export function parseColor(input: string): RgbaColor | null {
  const s = input.trim().toLowerCase();
  let m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? round(n(6) / 255, 3) : 1 };
  }
  const alphaOf = (v?: string) => (v === undefined ? 1 : clampN(pctOr(v, 1), 0, 1));
  m = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(s);
  if (m) return { r: clampN(pctOr(m[1], 255), 0, 255), g: clampN(pctOr(m[2], 255), 0, 255), b: clampN(pctOr(m[3], 255), 0, 255), a: alphaOf(m[4]) };
  m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(s);
  if (m) return { ...hslToRgb(parseFloat(m[1]) % 360, clampN(parseFloat(m[2]) / 100, 0, 1), clampN(parseFloat(m[3]) / 100, 0, 1)), a: alphaOf(m[4]) };
  m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(s);
  if (m) return { ...oklchToRgb(clampN(pctOr(m[1], 1), 0, 1), parseFloat(m[2]), parseFloat(m[3])), a: alphaOf(m[4]) };
  return null;
}

const hex2 = (n: number) => Math.round(clampN(n, 0, 255)).toString(16).padStart(2, '0');

/** Format a colour as hex (#rrggbb, or #rrggbbaa with alpha), rgb(), hsl() or oklch() in modern syntax. */
export function formatColor(c: RgbaColor, format: ColorFormat = 'hex'): string {
  const a = c.a < 1 ? ` / ${round(c.a, 2)}` : '';
  switch (format) {
    case 'rgb':
      return `rgb(${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)}${a})`;
    case 'hsl': {
      const { h, s, l } = rgbToHsl(c);
      return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%${a})`;
    }
    case 'oklch': {
      const { l, c: ch, h } = rgbToOklch(c);
      return `oklch(${round(l * 100, 1)}% ${round(ch, 3)} ${round(h, 1)}${a})`;
    }
    default:
      return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${c.a < 1 ? hex2(c.a * 255) : ''}`;
  }
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2 contrast ratio of `fg` (composited over `bg` when translucent) against `bg`. */
export function contrastRatio(fg: string | RgbaColor, bg: string | RgbaColor): number {
  const f = typeof fg === 'string' ? parseColor(fg) : fg;
  const b = typeof bg === 'string' ? parseColor(bg) : bg;
  if (!f || !b) return 1;
  const mix = (x: number, y: number) => x * f.a + y * (1 - f.a);
  const L1 = luminance({ r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b) });
  const L2 = luminance(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

const HUE_NAMES: Array<[number, string]> = [
  [12, 'red'],
  [38, 'orange'],
  [62, 'yellow'],
  [85, 'lime'],
  [150, 'green'],
  [175, 'teal'],
  [200, 'cyan'],
  [245, 'blue'],
  [270, 'indigo'],
  [295, 'violet'],
  [330, 'magenta'],
  [348, 'pink'],
  [361, 'red'],
];
const hueName = (h: number) => HUE_NAMES.find(([max]) => h < max)?.[1] ?? 'red';

export interface ColorPickerLabels {
  area: string;
  areaValue: (saturation: number, brightness: number) => string;
  hue: string;
  hueValue: (hue: number, name: string) => string;
  alpha: string;
  format: string;
  value: (format: ColorFormat) => string;
  eyeDropper: string;
  recent: string;
  contrast: (ratio: string, background: string) => string;
  pass: string;
  fail: string;
}

const DEFAULT_COLOR_LABELS: ColorPickerLabels = {
  area: 'Saturation and brightness',
  areaValue: (s, v) => `Saturation ${s}%, Brightness ${v}%`,
  hue: 'Hue',
  hueValue: (h, n) => `${h} degrees, ${n}`,
  alpha: 'Opacity',
  format: 'Color format',
  value: (f) => `${f.toUpperCase()} value`,
  eyeDropper: 'Pick a color from the screen',
  recent: 'Recent colors',
  contrast: (r, bg) => `Contrast ${r}:1 on ${bg}`,
  pass: 'pass',
  fail: 'fail',
};

export interface ColorChange {
  hex: string;
  rgba: RgbaColor;
  /** The value in the currently selected text format. */
  css: string;
}

export interface ColorPickerProps extends FieldMetaProps {
  value?: string;
  defaultValue?: string;
  /** Emits '#rrggbb' (or '#rrggbbaa' when `alpha` is on and opacity < 100%). */
  onChange?: (hex: string) => void;
  /** Rich change event with RGBA and the formatted string. */
  onColorChange?: (color: ColorChange) => void;
  presets?: Array<string | ColorPreset>;
  /** Show the text input. */
  showInput?: boolean;
  /** 'popover' (default): a swatch button opens the picker. 'inline': the picker is always shown. */
  mode?: 'popover' | 'inline';
  /** Show an opacity slider. Default false. */
  alpha?: boolean;
  /** Text formats offered by the format switch. Default all four. */
  formats?: ColorFormat[];
  format?: ColorFormat;
  defaultFormat?: ColorFormat;
  onFormatChange?: (format: ColorFormat) => void;
  /** How many recently used colours to remember (0 hides the row). Default 6. */
  recent?: number;
  /** Background colour for the WCAG contrast readout (e.g. '#ffffff'). */
  contrastWith?: string;
  /** Offer the EyeDropper API when the browser supports it. Default true. */
  eyeDropper?: boolean;
  pickerLabel?: string;
  hexLabel?: string;
  presetsLabel?: string;
  labels?: Partial<ColorPickerLabels>;
  disabled?: boolean;
  id?: string;
  className?: string;
}

type Hsva = { h: number; s: number; v: number; a: number };

const hsvaFrom = (c: RgbaColor): Hsva => ({ ...rgbToHsv(c), a: c.a });
const rgbaFrom = (c: Hsva): RgbaColor => ({ ...hsvToRgb(c.h, c.s, c.v), a: c.a });

/** Pointer-drag helper for 1D/2D tracks: reports the pointer position as fractions of the track. */
function useTrackDrag(onMove: (x: number, y: number) => void, onEnd: () => void, disabled?: boolean) {
  const move = useRef(onMove);
  move.current = onMove;
  const end = useRef(onEnd);
  end.current = onEnd;
  const report = (el: HTMLElement, e: { clientX: number; clientY: number }) => {
    const r = el.getBoundingClientRect();
    move.current(r.width ? clampN((e.clientX - r.left) / r.width, 0, 1) : 0, r.height ? clampN((e.clientY - r.top) / r.height, 0, 1) : 0);
  };
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (disabled || e.button !== 0) return;
      const el = e.currentTarget;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      report(el, e);
      (el.querySelector('[role="slider"]') as HTMLElement | null)?.focus({ preventScroll: true });
      e.preventDefault();
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
      report(e.currentTarget, e);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) end.current();
    },
  };
}

/** Arrow / Page / Home / End handling for colour sliders. Returns the new value or null. */
function sliderKey(e: KeyboardEvent<HTMLElement>, value: number, min: number, max: number, small: number, big: number): number | null {
  const step = e.shiftKey ? big : small;
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clampN(value + step, min, max);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clampN(value - step, min, max);
    case 'PageUp':
      return clampN(value + big, min, max);
    case 'PageDown':
      return clampN(value - big, min, max);
    case 'Home':
      return min;
    case 'End':
      return max;
    default:
      return null;
  }
}

const EyeDropperIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M10.5 2.5l3 3-1.6 1.6-.9-.9-5.6 5.6-2.1.5.5-2.1 5.6-5.6-.9-.9z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

/**
 * Colour picker with a 2D saturation/brightness area, hue and opacity sliders (all keyboard
 * operable with descriptive aria-valuetext), HEX/RGB/HSL/OKLCH text entry, the EyeDropper API,
 * presets, recent colours and a WCAG contrast readout. Popover or inline.
 */
export function ColorPicker({
  label,
  hint,
  error,
  value,
  defaultValue = '#000000',
  onChange,
  onColorChange,
  presets,
  showInput = true,
  mode = 'popover',
  alpha = false,
  formats = ['hex', 'rgb', 'hsl', 'oklch'],
  format: formatProp,
  defaultFormat,
  onFormatChange,
  recent: recentMax = 6,
  contrastWith,
  eyeDropper = true,
  pickerLabel = 'Pick a color',
  hexLabel = 'Hex value',
  presetsLabel = 'Preset colors',
  labels: labelOverrides,
  disabled,
  id,
  className,
}: ColorPickerProps) {
  const L = { ...DEFAULT_COLOR_LABELS, ...labelOverrides };
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const panelId = `${baseId}-panel`;
  const msg = fieldMessage(baseId, hint, error);
  const [raw, setRaw] = useControllable(value, defaultValue, onChange);
  const [fmt, setFmt] = useControllable<ColorFormat>(formatProp, defaultFormat ?? formats[0] ?? 'hex', onFormatChange);
  const parsed = parseColor(raw) ?? { r: 0, g: 0, b: 0, a: 1 };
  const [hsva, setHsva] = useState<Hsva>(() => hsvaFrom(parsed));
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(mode === 'inline');
  const [recentList, setRecentList] = useState<string[]>([]);
  const [canDrop, setCanDrop] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const areaThumbRef = useRef<HTMLDivElement>(null);
  const onColorChangeRef = useRef(onColorChange);
  onColorChangeRef.current = onColorChange;

  const toOutput = (c: RgbaColor) => formatColor({ ...c, a: alpha ? c.a : 1 }, 'hex');
  const rgba = rgbaFrom(hsva);
  const currentHex = toOutput(rgba);
  const opaqueHex = formatColor({ ...rgba, a: 1 }, 'hex');

  // Follow external value changes (keeps the hue when the colour is grey).
  const rawHex = toOutput(parsed);
  useEffect(() => {
    if (rawHex !== currentHex) setHsva((prev) => {
      const next = hsvaFrom(parseColor(raw) ?? parsed);
      return next.s === 0 || next.v === 0 ? { ...next, h: prev.h } : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawHex]);

  useEffect(() => {
    setCanDrop(eyeDropper && typeof window !== 'undefined' && 'EyeDropper' in window);
  }, [eyeDropper]);

  const emit = (next: Hsva) => {
    setHsva(next);
    const c = rgbaFrom(next);
    const hex = toOutput(c);
    if (hex !== toOutput(parseColor(raw) ?? parsed)) setRaw(hex);
    onColorChangeRef.current?.({ hex, rgba: c, css: formatColor({ ...c, a: alpha ? c.a : 1 }, fmt) });
  };

  const remember = (hex = currentHex) => {
    if (!recentMax) return;
    setRecentList((list) => [hex, ...list.filter((h) => h !== hex)].slice(0, recentMax));
  };

  const setFromString = (text: string, commit = true) => {
    const c = parseColor(text);
    if (!c) return false;
    const next = hsvaFrom({ ...c, a: alpha ? c.a : 1 });
    emit(next.s === 0 || next.v === 0 ? { ...next, h: hsva.h } : next);
    if (commit) remember(toOutput(c));
    return true;
  };

  // Popover: close on outside press, Escape and focus leaving.
  useDismiss(open && mode === 'popover', rootRef, () => setOpen(false));
  useEffect(() => {
    if (open && mode === 'popover') areaThumbRef.current?.focus();
  }, [open, mode]);

  const area = useTrackDrag((x, y) => emit({ ...hsva, s: x, v: 1 - y }), () => remember(), disabled);
  const hue = useTrackDrag((x) => emit({ ...hsva, h: x * 360 }), () => remember(), disabled);
  const alphaTrack = useTrackDrag((x) => emit({ ...hsva, a: round(x, 2) }), () => remember(), disabled);

  const sPct = Math.round(hsva.s * 100);
  const vPct = Math.round(hsva.v * 100);
  const hDeg = Math.round(hsva.h);
  const aPct = Math.round(hsva.a * 100);
  const textValue = formatColor({ ...rgba, a: alpha ? rgba.a : 1 }, fmt);
  const draftInvalid = draft !== null && draft !== '' && !parseColor(draft);
  const ratio = contrastWith ? contrastRatio({ ...rgba, a: alpha ? rgba.a : 1 }, contrastWith) : 0;
  const checker = { '--pl-cp-color': formatColor({ ...rgba, a: alpha ? rgba.a : 1 }, 'rgb') } as CSSProperties;

  const swatch = (hex: string, name: string, key: string) => {
    const normalized = toOutput(parseColor(hex) ?? parsed);
    return (
      <button
        key={key}
        type="button"
        className="pl-colorpicker__swatch"
        style={{ '--pl-cp-color': hex } as CSSProperties}
        aria-label={name}
        aria-pressed={normalized === currentHex}
        disabled={disabled}
        onClick={() => setFromString(hex)}
      />
    );
  };

  const presetRow = presets && presets.length > 0 && (
    <div role="group" aria-label={presetsLabel} className="pl-colorpicker__presets">
      {presets.map((p) => {
        const preset = typeof p === 'string' ? { value: p, label: p } : p;
        return swatch(normalizeHex(preset.value) ?? preset.value, preset.label, preset.value);
      })}
    </div>
  );

  const panel = (
    <div
      id={panelId}
      role={mode === 'popover' ? 'dialog' : 'group'}
      aria-label={pickerLabel}
      className={cx('pl-colorpicker__panel', mode === 'popover' && 'pl-colorpicker__panel--popover')}
      hidden={!open}
      dir="ltr"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && mode === 'popover') {
          e.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <div className="pl-colorpicker__area" style={{ '--pl-cp-hue': `hsl(${hDeg} 100% 50%)` } as CSSProperties} {...area}>
        <div
          ref={areaThumbRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={L.area}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sPct}
          aria-valuetext={L.areaValue(sPct, vPct)}
          aria-disabled={disabled || undefined}
          className="pl-colorpicker__thumb"
          style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, '--pl-cp-color': opaqueHex } as CSSProperties}
          onKeyDown={(e) => {
            if (disabled) return;
            const big = 10;
            let { s, v } = { s: sPct, v: vPct };
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') s = clampN(s + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? big : 1), 0, 100);
            else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') v = clampN(v + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? big : 1), 0, 100);
            else if (e.key === 'PageUp' || e.key === 'PageDown') v = clampN(v + (e.key === 'PageUp' ? big : -big), 0, 100);
            else if (e.key === 'Home') s = 0;
            else if (e.key === 'End') s = 100;
            else return;
            e.preventDefault();
            emit({ ...hsva, s: s / 100, v: v / 100 });
          }}
          onBlur={() => remember()}
        />
      </div>
      <div className="pl-colorpicker__sliders">
        <div className="pl-colorpicker__track pl-colorpicker__track--hue" {...hue}>
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={L.hue}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={hDeg}
            aria-valuetext={L.hueValue(hDeg, hueName(hsva.h))}
            aria-disabled={disabled || undefined}
            className="pl-colorpicker__knob"
            style={{ left: `${(hsva.h / 360) * 100}%`, '--pl-cp-color': `hsl(${hDeg} 100% 50%)` } as CSSProperties}
            onKeyDown={(e) => {
              if (disabled) return;
              const n = sliderKey(e, hDeg, 0, 360, 1, 15);
              if (n === null) return;
              e.preventDefault();
              emit({ ...hsva, h: n });
            }}
            onBlur={() => remember()}
          />
        </div>
        {alpha && (
          <div className="pl-colorpicker__track pl-colorpicker__track--alpha" style={{ '--pl-cp-opaque': opaqueHex } as CSSProperties} {...alphaTrack}>
            <div
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={L.alpha}
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={aPct}
              aria-valuetext={`${aPct}%`}
              aria-disabled={disabled || undefined}
              className="pl-colorpicker__knob"
              style={{ left: `${hsva.a * 100}%`, '--pl-cp-color': formatColor(rgba, 'rgb') } as CSSProperties}
              onKeyDown={(e) => {
                if (disabled) return;
                const n = sliderKey(e, aPct, 0, 100, 1, 10);
                if (n === null) return;
                e.preventDefault();
                emit({ ...hsva, a: n / 100 });
              }}
              onBlur={() => remember()}
            />
          </div>
        )}
      </div>
      {mode === 'inline' && presetRow}
      {recentMax > 0 && recentList.length > 0 && (
        <div role="group" aria-label={L.recent} className="pl-colorpicker__presets pl-colorpicker__recent">
          <span className="pl-colorpicker__caption" aria-hidden="true">
            {L.recent}
          </span>
          {recentList.map((h) => swatch(h, h, `recent-${h}`))}
        </div>
      )}
      {contrastWith && (
        <div className="pl-colorpicker__contrast">
          <span className="pl-colorpicker__sample" style={{ background: contrastWith, color: formatColor(rgba, 'rgb') }} aria-hidden="true">
            Aa
          </span>
          <span className="pl-colorpicker__ratio">{L.contrast(ratio.toFixed(2), contrastWith)}</span>
          {[
            ['AA', 4.5],
            ['AA Large', 3],
            ['AAA', 7],
          ].map(([name, min]) => {
            const ok = ratio >= (min as number);
            return (
              <span key={name} className="pl-colorpicker__grade" data-pass={ok ? '' : undefined}>
                <span aria-hidden="true">{ok ? '✓' : '✕'}</span> {name} <span className="pl-sr-only">{ok ? L.pass : L.fail}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={rootRef}
      role="group"
      aria-labelledby={label ? labelId : undefined}
      aria-label={label ? undefined : pickerLabel}
      className={cx('pl-field pl-colorpicker-field', error && 'pl-field--error', className)}
      onBlur={(e) => {
        if (mode === 'popover' && open && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {label && (
        <span id={labelId} className="pl-label">
          {label}
        </span>
      )}
      <div className="pl-colorpicker">
        {mode === 'popover' && (
          <button
            ref={triggerRef}
            id={baseId}
            type="button"
            className="pl-colorpicker__trigger"
            aria-label={pickerLabel}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={panelId}
            aria-describedby={msg.describedBy}
            disabled={disabled}
            style={checker}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="pl-colorpicker__chip" />
          </button>
        )}
        {mode === 'inline' && <span className="pl-colorpicker__preview" style={checker} aria-hidden="true" />}
        {showInput && formats.length > 1 && (
          <select className="pl-select pl-colorpicker__format" aria-label={L.format} value={fmt} disabled={disabled} onChange={(e) => setFmt(e.target.value as ColorFormat)}>
            {formats.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
        )}
        {showInput && (
          <input
            id={mode === 'inline' ? baseId : undefined}
            type="text"
            className="pl-input pl-colorpicker__hex"
            data-format={fmt}
            aria-label={fmt === 'hex' ? hexLabel : L.value(fmt)}
            aria-invalid={error || draftInvalid ? true : undefined}
            aria-describedby={msg.describedBy}
            spellCheck={false}
            autoComplete="off"
            disabled={disabled}
            value={draft ?? textValue}
            onFocus={() => setDraft(textValue)}
            onChange={(e) => {
              setDraft(e.target.value);
              // Commit complete hex values while typing; everything else on blur / Enter.
              if (/^#?([0-9a-f]{6}|[0-9a-f]{8})$/i.test(e.target.value.trim())) setFromString(e.target.value, false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft !== null) {
                e.preventDefault();
                if (setFromString(draft)) setDraft(null);
              }
            }}
            onBlur={() => {
              if (draft !== null && parseColor(draft) && formatColor(parseColor(draft)!, fmt) !== textValue) setFromString(draft);
              else if (draft !== null && parseColor(draft)) remember();
              setDraft(null);
            }}
          />
        )}
        {canDrop && (
          <button
            type="button"
            className="pl-btn pl-btn--secondary pl-btn--icon pl-colorpicker__dropper"
            aria-label={L.eyeDropper}
            disabled={disabled}
            onClick={async () => {
              try {
                const Ctor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
                const result = await new Ctor().open();
                setFromString(result.sRGBHex);
              } catch {
                /* cancelled */
              }
            }}
          >
            <EyeDropperIcon />
          </button>
        )}
        {mode === 'popover' && panel}
      </div>
      {mode === 'inline' && panel}
      {mode === 'popover' && presetRow}
      {msg.node}
    </div>
  );
}

/* ======================================================================
 * DatePicker
 * ==================================================================== */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a?: Date | null, b?: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
function addMonths(d: Date, n: number) {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
}
const pad2 = (n: number) => String(n).padStart(2, '0');

/** yyyy-mm-dd (plus " HH:mm" with `withTime`), local time. */
export function formatIsoDate(d: Date, withTime = false): string {
  const day = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return withTime ? `${day} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : day;
}

/** Parses yyyy-mm-dd with optional " HH:mm" / "THH:mm"; null when invalid. */
export function parseIsoDate(text: string): Date | null {
  const m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?\s*$/.exec(text);
  if (!m) return null;
  const [, y, mo, d, h = '0', mi = '0'] = m;
  const date = new Date(+y, +mo - 1, +d, +h, +mi);
  if (date.getMonth() !== +mo - 1 || date.getDate() !== +d || +h > 23 || +mi > 59) return null;
  return date;
}

function localeFirstDay(locale?: string): number {
  try {
    const loc = new Intl.Locale(locale ?? new Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info) return info.firstDay % 7;
  } catch {
    // Fall through to Sunday.
  }
  return 0;
}

export interface DatePickerLabels {
  chooseDate: string;
  previousMonth: string;
  nextMonth: string;
  month: string;
  year: string;
  today: string;
  clear: string;
  done: string;
  hour: string;
  minute: string;
  /** Screen-reader description of the typed format. */
  format: string;
}

const DEFAULT_DATE_LABELS: DatePickerLabels = {
  chooseDate: 'Choose date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  month: 'Month',
  year: 'Year',
  today: 'Today',
  clear: 'Clear',
  done: 'Done',
  hour: 'Hour',
  minute: 'Minute',
  format: 'Format: YYYY-MM-DD',
};

export type DatePickerValue = Date | Date[] | null;

export interface DatePickerProps extends FieldMetaProps {
  /** single: Date | null; range: [start, end?]; multiple: Date[]. */
  value?: DatePickerValue;
  defaultValue?: DatePickerValue;
  onChange?: (value: DatePickerValue) => void;
  selectionMode?: 'single' | 'range' | 'multiple';
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  /** Weekdays (0 = Sunday) that cannot be chosen. */
  disabledDays?: number[];
  /** Render the calendar without an input or popup. */
  inline?: boolean;
  /** Hours and minutes (24 h, single mode). */
  showTime?: boolean;
  /** Today / Clear buttons. */
  showButtonBar?: boolean;
  locale?: string;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's week start. */
  firstDayOfWeek?: number;
  /** Year options in the year select; defaults to min/max or ±100/50 years. */
  yearRange?: [number, number];
  formatDate?: (date: Date) => string;
  parseDate?: (text: string) => Date | null;
  labels?: Partial<DatePickerLabels>;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export function DatePicker({
  label,
  hint,
  error,
  value,
  defaultValue = null,
  onChange,
  selectionMode = 'single',
  minDate,
  maxDate,
  disabledDates,
  disabledDays,
  inline = false,
  showTime = false,
  showButtonBar = false,
  locale,
  firstDayOfWeek,
  yearRange,
  formatDate,
  parseDate,
  labels: labelOverrides,
  placeholder,
  disabled,
  id,
  name,
  className,
}: DatePickerProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const panelId = `${baseId}-panel`;
  const headingId = `${baseId}-heading`;
  const formatId = `${baseId}-format`;
  const L = { ...DEFAULT_DATE_LABELS, ...labelOverrides };
  const msg = fieldMessage(baseId, hint, error);
  const [raw, setRaw] = useControllable<DatePickerValue>(value, defaultValue, onChange);
  const selection: Date[] = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
  const timeMode = showTime && selectionMode === 'single';
  const firstDay = firstDayOfWeek ?? localeFirstDay(locale);
  const today = startOfDay(new Date());

  const minDay = minDate ? startOfDay(minDate).getTime() : -Infinity;
  const maxDay = maxDate ? startOfDay(maxDate).getTime() : Infinity;
  const isDisabled = (d: Date) => {
    const t = startOfDay(d).getTime();
    return t < minDay || t > maxDay || !!disabledDays?.includes(d.getDay()) || !!disabledDates?.some((x) => sameDay(x, d));
  };
  const clampDay = (d: Date) => (d.getTime() < minDay ? startOfDay(minDate!) : d.getTime() > maxDay ? startOfDay(maxDate!) : d);

  const [open, setOpen] = useState(false);
  const [focusDate, setFocusDate] = useState(() => startOfDay(selection[0] ?? clampDay(today)));
  const [view, setView] = useState(() => ({ year: focusDate.getFullYear(), month: focusDate.getMonth() }));
  const [draft, setDraft] = useState<string | null>(null);
  const [draftInvalid, setDraftInvalid] = useState(false);
  const focusGrid = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  useDismiss(open && !inline, rootRef, () => setOpen(false));

  // Move DOM focus to the roving grid cell after keyboard navigation or opening.
  useEffect(() => {
    if (!focusGrid.current) return;
    focusGrid.current = false;
    gridRef.current?.querySelector<HTMLElement>('td[tabindex="0"]')?.focus();
  });
  useEffect(() => {
    if (!open || inline || !panelRef.current) return;
    return trapFocus(panelRef.current);
  }, [open, inline]);

  const fmt = useMemo(() => {
    const day = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
    const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const month = new Intl.DateTimeFormat(locale, { month: 'long' });
    const wdShort = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const wdLong = new Intl.DateTimeFormat(locale, { weekday: 'long' });
    const num = new Intl.NumberFormat(locale, { useGrouping: false });
    return {
      day: (d: Date) => day.format(d),
      title: (y: number, m: number) => title.format(new Date(y, m, 1)),
      months: Array.from({ length: 12 }, (_, m) => month.format(new Date(2000, m, 1))),
      // 2000-01-02 was a Sunday.
      weekdays: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(2000, 0, 2 + ((firstDay + i) % 7));
        return { short: wdShort.format(d), long: wdLong.format(d) };
      }),
      num: (n: number) => num.format(n),
    };
  }, [locale, firstDay]);

  const toText = (d: Date) => (formatDate ? formatDate(d) : formatIsoDate(d, timeMode));
  const fromText = (t: string) => (parseDate ? parseDate(t) : parseIsoDate(t));

  const goTo = (d: Date, moveFocus: boolean) => {
    setFocusDate(d);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    focusGrid.current = moveFocus;
  };
  const openPopup = () => {
    goTo(startOfDay(selection[0] ?? clampDay(today)), true);
    setOpen(true);
  };
  const closePopup = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const emit = (dates: Date[]) => setRaw(selectionMode === 'single' ? dates[0] ?? null : dates);

  const selectDate = (d: Date) => {
    if (isDisabled(d)) return;
    if (selectionMode === 'single') {
      const prev = selection[0];
      emit([timeMode && prev ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), prev.getHours(), prev.getMinutes()) : d]);
      if (!inline && !timeMode) closePopup();
    } else if (selectionMode === 'range') {
      const [start, end] = selection;
      if (!start || end) emit([d]);
      else {
        emit(d.getTime() < start.getTime() ? [d, start] : [start, d]);
        if (!inline) closePopup();
      }
    } else {
      emit(
        selection.some((x) => sameDay(x, d)) ? selection.filter((x) => !sameDay(x, d)) : [...selection, d].sort((a, b) => a.getTime() - b.getTime()),
      );
    }
  };

  const setTime = (part: 'h' | 'm', n: number) => {
    if (!Number.isInteger(n) || n < 0 || n > (part === 'h' ? 23 : 59)) return;
    const d = new Date(selection[0] ?? focusDate);
    if (part === 'h') d.setHours(n);
    else d.setMinutes(n);
    emit([d]);
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    const rtl = isRtl(e.currentTarget);
    const col = (focusDate.getDay() - firstDay + 7) % 7;
    let next: Date;
    switch (e.key) {
      case 'ArrowLeft':
        next = addDays(focusDate, rtl ? 1 : -1);
        break;
      case 'ArrowRight':
        next = addDays(focusDate, rtl ? -1 : 1);
        break;
      case 'ArrowUp':
        next = addDays(focusDate, -7);
        break;
      case 'ArrowDown':
        next = addDays(focusDate, 7);
        break;
      case 'Home':
        next = addDays(focusDate, -col);
        break;
      case 'End':
        next = addDays(focusDate, 6 - col);
        break;
      case 'PageUp':
        next = addMonths(focusDate, e.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(focusDate, e.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectDate(focusDate);
        return;
      default:
        return;
    }
    e.preventDefault();
    goTo(clampDay(next), true);
  };

  const showMonth = (year: number, month: number) => goTo(clampDay(addMonths(new Date(view.year, view.month, focusDate.getDate()), (year - view.year) * 12 + month - view.month)), false);
  const prevDisabled = new Date(view.year, view.month, 0).getTime() < minDay;
  const nextDisabled = new Date(view.year, view.month + 1, 1).getTime() > maxDay;
  const thisYear = today.getFullYear();
  const [fromYear, toYear] = yearRange ?? [minDate?.getFullYear() ?? thisYear - 100, maxDate?.getFullYear() ?? thisYear + 50];
  const years: number[] = [];
  for (let y = Math.min(fromYear, view.year); y <= Math.max(toYear, view.year); y++) years.push(y);

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const offset = (new Date(view.year, view.month, 1).getDay() - firstDay + 7) % 7;
  const cells: Array<Date | null> = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.year, view.month, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const [rangeStart, rangeEnd] = selectionMode === 'range' ? selection : [];

  const isSelected = (d: Date) => {
    if (selectionMode !== 'range') return selection.some((x) => sameDay(x, d));
    if (sameDay(d, rangeStart) || sameDay(d, rangeEnd)) return true;
    return !!rangeStart && !!rangeEnd && d.getTime() > startOfDay(rangeStart).getTime() && d.getTime() < startOfDay(rangeEnd).getTime();
  };

  const calendar = (
    <>
      <div className="pl-datepicker__header">
        <button type="button" className="pl-datepicker__nav" aria-label={L.previousMonth} disabled={prevDisabled} onClick={() => showMonth(view.year, view.month - 1)}>
          <Chevron className="pl-datepicker__prev" />
        </button>
        <h2 id={headingId} className="pl-sr-only" aria-live="polite">
          {fmt.title(view.year, view.month)}
        </h2>
        <select className="pl-datepicker__select" aria-label={L.month} value={view.month} onChange={(e) => showMonth(view.year, Number(e.target.value))}>
          {fmt.months.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select className="pl-datepicker__select" aria-label={L.year} value={view.year} onChange={(e) => showMonth(Number(e.target.value), view.month)}>
          {years.map((y) => (
            <option key={y} value={y}>
              {fmt.num(y)}
            </option>
          ))}
        </select>
        <button type="button" className="pl-datepicker__nav" aria-label={L.nextMonth} disabled={nextDisabled} onClick={() => showMonth(view.year, view.month + 1)}>
          <Chevron className="pl-datepicker__next" />
        </button>
      </div>
      <table ref={gridRef} role="grid" aria-labelledby={headingId} aria-multiselectable={selectionMode !== 'single' || undefined} className="pl-datepicker__grid" onKeyDown={onGridKeyDown}>
        <thead>
          <tr>
            {fmt.weekdays.map((w) => (
              <th key={w.long} scope="col" abbr={w.long}>
                {w.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                if (!d) return <td key={di} role="presentation" className="pl-datepicker__empty" />;
                const sel = isSelected(d);
                const dis = isDisabled(d);
                const isEdge = selectionMode === 'range' && (sameDay(d, rangeStart) || sameDay(d, rangeEnd));
                return (
                  <td
                    key={di}
                    role="gridcell"
                    tabIndex={sameDay(d, focusDate) ? 0 : -1}
                    aria-selected={sel || undefined}
                    aria-disabled={dis || undefined}
                    aria-current={sameDay(d, today) ? 'date' : undefined}
                    aria-label={fmt.day(d)}
                    className={cx(
                      'pl-datepicker__day',
                      sel && (selectionMode !== 'range' || isEdge) && 'is-selected',
                      sel && selectionMode === 'range' && !isEdge && 'is-in-range',
                      sameDay(d, today) && 'is-today',
                      dis && 'is-disabled',
                    )}
                    onClick={() => {
                      goTo(d, true);
                      selectDate(d);
                    }}
                  >
                    {fmt.num(d.getDate())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {timeMode && (
        <div className="pl-datepicker__time">
          <label className="pl-datepicker__time-field">
            <span>{L.hour}</span>
            <input type="number" className="pl-input" min={0} max={23} value={(selection[0] ?? focusDate).getHours()} onChange={(e) => setTime('h', Number(e.target.value))} />
          </label>
          <span aria-hidden="true">:</span>
          <label className="pl-datepicker__time-field">
            <span>{L.minute}</span>
            <input type="number" className="pl-input" min={0} max={59} value={(selection[0] ?? focusDate).getMinutes()} onChange={(e) => setTime('m', Number(e.target.value))} />
          </label>
        </div>
      )}
      {(showButtonBar || (!inline && (selectionMode === 'multiple' || timeMode))) && (
        <div className="pl-datepicker__footer">
          {showButtonBar && (
            <>
              <button
                type="button"
                className="pl-btn pl-btn--ghost pl-btn--sm"
                onClick={() => {
                  goTo(today, false);
                  selectDate(today);
                }}
              >
                {L.today}
              </button>
              <button
                type="button"
                className="pl-btn pl-btn--ghost pl-btn--sm"
                onClick={() => {
                  emit([]);
                  if (!inline) closePopup();
                }}
              >
                {L.clear}
              </button>
            </>
          )}
          {!inline && (
            <button type="button" className="pl-btn pl-btn--primary pl-btn--sm pl-datepicker__done" onClick={() => closePopup()}>
              {L.done}
            </button>
          )}
        </div>
      )}
    </>
  );

  if (inline) {
    return (
      <div className={cx('pl-field', error && 'pl-field--error', className)}>
        {label && (
          <span id={labelId} className="pl-label">
            {label}
          </span>
        )}
        <div role="group" aria-labelledby={label ? labelId : headingId} aria-describedby={msg.describedBy} className="pl-datepicker pl-datepicker__panel pl-datepicker--inline">
          {calendar}
        </div>
        {msg.node}
      </div>
    );
  }

  const display =
    selection.length === 0 ? '' : selectionMode === 'range' ? selection.map(toText).join(' – ') : selection.map(toText).join(', ');

  const commitDraft = () => {
    if (draft === null) return;
    const text = draft.trim();
    if (!text) {
      setDraft(null);
      emit([]);
      return;
    }
    const parts = selectionMode === 'single' ? [text] : text.split(selectionMode === 'range' ? /\s+(?:–|-|to)\s+/ : /\s*,\s*/);
    const dates = parts.map(fromText);
    if (dates.some((d) => !d || isDisabled(d)) || (selectionMode === 'range' && dates.length > 2)) {
      setDraftInvalid(true);
      return;
    }
    const list = dates as Date[];
    if (selectionMode === 'range' && list.length === 2 && list[0].getTime() > list[1].getTime()) list.reverse();
    setDraft(null);
    emit(list);
    goTo(startOfDay(list[0]), false);
  };

  return (
    <div className={cx('pl-field', error && 'pl-field--error', className)}>
      {label && (
        <label className="pl-label" htmlFor={baseId}>
          {label}
        </label>
      )}
      <div ref={rootRef} className="pl-datepicker">
        <div className="pl-datepicker__control">
          <input
            id={baseId}
            name={name}
            type="text"
            autoComplete="off"
            className="pl-input pl-datepicker__input"
            placeholder={placeholder ?? (formatDate ? undefined : timeMode ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD')}
            aria-invalid={error || draftInvalid ? true : undefined}
            aria-describedby={joinIds(msg.describedBy, formatId)}
            disabled={disabled}
            value={draft ?? display}
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftInvalid(false);
            }}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitDraft();
              } else if (e.key === 'ArrowDown' && e.altKey) {
                e.preventDefault();
                openPopup();
              }
            }}
          />
          <span id={formatId} className="pl-sr-only">
            {L.format}
          </span>
          <button
            ref={buttonRef}
            type="button"
            className="pl-datepicker__trigger"
            aria-label={L.chooseDate}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            disabled={disabled}
            onClick={() => (open ? closePopup(false) : openPopup())}
          >
            <CalendarIcon />
          </button>
        </div>
        {open && (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={L.chooseDate}
            className="pl-popup pl-datepicker__panel"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closePopup();
              }
            }}
          >
            {calendar}
          </div>
        )}
      </div>
      {msg.node}
    </div>
  );
}

/* ======================================================================
 * ToggleButton / SelectButton
 * ==================================================================== */

export interface ToggleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  onLabel?: ReactNode;
  offLabel?: ReactNode;
  onIcon?: ReactNode;
  offIcon?: ReactNode;
}

/**
 * Two-state button (aria-pressed). Keep the accessible name stable: when on/off labels differ,
 * pass `aria-label` so screen readers hear one name plus the pressed state.
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  { checked, defaultChecked = false, onChange, onLabel = 'On', offLabel = 'Off', onIcon, offIcon, className, children, onClick, ...rest },
  ref,
) {
  const [on, setOn] = useControllable(checked, defaultChecked, onChange);
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      aria-pressed={on}
      className={cx('pl-togglebutton', on && 'is-on', className)}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOn(!on);
      }}
    >
      {(on ? onIcon : offIcon) && <span className="pl-togglebutton__icon" aria-hidden="true">{on ? onIcon : offIcon}</span>}
      {children ?? (on ? onLabel : offLabel)}
    </button>
  );
});

export interface SelectButtonProps {
  options: FormOption[];
  /** A value (single) or array of values (multiple). */
  value?: string | string[] | null;
  defaultValue?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  multiple?: boolean;
  /** Single mode: pressing the active option clears it. */
  allowEmpty?: boolean;
  /** Accessible group name. */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function SelectButton({ options, value, defaultValue, onChange, multiple = false, allowEmpty = true, label, disabled, className }: SelectButtonProps) {
  const [raw, setRaw] = useControllable<string | string[] | null>(value, defaultValue ?? (multiple ? [] : null), onChange);
  const selected = new Set(raw == null ? [] : Array.isArray(raw) ? raw : [raw]);
  const press = (o: FormOption) => {
    if (multiple) {
      setRaw(options.filter((x) => (x.value === o.value ? !selected.has(x.value) : selected.has(x.value))).map((x) => x.value));
    } else if (selected.has(o.value)) {
      if (allowEmpty) setRaw(null);
    } else {
      setRaw(o.value);
    }
  };
  return (
    <div role="group" aria-label={label} className={cx('pl-selectbutton', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={selected.has(o.value)}
          disabled={disabled || o.disabled}
          className="pl-selectbutton__item"
          onClick={() => press(o)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ======================================================================
 * FloatLabel / IftaLabel
 * ==================================================================== */

interface LabelledChildProps {
  id?: string;
  placeholder?: string;
}

export interface FloatLabelProps {
  label: ReactNode;
  /** A single input-like element (native input/textarea/select or a component forwarding `id` and `placeholder`). */
  children: ReactElement;
  /** over: label rises above the field; in: inside the top of the field; on: sits on the border. */
  variant?: 'over' | 'in' | 'on';
  className?: string;
}

function useLabelledChild(children: ReactElement, needsPlaceholder: boolean) {
  const autoId = useId();
  const child = Children.only(children) as ReactElement<LabelledChildProps>;
  const childId = child.props.id ?? autoId;
  const element = cloneElement(child, {
    id: childId,
    // A blank placeholder lets CSS detect the empty state with :placeholder-shown.
    placeholder: needsPlaceholder ? child.props.placeholder ?? ' ' : child.props.placeholder,
  });
  return { childId, element };
}

export function FloatLabel({ label, children, variant = 'over', className }: FloatLabelProps) {
  const { childId, element } = useLabelledChild(children, true);
  return (
    <span className={cx('pl-floatlabel', `pl-floatlabel--${variant}`, className)}>
      <label className="pl-floatlabel__label" htmlFor={childId}>
        {label}
      </label>
      {element}
    </span>
  );
}

export interface IftaLabelProps {
  label: ReactNode;
  children: ReactElement;
  className?: string;
}

/** "Infield top-aligned" label: always visible, inside the top of the field. */
export function IftaLabel({ label, children, className }: IftaLabelProps) {
  const { childId, element } = useLabelledChild(children, false);
  return (
    <span className={cx('pl-iftalabel', className)}>
      <label className="pl-iftalabel__label" htmlFor={childId}>
        {label}
      </label>
      {element}
    </span>
  );
}

/* ======================================================================
 * InputGroup / IconField
 * ==================================================================== */

export function InputGroup({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('pl-inputgroup', className)} {...rest} />;
}

export function InputGroupAddon({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx('pl-inputgroup__addon', className)} {...rest} />;
}

export interface IconFieldProps extends HTMLAttributes<HTMLSpanElement> {
  iconPosition?: 'start' | 'end';
}

export function IconField({ iconPosition = 'start', className, ...rest }: IconFieldProps) {
  return <span className={cx('pl-iconfield', `pl-iconfield--${iconPosition}`, className)} {...rest} />;
}

/** Decorative icon inside an IconField (hidden from assistive tech). */
export function InputIcon({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx('pl-inputicon', className)} aria-hidden="true" {...rest} />;
}

/* ======================================================================
 * KeyFilter
 * ==================================================================== */

export type KeyFilterPattern = 'pint' | 'int' | 'pnum' | 'num' | 'alpha' | 'alphanum' | 'hex' | RegExp;

/** Single-character tests; digits and letters include non-Latin scripts (e.g. Arabic-Indic digits). */
const KEY_FILTERS: Record<Exclude<KeyFilterPattern, RegExp>, RegExp> = {
  pint: /^\p{Nd}$/u,
  int: /^[\p{Nd}-]$/u,
  pnum: /^[\p{Nd}.,]$/u,
  num: /^[\p{Nd}.,-]$/u,
  alpha: /^\p{L}$/u,
  alphanum: /^[\p{L}\p{Nd}]$/u,
  hex: /^[0-9a-f]$/i,
};

export interface KeyFilterHandlers {
  onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * Props that block disallowed characters (typed or pasted). The pattern is tested per character.
 * Compose with your own handlers via `handlers`.
 */
export function keyFilterProps(pattern: KeyFilterPattern, handlers: Partial<KeyFilterHandlers> = {}): KeyFilterHandlers {
  const re = typeof pattern === 'string' ? KEY_FILTERS[pattern] : pattern;
  const allowed = (ch: string) => {
    re.lastIndex = 0;
    return re.test(ch);
  };
  return {
    onKeyDown: (e) => {
      handlers.onKeyDown?.(e);
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      // Named keys (Backspace, ArrowLeft, Tab…) have multi-character names and always pass.
      if ([...e.key].length === 1 && !allowed(e.key)) e.preventDefault();
    },
    onPaste: (e) => {
      handlers.onPaste?.(e);
      if (e.defaultPrevented) return;
      const text = e.clipboardData.getData('text');
      const kept = [...text].filter(allowed).join('');
      if (kept === text) return;
      e.preventDefault();
      if (!kept) return;
      const el = e.currentTarget;
      el.setRangeText(kept, el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length, 'end');
      // Notify React (and other listeners) of the programmatic edit.
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
  };
}

/** Hook form of `keyFilterProps`: `<input {...useKeyFilter('int')} />`. */
export function useKeyFilter(pattern: KeyFilterPattern): KeyFilterHandlers {
  return useMemo(() => keyFilterProps(pattern), [pattern]);
}

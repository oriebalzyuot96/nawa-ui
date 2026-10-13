// accessibility — AccessibilityPanel and preference hooks.
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, trapFocus } from '@orca-ui/core/a11y';
import {
  A11Y_STORAGE_KEY,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  a11yOptions,
  a11yPanelSchema,
  announceA11yChange,
  applyA11yPrefs,
  contrastSwatches,
  countActiveA11yPrefs,
  defaultA11yPrefs,
  getA11yLabels,
  loadA11yPrefs,
  normalizeA11yPrefs,
  saveA11yPrefs,
  type A11yControl,
  type A11yGroup,
  type A11yPanelLabelOverrides,
  type A11yPanelLabels,
  type A11yPrefKey,
  type A11yPrefs,
} from '@orca-ui/core/a11y-prefs';
import { cx } from '../utils';

export type { A11yPrefs, A11yPrefKey, A11yPanelLabels, A11yPanelLabelOverrides } from '@orca-ui/core/a11y-prefs';
export {
  applyA11yPrefs,
  loadA11yPrefs,
  saveA11yPrefs,
  resetA11yPrefs,
  watchSystemPrefs,
  getSystemPrefs,
  defaultA11yPrefs,
  normalizeA11yPrefs,
} from '@orca-ui/core/a11y-prefs';
export { createTheme, applyCustomTheme, removeCustomTheme, themeToCode } from '@orca-ui/core/theme';
export type { CustomTheme, CreateThemeOptions } from '@orca-ui/core/theme';

type Target = HTMLElement | null | undefined | (() => HTMLElement | null | undefined);
const resolveTarget = (t: Target): HTMLElement | null =>
  typeof document === 'undefined' ? null : (typeof t === 'function' ? t() : t) ?? document.documentElement;

export interface UseA11yPrefsOptions {
  /** Controlled value. */
  value?: Partial<A11yPrefs>;
  /** Initial value when uncontrolled (merged under any saved preferences). */
  defaultValue?: Partial<A11yPrefs>;
  /** Called with the full preferences after every change. */
  onChange?: (prefs: A11yPrefs, change: { key: A11yPrefKey | 'reset'; value: unknown }) => void;
  /** Element that receives the data-a11y-* attributes. Default <html>. */
  target?: Target;
  /** Save to localStorage: true (default key), a custom key, or false. */
  persist?: boolean | string;
}

/**
 * Accessibility preferences as React state: loaded from storage, applied to the target on every change,
 * saved, and reported through `onChange`. Returns `[prefs, set(key, value), reset()]`.
 */
export function useA11yPrefs({ value, defaultValue, onChange, target, persist = true }: UseA11yPrefsOptions = {}) {
  const storageKey = persist === false ? null : typeof persist === 'string' ? persist : A11Y_STORAGE_KEY;
  const [inner, setInner] = useState<A11yPrefs>(() => normalizeA11yPrefs(defaultValue));
  const controlled = value !== undefined;
  const prefs = useMemo(() => (controlled ? normalizeA11yPrefs(value) : inner), [controlled, value, inner]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const loaded = useRef(false);

  // Restore saved preferences once, after mount (no hydration mismatch).
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    if (!storageKey || controlled) return;
    const saved = loadA11yPrefs(storageKey);
    setInner((cur) => normalizeA11yPrefs({ ...cur, ...Object.fromEntries(Object.entries(saved).filter(([k, v]) => v !== (defaultA11yPrefs as Record<string, unknown>)[k])) }));
  }, [storageKey, controlled]);

  useEffect(() => {
    const el = resolveTarget(target);
    if (el) applyA11yPrefs(prefs, el);
  }, [prefs, target]);

  const commit = useCallback(
    (next: A11yPrefs, change: { key: A11yPrefKey | 'reset'; value: unknown }) => {
      if (!controlled) setInner(next);
      if (storageKey) saveA11yPrefs(next, storageKey);
      onChangeRef.current?.(next, change);
    },
    [controlled, storageKey],
  );
  const set = useCallback(
    <K extends A11yPrefKey>(key: K, v: A11yPrefs[K]) => commit(normalizeA11yPrefs({ ...prefs, [key]: v }), { key, value: v }),
    [prefs, commit],
  );
  const reset = useCallback(() => commit({ ...defaultA11yPrefs }, { key: 'reset', value: null }), [commit]);
  return [prefs, set, reset] as const;
}

/* ---------- Icons (decorative; labels carry the meaning) ---------- */
const svgProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, focusable: false };
export function AccessibilityIcon(props: { className?: string }) {
  return (
    <svg {...svgProps} className={props.className}>
      <circle cx="12" cy="4.25" r="1.75" fill="currentColor" stroke="none" />
      <path d="M4.5 8.25c2.4.8 4.9 1.2 7.5 1.2s5.1-.4 7.5-1.2" />
      <path d="M12 9.5v4.25m0 0-2.75 6.75M12 13.75l2.75 6.75" />
    </svg>
  );
}
const groupIcons: Record<A11yGroup['id'], ReactNode> = {
  color: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 3.75v16.5a8.25 8.25 0 0 0 0-16.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
  text: (
    <svg {...svgProps}>
      <path d="M4 18 8.5 6h1L14 18M5.6 14h6.8M15.5 11.5c.6-.9 1.6-1.4 2.7-1.4 1.6 0 2.8 1 2.8 2.7V18m0-3.4c-.7-.5-1.6-.7-2.6-.7-1.7 0-2.9.9-2.9 2.1s1 2.1 2.4 2.1c1.4 0 2.6-.8 3.1-1.9" />
    </svg>
  ),
  reading: (
    <svg {...svgProps}>
      <path d="M3 5.5c3-.9 6-.6 9 1.2 3-1.8 6-2.1 9-1.2v13c-3-.9-6-.6-9 1.2-3-1.8-6-2.1-9-1.2z" />
      <path d="M12 6.7v13" />
    </svg>
  ),
  motion: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M10 9v6M14 9v6" />
    </svg>
  ),
  interaction: (
    <svg {...svgProps}>
      <path d="M6 3.5v13.2l3.4-3.2 2.4 5.6 2.5-1.1-2.4-5.5H16.5z" />
    </svg>
  ),
};
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** Arrow-key navigation for radio groups (RTL-aware; columns for grids). */
function radioKeys<T extends string>(e: KeyboardEvent<HTMLElement>, values: readonly T[], current: T, onSelect: (v: T) => void, columns = values.length) {
  const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
  const i = values.indexOf(current);
  let next = -1;
  if (e.key === 'ArrowRight') next = i + (rtl ? -1 : 1);
  else if (e.key === 'ArrowLeft') next = i + (rtl ? 1 : -1);
  else if (e.key === 'ArrowDown') next = i + (columns < values.length ? columns : 1);
  else if (e.key === 'ArrowUp') next = i - (columns < values.length ? columns : 1);
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = values.length - 1;
  else return;
  e.preventDefault();
  next = (next + values.length) % values.length;
  onSelect(values[next]);
  const group = e.currentTarget.closest('[role="radiogroup"]');
  requestAnimationFrame(() => (group?.querySelectorAll<HTMLElement>('[role="radio"]')[next])?.focus());
}

interface ControlProps {
  control: A11yControl;
  prefs: A11yPrefs;
  labels: A11yPanelLabels;
  idBase: string;
  onSet: (key: A11yPrefKey, value: unknown) => void;
}

function Control({ control, prefs, labels, idBase, onSet }: ControlProps) {
  const { key, type } = control;
  const text = labels.controls[key];
  const labelId = `${idBase}-${key}-label`;
  const hintId = text.hint ? `${idBase}-${key}-hint` : undefined;
  const value = prefs[key];
  const hint = text.hint ? (
    <p id={hintId} className="oc-a11y-control__hint">
      {text.hint}
    </p>
  ) : null;

  if (type === 'switch') {
    const on = control.on ? value === control.on : value === true;
    const next = control.on ? (on ? control.off : control.on) : !on;
    return (
      <div className="oc-a11y-control oc-a11y-control--switch">
        <div className="oc-a11y-control__text">
          <span id={labelId} className="oc-a11y-control__label">
            {text.label}
          </span>
          {hint}
        </div>
        <button
          type="button"
          role="switch"
          className="oc-switch"
          aria-checked={on}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          data-a11y-key={key}
          onClick={() => onSet(key, next)}
        />
      </div>
    );
  }

  if (type === 'select') {
    const id = `${idBase}-${key}`;
    return (
      <div className="oc-a11y-control">
        <label htmlFor={id} id={labelId} className="oc-a11y-control__label">
          {text.label}
        </label>
        <select id={id} className="oc-select" value={String(value)} aria-describedby={hintId} data-a11y-key={key} onChange={(e) => onSet(key, e.target.value)}>
          {(a11yOptions as Record<string, readonly string[]>)[key].map((o) => (
            <option key={o} value={o}>
              {labels.options[key]?.[o] ?? o}
            </option>
          ))}
        </select>
        {hint}
      </div>
    );
  }

  if (type === 'scale') {
    const id = `${idBase}-${key}`;
    const scale = prefs.fontScale;
    const pct = `${Math.round(scale * 100)}%`;
    const step = (d: number) => onSet('fontScale', Math.round(Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale + d)) * 100) / 100);
    return (
      <div className="oc-a11y-control">
        <label htmlFor={id} id={labelId} className="oc-a11y-control__label">
          {text.label}
        </label>
        <div className="oc-a11y-scale">
          <button type="button" className="oc-a11y-scale__btn oc-a11y-scale__btn--sm" aria-label={text.decrease} disabled={scale <= FONT_SCALE_MIN} onClick={() => step(-0.1)}>
            A
          </button>
          <input
            id={id}
            type="range"
            className="oc-slider"
            min={FONT_SCALE_MIN}
            max={FONT_SCALE_MAX}
            step={0.05}
            value={scale}
            aria-valuetext={pct}
            data-a11y-key={key}
            onChange={(e) => onSet('fontScale', Number(e.target.value))}
          />
          <button type="button" className="oc-a11y-scale__btn oc-a11y-scale__btn--lg" aria-label={text.increase} disabled={scale >= FONT_SCALE_MAX} onClick={() => step(0.1)}>
            A
          </button>
          <output htmlFor={id} className="oc-a11y-scale__value" aria-hidden="true">
            {pct}
          </output>
        </div>
      </div>
    );
  }

  const options = (a11yOptions as Record<string, readonly string[]>)[key];
  if (type === 'tiles') {
    return (
      <div className="oc-a11y-control">
        <span id={labelId} className="oc-a11y-control__label">
          {text.label}
        </span>
        {hint}
        <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hintId} className="oc-a11y-tiles" data-a11y-key={key}>
          {options.map((o) => {
            const sw = (contrastSwatches as Record<string, [string, string] | null>)[o];
            const checked = value === o;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                className="oc-a11y-tile"
                data-value={o}
                onClick={() => onSet(key, o)}
                onKeyDown={(e) => radioKeys(e, options, String(value), (v) => onSet(key, v), 4)}
              >
                <span
                  className="oc-a11y-tile__swatch"
                  data-swatch={o}
                  aria-hidden="true"
                  style={sw ? ({ '--oc-swatch-bg': sw[0], '--oc-swatch-fg': sw[1] } as CSSProperties) : undefined}
                >
                  <span>Aa</span>
                </span>
                <span>{labels.options[key]?.[o] ?? o}</span>
                <span className="oc-a11y-tile__check" aria-hidden="true">
                  <CheckIcon />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // segmented
  return (
    <div className="oc-a11y-control">
      <span id={labelId} className="oc-a11y-control__label">
        {text.label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hintId} className="oc-segmented" data-a11y-key={key}>
        {options.map((o) => {
          const checked = value === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className="oc-segmented__item"
              data-value={o}
              onClick={() => onSet(key, o)}
              onKeyDown={(e) => radioKeys(e, options, String(value), (v) => onSet(key, v))}
            >
              {labels.options[key]?.[o] ?? o}
            </button>
          );
        })}
      </div>
      {hint}
    </div>
  );
}

export interface AccessibilityPanelProps extends UseA11yPrefsOptions {
  /** Open state (controlled). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 'floating' (default): a round button fixed to the inline-end corner. 'inline': a button rendered in place. 'none': no button. */
  trigger?: 'floating' | 'inline' | 'none';
  /** Text next to the icon of the inline trigger. Default: the panel title. */
  triggerLabel?: ReactNode;
  /** 'en' (default) or 'ar'. Also sets lang/dir on the panel when given. */
  locale?: string;
  /** Override any label (deep merge over the locale defaults). */
  labels?: A11yPanelLabelOverrides;
  /** Show the live preview card. Default true. */
  preview?: boolean;
  /** Limit and order the groups. Default: all. */
  groups?: Array<A11yGroup['id']>;
  className?: string;
}

/**
 * A settings drawer for every accessibility display mode: color schemes, color-vision filters, text size
 * and spacing, reading aids, motion and interaction aids. Changes apply live to the page (or `target`),
 * persist in localStorage and are announced politely. Keyboard: Tab through controls, arrows inside
 * option groups, Escape closes and returns focus to the trigger.
 */
export function AccessibilityPanel({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger = 'floating',
  triggerLabel,
  locale,
  labels: labelOverrides,
  preview = true,
  groups,
  className,
  ...prefsOptions
}: AccessibilityPanelProps) {
  const [prefs, set, reset] = useA11yPrefs(prefsOptions);
  const labels = useMemo(() => getA11yLabels(locale ?? 'en', labelOverrides), [locale, labelOverrides]);
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      if (openProp === undefined) setInnerOpen(v);
      onOpenChange?.(v);
    },
    [openProp, onOpenChange],
  );
  const [message, setMessage] = useState('');
  const uid = useId().replace(/:/g, '');
  const panelId = `oc-a11y-panel-${uid}`;
  const titleId = `${panelId}-title`;
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onSet = useCallback(
    (key: A11yPrefKey, value: unknown) => {
      set(key, value as never);
      setMessage(announceA11yChange(labels, key, value));
    },
    [set, labels],
  );
  const onReset = () => {
    reset();
    setMessage(labels.resetDone);
  };

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.focus();
    const release = trapFocus(panel);
    const unlock = lockScroll();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      } else if (e.key === 'Tab' && !e.shiftKey && document.activeElement === panel) {
        // The panel itself has focus right after opening: Tab goes to its first control, not the page.
        e.preventDefault();
        panel.querySelector<HTMLElement>('button:not(:disabled), select, input, [tabindex="0"]')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      release();
      unlock();
      (triggerRef.current ?? previous)?.focus?.();
    };
  }, [open, setOpen, mounted]);

  const active = countActiveA11yPrefs(prefs);
  const shownGroups = groups ? groups.map((g) => a11yPanelSchema.find((s) => s.id === g)).filter((g): g is A11yGroup => !!g) : a11yPanelSchema;
  const isAr = !!locale && locale.toLowerCase().startsWith('ar');
  const langProps = locale ? { lang: isAr ? 'ar' : 'en', dir: isAr ? 'rtl' : 'ltr' } : {};
  const activeText = labels.active.replace('{n}', String(active));

  const panel = open ? (
    <>
      <div className="oc-a11y-backdrop" onMouseDown={() => setOpen(false)} />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('oc-a11y-panel', className)}
        {...langProps}
      >
        <div className="oc-a11y-panel__header">
          <span className="oc-a11y-panel__icon" aria-hidden="true">
            <AccessibilityIcon />
          </span>
          <div className="oc-a11y-panel__heading">
            <h2 id={titleId} className="oc-a11y-panel__title">
              {labels.title}
            </h2>
            <p className="oc-a11y-panel__subtitle">{labels.subtitle}</p>
          </div>
          <button type="button" className="oc-close" aria-label={labels.close} onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className="oc-a11y-panel__body">
          {preview && (
            // A visual sample only (screen readers get the announcements instead), so it holds no controls.
            <div className="oc-a11y-preview" aria-hidden="true">
              <p className="oc-a11y-preview__label">{labels.preview}</p>
              <p className="oc-a11y-preview__title">{labels.previewTitle}</p>
              <p className="oc-a11y-preview__body">{labels.previewBody}</p>
              <div className="oc-a11y-preview__row">
                <span className="oc-a11y-preview__link">{labels.previewLink}</span>
                <span className="oc-btn oc-btn--primary oc-btn--sm">{labels.previewButton}</span>
                <span className="oc-badge oc-badge--success">{labels.previewStatus}</span>
              </div>
            </div>
          )}
          {shownGroups.map((group) => (
            <section key={group.id} className="oc-a11y-group" aria-labelledby={`${panelId}-${group.id}`}>
              <h3 id={`${panelId}-${group.id}`} className="oc-a11y-group__title">
                {groupIcons[group.id]}
                {labels.groups[group.id]}
              </h3>
              {group.controls.map((c) => (
                <Control key={c.key} control={c} prefs={prefs} labels={labels} idBase={panelId} onSet={onSet} />
              ))}
            </section>
          ))}
        </div>
        <div className="oc-a11y-panel__footer">
          <span className="oc-a11y-panel__count">{activeText}</span>
          <button type="button" className="oc-btn oc-btn--secondary oc-btn--sm" onClick={onReset} disabled={active === 0}>
            {labels.reset}
          </button>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {trigger !== 'none' && (
        <button
          ref={triggerRef}
          type="button"
          className={cx('oc-a11y-trigger', trigger === 'inline' && 'oc-a11y-trigger--inline')}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={trigger === 'floating' ? (active ? `${labels.trigger} (${activeText})` : labels.trigger) : undefined}
          onClick={() => setOpen(!open)}
        >
          <AccessibilityIcon />
          {trigger === 'inline' && <span>{triggerLabel ?? labels.title}</span>}
          {trigger === 'inline' && active > 0 && <span className="oc-sr-only"> ({activeText})</span>}
          {active > 0 && (
            <span className="oc-a11y-trigger__badge" aria-hidden="true">
              {active}
            </span>
          )}
        </button>
      )}
      <div role="status" aria-live="polite" className="oc-sr-only">
        {message}
      </div>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}

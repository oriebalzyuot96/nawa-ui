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
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, trapFocus } from '@pelagic-ui/core/a11y';
import {
  A11Y_STORAGE_KEY,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  a11yOptions,
  accentSwatches,
  announceA11yChange,
  applyA11yPrefs,
  contrastSwatches,
  countActiveA11yPrefs,
  defaultA11yPrefs,
  getA11yLabels,
  isExternalControl,
  loadA11yPrefs,
  normalizeA11yPrefs,
  panelGroups,
  presetSwatches,
  saveA11yPrefs,
  themeControlValue,
  themePanelOptions,
  type A11yControl,
  type A11yExternalKey,
  type A11yGroup,
  type A11yPanelLabelOverrides,
  type A11yPanelLabels,
  type A11yPrefKey,
  type A11yPrefs,
} from '@pelagic-ui/core/a11y-prefs';
import {
  THEME_CHANGE_EVENT,
  getThemeState,
  switchTheme as coreSwitchTheme,
  type SwitchThemeOptions,
  type ThemeChoice,
  type ThemeState,
  type ThemeSwitchOrigin,
} from '@pelagic-ui/core/theme';
import { SOUND_CHANGE_EVENT, SOUND_PREFS_EVENT, getSoundPrefs, hasSoundEngine, setSoundPrefs, type SoundPrefs } from '@pelagic-ui/core/sound';
import { cx } from '../utils';

export type { A11yPrefs, A11yPrefKey, A11yPanelLabels, A11yPanelLabelOverrides } from '@pelagic-ui/core/a11y-prefs';
export {
  applyA11yPrefs,
  loadA11yPrefs,
  saveA11yPrefs,
  resetA11yPrefs,
  watchSystemPrefs,
  getSystemPrefs,
  defaultA11yPrefs,
  normalizeA11yPrefs,
} from '@pelagic-ui/core/a11y-prefs';
export { createTheme, applyCustomTheme, removeCustomTheme, themeToCode, switchTheme, getThemeState, onThemeChange, restoreTheme } from '@pelagic-ui/core/theme';
export type { CustomTheme, CreateThemeOptions, ThemeState, SwitchThemeOptions, ThemeSwitchOrigin, ThemePreset } from '@pelagic-ui/core/theme';

/* ---------- Theme switch ---------- */

const EMPTY_THEME = getThemeState(null);

/**
 * The live theme of <html> (or `target`) and an animated switch. The switch takes a theme change and,
 * optionally, where the reveal starts: the click event of the control (its pointer position, or the control
 * itself for keyboard clicks), an element or { x, y }.
 *
 *   const { theme, switchTheme } = useThemeSwitch();
 *   <button onClick={(e) => switchTheme({ mode: theme.mode === 'dark' ? 'light' : 'dark' }, e)}>Toggle</button>
 *
 * Reduced motion (OS or data-a11y-motion) switches instantly. The state starts at the defaults on the server
 * and the first client render (no hydration mismatch), then follows every switchTheme() on the page.
 */
export function useThemeSwitch({ target }: { target?: HTMLElement | null } = {}) {
  const [theme, setTheme] = useState<ThemeState>(EMPTY_THEME);
  useEffect(() => {
    const el = target ?? document.documentElement;
    const sync = () => setTheme(getThemeState(el));
    sync();
    el.addEventListener(THEME_CHANGE_EVENT, sync);
    return () => el.removeEventListener(THEME_CHANGE_EVENT, sync);
  }, [target]);
  const switchTheme = useCallback(
    (next: ThemeChoice, origin?: ThemeSwitchOrigin | SyntheticEvent, options?: Omit<SwitchThemeOptions, 'origin'>) =>
      coreSwitchTheme(next, { target: target ?? undefined, ...options, origin: origin as ThemeSwitchOrigin }),
    [target],
  );
  return { theme, switchTheme };
}

/**
 * The user's interface-sound preferences, shared with every sound engine on the page (SoundProvider).
 * Returns [prefs, set(patch), available] where `available` is true once a sound engine exists.
 */
export function useSoundPrefs() {
  const [prefs, setPrefs] = useState<SoundPrefs>({ enabled: false, theme: 'soft', volume: 0.6, reduced: false });
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const sync = () => {
      setPrefs(getSoundPrefs());
      setAvailable(hasSoundEngine());
    };
    sync();
    window.addEventListener(SOUND_CHANGE_EVENT, sync);
    window.addEventListener(SOUND_PREFS_EVENT, sync);
    return () => {
      window.removeEventListener(SOUND_CHANGE_EVENT, sync);
      window.removeEventListener(SOUND_PREFS_EVENT, sync);
    };
  }, []);
  const set = useCallback((patch: Partial<SoundPrefs>) => setPrefs(setSoundPrefs(patch)), []);
  return [prefs, set, available] as const;
}

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
  appearance: (
    <svg {...svgProps}>
      <path d="M12 3.75a8.25 8.25 0 1 0 0 16.5c1.1 0 1.7-.7 1.7-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6h1.9a4.1 4.1 0 0 0 4.1-4.1c0-3.7-3.7-6.8-8.3-6.8z" />
      <circle cx="7.6" cy="11.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.4" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.9" cy="7.9" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  sound: (
    <svg {...svgProps}>
      <path d="M4.5 9.5h3l4.5-3.75v12.5L7.5 14.5h-3z" />
      <path d="M15.5 9.25a4 4 0 0 1 0 5.5M18 7a7.2 7.2 0 0 1 0 10" />
    </svg>
  ),
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

interface ExternalProps {
  control: A11yControl;
  labels: A11yPanelLabels;
  idBase: string;
  theme: ThemeState;
  sound: SoundPrefs;
  onTheme: (key: A11yExternalKey | 'reset', value: string | null, origin?: SyntheticEvent | Element | null, options?: Omit<SwitchThemeOptions, 'origin'>) => void;
  onBrandPreview: (value: string) => void;
  onSound: (patch: Partial<SoundPrefs>) => void;
}

/** Theme (mode, color theme, accent, own color) and sound controls: their values live in theme.js / sound.js. */
function ExternalControl({ control, labels, idBase, theme, sound, onTheme, onBrandPreview, onSound }: ExternalProps) {
  const { key, type } = control;
  const text = labels.controls[key];
  const labelId = `${idBase}-${key}-label`;
  const hintId = text.hint ? `${idBase}-${key}-hint` : undefined;
  const hint = text.hint ? (
    <p id={hintId} className="pl-a11y-control__hint">
      {text.hint}
    </p>
  ) : null;
  const isTheme = control.source === 'theme';

  if (type === 'switch') {
    return (
      <div className="pl-a11y-control pl-a11y-control--switch">
        <div className="pl-a11y-control__text">
          <span id={labelId} className="pl-a11y-control__label">
            {text.label}
          </span>
          {hint}
        </div>
        <button
          type="button"
          role="switch"
          className="pl-switch"
          aria-checked={sound.enabled}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          data-sound-key="enabled"
          onClick={() => onSound({ enabled: !sound.enabled })}
        />
      </div>
    );
  }

  if (type === 'color') {
    const id = `${idBase}-${key}`;
    const fallback = presetSwatches[theme.preset]?.light.primary ?? presetSwatches.default.light.primary;
    return (
      <div className="pl-a11y-control pl-a11y-brand">
        <label htmlFor={id} id={labelId} className="pl-a11y-control__label">
          {text.label}
        </label>
        <div className="pl-a11y-brand__row">
          <input
            id={id}
            type="color"
            className="pl-a11y-brand__input"
            value={theme.brand ?? fallback}
            aria-describedby={hintId}
            data-theme-key="brand"
            data-active={theme.brand ? 'true' : 'false'}
            // React's onChange is the native input event: the theme follows the picker live and is saved.
            onChange={(e) => onBrandPreview(e.target.value)}
          />
          <span className="pl-a11y-brand__hex" dir="ltr" aria-hidden="true">
            {theme.brand ?? ''}
          </span>
          {theme.brand && (
            <button type="button" className="pl-btn pl-btn--ghost pl-btn--sm" onClick={(e) => onTheme('brand', null, e)}>
              {text.clear ?? 'Remove'}
            </button>
          )}
        </div>
        {hint}
      </div>
    );
  }

  const values: readonly string[] = isTheme ? (themePanelOptions as unknown as Record<string, readonly string[]>)[key] : themePanelOptions.soundTheme;
  const current = isTheme ? themeControlValue(theme, key as 'mode' | 'preset' | 'accent') : sound.theme;
  const anyChecked = current !== null && values.includes(current);
  const select = (v: string, origin?: SyntheticEvent | Element) => (isTheme ? onTheme(key as A11yExternalKey, v, origin) : onSound({ theme: v as SoundPrefs['theme'] }));
  const columns = type === 'presets' ? 3 : values.length;
  const cls = type === 'presets' ? 'pl-a11y-presets' : type === 'swatches' ? 'pl-a11y-swatches' : 'pl-segmented';
  const groupData = isTheme ? { 'data-theme-key': key } : { 'data-sound-key': 'theme' };
  return (
    <div className="pl-a11y-control">
      <span id={labelId} className="pl-a11y-control__label">
        {text.label}
      </span>
      {type !== 'segmented' && hint}
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hintId} className={cls} data-columns={type === 'presets' ? 3 : undefined} {...groupData}>
        {values.map((o, i) => {
          const checked = current === o;
          const label = labels.options[key]?.[o] ?? o;
          const common = {
            type: 'button' as const,
            role: 'radio',
            'aria-checked': checked,
            tabIndex: checked || (!anyChecked && i === 0) ? 0 : -1,
            [isTheme ? 'data-theme-value' : 'data-sound-value']: o,
            onClick: (e: SyntheticEvent) => select(o, e),
            onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
              const group = e.currentTarget.closest('[role="radiogroup"]');
              radioKeys(e, values, String(current), (v) => select(v, group?.querySelectorAll<HTMLElement>('[role="radio"]')[values.indexOf(v)] ?? undefined), columns);
            },
          };
          if (type === 'presets') {
            const sw = presetSwatches[o];
            const style = {
              '--pl-ps-ls': sw.light.surface,
              '--pl-ps-la': sw.light.alt,
              '--pl-ps-lp': sw.light.primary,
              '--pl-ps-lt': sw.light.text,
              '--pl-ps-ds': sw.dark.surface,
              '--pl-ps-da': sw.dark.alt,
              '--pl-ps-dp': sw.dark.primary,
              '--pl-ps-dt': sw.dark.text,
            } as CSSProperties;
            return (
              <button key={o} {...common} className="pl-a11y-preset" style={style}>
                <span className="pl-a11y-preset__art" aria-hidden="true">
                  <span className="pl-a11y-preset__half pl-a11y-preset__half--light">
                    <i />
                    <b />
                  </span>
                  <span className="pl-a11y-preset__half pl-a11y-preset__half--dark">
                    <i />
                    <b />
                  </span>
                </span>
                <span className="pl-a11y-preset__name">{label}</span>
                <span className="pl-a11y-tile__check" aria-hidden="true">
                  <CheckIcon />
                </span>
              </button>
            );
          }
          if (type === 'swatches') {
            const color = o === 'default' ? presetSwatches[theme.preset]?.light.primary ?? presetSwatches.default.light.primary : accentSwatches[o];
            return (
              <button key={o} {...common} className={cx('pl-a11y-swatch', o === 'default' && 'pl-a11y-swatch--default')} aria-label={label} title={label} style={{ '--pl-swatch': color } as CSSProperties}>
                <CheckIcon />
              </button>
            );
          }
          return (
            <button key={o} {...common} className="pl-segmented__item">
              {label}
            </button>
          );
        })}
      </div>
      {type === 'segmented' && hint}
    </div>
  );
}

function Control({ control, prefs, labels, idBase, onSet }: ControlProps) {
  const { type } = control;
  const key = control.key as A11yPrefKey;
  const text = labels.controls[key];
  const labelId = `${idBase}-${key}-label`;
  const hintId = text.hint ? `${idBase}-${key}-hint` : undefined;
  const value = prefs[key];
  const hint = text.hint ? (
    <p id={hintId} className="pl-a11y-control__hint">
      {text.hint}
    </p>
  ) : null;

  if (type === 'switch') {
    const on = control.on ? value === control.on : value === true;
    const next = control.on ? (on ? control.off : control.on) : !on;
    return (
      <div className="pl-a11y-control pl-a11y-control--switch">
        <div className="pl-a11y-control__text">
          <span id={labelId} className="pl-a11y-control__label">
            {text.label}
          </span>
          {hint}
        </div>
        <button
          type="button"
          role="switch"
          className="pl-switch"
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
      <div className="pl-a11y-control">
        <label htmlFor={id} id={labelId} className="pl-a11y-control__label">
          {text.label}
        </label>
        <select id={id} className="pl-select" value={String(value)} aria-describedby={hintId} data-a11y-key={key} onChange={(e) => onSet(key, e.target.value)}>
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
      <div className="pl-a11y-control">
        <label htmlFor={id} id={labelId} className="pl-a11y-control__label">
          {text.label}
        </label>
        <div className="pl-a11y-scale">
          <button type="button" className="pl-a11y-scale__btn pl-a11y-scale__btn--sm" aria-label={text.decrease} disabled={scale <= FONT_SCALE_MIN} onClick={() => step(-0.1)}>
            A
          </button>
          <input
            id={id}
            type="range"
            className="pl-slider"
            min={FONT_SCALE_MIN}
            max={FONT_SCALE_MAX}
            step={0.05}
            value={scale}
            aria-valuetext={pct}
            data-a11y-key={key}
            onChange={(e) => onSet('fontScale', Number(e.target.value))}
          />
          <button type="button" className="pl-a11y-scale__btn pl-a11y-scale__btn--lg" aria-label={text.increase} disabled={scale >= FONT_SCALE_MAX} onClick={() => step(0.1)}>
            A
          </button>
          <output htmlFor={id} className="pl-a11y-scale__value" aria-hidden="true">
            {pct}
          </output>
        </div>
      </div>
    );
  }

  const options = (a11yOptions as Record<string, readonly string[]>)[key];
  if (type === 'tiles') {
    return (
      <div className="pl-a11y-control">
        <span id={labelId} className="pl-a11y-control__label">
          {text.label}
        </span>
        {hint}
        <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hintId} className="pl-a11y-tiles" data-a11y-key={key}>
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
                className="pl-a11y-tile"
                data-value={o}
                onClick={() => onSet(key, o)}
                onKeyDown={(e) => radioKeys(e, options, String(value), (v) => onSet(key, v), 4)}
              >
                <span
                  className="pl-a11y-tile__swatch"
                  data-swatch={o}
                  aria-hidden="true"
                  style={sw ? ({ '--pl-swatch-bg': sw[0], '--pl-swatch-fg': sw[1] } as CSSProperties) : undefined}
                >
                  <span>Aa</span>
                </span>
                <span>{labels.options[key]?.[o] ?? o}</span>
                <span className="pl-a11y-tile__check" aria-hidden="true">
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
    <div className="pl-a11y-control">
      <span id={labelId} className="pl-a11y-control__label">
        {text.label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} aria-describedby={hintId} className="pl-segmented" data-a11y-key={key}>
        {options.map((o) => {
          const checked = value === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className="pl-segmented__item"
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
  /** Show the Theme group (mode, color theme, accent, own color). Default true. */
  appearance?: boolean;
  /** Sound group: 'auto' (default) once a sound engine exists (SoundProvider), true always, false never. */
  sound?: boolean | 'auto';
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
  appearance = true,
  sound: soundOption = 'auto',
  className,
  ...prefsOptions
}: AccessibilityPanelProps) {
  const [prefs, set, reset] = useA11yPrefs(prefsOptions);
  const { theme, switchTheme } = useThemeSwitch();
  const [soundPrefs, setSound, soundAvailable] = useSoundPrefs();
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
  const panelId = `pl-a11y-panel-${uid}`;
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
  const onTheme = useCallback(
    (key: A11yExternalKey | 'reset', value: string | null, origin?: SyntheticEvent | Element | null, options?: Omit<SwitchThemeOptions, 'origin'>) => {
      const next: ThemeChoice = key === 'reset' ? { preset: 'default', accent: null, brand: null } : { [key]: value };
      void switchTheme(next, origin ?? undefined, options);
      setMessage(key === 'reset' ? labels.themeReset : announceA11yChange(labels, key, value ?? false));
    },
    [switchTheme, labels],
  );
  // The picker fires on every move: follow it once per frame, without the reveal animation.
  const brandFrame = useRef(0);
  const brandAnnounce = useRef(0);
  const onBrandPreview = useCallback(
    (value: string) => {
      cancelAnimationFrame(brandFrame.current);
      brandFrame.current = requestAnimationFrame(() => {
        void switchTheme({ brand: value }, undefined, { animate: false });
      });
      // Announce once the picker settles, not on every move.
      clearTimeout(brandAnnounce.current);
      brandAnnounce.current = window.setTimeout(() => setMessage(announceA11yChange(labels, 'brand', value)), 700);
    },
    [switchTheme, labels],
  );
  useEffect(
    () => () => {
      cancelAnimationFrame(brandFrame.current);
      clearTimeout(brandAnnounce.current);
    },
    [],
  );
  const onSound = useCallback(
    (patch: Partial<SoundPrefs>) => {
      setSound(patch);
      if (patch.enabled !== undefined) setMessage(announceA11yChange(labels, 'sound', patch.enabled));
      else if (patch.theme) setMessage(announceA11yChange(labels, 'soundTheme', patch.theme));
    },
    [setSound, labels],
  );

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
  const shownGroups = panelGroups(groups, { appearance, sound: soundOption }).filter((g) => g.id !== 'sound' || soundOption === true || soundAvailable);
  const themeIsDefault = theme.preset === 'default' && !theme.accent && !theme.brand;
  const isAr = !!locale && locale.toLowerCase().startsWith('ar');
  const langProps = locale ? { lang: isAr ? 'ar' : 'en', dir: isAr ? 'rtl' : 'ltr' } : {};
  const activeText = labels.active.replace('{n}', String(active));

  const panel = open ? (
    <>
      <div className="pl-a11y-backdrop" onMouseDown={() => setOpen(false)} />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('pl-a11y-panel', className)}
        {...langProps}
      >
        <div className="pl-a11y-panel__header">
          <span className="pl-a11y-panel__icon" aria-hidden="true">
            <AccessibilityIcon />
          </span>
          <div className="pl-a11y-panel__heading">
            <h2 id={titleId} className="pl-a11y-panel__title">
              {labels.title}
            </h2>
            <p className="pl-a11y-panel__subtitle">{labels.subtitle}</p>
          </div>
          <button type="button" className="pl-close" aria-label={labels.close} onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className="pl-a11y-panel__body">
          {preview && (
            // A visual sample only (screen readers get the announcements instead), so it holds no controls.
            <div className="pl-a11y-preview" aria-hidden="true">
              <p className="pl-a11y-preview__label">{labels.preview}</p>
              <p className="pl-a11y-preview__title">{labels.previewTitle}</p>
              <p className="pl-a11y-preview__body">{labels.previewBody}</p>
              <div className="pl-a11y-preview__row">
                <span className="pl-a11y-preview__link">{labels.previewLink}</span>
                <span className="pl-btn pl-btn--primary pl-btn--sm">{labels.previewButton}</span>
                <span className="pl-badge pl-badge--success">{labels.previewStatus}</span>
              </div>
            </div>
          )}
          {shownGroups.map((group) => (
            <section key={group.id} className="pl-a11y-group" aria-labelledby={`${panelId}-${group.id}`}>
              <h3 id={`${panelId}-${group.id}`} className="pl-a11y-group__title">
                {groupIcons[group.id]}
                {labels.groups[group.id]}
              </h3>
              {group.controls.map((c) =>
                isExternalControl(c) ? (
                  <ExternalControl key={c.key} control={c} labels={labels} idBase={panelId} theme={theme} sound={soundPrefs} onTheme={onTheme} onBrandPreview={onBrandPreview} onSound={onSound} />
                ) : (
                  <Control key={c.key} control={c} prefs={prefs} labels={labels} idBase={panelId} onSet={onSet} />
                ),
              )}
              {group.id === 'appearance' && (
                <div className="pl-a11y-group__actions">
                  <button type="button" className="pl-btn pl-btn--ghost pl-btn--sm" disabled={themeIsDefault} onClick={(e) => onTheme('reset', null, e)}>
                    {labels.themeReset}
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
        <div className="pl-a11y-panel__footer">
          <span className="pl-a11y-panel__count">{activeText}</span>
          <button type="button" className="pl-btn pl-btn--secondary pl-btn--sm" onClick={onReset} disabled={active === 0}>
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
          className={cx('pl-a11y-trigger', trigger === 'inline' && 'pl-a11y-trigger--inline')}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={trigger === 'floating' ? (active ? `${labels.trigger} (${activeText})` : labels.trigger) : undefined}
          onClick={() => setOpen(!open)}
        >
          <AccessibilityIcon />
          {trigger === 'inline' && <span>{triggerLabel ?? labels.title}</span>}
          {trigger === 'inline' && active > 0 && <span className="pl-sr-only"> ({activeText})</span>}
          {active > 0 && (
            <span className="pl-a11y-trigger__badge" aria-hidden="true">
              {active}
            </span>
          )}
        </button>
      )}
      <div role="status" aria-live="polite" className="pl-sr-only">
        {message}
      </div>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}

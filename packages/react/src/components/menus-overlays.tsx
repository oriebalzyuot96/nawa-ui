// menus-overlays — PrimeNG parity components: menus, menu buttons and floating overlays.
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ElementType,
  type FocusEvent as ReactFocusEvent,
  type ForwardedRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { getFocusable, lockScroll, trapFocus } from '@orca-ui/core/a11y';
import { cx } from '../utils';
import { Button, type ButtonSize, type ButtonVariant } from './actions';
import { Dialog } from './overlay';

/* =========================================================================
 * Shared model and helpers
 * ========================================================================= */

export interface MenuCommandEvent {
  item: MenuItem;
  originalEvent: SyntheticEvent;
}

export interface MenuItem {
  label?: string;
  icon?: ReactNode;
  command?: (event: MenuCommandEvent) => void;
  url?: string;
  target?: string;
  items?: MenuItem[];
  disabled?: boolean;
  separator?: boolean;
  /** Displayed hint and exposed as aria-keyshortcuts, e.g. "Control+S". */
  shortcut?: string;
  badge?: ReactNode;
  danger?: boolean;
  /** Stable key (PanelMenu expansion state, React keys). */
  key?: string;
}

/** Anything with a currentTarget: React synthetic events and DOM events both work. */
export interface TriggerEvent {
  currentTarget: EventTarget | null;
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function isRtl(el: Element | null | undefined): boolean {
  if (!el) return typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const dir = el.closest('[dir]')?.getAttribute('dir');
  if (dir) return dir === 'rtl';
  return typeof getComputedStyle === 'function' && getComputedStyle(el).direction === 'rtl';
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void): [T, (value: T) => void] {
  const [inner, setInner] = useState(defaultValue);
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

function useMediaQuery(query: string): boolean {
  // Start false so server and first client render agree (no hydration mismatch); the effect syncs it.
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [query]);
  return matches;
}

/** Calls `onOutside` on a pointerdown outside every element returned by `getEls`. */
function useOutsidePointer(active: boolean, getEls: Array<() => Element | null | undefined>, onOutside: () => void) {
  const latest = useRef({ getEls, onOutside });
  latest.current = { getEls, onOutside };
  useEffect(() => {
    if (!active) return;
    const handler = (e: Event) => {
      const target = e.target as Node;
      if (latest.current.getEls.some((get) => get()?.contains(target))) return;
      latest.current.onOutside();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [active]);
}

/** Toggle the `inert` attribute imperatively (works on React 18 and 19 alike). */
function useInert(ref: RefObject<HTMLElement>, inert: boolean) {
  useIsoLayoutEffect(() => {
    ref.current?.toggleAttribute('inert', inert);
  }, [inert, ref]);
}

/** Type-to-select: returns the index of the next label starting with the typed characters, or -1. */
function useTypeahead() {
  const buffer = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return (char: string, labels: string[], from: number): number => {
    buffer.current += char.toLowerCase();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => (buffer.current = ''), 500);
    const query = buffer.current;
    // Repeating one letter cycles through items with that initial.
    const cycling = query.split('').every((c) => c === query[0]);
    const search = cycling ? query[0] : query;
    const start = cycling ? from + 1 : from;
    for (let k = 0; k < labels.length; k++) {
      const idx = (start + k) % labels.length;
      if (labels[idx].toLowerCase().startsWith(search)) return idx;
    }
    return -1;
  };
}

interface FocusScopeOptions {
  trap?: boolean;
  lock?: boolean;
  /** Element to focus first; defaults to the first focusable descendant, then the container. */
  initialFocus?: () => HTMLElement | null | undefined;
  autoFocus?: boolean;
  restoreFocus?: () => boolean;
  restoreTo?: () => HTMLElement | null | undefined;
}

/** Moves focus into `ref` while active, optionally traps Tab and locks scroll, and restores focus on release. */
function useFocusScope(active: boolean, ref: RefObject<HTMLElement>, options: FocusScopeOptions = {}) {
  const opts = useRef(options);
  opts.current = options;
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const previous = document.activeElement as HTMLElement | null;
    const { trap, lock, initialFocus, autoFocus = true } = opts.current;
    if (autoFocus) (initialFocus?.() ?? getFocusable(el)[0] ?? el).focus();
    const releaseTrap = trap ? trapFocus(el) : undefined;
    const releaseScroll = lock ? lockScroll() : undefined;
    return () => {
      releaseTrap?.();
      releaseScroll?.();
      const { restoreFocus, restoreTo } = opts.current;
      if (restoreFocus && !restoreFocus()) return;
      (restoreTo?.() ?? previous)?.focus?.();
    };
  }, [active, ref]);
}

/* ---------- Floating positioning ---------- */

export type FloatingSide = 'top' | 'bottom' | 'start' | 'end';
export type FloatingAlign = 'start' | 'center' | 'end';

interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface FloatingOptions {
  side?: FloatingSide;
  align?: FloatingAlign;
  offset?: number;
  rtl?: boolean;
}

interface FloatingPosition {
  top: number;
  left: number;
  side: FloatingSide;
}

const VIEWPORT_MARGIN = 8;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, Math.max(min, max)));

/**
 * Viewport coordinates for a `position: fixed` element next to `anchor`.
 * Flips to the opposite side when the preferred one lacks room, then clamps to the viewport.
 * `start`/`end` (side and align) are logical and follow `rtl`.
 */
function computePosition(anchor: Rect, size: { width: number; height: number }, opts: FloatingOptions): FloatingPosition {
  const { side = 'bottom', align = 'start', offset = 4, rtl = false } = opts;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  let top: number;
  let left: number;
  let resolved = side;

  if (side === 'top' || side === 'bottom') {
    const below = vh - anchor.bottom - offset;
    const above = anchor.top - offset;
    if (side === 'bottom' && size.height > below && above > below) resolved = 'top';
    if (side === 'top' && size.height > above && below > above) resolved = 'bottom';
    top = resolved === 'bottom' ? anchor.bottom + offset : anchor.top - offset - size.height;
    const startEdge = rtl ? anchor.right - size.width : anchor.left;
    const endEdge = rtl ? anchor.left : anchor.right - size.width;
    left = align === 'center' ? anchor.left + (anchor.width - size.width) / 2 : align === 'start' ? startEdge : endEdge;
  } else {
    let toRight = (side === 'end') !== rtl;
    const spaceRight = vw - anchor.right - offset;
    const spaceLeft = anchor.left - offset;
    if (toRight && size.width > spaceRight && spaceLeft > spaceRight) toRight = false;
    else if (!toRight && size.width > spaceLeft && spaceRight > spaceLeft) toRight = true;
    resolved = toRight !== rtl ? 'end' : 'start';
    left = toRight ? anchor.right + offset : anchor.left - offset - size.width;
    top = align === 'center' ? anchor.top + (anchor.height - size.height) / 2 : align === 'end' ? anchor.bottom - size.height : anchor.top;
  }
  return {
    top: clamp(top, VIEWPORT_MARGIN, vh - size.height - VIEWPORT_MARGIN),
    left: clamp(left, VIEWPORT_MARGIN, vw - size.width - VIEWPORT_MARGIN),
    side: resolved,
  };
}

/** Keeps a fixed-position element anchored while open (scroll in any ancestor, resize, own size changes). */
function useFloating(
  open: boolean,
  floatingRef: RefObject<HTMLElement>,
  getAnchor: () => Rect | null | undefined,
  options: FloatingOptions & { onPosition?: (pos: FloatingPosition, anchor: Rect, el: HTMLElement) => void } = {},
) {
  const latest = useRef({ getAnchor, options });
  latest.current = { getAnchor, options };
  useIsoLayoutEffect(() => {
    const el = floatingRef.current;
    if (!open || !el) return;
    const update = () => {
      const anchor = latest.current.getAnchor();
      if (!anchor) return;
      const pos = computePosition(anchor, { width: el.offsetWidth, height: el.offsetHeight }, latest.current.options);
      el.style.top = `${pos.top}px`;
      el.style.left = `${pos.left}px`;
      el.dataset.side = pos.side;
      latest.current.options.onPosition?.(pos, anchor, el);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      ro?.disconnect();
    };
  }, [open, floatingRef]);
}

const pointRect = (x: number, y: number): Rect => ({ top: y, bottom: y, left: x, right: x, width: 0, height: 0 });

/** Positions an arrow element along the panel edge so it points at the anchor's centre. */
function placeArrow(arrow: HTMLElement | null, pos: FloatingPosition, anchor: Rect, panel: HTMLElement) {
  if (!arrow) return;
  const x = anchor.left + anchor.width / 2 - pos.left;
  arrow.style.left = `${clamp(x, 14, panel.offsetWidth - 14)}px`;
}

function focusEdge(container: Element | null, edge: 'first' | 'last') {
  const items = container ? Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]')) : [];
  (edge === 'first' ? items[0] : items[items.length - 1])?.focus();
}

/* =========================================================================
 * MenuList — shared role="menu" implementation (Menu, TieredMenu, ContextMenu,
 * SplitButton and Menubar submenus)
 * ========================================================================= */

interface MenuRootContextValue {
  /** True for floating menus: Tab closes them and hover moves focus. */
  popup: boolean;
  /** Close the whole menu (after an item is chosen, or Tab). */
  close: (returnFocus: boolean) => void;
}

const MenuRootContext = createContext<MenuRootContextValue>({ popup: false, close: () => {} });

const isGroup = (item: MenuItem) => !!item.items && !item.command && !item.url;

interface MenuListProps {
  items: MenuItem[];
  /** grouped: items with children render as labelled groups. tiered: they open flyout submenus. */
  mode: 'grouped' | 'tiered';
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  autoFocus?: 'first' | 'last' | false;
  /** Rendered as a flyout inside a parent item. */
  submenu?: boolean;
  /** Roving tabindex so an inline menu is reachable with Tab. */
  roving?: boolean;
  onEscape?: () => void;
  /** Horizontal arrow that the list cannot handle itself (used to close submenus / move along a menubar). */
  onArrowOut?: (direction: 'prev' | 'next') => void;
}

function MenuList({ items, mode, id, ariaLabel, ariaLabelledBy, className, autoFocus = false, submenu = false, roving = false, onEscape, onArrowOut }: MenuListProps) {
  const ctx = useContext(MenuRootContext);
  const baseId = useId();
  const [active, setActive] = useState(-1);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const pendingFocus = useRef<'first' | 'last' | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useTypeahead();

  const nav = useMemo(() => {
    const out: MenuItem[] = [];
    for (const item of items) {
      if (item.separator) continue;
      if (mode === 'grouped' && isGroup(item)) item.items!.forEach((child) => !child.separator && out.push(child));
      else out.push(item);
    }
    return out;
  }, [items, mode]);

  const subId = (i: number) => `${baseId}-sub-${i}`;
  const itemId = (i: number) => `${baseId}-item-${i}`;

  const focusAt = (i: number) => {
    if (!nav.length) return;
    const idx = (i + nav.length) % nav.length;
    setActive(idx);
    itemRefs.current[idx]?.focus();
  };

  useEffect(() => {
    if (autoFocus) focusAt(autoFocus === 'last' ? nav.length - 1 : 0);
    // Mount-only: initial focus when a popup or submenu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (openIdx === null || !pendingFocus.current) return;
    focusEdge(document.getElementById(subId(openIdx)), pendingFocus.current);
    pendingFocus.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIdx]);

  // A flyout that would leave the viewport opens toward the other side.
  useIsoLayoutEffect(() => {
    const el = listRef.current;
    if (!submenu || !el) return;
    const r = el.getBoundingClientRect();
    const rtl = isRtl(el);
    if ((!rtl && r.right > window.innerWidth) || (rtl && r.left < 0)) el.classList.add('oc-menu--flip');
    if (r.bottom > window.innerHeight && r.height < window.innerHeight) el.classList.add('oc-menu--flip-y');
  }, [submenu]);

  const openSub = (i: number, edge?: 'first' | 'last') => {
    if (openIdx === i) {
      if (edge) focusEdge(document.getElementById(subId(i)), edge);
      return;
    }
    pendingFocus.current = edge ?? null;
    setOpenIdx(i);
  };

  const closeSub = (focusParent: boolean) => {
    const idx = openIdx;
    setOpenIdx(null);
    if (focusParent && idx !== null) itemRefs.current[idx]?.focus();
  };

  const hasSub = (item: MenuItem) => mode === 'tiered' && !!item.items?.length;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'Tab') {
      if (ctx.popup) {
        e.preventDefault();
        ctx.close(true);
      }
      return;
    }
    const i = itemRefs.current.indexOf(e.target as HTMLElement);
    if (i === -1 || i >= nav.length) return;
    const item = nav[i];
    const canOpen = hasSub(item) && !item.disabled;
    const rtl = isRtl(e.currentTarget);
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let handled = true;
    switch (e.key) {
      case 'ArrowDown':
        setOpenIdx(null);
        focusAt(i + 1);
        break;
      case 'ArrowUp':
        setOpenIdx(null);
        focusAt(i - 1);
        break;
      case 'Home':
      case 'PageUp':
        focusAt(0);
        break;
      case 'End':
      case 'PageDown':
        focusAt(nav.length - 1);
        break;
      case forward:
        if (canOpen) openSub(i, 'first');
        else onArrowOut?.('next');
        break;
      case backward:
        onArrowOut?.('prev');
        break;
      case 'Escape':
        if (onEscape) onEscape();
        else handled = false;
        break;
      case 'Enter':
      case ' ':
        if (canOpen) openSub(i, 'first');
        else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) (e.target as HTMLElement).click();
        else handled = false; // native button/link activation fires click
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const j = typeahead(e.key, nav.map((n) => n.label ?? ''), i);
          if (j >= 0) focusAt(j);
        } else handled = false;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const activate = (e: ReactMouseEvent<HTMLElement>, item: MenuItem, i: number) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    if (hasSub(item)) {
      // Keyboard clicks (detail 0) always open; pointer clicks toggle.
      if (e.detail === 0) openSub(i, 'first');
      else if (openIdx === i) setOpenIdx(null);
      else openSub(i);
      return;
    }
    item.command?.({ item, originalEvent: e });
    ctx.close(true);
  };

  let navIndex = 0;
  const renderItem = (item: MenuItem, key: string): ReactNode => {
    if (item.separator) return <li key={key} role="separator" className="oc-menu__separator" />;
    const i = navIndex++;
    const sub = hasSub(item);
    const open = sub && openIdx === i;
    const focusIndex = active === -1 ? 0 : active;
    const common = {
      ref: (el: HTMLElement | null) => {
        itemRefs.current[i] = el;
      },
      id: itemId(i),
      role: 'menuitem',
      tabIndex: roving && focusIndex === i ? 0 : -1,
      className: cx('oc-menu__link', item.danger && 'oc-menu__link--danger'),
      'aria-disabled': item.disabled || undefined,
      'aria-haspopup': sub ? ('menu' as const) : undefined,
      'aria-expanded': sub ? open : undefined,
      'aria-controls': open ? subId(i) : undefined,
      'aria-keyshortcuts': item.shortcut,
      onFocus: () => setActive(i),
      onMouseEnter: () => {
        if (!(ctx.popup || submenu || mode === 'tiered')) return;
        setActive(i);
        itemRefs.current[i]?.focus();
        if (mode === 'tiered') {
          pendingFocus.current = null;
          setOpenIdx(sub && !item.disabled ? i : null);
        }
      },
      onClick: (e: ReactMouseEvent<HTMLElement>) => activate(e, item, i),
    };
    const content = (
      <>
        {item.icon && (
          <span className="oc-menu__icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="oc-menu__label">{item.label}</span>
        {item.badge != null && <span className="oc-menu__badge">{item.badge}</span>}
        {item.shortcut && (
          <kbd className="oc-menu__shortcut" aria-hidden="true">
            {item.shortcut}
          </kbd>
        )}
        {sub && <span className="oc-menu__caret" aria-hidden="true" />}
      </>
    );
    return (
      <li key={key} role="none" className={cx('oc-menu__item', sub && 'oc-menu__item--parent')}>
        {item.url && !sub && !item.disabled ? (
          <a {...common} href={item.url} target={item.target}>
            {content}
          </a>
        ) : (
          <button type="button" {...common}>
            {content}
          </button>
        )}
        {open && (
          <MenuList
            submenu
            mode="tiered"
            items={item.items!}
            id={subId(i)}
            ariaLabelledBy={itemId(i)}
            onEscape={() => closeSub(true)}
            onArrowOut={(d) => (d === 'prev' ? closeSub(true) : onArrowOut?.('next'))}
          />
        )}
      </li>
    );
  };

  return (
    <ul
      ref={listRef}
      id={id}
      role="menu"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cx('oc-menu', submenu && 'oc-menu--sub', className)}
      onKeyDown={onKeyDown}
    >
      {items.map((item, k) => {
        const key = item.key ?? `${k}`;
        if (mode === 'grouped' && isGroup(item)) {
          const headerId = `${baseId}-group-${k}`;
          return (
            <li key={key} role="none" className="oc-menu__group">
              <span id={headerId} className="oc-menu__header">
                {item.label}
              </span>
              <ul role="group" aria-labelledby={headerId} className="oc-menu__group-list">
                {item.items!.map((child, c) => renderItem(child, child.key ?? `${k}-${c}`))}
              </ul>
            </li>
          );
        }
        return renderItem(item, key);
      })}
    </ul>
  );
}

const LANDMARKS = 'main, [role="main"], nav, [role="navigation"], header, footer, aside, [role="complementary"], [role="region"], [role="dialog"], [role="alertdialog"]';

interface MenuPopupProps {
  items: MenuItem[];
  mode: 'grouped' | 'tiered';
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  getAnchor: () => Rect | null | undefined;
  rtl: boolean;
  side?: FloatingSide;
  align?: FloatingAlign;
  offset?: number;
  autoFocus?: 'first' | 'last';
  onClose: (returnFocus: boolean) => void;
  /** Elements (e.g. the trigger) whose pointerdown should not count as "outside". */
  inside?: Array<() => Element | null | undefined>;
}

function MenuPopup({ items, mode, id, ariaLabel, ariaLabelledBy, className, getAnchor, rtl, side = 'bottom', align = 'start', offset = 4, autoFocus = 'first', onClose, inside = [] }: MenuPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFloating(true, ref, getAnchor, { side, align, offset, rtl });
  useOutsidePointer(true, [() => ref.current, ...inside], () => onClose(false));
  const ctx = useMemo(() => ({ popup: true, close: onClose }), [onClose]);
  if (typeof document === 'undefined') return null;
  // Portal into the trigger's nearest landmark (so the open menu isn't orphaned outside every landmark);
  // the popup is position: fixed, so its placement doesn't depend on the container.
  const trigger = inside.map((get) => get()).find(Boolean);
  const host = trigger?.closest(LANDMARKS) ?? document.body;
  return createPortal(
    <MenuRootContext.Provider value={ctx}>
      <div ref={ref} className={cx('oc-floating', 'oc-menu-popup', className)} dir={rtl ? 'rtl' : 'ltr'}>
        <MenuList items={items} mode={mode} id={id} ariaLabel={ariaLabel} ariaLabelledBy={ariaLabelledBy} autoFocus={autoFocus} onEscape={() => onClose(true)} />
      </div>
    </MenuRootContext.Provider>,
    host,
  );
}

/* =========================================================================
 * Menu & TieredMenu
 * ========================================================================= */

export interface MenuHandle {
  show(event: TriggerEvent): void;
  hide(): void;
  toggle(event: TriggerEvent): void;
}

export interface MenuProps {
  model: MenuItem[];
  /** Render as a floating menu opened with the ref API or the `open` prop. */
  popup?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element the popup is anchored to (otherwise the currentTarget passed to toggle/show). */
  anchorRef?: RefObject<HTMLElement>;
  side?: FloatingSide;
  align?: FloatingAlign;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

function useMenuBase(mode: 'grouped' | 'tiered', props: MenuProps, ref: ForwardedRef<MenuHandle>) {
  const { model, popup = false, open: openProp, defaultOpen = false, onOpenChange, anchorRef, side = 'bottom', align = 'start', id, className } = props;
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const autoId = useId();
  const menuId = id ?? autoId;
  const eventAnchor = useRef<HTMLElement | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const getAnchorEl = () => anchorRef?.current ?? eventAnchor.current;

  useImperativeHandle(ref, () => {
    const show = (event: TriggerEvent) => {
      if (event.currentTarget instanceof HTMLElement) eventAnchor.current = event.currentTarget;
      setOpen(true);
    };
    return {
      show,
      hide: () => setOpen(false),
      toggle: (event) => (openRef.current ? setOpen(false) : show(event)),
    };
  }, [setOpen]);

  // Reflect state on the trigger so it works as an APG menu button.
  useEffect(() => {
    const el = popup ? getAnchorEl() : null;
    if (!el) return;
    el.setAttribute('aria-haspopup', 'menu');
    el.setAttribute('aria-expanded', String(open));
    if (open) el.setAttribute('aria-controls', menuId);
    else el.removeAttribute('aria-controls');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, popup, menuId]);

  const close = useCallback(
    (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) (anchorRef?.current ?? eventAnchor.current)?.focus();
    },
    [setOpen, anchorRef],
  );

  if (!popup) {
    return (
      <MenuList
        roving
        mode={mode}
        items={model}
        id={menuId}
        ariaLabel={props['aria-label']}
        ariaLabelledBy={props['aria-labelledby']}
        className={cx('oc-menu--inline', mode === 'tiered' && 'oc-menu--tiered', className)}
      />
    );
  }
  if (!open) return null;
  const anchorEl = getAnchorEl();
  return (
    <MenuPopup
      mode={mode}
      items={model}
      id={menuId}
      ariaLabel={props['aria-label']}
      ariaLabelledBy={props['aria-labelledby']}
      className={className}
      getAnchor={() => getAnchorEl()?.getBoundingClientRect()}
      rtl={isRtl(anchorEl)}
      side={side}
      align={align}
      onClose={close}
      inside={[getAnchorEl]}
    />
  );
}

/** Menu with optional group headers and separators; inline or popup. */
export const Menu = forwardRef<MenuHandle, MenuProps>(function Menu(props, ref) {
  return useMenuBase('grouped', props, ref);
});

/** Menu whose items with children open nested flyout submenus. */
export const TieredMenu = forwardRef<MenuHandle, MenuProps>(function TieredMenu(props, ref) {
  return useMenuBase('tiered', props, ref);
});

/* =========================================================================
 * ContextMenu
 * ========================================================================= */

export interface ContextMenuHandle {
  show(event: { clientX: number; clientY: number; target: EventTarget | null }): void;
  hide(): void;
}

export interface ContextMenuProps {
  model: MenuItem[];
  /** Element that opens the menu. Without it the menu is global (whole document). */
  targetRef?: RefObject<HTMLElement>;
  onShow?: () => void;
  onHide?: () => void;
  className?: string;
  'aria-label'?: string;
}

export const ContextMenu = forwardRef<ContextMenuHandle, ContextMenuProps>(function ContextMenu(
  { model, targetRef, onShow, onHide, className, 'aria-label': ariaLabel },
  ref,
) {
  const [point, setPoint] = useState<{ x: number; y: number; rtl: boolean } | null>(null);
  const pointRef = useRef(point);
  const returnTo = useRef<HTMLElement | null>(null);
  const callbacks = useRef({ onShow, onHide });
  callbacks.current = { onShow, onHide };

  const openAt = useCallback((x: number, y: number, origin: Element | null) => {
    if (!pointRef.current) {
      const active = document.activeElement;
      returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
      callbacks.current.onShow?.();
    }
    const next = { x, y, rtl: isRtl(origin) };
    pointRef.current = next;
    setPoint(next);
  }, []);

  const close = useCallback((returnFocus: boolean) => {
    if (!pointRef.current) return;
    pointRef.current = null;
    setPoint(null);
    callbacks.current.onHide?.();
    if (returnFocus) returnTo.current?.focus();
  }, []);

  useImperativeHandle(ref, () => ({
    show: (e) => openAt(e.clientX, e.clientY, e.target instanceof Element ? e.target : null),
    hide: () => close(false),
  }));

  useEffect(() => {
    const target: HTMLElement | Document | null = targetRef ? targetRef.current : document;
    if (!target) return;
    const openAtElement = (el: Element) => {
      const r = el.getBoundingClientRect();
      openAt(isRtl(el) ? r.right : r.left, r.bottom, el);
    };
    const onContext = (event: Event) => {
      const e = event as globalThis.MouseEvent;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest('.oc-menu-popup')) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      // Keyboard-initiated contextmenu events carry no pointer position.
      if (el && (e.button === -1 || (e.clientX === 0 && e.clientY === 0))) openAtElement(el);
      else openAt(e.clientX, e.clientY, el);
    };
    const onKey = (event: Event) => {
      const e = event as KeyboardEvent;
      if ((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu') {
        e.preventDefault();
        if (e.target instanceof Element) openAtElement(e.target);
      }
    };
    target.addEventListener('contextmenu', onContext);
    target.addEventListener('keydown', onKey);
    return () => {
      target.removeEventListener('contextmenu', onContext);
      target.removeEventListener('keydown', onKey);
    };
  }, [targetRef, openAt]);

  if (!point) return null;
  return (
    <MenuPopup
      // Remount on a new position so the menu re-anchors and focus resets to the first item.
      key={`${point.x},${point.y}`}
      mode="tiered"
      items={model}
      ariaLabel={ariaLabel}
      className={cx('oc-contextmenu', className)}
      getAnchor={() => pointRect(point.x, point.y)}
      rtl={point.rtl}
      offset={0}
      onClose={close}
    />
  );
});

/* =========================================================================
 * Menubar
 * ========================================================================= */

export interface MenubarProps {
  model: MenuItem[];
  'aria-label'?: string;
  /** Content before / after the menu (logo, search, avatar…). */
  start?: ReactNode;
  end?: ReactNode;
  /** Below this viewport width (px) the bar collapses behind a toggle button. Default 960. */
  breakpoint?: number;
  toggleLabel?: string;
  className?: string;
}

export function Menubar({ model, 'aria-label': ariaLabel, start, end, breakpoint = 960, toggleLabel = 'Menu', className }: MenubarProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const collapsed = useMediaQuery(`(max-width: ${breakpoint}px)`);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const openIdxRef = useRef(openIdx);
  openIdxRef.current = openIdx;
  const pending = useRef<'first' | 'last' | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const typeahead = useTypeahead();
  const items = useMemo(() => model.filter((m) => !m.separator), [model]);
  const n = items.length;
  const subId = (i: number) => `${baseId}-sub-${i}`;
  const itemId = (i: number) => `${baseId}-item-${i}`;
  const hasSub = (item: MenuItem | undefined) => !!item?.items?.length && !item.disabled;

  useEffect(() => {
    if (!collapsed) setMobileOpen(false);
  }, [collapsed]);

  useEffect(() => {
    if (openIdx === null || !pending.current) return;
    focusEdge(document.getElementById(subId(openIdx)), pending.current);
    pending.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIdx]);

  useOutsidePointer(openIdx !== null, [() => rootRef.current], () => setOpenIdx(null));

  const focusTop = (i: number) => {
    const idx = (i + n) % n;
    setActive(idx);
    itemRefs.current[idx]?.focus();
    return idx;
  };

  const openSub = (i: number, edge?: 'first' | 'last') => {
    if (openIdx === i) {
      if (edge) focusEdge(document.getElementById(subId(i)), edge);
      return;
    }
    pending.current = edge ?? null;
    setOpenIdx(i);
  };

  /** Move along the bar; an open submenu follows focus (APG recommended: without moving focus into it). */
  const moveTop = (from: number, delta: number, keepOpen = openIdx !== null) => {
    const idx = focusTop(from + delta);
    pending.current = null;
    setOpenIdx(keepOpen && hasSub(items[idx]) ? idx : null);
  };

  const ctx = useMemo<MenuRootContextValue>(
    () => ({
      popup: false,
      close: (returnFocus) => {
        const idx = openIdxRef.current;
        setOpenIdx(null);
        if (returnFocus && idx !== null) itemRefs.current[idx]?.focus();
      },
    }),
    [],
  );

  const onKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const i = itemRefs.current.indexOf(e.target as HTMLElement);
    if (i === -1 || i >= n) return;
    const item = items[i];
    const rtl = isRtl(e.currentTarget);
    const horizontal = !collapsed;
    const next = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const prev = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    const inward = horizontal ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const outward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let handled = true;
    if (e.key === next) moveTop(i, 1);
    else if (e.key === prev) moveTop(i, -1);
    else if (e.key === 'Home') moveTop(0, 0);
    else if (e.key === 'End') moveTop(n - 1, 0);
    else if (e.key === inward || e.key === 'Enter' || e.key === ' ') {
      if (hasSub(item)) openSub(i, 'first');
      else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) (e.target as HTMLElement).click();
      else handled = false;
    } else if (horizontal && e.key === 'ArrowUp') {
      if (hasSub(item)) openSub(i, 'last');
    } else if (!horizontal && e.key === outward) {
      setOpenIdx(null);
    } else if (e.key === 'Escape') {
      if (openIdx !== null) setOpenIdx(null);
      else if (collapsed && mobileOpen) {
        setMobileOpen(false);
        toggleRef.current?.focus();
      } else handled = false;
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const j = typeahead(e.key, items.map((m) => m.label ?? ''), i);
      if (j >= 0) moveTop(j, 0);
    } else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onBlur = (e: ReactFocusEvent) => {
    if (openIdx !== null && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpenIdx(null);
  };

  return (
    <div ref={rootRef} className={cx('oc-menubar', collapsed && 'oc-menubar--collapsed', mobileOpen && 'is-open', className)} onBlur={onBlur}>
      {start && <div className="oc-menubar__start">{start}</div>}
      {collapsed && (
        <button
          ref={toggleRef}
          type="button"
          className="oc-menubar__toggle"
          aria-label={toggleLabel}
          aria-expanded={mobileOpen}
          aria-controls={listId}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className="oc-menubar__bars" aria-hidden="true" />
        </button>
      )}
      <MenuRootContext.Provider value={ctx}>
        <ul
          id={listId}
          role="menubar"
          aria-label={ariaLabel}
          aria-orientation={collapsed ? 'vertical' : 'horizontal'}
          className="oc-menubar__list"
          hidden={collapsed && !mobileOpen}
          onKeyDown={onKeyDown}
        >
          {items.map((item, i) => {
            const sub = hasSub(item);
            const open = sub && openIdx === i;
            const common = {
              ref: (el: HTMLElement | null) => {
                itemRefs.current[i] = el;
              },
              id: itemId(i),
              role: 'menuitem',
              tabIndex: active === i ? 0 : -1,
              className: cx('oc-menubar__link', item.danger && 'oc-menu__link--danger'),
              'aria-disabled': item.disabled || undefined,
              'aria-haspopup': item.items?.length ? ('menu' as const) : undefined,
              'aria-expanded': item.items?.length ? open : undefined,
              'aria-controls': open ? subId(i) : undefined,
              onFocus: () => setActive(i),
              onMouseEnter: () => {
                if (openIdx !== null && openIdx !== i) {
                  focusTop(i);
                  setOpenIdx(sub ? i : null);
                }
              },
              onClick: (e: ReactMouseEvent<HTMLElement>) => {
                if (item.disabled) {
                  e.preventDefault();
                  return;
                }
                if (sub) {
                  if (e.detail === 0) openSub(i, 'first');
                  else setOpenIdx(open ? null : i);
                  return;
                }
                item.command?.({ item, originalEvent: e });
                setOpenIdx(null);
              },
            };
            const content = (
              <>
                {item.icon && (
                  <span className="oc-menu__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="oc-menu__label">{item.label}</span>
                {item.badge != null && <span className="oc-menu__badge">{item.badge}</span>}
                {sub && <span className="oc-menubar__caret" aria-hidden="true" />}
              </>
            );
            return (
              <li key={item.key ?? i} role="none" className={cx('oc-menubar__item', open && 'is-open')}>
                {item.url && !sub && !item.disabled ? (
                  <a {...common} href={item.url} target={item.target}>
                    {content}
                  </a>
                ) : (
                  <button type="button" {...common}>
                    {content}
                  </button>
                )}
                {open && (
                  <MenuList
                    submenu
                    mode="tiered"
                    items={item.items!}
                    id={subId(i)}
                    ariaLabelledBy={itemId(i)}
                    onEscape={() => {
                      setOpenIdx(null);
                      focusTop(i);
                    }}
                    onArrowOut={(d) => {
                      if (!collapsed) moveTop(i, d === 'next' ? 1 : -1, true);
                      else if (d === 'prev') {
                        setOpenIdx(null);
                        focusTop(i);
                      }
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </MenuRootContext.Provider>
      {end && <div className="oc-menubar__end">{end}</div>}
    </div>
  );
}

/* =========================================================================
 * MegaMenu — disclosure navigation with multi-column panels
 * ========================================================================= */

export interface MegaMenuItem extends Omit<MenuItem, 'items'> {
  /** Columns; each column is a list of groups (a group's label is its header, its items are the links). */
  items?: MenuItem[][];
}

export interface MegaMenuProps {
  model: MegaMenuItem[];
  orientation?: 'horizontal' | 'vertical';
  'aria-label'?: string;
  className?: string;
}

export function MegaMenu({ model, orientation = 'horizontal', 'aria-label': ariaLabel = 'Main', className }: MegaMenuProps) {
  const baseId = useId();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const pendingFocus = useRef(false);
  const rootRef = useRef<HTMLElement>(null);
  const topRefs = useRef<Array<HTMLElement | null>>([]);
  const panelId = (i: number) => `${baseId}-panel-${i}`;
  const horizontal = orientation === 'horizontal';

  useOutsidePointer(openIdx !== null, [() => rootRef.current], () => setOpenIdx(null));

  const panelLinks = (i: number) =>
    Array.from(document.getElementById(panelId(i))?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);

  useEffect(() => {
    if (openIdx === null || !pendingFocus.current) return;
    pendingFocus.current = false;
    panelLinks(openIdx)[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIdx]);

  const focusTop = (i: number) => {
    const n = model.length;
    topRefs.current[(i + n) % n]?.focus();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    const rtl = isRtl(e.currentTarget);
    const top = topRefs.current.indexOf(target);
    let handled = true;
    if (top >= 0) {
      const next = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
      const prev = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
      const inward = horizontal ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
      if (e.key === next) focusTop(top + 1);
      else if (e.key === prev) focusTop(top - 1);
      else if (e.key === 'Home') focusTop(0);
      else if (e.key === 'End') focusTop(model.length - 1);
      else if (e.key === inward && model[top].items?.length) {
        if (openIdx === top) panelLinks(top)[0]?.focus();
        else {
          pendingFocus.current = true;
          setOpenIdx(top);
        }
      } else if (e.key === 'Escape' && openIdx !== null) setOpenIdx(null);
      else handled = false;
    } else {
      const panel = target.closest<HTMLElement>('.oc-megamenu__panel');
      if (!panel) return;
      const idx = Number(panel.dataset.index);
      const links = panelLinks(idx);
      const j = links.indexOf(target);
      if (e.key === 'ArrowDown') links[Math.min(j + 1, links.length - 1)]?.focus();
      else if (e.key === 'ArrowUp') (j <= 0 ? topRefs.current[idx] : links[j - 1])?.focus();
      else if (e.key === 'Home') links[0]?.focus();
      else if (e.key === 'End') links[links.length - 1]?.focus();
      else if (e.key === 'Escape') {
        setOpenIdx(null);
        topRefs.current[idx]?.focus();
      } else handled = false;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onBlur = (e: ReactFocusEvent) => {
    if (openIdx !== null && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpenIdx(null);
  };

  const runLink = (item: MenuItem) => (e: ReactMouseEvent<HTMLElement>) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    item.command?.({ item, originalEvent: e });
    setOpenIdx(null);
  };

  const renderLink = (item: MenuItem, className: string, ref?: (el: HTMLElement | null) => void) => {
    const content = (
      <>
        {item.icon && (
          <span className="oc-menu__icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="oc-menu__label">{item.label}</span>
        {item.badge != null && <span className="oc-menu__badge">{item.badge}</span>}
      </>
    );
    return item.url && !item.disabled ? (
      <a ref={ref} className={className} href={item.url} target={item.target} onClick={runLink(item)}>
        {content}
      </a>
    ) : (
      <button ref={ref} type="button" className={className} disabled={item.disabled} onClick={runLink(item)}>
        {content}
      </button>
    );
  };

  return (
    <nav ref={rootRef} aria-label={ariaLabel} className={cx('oc-megamenu', `oc-megamenu--${orientation}`, className)} onKeyDown={onKeyDown} onBlur={onBlur}>
      <ul className="oc-megamenu__root">
        {model.map((item, i) => {
          const setRef = (el: HTMLElement | null) => {
            topRefs.current[i] = el;
          };
          if (!item.items?.length) {
            return (
              <li key={item.key ?? i} className="oc-megamenu__item">
                {renderLink(item as MenuItem, 'oc-megamenu__top', setRef)}
              </li>
            );
          }
          const open = openIdx === i;
          return (
            <li key={item.key ?? i} className={cx('oc-megamenu__item', open && 'is-open')}>
              <button
                ref={setRef}
                type="button"
                className="oc-megamenu__top"
                aria-expanded={open}
                aria-controls={panelId(i)}
                disabled={item.disabled}
                onClick={() => setOpenIdx(open ? null : i)}
              >
                {item.icon && (
                  <span className="oc-menu__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="oc-menu__label">{item.label}</span>
                <span className="oc-menubar__caret" aria-hidden="true" />
              </button>
              <div id={panelId(i)} className="oc-megamenu__panel" data-index={i} hidden={!open}>
                {item.items.map((column, c) => (
                  <div key={c} className="oc-megamenu__column">
                    {column.map((group, g) => {
                      const headerId = `${baseId}-h-${i}-${c}-${g}`;
                      return (
                        <div key={group.key ?? g} className="oc-megamenu__group">
                          {group.label && (
                            <div id={headerId} className="oc-megamenu__header">
                              {group.label}
                            </div>
                          )}
                          <ul className="oc-megamenu__list" aria-labelledby={group.label ? headerId : undefined}>
                            {(group.items ?? []).map((link, l) => (
                              <li key={link.key ?? l}>{renderLink(link, 'oc-megamenu__link')}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* =========================================================================
 * PanelMenu — accordion of disclosure sections with nested disclosure trees
 * ========================================================================= */

export interface PanelMenuProps {
  model: MenuItem[];
  /** Allow more than one top-level panel open. */
  multiple?: boolean;
  /** Keys (item.key, or the index path such as "0-2") expanded initially. */
  defaultExpandedKeys?: string[];
  'aria-label'?: string;
  className?: string;
}

export function PanelMenu({ model, multiple = false, defaultExpandedKeys = [], 'aria-label': ariaLabel, className }: PanelMenuProps) {
  const baseId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpandedKeys));
  const keyOf = (item: MenuItem, path: string) => item.key ?? path;
  const rootKeys = model.map((m, i) => keyOf(m, String(i)));
  const domId = (path: string) => `${baseId}-${path}`;

  const toggle = (key: string, isRoot: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else {
        if (isRoot && !multiple) rootKeys.forEach((k) => next.delete(k));
        next.add(key);
      }
      return next;
    });

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-pm-item]')).filter((el) => !el.closest('[hidden]') && !(el as HTMLButtonElement).disabled);
    const target = e.target as HTMLElement;
    const i = items.indexOf(target);
    if (i === -1) return;
    const rtl = isRtl(root);
    const expandKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    const isExpanded = target.getAttribute('aria-expanded');
    let handled = true;
    if (e.key === 'ArrowDown') items[Math.min(i + 1, items.length - 1)].focus();
    else if (e.key === 'ArrowUp') items[Math.max(i - 1, 0)].focus();
    else if (e.key === 'Home') items[0].focus();
    else if (e.key === 'End') items[items.length - 1].focus();
    else if (e.key === expandKey && isExpanded === 'false') target.click();
    else if (e.key === collapseKey) {
      if (isExpanded === 'true') target.click();
      else {
        const group = target.closest<HTMLElement>('[data-pm-group]');
        group && root.querySelector<HTMLElement>(`[aria-controls="${group.id}"]`)?.focus();
      }
    } else handled = false;
    if (handled) e.preventDefault();
  };

  const runLeaf = (item: MenuItem) => (e: ReactMouseEvent<HTMLElement>) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    item.command?.({ item, originalEvent: e });
  };

  const label = (item: MenuItem, caret: boolean) => (
    <>
      {item.icon && (
        <span className="oc-menu__icon" aria-hidden="true">
          {item.icon}
        </span>
      )}
      <span className="oc-menu__label">{item.label}</span>
      {item.badge != null && <span className="oc-menu__badge">{item.badge}</span>}
      {caret && <span className="oc-panelmenu__caret" aria-hidden="true" />}
    </>
  );

  const leaf = (item: MenuItem, className: string) =>
    item.url && !item.disabled ? (
      <a data-pm-item className={className} href={item.url} target={item.target} onClick={runLeaf(item)}>
        {label(item, false)}
      </a>
    ) : (
      <button data-pm-item type="button" className={className} disabled={item.disabled} onClick={runLeaf(item)}>
        {label(item, false)}
      </button>
    );

  const renderList = (items: MenuItem[], parentPath: string): ReactNode => (
    <ul className="oc-panelmenu__list">
      {items.map((item, i) => {
        if (item.separator) return <li key={i} role="separator" className="oc-menu__separator" />;
        const path = `${parentPath}-${i}`;
        const key = keyOf(item, path);
        if (!item.items?.length) return <li key={key}>{leaf(item, 'oc-panelmenu__link')}</li>;
        const open = expanded.has(key);
        const subId = domId(`${path}-list`);
        return (
          <li key={key}>
            <button data-pm-item type="button" className="oc-panelmenu__link" aria-expanded={open} aria-controls={subId} disabled={item.disabled} onClick={() => toggle(key, false)}>
              {label(item, true)}
            </button>
            <div id={subId} data-pm-group="" hidden={!open}>
              {renderList(item.items, path)}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav ref={rootRef} aria-label={ariaLabel} className={cx('oc-panelmenu', className)} onKeyDown={onKeyDown}>
      {model.map((item, i) => {
        const key = rootKeys[i];
        if (!item.items?.length) {
          return (
            <div key={key} className="oc-panelmenu__panel">
              {leaf(item, 'oc-panelmenu__header')}
            </div>
          );
        }
        const open = expanded.has(key);
        const headerId = domId(`${i}-header`);
        const contentId = domId(`${i}-content`);
        return (
          <div key={key} className={cx('oc-panelmenu__panel', open && 'is-open')}>
            <button
              data-pm-item
              id={headerId}
              type="button"
              className="oc-panelmenu__header"
              aria-expanded={open}
              aria-controls={contentId}
              disabled={item.disabled}
              onClick={() => toggle(key, true)}
            >
              {label(item, true)}
            </button>
            <div id={contentId} role="region" aria-labelledby={headerId} data-pm-group="" className="oc-panelmenu__content" hidden={!open}>
              {renderList(item.items, String(i))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/* =========================================================================
 * Dock
 * ========================================================================= */

export interface DockProps {
  /** Items need `label` (used as the accessible name and tooltip) and `icon`. */
  model: MenuItem[];
  position?: 'bottom' | 'top' | 'start' | 'end';
  /** Enlarge the hovered/focused icon and its neighbours. Ignored under prefers-reduced-motion. */
  magnification?: boolean;
  'aria-label'?: string;
  className?: string;
}

export function Dock({ model, position = 'bottom', magnification = true, 'aria-label': ariaLabel = 'Dock', className }: DockProps) {
  return (
    <nav aria-label={ariaLabel} className={cx('oc-dock', `oc-dock--${position}`, magnification && 'oc-dock--magnify', className)}>
      <ul className="oc-dock__list">
        {model
          .filter((item) => !item.separator)
          .map((item, i) => {
            const inner = (
              <>
                <span className="oc-dock__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="oc-dock__tooltip" aria-hidden="true">
                  {item.label}
                </span>
              </>
            );
            const onClick = (e: ReactMouseEvent<HTMLElement>) => {
              if (item.disabled) {
                e.preventDefault();
                return;
              }
              item.command?.({ item, originalEvent: e });
            };
            return (
              <li key={item.key ?? i} className="oc-dock__item">
                {item.url && !item.disabled ? (
                  <a className="oc-dock__action" href={item.url} target={item.target} aria-label={item.label} onClick={onClick}>
                    {inner}
                  </a>
                ) : (
                  <button type="button" className="oc-dock__action" aria-label={item.label} disabled={item.disabled} onClick={onClick}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
      </ul>
    </nav>
  );
}

/* =========================================================================
 * SplitButton
 * ========================================================================= */

export interface SplitButtonProps {
  label: ReactNode;
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  /** Secondary actions shown in the dropdown menu. */
  model: MenuItem[];
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Accessible name of the dropdown button. */
  menuButtonLabel?: string;
  className?: string;
}

export function SplitButton({ label, onClick, model, icon, variant = 'primary', size = 'md', disabled, menuButtonLabel = 'More actions', className }: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const [edge, setEdge] = useState<'first' | 'last'>('first');
  const groupRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const menuId = `${baseId}-menu`;
  const toggleId = `${baseId}-toggle`;

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  return (
    <div ref={groupRef} className={cx('oc-splitbutton', className)}>
      <Button variant={variant} size={size} disabled={disabled} onClick={onClick} className="oc-splitbutton__main">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </Button>
      <Button
        ref={toggleRef}
        id={toggleId}
        variant={variant}
        size={size}
        iconOnly
        disabled={disabled}
        aria-label={menuButtonLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="oc-splitbutton__toggle"
        onClick={() => {
          setEdge('first');
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setEdge(e.key === 'ArrowUp' ? 'last' : 'first');
            setOpen(true);
          }
        }}
      >
        <span className="oc-splitbutton__caret" aria-hidden="true" />
      </Button>
      {open && (
        <MenuPopup
          mode="tiered"
          items={model}
          id={menuId}
          ariaLabelledBy={toggleId}
          getAnchor={() => groupRef.current?.getBoundingClientRect()}
          rtl={isRtl(groupRef.current)}
          align="end"
          autoFocus={edge}
          onClose={close}
          inside={[() => toggleRef.current]}
        />
      )}
    </div>
  );
}

/* =========================================================================
 * SpeedDial
 * ========================================================================= */

export type SpeedDialDirection = 'up' | 'down' | 'start' | 'end' | 'up-start' | 'up-end' | 'down-start' | 'down-end';

export interface SpeedDialProps {
  /** Actions; each needs a `label` (accessible name) and usually an `icon`. */
  model: MenuItem[];
  direction?: SpeedDialDirection;
  type?: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle';
  /** Distance of radial actions from the button centre, px. */
  radius?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name of the trigger and the action menu. */
  'aria-label'?: string;
  showIcon?: ReactNode;
  hideIcon?: ReactNode;
  hideOnClickOutside?: boolean;
  disabled?: boolean;
  className?: string;
}

const DIRECTION_ANGLE: Record<SpeedDialDirection, number> = {
  up: -90,
  down: 90,
  start: 180,
  end: 0,
  'up-start': -135,
  'up-end': -45,
  'down-start': 135,
  'down-end': 45,
};

export function SpeedDial({
  model,
  direction = 'up',
  type = 'linear',
  radius = 80,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  'aria-label': ariaLabel = 'Actions',
  showIcon,
  hideIcon,
  hideOnClickOutside = true,
  disabled,
  className,
}: SpeedDialProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [rtl, setRtl] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingFocus = useRef<'first' | 'last' | null>(null);
  const listId = useId();
  const actions = model.filter((m) => !m.separator);
  const n = actions.length;

  useIsoLayoutEffect(() => setRtl(isRtl(rootRef.current)), [open]);
  useInert(listRef, !open);
  useOutsidePointer(open && hideOnClickOutside, [() => rootRef.current], () => setOpen(false));

  const focusItem = (i: number) => itemRefs.current[(i + n) % n]?.focus();

  useEffect(() => {
    if (!open || !pendingFocus.current) return;
    focusItem(pendingFocus.current === 'first' ? 0 : n - 1);
    pendingFocus.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  // Outward arrow key moves to the next action (e.g. ArrowUp for an upward dial).
  const invert = type === 'linear' && (direction === 'up' || (direction === 'start' && !rtl) || (direction === 'end' && rtl));
  const nextKeys = invert ? ['ArrowUp', 'ArrowLeft'] : ['ArrowDown', 'ArrowRight'];
  const prevKeys = invert ? ['ArrowDown', 'ArrowRight'] : ['ArrowUp', 'ArrowLeft'];

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const isNext = nextKeys.includes(e.key);
    if (!isNext && !prevKeys.includes(e.key)) {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close(true);
      }
      return;
    }
    e.preventDefault();
    if (open) focusItem(isNext ? 0 : n - 1);
    else {
      pendingFocus.current = isNext ? 'first' : 'last';
      setOpen(true);
    }
  };

  const onListKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const i = itemRefs.current.indexOf(e.target as HTMLElement);
    if (i === -1) return;
    let handled = true;
    if (nextKeys.includes(e.key)) focusItem(i + 1);
    else if (prevKeys.includes(e.key)) focusItem(i - 1);
    else if (e.key === 'Home') focusItem(0);
    else if (e.key === 'End') focusItem(n - 1);
    else if (e.key === 'Escape') close(true);
    else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const radialStyle = (i: number): CSSProperties | undefined => {
    if (type === 'linear') return undefined;
    let center = DIRECTION_ANGLE[direction];
    if (rtl) center = 180 - center; // mirror start/end
    const span = type === 'circle' ? 360 : type === 'semi-circle' ? 180 : 90;
    const angle = type === 'circle' ? -90 + (360 * i) / Math.max(n, 1) : center - span / 2 + (span * i) / Math.max(n - 1, 1);
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(radius * Math.cos(rad));
    const y = Math.round(radius * Math.sin(rad));
    return { transform: open ? `translate(${x}px, ${y}px)` : undefined, transitionDelay: open ? `${i * 30}ms` : undefined };
  };

  const onBlur = (e: ReactFocusEvent) => {
    if (open && !rootRef.current?.contains(e.relatedTarget as Node | null) && e.relatedTarget) setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={cx('oc-speeddial', `oc-speeddial--${direction}`, type === 'linear' ? 'oc-speeddial--linear' : 'oc-speeddial--radial', open && 'is-open', className)}
      onBlur={onBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        className="oc-speeddial__button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={(e) => {
          if (!open && e.detail === 0) pendingFocus.current = 'first';
          setOpen(!open);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        {open ? (hideIcon ?? showIcon ?? <span className="oc-speeddial__plus" aria-hidden="true" />) : (showIcon ?? <span className="oc-speeddial__plus" aria-hidden="true" />)}
      </button>
      <ul ref={listRef} id={listId} role="menu" aria-label={ariaLabel} className="oc-speeddial__list" onKeyDown={onListKeyDown}>
        {actions.map((item, i) => {
          const onClick = (e: ReactMouseEvent<HTMLElement>) => {
            if (item.disabled) {
              e.preventDefault();
              return;
            }
            item.command?.({ item, originalEvent: e });
            close(true);
          };
          const props = {
            ref: (el: HTMLElement | null) => {
              itemRefs.current[i] = el;
            },
            role: 'menuitem',
            tabIndex: -1,
            className: 'oc-speeddial__action',
            'aria-label': item.label,
            'aria-disabled': item.disabled || undefined,
            onClick,
          };
          const inner = (
            <>
              <span aria-hidden="true">{item.icon}</span>
              <span className="oc-speeddial__tooltip" aria-hidden="true">
                {item.label}
              </span>
            </>
          );
          return (
            <li key={item.key ?? i} role="none" className="oc-speeddial__item" style={radialStyle(i)}>
              {item.url && !item.disabled ? (
                <a {...props} href={item.url} target={item.target}>
                  {inner}
                </a>
              ) : (
                <button type="button" {...props}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================================================
 * Popover (PrimeNG OverlayPanel)
 * ========================================================================= */

export interface PopoverHandle {
  show(event: TriggerEvent): void;
  hide(): void;
  toggle(event: TriggerEvent): void;
}

export interface PopoverProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger element; receives onClick, aria-expanded, aria-controls and aria-haspopup. */
  trigger?: ReactElement<{ onClick?: (event: ReactMouseEvent<HTMLElement>) => void }>;
  /** Anchor used with the controlled `open` prop. */
  anchorRef?: RefObject<HTMLElement>;
  /** "dialog" for interactive content (default); "group" for purely informational content. */
  role?: 'dialog' | 'group';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Close on pointerdown outside. Default true. */
  dismissable?: boolean;
  showCloseIcon?: boolean;
  closeLabel?: string;
  side?: 'top' | 'bottom';
  align?: FloatingAlign;
  id?: string;
  className?: string;
}

export const Popover = forwardRef<PopoverHandle, PopoverProps>(function Popover(
  {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    trigger,
    anchorRef,
    role = 'dialog',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    dismissable = true,
    showCloseIcon = false,
    closeLabel = 'Close',
    side = 'bottom',
    align = 'center',
    id,
    className,
  },
  ref,
) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const autoId = useId();
  const panelId = id ?? autoId;
  const eventAnchor = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const restore = useRef(true);
  const openRef = useRef(open);
  openRef.current = open;
  const getAnchor = () => anchorRef?.current ?? eventAnchor.current;

  const close = (returnFocus = true) => {
    restore.current = returnFocus;
    setOpen(false);
  };
  const show = (event: TriggerEvent) => {
    if (event.currentTarget instanceof HTMLElement) eventAnchor.current = event.currentTarget;
    restore.current = true;
    setOpen(true);
  };

  useImperativeHandle(ref, () => ({
    show,
    hide: () => close(panelRef.current?.contains(document.activeElement) ?? false),
    toggle: (e) => (openRef.current ? close() : show(e)),
  }));

  useFloating(open, panelRef, () => getAnchor()?.getBoundingClientRect(), {
    side,
    align,
    offset: 10,
    rtl: isRtl(getAnchor()),
    onPosition: (pos, anchor, el) => placeArrow(arrowRef.current, pos, anchor, el),
  });
  useOutsidePointer(open && dismissable, [() => panelRef.current, getAnchor], () => close(false));
  useFocusScope(open, panelRef, { restoreFocus: () => restore.current, restoreTo: getAnchor });

  const triggerEl =
    trigger && isValidElement(trigger)
      ? cloneElement(trigger, {
          onClick: (e: ReactMouseEvent<HTMLElement>) => {
            trigger.props.onClick?.(e);
            if (openRef.current) close();
            else show(e);
          },
          'aria-haspopup': role === 'dialog' ? 'dialog' : undefined,
          'aria-expanded': open,
          'aria-controls': open ? panelId : undefined,
        } as Partial<typeof trigger.props>)
      : null;

  return (
    <>
      {triggerEl}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role={role}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            tabIndex={-1}
            dir={isRtl(getAnchor()) ? 'rtl' : 'ltr'}
            className={cx('oc-floating', 'oc-popover', className)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                close();
              }
            }}
          >
            <span ref={arrowRef} className="oc-popover__arrow" aria-hidden="true" />
            <div className="oc-popover__content">{children}</div>
            {showCloseIcon && (
              <button type="button" className="oc-close oc-popover__close" aria-label={closeLabel} onClick={() => close()}>
                ×
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
});

/* =========================================================================
 * ConfirmDialog, ConfirmPopup and useConfirm
 * ========================================================================= */

export type ConfirmSeverity = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  header?: ReactNode;
  message: ReactNode;
  icon?: ReactNode;
  acceptLabel?: string;
  rejectLabel?: string;
  severity?: ConfirmSeverity;
  /** Button focused when opened. Default "reject" (the safe choice). */
  defaultFocus?: 'accept' | 'reject';
  onAccept?: () => void;
  onReject?: () => void;
  /** When set, confirm() shows an anchored ConfirmPopup instead of a modal dialog. */
  target?: HTMLElement | null;
}

export interface ConfirmDialogProps extends Omit<ConfirmOptions, 'target'> {
  open: boolean;
  className?: string;
}

function ConfirmActions({ acceptLabel, rejectLabel, severity, onAccept, onReject, acceptRef, rejectRef, size }: Pick<ConfirmOptions, 'severity' | 'onAccept' | 'onReject'> & {
  acceptLabel: string;
  rejectLabel: string;
  acceptRef: RefObject<HTMLButtonElement>;
  rejectRef: RefObject<HTMLButtonElement>;
  size?: ButtonSize;
}) {
  return (
    <>
      <Button ref={rejectRef} variant="secondary" size={size} onClick={onReject}>
        {rejectLabel}
      </Button>
      <Button ref={acceptRef} variant={severity === 'danger' ? 'danger' : 'primary'} size={size} onClick={onAccept}>
        {acceptLabel}
      </Button>
    </>
  );
}

/** Modal confirmation (role="alertdialog"). Escape rejects; focus starts on the reject button by default. */
export function ConfirmDialog({
  open,
  header = 'Confirmation',
  message,
  icon,
  acceptLabel = 'Yes',
  rejectLabel = 'No',
  severity,
  defaultFocus = 'reject',
  onAccept,
  onReject,
  className,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();
  useFocusScope(open, panelRef, {
    trap: true,
    lock: true,
    initialFocus: () => (defaultFocus === 'accept' ? acceptRef : rejectRef).current,
  });
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="oc-overlay">
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className={cx('oc-dialog', 'oc-dialog--sm', 'oc-confirm', severity && `oc-confirm--${severity}`, className)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onReject?.();
          }
        }}
      >
        <div className="oc-dialog__header">
          <h2 id={titleId} className="oc-dialog__title">
            {header}
          </h2>
        </div>
        <div className="oc-dialog__body oc-confirm__body">
          {icon && (
            <span className="oc-confirm__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <div id={messageId} className="oc-confirm__message">
            {message}
          </div>
        </div>
        <div className="oc-dialog__footer">
          <ConfirmActions acceptLabel={acceptLabel} rejectLabel={rejectLabel} severity={severity} onAccept={onAccept} onReject={onReject} acceptRef={acceptRef} rejectRef={rejectRef} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmPopupProps extends ConfirmDialogProps {
  /** Element the popup points at; focus returns here on close. */
  target: HTMLElement | null;
}

/** Small confirmation anchored to its target. Escape or outside click rejects. */
export function ConfirmPopup({
  open,
  target,
  header,
  message,
  icon,
  acceptLabel = 'Yes',
  rejectLabel = 'No',
  severity,
  defaultFocus = 'reject',
  onAccept,
  onReject,
  className,
}: ConfirmPopupProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);
  const restore = useRef(true);
  const titleId = useId();
  const messageId = useId();
  useIsoLayoutEffect(() => {
    if (open) restore.current = true;
  }, [open]);
  useFloating(open, panelRef, () => target?.getBoundingClientRect(), {
    side: 'bottom',
    align: 'start',
    offset: 10,
    rtl: isRtl(target),
    onPosition: (pos, anchor, el) => placeArrow(arrowRef.current, pos, anchor, el),
  });
  useOutsidePointer(open, [() => panelRef.current, () => target], () => {
    restore.current = false;
    onReject?.();
  });
  useFocusScope(open, panelRef, {
    trap: true,
    initialFocus: () => (defaultFocus === 'accept' ? acceptRef : rejectRef).current,
    restoreFocus: () => restore.current,
    restoreTo: () => target,
  });
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={panelRef}
      role="alertdialog"
      aria-modal="false"
      aria-labelledby={header ? titleId : undefined}
      aria-describedby={messageId}
      aria-label={header ? undefined : 'Confirmation'}
      tabIndex={-1}
      dir={isRtl(target) ? 'rtl' : 'ltr'}
      className={cx('oc-floating', 'oc-popover', 'oc-confirm-popup', severity && `oc-confirm--${severity}`, className)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onReject?.();
        }
      }}
    >
      <span ref={arrowRef} className="oc-popover__arrow" aria-hidden="true" />
      <div className="oc-popover__content">
        {header && (
          <div id={titleId} className="oc-confirm-popup__header">
            {header}
          </div>
        )}
        <div className="oc-confirm__body">
          {icon && (
            <span className="oc-confirm__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <div id={messageId} className="oc-confirm__message">
            {message}
          </div>
        </div>
        <div className="oc-confirm-popup__footer">
          <ConfirmActions size="sm" acceptLabel={acceptLabel} rejectLabel={rejectLabel} severity={severity} onAccept={onAccept} onReject={onReject} acceptRef={acceptRef} rejectRef={rejectRef} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmApi {
  /** Shows a confirmation; resolves true when accepted, false when rejected or dismissed. */
  confirm(options: ConfirmOptions): Promise<boolean>;
  /** Dismiss the current confirmation (counts as reject). */
  close(): void;
}

const ConfirmContext = createContext<ConfirmApi | null>(null);

interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (accepted: boolean) => void;
}

/** Hosts the ConfirmDialog / ConfirmPopup used by useConfirm(). */
export function ConfirmProvider({ children }: { children?: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const current = useRef<ConfirmRequest | null>(null);
  const nextId = useRef(1);

  const settle = useCallback((accepted: boolean) => {
    const req = current.current;
    if (!req) return;
    current.current = null;
    setRequest(null);
    (accepted ? req.onAccept : req.onReject)?.();
    req.resolve(accepted);
  }, []);

  const api = useMemo<ConfirmApi>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          settle(false);
          const req = { ...options, id: nextId.current++, resolve };
          current.current = req;
          setRequest(req);
        }),
      close: () => settle(false),
    }),
    [settle],
  );

  let ui: ReactNode = null;
  if (request) {
    const { id, resolve: _resolve, target, onAccept: _a, onReject: _r, ...rest } = request;
    const handlers = { onAccept: () => settle(true), onReject: () => settle(false) };
    ui = target ? <ConfirmPopup key={id} open target={target} {...rest} {...handlers} /> : <ConfirmDialog key={id} open {...rest} {...handlers} />;
  }

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      {ui}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmApi {
  const api = useContext(ConfirmContext);
  if (!api) throw new Error('useConfirm() must be used inside <ConfirmProvider>.');
  return api;
}

/* =========================================================================
 * DynamicDialog — DialogProvider + useDialog().open(Component, options)
 * ========================================================================= */

export interface DynamicDialogRef<R = unknown> {
  id: number;
  close(result?: R): void;
  /** Resolves with the value passed to close(), or undefined when dismissed. */
  result: Promise<R | undefined>;
}

export interface DynamicDialogContentProps<D = unknown, R = unknown> {
  data: D;
  dialogRef: DynamicDialogRef<R>;
}

export interface DialogOpenOptions<D = unknown> {
  header: ReactNode;
  data?: D;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Show the close button / allow Escape. Default true. */
  closable?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

export interface DialogApi {
  open<D = unknown, R = unknown>(component: ComponentType<DynamicDialogContentProps<D, R>>, options: DialogOpenOptions<D>): DynamicDialogRef<R>;
  closeAll(): void;
}

interface DynamicEntry {
  ref: DynamicDialogRef<unknown>;
  Component: ComponentType<DynamicDialogContentProps<unknown, unknown>>;
  options: DialogOpenOptions<unknown>;
}

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children?: ReactNode }) {
  const [entries, setEntries] = useState<DynamicEntry[]>([]);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const nextId = useRef(1);

  const api = useMemo<DialogApi>(
    () => ({
      open<D, R>(component: ComponentType<DynamicDialogContentProps<D, R>>, options: DialogOpenOptions<D>) {
        const id = nextId.current++;
        let resolve!: (value: R | undefined) => void;
        const result = new Promise<R | undefined>((r) => (resolve = r));
        let closed = false;
        const ref: DynamicDialogRef<R> = {
          id,
          result,
          close(value?: R) {
            if (closed) return;
            closed = true;
            setEntries((list) => list.filter((e) => e.ref.id !== id));
            resolve(value);
          },
        };
        const entry = { ref, Component: component, options } as unknown as DynamicEntry;
        setEntries((list) => [...list, entry]);
        return ref;
      },
      closeAll() {
        [...entriesRef.current].reverse().forEach((e) => e.ref.close());
      },
    }),
    [],
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {entries.map(({ ref, Component, options }, i) => {
        // Only the top-most dialog reacts to Escape / close so stacked dialogs close one at a time.
        const top = i === entries.length - 1;
        return (
          <Dialog
            key={ref.id}
            open
            title={options.header}
            size={options.size}
            footer={options.footer}
            closeOnBackdrop={options.closeOnBackdrop}
            className={options.className}
            onClose={top && options.closable !== false ? () => ref.close() : undefined}
          >
            <Component data={options.data} dialogRef={ref} />
          </Dialog>
        );
      })}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const api = useContext(DialogContext);
  if (!api) throw new Error('useDialog() must be used inside <DialogProvider>.');
  return api;
}

/* =========================================================================
 * BlockUI
 * ========================================================================= */

export interface BlockUIProps {
  blocked: boolean;
  /** Block the whole document instead of the wrapped region. */
  fullScreen?: boolean;
  /** Announced and shown while blocked. Default "Loading". */
  label?: string;
  spinner?: boolean;
  /** Custom mask content (replaces spinner + label visually; label is still announced). */
  template?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function BlockUI({ blocked, fullScreen = false, label = 'Loading', spinner = true, template, children, className }: BlockUIProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!blocked) return;
    const targets = fullScreen
      ? Array.from(document.body.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el !== maskRef.current && !el.hasAttribute('inert'))
      : contentRef.current
        ? [contentRef.current]
        : [];
    const active = document.activeElement;
    const hadFocus = active instanceof HTMLElement && targets.some((t) => t.contains(active));
    targets.forEach((el) => {
      el.setAttribute('inert', '');
      el.setAttribute('aria-busy', 'true');
    });
    if (hadFocus) (active as HTMLElement).blur();
    return () => {
      targets.forEach((el) => {
        el.removeAttribute('inert');
        el.removeAttribute('aria-busy');
      });
      // Give focus back to where the user was if nothing else took it meanwhile.
      if (hadFocus && (document.activeElement === document.body || !document.activeElement) && active.isConnected) active.focus();
    };
  }, [blocked, fullScreen]);

  const mask = blocked ? (
    <div ref={maskRef} role="status" className={cx('oc-blockui__mask', fullScreen && 'oc-blockui__mask--full')}>
      {template ?? (
        <div className="oc-blockui__card">
          {spinner && <span className="oc-spinner oc-spinner--lg" aria-hidden="true" />}
          {label && <span className="oc-blockui__label">{label}</span>}
        </div>
      )}
      {template && <span className="oc-sr-only">{label}</span>}
    </div>
  ) : null;

  if (fullScreen) {
    return (
      <>
        {children}
        {mask && typeof document !== 'undefined' && createPortal(mask, document.body)}
      </>
    );
  }
  return (
    <div className={cx('oc-blockui', className)}>
      <div ref={contentRef} className="oc-blockui__content" aria-busy={blocked || undefined}>
        {children}
      </div>
      {mask}
    </div>
  );
}

/* =========================================================================
 * ScrollTop
 * ========================================================================= */

export interface ScrollTopProps {
  /** "window" (default) or a scrollable element; for an element, render ScrollTop inside it. */
  target?: 'window' | RefObject<HTMLElement>;
  /** Scroll distance (px) after which the button appears. */
  threshold?: number;
  label?: string;
  icon?: ReactNode;
  behavior?: ScrollBehavior;
  className?: string;
}

export function ScrollTop({ target = 'window', threshold = 400, label = 'Scroll to top', icon, behavior = 'smooth', className }: ScrollTopProps) {
  const [visible, setVisible] = useState(false);
  const getScroller = (): HTMLElement | Window | null => (target === 'window' ? (typeof window !== 'undefined' ? window : null) : target.current);

  useEffect(() => {
    const scroller = getScroller();
    if (!scroller) return;
    const read = () => (scroller instanceof Window ? window.scrollY || document.documentElement.scrollTop : scroller.scrollTop);
    const onScroll = () => setVisible(read() > threshold);
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, threshold]);

  if (!visible) return null;
  return (
    <button
      type="button"
      className={cx('oc-scrolltop', target !== 'window' && 'oc-scrolltop--sticky', className)}
      aria-label={label}
      onClick={() => getScroller()?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : behavior })}
    >
      {icon ?? <span className="oc-scrolltop__icon" aria-hidden="true" />}
    </button>
  );
}

/* =========================================================================
 * Inplace
 * ========================================================================= */

export interface InplaceProps {
  /** Shown while inactive, inside the activating button. */
  display: ReactNode;
  /** Editor content; a function receives `close`. */
  children: ReactNode | ((close: () => void) => ReactNode);
  active?: boolean;
  defaultActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  closable?: boolean;
  closeLabel?: string;
  disabled?: boolean;
  /** Accessible name for the display button when `display` is not descriptive text. */
  'aria-label'?: string;
  className?: string;
}

export function Inplace({
  display,
  children,
  active: activeProp,
  defaultActive = false,
  onActiveChange,
  closable = false,
  closeLabel = 'Close',
  disabled,
  'aria-label': ariaLabel,
  className,
}: InplaceProps) {
  const [active, setActive] = useControllable(activeProp, defaultActive, onActiveChange);
  const displayRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current) {
      const content = contentRef.current;
      if (content) (getFocusable(content)[0] ?? content).focus();
    } else if (!active && wasActive.current && (!document.activeElement || document.activeElement === document.body)) {
      displayRef.current?.focus();
    }
    wasActive.current = active;
  }, [active]);

  const close = () => setActive(false);

  return (
    <div className={cx('oc-inplace', active && 'is-active', className)}>
      {active ? (
        <div
          ref={contentRef}
          className="oc-inplace__content"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              close();
            }
          }}
        >
          {typeof children === 'function' ? children(close) : children}
          {closable && (
            <button type="button" className="oc-close" aria-label={closeLabel} onClick={close}>
              ×
            </button>
          )}
        </div>
      ) : (
        <button ref={displayRef} type="button" className="oc-inplace__display" disabled={disabled} aria-label={ariaLabel} onClick={() => setActive(true)}>
          {display}
        </button>
      )}
    </div>
  );
}

/* =========================================================================
 * AnimateOnScroll
 * ========================================================================= */

export interface AnimateOnScrollProps {
  children?: ReactNode;
  /** Class added when the element enters the viewport. Default "oc-aos--visible" (fade + rise). */
  enterClass?: string;
  /** Animate only the first time (default) or every time it re-enters. */
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
  as?: ElementType;
  className?: string;
}

export function AnimateOnScroll({ children, enterClass = 'oc-aos--visible', once = true, threshold = 0.15, rootMargin, as: Tag = 'div', className }: AnimateOnScrollProps) {
  const ref = useRef<HTMLElement>(null);
  // 'static' = no animation (SSR, reduced motion, no IntersectionObserver): content is simply visible.
  const [phase, setPhase] = useState<'static' | 'hidden' | 'shown'>('static');

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    setPhase('hidden');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPhase('shown');
            if (once) io.disconnect();
          } else if (!once) setPhase('hidden');
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold, rootMargin]);

  return (
    <Tag ref={ref} className={cx(phase !== 'static' && 'oc-aos', phase === 'hidden' && 'oc-aos--hidden', phase === 'shown' && enterClass, className)}>
      {children}
    </Tag>
  );
}

/* =========================================================================
 * Ripple
 * ========================================================================= */

function attachRipple(host: HTMLElement): () => void {
  const addedClass = !host.classList.contains('oc-ripple');
  host.classList.add('oc-ripple');
  const waves = new Set<HTMLElement>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const onPointerDown = (e: PointerEvent) => {
    if (prefersReducedMotion() || (host as HTMLButtonElement).disabled) return;
    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const wave = document.createElement('span');
    wave.className = 'oc-ripple__wave';
    wave.setAttribute('aria-hidden', 'true');
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${e.clientX - rect.left - size / 2}px`;
    wave.style.top = `${e.clientY - rect.top - size / 2}px`;
    host.appendChild(wave);
    waves.add(wave);
    const remove = () => {
      wave.remove();
      waves.delete(wave);
    };
    wave.addEventListener('animationend', remove, { once: true });
    const timer = setTimeout(() => {
      remove();
      timers.delete(timer);
    }, 800);
    timers.add(timer);
  };
  host.addEventListener('pointerdown', onPointerDown);
  return () => {
    host.removeEventListener('pointerdown', onPointerDown);
    timers.forEach(clearTimeout);
    waves.forEach((w) => w.remove());
    if (addedClass) host.classList.remove('oc-ripple');
  };
}

/** Adds a pointer ripple to the element the returned ref is attached to. No-op under reduced motion. */
export function useRipple<T extends HTMLElement = HTMLElement>(enabled = true): RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    return attachRipple(el);
  }, [enabled]);
  return ref;
}

/** Drop inside any button/element to give its parent a ripple: <button>Save<Ripple /></button>. */
export function Ripple() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    return attachRipple(host);
  }, []);
  return <span ref={ref} className="oc-ripple__anchor" aria-hidden="true" />;
}

/* =========================================================================
 * FocusTrap
 * ========================================================================= */

export interface FocusTrapProps {
  children?: ReactNode;
  /** Trap only while true. Default true. */
  active?: boolean;
  /** Move focus to the first focusable element on activation. Default true. */
  autoFocus?: boolean;
  /** Return focus to the previously focused element on deactivation. Default true. */
  restoreFocus?: boolean;
  as?: ElementType;
  className?: string;
}

export function FocusTrap({ children, active = true, autoFocus = true, restoreFocus = true, as: Tag = 'div', className }: FocusTrapProps) {
  const ref = useRef<HTMLElement>(null);
  useFocusScope(active, ref, { trap: true, autoFocus, restoreFocus: () => restoreFocus });
  return (
    <Tag ref={ref} tabIndex={-1} className={cx('oc-focustrap', className)}>
      {children}
    </Tag>
  );
}

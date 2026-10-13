// motion — animation primitives (Motion, Presence, Reorder, Stagger, hooks) and animated components.
// Built on @orca-ui/core/motion (dependency-free). Every effect is optional: under
// prefers-reduced-motion or <html data-a11y-motion="off"> things render in their end state,
// decorative layers are aria-hidden, and anything that moves for more than 5 s can be paused.
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import {
  animate,
  inView as observeInView,
  normalizeKeyframes,
  onReducedMotionChange,
  prefersReducedMotion,
  scrollProgress,
  springValue,
  tween,
  type AnimationControls,
  type AnimationOptions,
  type InViewOptions,
  type ScrollProgressOptions,
  type SpringConfig,
  type SpringValue,
} from '@orca-ui/core/motion';
import { cx } from '../utils';

export {
  animate,
  animateLayout,
  cssEasings,
  cubicBezier,
  drawPath,
  easings,
  inView,
  measureLayout,
  onReducedMotionChange,
  parallel,
  playLayout,
  prefersReducedMotion,
  scrollProgress,
  sequence,
  spring,
  springValue,
  stagger,
  timeline,
  tween,
} from '@orca-ui/core/motion';
export type {
  AnimationControls,
  AnimationOptions,
  Easing,
  InViewOptions,
  LayoutOptions,
  MotionKeyframes,
  ScrollProgressOptions,
  SpringConfig,
  SpringValue,
  Timeline as MotionTimeline,
} from '@orca-ui/core/motion';

/* ======================================================================
 * Shared helpers
 * ==================================================================== */

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const noop = () => {};
const isRtl = (el: Element | null) => el?.closest('[dir]')?.getAttribute('dir') === 'rtl';

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as MutableRefObject<T | null>).current = value;
}

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/** Deterministic pseudo-random in [0, 1) so server and client render the same decorative layout. */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const subscribeReduced = (cb: () => void) => onReducedMotionChange(cb);

/**
 * Live reduced-motion flag: true under `prefers-reduced-motion: reduce` or when <html> has
 * `data-a11y-motion="off"`. Server render (and hydration) report false.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, prefersReducedMotion, () => false);
}

export type MotionStyle = Record<string, string | number | undefined>;

function toFrame(style?: MotionStyle | false): Record<string, string> {
  if (!style) return {};
  return normalizeKeyframes(null, [style as Record<string, string | number>])[0];
}

/** Current computed values for the keys of `frame` (the "from" frame of an interrupted animation). */
function currentFrame(el: HTMLElement, frame: Record<string, string>) {
  const cs = getComputedStyle(el);
  const out: Record<string, string> = {};
  for (const k of Object.keys(frame)) {
    const v = k.startsWith('--') ? cs.getPropertyValue(k).trim() : (cs as unknown as Record<string, string>)[k];
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

/** "Pause animation" / "Play animation" toggle used by everything that can move for more than 5 s. */
function MotionToggle({ paused, onToggle, pauseLabel = 'Pause animation', playLabel = 'Play animation', className }: { paused: boolean; onToggle: () => void; pauseLabel?: string; playLabel?: string; className?: string }) {
  return (
    <button type="button" className={cx('oc-motion-toggle', className)} aria-label={paused ? playLabel : pauseLabel} onClick={onToggle}>
      {paused ? (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <rect x="4" y="3.5" width="2.75" height="9" rx="0.75" fill="currentColor" />
          <rect x="9.25" y="3.5" width="2.75" height="9" rx="0.75" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}

/* ======================================================================
 * Hooks
 * ==================================================================== */

/** True while the element is in view (or once it has been, with `once`). */
export function useInView(ref: RefObject<Element>, { once = false, amount = 0, margin, root }: InViewOptions = {}): boolean {
  const [inside, setInside] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeInView(
      el,
      () => {
        setInside(true);
        return once ? undefined : () => setInside(false);
      },
      { once, amount, margin, root },
    );
  }, [ref, once, amount, margin, root]);
  return inside;
}

/**
 * Scroll progress 0–1: of the page (no ref), of an element moving through the viewport, or of a
 * scroll container (`{ within: true }`). Re-renders on change; for per-frame work prefer
 * `scrollProgress()` with a callback.
 */
export function useScrollProgress(ref?: RefObject<Element> | null, options: ScrollProgressOptions = {}): number {
  const [progress, setProgress] = useState(0);
  const { within, axis, range } = options;
  useEffect(() => {
    const target = ref ? ref.current : window;
    if (ref && !target) return;
    return scrollProgress(target, setProgress, { within, axis, range });
  }, [ref, within, axis, range]);
  return progress;
}

/** A number that follows `target` with spring physics (keeps velocity when the target changes). Jumps under reduced motion. */
export function useSpring(target: number, config: SpringConfig & { restSpeed?: number } = {}): number {
  const [value, setValue] = useState(target);
  const spring = useRef<SpringValue | null>(null);
  if (!spring.current) spring.current = springValue(target, config, setValue);
  useEffect(() => {
    spring.current!.set(target);
  }, [target]);
  useEffect(() => () => spring.current?.stop(), []);
  return value;
}

/**
 * Hides `ref`'s element until it scrolls into view, then reveals it with a CSS transition chosen by
 * `data-reveal-effect`. Content is visible without JavaScript and under reduced motion.
 */
function useReveal(ref: RefObject<HTMLElement>, { once = true, amount = 0.15, enabled = true }: { once?: boolean; amount?: number; enabled?: boolean } = {}) {
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    el.setAttribute('data-reveal', 'armed');
    const stop = observeInView(
      el,
      () => {
        el.setAttribute('data-reveal', 'in');
        return once ? undefined : () => el.setAttribute('data-reveal', 'armed');
      },
      { once, amount },
    );
    return () => {
      stop();
      el.removeAttribute('data-reveal');
    };
  }, [enabled, once, amount]);
}

/* ======================================================================
 * Presence (enter / exit)
 * ==================================================================== */

interface PresenceContextValue {
  isPresent: boolean;
  /** Whether a newly mounted child should play its `initial` → `animate` entrance. */
  initial: boolean;
  onExitComplete: () => void;
  register: () => () => void;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

/** For custom components inside <Presence>: [isPresent, safeToRemove]. Call safeToRemove() after your exit animation. */
export function usePresence(): [boolean, () => void] {
  const ctx = useContext(PresenceContext);
  useIsoLayoutEffect(() => ctx?.register(), []);
  return [ctx?.isPresent ?? true, ctx?.onExitComplete ?? noop];
}

function PresenceChild({ isPresent, initial, onExitComplete, children }: { isPresent: boolean; initial: boolean; onExitComplete: () => void; children: ReactNode }) {
  const consumers = useRef(0);
  const done = useLatest(onExitComplete);
  const value: PresenceContextValue = {
    isPresent,
    initial,
    onExitComplete: () => done.current(),
    register: () => {
      consumers.current += 1;
      return () => {
        consumers.current -= 1;
      };
    },
  };
  useEffect(() => {
    // Nothing inside knows how to animate out: remove right away.
    if (!isPresent && consumers.current === 0) done.current();
  }, [isPresent, done]);
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export interface PresenceProps {
  children?: ReactNode;
  /** Play entrance animations for children present on first render. Default true. */
  initial?: boolean;
  /** 'sync' (enter and exit together, default) or 'wait' (enter after exits finish). */
  mode?: 'sync' | 'wait';
  /** Called when every exiting child has finished. */
  onExitComplete?: () => void;
}

const keyOf = (el: ReactElement) => String(el.key);

/**
 * Keeps removed children mounted until their exit animation finishes. Children need unique keys;
 * use <Motion exit={…}> (or usePresence) inside. Exiting children are aria-hidden and inert.
 */
export function Presence({ children, initial = true, mode = 'sync', onExitComplete }: PresenceProps) {
  const present = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const presentKeys = new Set(present.map(keyOf));
  const rendered = useRef<ReactElement[] | null>(null);
  const presentRef = useRef(presentKeys);
  presentRef.current = presentKeys;
  const mounted = useRef(false);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const onDone = useLatest(onExitComplete);

  const prev = rendered.current ?? present;
  let result = [...present];
  prev.forEach((old, i) => {
    if (presentKeys.has(keyOf(old))) return;
    let at = 0;
    for (let j = i - 1; j >= 0; j--) {
      const idx = result.findIndex((e) => keyOf(e) === keyOf(prev[j]));
      if (idx >= 0) {
        at = idx + 1;
        break;
      }
    }
    result.splice(at, 0, old);
  });
  const exiting = result.some((e) => !presentKeys.has(keyOf(e)));
  if (mode === 'wait' && exiting) {
    const prevKeys = new Set(prev.map(keyOf));
    result = result.filter((e) => prevKeys.has(keyOf(e)));
  }
  rendered.current = result;

  useEffect(() => {
    mounted.current = true;
  }, []);

  const complete = useCallback(
    (key: string) => {
      const list = rendered.current;
      if (!list || presentRef.current.has(key)) return;
      const next = list.filter((e) => keyOf(e) !== key);
      if (next.length === list.length) return;
      rendered.current = next;
      rerender();
      if (!next.some((e) => !presentRef.current.has(keyOf(e)))) onDone.current?.();
    },
    [onDone],
  );

  return (
    <>
      {result.map((el) => (
        <PresenceChild key={keyOf(el)} isPresent={presentKeys.has(keyOf(el))} initial={initial || mounted.current} onExitComplete={() => complete(keyOf(el))}>
          {el}
        </PresenceChild>
      ))}
    </>
  );
}

/* ======================================================================
 * Motion
 * ==================================================================== */

export interface MotionProps extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
  /** Element to render. Default 'div'. */
  as?: ElementType;
  /** Start state (CSS properties plus x, y, scale, rotate …). `false` = start at `animate`. */
  initial?: MotionStyle | false;
  /** Target state. Changing it animates from wherever the element is now. */
  animate?: MotionStyle;
  /** State to animate to before unmounting (inside <Presence>). */
  exit?: MotionStyle;
  /** duration / easing / spring / delay. Default: a gentle spring-like ease of 420ms. */
  transition?: AnimationOptions;
  /** Overrides `transition` for the exit. */
  exitTransition?: AnimationOptions;
  /** Wait until the element scrolls into view before playing the entrance. */
  inView?: boolean | InViewOptions;
  /** Animate position changes between renders (FLIP), e.g. when siblings are added or reordered. */
  layout?: boolean;
  style?: CSSProperties;
  onAnimationComplete?: () => void;
  children?: ReactNode;
  [attr: `data-${string}`]: string | number | boolean | undefined;
}

const DEFAULT_TRANSITION: AnimationOptions = { duration: 420, easing: 'expoOut' };

/** Declarative element animation: initial → animate on mount, retargets on change, exit inside <Presence>. */
export const Motion = forwardRef<HTMLElement, MotionProps>(function Motion(
  { as: Tag = 'div', initial, animate: target, exit, transition, exitTransition, inView: inViewOption, layout, style, onAnimationComplete, children, ...rest },
  ref,
) {
  const elRef = useRef<HTMLElement | null>(null);
  const presence = useContext(PresenceContext);
  const reduced = useReducedMotion();
  const controls = useRef<AnimationControls | null>(null);
  const latest = useLatest({ transition, exitTransition, onAnimationComplete, target, exit });
  // Decided once, on the first render.
  const plan = useRef<{ entrance: boolean; style: CSSProperties | undefined } | null>(null);
  if (!plan.current) {
    const entrance = Boolean(initial && target && !reduced && (presence ? presence.initial : true));
    plan.current = { entrance, style: (entrance ? toFrame(initial) : toFrame(target)) as CSSProperties };
  }

  const run = useCallback(
    (from: Record<string, string>, to: Record<string, string>, options?: AnimationOptions) => {
      const el = elRef.current;
      if (!el) return null;
      controls.current?.cancel();
      const c = animate(el, [from, to], { ...DEFAULT_TRANSITION, ...latest.current.transition, ...options });
      controls.current = c;
      return c;
    },
    [latest],
  );

  // Entrance (on mount or when scrolled into view).
  useIsoLayoutEffect(() => {
    const el = elRef.current;
    if (!el || !plan.current?.entrance) return;
    const go = () => {
      run(toFrame(initial), toFrame(latest.current.target))?.finished.then(() => latest.current.onAnimationComplete?.());
    };
    if (inViewOption) return observeInView(el, go, { once: true, amount: 0.2, ...(typeof inViewOption === 'object' ? inViewOption : {}) });
    go();
    return () => controls.current?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retarget when `animate` changes.
  const targetKey = JSON.stringify(target ?? null);
  const lastKey = useRef(targetKey);
  useIsoLayoutEffect(() => {
    if (lastKey.current === targetKey) return;
    lastKey.current = targetKey;
    const el = elRef.current;
    if (!el || !target) return;
    const to = toFrame(target);
    run(currentFrame(el, to), to)?.finished.then(() => latest.current.onAnimationComplete?.());
  }, [targetKey]);

  // Presence registration and exit.
  useIsoLayoutEffect(() => presence?.register(), []);
  const isPresent = presence ? presence.isPresent : true;
  useEffect(() => {
    if (!presence || isPresent) return;
    const el = elRef.current;
    if (el) {
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('inert', '');
      el.style.pointerEvents = 'none';
    }
    const exitStyle = latest.current.exit;
    if (!el || !exitStyle) {
      presence.onExitComplete();
      return;
    }
    const to = toFrame(exitStyle);
    const c = run(currentFrame(el, to), to, latest.current.exitTransition);
    c?.finished.then(() => presence.onExitComplete());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  // FLIP layout: compare the untransformed offset box with the one from the last commit.
  const lastBox = useRef<{ x: number; y: number } | null>(null);
  const layoutAnim = useRef<AnimationControls | null>(null);
  useIsoLayoutEffect(() => {
    if (!layout) return;
    const el = elRef.current;
    if (!el) return;
    const box = { x: el.offsetLeft, y: el.offsetTop };
    const prev = lastBox.current;
    lastBox.current = box;
    if (!prev || !isPresent) return;
    const dx = prev.x - box.x;
    const dy = prev.y - box.y;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    layoutAnim.current?.cancel();
    layoutAnim.current = animate(el, [{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }], { spring: { stiffness: 380, damping: 36 }, commit: false });
  });

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      elRef.current = el;
      assignRef(ref, el);
    },
    [ref],
  );

  return (
    <Tag ref={setRef} style={{ ...plan.current.style, ...style }} {...rest}>
      {children}
    </Tag>
  );
});

/* ======================================================================
 * Stagger / Reveal / BlurIn / FadeUp
 * ==================================================================== */

export type RevealEffect = 'fade' | 'fade-up' | 'fade-down' | 'blur-in' | 'scale' | 'slide-start' | 'slide-end';

export interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  effect?: RevealEffect;
  /** ms */
  delay?: number;
  /** ms. Default 700. */
  duration?: number;
  /** Reveal only the first time (default) or every time it enters. */
  once?: boolean;
  /** Fraction visible before revealing. Default 0.15. */
  amount?: number;
  children?: ReactNode;
}

/** Reveals its content when scrolled into view. Visible without JS and under reduced motion. */
export const Reveal = forwardRef<HTMLElement, RevealProps>(function Reveal(
  { as: Tag = 'div', effect = 'fade-up', delay = 0, duration, once = true, amount, className, style, children, ...rest },
  ref,
) {
  const elRef = useRef<HTMLElement>(null);
  useReveal(elRef, { once, amount });
  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        (elRef as MutableRefObject<HTMLElement | null>).current = el;
        assignRef(ref, el);
      }}
      className={cx('oc-reveal', className)}
      data-reveal-effect={effect}
      style={{ ...(delay ? { '--oc-reveal-delay': `${delay}ms` } : {}), ...(duration ? { '--oc-reveal-dur': `${duration}ms` } : {}), ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
});

/** Content that sharpens from a blur as it scrolls into view. */
export const BlurIn = forwardRef<HTMLElement, Omit<RevealProps, 'effect'>>(function BlurIn(props, ref) {
  return <Reveal ref={ref} effect="blur-in" {...props} />;
});

/** Content that fades and rises into place as it scrolls into view. */
export const FadeUp = forwardRef<HTMLElement, Omit<RevealProps, 'effect'>>(function FadeUp(props, ref) {
  return <Reveal ref={ref} effect="fade-up" {...props} />;
});

export interface StaggerProps extends RevealProps {
  /** ms between children. Default 70. */
  each?: number;
  /** Which child starts: 'first' (default), 'last' or 'center'. */
  from?: 'first' | 'last' | 'center';
}

/** Reveals its direct children one after another (keeps list semantics: render as="ul" with <li> children). */
export const Stagger = forwardRef<HTMLElement, StaggerProps>(function Stagger(
  { as: Tag = 'div', effect = 'fade-up', each = 70, from = 'first', delay = 0, duration, once = true, amount, className, style, children, ...rest },
  ref,
) {
  const elRef = useRef<HTMLElement>(null);
  useReveal(elRef, { once, amount });
  const count = Children.count(children);
  useIsoLayoutEffect(() => {
    const kids = Array.from(elRef.current?.children ?? []) as HTMLElement[];
    const n = kids.length;
    kids.forEach((kid, i) => {
      const order = from === 'last' ? n - 1 - i : from === 'center' ? Math.abs(i - (n - 1) / 2) : i;
      kid.style.setProperty('--oc-i', String(order));
    });
  }, [count, from]);
  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        (elRef as MutableRefObject<HTMLElement | null>).current = el;
        assignRef(ref, el);
      }}
      className={cx('oc-stagger', className)}
      data-reveal-effect={effect}
      style={{ '--oc-stagger-each': `${each}ms`, ...(delay ? { '--oc-reveal-delay': `${delay}ms` } : {}), ...(duration ? { '--oc-reveal-dur': `${duration}ms` } : {}), ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
});

/* ======================================================================
 * Reorder (drag + keyboard + announcements)
 * ==================================================================== */

export interface ReorderMessages {
  lifted: (label: string, position: number, total: number) => string;
  moved: (label: string, position: number, total: number) => string;
  dropped: (label: string, position: number, total: number) => string;
  cancelled: (label: string, position: number, total: number) => string;
}

const DEFAULT_REORDER_MESSAGES: ReorderMessages = {
  lifted: (l, p, t) => `${l} grabbed. Current position ${p} of ${t}. Use the arrow keys to move, Space to drop, Escape to cancel.`,
  moved: (l, p, t) => `${l} moved to position ${p} of ${t}.`,
  dropped: (l, p, t) => `${l} dropped at position ${p} of ${t}.`,
  cancelled: (l, p, t) => `Reorder cancelled. ${l} returned to position ${p} of ${t}.`,
};

export interface ReorderItemState {
  index: number;
  /** Picked up with the keyboard. */
  grabbed: boolean;
  /** Being dragged with a pointer. */
  dragging: boolean;
}

export interface ReorderProps<T> {
  /** Accessible name of the list. */
  label: string;
  items: T[];
  onReorder: (items: T[]) => void;
  getKey: (item: T) => string;
  /** Text used for the handle name and announcements. */
  getLabel: (item: T) => string;
  renderItem?: (item: T, state: ReorderItemState) => ReactNode;
  /** 'y' (vertical list, default) or 'x' (horizontal row). */
  axis?: 'x' | 'y';
  /** Handle accessible name. Default `Reorder ${label}`. */
  handleLabel?: (label: string) => string;
  /** Screen reader instructions for the handles. */
  instructions?: string;
  messages?: Partial<ReorderMessages>;
  disabled?: boolean;
  className?: string;
}

const GripIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    {[4, 8, 12].map((y) => (
      <g key={y}>
        <circle cx="6" cy={y} r="1.15" fill="currentColor" />
        <circle cx="10" cy={y} r="1.15" fill="currentColor" />
      </g>
    ))}
  </svg>
);

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Sortable list. Drag the handle with a pointer, or focus it and press Space/Enter to pick the item
 * up, arrows to move, Space/Enter to drop and Escape to cancel (Alt+Arrow moves in one step). Every
 * step is announced in a live region; neighbours slide into place with a FLIP animation.
 */
export function Reorder<T>({
  label,
  items,
  onReorder,
  getKey,
  getLabel,
  renderItem,
  axis = 'y',
  handleLabel = (l) => `Reorder ${l}`,
  instructions = 'Press Space or Enter to pick up. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.',
  messages,
  disabled,
  className,
}: ReorderProps<T>) {
  const id = useId();
  const msg = { ...DEFAULT_REORDER_MESSAGES, ...messages };
  const listRef = useRef<HTMLUListElement>(null);
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const origin = useRef<{ key: string; items: T[] } | null>(null);
  const refocus = useRef<string | null>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const drag = useRef<{ key: string; pointerId: number; grab: number; size: number; client: number; last: number } | null>(null);
  const itemsRef = useLatest(items);
  const horizontal = axis === 'x';
  const total = items.length;

  const say = (text: string) => setAnnouncement((prev) => (prev === text ? `${text} ` : text));
  const indexOf = (key: string, list = itemsRef.current) => list.findIndex((it) => getKey(it) === key);

  const commit = (next: T[], key: string) => {
    refocus.current = key;
    onReorder(next);
  };

  const placeDragged = useCallback(() => {
    const d = drag.current;
    const list = listRef.current;
    if (!d || !list) return;
    const li = list.querySelector<HTMLElement>(`[data-reorder-key="${CSS.escape(d.key)}"]`);
    if (!li) return;
    const listRect = list.getBoundingClientRect();
    const layoutStart = (horizontal ? listRect.left + li.offsetLeft : listRect.top + li.offsetTop) - (horizontal ? list.scrollLeft : list.scrollTop);
    const offset = d.client - d.grab - layoutStart;
    li.style.translate = horizontal ? `${offset}px 0` : `0 ${offset}px`;
  }, [horizontal]);

  // FLIP siblings + keep focus on the moved handle after React reorders the DOM.
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduced = prefersReducedMotion();
    for (const li of Array.from(list.children) as HTMLElement[]) {
      const key = li.getAttribute('data-reorder-key')!;
      const now = { x: li.offsetLeft, y: li.offsetTop };
      const prev = positions.current.get(key);
      positions.current.set(key, now);
      if (!prev || reduced || key === drag.current?.key) continue;
      const dx = prev.x - now.x;
      const dy = prev.y - now.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      animate(li, [{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }], { spring: { stiffness: 420, damping: 38 }, commit: false });
    }
    placeDragged();
    if (refocus.current) {
      const h = handles.current.get(refocus.current);
      if (h && document.activeElement !== h) h.focus({ preventScroll: false });
      refocus.current = null;
    }
  });

  const pickUp = (key: string) => {
    origin.current = { key, items: itemsRef.current };
    setGrabbed(key);
    const item = itemsRef.current[indexOf(key)];
    say(msg.lifted(getLabel(item), indexOf(key) + 1, total));
  };

  const drop = (key: string) => {
    setGrabbed(null);
    origin.current = null;
    const i = indexOf(key);
    if (i >= 0) say(msg.dropped(getLabel(itemsRef.current[i]), i + 1, total));
  };

  const cancel = (key: string) => {
    const o = origin.current;
    setGrabbed(null);
    origin.current = null;
    if (!o) return;
    const i = o.items.findIndex((it) => getKey(it) === key);
    commit(o.items, key);
    if (i >= 0) say(msg.cancelled(getLabel(o.items[i]), i + 1, total));
  };

  const moveTo = (key: string, to: number) => {
    const from = indexOf(key);
    const target = Math.max(0, Math.min(total - 1, to));
    if (from < 0 || from === target) return;
    const next = move(itemsRef.current, from, target);
    commit(next, key);
    say(msg.moved(getLabel(next[target]), target + 1, total));
  };

  const onHandleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, key: string) => {
    if (disabled) return;
    const rtl = isRtl(e.currentTarget);
    const prevKey = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    const nextKey = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const i = indexOf(key);
    const isGrabbed = grabbed === key;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isGrabbed) drop(key);
      else pickUp(key);
    } else if (e.key === 'Escape' && isGrabbed) {
      e.preventDefault();
      cancel(key);
    } else if ((e.key === prevKey || e.key === nextKey) && (isGrabbed || e.altKey)) {
      e.preventDefault();
      moveTo(key, i + (e.key === nextKey ? 1 : -1));
    } else if ((e.key === 'Home' || e.key === 'End') && isGrabbed) {
      e.preventDefault();
      moveTo(key, e.key === 'Home' ? 0 : total - 1);
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, key: string) => {
    if (disabled || e.button !== 0) return;
    const li = e.currentTarget.closest('li') as HTMLElement | null;
    if (!li) return;
    const rect = li.getBoundingClientRect();
    const client = horizontal ? e.clientX : e.clientY;
    drag.current = { key, pointerId: e.pointerId, grab: client - (horizontal ? rect.left : rect.top), size: horizontal ? rect.width : rect.height, client, last: indexOf(key) };
    origin.current = { key, items: itemsRef.current };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not supported */
    }
    setDragging(key);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    const list = listRef.current;
    if (!d || !list || e.pointerId !== d.pointerId) return;
    d.client = horizontal ? e.clientX : e.clientY;
    const listRect = list.getBoundingClientRect();
    const scroll = horizontal ? list.scrollLeft : list.scrollTop;
    const center = d.client - d.grab + d.size / 2;
    const lis = Array.from(list.children) as HTMLElement[];
    let to = 0;
    for (const li of lis) {
      if (li.getAttribute('data-reorder-key') === d.key) continue;
      const start = (horizontal ? listRect.left + li.offsetLeft : listRect.top + li.offsetTop) - scroll;
      const mid = start + (horizontal ? li.offsetWidth : li.offsetHeight) / 2;
      const rtlFlip = horizontal && isRtl(list);
      if (rtlFlip ? mid > center : mid < center) to++;
    }
    const from = indexOf(d.key);
    if (to !== from) {
      const next = move(itemsRef.current, from, to);
      onReorder(next);
    } else {
      placeDragged();
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    drag.current = null;
    setDragging(null);
    const li = listRef.current?.querySelector<HTMLElement>(`[data-reorder-key="${CSS.escape(d.key)}"]`);
    if (cancelled && origin.current) {
      onReorder(origin.current.items);
    }
    origin.current = null;
    if (li) {
      const from = li.style.translate || '0px 0px';
      li.style.translate = '';
      animate(li, [{ translate: from }, { translate: '0px 0px' }], { spring: { stiffness: 500, damping: 40 }, commit: false });
    }
    const i = indexOf(d.key);
    if (i >= 0 && !cancelled) say(msg.dropped(getLabel(itemsRef.current[i]), i + 1, total));
  };

  return (
    <div className={cx('oc-reorder', horizontal && 'oc-reorder--x', className)} data-dragging={dragging ? '' : undefined}>
      <span id={`${id}-help`} className="oc-sr-only">
        {instructions}
      </span>
      <ul ref={listRef} className="oc-reorder__list" aria-label={label}>
        {items.map((item, index) => {
          const key = getKey(item);
          const isGrabbed = grabbed === key;
          const isDragging = dragging === key;
          return (
            <li key={key} className="oc-reorder__item" data-reorder-key={key} data-grabbed={isGrabbed ? '' : undefined} data-dragging={isDragging ? '' : undefined}>
              <button
                ref={(el) => {
                  if (el) handles.current.set(key, el);
                  else handles.current.delete(key);
                }}
                type="button"
                className="oc-reorder__handle"
                aria-label={handleLabel(getLabel(item))}
                aria-describedby={`${id}-help`}
                aria-pressed={isGrabbed}
                disabled={disabled}
                onKeyDown={(e) => onHandleKeyDown(e, key)}
                onBlur={() => {
                  if (isGrabbed && refocus.current !== key) drop(key);
                }}
                onPointerDown={(e) => onPointerDown(e, key)}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => endDrag(e)}
                onPointerCancel={(e) => endDrag(e, true)}
              >
                <GripIcon />
              </button>
              <div className="oc-reorder__content">{renderItem ? renderItem(item, { index, grabbed: isGrabbed, dragging: isDragging }) : getLabel(item)}</div>
            </li>
          );
        })}
      </ul>
      <div className="oc-sr-only" role="status" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}

/* ======================================================================
 * Marquee
 * ==================================================================== */

export interface MarqueeProps {
  children: ReactNode;
  /** Accessible name; renders a labelled region. */
  label?: string;
  /** Which way the content travels. Default 'left' (toward inline start; mirrored in RTL). */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Pixels per second. Default 40. */
  speed?: number;
  /** Pause while hovered or while something inside has focus. Default true. */
  pauseOnHover?: boolean;
  /** Fade the edges. Default true. */
  fade?: boolean;
  /** Gap between items (CSS length). Default 2rem. */
  gap?: string;
  /** Number of copies (≥ 2) so the loop never shows a hole. Default 2. */
  repeat?: number;
  pauseLabel?: string;
  playLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Endlessly scrolling row (or column). Pauses on hover/focus and has a visible pause button
 * (WCAG 2.2.2). Copies after the first are aria-hidden and inert. Under reduced motion it becomes a
 * static, scrollable row.
 */
export function Marquee({
  children,
  label,
  direction = 'left',
  speed = 40,
  pauseOnHover = true,
  fade = true,
  gap,
  repeat = 2,
  pauseLabel = 'Pause scrolling',
  playLabel = 'Resume scrolling',
  className,
  style,
}: MarqueeProps) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const vertical = direction === 'up' || direction === 'down';

  useEffect(() => {
    const el = groupRef.current;
    if (!el || reduced) return;
    const measure = () => {
      const size = vertical ? el.scrollHeight : el.scrollWidth;
      if (size > 0) setDuration(size / Math.max(1, speed));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [speed, vertical, reduced]);

  const Root = label ? 'section' : 'div';
  const copies = reduced ? 1 : Math.max(2, repeat);
  return (
    <Root
      className={cx('oc-marquee', vertical && 'oc-marquee--vertical', className)}
      aria-label={label}
      data-direction={direction}
      data-paused={paused ? '' : undefined}
      data-hover-pause={pauseOnHover ? '' : undefined}
      data-fade={fade ? '' : undefined}
      data-static={reduced ? '' : undefined}
      style={{ ...(gap ? { '--oc-marquee-gap': gap } : {}), ...(duration ? { '--oc-marquee-duration': `${duration.toFixed(2)}s` } : {}), ...style } as CSSProperties}
    >
      <div className="oc-marquee__viewport" tabIndex={reduced ? 0 : undefined} role={reduced ? 'group' : undefined} aria-label={reduced ? label ?? 'Scrollable content' : undefined}>
        {Array.from({ length: copies }, (_, i) => (
          <MarqueeGroup key={i} copy={i > 0} groupRef={i === 0 ? groupRef : undefined}>
            {children}
          </MarqueeGroup>
        ))}
      </div>
      {!reduced && <MotionToggle className="oc-marquee__toggle" paused={paused} onToggle={() => setPaused((p) => !p)} pauseLabel={pauseLabel} playLabel={playLabel} />}
    </Root>
  );
}

function MarqueeGroup({ copy, groupRef, children }: { copy: boolean; groupRef?: RefObject<HTMLDivElement>; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (copy) ref.current?.setAttribute('inert', '');
  }, [copy]);
  return (
    <div
      ref={(el) => {
        (ref as MutableRefObject<HTMLDivElement | null>).current = el;
        if (groupRef) (groupRef as MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      className="oc-marquee__group"
      aria-hidden={copy || undefined}
    >
      {children}
    </div>
  );
}

/* ======================================================================
 * NumberTicker / AnimatedCounter
 * ==================================================================== */

export interface NumberTickerProps {
  value: number;
  /** Start value. Default 0. */
  from?: number;
  /** ms. Default 1600. */
  duration?: number;
  delay?: number;
  locale?: string;
  /** Fraction digits shown. Default: those of `value`. */
  decimals?: number;
  /** Extra Intl.NumberFormat options (currency, compact notation …). */
  format?: Intl.NumberFormatOptions;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Wait until scrolled into view. Default true. */
  startOnView?: boolean;
  /** Announce the final value politely when it changes (once per change). Default false. */
  live?: boolean;
  className?: string;
}

/**
 * Counts up (or down) to `value`. Screen readers get the final value as static text, never the
 * intermediate frames. Shows the final value immediately without JS or under reduced motion.
 */
export function NumberTicker({ value, from = 0, duration = 1600, delay = 0, locale, decimals, format, prefix, suffix, startOnView = true, live = false, className }: NumberTickerProps) {
  const places = decimals ?? (String(value).split('.')[1]?.length ?? 0);
  const fmt = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: places, maximumFractionDigits: places, ...format }), [locale, places, format]);
  const ref = useRef<HTMLSpanElement>(null);
  const visualRef = useRef<HTMLSpanElement>(null);
  const [announced, setAnnounced] = useState(() => fmt.format(value));
  const shown = useRef(from);
  const started = useRef(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    const visual = visualRef.current;
    if (!el || !visual) return;
    const write = (n: number) => {
      shown.current = n;
      visual.textContent = fmt.format(n);
    };
    const start = started.current ? shown.current : from;
    const run = () => {
      started.current = true;
      return tween(start, value, write, { duration, delay, easing: 'out', onComplete: () => setAnnounced(fmt.format(value)) });
    };
    if (prefersReducedMotion()) {
      write(value);
      setAnnounced(fmt.format(value));
      return;
    }
    write(start);
    if (startOnView && !started.current) {
      let c: AnimationControls | null = null;
      const stop = observeInView(el, () => {
        c = run();
      }, { once: true, amount: 0.3 });
      return () => {
        stop();
        c?.cancel();
      };
    }
    const c = run();
    return () => c.cancel();
  }, [value, fmt]);

  return (
    <span ref={ref} className={cx('oc-ticker', className)}>
      <span aria-hidden="true" className="oc-ticker__visual">
        {prefix}
        <span ref={visualRef} className="oc-ticker__num">
          {fmt.format(value)}
        </span>
        {suffix}
      </span>
      <span className="oc-sr-only" role={live ? 'status' : undefined}>
        {typeof prefix === 'string' ? prefix : ''}
        {announced}
        {typeof suffix === 'string' ? suffix : ''}
      </span>
    </span>
  );
}

/** Alias of NumberTicker. */
export const AnimatedCounter = NumberTicker;

/* ======================================================================
 * TextReveal / TypingText / MorphingText
 * ==================================================================== */

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿ]/;

export interface TextRevealProps {
  text: string;
  as?: ElementType;
  /** Split into words (default) or characters. Arabic text always splits by word to keep letters joined. */
  by?: 'word' | 'char';
  /** ms between tokens. Default 45 (words) / 18 (chars). */
  each?: number;
  /** 'blur' (default), 'fade-up' or 'fade'. */
  effect?: 'blur' | 'fade-up' | 'fade';
  delay?: number;
  once?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Text whose words appear one by one when scrolled into view. Screen readers read the whole text once. */
export function TextReveal({ text, as: Tag = 'p', by = 'word', each, effect = 'blur', delay = 0, once = true, className, style }: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { once });
  const mode = by === 'char' && !ARABIC.test(text) ? 'char' : 'word';
  const tokens = mode === 'char' ? Array.from(text) : text.split(/(\s+)/);
  let n = 0;
  return (
    <Tag
      ref={ref}
      className={cx('oc-textreveal', className)}
      data-reveal-effect={effect}
      style={{ '--oc-stagger-each': `${each ?? (mode === 'char' ? 18 : 45)}ms`, ...(delay ? { '--oc-reveal-delay': `${delay}ms` } : {}), ...style } as CSSProperties}
    >
      <span className="oc-sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((t, i) =>
          /^\s+$/.test(t) ? (
            t
          ) : (
            <span key={i} className="oc-textreveal__token" style={{ '--oc-i': n++ } as CSSProperties}>
              {t}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}

export interface TypingTextProps {
  /** Text to type once. */
  text?: string;
  /** Or several phrases to type, delete and cycle through. */
  words?: string[];
  as?: ElementType;
  /** ms per character. Default 55. */
  speed?: number;
  /** ms per deleted character. Default 28. */
  deleteSpeed?: number;
  /** ms to hold a finished phrase. Default 1800. */
  hold?: number;
  /** Cycle `words` forever (shows a pause button). Default false: stops on the last phrase. */
  loop?: boolean;
  /** Show the caret. Default true. */
  cursor?: boolean;
  startOnView?: boolean;
  /** Text read by screen readers. Default: `text`, or `words` joined by commas. */
  srText?: string;
  pauseLabel?: string;
  playLabel?: string;
  className?: string;
}

/**
 * Types text character by character with a caret (blinks once per second, well under 3 flashes/s).
 * Assistive tech gets the complete text as static content. Reduced motion shows the final text.
 */
export function TypingText({
  text,
  words,
  as: Tag = 'span',
  speed = 55,
  deleteSpeed = 28,
  hold = 1800,
  loop = false,
  cursor = true,
  startOnView = true,
  srText,
  pauseLabel = 'Pause typing animation',
  playLabel = 'Resume typing animation',
  className,
}: TypingTextProps) {
  const phrases = useMemo(() => (words?.length ? words : [text ?? '']), [words, text]);
  const finalText = loop ? phrases[0] : phrases[phrases.length - 1];
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<{ word: number; count: number; deleting: boolean; done: boolean } | null>(null);
  const [paused, setPaused] = useState(false);
  const visible = useInView(ref, { once: true, amount: 0.3 });
  const active = !reduced && (!startOnView || visible || typeof IntersectionObserver === 'undefined');

  useIsoLayoutEffect(() => {
    if (!reduced) setState({ word: 0, count: 0, deleting: false, done: false });
  }, [reduced, phrases]);

  useEffect(() => {
    if (!active || !state || state.done || paused) return;
    const phrase = phrases[state.word];
    let t: number;
    if (!state.deleting && state.count < phrase.length) {
      t = window.setTimeout(() => setState({ ...state, count: state.count + 1 }), speed);
    } else if (!state.deleting) {
      const last = state.word === phrases.length - 1;
      if (last && !loop) {
        setState({ ...state, done: true });
        return;
      }
      if (phrases.length === 1 && !loop) return;
      t = window.setTimeout(() => setState({ ...state, deleting: true }), hold);
    } else if (state.count > 0) {
      t = window.setTimeout(() => setState({ ...state, count: state.count - 1 }), deleteSpeed);
    } else {
      t = window.setTimeout(() => setState({ word: (state.word + 1) % phrases.length, count: 0, deleting: false, done: false }), speed * 4);
    }
    return () => window.clearTimeout(t);
  }, [active, state, paused, phrases, speed, deleteSpeed, hold, loop]);

  const shown = state && !reduced ? Array.from(phrases[state.word]).slice(0, state.count).join('') : finalText;
  const typing = Boolean(state && !state.done && !reduced);
  return (
    <Tag ref={ref} className={cx('oc-typing', className)}>
      <span className="oc-sr-only">{srText ?? (words?.length ? words.join(', ') : text)}</span>
      <span aria-hidden="true" className="oc-typing__visual" data-typing={typing ? '' : undefined}>
        {shown}
        {cursor && <span className="oc-typing__caret" />}
      </span>
      {loop && !reduced && phrases.length > 1 && <MotionToggle className="oc-typing__toggle" paused={paused} onToggle={() => setPaused((p) => !p)} pauseLabel={pauseLabel} playLabel={playLabel} />}
    </Tag>
  );
}

export interface MorphingTextProps {
  texts: string[];
  /** ms each text stays. Default 3000. */
  interval?: number;
  as?: ElementType;
  /** Read by screen readers instead of the cycling text. Default: texts joined by commas. */
  srText?: string;
  pauseLabel?: string;
  playLabel?: string;
  className?: string;
}

/** Cycles through phrases with a soft blur-morph. Has a pause button; static (first phrase) under reduced motion. */
export function MorphingText({ texts, interval = 3000, as: Tag = 'span', srText, pauseLabel = 'Pause text animation', playLabel = 'Resume text animation', className }: MorphingTextProps) {
  const reduced = useReducedMotion();
  const [{ index, prev }, setCycle] = useState<{ index: number; prev: number | null }>({ index: 0, prev: null });
  const setPrev = (p: null) => setCycle((c) => ({ ...c, prev: p }));
  const [paused, setPaused] = useState(false);
  const cycling = !reduced && !paused && texts.length > 1;
  useEffect(() => {
    if (!cycling) return;
    const t = window.setInterval(() => {
      setCycle((c) => ({ index: (c.index + 1) % texts.length, prev: c.index }));
    }, Math.max(1200, interval));
    return () => window.clearInterval(t);
  }, [cycling, interval, texts.length]);
  const current = reduced ? 0 : index;
  return (
    <Tag className={cx('oc-morph', className)}>
      <span className="oc-sr-only">{srText ?? texts.join(', ')}</span>
      <span className="oc-morph__stage" aria-hidden="true">
        {prev !== null && !reduced && prev !== current && (
          <span key={`out-${prev}-${current}`} className="oc-morph__text" data-state="out" onAnimationEnd={() => setPrev(null)}>
            {texts[prev]}
          </span>
        )}
        <span key={`in-${current}`} className="oc-morph__text" data-state={prev !== null ? 'in' : undefined}>
          {texts[current]}
        </span>
      </span>
      {!reduced && texts.length > 1 && <MotionToggle className="oc-morph__toggle" paused={paused} onToggle={() => setPaused((p) => !p)} pauseLabel={pauseLabel} playLabel={playLabel} />}
    </Tag>
  );
}

/* ======================================================================
 * SpotlightCard / BorderBeam / AnimatedBorder / ShimmerButton
 * ==================================================================== */

export interface SpotlightCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Spotlight diameter in px. Default 360. */
  size?: number;
  /** Spotlight color (CSS). Default: the accent. */
  color?: string;
  /** Default inner padding. Default true. */
  padded?: boolean;
  children?: ReactNode;
}

/** Card lit by a soft spotlight that follows the pointer (centered while focused within). */
export const SpotlightCard = forwardRef<HTMLElement, SpotlightCardProps>(function SpotlightCard(
  { as: Tag = 'div', size = 360, color, padded = true, className, style, children, onPointerMove, onPointerLeave, ...rest },
  ref,
) {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return (
    <Tag
      ref={ref}
      className={cx('oc-spotlight', padded && 'oc-spotlight--padded', className)}
      style={{ '--oc-spot-size': `${size}px`, ...(color ? { '--oc-spot-color': color } : {}), ...style } as CSSProperties}
      onPointerMove={(e: ReactPointerEvent<HTMLElement>) => {
        onPointerMove?.(e);
        const el = e.currentTarget;
        const { clientX, clientY } = e;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--oc-spot-x', `${clientX - r.left}px`);
          el.style.setProperty('--oc-spot-y', `${clientY - r.top}px`);
          el.setAttribute('data-lit', '');
        });
      }}
      onPointerLeave={(e: ReactPointerEvent<HTMLElement>) => {
        onPointerLeave?.(e);
        cancelAnimationFrame(frame.current);
        e.currentTarget.removeAttribute('data-lit');
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export interface BorderBeamProps {
  /** Seconds per lap. Default 8. */
  duration?: number;
  /** Seconds before it starts. */
  delay?: number;
  /** Beam length in degrees of the lap. Default 70. */
  size?: number;
  /** Border width (CSS length). Default 1.5px. */
  width?: string;
  colorFrom?: string;
  colorTo?: string;
  reverse?: boolean;
  className?: string;
}

/** Decorative light that travels around its parent's border (parent needs position: relative). Static glow under reduced motion. */
export function BorderBeam({ duration = 8, delay = 0, size = 70, width, colorFrom, colorTo, reverse, className }: BorderBeamProps) {
  return (
    <span
      aria-hidden="true"
      className={cx('oc-beam', className)}
      data-reverse={reverse ? '' : undefined}
      style={
        {
          '--oc-beam-dur': `${Math.max(2, duration)}s`,
          '--oc-beam-delay': `${-delay}s`,
          '--oc-beam-size': `${size}deg`,
          ...(width ? { '--oc-beam-width': width } : {}),
          ...(colorFrom ? { '--oc-beam-from': colorFrom } : {}),
          ...(colorTo ? { '--oc-beam-to': colorTo } : {}),
        } as CSSProperties
      }
    />
  );
}

export interface AnimatedBorderProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** 'beam' (a light travelling the border) or 'gradient' (a slowly rotating gradient ring). */
  variant?: 'beam' | 'gradient';
  /** Seconds per lap. */
  duration?: number;
  padded?: boolean;
  children?: ReactNode;
}

/** Surface with an animated border. The border is decorative; content and focus are unaffected. */
export const AnimatedBorder = forwardRef<HTMLElement, AnimatedBorderProps>(function AnimatedBorder(
  { as: Tag = 'div', variant = 'beam', duration, padded = true, className, children, ...rest },
  ref,
) {
  return (
    <Tag ref={ref} className={cx('oc-animborder', padded && 'oc-animborder--padded', variant === 'gradient' && 'oc-animborder--gradient', className)} {...rest}>
      {variant === 'beam' ? <BorderBeam duration={duration} /> : <span aria-hidden="true" className="oc-animborder__ring" style={duration ? ({ '--oc-beam-dur': `${duration}s` } as CSSProperties) : undefined} />}
      {children}
    </Tag>
  );
});

export interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

/** Button with a light sheen sweeping across it every few seconds (not flashing). Plain button under reduced motion. */
export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(function ShimmerButton({ variant = 'primary', size = 'md', className, children, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={cx('oc-btn', `oc-btn--${variant}`, size !== 'md' && `oc-btn--${size}`, 'oc-shimmer', className)} {...rest}>
      <span className="oc-shimmer__label">{children}</span>
      <span aria-hidden="true" className="oc-shimmer__sheen" />
    </button>
  );
});

/* ======================================================================
 * Backgrounds: Aurora, GridPattern, DotPattern, Meteors, Particles, RippleRings
 * ==================================================================== */

export interface AuroraBackgroundProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** 0–1. Default 0.55. */
  intensity?: number;
  children?: ReactNode;
}

/** Section with a slow, soft aurora behind its content. The aurora is decorative (aria-hidden) and still under reduced motion. */
export function AuroraBackground({ as: Tag = 'section', intensity = 0.55, className, style, children, ...rest }: AuroraBackgroundProps) {
  return (
    <Tag className={cx('oc-aurora', className)} style={{ '--oc-aurora-o': intensity, ...style } as CSSProperties} {...rest}>
      <span aria-hidden="true" className="oc-aurora__layer">
        <span className="oc-aurora__blob" />
        <span className="oc-aurora__blob" />
        <span className="oc-aurora__blob" />
      </span>
      <div className="oc-aurora__content">{children}</div>
    </Tag>
  );
}

export interface PatternProps {
  /** Cell size in px. */
  size?: number;
  /** Mask: 'radial' (default), 'top', 'bottom' or 'none'. */
  fade?: 'radial' | 'top' | 'bottom' | 'none';
  className?: string;
  style?: CSSProperties;
}

export interface GridPatternProps extends PatternProps {
  strokeWidth?: number;
  /** Dashed lines, e.g. "4 2". */
  dash?: string;
  /** Cells to fill, as [column, row]. */
  squares?: Array<[number, number]>;
}

/** Decorative grid background (absolutely fills its positioned parent; aria-hidden). */
export function GridPattern({ size = 32, strokeWidth = 1, dash, squares = [], fade = 'radial', className, style }: GridPatternProps) {
  const id = useId().replace(/:/g, '');
  return (
    <svg aria-hidden="true" focusable="false" className={cx('oc-pattern oc-pattern--grid', className)} data-fade={fade} style={style}>
      <defs>
        <pattern id={`${id}-grid`} width={size} height={size} patternUnits="userSpaceOnUse" x="-1" y="-1">
          <path d={`M.5 ${size}V.5H${size}`} fill="none" strokeWidth={strokeWidth} strokeDasharray={dash} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-grid)`} />
      {squares.map(([x, y]) => (
        <rect key={`${x}-${y}`} className="oc-pattern__cell" width={size - 1} height={size - 1} x={x * size} y={y * size} />
      ))}
    </svg>
  );
}

export interface DotPatternProps extends PatternProps {
  /** Dot radius in px. Default 1.25. */
  radius?: number;
}

/** Decorative dot-matrix background (aria-hidden). */
export function DotPattern({ size = 20, radius = 1.25, fade = 'radial', className, style }: DotPatternProps) {
  const id = useId().replace(/:/g, '');
  return (
    <svg aria-hidden="true" focusable="false" className={cx('oc-pattern oc-pattern--dots', className)} data-fade={fade} style={style}>
      <defs>
        <pattern id={`${id}-dots`} width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={size / 2} cy={size / 2} r={radius} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-dots)`} />
    </svg>
  );
}

export interface MeteorsProps {
  /** Default 14. */
  count?: number;
  /** Fall angle in degrees. Default 215. */
  angle?: number;
  className?: string;
}

/** Decorative meteor shower (aria-hidden). Not rendered at all under reduced motion. */
export function Meteors({ count = 14, angle = 215, className }: MeteorsProps) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <span aria-hidden="true" className={cx('oc-meteors', className)} style={{ '--oc-meteor-angle': `${angle}deg` } as CSSProperties}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="oc-meteor"
          style={
            {
              left: `${Math.round(seeded(i + 1) * 110) - 5}%`,
              top: `${Math.round(seeded(i + 41) * 30) - 20}%`,
              animationDelay: `${(seeded(i + 7) * 6).toFixed(2)}s`,
              animationDuration: `${(4 + seeded(i + 13) * 5).toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

export interface ParticlesProps {
  /** Default 60. */
  count?: number;
  /** Drift speed multiplier. Default 0.35. */
  speed?: number;
  /** Particles drift away from the pointer. Default true. */
  interactive?: boolean;
  /** CSS color; default the accent. */
  color?: string;
  className?: string;
}

/** Decorative floating particles on a canvas (aria-hidden). Pauses off-screen; a single still frame under reduced motion. */
export function Particles({ count = 60, speed = 0.35, interactive = true, color, className }: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext?.('2d');
    if (!canvas || !ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pointer = { x: -9999, y: -9999 };
    const fill = color || getComputedStyle(canvas).color || '#888';
    const dots = Array.from({ length: count }, (_, i) => ({
      x: seeded(i + 3),
      y: seeded(i + 97),
      r: 0.6 + seeded(i + 29) * 1.8,
      vx: (seeded(i + 5) - 0.5) * 0.0006,
      vy: (seeded(i + 11) - 0.5) * 0.0006,
      a: 0.25 + seeded(i + 17) * 0.55,
      ox: 0,
      oy: 0,
    }));
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = fill;
      for (const d of dots) {
        ctx.globalAlpha = d.a;
        ctx.beginPath();
        ctx.arc(d.x * w + d.ox, d.y * h + d.oy, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const tick = () => {
      for (const d of dots) {
        d.x = (d.x + d.vx * speed * 3 + 1) % 1;
        d.y = (d.y + d.vy * speed * 3 + 1) % 1;
        if (interactive) {
          const dx = d.x * w + d.ox - pointer.x;
          const dy = d.y * h + d.oy - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90 && dist > 0.1) {
            d.ox += (dx / dist) * (90 - dist) * 0.02;
            d.oy += (dy / dist) * (90 - dist) * 0.02;
          }
        }
        d.ox *= 0.94;
        d.oy *= 0.94;
      }
      draw();
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const start = () => {
      if (!raf && !reduced && visible) raf = requestAnimationFrame(tick);
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            start();
          })
        : null;
    io?.observe(canvas);
    const parent = canvas.parentElement;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };
    if (interactive && parent) {
      parent.addEventListener('pointermove', onMove);
      parent.addEventListener('pointerleave', onLeave);
    }
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);
    start();
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      parent?.removeEventListener('pointermove', onMove);
      parent?.removeEventListener('pointerleave', onLeave);
    };
  }, [count, speed, interactive, color, reduced]);
  return <canvas ref={canvasRef} aria-hidden="true" className={cx('oc-particles', className)} />;
}

export interface RippleRingsProps {
  /** Default 6. */
  count?: number;
  /** Innermost ring diameter in px. Default 140. */
  size?: number;
  className?: string;
}

/** Decorative concentric rings that pulse outward slowly (aria-hidden). Still under reduced motion. */
export function RippleRings({ count = 6, size = 140, className }: RippleRingsProps) {
  return (
    <span aria-hidden="true" className={cx('oc-ripples', className)}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="oc-ripples__ring" style={{ '--oc-i': i, width: size + i * 70, height: size + i * 70, opacity: Math.max(0.08, 0.55 - i * 0.08) } as CSSProperties} />
      ))}
    </span>
  );
}

/* ======================================================================
 * AnimatedList
 * ==================================================================== */

export interface AnimatedListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Accessible name of the list. */
  label?: string;
  /** Text announced politely when an item is added (e.g. new notifications). */
  announce?: (item: T) => string;
  className?: string;
}

/** List whose new items slide in, removed items fade out and the rest glide into place. */
export function AnimatedList<T>({ items, getKey, renderItem, label, announce, className }: AnimatedListProps<T>) {
  const known = useRef<Set<string> | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const keys = new Set(items.map(getKey));
    if (known.current && announce) {
      const added = items.filter((it) => !known.current!.has(getKey(it)));
      if (added.length) setMessage(added.map(announce).join('. '));
    }
    known.current = keys;
  }, [items, getKey, announce]);
  return (
    <>
      <ul className={cx('oc-animlist', className)} aria-label={label}>
        <Presence initial={false}>
          {items.map((item, i) => (
            <Motion
              as="li"
              key={getKey(item)}
              className="oc-animlist__item"
              layout
              initial={{ opacity: 0, y: -14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ spring: { stiffness: 320, damping: 30 } }}
              exitTransition={{ duration: 220, easing: 'out' }}
            >
              {renderItem(item, i)}
            </Motion>
          ))}
        </Presence>
      </ul>
      {announce && (
        <div className="oc-sr-only" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </>
  );
}

/* ======================================================================
 * ScrollProgressBar / Parallax
 * ==================================================================== */

export interface ScrollProgressBarProps {
  /** Track an element's own scroll instead of the page. */
  target?: RefObject<HTMLElement>;
  /** 'fixed' to the top of the viewport (default) or 'static' (in flow). */
  position?: 'fixed' | 'static';
  /** Expose as a labelled progressbar. Default: decorative (aria-hidden). */
  label?: string;
  className?: string;
}

/** Reading-progress bar. Updates via a CSS variable (no re-renders). Not motion-sensitive: it follows the scroll directly. */
export function ScrollProgressBar({ target, position = 'fixed', label, className }: ScrollProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = target ? target.current : window;
    if (target && !t) return;
    return scrollProgress(
      t,
      (p) => {
        el.style.setProperty('--oc-progress', p.toFixed(4));
        if (label) el.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      },
      { within: Boolean(target) },
    );
  }, [target, label]);
  return (
    <div
      ref={ref}
      className={cx('oc-scrollbar', position === 'fixed' && 'oc-scrollbar--fixed', className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? 0 : undefined}
    >
      <div className="oc-scrollbar__fill" />
    </div>
  );
}

export interface ParallaxProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Decorative background layer (aria-hidden). */
  background?: ReactNode;
  /** How far the background travels, as a fraction of the section height (−1…1). Default 0.25. */
  speed?: number;
  children?: ReactNode;
}

/** Section whose background drifts slower than the page while scrolling. Static under reduced motion. */
export function Parallax({ as: Tag = 'section', background, speed = 0.25, className, style, children, ...rest }: ParallaxProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    return scrollProgress(el, (p) => el.style.setProperty('--oc-parallax-p', (p - 0.5).toFixed(4)));
  }, [reduced]);
  return (
    <Tag ref={ref} className={cx('oc-parallax-section', className)} style={{ '--oc-parallax-speed': speed, ...style } as CSSProperties} {...rest}>
      {background && (
        <div aria-hidden="true" className="oc-parallax-section__bg">
          {background}
        </div>
      )}
      <div className="oc-parallax-section__content">{children}</div>
    </Tag>
  );
}

/* ======================================================================
 * AnimatedTabs
 * ==================================================================== */

export interface AnimatedTab {
  value: string;
  label: ReactNode;
  content?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface AnimatedTabsProps {
  tabs: AnimatedTab[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Accessible name of the tab list. */
  label: string;
  /** 'pill' (sliding raised pill, default) or 'underline' (sliding bar). */
  variant?: 'pill' | 'underline';
  /** Stretch tabs to fill the width. */
  fullWidth?: boolean;
  className?: string;
}

/** APG tabs with a sliding selection indicator. Arrow keys (mirrored in RTL), Home and End move and select. */
export function AnimatedTabs({ tabs, value, defaultValue, onChange, label, variant = 'pill', fullWidth, className }: AnimatedTabsProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue ?? tabs.find((t) => !t.disabled)?.value ?? '');
  const selected = value ?? inner;
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const measured = useRef(false);

  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const place = useCallback(() => {
    const tab = tabRefs.current.get(selected);
    const ind = indicatorRef.current;
    if (!tab || !ind) return;
    ind.style.width = `${tab.offsetWidth}px`;
    ind.style.height = variant === 'pill' ? `${tab.offsetHeight}px` : '';
    ind.style.transform = `translate(${tab.offsetLeft}px, ${variant === 'pill' ? tab.offsetTop : 0}px)`;
    if (!measured.current) {
      measured.current = true;
      requestAnimationFrame(() => ind.setAttribute('data-ready', ''));
    }
  }, [selected, variant]);

  useIsoLayoutEffect(place, [place]);
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => place());
    ro.observe(list);
    return () => ro.disconnect();
  }, [place]);

  const enabled = tabs.filter((t) => !t.disabled);
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const rtl = isRtl(e.currentTarget);
    const i = enabled.findIndex((t) => t.value === selected);
    let next = -1;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = (i + 1) % enabled.length;
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = (i - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const v = enabled[next].value;
    select(v);
    tabRefs.current.get(v)?.focus();
  };

  const active = tabs.find((t) => t.value === selected);
  return (
    <div className={cx('oc-atabs', `oc-atabs--${variant}`, fullWidth && 'oc-atabs--full', className)}>
      <div ref={listRef} role="tablist" aria-label={label} className="oc-atabs__list" onKeyDown={onKeyDown}>
        <span ref={indicatorRef} aria-hidden="true" className="oc-atabs__indicator" />
        {tabs.map((t) => {
          const isSel = t.value === selected;
          return (
            <button
              key={t.value}
              ref={(el) => {
                if (el) tabRefs.current.set(t.value, el);
                else tabRefs.current.delete(t.value);
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${t.value}`}
              aria-selected={isSel}
              aria-controls={isSel ? `${id}-panel` : undefined}
              tabIndex={isSel ? 0 : -1}
              disabled={t.disabled}
              className="oc-atabs__tab"
              onClick={() => select(t.value)}
            >
              {t.icon && (
                <span aria-hidden="true" className="oc-atabs__icon">
                  {t.icon}
                </span>
              )}
              {t.label}
            </button>
          );
        })}
      </div>
      {active?.content !== undefined && (
        <div key={active.value} role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active.value}`} tabIndex={0} className="oc-atabs__panel">
          {active.content}
        </div>
      )}
    </div>
  );
}

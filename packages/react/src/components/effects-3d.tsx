// effects-3d — CSS 3D components (no WebGL, zero deps).
// Motion is decorative: every effect is off under prefers-reduced-motion and content stays accessible.
import {
  Children,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ElementType,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { onReducedMotionChange, prefersReducedMotion as motionOff } from '@pelagic-ui/core/motion';
import { cx } from '../utils';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_QUERY).matches;
}

/** Live `prefers-reduced-motion: reduce` flag (false when matchMedia is unavailable). */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(REDUCED_QUERY);
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

/** Toggle the `inert` attribute (not typed in React 18) together with aria-hidden. */
function useInert<T extends HTMLElement>(hidden: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.toggleAttribute('inert', hidden);
  }, [hidden]);
  return ref;
}

function isRtl(el: Element | null): boolean {
  return el?.closest('[dir]')?.getAttribute('dir') === 'rtl';
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/* ---------------------------------------------------------------- TiltCard */

export interface TiltCardProps {
  children: ReactNode;
  /** Maximum tilt in degrees. Default 10. */
  maxTilt?: number;
  /** Show the moving glare highlight. Default true. */
  glare?: boolean;
  /** Wrap children in the default padded body. Default true. */
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Card that tilts in 3D toward the pointer. Static (no tilt) under reduced motion. */
export function TiltCard({ children, maxTilt = 10, glare = true, padded = true, className, style }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    if (!el) return;
    el.removeAttribute('data-active');
    for (const prop of ['--pl-tilt-x', '--pl-tilt-y', '--pl-glare-x', '--pl-glare-y', '--pl-glare-o']) el.style.removeProperty(prop);
  }, []);

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced || prefersReducedMotion() || event.pointerType === 'touch') return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = clamp((clientX - rect.left) / rect.width, 0, 1);
      const py = clamp((clientY - rect.top) / rect.height, 0, 1);
      el.setAttribute('data-active', '');
      el.style.setProperty('--pl-tilt-x', `${((0.5 - py) * 2 * maxTilt).toFixed(2)}deg`);
      el.style.setProperty('--pl-tilt-y', `${((px - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
      if (glare) {
        el.style.setProperty('--pl-glare-x', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--pl-glare-y', `${(py * 100).toFixed(1)}%`);
        el.style.setProperty('--pl-glare-o', '1');
      }
    });
  };

  useEffect(() => {
    if (reduced) reset();
  }, [reduced, reset]);

  return (
    <div ref={ref} className={cx('pl-tilt', className)} style={style} onPointerMove={onPointerMove} onPointerLeave={reset} onPointerCancel={reset}>
      <div className="pl-tilt__inner">
        {padded ? <div className="pl-tilt__body">{children}</div> : children}
        {glare && <span className="pl-tilt__glare" aria-hidden="true" />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- FlipCard */

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Flip button text (its accessible name). Default "Show back"; aria-pressed tells AT which side is shown. */
  flipLabel?: ReactNode;
  flipped?: boolean;
  defaultFlipped?: boolean;
  onFlippedChange?: (flipped: boolean) => void;
  /** Minimum card height (CSS length). */
  height?: string;
  className?: string;
}

/** Two-sided card flipped by a real toggle button; the hidden side is aria-hidden + inert. Crossfades under reduced motion. */
export function FlipCard({
  front,
  back,
  flipLabel = 'Show back',
  flipped,
  defaultFlipped = false,
  onFlippedChange,
  height,
  className,
}: FlipCardProps) {
  const [inner, setInner] = useState(defaultFlipped);
  const isFlipped = flipped ?? inner;
  const frontRef = useInert<HTMLDivElement>(isFlipped);
  const backRef = useInert<HTMLDivElement>(!isFlipped);
  const id = useId();
  const toggle = () => {
    const next = !isFlipped;
    if (flipped === undefined) setInner(next);
    onFlippedChange?.(next);
  };
  return (
    <div
      className={cx('pl-flip', className)}
      data-flipped={isFlipped ? '' : undefined}
      style={height ? ({ '--pl-flip-height': height } as CSSProperties) : undefined}
    >
      <div className="pl-flip__inner" id={`${id}-faces`}>
        <div ref={frontRef} className="pl-flip__face pl-flip__face--front" aria-hidden={isFlipped || undefined}>
          {front}
        </div>
        <div ref={backRef} className="pl-flip__face pl-flip__face--back" aria-hidden={!isFlipped || undefined}>
          {back}
        </div>
      </div>
      <button
        type="button"
        className="pl-btn pl-btn--secondary pl-btn--sm pl-flip__toggle"
        aria-pressed={isFlipped}
        aria-controls={`${id}-faces`}
        onClick={toggle}
      >
        {flipLabel}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- CubeCarousel / Carousel3D */

const subscribeMotion = (cb: () => void) => onReducedMotionChange(cb);
/** Reduced motion from the OS or `<html data-a11y-motion="off">` (carousels become plain sliders). */
function useMotionOff(): boolean {
  return useSyncExternalStore(subscribeMotion, motionOff, () => false);
}

/** Horizontal swipe / mouse drag. Reports live offset (px) and fires onSwipe(+1 next | -1 previous). */
function useSwipe({ onSwipe, onDrag, disabled }: { onSwipe: (dir: 1 | -1) => void; onDrag?: (dx: number, width: number) => void; disabled?: boolean }) {
  const s = useRef<{ id: number; x: number; y: number; dx: number; dragging: boolean; width: number; rtl: boolean } | null>(null);
  const suppressClick = useRef(false);
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      s.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dragging: false, width: e.currentTarget.getBoundingClientRect().width || 1, rtl: isRtl(e.currentTarget) };
      suppressClick.current = false;
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const st = s.current;
      if (!st || st.id !== e.pointerId) return;
      const dx = e.clientX - st.x;
      const dy = e.clientY - st.y;
      if (!st.dragging) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        st.dragging = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      st.dx = dx;
      onDrag?.(st.rtl ? -dx : dx, st.width);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      const st = s.current;
      s.current = null;
      if (!st || st.id !== e.pointerId || !st.dragging) return;
      suppressClick.current = true;
      onDrag?.(0, st.width);
      const dx = st.rtl ? -st.dx : st.dx;
      if (Math.abs(dx) > Math.min(64, st.width * 0.15)) onSwipe(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      if (s.current) onDrag?.(0, s.current.width);
      s.current = null;
    },
    onClickCapture: (e: ReactMouseEvent<HTMLElement>) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}

const PlayPauseIcon = ({ playing }: { playing: boolean }) =>
  playing ? (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <rect x="4" y="3.5" width="2.75" height="9" rx="0.75" fill="currentColor" />
      <rect x="9.25" y="3.5" width="2.75" height="9" rx="0.75" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
    </svg>
  );

const ChevronIcon = ({ dir }: { dir: 'prev' | 'next' }) => (
  <svg className="pl-c3d__chevron" data-dir={dir} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d={dir === 'prev' ? 'M10 3.5L5.5 8l4.5 4.5' : 'M6 3.5L10.5 8 6 12.5'} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Shared carousel state: index, autoplay with hover/focus hold, keyboard and RTL. */
function useCarousel({ count, index, defaultIndex, onIndexChange, autoplay, loop = true }: { count: number; index?: number; defaultIndex: number; onIndexChange?: (i: number) => void; autoplay?: number; loop?: boolean }) {
  const [inner, setInner] = useState(defaultIndex);
  const current = clamp(index ?? inner, 0, Math.max(0, count - 1));
  const reduced = useMotionOff();
  // Starts as the server rendered it; the effect below stops it under reduced motion (no hydration mismatch).
  const [playing, setPlaying] = useState(Boolean(autoplay));
  const [hold, setHold] = useState(false);
  const [rtl, setRtl] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => setRtl(isRtl(rootRef.current)), []);
  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  const go = useCallback(
    (to: number) => {
      if (!count) return;
      const next = loop ? ((to % count) + count) % count : clamp(to, 0, count - 1);
      if (index === undefined) setInner(next);
      onIndexChange?.(next);
    },
    [count, index, onIndexChange, loop],
  );

  const rotating = Boolean(autoplay) && playing && !hold;
  useEffect(() => {
    if (!rotating || !autoplay) return;
    const t = window.setInterval(() => go(current + 1 >= count && !loop ? 0 : current + 1), Math.max(2000, autoplay));
    return () => window.clearInterval(t);
  }, [rotating, autoplay, current, go, count, loop]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let handled = true;
    if (event.key === forward) go(current + 1);
    else if (event.key === back) go(current - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(count - 1);
    else handled = false;
    if (handled) event.preventDefault();
  };

  const holdHandlers = {
    onPointerEnter: () => setHold(true),
    onPointerLeave: () => setHold(false),
    onFocus: () => setHold(true),
    onBlur: (e: ReactFocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false);
    },
  };

  return { current, go, playing, setPlaying, rotating, rtl, rootRef, onKeyDown, holdHandlers, reduced };
}

export interface CubeSlide {
  /** Optional slide title, appended to the "Slide n of m" label. */
  title?: string;
  content: ReactNode;
}

export interface CubeCarouselProps {
  /** Accessible name of the carousel. */
  label: string;
  slides: CubeSlide[];
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Autoplay interval in ms. Off by default; never starts under reduced motion. */
  autoplay?: number;
  /** Panel width / height (CSS lengths). */
  width?: string;
  height?: string;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
}

/** 3D ring (a cube for 4 slides) carousel following the APG carousel pattern. Swipe or drag to turn; flat under reduced motion. */
export function CubeCarousel({
  label,
  slides,
  index,
  defaultIndex = 0,
  onIndexChange,
  autoplay,
  width,
  height,
  prevLabel = 'Previous slide',
  nextLabel = 'Next slide',
  className,
}: CubeCarouselProps) {
  const count = slides.length;
  const c = useCarousel({ count, index, defaultIndex, onIndexChange, autoplay });
  const id = useId();
  const [drag, setDrag] = useState(0);
  const swipe = useSwipe({ onSwipe: (d) => c.go(c.current + d), onDrag: (dx, w) => setDrag(dx / w), disabled: count < 2 });

  const style = {
    '--pl-cube-n': Math.max(count, 3),
    '--pl-cube-index': c.current - drag,
    ...(width ? { '--pl-cube-size': width } : {}),
    ...(height ? { '--pl-cube-h': height } : {}),
  } as CSSProperties;

  return (
    <section
      ref={c.rootRef}
      className={cx('pl-cube', className)}
      aria-roledescription="carousel"
      aria-label={label}
      style={style}
      data-static={c.reduced ? '' : undefined}
      data-dragging={drag ? '' : undefined}
      onKeyDown={c.onKeyDown}
      {...c.holdHandlers}
    >
      <div className="pl-cube__controls">
        {autoplay ? (
          <button
            type="button"
            className="pl-btn pl-btn--ghost pl-btn--sm pl-btn--icon"
            onClick={() => c.setPlaying((p) => !p)}
            aria-label={c.playing ? 'Stop automatic slide show' : 'Start automatic slide show'}
          >
            <PlayPauseIcon playing={c.playing} />
          </button>
        ) : null}
        <button type="button" className="pl-btn pl-btn--secondary pl-btn--sm pl-btn--icon" aria-controls={`${id}-slides`} aria-label={prevLabel} onClick={() => c.go(c.current - 1)}>
          <ChevronIcon dir="prev" />
        </button>
        <span className="pl-cube__status" aria-hidden="true">
          {count ? c.current + 1 : 0} / {count}
        </span>
        <button type="button" className="pl-btn pl-btn--secondary pl-btn--sm pl-btn--icon" aria-controls={`${id}-slides`} aria-label={nextLabel} onClick={() => c.go(c.current + 1)}>
          <ChevronIcon dir="next" />
        </button>
      </div>
      <div className="pl-cube__viewport" id={`${id}-slides`} aria-live={c.rotating ? 'off' : 'polite'} {...swipe}>
        <div className="pl-cube__stage">
          {slides.map((slide, i) => (
            <CubeSlidePanel key={i} i={i} count={count} active={i === c.current} title={slide.title}>
              {slide.content}
            </CubeSlidePanel>
          ))}
        </div>
      </div>
    </section>
  );
}

function CubeSlidePanel({ i, count, active, title, children }: { i: number; count: number; active: boolean; title?: string; children: ReactNode }) {
  const ref = useInert<HTMLDivElement>(!active);
  return (
    <div
      ref={ref}
      className="pl-cube__slide"
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${i + 1} of ${count}${title ? `: ${title}` : ''}`}
      aria-hidden={!active || undefined}
      style={{ '--pl-cube-i': i } as CSSProperties}
    >
      {children}
    </div>
  );
}

export interface Carousel3DProps {
  /** Accessible name of the carousel. */
  label: string;
  slides: CubeSlide[];
  /** 'coverflow' (default): tilted neighbours; 'ring': slides on a rotating cylinder; 'stack': a deck of cards. */
  mode?: 'coverflow' | 'ring' | 'stack';
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Autoplay interval in ms (min 2000). Shows a pause button; pauses on hover and focus; never under reduced motion. */
  autoplay?: number;
  /** Wrap around at the ends. Default true. */
  loop?: boolean;
  /** Slide width / stage height (CSS lengths). */
  slideWidth?: string;
  height?: string;
  /** Slide picker dots. Default true. */
  showDots?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  playLabel?: string;
  pauseLabel?: string;
  /** Accessible name of each slide. */
  slideLabel?: (index: number, count: number, title?: string) => string;
  className?: string;
}

/**
 * Perspective carousel with coverflow, ring and stack modes. APG carousel semantics: labelled
 * region, slide groups, rotation control first, live region when not rotating. Drag/swipe,
 * arrow keys (mirrored in RTL), Home/End and dots. Reduced motion turns it into a plain slider.
 */
export function Carousel3D({
  label,
  slides,
  mode = 'coverflow',
  index,
  defaultIndex = 0,
  onIndexChange,
  autoplay,
  loop = true,
  slideWidth,
  height,
  showDots = true,
  prevLabel = 'Previous slide',
  nextLabel = 'Next slide',
  playLabel = 'Start automatic slide show',
  pauseLabel = 'Stop automatic slide show',
  slideLabel = (i, n, t) => `${i} of ${n}${t ? `: ${t}` : ''}`,
  className,
}: Carousel3DProps) {
  const count = slides.length;
  const c = useCarousel({ count, index, defaultIndex, onIndexChange, autoplay, loop });
  const id = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const swipe = useSwipe({
    onSwipe: (d) => c.go(c.current + d),
    onDrag: (dx, w) => {
      stageRef.current?.style.setProperty('--pl-drag', (dx / Math.max(1, w * 0.5)).toFixed(3));
      setDragging(dx !== 0);
    },
    disabled: count < 2,
  });

  const offsetOf = (i: number) => {
    let off = i - c.current;
    if (loop && count > 2) {
      if (off > count / 2) off -= count;
      if (off < -count / 2) off += count;
    }
    return off;
  };

  const atStart = !loop && c.current === 0;
  const atEnd = !loop && c.current === count - 1;

  return (
    <section
      ref={c.rootRef}
      className={cx('pl-c3d', className)}
      data-mode={mode}
      data-static={c.reduced ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      aria-roledescription="carousel"
      aria-label={label}
      style={{ ...(slideWidth ? { '--pl-c3d-w': slideWidth } : {}), ...(height ? { '--pl-c3d-h': height } : {}), '--pl-c3d-n': Math.max(count, 3) } as CSSProperties}
      onKeyDown={c.onKeyDown}
      {...c.holdHandlers}
    >
      {autoplay && !c.reduced ? (
        <button type="button" className="pl-c3d__play" aria-label={c.playing ? pauseLabel : playLabel} onClick={() => c.setPlaying((p) => !p)}>
          <PlayPauseIcon playing={c.playing} />
        </button>
      ) : null}
      <div
        className="pl-c3d__viewport"
        {...swipe}
        onClick={(e) => {
          if (c.reduced) return;
          // Pointer users can click a neighbour (neighbours are inert, so the click lands here).
          if ((e.target as HTMLElement).closest('.pl-c3d__slide[data-pos="current"]')) return;
          const r = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - r.left) / (r.width || 1) - 0.5;
          if (Math.abs(x) < 0.18) return;
          const forward = c.rtl ? x < 0 : x > 0;
          if (forward ? !atEnd : !atStart) c.go(c.current + (forward ? 1 : -1));
        }}
      >
        <div ref={stageRef} className="pl-c3d__stage" id={`${id}-slides`} aria-live={c.rotating ? 'off' : 'polite'}>
          {slides.map((slide, i) => {
            const off = offsetOf(i);
            return (
              <Carousel3DSlide
                key={i}
                active={off === 0}
                off={off}
                label={slideLabel(i + 1, count, slide.title)}
              >
                {slide.content}
              </Carousel3DSlide>
            );
          })}
        </div>
      </div>
      <div className="pl-c3d__controls">
        <button type="button" className="pl-c3d__nav" aria-controls={`${id}-slides`} aria-label={prevLabel} disabled={atStart} onClick={() => c.go(c.current - 1)}>
          <ChevronIcon dir="prev" />
        </button>
        {showDots && count > 1 ? (
          <div className="pl-c3d__dots" role="group" aria-label="Choose slide">
            {slides.map((slide, i) => (
              <button
                key={i}
                type="button"
                className="pl-c3d__dot"
                aria-label={`${i + 1}${slide.title ? `: ${slide.title}` : ''}`}
                aria-current={i === c.current ? 'true' : undefined}
                aria-controls={`${id}-slides`}
                onClick={() => c.go(i)}
              />
            ))}
          </div>
        ) : (
          <span className="pl-c3d__status" aria-hidden="true">
            {count ? c.current + 1 : 0} / {count}
          </span>
        )}
        <button type="button" className="pl-c3d__nav" aria-controls={`${id}-slides`} aria-label={nextLabel} disabled={atEnd} onClick={() => c.go(c.current + 1)}>
          <ChevronIcon dir="next" />
        </button>
      </div>
    </section>
  );
}

function Carousel3DSlide({ active, off, label, children }: { active: boolean; off: number; label: string; children: ReactNode }) {
  const ref = useInert<HTMLDivElement>(!active);
  const abs = Math.abs(off);
  return (
    <div
      ref={ref}
      className="pl-c3d__slide"
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={!active || undefined}
      data-pos={off === 0 ? 'current' : off < 0 ? 'before' : 'after'}
      data-far={abs > 2 ? '' : undefined}
      style={{ '--pl-off': off, '--pl-abs': abs, '--pl-sign': Math.sign(off), zIndex: 100 - abs } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- ParallaxLayers */

export interface ParallaxLayer {
  content: ReactNode;
  /** Movement factor; 0 = static, larger = moves more (px per unit of pointer offset, ±1). Typical 4–40. */
  depth: number;
  /** Mark purely decorative layers so AT skips them. */
  decorative?: boolean;
  className?: string;
}

export interface ParallaxLayersProps {
  layers: ParallaxLayer[];
  /** What drives the offset. Default 'pointer'. */
  trigger?: 'pointer' | 'scroll';
  className?: string;
  style?: CSSProperties;
}

/** Stacked layers that shift by depth with pointer or scroll. Static under reduced motion. */
export function ParallaxLayers({ layers, trigger = 'pointer', className, style }: ParallaxLayersProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let frame = 0;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--pl-px', x.toFixed(3));
        el.style.setProperty('--pl-py', y.toFixed(3));
      });
    };
    const clear = () => {
      cancelAnimationFrame(frame);
      el.style.removeProperty('--pl-px');
      el.style.removeProperty('--pl-py');
    };
    if (trigger === 'pointer') {
      const move = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        set(clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1), clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1));
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', clear);
      return () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', clear);
        clear();
      };
    }
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      set(0, clamp(((r.top + r.height / 2) / vh - 0.5) * 2, -1, 1));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clear();
    };
  }, [trigger, reduced]);

  return (
    <div ref={ref} className={cx('pl-parallax', className)} style={style}>
      {layers.map((layer, i) => (
        <div
          key={i}
          className={cx('pl-parallax__layer', layer.className)}
          aria-hidden={layer.decorative || undefined}
          style={{ '--pl-depth': layer.depth } as CSSProperties}
        >
          {layer.content}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Text3D */

export interface Text3DProps {
  children: ReactNode;
  /** Element to render. Default 'h2'. */
  as?: ElementType;
  /** Extrusion depth in px layers (1–16). Default 6. */
  depth?: number;
  /** 'primary' (accent ink) or 'surface' (body text color). */
  tone?: 'primary' | 'surface';
  className?: string;
  style?: CSSProperties;
}

/** Heading with a layered text-shadow extrusion. The real text stays selectable; the effect is purely visual. */
export function Text3D({ children, as: Tag = 'h2', depth = 6, tone = 'primary', className, style }: Text3DProps) {
  const n = clamp(Math.round(depth), 1, 16);
  const layers = Array.from({ length: n }, (_, i) => `calc(var(--pl-dir3d) * ${i + 1}px) ${i + 1}px 0 var(--pl-text3d-side)`);
  layers.push(`calc(var(--pl-dir3d) * ${n + 2}px) ${n + 4}px ${n + 4}px color-mix(in srgb, var(--pl-text) 25%, transparent)`);
  return (
    <Tag className={cx('pl-text3d', tone === 'surface' && 'pl-text3d--surface', className)} style={{ textShadow: layers.join(', '), ...style }}>
      {children}
    </Tag>
  );
}
/** Alias of Text3D. */
export const ExtrudedText = Text3D;

/* ---------------------------------------------------------------- Floating3DIcon / OrbitBadge */

export interface Floating3DIconProps {
  /** Icon or glyph; rendered aria-hidden (decorative). */
  icon: ReactNode;
  /** CSS size. Default 4rem. */
  size?: string;
  className?: string;
}

/** Decorative floating 3D tile (aria-hidden). */
export function Floating3DIcon({ icon, size, className }: Floating3DIconProps) {
  return (
    <span className={cx('pl-float3d', className)} aria-hidden="true" style={size ? ({ '--pl-float-size': size } as CSSProperties) : undefined}>
      <span className="pl-float3d__body">{icon}</span>
    </span>
  );
}

export interface OrbitBadgeProps {
  /** Short glyph/text in the core (decorative). */
  children?: ReactNode;
  size?: string;
  className?: string;
}

/** Decorative badge with satellites orbiting on a tilted ring (aria-hidden). */
export function OrbitBadge({ children, size, className }: OrbitBadgeProps) {
  return (
    <span className={cx('pl-orbit', className)} aria-hidden="true" style={size ? ({ '--pl-orbit-size': size } as CSSProperties) : undefined}>
      <span className="pl-orbit__ring">
        <span className="pl-orbit__dot" />
        <span className="pl-orbit__dot" />
      </span>
      <span className="pl-orbit__core">{children}</span>
    </span>
  );
}

/* ---------------------------------------------------------------- Perspective3DStack */

export interface Perspective3DStackProps {
  /** Items (each becomes an <li>). Pass children or `items`. */
  items?: ReactNode[];
  children?: ReactNode;
  /** Accessible name for the list. */
  label?: string;
  /** Keep the stack fanned out. */
  open?: boolean;
  className?: string;
}

/** Cards stacked in depth that fan out on hover/focus. Renders a real list (ul/li). */
export function Perspective3DStack({ items, children, label, open = false, className }: Perspective3DStackProps) {
  const list = items ?? Children.toArray(children);
  return (
    <ul className={cx('pl-stack3d', className)} aria-label={label} data-open={open ? '' : undefined}>
      {list.map((item, i) => (
        <li key={i} className="pl-stack3d__item" style={{ '--pl-i': i } as CSSProperties}>
          {item}
        </li>
      ))}
    </ul>
  );
}

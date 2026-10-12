// effects-3d — CSS 3D components (no WebGL, zero deps).
// Motion is decorative: every effect is off under prefers-reduced-motion and content stays accessible.
import {
  Children,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
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
    for (const prop of ['--nw-tilt-x', '--nw-tilt-y', '--nw-glare-x', '--nw-glare-y', '--nw-glare-o']) el.style.removeProperty(prop);
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
      el.style.setProperty('--nw-tilt-x', `${((0.5 - py) * 2 * maxTilt).toFixed(2)}deg`);
      el.style.setProperty('--nw-tilt-y', `${((px - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
      if (glare) {
        el.style.setProperty('--nw-glare-x', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--nw-glare-y', `${(py * 100).toFixed(1)}%`);
        el.style.setProperty('--nw-glare-o', '1');
      }
    });
  };

  useEffect(() => {
    if (reduced) reset();
  }, [reduced, reset]);

  return (
    <div ref={ref} className={cx('nw-tilt', className)} style={style} onPointerMove={onPointerMove} onPointerLeave={reset} onPointerCancel={reset}>
      <div className="nw-tilt__inner">
        {padded ? <div className="nw-tilt__body">{children}</div> : children}
        {glare && <span className="nw-tilt__glare" aria-hidden="true" />}
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
      className={cx('nw-flip', className)}
      data-flipped={isFlipped ? '' : undefined}
      style={height ? ({ '--nw-flip-height': height } as CSSProperties) : undefined}
    >
      <div className="nw-flip__inner" id={`${id}-faces`}>
        <div ref={frontRef} className="nw-flip__face nw-flip__face--front" aria-hidden={isFlipped || undefined}>
          {front}
        </div>
        <div ref={backRef} className="nw-flip__face nw-flip__face--back" aria-hidden={!isFlipped || undefined}>
          {back}
        </div>
      </div>
      <button
        type="button"
        className="nw-btn nw-btn--secondary nw-btn--sm nw-flip__toggle"
        aria-pressed={isFlipped}
        aria-controls={`${id}-faces`}
        onClick={toggle}
      >
        {flipLabel}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- CubeCarousel */

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

/** 3D ring (a cube for 4 slides) carousel following the APG carousel pattern. */
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
  const [inner, setInner] = useState(defaultIndex);
  const current = clamp(index ?? inner, 0, Math.max(0, count - 1));
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(Boolean(autoplay) && !prefersReducedMotion());
  const [hold, setHold] = useState(false); // hover or focus inside
  const [rtl, setRtl] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const id = useId();

  useEffect(() => setRtl(isRtl(rootRef.current)), []);
  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  const go = useCallback(
    (to: number) => {
      if (!count) return;
      const next = ((to % count) + count) % count;
      if (index === undefined) setInner(next);
      onIndexChange?.(next);
    },
    [count, index, onIndexChange],
  );

  const rotating = Boolean(autoplay) && playing && !hold;
  useEffect(() => {
    if (!rotating || !autoplay) return;
    const t = window.setInterval(() => go(current + 1), autoplay);
    return () => window.clearInterval(t);
  }, [rotating, autoplay, current, go]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
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

  const style = {
    '--nw-cube-n': Math.max(count, 3),
    '--nw-cube-index': current,
    ...(width ? { '--nw-cube-size': width } : {}),
    ...(height ? { '--nw-cube-h': height } : {}),
  } as CSSProperties;

  return (
    <section
      ref={rootRef}
      className={cx('nw-cube', className)}
      aria-roledescription="carousel"
      aria-label={label}
      style={style}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false);
      }}
    >
      <div className="nw-cube__controls">
        {autoplay ? (
          <button
            type="button"
            className="nw-btn nw-btn--ghost nw-btn--sm"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Stop automatic slide show' : 'Start automatic slide show'}
          >
            {playing ? '❚❚' : '▶'}
          </button>
        ) : null}
        <button type="button" className="nw-btn nw-btn--secondary nw-btn--sm nw-btn--icon" aria-controls={`${id}-slides`} aria-label={prevLabel} onClick={() => go(current - 1)}>
          <span aria-hidden="true">{rtl ? '›' : '‹'}</span>
        </button>
        <span className="nw-cube__status" aria-hidden="true">
          {count ? current + 1 : 0} / {count}
        </span>
        <button type="button" className="nw-btn nw-btn--secondary nw-btn--sm nw-btn--icon" aria-controls={`${id}-slides`} aria-label={nextLabel} onClick={() => go(current + 1)}>
          <span aria-hidden="true">{rtl ? '‹' : '›'}</span>
        </button>
      </div>
      <div className="nw-cube__viewport" id={`${id}-slides`} aria-live={rotating ? 'off' : 'polite'}>
        <div className="nw-cube__stage">
          {slides.map((slide, i) => (
            <CubeSlidePanel key={i} i={i} count={count} active={i === current} title={slide.title}>
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
      className="nw-cube__slide"
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${i + 1} of ${count}${title ? `: ${title}` : ''}`}
      aria-hidden={!active || undefined}
      style={{ '--nw-cube-i': i } as CSSProperties}
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
        el.style.setProperty('--nw-px', x.toFixed(3));
        el.style.setProperty('--nw-py', y.toFixed(3));
      });
    };
    const clear = () => {
      cancelAnimationFrame(frame);
      el.style.removeProperty('--nw-px');
      el.style.removeProperty('--nw-py');
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
    <div ref={ref} className={cx('nw-parallax', className)} style={style}>
      {layers.map((layer, i) => (
        <div
          key={i}
          className={cx('nw-parallax__layer', layer.className)}
          aria-hidden={layer.decorative || undefined}
          style={{ '--nw-depth': layer.depth } as CSSProperties}
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
  const layers = Array.from({ length: n }, (_, i) => `calc(var(--nw-dir3d) * ${i + 1}px) ${i + 1}px 0 var(--nw-text3d-side)`);
  layers.push(`calc(var(--nw-dir3d) * ${n + 2}px) ${n + 4}px ${n + 4}px color-mix(in srgb, var(--nw-text) 25%, transparent)`);
  return (
    <Tag className={cx('nw-text3d', tone === 'surface' && 'nw-text3d--surface', className)} style={{ textShadow: layers.join(', '), ...style }}>
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
    <span className={cx('nw-float3d', className)} aria-hidden="true" style={size ? ({ '--nw-float-size': size } as CSSProperties) : undefined}>
      <span className="nw-float3d__body">{icon}</span>
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
    <span className={cx('nw-orbit', className)} aria-hidden="true" style={size ? ({ '--nw-orbit-size': size } as CSSProperties) : undefined}>
      <span className="nw-orbit__ring">
        <span className="nw-orbit__dot" />
        <span className="nw-orbit__dot" />
      </span>
      <span className="nw-orbit__core">{children}</span>
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
    <ul className={cx('nw-stack3d', className)} aria-label={label} data-open={open ? '' : undefined}>
      {list.map((item, i) => (
        <li key={i} className="nw-stack3d__item" style={{ '--nw-i': i } as CSSProperties}>
          {item}
        </li>
      ))}
    </ul>
  );
}

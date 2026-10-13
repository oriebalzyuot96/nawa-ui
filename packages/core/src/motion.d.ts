/** Pelagic motion: dependency-free animation engine. Every API jumps to its end state under reduced motion. */

export type EasingFunction = (t: number) => number;
export type EasingName = 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut' | 'expoOut' | 'out' | 'inOut' | 'backOut' | 'anticipate';
/** A named easing, any CSS timing function string, or a JS easing function. */
export type Easing = EasingName | (string & {}) | EasingFunction;

export interface SpringConfig {
  /** Default 170. */
  stiffness?: number;
  /** Default 26. */
  damping?: number;
  /** Default 1. */
  mass?: number;
  /** Initial velocity in units of the distance per second. Default 0. */
  velocity?: number;
  restDelta?: number;
  maxDuration?: number;
}

export interface SpringResult {
  /** Natural settle time in ms. */
  duration: number;
  /** Progress over the normalised duration. */
  easing: EasingFunction;
  /** Progress at time t (seconds). */
  at: (seconds: number) => number;
  /** CSS `linear()` timing function. */
  css: string;
}

export type StaggerFunction = (index: number, total: number) => number;

export interface AnimationOptions {
  /** ms. Default 400 (or the spring's natural duration). */
  duration?: number;
  easing?: Easing;
  /** Physics spring instead of a duration + easing. */
  spring?: boolean | SpringConfig;
  /** ms, or a function of (index, total). */
  delay?: number | StaggerFunction;
  /** ms between targets, or a stagger() function. */
  stagger?: number | StaggerFunction;
  repeat?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  /** Keep the end state as inline styles (default true). */
  commit?: boolean;
  /** Force the reduced-motion path (true) or motion (false). Default: the user's preference. */
  reduced?: boolean;
  onComplete?: () => void;
}

export interface AnimationControls {
  finished: Promise<void>;
  cancel(): void;
  finish(): void;
  pause(): void;
  play(): void;
  reverse(): void;
  animations: unknown[];
}

export type MotionValue = string | number;
export type MotionTarget = Element | Element[] | NodeListOf<Element> | string | null | undefined;
/** CSS properties (camelCase or --custom) plus x, y, z, scale, scaleX, scaleY, rotate, rotateX, rotateY, skewX, skewY. */
export type MotionKeyframes = Record<string, MotionValue | MotionValue[] | undefined> | Array<Record<string, MotionValue | undefined>>;

export declare function prefersReducedMotion(): boolean;
export declare function onReducedMotionChange(cb: (reduced: boolean) => void): () => void;

export declare function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction;
export declare const easings: Record<EasingName, EasingFunction>;
export declare const cssEasings: Record<EasingName, string>;
export declare function toLinearEasing(fn: EasingFunction, points?: number): string;
export declare function spring(config?: SpringConfig): SpringResult;
export declare function normalizeKeyframes(el: Element | null, keyframes: MotionKeyframes): Array<Record<string, string>>;

export declare function animate(targets: MotionTarget, keyframes: MotionKeyframes, options?: AnimationOptions): AnimationControls;
export declare function stagger(each?: number, options?: { start?: number; from?: 'first' | 'last' | 'center' | number; ease?: Easing }): StaggerFunction;

export type TimelinePosition = number | '<' | `<${'+' | '-'}${number}` | `${'+' | '-'}=${number}`;
export interface Timeline {
  add(targets: MotionTarget, keyframes: MotionKeyframes, options?: AnimationOptions, at?: TimelinePosition | string): Timeline;
  call(fn: () => void, at?: TimelinePosition | string): Timeline;
  readonly duration: number;
  play(): AnimationControls;
}
export declare function timeline(defaults?: AnimationOptions): Timeline;
export type TimelineStep = [MotionTarget, MotionKeyframes, AnimationOptions?, (TimelinePosition | string)?];
export declare function sequence(steps: TimelineStep[], defaults?: AnimationOptions): AnimationControls;
export declare function parallel(steps: TimelineStep[], defaults?: AnimationOptions): AnimationControls;

export interface LayoutSnapshot {
  container: Element | null;
  items: Map<Element | string, DOMRect>;
  selector?: string;
  rect: DOMRect | null;
}
export interface LayoutOptions extends AnimationOptions {
  /** Items to track. Default: direct children. Items are matched by `data-flip-id` or identity. */
  selector?: string;
  /** Also animate size changes (scale). Default false. */
  scale?: boolean;
  /** Animate the container's height change. Default false. */
  height?: boolean;
  /** Fade/scale in items that did not exist before. Default true. */
  enter?: boolean;
}
export declare function measureLayout(container: Element | null, selector?: string): LayoutSnapshot;
export declare function playLayout(snapshot: LayoutSnapshot, options?: LayoutOptions): AnimationControls;
export declare function animateLayout(container: Element | null, mutate?: () => void | Promise<unknown>, options?: LayoutOptions): AnimationControls;

export interface ScrollProgressOptions {
  /** Progress of scrolling inside `target` (a scroll container). */
  within?: boolean;
  axis?: 'x' | 'y';
  /** 'cover' (enter → leave, default) or 'contain' (fully visible at the bottom → at the top). */
  range?: 'cover' | 'contain';
}
export declare function scrollProgress(target: Element | Window | Document | null | undefined, cb: (progress: number) => void, options?: ScrollProgressOptions): () => void;

export interface InViewOptions {
  root?: Element | Document | null;
  margin?: string;
  amount?: number | 'some' | 'all';
  once?: boolean;
}
export declare function inView(
  target: MotionTarget,
  onEnter: (entry: IntersectionObserverEntry | { target: Element; isIntersecting: boolean; intersectionRatio: number }) => void | ((entry: IntersectionObserverEntry) => void),
  options?: InViewOptions,
): () => void;

export declare function drawPath(targets: MotionTarget, options?: AnimationOptions & { reverse?: boolean }): AnimationControls;
export declare function tween(from: number, to: number, onUpdate: (value: number) => void, options?: AnimationOptions): AnimationControls;

export interface SpringValue {
  get(): number;
  getVelocity(): number;
  /** Animate toward a new target (keeps current velocity). */
  set(target: number): void;
  /** Jump without animating. */
  jump(value: number): void;
  subscribe(listener: (value: number) => void): () => void;
  stop(): void;
}
export declare function springValue(initial: number, config?: SpringConfig & { restSpeed?: number }, onUpdate?: (value: number) => void): SpringValue;

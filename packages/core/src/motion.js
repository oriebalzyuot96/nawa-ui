// Orca motion — a small, dependency-free animation engine shared by every framework package.
//
//   animate(targets, keyframes, options)   WAAPI with a requestAnimationFrame fallback
//   spring(config)                          analytic damped-spring easing (+ CSS linear() export)
//   timeline() / sequence() / parallel()    choreography with absolute and relative offsets
//   stagger(each, options)                  per-index delays (from first, last, center or an index)
//   measureLayout / playLayout / animateLayout   FLIP for reorders and size changes
//   scrollProgress / inView                 scroll-linked progress and visibility
//   drawPath / tween / springValue          SVG stroke drawing, number tweens, retargetable springs
//
// Reduced motion is global: under `prefers-reduced-motion: reduce`, or when <html> carries
// `data-a11y-motion="off"` (or "reduce"), every animation jumps straight to its end state and
// every promise resolves immediately. Nothing here ever loops on its own.

const hasWindow = typeof window !== 'undefined';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const now = () => (hasWindow && window.performance ? window.performance.now() : Date.now());
const raf = (cb) => (hasWindow && window.requestAnimationFrame ? window.requestAnimationFrame(cb) : setTimeout(() => cb(now()), 16));
const caf = (id) => (hasWindow && window.cancelAnimationFrame ? window.cancelAnimationFrame(id) : clearTimeout(id));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const noop = () => {};

/* ------------------------------------------------------------------ reduced motion */

/** True when the user (OS setting) or the page (`<html data-a11y-motion="off">`) asks for no motion. */
export function prefersReducedMotion() {
  if (typeof document !== 'undefined' && document.documentElement) {
    const attr = document.documentElement.getAttribute('data-a11y-motion');
    if (attr === 'off' || attr === 'reduce' || attr === 'reduced') return true;
    if (attr === 'on' || attr === 'full') return false;
  }
  return hasWindow && typeof window.matchMedia === 'function' && Boolean(window.matchMedia(REDUCED_QUERY)?.matches);
}

/** Calls `cb(reduced)` whenever the OS setting or `data-a11y-motion` on <html> changes. Returns a cleanup. */
export function onReducedMotionChange(cb) {
  if (!hasWindow) return noop;
  const fire = () => cb(prefersReducedMotion());
  const cleanups = [];
  if (typeof window.matchMedia === 'function') {
    const mql = window.matchMedia(REDUCED_QUERY);
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', fire);
      cleanups.push(() => mql.removeEventListener('change', fire));
    }
  }
  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    const mo = new MutationObserver(fire);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-a11y-motion'] });
    cleanups.push(() => mo.disconnect());
  }
  return () => cleanups.forEach((c) => c());
}

/* ------------------------------------------------------------------ easing */

/** CSS-compatible cubic-bezier easing function. */
export function cubicBezier(x1, y1, x2, y2) {
  if (x1 === y1 && x2 === y2) return (t) => t;
  const a = (p1, p2) => 1 - 3 * p2 + 3 * p1;
  const b = (p1, p2) => 3 * p2 - 6 * p1;
  const c = (p1) => 3 * p1;
  const calc = (t, p1, p2) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t, p1, p2) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  const solveX = (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      const err = calc(t, x1, x2) - x;
      if (Math.abs(err) < 1e-7) return t;
      t -= err / s;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = calc(t, x1, x2);
      if (Math.abs(v - x) < 1e-7) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : calc(solveX(x), y1, y2));
}

const BEZIERS = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  /** = --oc-ease (expressive out) */
  expoOut: [0.16, 1, 0.3, 1],
  /** = --oc-ease-out */
  out: [0.22, 1, 0.36, 1],
  /** = --oc-ease-in-out */
  inOut: [0.65, 0, 0.35, 1],
  /** = --oc-ease-spring (overshoot) */
  backOut: [0.34, 1.56, 0.64, 1],
  anticipate: [0.36, 0, 0.66, -0.56],
};

/** Named easing functions (`t ∈ [0, 1] → progress`). Names match the `--oc-ease*` tokens. */
export const easings = Object.fromEntries(Object.entries(BEZIERS).map(([k, v]) => [k, cubicBezier(...v)]));
/** The same easings as CSS strings, usable in transitions and WAAPI. */
export const cssEasings = Object.fromEntries(
  Object.entries(BEZIERS).map(([k, v]) => [k, k === 'linear' ? 'linear' : `cubic-bezier(${v.join(', ')})`]),
);

const KEYWORD_BEZIER = { ease: 'ease', 'ease-in': 'easeIn', 'ease-out': 'easeOut', 'ease-in-out': 'easeInOut', linear: 'linear' };

/** Sample an easing function into a CSS `linear()` timing function. */
export function toLinearEasing(fn, points = 40) {
  const out = [];
  for (let i = 0; i <= points; i++) out.push(+fn(i / points).toFixed(4));
  return `linear(${out.join(', ')})`;
}

let linearSupport;
function supportsLinear() {
  if (linearSupport === undefined) {
    linearSupport = hasWindow && typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timing-function', 'linear(0, 1)');
  }
  return linearSupport;
}

/**
 * Analytic damped spring from 0 to 1. Returns its natural duration, an easing function over that
 * duration and a CSS `linear()` string so WAAPI and CSS transitions can play it natively.
 */
export function spring({ stiffness = 170, damping = 26, mass = 1, velocity = 0, restDelta = 0.001, maxDuration = 10000 } = {}) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  let at;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    at = (t) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0 - velocity) / wd) * Math.sin(wd * t));
  } else if (zeta === 1) {
    at = (t) => 1 - Math.exp(-w0 * t) * (1 + (w0 - velocity) * t);
  } else {
    const s = w0 * Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta * w0 + s;
    const r2 = -zeta * w0 - s;
    const c2 = (-velocity - r1) / (r2 - r1);
    const c1 = 1 - c2;
    at = (t) => 1 - (c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t));
  }
  // Settle time: the first moment after which the spring stays within restDelta of the target.
  const dt = 1 / 120;
  let settle = 0;
  for (let t = 0; t * 1000 < maxDuration; t += dt) {
    if (Math.abs(1 - at(t)) > restDelta) settle = t + dt;
  }
  const duration = Math.max(16, Math.round(settle * 1000));
  const easing = (p) => (p >= 1 ? 1 : at(p * (duration / 1000)));
  const points = clamp(Math.round(duration / 16), 24, 120);
  return { duration, easing, at, css: toLinearEasing(easing, points) };
}

function resolveEasing(easing) {
  if (typeof easing === 'function') return { fn: easing, css: supportsLinear() ? toLinearEasing(easing, 60) : null };
  if (typeof easing === 'string') {
    if (BEZIERS[easing]) return { fn: easings[easing], css: cssEasings[easing] };
    if (KEYWORD_BEZIER[easing]) return { fn: easings[KEYWORD_BEZIER[easing]], css: easing };
    const m = /^cubic-bezier\(([^)]+)\)$/.exec(easing.trim());
    if (m) {
      const p = m[1].split(',').map(Number);
      if (p.length === 4 && p.every((n) => !Number.isNaN(n))) return { fn: cubicBezier(...p), css: easing };
    }
    if (/^var\(--oc-ease/.test(easing)) {
      const name = easing.includes('spring') ? 'backOut' : easing.includes('in-out') ? 'inOut' : easing.includes('-out') ? 'out' : 'expoOut';
      return { fn: easings[name], css: cssEasings[name] };
    }
    if (/^linear\(/.test(easing)) return { fn: easings.linear, css: easing };
  }
  return { fn: easings.expoOut, css: cssEasings.expoOut };
}

/** Resolve duration + easing for an options object ({ duration, easing } or { spring }). */
function resolveTiming(options = {}) {
  if (options.spring) {
    const s = spring(options.spring === true ? {} : options.spring);
    return { duration: options.duration ?? s.duration, fn: s.easing, css: supportsLinear() ? s.css : null };
  }
  const { fn, css } = resolveEasing(options.easing ?? 'expoOut');
  return { duration: options.duration ?? 400, fn, css };
}

/* ------------------------------------------------------------------ targets & keyframes */

function resolveTargets(targets) {
  if (!targets) return [];
  if (typeof targets === 'string') return typeof document === 'undefined' ? [] : Array.from(document.querySelectorAll(targets));
  if (typeof targets.length === 'number' && !(targets instanceof Element)) return Array.from(targets).filter(Boolean);
  return [targets];
}

const TRANSFORM_KEYS = ['x', 'y', 'z', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'skewX', 'skewY'];
const unit = (key, v) => (typeof v === 'number' ? (/^rotate|^skew/.test(key) ? `${v}deg` : /^scale/.test(key) ? `${v}` : `${v}px`) : v);

/** Compose shorthand transform keys (x, y, scale, rotate …) into a `transform` string. */
function composeTransform(frame) {
  const parts = [];
  if (frame.x !== undefined || frame.y !== undefined || frame.z !== undefined) {
    parts.push(`translate3d(${unit('x', frame.x ?? 0)}, ${unit('y', frame.y ?? 0)}, ${unit('z', frame.z ?? 0)})`);
  }
  for (const k of ['scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'skewX', 'skewY']) {
    if (frame[k] !== undefined) parts.push(`${k}(${unit(k, frame[k])})`);
  }
  const out = {};
  for (const [k, v] of Object.entries(frame)) if (!TRANSFORM_KEYS.includes(k)) out[k] = v;
  if (parts.length) out.transform = [frame.transform, ...parts].filter((p) => p && p !== 'none').join(' ') || 'none';
  return out;
}

const cssName = (k) => (k.startsWith('--') ? k : k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
const toValue = (k, v) => (typeof v === 'number' && !['opacity', 'zIndex', 'scale', 'offset', 'fontWeight', 'flexGrow', 'strokeDashoffset', 'pathLength', 'lineHeight'].includes(k) && !k.startsWith('--') ? `${v}px` : String(v));

function currentValue(el, key) {
  if (key.startsWith('--')) return getComputedStyle(el).getPropertyValue(key).trim();
  const v = hasWindow ? getComputedStyle(el)[key] : '';
  if (key === 'transform' && (!v || v === 'none')) return 'none';
  return v;
}

/**
 * Accepts { prop: value | [from, …, to] } or [{…}, {…}] (WAAPI shapes) plus the shorthand transform
 * keys. Single values animate from the element's current computed style.
 */
export function normalizeKeyframes(el, keyframes) {
  let frames;
  if (Array.isArray(keyframes)) {
    frames = keyframes.map((f) => composeTransform(f));
  } else {
    const entries = Object.entries(keyframes || {});
    const hasTransformKeys = entries.some(([k]) => TRANSFORM_KEYS.includes(k));
    const count = Math.max(2, ...entries.map(([, v]) => (Array.isArray(v) ? v.length : 1)));
    frames = Array.from({ length: count }, () => ({}));
    for (const [k, v] of entries) {
      const list = Array.isArray(v) ? v : [undefined, v];
      for (let i = 0; i < count; i++) {
        // Spread shorter lists over the frames (first, …, last).
        const idx = list.length === 1 ? 0 : Math.round((i / (count - 1)) * (list.length - 1));
        frames[i][k] = list[idx];
      }
    }
    // Shorthand transform keys with an implicit "from" start at identity.
    if (hasTransformKeys) {
      for (const [k] of entries) {
        if (TRANSFORM_KEYS.includes(k) && frames[0][k] === undefined) frames[0][k] = /^scale/.test(k) ? 1 : 0;
      }
    }
    frames = frames.map((f) => composeTransform(f));
    for (const key of Object.keys(frames[0])) {
      if (frames[0][key] === undefined) frames[0][key] = el ? currentValue(el, key) : '';
    }
  }
  return frames.map((f) => {
    const out = {};
    for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== null) out[k] = k === 'offset' || k === 'easing' ? v : toValue(k, v);
    return out;
  });
}

function applyFrame(el, frame) {
  for (const [k, v] of Object.entries(frame)) {
    if (k === 'offset' || k === 'easing' || k === 'composite') continue;
    if (k.startsWith('--')) el.style.setProperty(k, v);
    else if (k === 'strokeDashoffset' || k === 'strokeDasharray') el.style[k] = v;
    else el.style.setProperty(cssName(k), v);
  }
}

/* ------------------------------------------------------------------ controls */

function finishedControls(onComplete) {
  onComplete?.();
  return { finished: Promise.resolve(), cancel: noop, finish: noop, pause: noop, play: noop, reverse: noop, animations: [] };
}

function group(list, onComplete) {
  const finished = Promise.all(list.map((c) => c.finished)).then(() => {
    onComplete?.();
  });
  return {
    animations: list,
    finished,
    cancel: () => list.forEach((c) => c.cancel()),
    finish: () => list.forEach((c) => c.finish()),
    pause: () => list.forEach((c) => c.pause()),
    play: () => list.forEach((c) => c.play()),
    reverse: () => list.forEach((c) => c.reverse?.()),
  };
}

/* ------------------------------------------------------------------ JS fallback interpolation */

const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
function identityTransform(list) {
  return list.replace(/([a-zA-Z0-9]+)\(([^)]*)\)/g, (_, fn, args) => {
    const vals = args.split(',').map((s) => (/^scale/.test(fn) ? '1' : `0${s.trim().replace(/^-?\d*\.?\d+(?:e[-+]?\d+)?/i, '')}`));
    return `${fn}(${vals.join(', ')})`;
  });
}
function interpolator(from, to) {
  const a = String(from);
  const b = String(to);
  const ta = a.replace(NUM, '#');
  const tb = b.replace(NUM, '#');
  const na = a.match(NUM);
  const nb = b.match(NUM);
  if (ta === tb && na && nb && na.length === nb.length) {
    const parts = tb.split('#');
    return (p) => parts.reduce((s, part, i) => s + part + (i < nb.length ? +(Number(na[i]) + (Number(nb[i]) - Number(na[i])) * p).toFixed(4) : ''), '');
  }
  // none ↔ transform list: interpolate from/to the identity of each transform function.
  if ((a === 'none' || a === '') && /\(/.test(b)) return interpolator(identityTransform(b), b);
  if ((b === 'none' || b === '') && /\(/.test(a)) {
    const f = interpolator(a, identityTransform(a));
    return (p) => (p >= 1 ? b : f(p));
  }
  return (p) => (p < 0.5 ? a : b);
}

function jsAnimate(el, frames, { duration, fn, delay = 0, iterations = 1, direction = 'normal' }) {
  let rafId = 0;
  let start = 0;
  let pausedAt = -1;
  let resolve;
  let done = false;
  const finished = new Promise((r) => (resolve = r));
  const keys = Array.from(new Set(frames.flatMap((f) => Object.keys(f)))).filter((k) => k !== 'offset' && k !== 'easing');
  const offsets = frames.map((f, i) => (typeof f.offset === 'number' ? f.offset : frames.length === 1 ? 1 : i / (frames.length - 1)));
  const segs = [];
  for (let i = 0; i < frames.length - 1; i++) {
    const seg = {};
    for (const k of keys) seg[k] = interpolator(frames[i][k] ?? frames[0][k] ?? '', frames[i + 1][k] ?? frames[frames.length - 1][k] ?? '');
    segs.push(seg);
  }
  const render = (p) => {
    let i = 0;
    while (i < segs.length - 1 && p > offsets[i + 1]) i++;
    const span = offsets[i + 1] - offsets[i] || 1;
    const local = clamp((p - offsets[i]) / span, 0, 1);
    const out = {};
    for (const k of keys) out[k] = segs[i][k](local);
    applyFrame(el, out);
  };
  const total = iterations === Infinity ? Infinity : duration * iterations;
  const tick = (t) => {
    if (!start) start = t;
    const elapsed = t - start - delay;
    if (elapsed < 0) {
      rafId = raf(tick);
      return;
    }
    const iter = Math.floor(elapsed / duration);
    let p = (elapsed % duration) / duration;
    if (elapsed >= total) {
      p = 1;
    }
    const reverseIter = direction === 'reverse' || (direction === 'alternate' && iter % 2 === 1);
    render(fn(reverseIter ? 1 - p : p));
    if (elapsed >= total) {
      done = true;
      resolve();
      return;
    }
    rafId = raf(tick);
  };
  render(fn(direction === 'reverse' ? 1 : 0));
  rafId = raf(tick);
  return {
    animations: [],
    finished,
    cancel: () => {
      caf(rafId);
      if (!done) {
        done = true;
        resolve();
      }
    },
    finish: () => {
      caf(rafId);
      render(direction === 'reverse' ? 0 : 1);
      if (!done) {
        done = true;
        resolve();
      }
    },
    pause: () => {
      if (pausedAt < 0) {
        caf(rafId);
        pausedAt = now();
      }
    },
    play: () => {
      if (pausedAt >= 0) {
        start += now() - pausedAt;
        pausedAt = -1;
        rafId = raf(tick);
      }
    },
    reverse: noop,
  };
}

/* ------------------------------------------------------------------ animate */

function staggerDelay(st, i, total) {
  if (!st) return 0;
  if (typeof st === 'function') return st(i, total);
  return st * i;
}

function animateOne(el, keyframes, options) {
  const frames = normalizeKeyframes(el, keyframes);
  const last = frames[frames.length - 1];
  if (options.reduced ?? prefersReducedMotion()) {
    applyFrame(el, options.direction === 'reverse' ? frames[0] : last);
    return finishedControls();
  }
  const timing = resolveTiming(options);
  const iterations = options.repeat === Infinity || options.iterations === Infinity ? Infinity : (options.iterations ?? (options.repeat ? options.repeat + 1 : 1));
  const delay = Math.max(0, options.delay ?? 0);
  const direction = options.direction ?? 'normal';
  if (typeof el.animate === 'function' && timing.css) {
    let anim;
    try {
      anim = el.animate(frames, { duration: timing.duration, delay, easing: timing.css, fill: 'both', iterations, direction });
    } catch {
      anim = null;
    }
    if (anim) {
      const finished = anim.finished
        .then(() => {
          if (iterations !== Infinity && options.commit !== false) {
            try {
              anim.commitStyles();
            } catch {
              applyFrame(el, direction === 'reverse' ? frames[0] : last);
            }
            anim.cancel();
          }
        })
        .catch(noop);
      return {
        animations: [anim],
        finished,
        cancel: () => anim.cancel(),
        finish: () => {
          try {
            anim.finish();
          } catch {
            /* infinite */
          }
        },
        pause: () => anim.pause(),
        play: () => anim.play(),
        reverse: () => anim.reverse(),
      };
    }
  }
  const c = jsAnimate(el, frames, { duration: timing.duration, fn: timing.fn, delay, iterations, direction });
  return c;
}

/**
 * Animate one or many elements. `options`: duration (ms), easing (name | CSS string | function),
 * spring (true | { stiffness, damping, mass, velocity }), delay (ms), stagger (ms | stagger()),
 * repeat / iterations, direction, onComplete. Returns { finished, cancel, finish, pause, play }.
 */
export function animate(targets, keyframes, options = {}) {
  const els = resolveTargets(targets);
  const { onComplete, stagger: st, delay = 0, ...rest } = options;
  if (!els.length) return finishedControls(onComplete);
  const list = els.map((el, i) => {
    const base = typeof delay === 'function' ? delay(i, els.length) : delay;
    return animateOne(el, keyframes, { ...rest, delay: base + staggerDelay(st, i, els.length) });
  });
  return group(list, onComplete);
}

/* ------------------------------------------------------------------ stagger */

/** Delay generator: `stagger(60)` → 0, 60, 120 …; `from` can be 'first' | 'last' | 'center' | index. */
export function stagger(each = 50, { start = 0, from = 'first', ease } = {}) {
  return (i, total) => {
    const origin = from === 'first' ? 0 : from === 'last' ? total - 1 : from === 'center' ? (total - 1) / 2 : Number(from) || 0;
    const dist = Math.abs(i - origin);
    const maxDist = Math.max(origin, total - 1 - origin) || 1;
    const fn = typeof ease === 'function' ? ease : ease ? resolveEasing(ease).fn : null;
    return start + (fn ? fn(dist / maxDist) * maxDist : dist) * each;
  };
}

/* ------------------------------------------------------------------ timeline */

function estimate(targets, options) {
  const t = resolveTiming(options);
  const n = resolveTargets(targets).length || 1;
  const st = options.stagger ? staggerDelay(options.stagger, n - 1, n) : 0;
  return (options.delay ?? 0) + st + t.duration;
}

/**
 * Choreograph animations. `at`: a number (absolute ms), '+=n' / '-=n' (relative to the end of the
 * timeline so far), '<' (with the previous step) or '<+n' / '<-n'. Default: after the previous end.
 */
export function timeline(defaults = {}) {
  const steps = [];
  let end = 0;
  let prevStart = 0;
  const resolveAt = (at) => {
    if (typeof at === 'number') return at;
    if (typeof at === 'string') {
      const m = /^(<)?([+-]=?)?(\d+(?:\.\d+)?)?$/.exec(at.trim());
      if (m) {
        const base = m[1] ? prevStart : end;
        const n = Number(m[3] ?? 0);
        const sign = m[2]?.startsWith('-') ? -1 : 1;
        return Math.max(0, base + sign * n);
      }
    }
    return end;
  };
  const api = {
    add(targets, keyframes, options = {}, at) {
      const merged = { ...defaults, ...options };
      const startAt = resolveAt(at);
      steps.push({ type: 'anim', targets, keyframes, options: merged, start: startAt });
      prevStart = startAt;
      end = Math.max(end, startAt + estimate(targets, merged));
      return api;
    },
    call(fn, at) {
      const startAt = resolveAt(at);
      steps.push({ type: 'call', fn, start: startAt });
      prevStart = startAt;
      end = Math.max(end, startAt);
      return api;
    },
    get duration() {
      return end;
    },
    play() {
      const reduced = prefersReducedMotion();
      const timers = [];
      const controls = steps.map((s) => {
        if (s.type === 'call') {
          if (reduced) {
            s.fn();
            return finishedControls();
          }
          let resolve;
          const finished = new Promise((r) => (resolve = r));
          timers.push(
            setTimeout(() => {
              s.fn();
              resolve();
            }, s.start),
          );
          return { ...finishedControls(), finished };
        }
        return animate(s.targets, s.keyframes, { ...s.options, delay: s.start + (s.options.delay ?? 0) });
      });
      const g = group(controls, defaults.onComplete);
      const cancel = g.cancel;
      g.cancel = () => {
        timers.forEach(clearTimeout);
        cancel();
      };
      return g;
    },
  };
  return api;
}

/** Run steps one after another: sequence([el, kf, opts, at?], …). */
export function sequence(steps, defaults) {
  const tl = timeline(defaults);
  for (const [targets, keyframes, options, at] of steps) tl.add(targets, keyframes, options, at);
  return tl.play();
}

/** Run steps together (each may still carry its own delay). */
export function parallel(steps, defaults) {
  const tl = timeline(defaults);
  for (const [targets, keyframes, options] of steps) tl.add(targets, keyframes, options, 0);
  return tl.play();
}

/* ------------------------------------------------------------------ FLIP layout */

const layoutAnims = new WeakMap();

/** Snapshot the boxes of `container`'s items (direct children, or `selector`) for a FLIP animation. */
export function measureLayout(container, selector) {
  const items = new Map();
  if (!container) return { container, items, selector, rect: null };
  const els = selector ? container.querySelectorAll(selector) : container.children;
  for (const el of Array.from(els)) {
    layoutAnims.get(el)?.cancel();
    const key = el.getAttribute('data-flip-id') || el;
    items.set(key, el.getBoundingClientRect());
  }
  return { container, items, selector, rect: container.getBoundingClientRect() };
}

/**
 * Animate items from the boxes recorded by measureLayout() to where they are now. New items fade
 * and scale in. Options: duration, easing, spring, scale (also animate size), height (animate the
 * container's height change). Instant under reduced motion.
 */
export function playLayout(snapshot, options = {}) {
  const { container, items, selector } = snapshot;
  if (!container || prefersReducedMotion()) return finishedControls();
  const timing = { duration: 460, easing: 'expoOut', ...options };
  const els = Array.from(selector ? container.querySelectorAll(selector) : container.children);
  const list = [];
  for (const el of els) {
    const key = el.getAttribute('data-flip-id') || el;
    const prev = items.get(key);
    const next = el.getBoundingClientRect();
    if (!prev) {
      if (options.enter !== false) list.push(animate(el, { opacity: [0, 1], transform: ['scale(0.96)', 'none'] }, timing));
      continue;
    }
    const dx = prev.left - next.left;
    const dy = prev.top - next.top;
    const sx = options.scale && next.width ? prev.width / next.width : 1;
    const sy = options.scale && next.height ? prev.height / next.height : 1;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) continue;
    const from = `translate(${dx}px, ${dy}px)${sx !== 1 || sy !== 1 ? ` scale(${sx}, ${sy})` : ''}`;
    const c = animate(el, [{ transform: from, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { ...timing, commit: false });
    layoutAnims.set(el, c);
    c.finished.then(() => {
      if (layoutAnims.get(el) === c) layoutAnims.delete(el);
      el.style.removeProperty('transform-origin');
      el.style.removeProperty('transform');
    });
    list.push(c);
  }
  if (options.height && snapshot.rect) {
    const h = container.getBoundingClientRect().height;
    if (Math.abs(h - snapshot.rect.height) > 0.5) {
      const c = animate(container, { height: [`${snapshot.rect.height}px`, `${h}px`] }, { ...timing, commit: false });
      c.finished.then(() => container.style.removeProperty('height'));
      list.push(c);
    }
  }
  return group(list, options.onComplete);
}

/** FLIP in one call: measure, run `mutate()` (sync or async), then animate to the new layout. */
export function animateLayout(container, mutate, options = {}) {
  const snap = measureLayout(container, options.selector);
  const result = mutate?.();
  if (result && typeof result.then === 'function') {
    let inner = finishedControls();
    const finished = result.then(() => {
      inner = playLayout(snap, options);
      return inner.finished;
    });
    return { ...inner, finished, cancel: () => inner.cancel(), finish: () => inner.finish() };
  }
  return playLayout(snap, options);
}

/* ------------------------------------------------------------------ scroll & visibility */

/**
 * Report scroll progress (0–1) to `cb`.
 *  - `target` = window / document / undefined → page progress
 *  - `{ within: true }` → progress of scrolling inside `target`
 *  - otherwise → how far `target` has travelled through the viewport (enters at 0, leaves at 1);
 *    `range: 'contain'` measures from fully visible at the bottom to fully visible at the top.
 * Listens only while the element is near the viewport. Returns a cleanup.
 */
export function scrollProgress(target, cb, { within = false, axis = 'y', range = 'cover' } = {}) {
  if (!hasWindow) return noop;
  const page = !target || target === window || target === document || target === document.documentElement;
  const scroller = page ? window : within ? target : window;
  let frame = 0;
  let last = -1;
  const y = axis === 'y';
  const compute = () => {
    frame = 0;
    let p;
    if (page) {
      const el = document.scrollingElement || document.documentElement;
      const max = y ? el.scrollHeight - window.innerHeight : el.scrollWidth - window.innerWidth;
      p = max > 0 ? (y ? window.scrollY : Math.abs(window.scrollX)) / max : 0;
    } else if (within) {
      const max = y ? target.scrollHeight - target.clientHeight : target.scrollWidth - target.clientWidth;
      p = max > 0 ? (y ? target.scrollTop : Math.abs(target.scrollLeft)) / max : 0;
    } else {
      const r = target.getBoundingClientRect();
      const vh = y ? window.innerHeight : window.innerWidth;
      const start = y ? r.top : r.left;
      const size = y ? r.height : r.width;
      p = range === 'contain' ? (vh - size - start) / Math.max(1, vh - size) : (vh - start) / Math.max(1, vh + size);
    }
    p = clamp(p, 0, 1);
    if (p !== last) {
      last = p;
      cb(p);
    }
  };
  const onScroll = () => {
    if (!frame) frame = raf(compute);
  };
  let listening = false;
  const listen = (on) => {
    if (on === listening) return;
    listening = on;
    const fn = on ? 'addEventListener' : 'removeEventListener';
    scroller[fn]('scroll', onScroll, { passive: true });
    window[fn]('resize', onScroll);
    if (on) compute();
  };
  let io = null;
  if (!page && !within && typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      listen(visible);
      if (!visible) compute();
    }, { rootMargin: '10% 0px' });
    io.observe(target);
  } else {
    listen(true);
  }
  compute();
  return () => {
    io?.disconnect();
    listen(false);
    if (frame) caf(frame);
  };
}

/**
 * Call `onEnter(entry)` when `target` scrolls into view. If it returns a function, that runs when
 * the element leaves. Options: root, margin, amount (0–1 | 'some' | 'all'), once. Returns a cleanup.
 * Without IntersectionObserver, onEnter fires immediately.
 */
export function inView(target, onEnter, { root, margin = '0px', amount = 0, once = false } = {}) {
  const els = resolveTargets(target);
  if (!els.length) return noop;
  if (typeof IntersectionObserver === 'undefined') {
    els.forEach((el) => onEnter({ target: el, isIntersecting: true, intersectionRatio: 1 }));
    return noop;
  }
  const leaves = new Map();
  const threshold = amount === 'all' ? 1 : amount === 'some' ? 0 : amount;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          if (leaves.has(e.target)) continue;
          const leave = onEnter(e);
          if (once) io.unobserve(e.target);
          leaves.set(e.target, typeof leave === 'function' ? leave : null);
        } else if (leaves.has(e.target)) {
          leaves.get(e.target)?.(e);
          leaves.delete(e.target);
        }
      }
    },
    { root, rootMargin: margin, threshold },
  );
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

/* ------------------------------------------------------------------ SVG path drawing */

/** Draw an SVG stroke from nothing to complete (or erase it with `{ reverse: true }`). */
export function drawPath(targets, options = {}) {
  const els = resolveTargets(targets);
  const list = els.map((path, i) => {
    let len = 0;
    try {
      len = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0;
    } catch {
      len = 0;
    }
    if (!len) {
      path.setAttribute('pathLength', '1');
      len = 1;
    }
    path.style.strokeDasharray = `${len} ${len}`;
    const from = options.reverse ? 0 : len;
    const to = options.reverse ? len : 0;
    path.style.strokeDashoffset = String(from);
    return animate(path, { strokeDashoffset: [from, to] }, { ...options, delay: (options.delay ?? 0) + staggerDelay(options.stagger, i, els.length), stagger: undefined, onComplete: undefined });
  });
  return group(list, options.onComplete);
}

/* ------------------------------------------------------------------ numbers */

/** Tween a number from → to, calling onUpdate(value) every frame. Jumps to `to` under reduced motion. */
export function tween(from, to, onUpdate, options = {}) {
  const { delay = 0, onComplete } = options;
  if (options.reduced ?? prefersReducedMotion()) {
    onUpdate(to);
    return finishedControls(onComplete);
  }
  const { duration, fn } = resolveTiming({ duration: 800, easing: 'out', ...options });
  let resolve;
  let id = 0;
  let start = 0;
  let done = false;
  const finished = new Promise((r) => (resolve = r));
  const end = () => {
    if (done) return;
    done = true;
    onComplete?.();
    resolve();
  };
  const tick = (t) => {
    if (!start) start = t;
    const elapsed = t - start - delay;
    if (elapsed < 0) {
      id = raf(tick);
      return;
    }
    const p = clamp(elapsed / duration, 0, 1);
    onUpdate(from + (to - from) * fn(p));
    if (p >= 1) end();
    else id = raf(tick);
  };
  onUpdate(from);
  id = raf(tick);
  return {
    animations: [],
    finished,
    cancel: () => {
      caf(id);
      end();
    },
    finish: () => {
      caf(id);
      onUpdate(to);
      end();
    },
    pause: noop,
    play: noop,
    reverse: noop,
  };
}

/**
 * A retargetable spring-driven number (physics integration, keeps velocity when the target moves).
 * springValue(0, { stiffness, damping, mass }, (v) => …).set(100)
 */
export function springValue(initial, config = {}, onUpdate = noop) {
  const { stiffness = 170, damping = 26, mass = 1, restDelta = 0.01, restSpeed = 0.01 } = config;
  let x = initial;
  let v = 0;
  let target = initial;
  let id = 0;
  let last = 0;
  const listeners = new Set([onUpdate]);
  const emit = () => listeners.forEach((l) => l(x));
  const step = (t) => {
    const dt = Math.min(0.064, Math.max(0.001, (t - last) / 1000));
    last = t;
    const n = 4;
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = (-stiffness * (x - target) - damping * v) / mass;
      v += a * h;
      x += v * h;
    }
    if (Math.abs(v) < restSpeed && Math.abs(x - target) < restDelta) {
      x = target;
      v = 0;
      id = 0;
      emit();
      return;
    }
    emit();
    id = raf(step);
  };
  return {
    get: () => x,
    getVelocity: () => v,
    set(next) {
      target = next;
      if (prefersReducedMotion()) {
        this.jump(next);
        return;
      }
      if (!id) {
        last = now();
        id = raf(step);
      }
    },
    jump(next) {
      if (id) caf(id);
      id = 0;
      x = target = next;
      v = 0;
      emit();
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    stop() {
      if (id) caf(id);
      id = 0;
    },
  };
}

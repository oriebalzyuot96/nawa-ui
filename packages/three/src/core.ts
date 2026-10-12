// Shared lifecycle for every @orca-ui/three component: lazy renderer, DPR cap, off-screen / hidden-tab pausing,
// reduced-motion single frame, theme colors from CSS custom properties, orbit controls, full disposal.
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Color, PerspectiveCamera, Scene, Spherical, Vector3, WebGLRenderer, type Material, type Object3D, type Texture } from 'three';

/* ------------------------------------------------------------------ environment */

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_QUERY).matches;
}

/** True when a WebGL (2 or 1) context can be created. Never throws. */
export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ theme colors */

export interface ThemeColors {
  primary: Color;
  primaryInk: Color;
  onPrimary: Color;
  surface: Color;
  surfaceAlt: Color;
  surfaceMuted: Color;
  text: Color;
  textMuted: Color;
  border: Color;
  success: Color;
  warning: Color;
  danger: Color;
  info: Color;
}

const TOKENS: Record<keyof ThemeColors, [string, string]> = {
  primary: ['--oc-primary', '#0d7377'],
  primaryInk: ['--oc-primary-ink', '#0b6b6b'],
  onPrimary: ['--oc-on-primary', '#ffffff'],
  surface: ['--oc-surface', '#ffffff'],
  surfaceAlt: ['--oc-surface-alt', '#f6f8f8'],
  surfaceMuted: ['--oc-surface-muted', '#eef2f2'],
  text: ['--oc-text', '#14201f'],
  textMuted: ['--oc-text-muted', '#4a5a59'],
  border: ['--oc-border', '#d5dede'],
  success: ['--oc-success', '#15803d'],
  warning: ['--oc-warning', '#a16207'],
  danger: ['--oc-danger', '#b91c1c'],
  info: ['--oc-info', '#1d4ed8'],
};

const SIMPLE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i;
let probe: CanvasRenderingContext2D | null | undefined;

function parseColor(value: string, fallback: string): Color {
  let v = value.trim();
  if (v && !SIMPLE_COLOR.test(v)) {
    // Normalize other CSS colors (named, color-mix results…) through a 2D canvas when available.
    try {
      if (probe === undefined) probe = document.createElement('canvas').getContext('2d');
      if (probe) {
        probe.fillStyle = '#000';
        probe.fillStyle = v;
        v = String(probe.fillStyle);
      }
    } catch {
      probe = null;
    }
  }
  if (!SIMPLE_COLOR.test(v)) v = fallback;
  const color = new Color();
  try {
    color.setStyle(v);
  } catch {
    color.set(fallback);
  }
  return color;
}

/** Read Orca theme tokens (--oc-primary etc.) as three.js Colors, scoped to `el` (so nested data-theme works). */
export function readThemeColors(el?: Element | null): ThemeColors {
  const target = el ?? (typeof document !== 'undefined' ? document.documentElement : null);
  const style = target && typeof getComputedStyle === 'function' ? getComputedStyle(target) : null;
  const out = {} as ThemeColors;
  for (const key of Object.keys(TOKENS) as Array<keyof ThemeColors>) {
    const [prop, fallback] = TOKENS[key];
    out[key] = parseColor(style?.getPropertyValue(prop) ?? '', fallback);
  }
  return out;
}

/* ------------------------------------------------------------------ disposal */

/** Dispose every geometry, material and texture under `root`. */
export function disposeObject(root: Object3D): void {
  root.traverse((obj) => {
    const node = obj as Object3D & { geometry?: { dispose(): void }; material?: Material | Material[] };
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value && typeof value === 'object' && (value as Texture).isTexture) (value as Texture).dispose();
      }
      material.dispose();
    }
  });
}

/* ------------------------------------------------------------------ scene hook */

export interface SceneContext {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  /** Current theme colors (also passed to `onColors` when the theme changes). */
  colors: ThemeColors;
  /** Element that hosts the canvas. */
  container: HTMLElement;
  /** True when the user prefers reduced motion: only a single frame is rendered. */
  reducedMotion: boolean;
  /** Request a re-render (needed after changes while the loop is paused). */
  invalidate: () => void;
}

export interface SceneHandle {
  /** Called every animation frame (never under reduced motion, off-screen or in a hidden tab). */
  tick?: (delta: number, elapsed: number) => void;
  /** Called after the theme (data-theme / data-accent / color scheme) changes. */
  onColors?: (colors: ThemeColors) => void;
  /** Extra cleanup; scene contents, materials and the renderer are disposed automatically. */
  cleanup?: () => void;
}

/** A setup may return nothing, a cleanup function, or a handle with tick/onColors/cleanup. */
export type SetupResult = void | (() => void) | SceneHandle;
export type SceneSetup = (ctx: SceneContext) => SetupResult;

export interface CameraOptions {
  fov?: number;
  position?: [number, number, number];
  near?: number;
  far?: number;
}

export interface UseThreeSceneOptions {
  setup: SceneSetup;
  /** Run the animation loop. Default true (forced off under reduced motion). */
  animate?: boolean;
  /** Pointer-drag + keyboard orbit around the origin. */
  interactive?: boolean;
  camera?: CameraOptions;
  /** Zoom limits for interactive orbit (camera distance). */
  minDistance?: number;
  maxDistance?: number;
  /** Rebuild the scene when these change. */
  deps?: unknown[];
}

export type ThreeStatus = 'pending' | 'ready' | 'fallback';

const ROTATE_STEP = 0.12;

/**
 * Mounts a three.js scene into `hostRef`. The renderer is created lazily when the host first scrolls into view.
 * Returns `fallback` when WebGL is unavailable so the caller can render static content.
 */
export function useThreeScene(hostRef: RefObject<HTMLElement>, options: UseThreeSceneOptions): { status: ThreeStatus } {
  const [status, setStatus] = useState<ThreeStatus>('pending');
  const optsRef = useRef(options);
  optsRef.current = options;
  const deps = options.deps ?? [];

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!isWebGLAvailable()) {
      setStatus('fallback');
      return;
    }

    let disposed = false;
    let renderer: WebGLRenderer | null = null;
    let scene: Scene | null = null;
    let camera: PerspectiveCamera | null = null;
    let handle: SceneHandle = {};
    let raf = 0;
    let visible = typeof IntersectionObserver === 'undefined';
    let reduced = prefersReducedMotion();
    let last = 0;
    let elapsed = 0;
    const teardown: Array<() => void> = [];

    const render = () => {
      if (renderer && scene && camera) renderer.render(scene, camera);
    };
    const shouldRun = () =>
      Boolean(renderer) && optsRef.current.animate !== false && !reduced && visible && !(typeof document !== 'undefined' && document.hidden);
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      elapsed += dt;
      handle.tick?.(dt, elapsed);
      render();
      if (shouldRun()) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (raf || !shouldRun()) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const invalidate = () => {
      if (!raf) render();
    };

    const applySize = () => {
      if (!renderer || !camera) return false;
      const w = host.clientWidth || 300;
      const h = host.clientHeight || 150;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      return true;
    };
    const resize = () => {
      if (applySize()) invalidate();
    };

    const create = () => {
      if (renderer || disposed) return;
      const opts = optsRef.current;
      try {
        renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch {
        setStatus('fallback');
        return;
      }
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
      renderer.setClearColor(0x000000, 0);
      const canvas = renderer.domElement;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.addEventListener('webglcontextlost', onContextLost);
      host.appendChild(canvas);

      scene = new Scene();
      const cam = opts.camera ?? {};
      camera = new PerspectiveCamera(cam.fov ?? 45, 1, cam.near ?? 0.1, cam.far ?? 100);
      camera.position.set(...(cam.position ?? [0, 0, 5]));
      camera.lookAt(0, 0, 0);

      const colors = readThemeColors(host);
      const result = opts.setup({ scene, camera, renderer, colors, container: host, reducedMotion: reduced, invalidate });
      handle = typeof result === 'function' ? { cleanup: result } : result ?? {};

      applySize();
      if (opts.interactive) attachOrbit();
      // Reduced motion (or animate=false): one static frame, then render only on demand.
      handle.tick?.(0, 0);
      render();
      setStatus('ready');
      start();
    };

    function onContextLost(event: Event) {
      event.preventDefault();
      stop();
    }

    /* ---- orbit (pointer drag + keyboard) ---- */
    const attachOrbit = () => {
      if (!camera) return;
      const cam = camera;
      const opts = optsRef.current;
      const sph = new Spherical().setFromVector3(cam.position);
      const initial = sph.clone();
      const minR = opts.minDistance ?? sph.radius * 0.5;
      const maxR = opts.maxDistance ?? sph.radius * 2;
      const apply = () => {
        sph.phi = Math.min(Math.max(sph.phi, 0.15), Math.PI - 0.15);
        sph.radius = Math.min(Math.max(sph.radius, minR), maxR);
        cam.position.copy(new Vector3().setFromSpherical(sph));
        cam.lookAt(0, 0, 0);
        invalidate();
      };
      let drag: { id: number; x: number; y: number } | null = null;
      const down = (e: PointerEvent) => {
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
        host.setPointerCapture?.(e.pointerId);
      };
      const move = (e: PointerEvent) => {
        if (!drag || drag.id !== e.pointerId) return;
        sph.theta -= (e.clientX - drag.x) * 0.008;
        sph.phi -= (e.clientY - drag.y) * 0.008;
        drag.x = e.clientX;
        drag.y = e.clientY;
        apply();
      };
      const up = (e: PointerEvent) => {
        if (drag?.id === e.pointerId) drag = null;
        host.releasePointerCapture?.(e.pointerId);
      };
      const key = (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowLeft': sph.theta -= ROTATE_STEP; break;
          case 'ArrowRight': sph.theta += ROTATE_STEP; break;
          case 'ArrowUp': sph.phi -= ROTATE_STEP; break;
          case 'ArrowDown': sph.phi += ROTATE_STEP; break;
          case '+': case '=': sph.radius *= 0.9; break;
          case '-': case '_': sph.radius *= 1.1; break;
          case 'Home': sph.copy(initial); break;
          default: return;
        }
        e.preventDefault();
        apply();
      };
      host.addEventListener('pointerdown', down);
      host.addEventListener('pointermove', move);
      host.addEventListener('pointerup', up);
      host.addEventListener('pointercancel', up);
      host.addEventListener('keydown', key);
      teardown.push(() => {
        host.removeEventListener('pointerdown', down);
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerup', up);
        host.removeEventListener('pointercancel', up);
        host.removeEventListener('keydown', key);
      });
    };

    /* ---- visibility: lazy creation + off-screen pause ---- */
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          create();
          start();
        } else stop();
      });
      io.observe(host);
      teardown.push(() => io.disconnect());
    } else {
      create();
    }

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    teardown.push(() => document.removeEventListener('visibilitychange', onVisibility));

    /* ---- resize ---- */
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => resize());
      ro.observe(host);
      teardown.push(() => ro.disconnect());
    } else {
      window.addEventListener('resize', resize);
      teardown.push(() => window.removeEventListener('resize', resize));
    }

    /* ---- theme changes ---- */
    const recolor = () => {
      if (!renderer) return;
      handle.onColors?.(readThemeColors(host));
      invalidate();
    };
    if (typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(recolor);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent', 'class', 'style'] });
      teardown.push(() => mo.disconnect());
    }
    if (typeof window.matchMedia === 'function') {
      const schemes = ['(prefers-color-scheme: dark)', '(prefers-contrast: more)'].map((q) => window.matchMedia(q));
      for (const mql of schemes) mql.addEventListener?.('change', recolor);
      const motion = window.matchMedia(REDUCED_QUERY);
      const onMotion = () => {
        reduced = motion.matches;
        if (reduced) stop();
        else start();
      };
      motion.addEventListener?.('change', onMotion);
      teardown.push(() => {
        for (const mql of schemes) mql.removeEventListener?.('change', recolor);
        motion.removeEventListener?.('change', onMotion);
      });
    }

    return () => {
      disposed = true;
      stop();
      for (const fn of teardown) fn();
      try {
        handle.cleanup?.();
      } finally {
        if (scene) disposeObject(scene);
        if (renderer) {
          renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
          renderer.dispose();
          renderer.forceContextLoss?.();
          renderer.domElement.remove();
        }
        renderer = null;
        scene = null;
        camera = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { status };
}

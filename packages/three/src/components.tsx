import { useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  GridHelper,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  Box3,
  type Material,
  type Object3D,
} from 'three';
import { disposeObject, useThreeScene, type CameraOptions, type SceneSetup, type ThemeColors } from './core';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

const KEY_HELP = 'Drag or use arrow keys to rotate, plus and minus to zoom, Home to reset.';

interface CanvasHostProps {
  hostRef: RefObject<HTMLDivElement>;
  status: string;
  height?: string;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; omit with `decorative`. */
  label?: string;
  describedBy?: string;
  decorative?: boolean;
  interactive?: boolean;
  fallback: ReactNode;
  /** Remove the box entirely when WebGL is unavailable. */
  hideOnFallback?: boolean;
  children?: ReactNode;
}

/** Shared canvas host: role="img" + name (or aria-hidden when decorative), focusable when interactive. */
function CanvasHost({ hostRef, status, height, className, style, label, describedBy, decorative, interactive, fallback, hideOnFallback, children }: CanvasHostProps) {
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img', 'aria-label': label, 'aria-describedby': describedBy, 'aria-roledescription': interactive ? 'interactive 3D view' : undefined };
  return (
    <div
      className={cx('pl-three', interactive && status === 'ready' && 'pl-three--interactive', className)}
      style={{ ...(height ? ({ '--pl-three-h': height } as CSSProperties) : null), ...style }}
      data-status={status}
      hidden={hideOnFallback && status === 'fallback' ? true : undefined}
      {...a11y}
    >
      <div ref={hostRef} className="pl-three__canvas" tabIndex={interactive && status === 'ready' && !decorative ? 0 : undefined} />
      {status === 'fallback' && <div className="pl-three__fallback">{fallback}</div>}
      {children}
    </div>
  );
}

/* ================================================================== Scene3D */

export interface Scene3DProps {
  /** Build your scene. Return a cleanup function, or { tick, onColors, cleanup }. */
  setup: SceneSetup;
  /** Accessible name (role="img"). Required unless `decorative`. */
  label?: string;
  /** Longer text alternative, rendered visually hidden and linked via aria-describedby. */
  description?: ReactNode;
  /** Hide from assistive technology (purely decorative scene). */
  decorative?: boolean;
  /** Drag / arrow-key orbit and +/- zoom. */
  interactive?: boolean;
  /** Run the animation loop (default true; always off under reduced motion). */
  animate?: boolean;
  camera?: CameraOptions;
  /** Rendered when WebGL is unavailable. Defaults to the label text. */
  fallback?: ReactNode;
  /** CSS height (default 20rem). */
  height?: string;
  deps?: unknown[];
  className?: string;
  style?: CSSProperties;
}

/** Generic three.js canvas with lifecycle, theming, a11y and fallbacks handled. */
export function Scene3D({ setup, label, description, decorative, interactive, animate, camera, fallback, height, deps, className, style }: Scene3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const descId = useId();
  const { status } = useThreeScene(hostRef, { setup, interactive, animate, camera, deps });
  const hasDesc = !decorative && (description || interactive);
  return (
    <CanvasHost
      hostRef={hostRef}
      status={status}
      height={height}
      className={className}
      style={style}
      label={label}
      decorative={decorative}
      interactive={interactive}
      describedBy={hasDesc ? descId : undefined}
      fallback={fallback ?? (decorative ? null : <span>{label}</span>)}
    >
      {hasDesc && (
        <span id={descId} className="pl-sr-only">
          {description} {interactive && status === 'ready' ? KEY_HELP : ''}
        </span>
      )}
    </CanvasHost>
  );
}

/* ================================================================== helpers */

function latLngToVector(lat: number, lng: number, radius: number): Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

function setColor(material: Material | Material[], color: ThemeColors[keyof ThemeColors]) {
  for (const m of Array.isArray(material) ? material : [material]) (m as MeshBasicMaterial).color?.copy(color);
}

/* ================================================================== Globe3D */

export interface GeoPoint {
  lat: number;
  lng: number;
}
export interface GlobeMarker extends GeoPoint {
  label: string;
}
export interface GlobeArc {
  from: GeoPoint;
  to: GeoPoint;
  label?: string;
}

export interface Globe3DProps {
  /** Accessible name. Default "Globe". */
  label?: string;
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  /** Number of surface dots. Default 1400. */
  dots?: number;
  autoRotate?: boolean;
  interactive?: boolean;
  /** Show the marker list visibly (always present for screen readers). */
  showList?: boolean;
  listLabel?: string;
  height?: string;
  className?: string;
}

/** Dotted globe with markers and arcs, plus a text list alternative of the markers. */
export function Globe3D({
  label = 'Globe',
  markers = [],
  arcs = [],
  dots = 1400,
  autoRotate = true,
  interactive = true,
  showList = false,
  listLabel = 'Locations',
  height,
  className,
}: Globe3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const setup: SceneSetup = ({ scene, colors }) => {
    const globe = new Group();
    scene.add(globe);
    // Occluding core so back dots fade.
    const core = new Mesh(new SphereGeometry(0.985, 48, 48), new MeshBasicMaterial({ color: colors.surfaceAlt, transparent: true, opacity: 0.9 }));
    globe.add(core);
    // Fibonacci-sphere dots.
    const positions = new Float32Array(dots * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < dots; i++) {
      const y = 1 - (i / (dots - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      positions.set([Math.cos(t) * r, y, Math.sin(t) * r], i * 3);
    }
    const dotGeo = new BufferGeometry();
    dotGeo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const dotsObj = new Points(dotGeo, new PointsMaterial({ color: colors.primary, size: 0.022, sizeAttenuation: true }));
    globe.add(dotsObj);

    const markerObjs: Mesh[] = markers.map((m) => {
      const mesh = new Mesh(new SphereGeometry(0.03, 12, 12), new MeshBasicMaterial({ color: colors.warning }));
      mesh.position.copy(latLngToVector(m.lat, m.lng, 1.01));
      globe.add(mesh);
      return mesh;
    });
    const arcObjs: Line[] = arcs.map((a) => {
      const start = latLngToVector(a.from.lat, a.from.lng, 1.01);
      const end = latLngToVector(a.to.lat, a.to.lng, 1.01);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(1 + start.distanceTo(end) * 0.35);
      const geo = new BufferGeometry().setFromPoints(new QuadraticBezierCurve3(start, mid, end).getPoints(48));
      const line = new Line(geo, new LineBasicMaterial({ color: colors.info }));
      globe.add(line);
      return line;
    });
    globe.rotation.x = 0.35;
    return {
      tick: (dt) => {
        if (autoRotate) globe.rotation.y += dt * 0.12;
      },
      onColors: (c) => {
        setColor(core.material, c.surfaceAlt);
        setColor(dotsObj.material, c.primary);
        markerObjs.forEach((m) => setColor(m.material, c.warning));
        arcObjs.forEach((l) => setColor(l.material, c.info));
      },
    };
  };
  const { status } = useThreeScene(hostRef, {
    setup,
    interactive,
    camera: { position: [0, 0, 3.2] },
    minDistance: 1.8,
    maxDistance: 6,
    deps: [JSON.stringify(markers), JSON.stringify(arcs), dots, autoRotate, interactive],
  });
  const name = markers.length ? `${label}, ${markers.length} location${markers.length === 1 ? '' : 's'} marked` : label;
  return (
    <figure className={cx('pl-globe3d', className)}>
      <CanvasHost
        hostRef={hostRef}
        status={status}
        height={height}
        label={name}
        interactive={interactive}
        describedBy={markers.length ? listId : undefined}
        fallback={<span>{name}</span>}
      />
      {markers.length > 0 && (
        <figcaption className={showList ? 'pl-globe3d__caption' : 'pl-sr-only'}>
          <span id={listId}>{listLabel}</span>
          <ul aria-labelledby={listId}>
            {markers.map((m, i) => (
              <li key={i}>
                {m.label} ({formatCoord(m.lat, 'N', 'S')}, {formatCoord(m.lng, 'E', 'W')})
              </li>
            ))}
          </ul>
          {arcs.some((a) => a.label) && (
            <ul aria-label="Connections">
              {arcs.filter((a) => a.label).map((a, i) => (
                <li key={i}>{a.label}</li>
              ))}
            </ul>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function formatCoord(value: number, pos: string, neg: string) {
  return `${Math.abs(value).toFixed(1)}° ${value >= 0 ? pos : neg}`;
}

/* ================================================================== ParticlesField */

export interface ParticlesFieldProps {
  /** Particle count. Default 600. */
  count?: number;
  /** Drift speed multiplier. Default 1. */
  speed?: number;
  /** Fill the positioned parent as a background layer. Default true. */
  background?: boolean;
  height?: string;
  className?: string;
}

/** Ambient particle background. Decorative (aria-hidden). */
export function ParticlesField({ count = 600, speed = 1, background = true, height, className }: ParticlesFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const setup: SceneSetup = ({ scene, colors }) => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 10;
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({ color: colors.primary, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false });
    const points = new Points(geo, material);
    scene.add(points);
    return {
      tick: (dt, t) => {
        points.rotation.y += dt * 0.03 * speed;
        points.rotation.x = Math.sin(t * 0.1 * speed) * 0.1;
      },
      onColors: (c) => material.color.copy(c.primary),
    };
  };
  const { status } = useThreeScene(hostRef, { setup, camera: { position: [0, 0, 6] }, deps: [count, speed] });
  return <CanvasHost hostRef={hostRef} status={status} height={height} decorative className={cx(background && 'pl-three--bg', className)} fallback={null} />;
}

/* ================================================================== FloatingShapes */

export interface FloatingShapesProps {
  /** Number of shapes (1–8). Default 5. */
  count?: number;
  background?: boolean;
  height?: string;
  className?: string;
}

/** Glassy floating geometric shapes for hero backgrounds. Decorative (aria-hidden). */
export function FloatingShapes({ count = 5, background = true, height, className }: FloatingShapesProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const setup: SceneSetup = ({ scene, colors }) => {
    scene.add(new AmbientLight(0xffffff, 0.8));
    const sun = new DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 4, 5);
    scene.add(sun);
    const makers = [
      () => new IcosahedronGeometry(0.7, 0),
      () => new TorusGeometry(0.55, 0.2, 24, 64),
      () => new OctahedronGeometry(0.65, 0),
      () => new BoxGeometry(0.8, 0.8, 0.8),
      () => new SphereGeometry(0.5, 32, 32),
    ];
    const tones: Array<keyof ThemeColors> = ['primary', 'info', 'primaryInk', 'success', 'warning'];
    const n = Math.min(Math.max(Math.round(count), 1), 8);
    const shapes = Array.from({ length: n }, (_, i) => {
      const material = new MeshPhysicalMaterial({
        color: colors[tones[i % tones.length]],
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: 0.72,
      });
      const mesh = new Mesh(makers[i % makers.length](), material);
      const angle = (i / n) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 2.4, Math.sin(angle) * 1.3, -Math.random() * 1.5);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(mesh);
      return { mesh, tone: tones[i % tones.length], base: mesh.position.y, phase: i * 1.3 };
    });
    return {
      tick: (dt, t) => {
        for (const s of shapes) {
          s.mesh.rotation.x += dt * 0.25;
          s.mesh.rotation.y += dt * 0.35;
          s.mesh.position.y = s.base + Math.sin(t * 0.8 + s.phase) * 0.18;
        }
      },
      onColors: (c) => shapes.forEach((s) => setColor(s.mesh.material, c[s.tone])),
    };
  };
  const { status } = useThreeScene(hostRef, { setup, camera: { position: [0, 0, 6] }, deps: [count] });
  return <CanvasHost hostRef={hostRef} status={status} height={height} decorative className={cx(background && 'pl-three--bg', className)} fallback={null} />;
}

/* ================================================================== ModelViewer */

export interface ModelViewerProps {
  /** URL of a .gltf / .glb file. */
  src: string;
  /** Required text alternative describing the model. */
  alt: string;
  autoRotate?: boolean;
  /** Drag / keyboard orbit. Default true. */
  interactive?: boolean;
  /** Shown when WebGL is unavailable (e.g. a poster <img>). Defaults to the alt text. */
  fallback?: ReactNode;
  loadingLabel?: string;
  errorText?: ReactNode;
  height?: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: unknown) => void;
}

/** glTF/GLB viewer with orbit controls, loading progress and an error state. */
export function ModelViewer({
  src,
  alt,
  autoRotate = false,
  interactive = true,
  fallback,
  loadingLabel = 'Loading 3D model',
  errorText = 'The 3D model could not be loaded.',
  height,
  className,
  onLoad,
  onError,
}: ModelViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const descId = useId();
  const [progress, setProgress] = useState<number | null>(0);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const callbacks = useRef({ onLoad, onError });
  callbacks.current = { onLoad, onError };

  const setup: SceneSetup = ({ scene, invalidate }) => {
    let cancelled = false;
    let model: Object3D | null = null;
    setLoadState('loading');
    setProgress(0);
    scene.add(new AmbientLight(0xffffff, 1.1));
    const key = new DirectionalLight(0xffffff, 2);
    key.position.set(3, 5, 4);
    scene.add(key);
    const pivot = new Group();
    scene.add(pivot);
    import('three/examples/jsm/loaders/GLTFLoader.js')
      .then(({ GLTFLoader }) => {
        if (cancelled) return;
        new GLTFLoader().load(
          src,
          (gltf) => {
            if (cancelled) {
              disposeObject(gltf.scene);
              return;
            }
            model = gltf.scene;
            const box = new Box3().setFromObject(model);
            const size = box.getSize(new Vector3()).length() || 1;
            const center = box.getCenter(new Vector3());
            model.position.sub(center);
            pivot.scale.setScalar(2 / size);
            pivot.add(model);
            setProgress(null);
            setLoadState('loaded');
            invalidate();
            callbacks.current.onLoad?.();
          },
          (event) => {
            if (!cancelled && event.lengthComputable && event.total) setProgress(Math.round((event.loaded / event.total) * 100));
          },
          (error) => {
            if (cancelled) return;
            setLoadState('error');
            callbacks.current.onError?.(error);
          },
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadState('error');
        callbacks.current.onError?.(error);
      });
    return {
      tick: (dt) => {
        if (autoRotate) pivot.rotation.y += dt * 0.4;
      },
      cleanup: () => {
        cancelled = true;
      },
    };
  };
  const { status } = useThreeScene(hostRef, {
    setup,
    interactive,
    camera: { position: [0, 0.6, 3.2], fov: 40 },
    minDistance: 1.2,
    maxDistance: 8,
    deps: [src, autoRotate, interactive],
  });
  return (
    <CanvasHost
      hostRef={hostRef}
      status={status}
      height={height}
      className={cx('pl-model-viewer', className)}
      label={alt}
      interactive={interactive}
      describedBy={interactive && status === 'ready' ? descId : undefined}
      fallback={fallback ?? <span>{alt}</span>}
    >
      {interactive && status === 'ready' && (
        <span id={descId} className="pl-sr-only">
          {KEY_HELP}
        </span>
      )}
      {status === 'ready' && loadState === 'loading' && (
        <div className="pl-three__status">
          <div
            className="pl-three__progress"
            role="progressbar"
            aria-label={loadingLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress ?? undefined}
          >
            <span style={{ width: `${progress ?? 0}%` }} />
          </div>
        </div>
      )}
      {loadState === 'error' && (
        <div className="pl-three__status pl-three__status--error" role="alert">
          {errorText}
        </div>
      )}
    </CanvasHost>
  );
}

/* ================================================================== Chart3D */

export interface Chart3DDatum {
  label: string;
  value: number;
}

export interface Chart3DProps {
  /** Chart title, rendered as the figcaption and table caption. */
  title: string;
  data: Chart3DDatum[];
  /** Header of the value column. Default "Value". */
  valueLabel?: string;
  /** Header of the label column. Default "Category". */
  categoryLabel?: string;
  format?: (value: number) => string;
  interactive?: boolean;
  /** Show the data table visibly (it is always available to screen readers). */
  showTable?: boolean;
  height?: string;
  className?: string;
}

/** 3D bar chart with an accessible data table (visible automatically when WebGL is unavailable). */
export function Chart3D({
  title,
  data,
  valueLabel = 'Value',
  categoryLabel = 'Category',
  format = (v) => v.toLocaleString(),
  interactive = true,
  showTable = false,
  height,
  className,
}: Chart3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const captionId = useId();
  const setup: SceneSetup = ({ scene, colors }) => {
    scene.add(new AmbientLight(0xffffff, 0.9));
    const sun = new DirectionalLight(0xffffff, 1.8);
    sun.position.set(4, 6, 5);
    scene.add(sun);
    const n = data.length;
    const max = Math.max(1e-9, ...data.map((d) => Math.abs(d.value)));
    const spacing = 1;
    const offset = ((n - 1) * spacing) / 2;
    const bars = new Group();
    const material = new MeshStandardMaterial({ color: colors.primary, roughness: 0.45, metalness: 0.1 });
    data.forEach((d, i) => {
      const h = Math.max(0.02, (Math.abs(d.value) / max) * 2.5);
      const bar = new Mesh(new BoxGeometry(0.6, h, 0.6), material);
      bar.position.set(i * spacing - offset, d.value >= 0 ? h / 2 : -h / 2, 0);
      bars.add(bar);
    });
    scene.add(bars);
    const grid = new GridHelper(Math.max(4, n * spacing + 1), Math.max(4, n + 1), colors.border, colors.border);
    scene.add(grid);
    return {
      onColors: (c) => {
        material.color.copy(c.primary);
        setColor(grid.material as Material, c.border);
      },
    };
  };
  const { status } = useThreeScene(hostRef, {
    setup,
    interactive,
    animate: false,
    camera: { position: [0, 3, Math.max(6, data.length * 1.1)], fov: 40 },
    deps: [JSON.stringify(data), interactive],
  });
  const fallback = status === 'fallback';
  return (
    <figure className={cx('pl-chart3d', className)}>
      <figcaption id={captionId} className="pl-chart3d__title">
        {title}
      </figcaption>
      <CanvasHost
        hostRef={hostRef}
        status={status}
        height={height}
        label={`${title}: 3D bar chart. Values are listed in the data table.`}
        interactive={interactive}
        fallback={null}
        hideOnFallback
      />
      <div className={showTable || fallback ? 'pl-table-wrap' : 'pl-sr-only'}>
        <table className="pl-table">
          <caption className="pl-sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">{categoryLabel}</th>
              <th scope="col" className="pl-table__align-end">
                {valueLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <th scope="row">{d.label}</th>
                <td className="pl-table__align-end">{format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

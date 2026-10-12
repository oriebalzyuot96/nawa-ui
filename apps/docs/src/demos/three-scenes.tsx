// Heavy module: imports three.js. Only loaded (via React.lazy in ./three.tsx) when a WebGL demo scrolls into view.
import { useEffect, useState } from 'react';
import { Chart3D, FloatingShapes, Globe3D, ModelViewer, ParticlesField, Scene3D } from '@nawa-ui/three';
import {
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  BoxGeometry,
} from 'three';

function Scene3DDemo() {
  return (
    <Scene3D
      label="A torus knot in the theme colour"
      description="Drag, or focus and use the arrow keys, to orbit the camera."
      interactive
      height="18rem"
      setup={({ scene, colors }) => {
        const material = new MeshStandardMaterial({ color: colors.primary, roughness: 0.35, metalness: 0.25 });
        const mesh = new Mesh(new TorusKnotGeometry(0.7, 0.22, 180, 24), material);
        const light = new DirectionalLight(0xffffff, 2.2);
        light.position.set(3, 4, 5);
        scene.add(mesh, light, new DirectionalLight(0xffffff, 0.6));
        return {
          tick: (dt) => {
            mesh.rotation.y += dt * 0.5;
            mesh.rotation.x += dt * 0.2;
          },
          onColors: (c) => material.color.copy(c.primary),
        };
      }}
    />
  );
}

const offices = [
  { lat: 31.95, lng: 35.93, label: 'Amman' },
  { lat: 25.2, lng: 55.27, label: 'Dubai' },
  { lat: 51.51, lng: -0.13, label: 'London' },
  { lat: 52.52, lng: 13.4, label: 'Berlin' },
  { lat: 40.71, lng: -74.0, label: 'New York' },
  { lat: 35.68, lng: 139.69, label: 'Tokyo' },
  { lat: -23.55, lng: -46.63, label: 'São Paulo' },
];
const amman = offices[0]!;

function GlobeDemo() {
  return (
    <Globe3D
      label="Nawa UI community offices"
      height="22rem"
      showList
      markers={offices}
      arcs={offices.slice(1).map((o) => ({ from: amman, to: o, label: `Amman → ${o.label}` }))}
    />
  );
}

function ParticlesDemo() {
  return (
    <div style={{ position: 'relative', height: '16rem', width: '100%', borderRadius: 'var(--nw-radius-lg)', overflow: 'hidden', background: 'var(--nw-surface)' }}>
      <ParticlesField count={700} />
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', padding: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.8rem', margin: 0 }}>Build something calm</h3>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>Particles drift behind real, readable content.</p>
        </div>
      </div>
    </div>
  );
}

function ShapesDemo() {
  return (
    <div style={{ position: 'relative', height: '18rem', width: '100%', borderRadius: 'var(--nw-radius-lg)', overflow: 'hidden', background: 'var(--nw-surface-alt)' }}>
      <FloatingShapes count={6} />
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.8rem', margin: 0 }}>Hero background</h3>
      </div>
    </div>
  );
}

function Chart3DDemo() {
  return (
    <Chart3D
      title="Revenue by region, 2025 ($M)"
      height="20rem"
      valueLabel="Revenue"
      categoryLabel="Region"
      format={(v) => `$${v.toFixed(1)}M`}
      showTable
      data={[
        { label: 'MENA', value: 12.4 },
        { label: 'Europe', value: 9.1 },
        { label: 'N. America', value: 7.6 },
        { label: 'Asia', value: 5.3 },
        { label: 'LatAm', value: 2.8 },
      ]}
    />
  );
}

/** Builds a small "desk lamp" model in memory and exports it as a GLB blob URL. */
async function buildLampGlb(): Promise<string> {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const scene = new Scene();
  const lamp = new Group();
  const metal = new MeshStandardMaterial({ color: 0x5b34d6, roughness: 0.35, metalness: 0.6 });
  const shade = new MeshStandardMaterial({ color: 0xf5b301, roughness: 0.5 });
  const base = new Mesh(new CylinderGeometry(0.7, 0.8, 0.15, 48), metal);
  const arm1 = new Mesh(new CylinderGeometry(0.06, 0.06, 1.4, 16), metal);
  arm1.position.set(0, 0.75, 0);
  arm1.rotation.z = 0.25;
  const joint = new Mesh(new SphereGeometry(0.12, 24, 24), metal);
  joint.position.set(-0.17, 1.45, 0);
  const arm2 = new Mesh(new CylinderGeometry(0.05, 0.05, 1.0, 16), metal);
  arm2.position.set(0.18, 1.75, 0);
  arm2.rotation.z = -1.0;
  const head = new Mesh(new CylinderGeometry(0.18, 0.45, 0.45, 32, 1, true), shade);
  head.position.set(0.62, 1.82, 0);
  head.rotation.z = -2.4;
  const ring = new Mesh(new TorusGeometry(0.45, 0.03, 12, 48), metal);
  ring.position.copy(head.position);
  ring.rotation.set(Math.PI / 2, 0, -0.8);
  const book = new Mesh(new BoxGeometry(0.9, 0.12, 0.6), new MeshStandardMaterial({ color: 0x0f766e }));
  book.position.set(0.9, 0.06, 0.2);
  lamp.add(base, arm1, joint, arm2, head, ring, book);
  scene.add(lamp);
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true });
  return URL.createObjectURL(new Blob([glb as ArrayBuffer], { type: 'model/gltf-binary' }));
}

function ModelViewerDemo() {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    buildLampGlb()
      .then((u) => {
        url = u;
        if (!cancelled) setSrc(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);
  if (failed) return <p className="muted">Could not build the demo model in this browser.</p>;
  if (!src) return <p className="muted">Building a small GLB model in your browser…</p>;
  return <ModelViewer src={src} alt="A purple desk lamp with a yellow shade next to a green book" autoRotate height="20rem" />;
}

const scenes: Record<string, () => JSX.Element> = {
  scene3d: Scene3DDemo,
  globe3d: GlobeDemo,
  particlesfield: ParticlesDemo,
  floatingshapes: ShapesDemo,
  chart3d: Chart3DDemo,
  modelviewer: ModelViewerDemo,
};

export default function ThreeScene({ id }: { id: string }) {
  const C = scenes[id];
  return C ? <C /> : null;
}

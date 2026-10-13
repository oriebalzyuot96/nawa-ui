import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader } from '@pelagic-ui/react';
import { DemoFrame } from './shared';

// three.js (~600 KB) is split into its own chunk and fetched only when this island becomes visible.
const ThreeScene = lazy(() => import('./three-scenes'));

const stacked = new Set(['scene3d', 'globe3d', 'particlesfield', 'floatingshapes', 'chart3d', 'modelviewer']);

export default function ThreeDemo({ id }: { id: string }) {
  // Render the WebGL part only after hydration: the server output is a lightweight placeholder.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const placeholder = (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '12rem' }}>
      <Loader type="orbit" label="Loading 3D scene" showLabel />
    </div>
  );
  return (
    <DemoFrame id={id} stack={stacked.has(id)}>
      {mounted ? (
        <Suspense fallback={placeholder}>
          <ThreeScene id={id} />
        </Suspense>
      ) : (
        placeholder
      )}
    </DemoFrame>
  );
}

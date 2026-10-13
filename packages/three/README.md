# @pelagic-ui/three

Accessible, theme-aware WebGL components for React, built on [three.js](https://threejs.org/) and the
[Pelagic UI](https://oriieebgsmile96.github.io/pelagic-ui/) design tokens.

```bash
npm install @pelagic-ui/three @pelagic-ui/core three
```

```tsx
import '@pelagic-ui/core/style.css';
import { Globe3D, Chart3D } from '@pelagic-ui/three';

<Globe3D markers={[{ label: 'Riyadh', lat: 24.7, lng: 46.7 }]} />
<Chart3D title="Sales by region" data={[{ label: 'North', value: 1200 }, { label: 'South', value: 800 }]} />
```

## Components

| Component | API | Accessibility |
| --- | --- | --- |
| `Scene3D` | `setup({ scene, camera, renderer, colors, invalidate }) => cleanup \| { tick, onColors, cleanup }`, `label`, `description`, `interactive`, `decorative`, `fallback` | `role="img"` + `aria-label`, optional description; keyboard orbit when interactive |
| `Globe3D` | `markers`, `arcs`, `dots`, `autoRotate`, `interactive`, `showList` | Marker list as a text alternative (visually hidden by default) |
| `ParticlesField` | `count`, `speed`, `background` | Decorative (`aria-hidden`) |
| `FloatingShapes` | `count`, `background` | Decorative (`aria-hidden`) |
| `ModelViewer` | `src` (glTF/GLB), **`alt` (required)**, `autoRotate`, `interactive`, `fallback` | Progress bar while loading, `role="alert"` on error |
| `Chart3D` | `title`, `data: { label, value }[]`, `format`, `showTable` | `figure`/`figcaption` + data table (screen-reader only, visible without WebGL) |

Interactive views: drag to rotate, or focus and use **arrow keys** to rotate, **+ / -** to zoom, **Home** to reset.

## Performance and safety

- Renderer created lazily when the canvas first scrolls into view; `devicePixelRatio` capped at 2.
- The animation loop pauses off-screen (`IntersectionObserver`) and in hidden tabs (`document.hidden`).
- `prefers-reduced-motion: reduce` renders a single static frame, with no animation loop.
- Geometries, materials, textures and the renderer are disposed on unmount.
- If WebGL is unavailable a static fallback is rendered instead of a canvas.
- Colors come from `--pl-primary`, `--pl-surface`, etc., and are re-read when `data-theme` / `data-accent`
  change on `<html>` or the OS color scheme changes.

`three` is a peer dependency (`>=0.160`, tested with 0.170). `GLTFLoader` is loaded with a dynamic import
only when a `ModelViewer` mounts.

## License

MIT

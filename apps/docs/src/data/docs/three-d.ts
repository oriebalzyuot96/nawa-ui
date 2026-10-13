import type { CategoryDoc } from './types';

const orbitKeys: [string, string][] = [
  ['Tab', 'Focus the scene'],
  ['Arrow keys', 'Rotate the camera'],
  ['+ / -', 'Zoom in / out'],
];

export const threeD: CategoryDoc = {
  slug: '3d',
  nav: '3D & effects',
  icon: '🧊',
  title: '3D components — CSS 3D cards and accessible Three.js Globe, Particles, Chart3D',
  h1: '3D & effects',
  description:
    'Accessible 3D components with live demos: CSS 3D TiltCard, FlipCard, CubeCarousel, ParallaxLayers, Text3D, plus WebGL Globe3D, ParticlesField, FloatingShapes, Chart3D and ModelViewer from @pelagic-ui/three.',
  intro:
    'Two layers of depth. CSS 3D effects ship in @pelagic-ui/react and cost no JavaScript beyond the component. WebGL scenes live in @pelagic-ui/three: they follow the theme, pause off-screen, render a single still frame under reduced motion and fall back gracefully without WebGL. Three.js is only downloaded when a 3D scene scrolls into view.',
  entries: [
    {
      id: 'tiltcard',
      name: 'TiltCard',
      description: 'A card that tilts toward the pointer with an optional glare highlight.',
      props: [
        ['maxTilt', 'number', 'Maximum tilt in degrees. Default 10.'],
        ['glare', 'boolean', 'Light glare that follows the pointer.'],
        ['padded', 'boolean', 'Inner padding.'],
      ],
      a11y: 'Purely visual: content stays readable and focusable; the tilt is disabled under prefers-reduced-motion.',
      code: {
        react: `<TiltCard maxTilt={12}>
  <h3>Pro plan</h3>
  <p>$29 / month</p>
</TiltCard>`,
      },
    },
    {
      id: 'flipcard',
      name: 'FlipCard',
      description: 'A two-sided card flipped by a real toggle button.',
      props: [
        ['front / back', 'ReactNode', 'Faces.'],
        ['flipLabel', 'ReactNode', 'Button text. Default “Show back”.'],
        ['flipped / onFlippedChange', 'boolean', 'Controlled state.'],
        ['height', 'string', 'Card height.'],
      ],
      keys: [['Enter / Space', 'Flip (on the flip button)']],
      a11y: 'The button reports aria-pressed; the hidden face is aria-hidden and inert. Crossfades instead of rotating under reduced motion.',
      code: {
        react: `<FlipCard height="14rem" front={<p>What is WCAG?</p>} back={<p>Web Content Accessibility Guidelines.</p>} />`,
      },
    },
    {
      id: 'cubecarousel',
      name: 'CubeCarousel',
      description: 'Slides on the faces of a rotating cube. Drag or swipe to turn it.',
      props: [
        ['label', 'string', 'Accessible name (required).'],
        ['slides', '{ title?, content }[]', 'Slides.'],
        ['index / onIndexChange', 'number', 'Controlled slide.'],
        ['autoplay', 'number', 'Interval (ms); pauses on hover and focus.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Previous / next slide (mirrored in RTL)'],
        ['Home / End', 'First / last slide'],
      ],
      a11y: 'aria-roledescription="carousel"; inactive faces are hidden from assistive tech and the new slide is announced. With reduced motion (OS or data-a11y-motion="off") it is a flat slider.',
      code: {
        react: `<CubeCarousel label="Release highlights" slides={[
  { title: 'Charts', content: <p>15 accessible chart types</p> },
  { title: '3D', content: <p>WebGL with fallbacks</p> },
]} />`,
      },
    },
    {
      id: 'carousel3d',
      name: 'Carousel3D',
      description: 'A perspective carousel in three modes — coverflow, ring and stack — with drag and swipe, dots and autoplay.',
      props: [
        ['label', 'string', 'Accessible name (required).'],
        ['slides', '{ title?, content }[]', 'Slides.'],
        ['mode', "'coverflow' | 'ring' | 'stack'", 'Layout in depth. Default coverflow.'],
        ['index / onIndexChange', 'number', 'Controlled slide.'],
        ['autoplay', 'number', 'Interval (ms, min 2000). Adds a pause button; pauses on hover and focus.'],
        ['loop / showDots', 'boolean', 'Wrap around; slide picker dots.'],
        ['slideWidth / height', 'string', 'Slide size (CSS lengths; use vw or rem for ring mode).'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Previous / next slide (mirrored in RTL)'],
        ['Home / End', 'First / last slide'],
      ],
      a11y: 'APG carousel: the rotation control comes first, slides are labelled groups ("2 of 5: Themes"), neighbours are visible but aria-hidden and inert, and the slide region is polite only when not rotating. Reduced motion turns it into a plain slider and never autoplays.',
      code: {
        react: `<Carousel3D label="Product gallery" mode="coverflow" autoplay={5000} slides={[
  { title: 'Charts', content: <ChartsCard /> },
  { title: 'Themes', content: <ThemesCard /> },
  { title: 'RTL', content: <RtlCard /> },
]} />`,
      },
    },
    {
      id: 'parallaxlayers',
      name: 'ParallaxLayers',
      description: 'Layers that move at different depths with the pointer or on scroll.',
      props: [
        ['layers', '{ content, depth, decorative? }[]', 'Depth: 0 (static) to ~1 (moves most).'],
        ['trigger', "'pointer' | 'scroll'", 'What drives the motion.'],
      ],
      a11y: 'Decorative layers are aria-hidden; motion stops under prefers-reduced-motion.',
      code: {
        react: `<ParallaxLayers layers={[
  { content: <Sky />, depth: 0.2, decorative: true },
  { content: <Hills />, depth: 0.5, decorative: true },
  { content: <h2>Explore</h2>, depth: 0.9 },
]} />`,
      },
    },
    {
      id: 'text3d',
      name: 'Text3D',
      description: 'Extruded headline text built from layered shadows (alias: ExtrudedText).',
      props: [
        ['as', 'ElementType', 'Element. Default h2.'],
        ['depth', 'number (1–16)', 'Extrusion depth.'],
        ['tone', "'primary' | 'surface'", 'Colour.'],
      ],
      a11y: 'Real text, so it is selectable, translatable and read normally.',
      code: {
        react: `<Text3D as="h2" depth={8}>Pelagic UI</Text3D>`,
      },
    },
    {
      id: 'floating3dicon',
      name: 'Floating3DIcon',
      description: 'A decorative floating tile for icons in heroes and empty states.',
      props: [
        ['icon', 'ReactNode', 'Glyph or SVG.'],
        ['size', 'string', 'CSS size.'],
      ],
      a11y: 'Decorative (aria-hidden). Pair it with real text.',
      code: { react: `<Floating3DIcon icon="🚀" size="5rem" />` },
    },
    {
      id: 'orbitbadge',
      name: 'OrbitBadge',
      description: 'A decorative badge with satellites orbiting on a tilted ring.',
      props: [
        ['children', 'ReactNode', 'Centre content.'],
        ['size', 'string', 'CSS size.'],
      ],
      a11y: 'Decorative (aria-hidden); orbit stops under reduced motion.',
      code: { react: `<OrbitBadge size="8rem">AA</OrbitBadge>` },
    },
    {
      id: 'perspective3dstack',
      name: 'Perspective3DStack',
      description: 'Cards stacked in perspective that fan out on hover or when open.',
      props: [
        ['items / children', 'ReactNode[]', 'Cards.'],
        ['label', 'string', 'List name.'],
        ['open', 'boolean', 'Fan out permanently.'],
      ],
      a11y: 'A labelled list, so the number of cards is announced.',
      code: {
        react: `<Perspective3DStack label="Recent invoices" items={[<Invoice n={1} />, <Invoice n={2} />, <Invoice n={3} />]} />`,
      },
    },
    {
      id: 'scene3d',
      name: 'Scene3D',
      description: 'The base of every WebGL component: bring your own Three.js setup and get theming, resizing, pausing and fallbacks.',
      props: [
        ['setup', '(ctx) => SceneHandle | cleanup', 'Build the scene; return { tick, cleanup, onColors }.'],
        ['label / description', 'string / ReactNode', 'Text alternative (or decorative).'],
        ['interactive', 'boolean', 'Pointer drag + keyboard orbit.'],
        ['camera', '{ fov, position, near, far }', 'Camera options.'],
        ['fallback', 'ReactNode', 'Shown without WebGL.'],
      ],
      keys: orbitKeys,
      a11y: 'role="img" with your label; the canvas itself is aria-hidden. Animation is limited to one frame under reduced motion and pauses off-screen.',
      demo: 'three',
      code: {
        react: `import { Scene3D } from '@pelagic-ui/three';
import { Mesh, TorusKnotGeometry, MeshStandardMaterial, DirectionalLight } from 'three';

<Scene3D label="Rotating torus knot" interactive setup={({ scene, colors }) => {
  const mesh = new Mesh(new TorusKnotGeometry(0.7, 0.22, 160, 24), new MeshStandardMaterial({ color: colors.primary }));
  scene.add(mesh, new DirectionalLight(0xffffff, 2));
  return { tick: (dt) => { mesh.rotation.y += dt * 0.6; } };
}} />`,
      },
    },
    {
      id: 'globe3d',
      name: 'Globe3D',
      description: 'A dotted globe with labelled markers and animated arcs.',
      props: [
        ['markers', '{ lat, lng, label }[]', 'Locations.'],
        ['arcs', '{ from, to, label? }[]', 'Connections.'],
        ['autoRotate / interactive', 'boolean', 'Motion and orbit controls.'],
        ['showList', 'boolean', 'Visible list of locations (always available to screen readers).'],
        ['dots', 'number', 'Dot density.'],
      ],
      keys: orbitKeys,
      a11y: 'Markers and connections are also rendered as lists, so the data is never locked inside the canvas.',
      demo: 'three',
      code: {
        react: `import { Globe3D } from '@pelagic-ui/three';

<Globe3D label="Our offices" showList
  markers={[{ lat: 31.95, lng: 35.93, label: 'Amman' }, { lat: 51.5, lng: -0.12, label: 'London' }]}
  arcs={[{ from: { lat: 31.95, lng: 35.93 }, to: { lat: 51.5, lng: -0.12 }, label: 'Amman → London' }]} />`,
      },
    },
    {
      id: 'particlesfield',
      name: 'ParticlesField',
      description: 'An ambient drifting particle background in the theme colour.',
      props: [
        ['count', 'number', 'Particles. Default 600.'],
        ['speed', 'number', 'Drift speed multiplier.'],
        ['background', 'boolean', 'Position behind content.'],
        ['height', 'string', 'CSS height.'],
      ],
      a11y: 'Decorative (aria-hidden); still under reduced motion.',
      demo: 'three',
      code: {
        react: `<div style={{ position: 'relative' }}>
  <ParticlesField count={800} />
  <h1>Hero title</h1>
</div>`,
      },
    },
    {
      id: 'floatingshapes',
      name: 'FloatingShapes',
      description: 'Glassy geometric shapes floating slowly — for hero backgrounds.',
      props: [
        ['count', 'number', 'Shapes. Default 5.'],
        ['background', 'boolean', 'Position behind content.'],
        ['height', 'string', 'CSS height.'],
      ],
      a11y: 'Decorative (aria-hidden).',
      demo: 'three',
      code: { react: `<FloatingShapes count={6} height="20rem" />` },
    },
    {
      id: 'chart3d',
      name: 'Chart3D',
      description: 'A 3D bar chart with an always-available data table.',
      props: [
        ['title', 'string', 'Caption (required).'],
        ['data', '{ label, value }[]', 'Bars.'],
        ['format', '(value) => string', 'Value formatting.'],
        ['showTable', 'boolean', 'Show the table visibly (it is always present for screen readers).'],
        ['valueLabel / categoryLabel', 'string', 'Table headers.'],
      ],
      keys: orbitKeys,
      demo: 'three',
      code: {
        react: `<Chart3D title="Revenue by region ($M)" showTable format={(v) => '$' + v + 'M'}
  data={[{ label: 'MENA', value: 12.4 }, { label: 'Europe', value: 9.1 }, { label: 'Americas', value: 7.6 }]} />`,
      },
    },
    {
      id: 'modelviewer',
      name: 'ModelViewer',
      description: 'Loads and displays a glTF/GLB model with orbit controls, progress and an error state.',
      props: [
        ['src', 'string', 'URL of a .glb / .gltf file.'],
        ['alt', 'string', 'Text alternative (required).'],
        ['autoRotate / interactive', 'boolean', 'Motion and controls.'],
        ['loadingLabel / errorText / fallback', '…', 'States.'],
        ['onLoad / onError', 'callbacks', 'Lifecycle.'],
      ],
      keys: orbitKeys,
      note: 'The demo builds a small model in your browser with GLTFExporter and loads it from a blob URL — no external file.',
      demo: 'three',
      code: {
        react: `import { ModelViewer } from '@pelagic-ui/three';

<ModelViewer src="/models/chair.glb" alt="Walnut lounge chair" autoRotate height="22rem" />`,
      },
    },
  ],
};

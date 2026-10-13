import { useState } from 'react';
import {
  Badge,
  Button,
  Carousel3D,
  CubeCarousel,
  FlipCard,
  Floating3DIcon,
  OrbitBadge,
  ParallaxLayers,
  Perspective3DStack,
  Text3D,
  TiltCard,
} from '@orca-ui/react';
import { createDemoIsland, Output } from './shared';

function TiltDemo() {
  return (
    <>
      {[
        { name: 'Starter', price: '$0', badge: 'Free' },
        { name: 'Pro', price: '$29', badge: 'Popular' },
        { name: 'Team', price: '$99', badge: 'Best value' },
      ].map((p) => (
        <TiltCard key={p.name} maxTilt={12} style={{ width: '13rem' }}>
          <Badge variant="primary">{p.badge}</Badge>
          <h3 style={{ margin: '0.75rem 0 0.25rem' }}>{p.name}</h3>
          <p style={{ margin: 0 }}>
            <strong style={{ fontSize: '1.6rem' }}>{p.price}</strong> <span className="muted">/ month</span>
          </p>
        </TiltCard>
      ))}
    </>
  );
}

function FlipDemo() {
  const [flipped, setFlipped] = useState(false);
  return (
    <>
      <div style={{ width: '16rem' }}>
        <FlipCard
          height="12rem"
          flipped={flipped}
          onFlippedChange={setFlipped}
          flipLabel={flipped ? 'Show question' : 'Show answer'}
          front={
            <div style={{ padding: '1rem' }}>
              <p className="eyebrow">Question</p>
              <strong>What does WCAG stand for?</strong>
            </div>
          }
          back={
            <div style={{ padding: '1rem' }}>
              <p className="eyebrow">Answer</p>
              <strong>Web Content Accessibility Guidelines.</strong>
            </div>
          }
        />
      </div>
      <Output label="Showing">{flipped ? 'back' : 'front'}</Output>
    </>
  );
}

function CubeDemo() {
  const [i, setI] = useState(0);
  const slides = [
    { title: 'Charts', content: <div style={{ padding: '1.25rem' }}><h3>📊 Charts</h3><p>15 accessible chart types with data tables.</p></div> },
    { title: 'Themes', content: <div style={{ padding: '1.25rem' }}><h3>🎨 Themes</h3><p>Light, dark and high contrast × 7 accents.</p></div> },
    { title: 'RTL', content: <div style={{ padding: '1.25rem' }}><h3>🌍 RTL</h3><p>Every component mirrors for Arabic.</p></div> },
    { title: '3D', content: <div style={{ padding: '1.25rem' }}><h3>🧊 3D</h3><p>WebGL scenes with graceful fallbacks.</p></div> },
  ];
  return (
    <>
      <CubeCarousel label="Release highlights (cube)" slides={slides} index={i} onIndexChange={setI} width="18rem" height="12rem" />
      <Output label="Slide">{`${i + 1} of ${slides.length}`}</Output>
    </>
  );
}

const C3D_SLIDES = [
  { title: 'Charts', hue: 262, text: '15 accessible chart types, each with a data table.' },
  { title: 'Themes', hue: 172, text: 'Light, dark and high contrast × 7 accents.' },
  { title: 'RTL', hue: 340, text: 'Every component mirrors for Arabic.' },
  { title: 'Motion', hue: 32, text: 'Springs and timelines that respect reduced motion.' },
  { title: '3D', hue: 205, text: 'WebGL scenes with graceful fallbacks.' },
];

function Carousel3DDemo() {
  const [mode, setMode] = useState<'coverflow' | 'ring' | 'stack'>('coverflow');
  const [i, setI] = useState(0);
  const slides = C3D_SLIDES.map((s) => ({
    title: s.title,
    content: (
      <div style={{ height: '100%', display: 'grid', alignContent: 'end', gap: '0.25rem', padding: '1.25rem', background: `linear-gradient(160deg, hsl(${s.hue} 70% 62% / 0.28), transparent 65%)` }}>
        <h3 style={{ margin: 0 }}>{s.title}</h3>
        <p className="muted" style={{ margin: 0 }}>
          {s.text}
        </p>
      </div>
    ),
  }));
  return (
    <div className="demo-col">
      <div role="group" aria-label="Mode" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['coverflow', 'ring', 'stack'] as const).map((m) => (
          <Button key={m} size="sm" variant={mode === m ? 'primary' : 'secondary'} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m[0].toUpperCase() + m.slice(1)}
          </Button>
        ))}
      </div>
      <Carousel3D label="Product gallery" mode={mode} slides={slides} index={i} onIndexChange={setI} autoplay={6000} slideWidth="min(17rem, 68vw)" height="14rem" />
      <Output label="Slide">{`${i + 1} of ${slides.length}: ${C3D_SLIDES[i].title}`}</Output>
    </div>
  );
}

function ParallaxDemo() {
  return (
    <div style={{ width: '100%' }}>
      <ParallaxLayers
        style={{ height: '16rem', borderRadius: 'var(--oc-radius-lg)', overflow: 'hidden', background: 'linear-gradient(180deg, var(--oc-primary-soft), var(--oc-surface))' }}
        layers={[
          { depth: 0.15, decorative: true, content: <div style={{ position: 'absolute', insetInlineStart: '12%', top: '14%', fontSize: '3rem' }}>☁️</div> },
          { depth: 0.35, decorative: true, content: <div style={{ position: 'absolute', insetInlineEnd: '14%', top: '10%', fontSize: '3.5rem' }}>🌙</div> },
          { depth: 0.6, decorative: true, content: <div style={{ position: 'absolute', insetInlineStart: '8%', bottom: '-1rem', fontSize: '6rem' }}>⛰️</div> },
          {
            depth: 0.9,
            content: (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.8rem', margin: 0 }}>Explore Wadi Rum</h3>
                  <p className="muted" style={{ margin: '0.25rem 0 0' }}>Move your pointer over the scene.</p>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function Text3DDemo() {
  const [depth, setDepth] = useState(8);
  return (
    <div className="demo-col" style={{ justifyItems: 'center' }}>
      <Text3D as="p" depth={depth} style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, margin: 0 }}>
        Orca UI
      </Text3D>
      <Text3D as="p" depth={4} tone="surface" style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
        أوركا
      </Text3D>
      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        Depth
        <input type="range" min={1} max={16} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
        <span>{depth}</span>
      </label>
    </div>
  );
}

function FloatDemo() {
  return (
    <>
      <Floating3DIcon icon="🚀" size="5rem" />
      <Floating3DIcon icon="📦" size="4rem" />
      <Floating3DIcon icon="✨" size="3.5rem" />
      <p className="muted" style={{ margin: 0 }}>Decorative tiles — pair them with real headings.</p>
    </>
  );
}

function OrbitDemo() {
  return (
    <>
      <OrbitBadge size="8rem">
        <strong>AA</strong>
      </OrbitBadge>
      <div>
        <strong>WCAG 2.2 AA</strong>
        <p className="muted" style={{ margin: 0 }}>The badge itself is decorative; this text carries the meaning.</p>
      </div>
    </>
  );
}

function StackDemo() {
  const [open, setOpen] = useState(false);
  const card = (n: number, amount: string, status: string) => (
    <div key={n} style={{ padding: '1rem', width: '15rem', border: '1px solid var(--oc-border)', borderRadius: 'var(--oc-radius-lg)', background: 'var(--oc-surface)', boxShadow: 'var(--oc-shadow-md)' }}>
      <strong>Invoice #{1040 + n}</strong>
      <p style={{ margin: '0.25rem 0 0' }}>
        {amount} · <span className="muted">{status}</span>
      </p>
    </div>
  );
  return (
    <>
      <Perspective3DStack label="Recent invoices" open={open} items={[card(1, '$1,200', 'Paid'), card(2, '$860', 'Due in 5 days'), card(3, '$2,450', 'Overdue')]} />
      <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)} aria-pressed={open}>
        {open ? 'Stack' : 'Fan out'}
      </Button>
    </>
  );
}

export default createDemoIsland(
  {
    tiltcard: TiltDemo,
    flipcard: FlipDemo,
    cubecarousel: CubeDemo,
    carousel3d: Carousel3DDemo,
    parallaxlayers: ParallaxDemo,
    text3d: Text3DDemo,
    floating3dicon: FloatDemo,
    orbitbadge: OrbitDemo,
    perspective3dstack: StackDemo,
  },
  ['carousel3d', 'parallaxlayers', 'text3d'],
);

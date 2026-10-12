import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { Switch } from '@nawa-ui/react';

/**
 * Wraps every live demo: a labelled surface with an LTR/RTL switch.
 * Switching direction remounts the demo so components that read `dir` on mount pick it up.
 */
export function DemoFrame({ id, children, stack = false }: { id: string; children: ReactNode; stack?: boolean }) {
  const [rtl, setRtl] = useState(false);
  return (
    <div className="demo-frame">
      <div className="demo-frame__bar">
        <span className="demo-frame__live">Live demo</span>
        <button type="button" className="demo-frame__dir" aria-pressed={rtl} onClick={() => setRtl((v) => !v)}>
          RTL
        </button>
      </div>
      <div key={rtl ? 'rtl' : 'ltr'} dir={rtl ? 'rtl' : 'ltr'} className={stack ? 'demo demo--stack' : 'demo'} data-demo={id}>
        {children}
      </div>
    </div>
  );
}

/** Builds a demo registry island: `<Demo id="x" />` renders the matching demo inside a DemoFrame. */
export function createDemoIsland(demos: Record<string, ComponentType>, stacked: string[] = []) {
  return function Demo({ id }: { id: string }) {
    const C = demos[id];
    if (!C) return <p className="muted">Demo coming soon.</p>;
    return (
      <DemoFrame id={id} stack={stacked.includes(id)}>
        <C />
      </DemoFrame>
    );
  };
}

/** A row that wraps; handy inside stacked demos. */
export function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', ...style }}>{children}</div>;
}

/** Live readout of a demo value, announced politely. */
export function Output({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="demo-output" aria-live="polite">
      <span className="muted">{label}:</span> <strong>{children}</strong>
    </p>
  );
}

/** Self-made SVG "photo" so demos need no external images. */
export function scene(title: string, hue: number, variant = 0): string {
  const h2 = (hue + 40) % 360;
  const hills =
    variant % 3 === 0
      ? `<path d="M0 300 Q 150 180 300 260 T 600 220 V400 H0Z" fill="hsl(${h2} 45% 32%)"/><path d="M0 340 Q 200 260 400 320 T 600 300 V400 H0Z" fill="hsl(${h2} 50% 22%)"/>`
      : variant % 3 === 1
        ? `<path d="M0 320 L120 190 L220 290 L340 150 L470 280 L600 200 V400 H0Z" fill="hsl(${h2} 35% 30%)"/><path d="M0 360 H600 V400 H0Z" fill="hsl(${h2} 40% 18%)"/>`
        : `<rect y="270" width="600" height="130" fill="hsl(${h2} 55% 30%)"/><path d="M0 285 Q 75 270 150 285 T 300 285 T 450 285 T 600 285" stroke="hsl(${hue} 80% 85%)" stroke-width="3" fill="none" opacity=".6"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 72%)"/><stop offset="1" stop-color="hsl(${hue} 60% 45%)"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/><circle cx="${420 - variant * 40}" cy="${110 + variant * 10}" r="46" fill="hsl(${(hue + 180) % 360} 90% 88%)" opacity=".9"/>${hills}<text x="24" y="380" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="#fff" opacity=".9">${title}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Renders children only after hydration. Used for components whose first render depends on the
 * viewport (e.g. Menubar reads a media query), so server and client markup never disagree.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}

/** Switch with a visible text label next to it (the React Switch's `label` is its accessible name). */
export function SwitchField({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <Switch label={label} checked={checked} onChange={onChange} disabled={disabled} />
      <span aria-hidden="true" style={{ fontSize: '0.9rem' }} onClick={() => !disabled && onChange(!checked)}>
        {label}
      </span>
    </span>
  );
}

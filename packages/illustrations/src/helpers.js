// Authoring helpers for scene sources. Output is SVG markup whose colors are role names
// (accent, soft, paper, alt, muted, line, edge, ink) — the build turns them into tokens.
// Non-SVG flags understood by the build: float="1|slow" (gentle motion), detail="1"
// (dropped in compact mode), bg="1" (backdrop; hidden in forced-colors mode).

const r2 = (n) => Math.round(n * 100) / 100;

/** The Pelagic nucleus: a solid accent core inside a faint orbit ring. */
export function nucleus(cx, cy, r = 6, { float = '', ring = true } = {}) {
  const f = float ? ` float="${float}"` : '';
  return `<g${f}>${ring ? `<circle cx="${cx}" cy="${cy}" r="${r2(r * 1.9)}" fill="none" stroke="accent" stroke-width="1.5" stroke-opacity=".45"/>` : ''}<circle cx="${cx}" cy="${cy}" r="${r}" fill="accent"/></g>`;
}

/** n-point star path. */
export function starPath(cx, cy, outer, inner, points = 5, rotate = -90) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = ((rotate + (i * 180) / points) * Math.PI) / 180;
    const len = i % 2 ? inner : outer;
    pts.push(`${r2(cx + len * Math.cos(rad))} ${r2(cy + len * Math.sin(rad))}`);
  }
  return `M${pts.join(' L')}Z`;
}

/** Gear outline with flat-topped teeth. */
export function gearPath(cx, cy, outer, inner, teeth = 8) {
  const step = (Math.PI * 2) / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const seq = [
      [inner, a - step * 0.5],
      [inner, a - step * 0.28],
      [outer, a - step * 0.18],
      [outer, a + step * 0.18],
      [inner, a + step * 0.28],
    ];
    for (const [len, ang] of seq) pts.push(`${r2(cx + len * Math.cos(ang))} ${r2(cy + len * Math.sin(ang))}`);
  }
  return `M${pts.join(' L')}Z`;
}

/** Small plus-shaped sparkle. */
export function spark(x, y, s = 4, role = 'edge') {
  return `<path d="M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}" stroke="${role}" stroke-width="2" stroke-linecap="round" detail="1"/>`;
}

/** Rounded text placeholder bar. */
export function bar(x, y, w, h = 6, role = 'ink', opacity = '.28') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${role}" fill-opacity="${opacity}"/>`;
}

/**
 * Shared backdrop — the recurring Pelagic motif: two offset tonal discs, a dotted
 * orbit with its satellite nucleus, and a short horizon dash. No drop shadows.
 */
export function backdrop({ orbit = -14, satellite = 'left', horizon = true } = {}) {
  const rot = `rotate(${orbit} 120 94)`;
  // Satellite sits on the orbit ellipse (rx 104, ry 26) at ~200° or ~340°, then rotated.
  const angle = satellite === 'right' ? -20 : 200;
  const t = (angle * Math.PI) / 180;
  const ex = 104 * Math.cos(t);
  const ey = 26 * Math.sin(t);
  const o = (orbit * Math.PI) / 180;
  const sx = r2(120 + ex * Math.cos(o) - ey * Math.sin(o));
  const sy = r2(94 + ex * Math.sin(o) + ey * Math.cos(o));
  return [
    `<circle cx="120" cy="92" r="74" fill="alt" bg="1"/>`,
    `<circle cx="148" cy="66" r="44" fill="soft" fill-opacity=".75" bg="1"/>`,
    `<ellipse cx="120" cy="94" rx="104" ry="26" transform="${rot}" fill="none" stroke="edge" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="0 6" stroke-linecap="round" detail="1"/>`,
    `<g detail="1">${nucleus(sx, sy, 4.5, { float: 'slow' })}</g>`,
    horizon ? `<path d="M58 160H178M188 160H194" stroke="edge" stroke-opacity=".6" stroke-width="2" stroke-linecap="round" detail="1"/>` : '',
  ].join('');
}

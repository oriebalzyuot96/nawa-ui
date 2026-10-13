// Drawing helpers for authoring Pelagic icons. They only produce plain strings
// (path data / element markup); icon source files store the literal output, so
// these helpers are an authoring aid and never a runtime dependency.
import { mapPath } from './svg-path.mjs';

export const n = (v) => {
  const r = Math.round(v * 100) / 100;
  const s = String(Object.is(r, -0) ? 0 : r);
  return s.startsWith('0.') ? s.slice(1) : s.startsWith('-0.') ? '-' + s.slice(2) : s;
};
const pt = (x, y) => `${n(x)} ${n(y)}`.replace(/ -/g, '-');

// ---- element builders -----------------------------------------------------
export const path = (d) => `<path d="${d}"/>`;
export const circle = (cx, cy, r) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`;
export const ellipse = (cx, cy, rx, ry) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"/>`;
export const rect = (x, y, w, h, rx = 0) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ''}/>`;
/** A visual dot (radius ~1.48 once stroked). Drawn as two arcs, not <circle>:
 *  Chromium leaves a pin-hole in tiny stroked circles inside masks. */
export const dot = (cx, cy) => path(`M${pt(cx - 0.6, cy)}a.6 .6 0 1 0 1.2 0a.6 .6 0 1 0-1.2 0`);
export const evenodd = (d) => `<path fill-rule="evenodd" d="${d}"/>`;

// ---- geometry ---------------------------------------------------------------
const rad = (deg) => (deg * Math.PI) / 180;
export const polar = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

/** Closed polygon with arc-rounded corners. radius: number | number[] (per vertex). */
export function roundedPolygon(points, radius) {
  const N = points.length;
  const parts = [];
  for (let i = 0; i < N; i++) {
    const r = Array.isArray(radius) ? radius[i] : radius;
    const [vx, vy] = points[i];
    const [px, py] = points[(i - 1 + N) % N];
    const [qx, qy] = points[(i + 1) % N];
    let ax = px - vx, ay = py - vy, bx = qx - vx, by = qy - vy;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    ax /= la; ay /= la; bx /= lb; by /= lb;
    const theta = Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by)));
    if (!r || theta > Math.PI - 1e-3) {
      parts.push({ a: [vx, vy], b: [vx, vy], r: 0 });
      continue;
    }
    const t = Math.min(r / Math.tan(theta / 2), la / 2, lb / 2);
    const rr = t * Math.tan(theta / 2);
    const cross = ax * by - ay * bx; // >0 => turning one way
    parts.push({ a: [vx + ax * t, vy + ay * t], b: [vx + bx * t, vy + by * t], r: rr, sweep: cross < 0 ? 1 : 0 });
  }
  let d = `M${pt(...parts[0].b)}`;
  for (let i = 1; i <= N; i++) {
    const p = parts[i % N];
    d += `L${pt(...p.a)}`;
    if (p.r) d += `A${n(p.r)} ${n(p.r)} 0 0 ${p.sweep} ${pt(...p.b)}`;
  }
  return (d + 'Z').replace(/ -/g, '-');
}

export function regularPolygon(cx, cy, r, sides, startDeg = -90) {
  return Array.from({ length: sides }, (_, i) => polar(cx, cy, r, startDeg + (360 / sides) * i));
}

export function starPoints(cx, cy, R, r, points = 5, startDeg = -90) {
  const out = [];
  for (let i = 0; i < points * 2; i++) out.push(polar(cx, cy, i % 2 ? r : R, startDeg + (180 / points) * i));
  return out;
}

/** Arc along circle (cx,cy,r) from angle a to angle b (deg, clockwise on screen). */
export function arcPath(cx, cy, r, a, b, move = true) {
  const span = (((b - a) % 360) + 360) % 360;
  const [x1, y1] = polar(cx, cy, r, a);
  const [x2, y2] = polar(cx, cy, r, b);
  return `${move ? `M${pt(x1, y1)}` : ''}A${n(r)} ${n(r)} 0 ${span > 180 ? 1 : 0} 1 ${pt(x2, y2)}`;
}

/** Intersections of two circles. Returns [p1, p2]. */
export function circleIntersect(c1, r1, c2, r2) {
  const [x1, y1] = c1, [x2, y2] = c2;
  const d = Math.hypot(x2 - x1, y2 - y1);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const mx = x1 + (a * (x2 - x1)) / d, my = y1 + (a * (y2 - y1)) / d;
  return [
    [mx + (h * (y2 - y1)) / d, my - (h * (x2 - x1)) / d],
    [mx - (h * (y2 - y1)) / d, my + (h * (x2 - x1)) / d],
  ];
}
export const angleOf = (c, p) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;

/** Ring (annulus) as an even-odd path; use with evenodd(). */
export function annulus(cx, cy, r1, r2) {
  const ring = (r) => `M${pt(cx - r, cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0z`;
  return ring(r2) + ring(r1);
}

/** Four-point sparkle with concave sides. */
export function sparkle(cx, cy, r, k = 0.12) {
  const c = r * k; // how far the control points sit from the centre lines
  const q = r * 0.55;
  return (
    `M${pt(cx, cy - r)}` +
    `C${pt(cx + c, cy - q)} ${pt(cx + q, cy - c)} ${pt(cx + r, cy)}` +
    `C${pt(cx + q, cy + c)} ${pt(cx + c, cy + q)} ${pt(cx, cy + r)}` +
    `C${pt(cx - c, cy + q)} ${pt(cx - q, cy + c)} ${pt(cx - r, cy)}` +
    `C${pt(cx - q, cy - c)} ${pt(cx - c, cy - q)} ${pt(cx, cy - r)}Z`
  ).replace(/ -/g, '-');
}

/** Gear outline: teeth around radius ro, valleys at ri. */
export function gear(cx, cy, ro, ri, teeth, toothDeg, baseDeg, start = -90) {
  const step = 360 / teeth;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = start + i * step;
    const p1 = polar(cx, cy, ri, a - baseDeg);
    const p2 = polar(cx, cy, ro, a - toothDeg);
    const p3 = polar(cx, cy, ro, a + toothDeg);
    const p4 = polar(cx, cy, ri, a + baseDeg);
    const p5 = polar(cx, cy, ri, a + step - baseDeg);
    d += `${i === 0 ? 'M' : 'L'}${pt(...p1)}L${pt(...p2)}A${n(ro)} ${n(ro)} 0 0 1 ${pt(...p3)}L${pt(...p4)}A${n(ri)} ${n(ri)} 0 0 1 ${pt(...p5)}`;
  }
  return (d + 'Z').replace(/ -/g, '-');
}

/** Rotated ellipse as two arcs (no transforms allowed in icon sources). */
export function rotatedEllipse(cx, cy, rx, ry, deg) {
  const [x1, y1] = polar(cx, cy, rx, deg);
  const [x2, y2] = polar(cx, cy, rx, deg + 180);
  const rot = n(deg);
  return `M${pt(x1, y1)}A${n(rx)} ${n(ry)} ${rot} 0 1 ${pt(x2, y2)}A${n(rx)} ${n(ry)} ${rot} 0 1 ${pt(x1, y1)}Z`.replace(/ -/g, '-');
}

// ---- mirroring whole element strings ---------------------------------------
function mapElement(el, fx, fy, flip) {
  return el.replace(/<(\w+)([^>]*)\/>/, (_, tag, attrs) => {
    const get = (k) => {
      const m = attrs.match(new RegExp(`\\s${k}="([^"]*)"`));
      return m ? m[1] : null;
    };
    const set = (k, v) => {
      attrs = attrs.replace(new RegExp(`(\\s${k}=")[^"]*(")`), `$1${v}$2`);
    };
    if (tag === 'path') set('d', mapPath(get('d'), (x, y) => [fx(x), fy(y)], flip));
    else if (tag === 'circle' || tag === 'ellipse') {
      set('cx', n(fx(+get('cx'))));
      set('cy', n(fy(+get('cy'))));
    } else if (tag === 'rect') {
      const x = +get('x'), y = +get('y'), w = +get('width'), h = +get('height');
      set('x', n(Math.min(fx(x), fx(x + w))));
      set('y', n(Math.min(fy(y), fy(y + h))));
    } else throw new Error(`mirror: unsupported <${tag}>`);
    return `<${tag}${attrs}/>`;
  });
}
export const mirrorX = (els) => els.map((e) => mapElement(e, (x) => 24 - x, (y) => y, true));
export const mirrorY = (els) => els.map((e) => mapElement(e, (x) => x, (y) => 24 - y, true));

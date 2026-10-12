// Minimal, dependency-free SVG path utilities used by the build (validation,
// bounding boxes) and by the geometry helpers (mirroring). Supports the full
// path grammar: M L H V C S Q T A Z in absolute and relative form.

const CMD = /[MLHVCSQTAZmlhvcsqtaz]/;
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

export function tokenize(d) {
  const out = [];
  const re = /([MLHVCSQTAZmlhvcsqtaz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let m;
  let last = 0;
  while ((m = re.exec(d))) {
    const gap = d.slice(last, m.index);
    if (/[^\s,]/.test(gap)) throw new Error(`Unexpected "${gap.trim()}" in path "${d}"`);
    last = re.lastIndex;
    out.push(m[1] ? m[1] : Number(m[2]));
  }
  if (/[^\s,]/.test(d.slice(last))) throw new Error(`Trailing garbage in path "${d}"`);
  return out;
}

/** Parse to absolute segments: [{c:'M'|'L'|'C'|'Q'|'A'|'Z', p:[...]}] (H/V/S/T expanded). */
export function parsePath(d) {
  const t = tokenize(d);
  const segs = [];
  let i = 0;
  let cmd = null;
  let x = 0, y = 0, sx = 0, sy = 0;
  let lcx = null, lcy = null, lqx = null, lqy = null; // last control points
  if (typeof t[0] !== 'string' || t[0].toUpperCase() !== 'M') throw new Error(`Path must start with M: "${d}"`);
  while (i < t.length) {
    if (typeof t[i] === 'string') cmd = t[i++];
    else if (!cmd) throw new Error(`Missing command in "${d}"`);
    const C = cmd.toUpperCase();
    const rel = cmd !== C;
    const n = ARITY[C];
    if (C === 'Z') {
      segs.push({ c: 'Z', p: [] });
      x = sx; y = sy;
      lcx = lcy = lqx = lqy = null;
      cmd = null;
      continue;
    }
    const a = t.slice(i, i + n);
    if (a.length < n || a.some((v) => typeof v !== 'number')) throw new Error(`Bad arguments for ${cmd} in "${d}"`);
    i += n;
    const ox = rel ? x : 0, oy = rel ? y : 0;
    let resetC = true, resetQ = true;
    switch (C) {
      case 'M':
        x = a[0] + ox; y = a[1] + oy; sx = x; sy = y;
        segs.push({ c: 'M', p: [x, y] });
        cmd = rel ? 'l' : 'L';
        break;
      case 'L': x = a[0] + ox; y = a[1] + oy; segs.push({ c: 'L', p: [x, y] }); break;
      case 'H': x = a[0] + ox; segs.push({ c: 'L', p: [x, y] }); break;
      case 'V': y = a[0] + (rel ? y : 0); segs.push({ c: 'L', p: [x, y] }); break;
      case 'C': {
        const p = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy, a[4] + ox, a[5] + oy];
        segs.push({ c: 'C', p }); lcx = p[2]; lcy = p[3]; x = p[4]; y = p[5]; resetC = false; break;
      }
      case 'S': {
        const c1x = lcx === null ? x : 2 * x - lcx, c1y = lcy === null ? y : 2 * y - lcy;
        const p = [c1x, c1y, a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        segs.push({ c: 'C', p }); lcx = p[2]; lcy = p[3]; x = p[4]; y = p[5]; resetC = false; break;
      }
      case 'Q': {
        const p = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        segs.push({ c: 'Q', p }); lqx = p[0]; lqy = p[1]; x = p[2]; y = p[3]; resetQ = false; break;
      }
      case 'T': {
        const c1x = lqx === null ? x : 2 * x - lqx, c1y = lqy === null ? y : 2 * y - lqy;
        const p = [c1x, c1y, a[0] + ox, a[1] + oy];
        segs.push({ c: 'Q', p }); lqx = c1x; lqy = c1y; x = p[2]; y = p[3]; resetQ = false; break;
      }
      case 'A': {
        const p = [a[0], a[1], a[2], a[3] ? 1 : 0, a[4] ? 1 : 0, a[5] + ox, a[6] + oy];
        segs.push({ c: 'A', p, from: [x, y] }); x = p[5]; y = p[6]; break;
      }
    }
    if (resetC) { lcx = lcy = null; }
    if (resetQ) { lqx = lqy = null; }
  }
  return segs;
}

const r2 = (v) => {
  const n = Math.round(v * 100) / 100;
  return Object.is(n, -0) ? 0 : n;
};
const f = (v) => {
  const s = String(r2(v));
  return s.startsWith('0.') ? s.slice(1) : s.startsWith('-0.') ? '-' + s.slice(2) : s;
};

export function serialize(segs) {
  let out = '';
  for (const s of segs) {
    const nums = s.c === 'A'
      ? [f(s.p[0]), f(s.p[1]), f(s.p[2]), s.p[3], s.p[4], f(s.p[5]), f(s.p[6])]
      : s.p.map(f);
    out += s.c + nums.join(' ');
  }
  return out.replace(/ -/g, '-');
}

/** Apply an affine map limited to axis flips/translation: fn(x,y)->[x,y]; flip=true flips arc sweep. */
export function mapPath(d, fn, flip) {
  const segs = parsePath(d).map((s) => {
    if (s.c === 'Z') return s;
    if (s.c === 'A') {
      const [x, y] = fn(s.p[5], s.p[6]);
      return { c: 'A', p: [s.p[0], s.p[1], flip ? -s.p[2] : s.p[2], s.p[3], flip ? 1 - s.p[4] : s.p[4], x, y] };
    }
    const p = [];
    for (let i = 0; i < s.p.length; i += 2) p.push(...fn(s.p[i], s.p[i + 1]));
    return { c: s.c, p };
  });
  return serialize(segs);
}

/** Convert endpoint arc to sampled points (for bounding boxes). */
function arcPoints(x1, y1, rx, ry, phiDeg, fa, fs, x2, y2, steps = 24) {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  const phi = (phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let co = Math.sqrt(Math.max(0, num / den));
  if (fa === fs) co = -co;
  const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI;
  if (fs && dt < 0) dt += 2 * Math.PI;
  const pts = [];
  for (let i = 1; i <= steps; i++) {
    const t = t1 + (dt * i) / steps;
    const ex = rx * Math.cos(t), ey = ry * Math.sin(t);
    pts.push([cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]);
  }
  return pts;
}

function bezierPoints(p0, ctrl, steps = 16) {
  const pts = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    if (ctrl.length === 6) {
      const [c1x, c1y, c2x, c2y, x, y] = ctrl;
      pts.push([
        u * u * u * p0[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
        u * u * u * p0[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
      ]);
    } else {
      const [cx, cy, x, y] = ctrl;
      pts.push([u * u * p0[0] + 2 * u * t * cx + t * t * x, u * u * p0[1] + 2 * u * t * cy + t * t * y]);
    }
  }
  return pts;
}

/** Sampled outline points of a path (curves and arcs approximated). */
export function pathPoints(d) {
  const pts = [];
  let cur = [0, 0], start = [0, 0];
  for (const s of parsePath(d)) {
    if (s.c === 'M') { cur = [s.p[0], s.p[1]]; start = cur; pts.push(cur); }
    else if (s.c === 'L') { cur = [s.p[0], s.p[1]]; pts.push(cur); }
    else if (s.c === 'C' || s.c === 'Q') { const p = bezierPoints(cur, s.p); pts.push(...p); cur = p[p.length - 1]; }
    else if (s.c === 'A') { const p = arcPoints(cur[0], cur[1], ...s.p); pts.push(...p); cur = [s.p[5], s.p[6]]; }
    else if (s.c === 'Z') { cur = start; }
  }
  return pts;
}

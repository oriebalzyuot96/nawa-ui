// @orca-ui/illustrations — framework-agnostic runtime.
// Scenes are stored as small trees ([tag, attrs, children]) whose colors are *roles*
// (accent, soft, paper, …). Roles resolve to Orca theme tokens through CSS variables,
// so every scene follows the active theme (light / dark / hc × 7 accents) with no JS.
import { SCENES, META } from './data.js';

export const VIEWBOX = '0 0 240 180';
export const ILLUSTRATION_NAMES = Object.freeze(Object.keys(SCENES));
export const ILLUSTRATIONS = Object.freeze(META.map((m) => Object.freeze({ ...m })));

/**
 * Color roles → `var(--oc-illus-<role>, var(--oc-<token>, <fallback>))`.
 * The `--oc-illus-*` layer lets a container retint a scene (EmptyState `tone`).
 */
export const ROLES = Object.freeze({
  accent: { token: '--oc-primary', fallback: '#5b34d6', native: 'primary' },
  soft: { token: '--oc-primary-soft', fallback: '#e8e3f9', native: 'primarySoft' },
  paper: { token: '--oc-surface', fallback: '#ffffff', native: 'surface' },
  alt: { token: '--oc-surface-alt', fallback: '#f4f8f9', native: 'surfaceAlt' },
  muted: { token: '--oc-surface-muted', fallback: '#e8eef0', native: 'surfaceMuted' },
  line: { token: '--oc-border', fallback: '#dbe5e8', native: 'border' },
  ink: { token: '--oc-text-muted', fallback: '#4b6873', native: 'textMuted' },
});

const roleVar = (role) => `var(--oc-illus-${role}, var(${ROLES[role].token}, ${ROLES[role].fallback}))`;
// "edge" (object outlines) is a blend of muted text and border so outlines read in every mode.
const EDGE = `var(--oc-illus-edge, color-mix(in srgb, ${roleVar('ink')} 42%, ${roleVar('line')}))`;

/** CSS color for a role (or the input itself when it is not a role, e.g. "none"). */
export function roleColor(role) {
  if (role === 'edge') return EDGE;
  return ROLES[role] ? roleVar(role) : role;
}

/** Shared styles: sizing, float motion (off under reduced motion), forced-colors fallbacks. */
export const ILLUSTRATION_CSS =
  '.oc-illus{display:block;inline-size:100%;block-size:auto;max-inline-size:var(--oc-illus-size,240px);overflow:visible}' +
  '.oc-illus--compact{--oc-illus-size:96px}' +
  '.oc-illus__float{animation:oc-illus-float 6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
  '.oc-illus__float--slow{animation-duration:9s;animation-delay:-3s}' +
  '@keyframes oc-illus-float{50%{transform:translateY(-5px)}}' +
  '@media (prefers-reduced-motion:reduce){.oc-illus__float{animation:none}}' +
  '@media (forced-colors:active){' +
  '.oc-illus *{opacity:1;fill-opacity:1;stroke-opacity:1}' +
  '.oc-illus [fill]:not([fill=none]){fill:Canvas}' +
  '.oc-illus [stroke]:not([stroke=none]){stroke:CanvasText}' +
  '.oc-illus :is(path,rect,circle,ellipse,polygon):not([stroke]){stroke:CanvasText;stroke-width:1.5px}' +
  '.oc-illus [fill].oc-illus__solid{fill:CanvasText}' +
  '.oc-illus [fill].oc-illus__bg{fill:none;stroke:none}' +
  '.oc-illus .oc-illus__knock[class]:not([stroke=none]){stroke:Canvas}}';

export function isIllustrationName(value) {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SCENES, value);
}

const DOM_FLAGS = new Set(['float', 'detail', 'bg']);

function convert(node, opts) {
  const [tag, attrs, children] = node;
  if (attrs.detail && opts.compact) return null;
  const out = {};
  const classes = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (DOM_FLAGS.has(k)) continue;
    out[k] = k === 'fill' || k === 'stroke' ? roleColor(v) : v;
  }
  if (attrs.float && opts.animated) classes.push('oc-illus__float', attrs.float === 'slow' ? 'oc-illus__float--slow' : '');
  if (attrs.fill === 'accent') classes.push('oc-illus__solid');
  if (attrs.stroke === 'paper' || (attrs.fill === 'paper' && !attrs.stroke)) classes.push('oc-illus__knock');
  if (attrs.bg) classes.push('oc-illus__bg');
  const cls = classes.filter(Boolean).join(' ');
  if (cls) out.class = cls;
  const kids = (children || []).map((c) => convert(c, opts)).filter(Boolean);
  return { tag, attrs: out, children: kids };
}

/**
 * Normalized element tree for renderers (React, Vue, Angular, web component):
 * `{ tag: 'svg', attrs, children }` with resolved CSS-variable colors and ARIA.
 */
export function illustrationTree(name, options = {}) {
  if (!isIllustrationName(name)) throw new TypeError(`Unknown illustration "${name}". Expected one of: ${ILLUSTRATION_NAMES.join(', ')}`);
  const opts = { compact: !!options.compact, animated: options.animated !== false, styles: options.styles !== false };
  const label = typeof options.label === 'string' && options.label.trim() ? options.label.trim() : '';
  const cls = ['oc-illus', `oc-illus--${name}`, opts.compact && 'oc-illus--compact', options.className].filter(Boolean).join(' ');
  const attrs = { xmlns: 'http://www.w3.org/2000/svg', viewBox: VIEWBOX, class: cls, focusable: 'false' };
  if (label) {
    attrs.role = 'img';
    attrs['aria-label'] = label;
  } else {
    attrs['aria-hidden'] = 'true';
  }
  attrs['data-illustration'] = name;
  const children = SCENES[name].map((n) => convert(n, opts)).filter(Boolean);
  if (opts.styles) children.unshift({ tag: 'style', attrs: {}, children: [], text: ILLUSTRATION_CSS });
  return { tag: 'svg', attrs, children };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function serialize(node) {
  const attrs = Object.entries(node.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  if (node.text != null) return `<${node.tag}${attrs}>${node.text}</${node.tag}>`;
  if (!node.children.length) return `<${node.tag}${attrs}/>`;
  return `<${node.tag}${attrs}>${node.children.map(serialize).join('')}</${node.tag}>`;
}

/**
 * Render a scene to an SVG string.
 * Decorative by default (`aria-hidden="true"`); pass `label` to expose it as `role="img"`.
 */
export function illustrationToSvg(name, options = {}) {
  return serialize(illustrationTree(name, options));
}

const hex = (h) => {
  const v = h.replace('#', '');
  const f = v.length === 3 ? v.split('').map((c) => c + c).join('') : v.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const mix = (a, b, t) => {
  const [x, y] = [hex(a), hex(b)];
  return '#' + x.map((c, i) => Math.round(c * t + y[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
};

/**
 * Concrete colors for non-CSS renderers (React Native). Pass an Orca theme object
 * (e.g. `useOrcaTheme()` from @orca-ui/react-native or `getTheme()` from @orca-ui/core/tokens)
 * and/or explicit role overrides.
 */
export function resolvePalette(theme = {}, overrides = {}) {
  const palette = {};
  for (const [role, def] of Object.entries(ROLES)) palette[role] = overrides[role] || theme[def.native] || def.fallback;
  palette.edge = overrides.edge || (/^#[0-9a-f]{3,8}$/i.test(palette.ink) && /^#[0-9a-f]{3,8}$/i.test(palette.line) ? mix(palette.ink, palette.line, 0.42) : palette.line);
  return palette;
}

/** Raw scene tree (roles unresolved) — for custom renderers. */
export function getScene(name) {
  if (!isIllustrationName(name)) throw new TypeError(`Unknown illustration "${name}"`);
  return SCENES[name];
}

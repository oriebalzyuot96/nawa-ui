// Framework-agnostic rendering core for Pelagic icons.
// An icon renders to a tiny tree: string | [tag, attrs, children?].
// Every framework adapter maps that tree to its own element factory.

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const STROKE_WIDTH = 1.75;
export const DUOTONE_OPACITY = 0.22;
export const VARIANTS = /** @type {const} */ (['outline', 'duotone', 'solid']);

let counter = 0;
/** Unique, DOM-safe id prefix for <title>/<mask> references. */
export function nextId() {
  counter += 1;
  return `nwi${counter.toString(36)}`;
}

/** Normalise any framework id (React useId, Vue useId…) into a safe id. */
export function safeId(raw) {
  const s = String(raw).replace(/[^A-Za-z0-9_-]/g, '');
  return /^[A-Za-z]/.test(s) ? s : `nw${s}`;
}

/** Variant actually rendered: solid falls back to duotone when an icon has no solid art. */
export function resolveVariant(icon, variant) {
  if (variant === 'solid') return icon.solid ? 'solid' : 'duotone';
  return variant === 'duotone' ? 'duotone' : 'outline';
}

const isOn = (v) => v === true || v === '' || v === 'true';

/**
 * Build the render tree for an icon.
 * @param {import('./icons.js').IconData} icon
 * @param {import('./icons.js').IconOptions} [options]
 */
export function iconTree(icon, options = {}) {
  const variant = resolveVariant(icon, options.variant);
  const size = options.size ?? 24;
  const label = options.title ?? options.label;
  const id = options.id ? safeId(options.id) : nextId();
  const flip = options.flipRtl ?? !!icon.rtlFlip;

  const cls = ['pl-icon', `pl-icon-${icon.name}`, `pl-icon--${variant}`];
  if (isOn(flip)) cls.push('pl-icon--flip-rtl');
  if (isOn(options.spin)) cls.push('pl-icon--spin');
  if (options.className) cls.push(String(options.className));

  const attrs = {
    xmlns: SVG_NS,
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': String(options.strokeWidth ?? STROKE_WIDTH),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls.join(' '),
    'data-icon': icon.name,
  };
  const children = [];
  if (label != null && label !== '') {
    // Labelled: exposed as a single image named by its <title>.
    attrs.role = 'img';
    attrs['aria-labelledby'] = `${id}-title`;
    children.push(['title', { id: `${id}-title` }, [String(label)]]);
  } else {
    // Decorative by default.
    attrs['aria-hidden'] = 'true';
  }
  attrs.focusable = 'false';

  if (variant === 'solid') {
    const s = icon.solid;
    const body = [['g', { fill: 'currentColor' }, s.fill], ...(s.line || [])];
    if (s.cut && s.cut.length) {
      const mid = `${id}-cut`;
      children.push([
        'mask',
        { id: mid, maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: '24', height: '24' },
        [
          ['rect', { width: '24', height: '24', fill: '#fff', stroke: 'none' }],
          ['g', { stroke: '#000' }, s.cut],
        ],
      ]);
      children.push(['g', { mask: `url(#${mid})` }, body]);
    } else {
      children.push(...body);
    }
  } else {
    if (variant === 'duotone' && icon.duotone.length) {
      children.push([
        'g',
        { class: 'pl-icon__duo', fill: 'currentColor', 'fill-opacity': String(DUOTONE_OPACITY), stroke: 'none' },
        icon.duotone,
      ]);
    }
    children.push(...icon.outline);
  }

  if (options.attrs) {
    for (const [k, v] of Object.entries(options.attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class' || k === 'className') attrs.class += ` ${v}`;
      else attrs[k] = v === true ? '' : String(v);
    }
  }
  return ['svg', attrs, children];
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Serialise a render tree (or a child list) to markup. */
export function nodeToString(node) {
  if (typeof node === 'string') return escText(node);
  const [tag, attrs, children] = node;
  let out = `<${tag}`;
  for (const k in attrs) out += ` ${k}="${escAttr(attrs[k])}"`;
  if (!children || !children.length) return `${out}/>`;
  return `${out}>${children.map(nodeToString).join('')}</${tag}>`;
}

/** Root attributes + inner markup, for adapters that render with innerHTML-like APIs. */
export function iconParts(icon, options) {
  const [, attrs, children] = iconTree(icon, options);
  return { attrs, inner: children.map(nodeToString).join('') };
}

export function iconDataToSvg(icon, options) {
  return nodeToString(iconTree(icon, options));
}

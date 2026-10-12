// React Native adapter — requires the optional peer dependency react-native-svg.
import * as React from 'react';
import * as RNSvg from 'react-native-svg';
import { iconTree, DUOTONE_OPACITY } from '../core.js';
import { icons } from '../icons.js';

const Svg = RNSvg.Svg || RNSvg.default;
const TAGS = {
  path: RNSvg.Path, circle: RNSvg.Circle, rect: RNSvg.Rect, ellipse: RNSvg.Ellipse, line: RNSvg.Line,
  polyline: RNSvg.Polyline, polygon: RNSvg.Polygon, g: RNSvg.G, mask: RNSvg.Mask, defs: RNSvg.Defs,
};
const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function toNative(node, key, opts) {
  if (typeof node === 'string') return null;
  const [tag, attrs, children] = node;
  const Comp = TAGS[tag];
  if (!Comp) return null; // <title> etc. — accessibility is handled on <Svg>
  const props = { key };
  for (const k in attrs) {
    if (k === 'class' || k.startsWith('aria-') || k.startsWith('data-')) continue;
    props[camel(k)] = attrs[k];
  }
  if (attrs.class === 'oc-icon__duo') {
    if (opts.duotoneColor) props.fill = opts.duotoneColor;
    if (opts.duotoneOpacity != null) props.fillOpacity = opts.duotoneOpacity;
  }
  const kids = children ? children.map((c, i) => toNative(c, i, opts)).filter(Boolean) : [];
  return React.createElement(Comp, props, ...kids);
}

let n = 0;
function useRnId() {
  const idRef = React.useRef(null);
  if (idRef.current === null) idRef.current = `nwrn${(n += 1)}`;
  return idRef.current;
}

function render(data, props, ref, id) {
  const {
    size = 24, variant = 'outline', color, title, label, strokeWidth,
    duotoneColor, duotoneOpacity = DUOTONE_OPACITY, ...rest
  } = props;
  const name = title ?? label;
  const tree = iconTree(data, { size, variant, strokeWidth, id });
  const [, a, children] = tree;
  const a11y = name
    ? { accessible: true, accessibilityRole: 'image', accessibilityLabel: name, role: 'img', 'aria-label': name }
    : { accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true };
  return React.createElement(
    Svg,
    {
      ref, width: a.width, height: a.height, viewBox: a.viewBox, color, fill: 'none', stroke: 'currentColor',
      strokeWidth: a['stroke-width'], strokeLinecap: 'round', strokeLinejoin: 'round', ...a11y, ...rest,
    },
    ...children.map((c, i) => toNative(c, i, { duotoneColor, duotoneOpacity })).filter(Boolean),
  );
}

export function createIcon(data, displayName) {
  const C = React.forwardRef((props, ref) => render(data, props, ref, useRnId()));
  C.displayName = displayName || 'OrcaIcon';
  return C;
}

export const Icon = React.forwardRef(function Icon({ name, ...props }, ref) {
  const id = useRnId();
  const data = icons[name];
  return data ? render(data, props, ref, id) : null;
});
Icon.displayName = 'Icon';

export { icons, iconNames } from '../icons.js';

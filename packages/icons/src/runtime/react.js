import * as React from 'react';
import { iconTree, nextId, safeId } from '../core.js';
import { icons } from '../icons.js';

const ATTR = {
  class: 'className',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
};

function toReact(node, key) {
  if (typeof node === 'string') return node;
  const [tag, attrs, children] = node;
  const props = { key };
  for (const k in attrs) props[ATTR[k] || k] = attrs[k];
  if (!children || !children.length) return React.createElement(tag, props);
  return React.createElement(tag, props, ...children.map(toReact));
}

// React 18+ gives SSR-stable ids; older versions fall back to a counter.
const useUid = React.useId
  ? () => safeId(`nw${React.useId()}`)
  : () => {
    const ref = React.useRef(null);
    if (ref.current === null) ref.current = nextId();
    return ref.current;
  };

function render(data, props, ref, id) {
  const { size = 24, variant = 'outline', title, label, className, strokeWidth, flipRtl, spin, 'aria-label': ariaLabel, ...rest } = props;
  // An aria-label is promoted to a <title> so the icon is never both labelled and aria-hidden.
  const tree = iconTree(data, { size, variant, title: title ?? label ?? ariaLabel, className, strokeWidth, flipRtl, spin, id });
  const el = toReact(tree);
  return React.cloneElement(el, { ...rest, ref });
}

/** Create a component for one icon's data (used for every named export). */
export function createIcon(data, displayName) {
  const Component = React.forwardRef(function PelagicIcon(props, ref) {
    return render(data, props, ref, useUid());
  });
  Component.displayName = displayName || 'PelagicIcon';
  return Component;
}

/** `<Icon name="search" />` — convenient, but imports the whole set. */
export const Icon = React.forwardRef(function Icon({ name, ...props }, ref) {
  const id = useUid();
  const data = icons[name];
  if (!data) {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.warn(`[pelagic-icons] Unknown icon "${name}"`);
    }
    return null;
  }
  return render(data, props, ref, id);
});
Icon.displayName = 'Icon';

export { icons, iconNames } from '../icons.js';

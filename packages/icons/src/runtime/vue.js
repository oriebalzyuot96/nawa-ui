import * as Vue from 'vue';
import { iconTree, nextId, safeId } from '../core.js';
import { icons } from '../icons.js';

const { defineComponent, h } = Vue;

function toVue(node) {
  if (typeof node === 'string') return node;
  const [tag, attrs, children] = node;
  return h(tag, { ...attrs }, children && children.length ? children.map(toVue) : undefined);
}

const props = {
  size: { type: [Number, String], default: 24 },
  variant: { type: String, default: 'outline' },
  title: { type: String, default: undefined },
  label: { type: String, default: undefined },
  strokeWidth: { type: [Number, String], default: undefined },
  flipRtl: { type: Boolean, default: undefined },
  spin: { type: Boolean, default: false },
};

// Vue 3.5+ has SSR-stable useId(); older versions use a counter.
const uid = () => safeId(typeof Vue.useId === 'function' ? `nw${Vue.useId()}` : nextId());

function renderIcon(data, p, id, attrs) {
  const { 'aria-label': ariaLabel, class: cls, ...rest } = attrs;
  // aria-label is promoted to <title> so the icon is never labelled twice or hidden while labelled.
  const tree = iconTree(data, {
    size: p.size, variant: p.variant, title: p.title ?? p.label ?? ariaLabel, strokeWidth: p.strokeWidth,
    flipRtl: p.flipRtl, spin: p.spin, id,
  });
  const [tag, a, children] = tree;
  return h(tag, { ...a, ...rest, class: cls ? [a.class, cls] : a.class }, children.map(toVue));
}

/** Create a component for one icon's data (used for every named export). */
export function createIcon(data, name) {
  return defineComponent({
    name: name || 'PelagicIcon',
    inheritAttrs: false,
    props,
    setup(p, { attrs }) {
      const id = uid();
      return () => renderIcon(data, p, id, attrs);
    },
  });
}

/** `<Icon name="search" />` — convenient, but imports the whole set. */
export const Icon = defineComponent({
  name: 'PelagicIcon',
  inheritAttrs: false,
  props: { name: { type: String, required: true }, ...props },
  setup(p, { attrs }) {
    const id = uid();
    return () => {
      const data = icons[p.name];
      return data ? renderIcon(data, p, id, attrs) : null;
    };
  },
});

export { icons, iconNames } from '../icons.js';

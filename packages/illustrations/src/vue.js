import { defineComponent, h } from 'vue';
import { illustrationTree } from './illustrations.js';

export * from './illustrations.js';

function toVue(node) {
  if (node.text != null) return h(node.tag, { ...node.attrs, innerHTML: node.text });
  return h(node.tag, { ...node.attrs }, node.children.map(toVue));
}

const props = {
  name: { type: String, required: true },
  label: String,
  compact: Boolean,
  animated: { type: Boolean, default: true },
  styles: { type: Boolean, default: true },
};

/** Themeable scene as inline SVG. Decorative unless `label` is set. */
export const Illustration = defineComponent({
  name: 'PlIllustration',
  props,
  setup(p) {
    return () => toVue(illustrationTree(p.name, { label: p.label, compact: p.compact, animated: p.animated, styles: p.styles }));
  },
});

function named(name, componentName) {
  const { name: _omit, ...rest } = props;
  return defineComponent({
    name: componentName,
    props: rest,
    setup(p) {
      return () => toVue(illustrationTree(name, { label: p.label, compact: p.compact, animated: p.animated, styles: p.styles }));
    },
  });
}

/*@VUE_NAMED*/

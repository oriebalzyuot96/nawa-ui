import { createElement } from 'react';
import { illustrationTree } from './illustrations.js';

export * from './illustrations.js';

const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function toReact(node, key) {
  const props = { key };
  for (const [k, v] of Object.entries(node.attrs)) {
    if (k === 'class') props.className = v;
    else if (k.startsWith('aria-') || k.startsWith('data-') || k === 'viewBox' || k === 'xmlns' || k === 'focusable' || k === 'role') props[k] = v;
    else props[camel(k)] = v;
  }
  if (node.extra) Object.assign(props, node.extra);
  if (node.text != null) return createElement(node.tag, { ...props, dangerouslySetInnerHTML: { __html: node.text } });
  return createElement(node.tag, props, ...node.children.map((c, i) => toReact(c, i)));
}

/**
 * Themeable scene as inline SVG. Decorative unless `label` is set.
 * Extra props (style, id, …) are passed to the <svg>.
 */
export function Illustration({ name, label, compact, animated, styles, className, ...rest }) {
  const tree = illustrationTree(name, { label, compact, animated, styles, className });
  return toReact({ ...tree, extra: rest });
}

function named(name, displayName) {
  const C = (props) => Illustration({ ...props, name });
  C.displayName = displayName;
  return C;
}

/*@REACT_NAMED*/

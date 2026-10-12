// React Native renderer (requires the optional peer dependency react-native-svg).
import { createElement } from 'react';
import * as SvgLib from 'react-native-svg';
import { getScene, isIllustrationName, resolvePalette, VIEWBOX } from './illustrations.js';

export * from './illustrations.js';

const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** Builds the native component against a react-native-svg compatible module (exported for tests). */
export function createNativeIllustration(svg, h = createElement) {
  const map = { g: svg.G, path: svg.Path, circle: svg.Circle, rect: svg.Rect, ellipse: svg.Ellipse, line: svg.Line, polyline: svg.Polyline, polygon: svg.Polygon };
  const Root = svg.Svg || svg.default;

  function toNative(node, palette, compact, key) {
    const [tag, attrs, children = []] = node;
    if (attrs.detail && compact) return null;
    const props = { key };
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'float' || k === 'detail' || k === 'bg') continue;
      if (k === 'fill' || k === 'stroke') props[k] = v === 'none' ? 'none' : palette[v];
      else if (k === 'stroke-dasharray') props.strokeDasharray = v.split(/[\s,]+/).map(Number);
      else props[camel(k)] = v;
    }
    return h(map[tag], props, ...children.map((c, i) => toNative(c, palette, compact, i)).filter(Boolean));
  }

  return function Illustration({ name, label, compact = false, theme, colors, width, height, style, testID }) {
    if (!isIllustrationName(name)) return null;
    const palette = resolvePalette(theme, colors);
    const w = width ?? (compact ? 96 : 240);
    const a11y = label
      ? { accessible: true, accessibilityRole: 'image', accessibilityLabel: label }
      : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
    return h(
      Root,
      { viewBox: VIEWBOX, width: w, height: height ?? (typeof w === 'number' ? (w * 3) / 4 : undefined), style, testID, ...a11y },
      ...getScene(name).map((n, i) => toNative(n, palette, compact, i)).filter(Boolean),
    );
  };
}

export const Illustration = createNativeIllustration(SvgLib);

function named(name) {
  return (props) => Illustration({ ...props, name });
}

/*@NATIVE_NAMED*/

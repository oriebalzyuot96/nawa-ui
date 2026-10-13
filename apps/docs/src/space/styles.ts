/**
 * Layout styles shared by the live canvas and the code exporters, so the exported page looks
 * exactly like the preview. Values are plain CSS on purpose (no builder-only classes).
 */
import type { NodeProps } from './types';

export type Css = Record<string, string | number>;

export const GAP: Record<string, string> = { none: '0', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2.5rem' };
const PAD: Record<string, string> = { sm: '1.5rem', md: '3rem', lg: '5rem' };
const WIDTH: Record<string, string> = { narrow: '40rem', normal: '64rem', wide: '80rem', full: 'none' };
const MIN_COL: Record<number, string> = { 1: '100%', 2: '18rem', 3: '13rem', 4: '9rem', 5: '8rem', 6: '7rem' };

const str = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || fallback);

export function sectionOuter(p: NodeProps): Css {
  const tone = str(p.tone, 'plain');
  const css: Css = { padding: `${PAD[str(p.padding, 'md')] ?? PAD.md} 1.5rem` };
  if (tone === 'canvas') css.background = 'var(--oc-canvas)';
  if (tone === 'accent') css.background = 'linear-gradient(160deg, var(--oc-primary-soft), var(--oc-surface) 70%)';
  if (tone === 'inverse') {
    css.background = 'var(--oc-surface)';
    css.color = 'var(--oc-text)';
  }
  return css;
}

export function sectionInner(p: NodeProps): Css {
  const center = p.align === 'center';
  return {
    display: 'grid',
    gap: GAP[str(p.gap, 'md')] ?? GAP.md,
    ...(p.width === 'full' ? {} : { maxWidth: WIDTH[str(p.width, 'normal')] ?? WIDTH.normal, marginInline: 'auto' }),
    ...(center ? { textAlign: 'center' } : {}),
  };
}

/** N columns on wide screens, fewer as space runs out, never more than N. */
export function gridStyle(p: NodeProps): Css {
  const cols = Math.max(1, Math.min(6, Math.round(num(p.columns, 3))));
  const gap = GAP[str(p.gap, 'md')] ?? GAP.md;
  const min = MIN_COL[cols];
  const track = cols === 1 ? '100%' : `min(100%, max(${min}, calc((100% - ${cols - 1} * ${gap}) / ${cols})))`;
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${track}, 1fr))`,
    gap,
    ...(p.align && p.align !== 'stretch' ? { alignItems: str(p.align, 'stretch') } : {}),
  };
}

const JUSTIFY: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' };
const ALIGN: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };

export function stackStyle(p: NodeProps): Css {
  const row = p.direction === 'row';
  const align = ALIGN[str(p.align, 'stretch')] ?? 'stretch';
  const justify = JUSTIFY[str(p.justify, 'start')] ?? 'flex-start';
  // Only non-default flex values are written, so exported code stays short.
  return {
    display: 'flex',
    ...(row ? (p.wrap !== false ? { flexWrap: 'wrap' } : {}) : { flexDirection: 'column' }),
    gap: GAP[str(p.gap, 'md')] ?? GAP.md,
    ...(align !== 'stretch' ? { alignItems: align } : {}),
    ...(justify !== 'flex-start' ? { justifyContent: justify } : {}),
  };
}

export function cardBodyStyle(p: NodeProps): Css {
  return { display: 'grid', gap: GAP[str(p.gap, 'md')] ?? GAP.md };
}

export function spacerStyle(p: NodeProps): Css {
  const size: Record<string, string> = { sm: '0.75rem', md: '1.5rem', lg: '3rem', xl: '5rem' };
  return { blockSize: size[str(p.size, 'md')] ?? '1.5rem' };
}

export const HEADING_SIZE: Record<number, string> = {
  1: 'clamp(2rem, 4.5vw, 3.25rem)',
  2: 'clamp(1.5rem, 3vw, 2.125rem)',
  3: '1.25rem',
  4: '1.0625rem',
};

export function headingStyle(p: NodeProps): Css {
  const level = num(p.level, 2);
  return {
    margin: 0,
    fontSize: HEADING_SIZE[level] ?? HEADING_SIZE[2],
    lineHeight: level <= 2 ? 1.15 : 1.3,
    letterSpacing: level <= 2 ? '-0.02em' : '-0.01em',
    fontWeight: 700,
    ...(p.align && p.align !== 'start' ? { textAlign: str(p.align, 'start') } : {}),
  };
}

export function textStyle(p: NodeProps): Css {
  const size: Record<string, string> = { sm: 'var(--oc-text-sm)', md: '1rem', lg: 'clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)' };
  return {
    margin: 0,
    fontSize: size[str(p.size, 'md')] ?? '1rem',
    lineHeight: 1.6,
    ...(p.tone === 'muted' ? { color: 'var(--oc-text-muted)' } : {}),
    ...(p.align && p.align !== 'start' ? { textAlign: str(p.align, 'start') } : {}),
    ...(p.size === 'lg' ? { maxWidth: '44rem' } : {}),
    ...(p.weight === 'bold' ? { fontWeight: 600 } : {}),
  };
}

const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** `{ gap: '1rem' }` → `gap: 1rem` (for HTML, Vue and Angular templates). */
export function cssText(css: Css): string {
  return Object.entries(css)
    .map(([k, v]) => `${kebab(k)}: ${v}`)
    .join('; ');
}

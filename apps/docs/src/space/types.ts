/** Pelagic Space document model. A page is a tree of nodes; every node maps to one registry entry. */

export type NodeType =
  // Layout
  | 'section'
  | 'grid'
  | 'stack'
  | 'card'
  | 'spacer'
  | 'divider'
  // Typography
  | 'heading'
  | 'text'
  | 'list'
  | 'badge'
  // Forms
  | 'input'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'datepicker'
  | 'otp'
  | 'button'
  | 'captcha'
  // Data
  | 'table'
  | 'stat'
  | 'chart'
  | 'timeline'
  | 'progress'
  // Feedback
  | 'alert'
  | 'empty'
  | 'skeleton'
  | 'toast'
  // Navigation
  | 'tabs'
  | 'breadcrumb'
  | 'stepper'
  | 'accordion'
  // Media
  | 'avatar'
  | 'image'
  | 'carousel';

export type PropValue = string | number | boolean;
export type NodeProps = Record<string, PropValue>;

export interface SpaceNode {
  id: string;
  type: NodeType;
  props: NodeProps;
  /** Present only on containers. */
  children?: SpaceNode[];
}

export type CanvasMode = 'page' | 'light' | 'dark' | 'hc';
export type Accent = 'violet' | 'teal' | 'indigo' | 'rose' | 'amber' | 'emerald' | 'slate';
export type Shape = 'default' | 'sharp' | 'round';
export type Density = 'comfortable' | 'compact';
export type Lang = 'en' | 'ar';

export interface SpaceTheme {
  mode: CanvasMode;
  accent: Accent;
  shape: Shape;
  density: Density;
}

export interface SpaceDoc {
  version: 1;
  name: string;
  theme: SpaceTheme;
  rtl: boolean;
  lang: Lang;
  nodes: SpaceNode[];
}

export const ACCENTS: Accent[] = ['violet', 'teal', 'indigo', 'rose', 'amber', 'emerald', 'slate'];
export const SHAPES: Shape[] = ['default', 'sharp', 'round'];
export const MODES: CanvasMode[] = ['page', 'light', 'dark', 'hc'];

export const DEFAULT_THEME: SpaceTheme = { mode: 'page', accent: 'violet', shape: 'default', density: 'comfortable' };

export function emptyDoc(name = 'Untitled page'): SpaceDoc {
  return { version: 1, name, theme: { ...DEFAULT_THEME }, rtl: false, lang: 'en', nodes: [] };
}

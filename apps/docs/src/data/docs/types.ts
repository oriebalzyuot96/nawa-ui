import type { CodeSet } from '../snippets';

/** One documented component (or tightly related group) on a category page. */
export interface DocEntry {
  /** Anchor id, also used to pick the live demo. */
  id: string;
  name: string;
  /** One sentence. */
  description: string;
  /** [prop, type, description] — the props people reach for first, not every prop. */
  props: [string, string, string][];
  /** [key, action] keyboard support. */
  keys?: [string, string][];
  /** Extra accessibility notes (screen reader behaviour, ARIA). */
  a11y?: string;
  code: CodeSet;
  /** Which island renders the demo. Default 'react'. 'none' = code only. */
  demo?: 'react' | 'three' | 'none';
  /** Optional short note under the description. */
  note?: string;
}

export interface CategoryDoc {
  slug: string;
  /** Short label for navigation. */
  nav: string;
  /** <title> */
  title: string;
  h1: string;
  /** Meta description (≈150 chars). */
  description: string;
  /** Intro paragraph under the h1. */
  intro: string;
  icon: string;
  /** Optional highlighted tip shown under the intro. */
  callout?: string;
  entries: DocEntry[];
}

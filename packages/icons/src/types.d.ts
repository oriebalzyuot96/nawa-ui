/**
 * Shape of one icon source file (src/icons/<name>.js).
 * Each layer is a list of self-closing SVG elements on a 24x24 grid
 * (path, circle, rect, ellipse, line, polyline, polygon). No transforms, styles or ids.
 */
export interface IconSource {
  /** kebab-case, must match the file name. */
  name: string;
  category:
    | 'navigation' | 'actions' | 'status' | 'communication' | 'files' | 'media' | 'commerce' | 'data'
    | 'devices' | 'people' | 'time' | 'editor' | 'layout' | 'places' | 'social' | 'pelagic';
  /** At least two search keywords. */
  tags: string[];
  /** Directional icon that should mirror in right-to-left layouts. */
  rtlFlip?: boolean;
  /** Stroke layer (1.75px, round caps/joins). No fills. */
  outline: string[];
  /** Soft secondary fill shapes drawn behind the outline (may be empty). */
  duotone: string[];
  /** Optional filled variant: `fill` shapes are filled+stroked, `line` shapes stroked, `cut` strokes knocked out. */
  solid?: { fill: string[]; line?: string[]; cut?: string[] };
}

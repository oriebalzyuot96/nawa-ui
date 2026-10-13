# Pelagic design language

This is the visual spec behind `@pelagic-ui/core/style.css`. React, Vue, Svelte, Astro and Angular render the same
class names, so they all get it. React Native and Flutter should follow the same tokens and rules.

**Character:** calm, layered and precise. Surfaces sit on top of one another and are separated by hairlines,
a top sheen and soft multi-layer shadows, not by heavy borders. Neutrals pick up a little of the accent hue.
Selected items are marked with one signature cue, **the notch**: a 3px rounded bar on the inline-start edge.
Type is the bilingual IBM Plex family.

---

## 1. Tokens

### Color (generated from `src/themes.mjs` by `scripts/build.mjs`)
Base roles: `surface`, `surface-alt`, `surface-muted`, `text`, `text-muted`, `border`, `control-border`,
`primary*`, status colors and their `*-soft` tints, and `overlay`.

Design-language roles. They live in the binding blocks, so nested `data-theme` and `data-accent` scopes
recompute them:

| Token | Recipe | Use |
|---|---|---|
| `--pl-tint-hover` | primary 7% into surface | hover wash on every interactive row, item or button |
| `--pl-tint-press` | primary 12% into surface | pressed wash |
| `--pl-primary-soft` | primary 14% into surface | selected background |
| `--pl-canvas` | primary 3.5% into surface-alt | sunken areas: table heads, footers, addons, demo stages |
| `--pl-border-subtle` | primary 10% into border | hairlines of raised surfaces |
| `--pl-border-strong` | 55% control-border into border | hover borders, separators that must read |
| `--pl-surface-raised` | surface (light/hc) · surface-alt (dark) | floating layers: menus, popovers, dialogs |
| `--pl-ring` | focus 24% transparent | the focus halo |

`scripts/check-contrast.mjs` checks every pair of these roles against WCAG 2.2 AA in all 21 themes:
text, muted and accent text on the tints, canvas and raised surfaces, and the focus and control borders on canvas.

### Typography (`base.css`)
- `--pl-font`: IBM Plex Sans → IBM Plex Sans Arabic → platform UI fonts. Under `:lang(ar)` the Arabic face
  comes first and all `--pl-tracking-*` values become `0`, because letter-spacing breaks the joins in Arabic script.
- Scale: `--pl-text-2xs` 11 · `xs` 12 · `sm` 13 · **`md` 14 (component default)** · `lg` 16 · `xl` 18 ·
  `2xl` and `3xl` are fluid (`clamp`).
- Leading: `--pl-leading-tight` 1.25 (titles) · `snug` 1.4 (controls) · default 1.55 (prose).
- Weights: 400 / 500 / 600 (labels, buttons, titles) / 700 (numbers, emphasis).
- Tracking: `tight` −0.012em (titles) · `label` +0.005em · `caps` +0.07em (uppercase overlines only).
- Numbers that change (tables, paginator, charts, dates) use `font-variant-numeric: tabular-nums`.

### Space, size and density
- Spacing uses a 4px base: `--pl-space-1` (4) … `--pl-space-12` (48).
- Control heights: `--pl-control-h-sm` 32 · **`--pl-control-h` 40** · `--pl-control-h-lg` 48, with matching
  `--pl-control-px*` paddings.
- `--pl-item-h` 36 is the height of menu items, options and tree rows. Table cells use
  `--pl-cell-py` and `--pl-cell-px`. Surface padding is `--pl-pad` 20, and header and footer padding is
  `--pl-pad-sm` 14.
- `data-density="compact"` on any container lowers all of these: controls become 34px, items 30px and cells
  denser.
- `@media (pointer: coarse)` raises controls and items to **44px**. `--pl-hit` grows from 24px to 44px, and
  small icon buttons (close, tag remove, chip remove) get an invisible hit area of that size.

### Shape
`data-shape` sets `--pl-radius-xs | sm | radius | lg | xl` (sharp 2…8 · default 4…21 · round 6…32).
Use `radius` for controls, `lg` for surfaces, `xl` for dialogs and sheets, `sm` for items inside a surface,
and `xs` for chips inside controls.

### Elevation
| Level | Token | Used by |
|---|---|---|
| 1 | `--pl-elev-1` (sheen + `shadow-xs`) | cards, panels, tables, accordions, toolbars, secondary buttons |
| 2 | `--pl-elev-2` (sheen + `shadow-md`) | menus, dropdown popups, tooltips of charts, carousel nav |
| 3 | `--pl-elev-3` (sheen + `shadow-lg`) | popovers, toasts, mega-menu panels |
| 4 | `--pl-elev-4` (sheen + `shadow-xl`) | dialogs, drawers, sheets |

`--pl-sheen` is a 1px inner top highlight (`--pl-highlight`): white 80% in light, white 5% in dark,
transparent in hc. Dark mode multiplies shadow alpha by 3.2. Modal backdrops use `--pl-overlay` plus
`backdrop-filter: blur(var(--pl-backdrop-blur))` when `@supports` allows; otherwise the backdrop is just the
overlay color.

### Motion
`--pl-ease` (expressive out), `--pl-ease-out`, `--pl-ease-in-out`, `--pl-ease-spring`; durations
`--pl-dur-1` 120ms (color), `-2` 180ms (press, small moves), `-3` 260ms (overlays in), `-4` 420ms (large surfaces).
Under `prefers-reduced-motion: reduce` every transition and animation drops to near zero. State changes
(color, the notch) remain; movement does not.

---

## 2. Anatomy rules

- **Raised surface** (card, panel, table, accordion, toolbar, fieldset, dataview item):
  `surface` + 1px `border-subtle` + `radius-lg` + `elev-1`. Headers are separated by a hairline, not a grey
  fill. Footers sit on `canvas`.
- **Floating layer** (menu, popup, popover, dialog): `surface-raised` + `border-subtle` + elevation 2–4. It
  enters with `pl-pop` (scale 0.96 → 1, 6px rise).
- **Field**: label (`text-sm` 600) → control (40px, `radius`, 1px `control-border` for 3:1 contrast, inset
  1px shadow) → hint (`text-xs`, muted) or error. Prefix and suffix slots are `.pl-inputgroup__addon` (on
  canvas) and `.pl-iconfield` icons (they turn accent on focus). Float, in and on labels shrink to
  `text-xs` 600 and turn accent on focus.
- **Item** (option, menu item, tree row, list option): `item-h`, `radius-sm`, `item-px`. The container
  has a 5px inset so the hover wash never touches its edge.
- **Button**: filled variants (primary, danger) have a top sheen gradient, an inner highlight and a shadow
  tinted with their own color. Neutral variants are raised (`elev-1`) or flat (ghost). All use 600 weight at
  `text-md`.
- **Pill group** (Segmented, SelectButton): a `surface-muted` track with a 3px inset. The selected item is
  raised (surface, hairline and shadow), so the state does not depend on color alone.
- **Tone components** (Alert, Message, Toast, Toaster): a 8% tone wash, a 30% tone border, and **the notch**
  in the tone color. `.pl-alert__icon` is an optional icon slot.

## 3. States (identical everywhere; `parts/zz-interactions.css` loads last)

| State | Treatment |
|---|---|
| rest | as above |
| hover | `--pl-tint-hover` wash; borders go to `text-muted` (fields) or `control-border` (buttons); text may turn `primary-ink` |
| pressed | `--pl-tint-press`, or a 0.985 squeeze on buttons; filled buttons lose their sheen and gain an inset shadow |
| focus-visible | 2px `--pl-focus` outline (survives forced colors) **plus** the `--pl-halo` ring. Fields draw the outline over their border (`outline-offset: -1px`) |
| selected | `--pl-primary-soft` + `primary-ink` text + **the notch** (or a raised item in pill groups, or a filled primary in pagination, datepicker and toggle) |
| disabled | opacity 0.45–0.5, no hover, `not-allowed`; disabled fields get a dashed border on canvas |
| invalid | danger border + a 3px inline-start danger bar + a 3% danger wash; the focus ring turns danger; `.pl-error-text` adds a diamond marker and 600 weight, so the state never relies on color alone |
| loading | `aria-busy="true"` → `cursor: progress`; spinners and loaders inherit `currentColor` |

## 4. Responsive rules

- **< 640px (`max-width: 39.99rem`)**
  - Dialogs become **bottom sheets** with a drag-handle visual, safe-area padding, full-width footer
    buttons and a slide-up entrance. Opt out per dialog with `data-sheet="false"`.
  - Drawers go full width.
  - Popup menus (Menu, TieredMenu, ContextMenu, SplitButton) and popovers become **action sheets**
    docked to the bottom. They override JS positions, dim the page, show 44px items and expand submenus inline.
  - Toasts (`.pl-toast-stack`, Toaster, swal toasts) span the bottom edge.
  - Swal modals stack their actions at full width.
  - Toolbars stack their start, center and end slots; PickList and OrderList stack vertically; the
    Paginator moves its report onto its own line; Carousel nav buttons overlay the viewport.
- **Container queries** (the component reacts to its column, not to the viewport):
  - DataTable: components render `data-responsive="stack"` on `.pl-table-wrap` and `data-label` on every
    body cell. When the wrap is under 40rem wide, rows become labelled blocks (label | value grid). The header
    stays in the accessibility tree, and the generated labels are hidden from it with `content: … / ''`.
  - Stepper: under 34rem it becomes vertical, with markers and connectors running down the inline-start side.
- **Overflow**: tab lists, pill groups and galleria thumbnails scroll horizontally. A scroll-driven mask fades
  only the edge that still has hidden content (`animation-timeline: scroll()`, progressive enhancement).
- **Touch**: see density above. Hover lifts are wrapped in `@media (hover: hover)` so they do not stick on touch.
- **Fluid type**: `--pl-text-2xl` and `--pl-text-3xl` use `clamp()`.
- **RTL**: logical properties throughout. Physical effects (inset bars drawn with box-shadow, select chevrons,
  tree guides, breadcrumb chevrons, slide-in directions) have explicit `:dir(rtl)` or `[dir='rtl']` mirrors.

## 5. Accessibility invariants
- Every color pair is checked in all 21 themes (`node scripts/check-contrast.mjs`).
- In forced-colors mode, notches, markers and the stepper map to `CanvasText` and `Highlight`, and custom
  checkboxes fall back to native `appearance: auto`.
- Focus is never removed without a replacement. Visible order matches DOM order (stacked swal actions keep
  DOM order).
- Charts keep their non-color cues (patterns, dashes, markers) in hc, under `prefers-contrast: more` and in
  forced colors.

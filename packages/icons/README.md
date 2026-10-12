# @orca-ui/icons

Original, accessible SVG icons for [Orca UI](https://oriebalzyuot96.github.io/orca-ui/): **239 icons** in
**outline** and **duotone** variants, plus **solid** for the 40 most common ones. They work with React, Vue,
Svelte, Angular, Astro, React Native, Web Components and plain SVG sprites, and every adapter uses the same data.

- **Signature style.** 24×24 grid with 2px live-area padding. 1.75px strokes with round caps and joins.
  Geometric construction and a small set of corner radii (1 / 1.5 / 2 / 3). Arrowheads are drawn as wedges.
- **Duotone.** A soft secondary fill sits behind the outline, so icons look fuller than plain line icons.
- **Accessible by default.** Icons are decorative unless you name them. A `title`/`label` turns an icon into
  `role="img"` with a `<title>` that it references through `aria-labelledby`. Icons use `currentColor`, so they
  follow forced-colors mode, and directional icons mirror in RTL.
- **Tree-shakable.** Named components such as `SearchIcon` import only their own data. The package has no
  runtime dependencies.

## Install

```sh
npm install @orca-ui/icons
# or
yarn add @orca-ui/icons
# or
pnpm add @orca-ui/icons
```

Framework packages are optional peer dependencies: `react`, `vue`, `svelte`, `@angular/core`, `astro`, and
`react-native-svg`. Install only the ones you use.

Optional base styles cover RTL mirroring, spin, size helpers and the duotone variables:

```js
import '@orca-ui/icons/css';
```

## Usage

### React

```jsx
import { Icon, SearchIcon, BellIcon } from '@orca-ui/icons/react';

<SearchIcon />                                   {/* decorative, 24px, outline */}
<BellIcon variant="duotone" size={20} title="Notifications" />
<Icon name="arrow-right" className="text-primary" />   {/* convenient, but bundles every icon */}
```

Props: `size`, `variant` (`outline` | `duotone` | `solid`), `title` / `label`, `strokeWidth`, `flipRtl`, `spin`,
`className`, and any SVG attribute. Components forward refs to the `<svg>`. An `aria-label` prop becomes the
`<title>`.

### Vue 3

```vue
<script setup>
import { Icon, SearchIcon } from '@orca-ui/icons/vue';
</script>

<template>
  <SearchIcon :size="20" />
  <Icon name="bell" variant="duotone" title="Notifications" />
</template>
```

### Svelte 5

```svelte
<script>
  import { Icon } from '@orca-ui/icons/svelte';
</script>

<Icon name="search" />
<Icon name="bell" variant="duotone" size={20} title="Notifications" />
```

### Angular (standalone)

```ts
import { OcIconComponent } from '@orca-ui/icons/angular';

@Component({
  selector: 'app-toolbar',
  imports: [OcIconComponent],
  template: `<oc-icon name="search" /> <oc-icon name="bell" variant="duotone" size="20" label="Notifications" />`,
})
export class ToolbarComponent {}
```

The component ships in Angular's partial-compilation format, and the Angular CLI links it ahead of time. It
renders through `Renderer2`, so it is SSR-safe and never uses `innerHTML`. Don't load `@orca-ui/icons/element`
in the same Angular app, because both claim the `oc-icon` tag.

### Astro

```astro
---
import Icon from '@orca-ui/icons/astro';
---
<Icon name="search" />
<Icon name="bell" variant="duotone" title="Notifications" />
```

This renders static inline SVG and ships zero JavaScript.

### React Native

```jsx
import { SearchIcon, Icon } from '@orca-ui/icons/react-native'; // needs react-native-svg

<SearchIcon color="#4f46e5" size={20} />
<Icon name="bell" variant="duotone" duotoneOpacity={0.3} label="Notifications" />
```

### Web Component

```html
<script type="module">import '@orca-ui/icons/element';</script>

<oc-icon name="search"></oc-icon>
<oc-icon name="bell" variant="duotone" size="20" label="Notifications"></oc-icon>
```

Attributes: `name`, `variant`, `size`, `label`, `stroke-width`, `flip-rtl`, `spin`. The component uses Shadow DOM
and mirrors automatically inside `dir="rtl"`.

### Plain JS / SSR string

```js
import { iconToSvg, iconNames } from '@orca-ui/icons';

element.innerHTML = iconToSvg('search', { variant: 'duotone', size: 20, title: 'Search' });
```

### SVG sprite

```html
<svg class="oc-icon" width="24" height="24" aria-hidden="true">
  <use href="/assets/sprite.svg#oc-search-duotone"></use>
</svg>
```

Copy `@orca-ui/icons/sprite.svg` to your public assets. Symbol ids are `#oc-<name>` for outline,
`#oc-<name>-duotone`, and `#oc-<name>-solid`. If a browser does not render the mask in a solid symbol from an
external sprite, inline the sprite into the page.

### Metadata for search UIs

```js
import meta from '@orca-ui/icons/json' with { type: 'json' };
// { count, categories: [{ name, count }], icons: [{ name, component, category, tags, rtlFlip, variants }] }
```

## Theming the duotone layer

```css
.toolbar { --oc-icon-duotone: #f59e0b; --oc-icon-duotone-opacity: .35; }
```

The layer defaults to `currentColor` at 22% opacity. Without the CSS file, the same default comes from SVG
attributes. The duotone layer never carries meaning on its own: every icon is complete in outline form.

## Accessibility

| You pass | Rendered |
| --- | --- |
| nothing | `aria-hidden="true" focusable="false"` (decorative) |
| `title` / `label` / `aria-label` | `role="img"`, `<title id>`, `aria-labelledby` |

- Icon-only buttons still need an accessible name. Label either the button or the icon, not both.
- Directional icons have the RTL flag (`rtlFlip`) and get the class `oc-icon--flip-rtl`. They mirror under
  `[dir=rtl]` when the CSS is loaded. The Web Component and Angular component include that rule themselves.
  Pass `flipRtl={false}` to opt out.
- `spin` slows down under `prefers-reduced-motion` instead of stopping silently.

## Categories

navigation 23 · actions 35 · status 18 · communication 14 · files 13 · media 17 · commerce 13 · data 14 ·
devices 11 · people 8 · time 8 · editor 20 · layout 11 · places 21 · social 7 (brand-neutral) · orca 6

## Adding an icon

1. Create `src/icons/<name>.js`. The file name must match `name`, in kebab-case:

   ```js
   /** @type {import('../types').IconSource} */
   export default {
     name: 'battery-charging',
     category: 'devices',
     tags: ['power', 'charge'],
     // rtlFlip: true,            // only for direction-bearing icons
     outline: ['<rect x="3" y="7" width="15.5" height="10" rx="2"/>', '<path d="M21 10.5v3"/>'],
     duotone: ['<rect x="3" y="7" width="15.5" height="10" rx="2"/>'],
     // solid: { fill: [...], line: [...], cut: [...] },
   };
   ```

2. Run `npm run build`. The build fails on unknown elements or attributes, `transform`/`style`/`id`, fills in
   the outline layer, duplicate names, fewer than two tags, or a duotone layer outside the live area. It warns
   when strokes leave the 2px padding.
3. Run `npm run preview` and open `preview/index.html` to check the icon at 16/20/24/32px in light and dark.
   `npm run preview:png` renders PNGs with a headless Chromium browser. Set `BROWSER_PATH`, and set
   `PUPPETEER_FROM` to point at a package.json that resolves `puppeteer-core`.

`scripts/geometry.mjs` has drawing helpers for authoring, such as rounded polygons, arcs, circle intersections,
sparkles, gears and mirroring. Icon files store only literal SVG strings.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run build` | validate sources and generate `dist/` |
| `npm test` | build, then run the `node:test` suite (React and Vue SSR smoke tests run when those packages resolve) |
| `npm run typecheck` | compile-check the published `.d.ts` files |
| `npm run preview` | write `preview/index.html` (contact sheet) |

## License

MIT © oriebalzyuot96. All icons are original drawings, and the social set contains no third-party logos or
trademarks.

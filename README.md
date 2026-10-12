<div align="center">

# Orca UI

**Accessible, themeable UI components for React, Vue, Svelte, Astro and React Native.**

WCAG 2.2 AA · 21 themes · Dark mode & high contrast · Skeleton loaders · RTL / Arabic · MIT

[Docs & live preview](https://oriebalzyuot96.github.io/orca-ui/) · [Components](https://oriebalzyuot96.github.io/orca-ui/components/) · [Themes](https://oriebalzyuot96.github.io/orca-ui/themes/) · [العربية](https://oriebalzyuot96.github.io/orca-ui/ar/)

</div>

---

Orca (أوركا, "nucleus") is one design system shipped as native packages for five frameworks. Same component names, same props, same look — and accessibility that is tested on every build, not promised in a README.

| Package | Framework | Install |
|---|---|---|
| [`@orca-ui/react`](packages/react) | React 18 / 19 | `npm i @orca-ui/react @orca-ui/core` |
| [`@orca-ui/vue`](packages/vue) | Vue 3 | `npm i @orca-ui/vue @orca-ui/core` |
| [`@orca-ui/svelte`](packages/svelte) | Svelte 5 | `npm i @orca-ui/svelte @orca-ui/core` |
| [`@orca-ui/astro`](packages/astro) | Astro 5 (zero JS by default) | `npm i @orca-ui/astro @orca-ui/core` |
| [`@orca-ui/react-native`](packages/react-native) | React Native / Expo | `npm i @orca-ui/react-native @orca-ui/core` |
| [`@orca-ui/core`](packages/core) | Tokens, CSS, theme + a11y helpers | `npm i @orca-ui/core` |

## Quick start

```tsx
import '@orca-ui/core/style.css';
import { Button, DataTable, applyTheme } from '@orca-ui/react';

applyTheme({ mode: 'system', accent: 'indigo', shape: 'round' });

<Button variant="outline">Save</Button>;
```

## Themes

Themes are CSS attributes, so they work in every framework and can be scoped to any element:

```html
<html data-theme="dark" data-accent="emerald" data-shape="sharp">
```

| | |
|---|---|
| `data-theme` | `light` · `dark` · `hc` (high contrast) — omit to follow the OS (`prefers-color-scheme`, `prefers-contrast`) |
| `data-accent` | `teal` · `indigo` · `rose` · `amber` · `emerald` · `slate` |
| `data-shape` | `sharp` · `default` · `round` |

All theme colors come from one file, [`packages/core/src/themes.mjs`](packages/core/src/themes.mjs). The build generates the CSS and the React Native tokens from it, and `npm test -w @orca-ui/core` checks **525 WCAG contrast pairs** (every mode × accent).

## Accessibility

- Contrast verified for all 21 themes (text 4.5:1, controls and focus 3:1).
- 2px focus outlines that survive Windows High Contrast; `forced-colors` styles for selection and state.
- Dialog and Drawer: focus trap, Escape, scroll lock, focus return.
- Tabs, Segmented, Pagination follow WAI-ARIA keyboard patterns.
- Labels, `aria-describedby` hints and errors, `aria-invalid`, `aria-sort`, `aria-current`, `aria-busy`.
- Skeletons announce one "Loading…" status; toasts use a polite live region and pause on hover/focus.
- `prefers-reduced-motion` respected on the web; React Native follows the OS "Reduce motion".
- 24px minimum targets for small controls; logical CSS for RTL.

## Components

| Component | React | Vue | Svelte | Astro | React Native |
|---|:-:|:-:|:-:|:-:|:-:|
| Button | ✓ | ✓ | ✓ | ✓ | ✓ |
| Input / Textarea / Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| Checkbox / Switch / RadioGroup | ✓ | ✓ | ✓ | ✓ | ✓ |
| Segmented | ✓ | ✓ | ✓ | ✓ (native radios) | ✓ |
| Slider | ✓ | ✓ | ✓ | ✓ | – |
| Badge / Tag / Avatar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Card / Alert / EmptyState / Divider | ✓ | ✓ | ✓ | ✓ | ✓ |
| Spinner / ProgressBar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Skeleton / SkeletonText / SkeletonCard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stepper / Timeline | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tabs / Accordion | ✓ | ✓ | ✓ | ✓ | ✓ |
| Breadcrumb / Pagination | ✓ | ✓ | ✓ | ✓ | ✓ |
| DataTable (sort, loading, caption) | ✓ | ✓ | ✓ | ✓ (server sort) | ✓ |
| Dialog / Drawer | ✓ | ✓ | ✓ | ✓ (native `<dialog>`) | ✓ |
| Toast | ✓ | ✓ | ✓ | ✓ (`<Toaster>` + `orcaToast()`) | ✓ |
| Tooltip | ✓ | ✓ | ✓ | ✓ | – (no hover on touch) |

Roadmap (PrimeNG parity): AutoComplete, MultiSelect, DatePicker, Menu, Tree, virtual-scrolling DataTable.

## Development

```bash
npm install
npm run build -w @orca-ui/core   # generate CSS + tokens from themes.mjs
npm test                          # contrast checks + React + Vue tests
npm run typecheck                 # all packages
npm run docs:dev                  # docs site with live preview
```

## License

MIT © oriebalzyuot96

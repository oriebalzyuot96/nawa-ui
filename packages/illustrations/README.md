# @orca-ui/illustrations

Original, themeable SVG scenes for empty states — part of [Orca UI](https://oriebalzyuot96.github.io/orca-ui/).

- **24 scenes**: `no-data`, `no-results`, `filter-empty`, `empty-inbox`, `no-messages`, `no-comments`, `no-notifications`, `empty-cart`, `no-payments`, `no-files`, `empty-folder`, `upload`, `all-done`, `empty-calendar`, `no-team-members`, `no-favorites`, `welcome`, `coming-soon`, `maintenance`, `offline`, `no-permission`, `error`, `not-found`, `server-error`.
- **Follows every Orca theme** (light / dark / high contrast × 7 accents): colors are CSS variables, never hard-coded.
- **Accessible**: decorative by default (`aria-hidden="true"`, `focusable="false"`); pass `label` to expose a scene as `role="img"`. Forced-colors (Windows High Contrast) and `prefers-reduced-motion` are handled.
- **Zero dependencies**; entry points for vanilla JS, React, Vue, Svelte, Angular, Astro, a web component and React Native.

## Install

```sh
npm install @orca-ui/illustrations
yarn add @orca-ui/illustrations
pnpm add @orca-ui/illustrations
```

Load `@orca-ui/core/orca-ui.css` (or your own `--oc-*` tokens) for themed colors. Without it every scene falls back to the default violet light palette.

## The style

Every scene shares one recipe so they read as a family:

- a 240 × 180 canvas, generous negative space, the subject centred around (120, 95);
- two offset tonal **discs** behind the subject (`surface-alt`, `primary-soft`);
- the Orca **nucleus**: a solid accent dot inside a faint ring, orbiting on a dotted ellipse — it reappears inside lenses, rockets and gears;
- flat objects drawn as **layered paper**: a `surface` sheet with a soft outline, an offset `surface-muted` plate behind it instead of drop shadows;
- 2–3 tones per object, accent used sparingly for the one thing that matters;
- a short horizon dash instead of ground shadows; one gently floating element.

| Role | CSS variable chain |
| --- | --- |
| accent | `--oc-illus-accent` → `--oc-primary` |
| soft | `--oc-illus-soft` → `--oc-primary-soft` |
| paper | `--oc-illus-paper` → `--oc-surface` |
| alt | `--oc-illus-alt` → `--oc-surface-alt` |
| muted | `--oc-illus-muted` → `--oc-surface-muted` |
| line | `--oc-illus-line` → `--oc-border` |
| ink | `--oc-illus-ink` → `--oc-text-muted` |
| edge (outlines) | `--oc-illus-edge` → mix of ink and line |

Set any `--oc-illus-*` variable on a container to retint the scenes inside it (Orca's `EmptyState` `tone` does exactly that).

## Usage

### Vanilla / any framework

```js
import { illustrationToSvg } from '@orca-ui/illustrations';

el.innerHTML = illustrationToSvg('no-results');                      // decorative
el.innerHTML = illustrationToSvg('offline', { label: 'You are offline' }); // role="img"
illustrationToSvg('no-data', { compact: true, animated: false, styles: false });
```

Options: `label`, `compact` (simplified 96px scene for tables / inline states), `animated` (default `true`), `styles` (embed the small `<style>` block; set `false` when `@orca-ui/core` CSS is loaded), `className`.

### Web component

```html
<script type="module">import '@orca-ui/illustrations/element';</script>
<oc-illustration name="empty-inbox"></oc-illustration>
<oc-illustration name="offline" label="You are offline" compact static></oc-illustration>
```

### With Orca's `EmptyState`

The framework `EmptyState` components take the illustration as a node / slot, so the core packages stay dependency-free. A scene **name** also works anywhere once the web component is registered.

```tsx
// React
import { EmptyState, Button } from '@orca-ui/react';
import { NoResultsIllustration } from '@orca-ui/illustrations/react';

<EmptyState
  illustration={<NoResultsIllustration />}
  title="No results for “quarterly”"
  description="Check the spelling or try a broader term."
  primaryAction={<Button variant="primary">Clear filters</Button>}
  secondaryAction={<Button variant="ghost">Search help</Button>}
  size="default"        // 'compact' | 'default' | 'page'
  align="center"        // 'center' | 'start'
  layout="split"        // side by side when the component is ≥ 36rem wide
  tone="neutral"        // 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  headingLevel={2}      // 1–6, or false for a paragraph (default 3)
/>

// or, after `import '@orca-ui/illustrations/element'`:
<EmptyState illustration="server-error" tone="danger" title="Something broke on our side" />
```

```vue
<!-- Vue -->
<script setup>
import { EmptyState } from '@orca-ui/vue';
import { EmptyInboxIllustration } from '@orca-ui/illustrations/vue';
</script>
<template>
  <EmptyState :illustration="EmptyInboxIllustration" title="Inbox zero" description="You're all caught up.">
    <template #primary><button class="oc-btn oc-btn--primary">Compose</button></template>
  </EmptyState>
</template>
```

```svelte
<!-- Svelte 5 -->
<script>
  import { EmptyState } from '@orca-ui/svelte';
  import { Illustration } from '@orca-ui/illustrations/svelte';
</script>
<EmptyState title="No files yet" description="Upload a document to get started.">
  {#snippet illustration()}<Illustration name="no-files" />{/snippet}
  {#snippet primaryAction()}<button class="oc-btn oc-btn--primary">Upload</button>{/snippet}
</EmptyState>
```

```astro
---
import EmptyState from '@orca-ui/astro/components/EmptyState';
import Illustration from '@orca-ui/illustrations/astro';
---
<EmptyState title="Page not found" size="page" headingLevel={1}>
  <Illustration slot="illustration" name="not-found" />
  <a slot="primary" class="oc-btn oc-btn--primary" href="/">Go home</a>
</EmptyState>
```

```ts
// Angular (standalone)
import { OcEmptyState } from '@orca-ui/angular';
import { OcIllustration } from '@orca-ui/illustrations/angular';

@Component({
  imports: [OcEmptyState, OcIllustration],
  template: `
    <oc-empty-state title="No team members" description="Invite people to collaborate.">
      <span ocEmptyIllustration ocIllustration="no-team-members"></span>
      <button ocButton ocEmptyPrimary>Invite</button>
    </oc-empty-state>`,
})
```

```tsx
// React Native (needs react-native-svg)
import { EmptyState, useOrcaTheme } from '@orca-ui/react-native';
import { NoMessagesIllustration } from '@orca-ui/illustrations/native';

const t = useOrcaTheme();
<EmptyState illustration={<NoMessagesIllustration theme={t} />} title="No messages" />
```

React Native has no CSS variables, so pass the active theme (`theme`) or explicit role colors (`colors={{ accent: t.danger }}`). Native scenes are static (no motion).

Standalone files (variables with built-in fallbacks) live at `@orca-ui/illustrations/svg/<name>.svg` for design tools, `<img>` or Flutter (`flutter_svg`).

## Development

```sh
npm run build     # src/scenes/*.js → dist/
npm test          # build + node:test (valid SVG, token-only colors, ARIA, renderers)
npm run preview   # contact sheet: preview/index.html + preview/*.png (headless Edge)
```

Scene sources (`src/scenes/<name>.js`) are SVG markup whose colors are role names (`fill="accent"`); the build validates the element/attribute subset and rejects literal colors.

## License

MIT © oriebalzyuot96

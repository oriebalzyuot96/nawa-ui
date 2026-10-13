# @pelagic-ui/illustrations

Original, themeable SVG scenes for empty states — part of [Pelagic UI](https://oriebalzyuot96.github.io/pelagic-ui/).

- **24 scenes**: `no-data`, `no-results`, `filter-empty`, `empty-inbox`, `no-messages`, `no-comments`, `no-notifications`, `empty-cart`, `no-payments`, `no-files`, `empty-folder`, `upload`, `all-done`, `empty-calendar`, `no-team-members`, `no-favorites`, `welcome`, `coming-soon`, `maintenance`, `offline`, `no-permission`, `error`, `not-found`, `server-error`.
- **Follows every Pelagic theme** (light / dark / high contrast × 7 accents): colors are CSS variables, never hard-coded.
- **Accessible**: decorative by default (`aria-hidden="true"`, `focusable="false"`); pass `label` to expose a scene as `role="img"`. Forced-colors (Windows High Contrast) and `prefers-reduced-motion` are handled.
- **Zero dependencies**; entry points for vanilla JS, React, Vue, Svelte, Angular, Astro, a web component and React Native.

## Install

```sh
npm install @pelagic-ui/illustrations
yarn add @pelagic-ui/illustrations
pnpm add @pelagic-ui/illustrations
```

Load `@pelagic-ui/core/pelagic.css` (or your own `--pl-*` tokens) for themed colors. Without it every scene falls back to the default violet light palette.

## The style

Every scene shares one recipe so they read as a family:

- a 240 × 180 canvas, generous negative space, the subject centred around (120, 95);
- two offset tonal **discs** behind the subject (`surface-alt`, `primary-soft`);
- the Pelagic **nucleus**: a solid accent dot inside a faint ring, orbiting on a dotted ellipse — it reappears inside lenses, rockets and gears;
- flat objects drawn as **layered paper**: a `surface` sheet with a soft outline, an offset `surface-muted` plate behind it instead of drop shadows;
- 2–3 tones per object, accent used sparingly for the one thing that matters;
- a short horizon dash instead of ground shadows; one gently floating element.

| Role | CSS variable chain |
| --- | --- |
| accent | `--pl-illus-accent` → `--pl-primary` |
| soft | `--pl-illus-soft` → `--pl-primary-soft` |
| paper | `--pl-illus-paper` → `--pl-surface` |
| alt | `--pl-illus-alt` → `--pl-surface-alt` |
| muted | `--pl-illus-muted` → `--pl-surface-muted` |
| line | `--pl-illus-line` → `--pl-border` |
| ink | `--pl-illus-ink` → `--pl-text-muted` |
| edge (outlines) | `--pl-illus-edge` → mix of ink and line |

Set any `--pl-illus-*` variable on a container to retint the scenes inside it (Pelagic's `EmptyState` `tone` does exactly that).

## Usage

### Vanilla / any framework

```js
import { illustrationToSvg } from '@pelagic-ui/illustrations';

el.innerHTML = illustrationToSvg('no-results');                      // decorative
el.innerHTML = illustrationToSvg('offline', { label: 'You are offline' }); // role="img"
illustrationToSvg('no-data', { compact: true, animated: false, styles: false });
```

Options: `label`, `compact` (simplified 96px scene for tables / inline states), `animated` (default `true`), `styles` (embed the small `<style>` block; set `false` when `@pelagic-ui/core` CSS is loaded), `className`.

### Web component

```html
<script type="module">import '@pelagic-ui/illustrations/element';</script>
<pl-illustration name="empty-inbox"></pl-illustration>
<pl-illustration name="offline" label="You are offline" compact static></pl-illustration>
```

### With Pelagic's `EmptyState`

The framework `EmptyState` components take the illustration as a node / slot, so the core packages stay dependency-free. A scene **name** also works anywhere once the web component is registered.

```tsx
// React
import { EmptyState, Button } from '@pelagic-ui/react';
import { NoResultsIllustration } from '@pelagic-ui/illustrations/react';

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

// or, after `import '@pelagic-ui/illustrations/element'`:
<EmptyState illustration="server-error" tone="danger" title="Something broke on our side" />
```

```vue
<!-- Vue -->
<script setup>
import { EmptyState } from '@pelagic-ui/vue';
import { EmptyInboxIllustration } from '@pelagic-ui/illustrations/vue';
</script>
<template>
  <EmptyState :illustration="EmptyInboxIllustration" title="Inbox zero" description="You're all caught up.">
    <template #primary><button class="pl-btn pl-btn--primary">Compose</button></template>
  </EmptyState>
</template>
```

```svelte
<!-- Svelte 5 -->
<script>
  import { EmptyState } from '@pelagic-ui/svelte';
  import { Illustration } from '@pelagic-ui/illustrations/svelte';
</script>
<EmptyState title="No files yet" description="Upload a document to get started.">
  {#snippet illustration()}<Illustration name="no-files" />{/snippet}
  {#snippet primaryAction()}<button class="pl-btn pl-btn--primary">Upload</button>{/snippet}
</EmptyState>
```

```astro
---
import EmptyState from '@pelagic-ui/astro/components/EmptyState';
import Illustration from '@pelagic-ui/illustrations/astro';
---
<EmptyState title="Page not found" size="page" headingLevel={1}>
  <Illustration slot="illustration" name="not-found" />
  <a slot="primary" class="pl-btn pl-btn--primary" href="/">Go home</a>
</EmptyState>
```

```ts
// Angular (standalone)
import { PlEmptyState } from '@pelagic-ui/angular';
import { PlIllustration } from '@pelagic-ui/illustrations/angular';

@Component({
  imports: [PlEmptyState, PlIllustration],
  template: `
    <pl-empty-state title="No team members" description="Invite people to collaborate.">
      <span plEmptyIllustration plIllustration="no-team-members"></span>
      <button plButton plEmptyPrimary>Invite</button>
    </pl-empty-state>`,
})
```

```tsx
// React Native (needs react-native-svg)
import { EmptyState, usePelagicTheme } from '@pelagic-ui/react-native';
import { NoMessagesIllustration } from '@pelagic-ui/illustrations/native';

const t = usePelagicTheme();
<EmptyState illustration={<NoMessagesIllustration theme={t} />} title="No messages" />
```

React Native has no CSS variables, so pass the active theme (`theme`) or explicit role colors (`colors={{ accent: t.danger }}`). Native scenes are static (no motion).

Standalone files (variables with built-in fallbacks) live at `@pelagic-ui/illustrations/svg/<name>.svg` for design tools, `<img>` or Flutter (`flutter_svg`).

## Development

```sh
npm run build     # src/scenes/*.js → dist/
npm test          # build + node:test (valid SVG, token-only colors, ARIA, renderers)
npm run preview   # contact sheet: preview/index.html + preview/*.png (headless Edge)
```

Scene sources (`src/scenes/<name>.js`) are SVG markup whose colors are role names (`fill="accent"`); the build validates the element/attribute subset and rejects literal colors.

## License

MIT © oriebalzyuot96

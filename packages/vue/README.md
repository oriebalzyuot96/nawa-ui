# @nawa-ui/vue

**Nawa UI for Vue 3** — an accessible, themeable UI component library. WCAG 2.2 AA, 21 themes (light, dark, high contrast × 7 accents), skeleton loaders and full RTL support. Same components and API in React, Vue, Svelte, Astro and React Native.

- 📖 Docs and live preview: https://oriebalzyuot96.github.io/nawa-ui/
- 🧩 Components: https://oriebalzyuot96.github.io/nawa-ui/components/
- 🎨 Themes: https://oriebalzyuot96.github.io/nawa-ui/themes/

## Install

```bash
npm i @nawa-ui/vue @nawa-ui/core
```

## Usage

```vue
<script setup lang="ts">
import '@nawa-ui/core/style.css';
import { Button, Input } from '@nawa-ui/vue';
const name = ref('');
</script>
<template>
  <Input v-model="name" label="Name" />
  <Button>Save</Button>
</template>
```

## Why Nawa UI

- Accessible by default: verified contrast for every theme, focus traps, keyboard patterns, screen-reader labels, reduced motion.
- 21 themes and 3 shapes with one attribute; follows the OS dark mode and high-contrast settings.
- Skeletons, DataTable, Dialog, Drawer, Tabs, Toast, Tooltip, Stepper, Timeline and more.
- One design system across five frameworks.

MIT © oriebalzyuot96

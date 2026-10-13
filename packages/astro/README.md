# @pelagic-ui/astro

**Pelagic UI for Astro** — an accessible, themeable UI component library. WCAG 2.2 AA, 21 themes (light, dark, high contrast × 7 accents), skeleton loaders and full RTL support. Same components and API in React, Vue, Svelte, Astro and React Native.

- 📖 Docs and live preview: https://oriebalzyuot96.github.io/pelagic-ui/
- 🧩 Components: https://oriebalzyuot96.github.io/pelagic-ui/components/
- 🎨 Themes: https://oriebalzyuot96.github.io/pelagic-ui/themes/

## Install

```bash
npm i @pelagic-ui/astro @pelagic-ui/core
```

## Usage

```astro
---
import '@pelagic-ui/core/style.css';
import Button from '@pelagic-ui/astro/components/Button';
import Dialog from '@pelagic-ui/astro/components/Dialog';
---
<Button data-pl-open="hello">Open</Button>
<Dialog id="hello" title="Hello">Zero JavaScript by default.</Dialog>
```

## Why Pelagic UI

- Accessible by default: verified contrast for every theme, focus traps, keyboard patterns, screen-reader labels, reduced motion.
- 21 themes and 3 shapes with one attribute; follows the OS dark mode and high-contrast settings.
- Skeletons, DataTable, Dialog, Drawer, Tabs, Toast, Tooltip, Stepper, Timeline and more.
- One design system across five frameworks.

MIT © oriebalzyuot96

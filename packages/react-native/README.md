# @pelagic-ui/react-native

**Pelagic UI for React Native** — an accessible, themeable UI component library. WCAG 2.2 AA, 21 themes (light, dark, high contrast × 7 accents), skeleton loaders and full RTL support. Same components and API in React, Vue, Svelte, Astro and React Native.

- 📖 Docs and live preview: https://oriebalzyuot96.github.io/pelagic-ui/
- 🧩 Components: https://oriebalzyuot96.github.io/pelagic-ui/components/
- 🎨 Themes: https://oriebalzyuot96.github.io/pelagic-ui/themes/

## Install

```bash
npm i @pelagic-ui/react-native @pelagic-ui/core
```

## Usage

```tsx
import { PelagicProvider, Button } from '@pelagic-ui/react-native';

<PelagicProvider mode="system" accent="teal">
  <Button title="Save" />
</PelagicProvider>
```

## Why Pelagic UI

- Accessible by default: verified contrast for every theme, focus traps, keyboard patterns, screen-reader labels, reduced motion.
- 21 themes and 3 shapes with one attribute; follows the OS dark mode and high-contrast settings.
- Skeletons, DataTable, Dialog, Drawer, Tabs, Toast, Tooltip, Stepper, Timeline and more.
- One design system across five frameworks.

MIT © oriebalzyuot96

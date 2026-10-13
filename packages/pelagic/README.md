# pelagic

**Pelagic UI in one package.** 150+ accessible, themeable components for **React, Vue, Angular, Svelte, Astro and React Native** — plus accessible charts, 3D, 239 icons, 24 illustrations, motion, sound and an accessibility panel. WCAG 2.2 AA, 21 built-in themes, your own brand colors, RTL and Arabic.

🌐 Docs & live demos: https://oriebalzyuot96.github.io/pelagic-ui/ · 🧱 Drag-and-drop builder: https://oriebalzyuot96.github.io/pelagic-ui/space/ · 💻 Source: https://github.com/oriebalzyuot96/pelagic-ui

```bash
npm i pelagic
# or
yarn add pelagic
# or
pnpm add pelagic
```

Framework packages (react, vue, @angular/*, svelte, astro, react-native, three) are optional peers — install only the one you use.

## Quick start

```ts
// 1. Styles, once in your app entry
import 'pelagic/style.css';
```

```tsx
// React
import { Button, DataTable, DatePicker, swal, Toaster, AccessibilityPanel } from 'pelagic/react';
```

```ts
// Vue
import { Button, Input, DataTable } from 'pelagic/vue';
// Angular
import { PELAGIC_UI } from 'pelagic/angular';
// Svelte
import { Button, Dialog } from 'pelagic/svelte';
// React Native
import { PelagicProvider, Button } from 'pelagic/react-native';
```

```astro
---
// Astro (zero JS by default)
import Button from 'pelagic/astro/components/Button';
---
<Button>Save</Button>
```

## Everything inside

| Import | What you get |
|---|---|
| `pelagic/style.css` | All component styles + 21 themes + accessibility modes |
| `pelagic/react` · `/vue` · `/angular` · `/svelte` · `/react-native` | Components for each framework |
| `pelagic/astro/components/<Name>` | Server-rendered Astro components |
| `pelagic/three` | WebGL 3D: Globe3D, Scene3D, ModelViewer, Chart3D… |
| `pelagic/icons/react` (also `/vue`, `/svelte`, `/angular`, `/astro`, `/element`) | 239 original duotone icons |
| `pelagic/illustrations/react` (and other frameworks) | 24 themeable empty-state illustrations |
| `pelagic/core/theme` | `applyTheme`, `createTheme` (custom brand colors) |
| `pelagic/core/a11y-prefs` | Accessibility modes (contrast, text size, dyslexia font, reading guide…) |
| `pelagic/core/motion` · `/core/sound` | Animation engine · UI sound engine |

## Your own brand color

```ts
import { createTheme, applyCustomTheme } from 'pelagic/core/theme';
applyCustomTheme(createTheme({ primary: '#ff6a00' })); // light, dark and high contrast, all WCAG AA
```

## Themes and accessibility

```html
<html data-theme="dark" data-accent="indigo" data-shape="round">
<html data-a11y-contrast="yellow-black" data-a11y-font-scale="1.5">
```

```ts
import { applyA11yPrefs } from 'pelagic/core/a11y-prefs';
applyA11yPrefs({ contrast: 'yellow-black', fontScale: 1.5, motion: 'off' });
```

Modes: light, dark, high contrast, yellow-on-black, black-on-yellow, grayscale, invert, color-blind filters, text size 90–200%, text spacing, readable font, underlined links, big cursor, reading guide, stop motion, large targets.

MIT © oriebalzyuot96

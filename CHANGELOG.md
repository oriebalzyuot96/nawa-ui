# Changelog

## 0.2.0

### Themes
- **Animated theme switch.** `switchTheme(next, { origin })` in `@pelagic-ui/core/theme` changes mode, accent,
  preset, shape or brand color with a circular reveal that grows from the clicked control (View Transitions API),
  a short color crossfade where that API is missing, and no animation under reduced motion (OS setting or
  `data-a11y-motion` reduce / off; `full` keeps it on). Saves the choice, updates `<meta name="theme-color">` and
  dispatches `pl-theme-change`. Also `getThemeState`, `onThemeChange`, `restoreTheme`, `themeMotionReduced`.
  Helpers: React `useThemeSwitch()`, Vue `useThemeSwitch()`, Svelte `themeState` store and `use:themeSwitch`,
  Angular `PelagicThemeService.switch()` and `state` signal.
- **10 named color themes** on `data-theme-preset`: lagoon, abyss, reef, kelp, sage, dune, aurora, merlot, ink
  and graphite. Each changes page and card surfaces, text, borders, status colors and accent for light and dark;
  high contrast keeps pure black on white with the preset's accent. `presetThemes` in `tokens.js` for React Native.
- **Two new accents**: ocean and coral (9 in total).
- **Live brand color**: `switchTheme({ brand })` / `applyTheme({ brand })` builds a WCAG AA theme for any color,
  fitted to the active preset (`createTheme({ primary, preset })`), and the no-flash `ThemeScript` restores it.
- Contrast check extended to every preset × mode, every preset × accent, preset inverted and low-saturation
  renderings and brands fitted to presets (22 580 checks, up from 5 540).

### Accessibility panel (React, Vue, Svelte, Angular, Astro)
- New **Theme** group: mode (system / light / dark / high contrast), color-theme tiles, accent swatches, a color
  picker for your own color (applied live, saved) and "Default colors". Every change uses the animated switch.
- New **Sound** group (interface sounds on / off and sound style), shown when the page has a sound engine;
  `getSoundPrefs` / `setSoundPrefs` / `hasSoundEngine` in `@pelagic-ui/core/sound` keep engines in sync.
- Motion option **Full**: animations stay on even when the OS asks to reduce motion (every
  `prefers-reduced-motion` rule now steps aside for `data-a11y-motion="full"`).
- New props: `appearance` (default true) and `sound` (`'auto'`, true, false).

### Toaster
- One framework-free toaster in `@pelagic-ui/core/toast` (`toast()`, `mountToaster()`), shared by React and now
  also Vue (`<Toaster />`), Svelte (`<Toaster />`), Angular (`<pl-toaster />` + `PlToastService`) and Astro
  (`<Toaster />`, `window.pelagicToast`, `window.pelagicToaster`), all on the same CSS and queue.
- Spring enter and exit from each of the 6 positions (RTL aware); fade only under reduced motion.
- Animated icons: success draws in, error shakes, warning pulses, info drops in, and the loading spinner of
  `toast.promise()` morphs into the result.
- Rich toasts with an avatar, an `undo` shorthand, and a queue beyond `visibleToasts`.
- Announcements through one polite and one assertive live region, once per change (errors interrupt); the list
  itself is no longer a live region, so nothing is read twice.
- Countdown bar and timers pause on hover, focus, swipe, a hidden tab and `store.pause()`.

### Components
- Motion polish: consistent press feedback, input focus transitions, animated checkbox / radio / switch marks,
  menu, popover and tooltip entrances (`@starting-style`), accordion and tab panels that settle in. All of it
  respects reduced motion and `data-a11y-motion`.

### Breaking
- Angular `<pl-toaster>` and Astro `<Toaster />` render the shared `.pl-toaster` region instead of the old
  `.pl-toast-stack`; `PlToastService` and `window.pelagicToast` keep their signatures.
- `a11yPanelSchema` starts with the `appearance` group and ends with `sound`; pass `groups` or
  `appearance={false}` / `sound={false}` for the previous panel.

// Theme helpers for Svelte: a readable store of the live theme and a `use:themeSwitch` action that switches
// with the animated circular reveal from the clicked element (instant under reduced motion).
//
//   <script>
//     import { themeState, themeSwitch, switchTheme } from '@pelagic-ui/svelte';
//   </script>
//   <button use:themeSwitch={{ mode: $themeState.mode === 'dark' ? 'light' : 'dark' }}>Toggle theme</button>
import { readable } from 'svelte/store';
import { THEME_CHANGE_EVENT, getThemeState, switchTheme, type SwitchThemeOptions, type ThemeChoice, type ThemeState } from '@pelagic-ui/core/theme';

export { switchTheme, getThemeState, onThemeChange, restoreTheme } from '@pelagic-ui/core/theme';
export type { ThemeState, SwitchThemeOptions, ThemeSwitchOrigin, ThemePreset } from '@pelagic-ui/core/theme';

/** The theme applied to <html>, updated after every switchTheme() on the page (defaults during SSR). */
export const themeState = readable<ThemeState>(getThemeState(null), (set) => {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const sync = () => set(getThemeState(el));
  sync();
  el.addEventListener(THEME_CHANGE_EVENT, sync);
  return () => el.removeEventListener(THEME_CHANGE_EVENT, sync);
});

/** Svelte action: clicking the element switches to `choice`, revealing it from the click (or the element). */
export function themeSwitch(node: HTMLElement, choice: ThemeChoice & { options?: Omit<SwitchThemeOptions, 'origin'> }) {
  let current = choice;
  const onClick = (event: MouseEvent) => {
    const { options, ...next } = current;
    void switchTheme(next, { ...options, origin: event });
  };
  node.addEventListener('click', onClick);
  return {
    update(next: typeof choice) {
      current = next;
    },
    destroy() {
      node.removeEventListener('click', onClick);
    },
  };
}

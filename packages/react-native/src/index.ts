// Wrap your app once with <PelagicProvider mode="system" accent="teal"> (defaults follow the device).
export { PelagicProvider, usePelagicTheme, useReducedMotion, space, radius, fontSize } from './theme';
export type { PelagicProviderProps } from './theme';
export * from './components/actions';
export * from './components/forms';
export * from './components/display';
export * from './components/navigation';
export * from './components/data';
export * from './components/overlay';
export { getPageItems } from './utils';
export { themes, lightTheme, darkTheme, highContrastTheme, getTheme } from '@pelagic-ui/core/tokens';
export type { PelagicTheme, ThemeMode, ThemeAccent, ThemeName } from '@pelagic-ui/core/tokens';

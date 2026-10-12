import type { ThemeAccent, ThemeMode, ThemeShape } from '../tokens';

export interface ThemeChoice {
  /** 'system' follows prefers-color-scheme and prefers-contrast. */
  mode?: ThemeMode | 'system';
  accent?: ThemeAccent;
  shape?: ThemeShape;
}

export declare const THEME_STORAGE_KEY: string;
/** Set data-theme / data-accent / data-shape on `target` (default: <html>). */
export declare function applyTheme(theme?: ThemeChoice, target?: HTMLElement): void;
/** Save a theme choice to localStorage. Failures are ignored. */
export declare function saveTheme(theme: ThemeChoice): void;
/** Read a saved theme choice, or null. */
export declare function loadTheme(): ThemeChoice | null;

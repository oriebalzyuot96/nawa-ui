// Apply and persist a Nawa UI theme on the web. Theming is pure CSS attributes,
// so this works the same for React, Vue, Svelte, Astro or plain HTML.

export const THEME_STORAGE_KEY = 'nawa-ui-theme';

/**
 * Set data-theme / data-accent / data-shape on `target` (default: <html>).
 * mode 'system' removes data-theme so the OS setting (dark mode, high contrast) applies.
 */
export function applyTheme({ mode, accent, shape } = {}, target = document.documentElement) {
  if (mode !== undefined) {
    if (mode === 'system') target.removeAttribute('data-theme');
    else target.setAttribute('data-theme', mode);
  }
  if (accent !== undefined) target.setAttribute('data-accent', accent);
  if (shape !== undefined) target.setAttribute('data-shape', shape);
}

/** Save a theme choice. Storage can be unavailable (private mode); failures are ignored. */
export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch {
    /* storage unavailable */
  }
}

/** Read a saved theme choice, or null. */
export function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

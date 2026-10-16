import {
  DOCUMENT,
  EnvironmentProviders,
  Injectable,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  THEME_CHANGE_EVENT,
  applyTheme,
  getThemeState,
  loadTheme,
  saveTheme,
  switchTheme,
  type SwitchThemeOptions,
  type ThemeChoice,
  type ThemeState,
} from '@pelagic-ui/core/theme';

export type { ThemeChoice, ThemeState, SwitchThemeOptions, ThemeSwitchOrigin } from '@pelagic-ui/core/theme';
export type { ThemeMode, ThemeAccent, ThemeShape, ThemePreset } from '@pelagic-ui/core/tokens';

export interface PelagicThemeOptions extends ThemeChoice {
  /**
   * When true (default), a choice saved earlier with `PelagicThemeService.set(..., { persist: true })`
   * takes precedence over these defaults.
   */
  restoreSaved?: boolean;
}

/** Applies and persists the Pelagic UI theme (data-theme / data-accent / data-shape on <html>). */
@Injectable({ providedIn: 'root' })
export class PelagicThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly current = signal<ThemeChoice>({});

  /** The theme choice currently applied. */
  readonly theme = this.current.asReadonly();

  private readonly live = signal<ThemeState>(getThemeState(null));
  /** The theme applied to <html>, kept in sync with every switchTheme() on the page (panel, header, code). */
  readonly state = this.live.asReadonly();

  constructor() {
    if (!this.isBrowser) return;
    const el = this.document.documentElement;
    const sync = () => this.live.set(getThemeState(el));
    sync();
    el.addEventListener(THEME_CHANGE_EVENT, sync);
  }

  /** Merge `choice` into the current theme and apply it. */
  set(choice: ThemeChoice, options: { persist?: boolean } = {}): void {
    const next = { ...this.current(), ...choice };
    this.current.set(next);
    applyTheme(next, this.document.documentElement);
    if (options.persist && this.isBrowser) saveTheme(next);
  }

  /**
   * Switch with the animated circular reveal from `options.origin` (the click event or the clicked element).
   * Instant under reduced motion and on the server. Saves the choice unless `persist: false`.
   *
   *   <button (click)="theme.switch({ mode: 'dark' }, { origin: $event })">Dark</button>
   */
  switch(choice: ThemeChoice, options: SwitchThemeOptions = {}): Promise<ThemeState> {
    this.current.set({ ...this.current(), ...choice });
    if (!this.isBrowser) return Promise.resolve(this.live());
    return switchTheme(choice, { target: this.document.documentElement, ...options });
  }

  /** Save the current choice to localStorage. */
  save(): void {
    if (this.isBrowser) saveTheme(this.current());
  }

  /** Read the saved choice (null on the server or when nothing is saved). */
  load(): ThemeChoice | null {
    return this.isBrowser ? loadTheme() : null;
  }

  /** Apply the saved choice, if any. Returns it. */
  restore(): ThemeChoice | null {
    const saved = this.load();
    if (saved) this.set(saved);
    return saved;
  }
}

/** Apply a Pelagic UI theme when the application starts. */
export function providePelagicTheme(options: PelagicThemeOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const service = inject(PelagicThemeService);
      const { restoreSaved = true, ...defaults } = options;
      const saved = restoreSaved ? service.load() : null;
      service.set({ ...defaults, ...(saved ?? {}) });
    }),
  ]);
}

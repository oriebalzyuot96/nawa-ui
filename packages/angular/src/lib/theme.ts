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
import { applyTheme, loadTheme, saveTheme, type ThemeChoice } from '@orca-ui/core/theme';

export type { ThemeChoice } from '@orca-ui/core/theme';
export type { ThemeMode, ThemeAccent, ThemeShape } from '@orca-ui/core/tokens';

export interface OrcaThemeOptions extends ThemeChoice {
  /**
   * When true (default), a choice saved earlier with `OrcaThemeService.set(..., { persist: true })`
   * takes precedence over these defaults.
   */
  restoreSaved?: boolean;
}

/** Applies and persists the Orca UI theme (data-theme / data-accent / data-shape on <html>). */
@Injectable({ providedIn: 'root' })
export class OrcaThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly current = signal<ThemeChoice>({});

  /** The theme choice currently applied. */
  readonly theme = this.current.asReadonly();

  /** Merge `choice` into the current theme and apply it. */
  set(choice: ThemeChoice, options: { persist?: boolean } = {}): void {
    const next = { ...this.current(), ...choice };
    this.current.set(next);
    applyTheme(next, this.document.documentElement);
    if (options.persist && this.isBrowser) saveTheme(next);
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

/** Apply an Orca UI theme when the application starts. */
export function provideOrcaTheme(options: OrcaThemeOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const service = inject(OrcaThemeService);
      const { restoreSaved = true, ...defaults } = options;
      const saved = restoreSaved ? service.load() : null;
      service.set({ ...defaults, ...(saved ?? {}) });
    }),
  ]);
}

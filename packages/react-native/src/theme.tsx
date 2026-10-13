import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { getTheme, type PelagicTheme, type ThemeAccent, type ThemeMode } from '@pelagic-ui/core/tokens';
import type { CustomTheme } from '@pelagic-ui/core/theme';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const fontSize = { xs: 11, sm: 13, md: 15, lg: 17, xl: 20 } as const;

const ThemeContext = createContext<PelagicTheme | null>(null);

export interface PelagicProviderProps {
  /** 'system' (default) follows the device: dark mode, and high contrast on iOS when "Increase Contrast" is on. */
  mode?: ThemeMode | 'system';
  accent?: ThemeAccent;
  /**
   * A custom brand theme from createTheme() in @pelagic-ui/core/theme (any brand color, contrast-checked in
   * light, dark and high contrast). Takes precedence over `accent`.
   */
  theme?: CustomTheme;
  children: ReactNode;
}

/** iOS "Increase Contrast" / Android high-contrast text. */
function useHighContrast(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let mounted = true;
    // isHighTextContrastEnabled is Android-only; iOS exposes "Increase Contrast" through the color scheme API instead.
    const check = (AccessibilityInfo as unknown as { isHighTextContrastEnabled?: () => Promise<boolean> }).isHighTextContrastEnabled;
    check?.().then((value) => mounted && setOn(value)).catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);
  return on;
}

export function PelagicProvider({ mode = 'system', accent = 'teal', theme, children }: PelagicProviderProps) {
  const scheme = useColorScheme();
  const highContrast = useHighContrast();
  const resolved: ThemeMode = mode !== 'system' ? mode : highContrast ? 'hc' : scheme === 'dark' ? 'dark' : 'light';
  const value = useMemo(() => (theme ? ({ ...getTheme(resolved, accent), ...theme.tokens[resolved] } as PelagicTheme) : getTheme(resolved, accent)), [resolved, accent, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Current theme tokens. Works without a provider (falls back to the device color scheme). */
export function usePelagicTheme(): PelagicTheme {
  const fromContext = useContext(ThemeContext);
  const scheme = useColorScheme();
  return fromContext ?? getTheme(scheme === 'dark' ? 'dark' : 'light');
}

/** True when the user asked the OS to reduce motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduced(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

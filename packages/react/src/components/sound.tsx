import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react';
import {
  SOUND_THEMES,
  UI_SOUNDS,
  createSoundEngine,
  emitUiSound,
  type SoundEngine,
  type SoundEngineOptions,
  type SoundState,
  type SoundTheme,
  type UiSoundName,
} from '@pelagic-ui/core/sound';

export { SOUND_THEMES, UI_SOUNDS, createSoundEngine, emitUiSound };
export type { SoundEngine, SoundEngineOptions, SoundState, SoundTheme, UiSoundName };

export interface SoundProviderProps {
  /**
   * Default for users without a saved preference. Sound is OFF unless this is true.
   * Changing it later applies it without overwriting the user's saved choice.
   */
  enabled?: boolean;
  /** App-level switch: `false` silences every sound regardless of user preference. Default true. */
  allowed?: boolean;
  /** Default theme for users without a saved preference ('soft' | 'crisp' | 'playful' | 'minimal'). */
  theme?: SoundTheme;
  /** Default master volume 0–1 for users without a saved preference. */
  volume?: number;
  /** Keep only status sounds, quieter. */
  reduced?: boolean;
  /** Persist user changes (default true) and the storage key (default "pl-sound"). */
  persist?: boolean;
  storageKey?: string;
  /** Bring your own engine (e.g. shared with non-React code). The provider will not destroy it. */
  engine?: SoundEngine;
  /** Custom AudioContext factory (tests). */
  createContext?: SoundEngineOptions['createContext'];
  children?: ReactNode;
}

export interface UseSound extends SoundState {
  /** Play a sound now. Returns true when it was scheduled. */
  play: (name: UiSoundName, options?: { volume?: number }) => boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  setTheme: (theme: SoundTheme) => void;
  setVolume: (volume: number) => void;
  setReduced: (reduced: boolean) => void;
  /** Inside a SoundProvider. */
  available: boolean;
  sounds: readonly UiSoundName[];
  themes: readonly SoundTheme[];
  engine: SoundEngine | null;
}

interface SoundContextValue {
  engine: SoundEngine;
  /** What the server rendered (no storage, no Web Audio): used while hydrating to avoid mismatches. */
  serverState: SoundState;
}

const SoundContext = createContext<SoundContextValue | null>(null);

/**
 * Turns on UI sounds for everything inside it. Components request sounds with `emitUiSound`;
 * nothing plays until the user has interacted with the page and sound is enabled.
 */
export function SoundProvider({ enabled, allowed = true, theme, volume, reduced, persist, storageKey, engine: external, createContext: factory, children }: SoundProviderProps) {
  const ref = useRef<SoundEngine | null>(external ?? null);
  if (!ref.current) {
    ref.current = createSoundEngine({ enabled, allowed, theme, volume, reduced, persist, storageKey, createContext: factory });
  }
  const engine = ref.current;

  // Destroy on unmount; deferred so StrictMode's simulated unmount/remount keeps the same engine.
  const pendingDestroy = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (external) return undefined;
    clearTimeout(pendingDestroy.current);
    return () => {
      pendingDestroy.current = setTimeout(() => engine.destroy(), 0);
    };
  }, [engine, external]);

  useEffect(() => engine.setAllowed(allowed), [engine, allowed]);

  // Later prop changes apply without persisting (they are app decisions, not the user's).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) return;
    if (enabled !== undefined) engine.setEnabled(enabled, { persist: false, preview: false });
  }, [engine, enabled]);
  useEffect(() => {
    if (mounted.current && theme) engine.setTheme(theme, { persist: false });
  }, [engine, theme]);
  useEffect(() => {
    if (mounted.current && volume !== undefined) engine.setVolume(volume, { persist: false });
  }, [engine, volume]);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const serverState = useMemo<SoundState>(
    () => ({ enabled: Boolean(enabled), theme: theme ?? 'soft', volume: volume ?? 0.6, reduced: Boolean(reduced), allowed, unlocked: false, supported: false }),
    // Only the first render's values matter for hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine],
  );
  const value = useMemo(() => ({ engine, serverState }), [engine, serverState]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

const OFF_STATE: SoundState = { enabled: false, theme: 'soft', volume: 0, reduced: false, allowed: false, unlocked: false, supported: false };
const noopSubscribe = () => () => {};
const offState = () => OFF_STATE;

/** Sound state and controls. Outside a SoundProvider `play` falls back to `emitUiSound` and the setters do nothing. */
export function useSound(): UseSound {
  const ctx = useContext(SoundContext);
  const engine = ctx?.engine ?? null;
  const serverState = ctx?.serverState;
  const getServer = useMemo(() => (serverState ? () => serverState : offState), [serverState]);
  const state = useSyncExternalStore(engine ? engine.subscribe : noopSubscribe, engine ? engine.getState : offState, getServer);
  return useMemo<UseSound>(
    () => ({
      ...state,
      play: (name, options) => {
        if (engine) return engine.play(name, options);
        emitUiSound(name, options);
        return false;
      },
      setEnabled: (on) => engine?.setEnabled(on),
      toggle: () => engine?.toggle(),
      setTheme: (t) => engine?.setTheme(t),
      setVolume: (v) => engine?.setVolume(v),
      setReduced: (r) => engine?.setReduced(r),
      available: engine != null,
      sounds: UI_SOUNDS,
      themes: SOUND_THEMES,
      engine,
    }),
    [engine, state],
  );
}

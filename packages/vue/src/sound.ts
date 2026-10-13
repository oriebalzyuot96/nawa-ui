import { getCurrentScope, onScopeDispose, shallowRef, type ShallowRef } from 'vue';
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

let shared: SoundEngine | null = null;

/** The app-wide sound engine (created on first use; options apply only then). Off by default. */
export function getSoundEngine(options?: SoundEngineOptions): SoundEngine {
  if (!shared) shared = createSoundEngine(options);
  return shared;
}

export interface UseSound {
  /** Reactive engine state (enabled, theme, volume, reduced, unlocked, supported). */
  state: Readonly<ShallowRef<SoundState>>;
  play: (name: UiSoundName, options?: { volume?: number }) => boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  setTheme: (theme: SoundTheme) => void;
  setVolume: (volume: number) => void;
  setReduced: (reduced: boolean) => void;
  engine: SoundEngine;
}

/** UI sound controls for Vue. Components request sounds with `emitUiSound(name)`. */
export function useSound(options?: SoundEngineOptions): UseSound {
  const engine = getSoundEngine(options);
  const state = shallowRef(engine.getState());
  const off = engine.subscribe((s) => {
    state.value = s;
  });
  if (getCurrentScope()) onScopeDispose(off);
  return {
    state,
    play: (name, o) => engine.play(name, o),
    setEnabled: (on) => engine.setEnabled(on),
    toggle: () => engine.toggle(),
    setTheme: (t) => engine.setTheme(t),
    setVolume: (v) => engine.setVolume(v),
    setReduced: (r) => engine.setReduced(r),
    engine,
  };
}

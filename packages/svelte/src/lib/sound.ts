import { createSoundEngine, emitUiSound, SOUND_THEMES, UI_SOUNDS, type SoundEngine, type SoundEngineOptions, type SoundState } from '@pelagic-ui/core/sound';

export { SOUND_THEMES, UI_SOUNDS, createSoundEngine, emitUiSound };
export type { SoundEngine, SoundEngineOptions, SoundState, SoundTheme, UiSoundName } from '@pelagic-ui/core/sound';

/** A Svelte store over a sound engine: `$sound.enabled`, `sound.setEnabled(true)`, `sound.play('success')`. Off by default. */
export function createSoundStore(options?: SoundEngineOptions): SoundEngine & { subscribe: (run: (state: SoundState) => void) => () => void } {
  const engine = createSoundEngine(options);
  return Object.assign(Object.create(null), engine, {
    subscribe(run: (state: SoundState) => void) {
      run(engine.getState());
      return engine.subscribe(run);
    },
  });
}

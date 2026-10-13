import { Injectable, signal, type OnDestroy } from '@angular/core';
import {
  createSoundEngine,
  emitUiSound,
  SOUND_THEMES,
  UI_SOUNDS,
  type SoundEngine,
  type SoundState,
  type SoundTheme,
  type UiSoundName,
} from '@orca-ui/core/sound';

export { emitUiSound, SOUND_THEMES, UI_SOUNDS };
export type { SoundState, SoundTheme, UiSoundName };

/**
 * App-wide UI sounds. Off by default; never plays before a user gesture.
 * Components request sounds with `emitUiSound(name)`; inject this service once (e.g. in a settings panel) to enable it.
 */
@Injectable({ providedIn: 'root' })
export class OcSoundService implements OnDestroy {
  readonly engine: SoundEngine = createSoundEngine();
  private readonly _state = signal<SoundState>(this.engine.getState());
  /** Reactive state (enabled, theme, volume, reduced, unlocked, supported). */
  readonly state = this._state.asReadonly();
  private readonly off = this.engine.subscribe((s) => this._state.set(s));

  play(name: UiSoundName, options?: { volume?: number }): boolean {
    return this.engine.play(name, options);
  }
  setEnabled(enabled: boolean): void {
    this.engine.setEnabled(enabled);
  }
  toggle(): void {
    this.engine.toggle();
  }
  setTheme(theme: SoundTheme): void {
    this.engine.setTheme(theme);
  }
  setVolume(volume: number): void {
    this.engine.setVolume(volume);
  }
  setReduced(reduced: boolean): void {
    this.engine.setReduced(reduced);
  }
  ngOnDestroy(): void {
    this.off();
    this.engine.destroy();
  }
}

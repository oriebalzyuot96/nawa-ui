/** Built-in UI sounds (all synthesized with the Web Audio API; no audio files). */
export type UiSoundName =
  | 'click'
  | 'toggle-on'
  | 'toggle-off'
  | 'select'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'notification'
  | 'delete'
  | 'send'
  | 'pop'
  | 'swipe'
  | 'open'
  | 'close'
  | 'drag-start'
  | 'drop'
  | 'typing';

/** Timbre presets: soft (warm, default), crisp (bright, short), playful (bouncy glides), minimal (one quiet voice). */
export type SoundTheme = 'soft' | 'crisp' | 'playful' | 'minimal';

/** Why `play()` would be dropped right now. */
export type SoundBlockedReason = 'destroyed' | 'unknown' | 'app-disabled' | 'disabled' | 'muted' | 'reduced' | 'locked' | 'hidden';

export declare const UI_SOUNDS: readonly UiSoundName[];
export declare const SOUND_THEMES: readonly SoundTheme[];
/** Window event name dispatched by `emitUiSound`. */
export declare const UI_SOUND_EVENT: 'pl:ui-sound';
/** Default localStorage key for user sound preferences. */
export declare const SOUND_STORAGE_KEY: string;

export interface SoundEngineOptions {
  /** Default state when the user has no saved preference. Sound is OFF unless this is true. */
  enabled?: boolean;
  /** App-level switch: false silences everything regardless of the user's preference. Default true. */
  allowed?: boolean;
  /** Default 'soft'. */
  theme?: SoundTheme;
  /** Master volume 0–1. Default 0.6. */
  volume?: number;
  /** Keep only status sounds (success, error, warning, info, notification), quieter. */
  reduced?: boolean;
  /** Persist user changes to localStorage. Default true. */
  persist?: boolean;
  /** localStorage key. Default "pl-sound". */
  storageKey?: string;
  /** Play sounds requested with `emitUiSound`. Default true. */
  listen?: boolean;
  /** Custom AudioContext factory (tests, shared contexts). Return null when audio is unavailable. */
  createContext?: () => AudioContext | null;
  /** Also unlock on untrusted (scripted) events. Default false. */
  allowSyntheticGestures?: boolean;
}

export interface SoundState {
  /** User preference (persisted). */
  enabled: boolean;
  theme: SoundTheme;
  volume: number;
  reduced: boolean;
  /** App-level switch. */
  allowed: boolean;
  /** True after the first user gesture. */
  unlocked: boolean;
  /** Web Audio is available. */
  supported: boolean;
}

export interface SoundEngine {
  /** Play a sound; returns true when it was scheduled. Dropped silently when sound is off, locked, hidden or throttled. */
  play(name: UiSoundName, options?: { volume?: number }): boolean;
  setEnabled(enabled: boolean, options?: { persist?: boolean; preview?: boolean }): void;
  /** Enabled by the user and allowed by the app. */
  isEnabled(): boolean;
  toggle(): void;
  setVolume(volume: number, options?: { persist?: boolean }): void;
  getVolume(): number;
  setTheme(theme: SoundTheme, options?: { persist?: boolean }): void;
  getTheme(): SoundTheme;
  setReduced(reduced: boolean, options?: { persist?: boolean }): void;
  isReduced(): boolean;
  /** App-level switch (not persisted). */
  setAllowed(allowed: boolean): void;
  isUnlocked(): boolean;
  /** Mark audio as unlocked; call it from inside a user gesture handler. */
  unlock(): void;
  canPlay(name: UiSoundName): boolean;
  blockedReason(name: UiSoundName): SoundBlockedReason | null;
  getState(): SoundState;
  subscribe(listener: (state: SoundState) => void): () => void;
  /** Remove listeners and close the AudioContext. */
  destroy(): void;
}

/** Create a UI sound engine. OFF by default; never plays before a user gesture. */
export declare function createSoundEngine(options?: SoundEngineOptions): SoundEngine;

/** Ask any listening engine to play a sound. No-op without an engine, during SSR or when sound is off. */
export declare function emitUiSound(name: UiSoundName, detail?: { volume?: number }): void;

/** Window event that asks listening engines to adopt new preferences (dispatched by setSoundPrefs). */
export declare const SOUND_PREFS_EVENT: 'pl:sound-prefs';
/** Window event a listening engine dispatches after its state changed (detail: SoundState). */
export declare const SOUND_CHANGE_EVENT: 'pl:sound-change';

/** The user-facing sound preferences. */
export interface SoundPrefs {
  enabled: boolean;
  theme: SoundTheme;
  volume: number;
  reduced: boolean;
}
/** True when a listening sound engine exists on the page. */
export declare function hasSoundEngine(): boolean;
/** Current preferences: from a live engine, otherwise from storage. */
export declare function getSoundPrefs(storageKey?: string): SoundPrefs;
/** Save preferences and tell every listening engine (for settings UIs that do not own the engine). */
export declare function setSoundPrefs(patch: Partial<SoundPrefs>, storageKey?: string): SoundPrefs;

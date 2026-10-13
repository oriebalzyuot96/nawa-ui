// Pelagic UI sound — a tiny, framework-agnostic UI sound engine on the Web Audio API.
//
// Every sound is synthesized (oscillators + filtered noise); no audio files are loaded.
// Rules the engine enforces:
//   • OFF by default. Apps opt in (`enabled: true`) and users can opt in/out (persisted).
//   • Never plays before a user gesture: it unlocks on the first pointerdown / keydown / touchstart.
//   • Silent while the document is hidden, when <html data-sound="off">, or when the app disallows it.
//   • "Reduced" mode (user preference or <html data-sound="reduced">) keeps only the status sounds, quieter.
//   • Sound is an enhancement only: components keep their visual state and live-region announcements.
//
// Components never import the engine: they call `emitUiSound(name)`, which dispatches a window event
// that any engine created with `listen: true` (the default) plays.

/** Every built-in sound. */
export const UI_SOUNDS = Object.freeze([
  'click',
  'toggle-on',
  'toggle-off',
  'select',
  'success',
  'error',
  'warning',
  'info',
  'notification',
  'delete',
  'send',
  'pop',
  'swipe',
  'open',
  'close',
  'drag-start',
  'drop',
  'typing',
]);

/** Sound themes: same vocabulary, different timbre. */
export const SOUND_THEMES = Object.freeze(['soft', 'crisp', 'playful', 'minimal']);

/** Window event used by `emitUiSound`. */
export const UI_SOUND_EVENT = 'pl:ui-sound';

/** localStorage key holding the user's sound preferences. */
export const SOUND_STORAGE_KEY = 'pl-sound';

/** Sounds kept in reduced mode: they confirm an outcome rather than decorate an interaction. */
const ESSENTIAL = new Set(['success', 'error', 'warning', 'info', 'notification']);

const isSoundName = (v) => typeof v === 'string' && UI_SOUNDS.includes(v);
const isTheme = (v) => typeof v === 'string' && SOUND_THEMES.includes(v);
const clamp01 = (v) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
const hasWindow = () => typeof window !== 'undefined';
const hasDocument = () => typeof document !== 'undefined';

/**
 * Ask any listening sound engine to play `name`. Safe to call anywhere (SSR, no engine, sound off).
 * @param {string} name
 * @param {{ volume?: number }} [detail]
 */
export function emitUiSound(name, detail) {
  if (!hasWindow() || !isSoundName(name) || typeof window.dispatchEvent !== 'function') return;
  try {
    window.dispatchEvent(new CustomEvent(UI_SOUND_EVENT, { detail: { ...detail, name } }));
  } catch {
    /* CustomEvent unavailable — sound is optional */
  }
}

/* ---------------------------------------------------------------------------
 * Themes: timbre parameters applied to every recipe.
 * ------------------------------------------------------------------------ */
const THEMES = {
  // Rounded sines, a little longer, warm low-pass and a hint of room.
  soft: { wave: 'sine', pitch: 1, length: 1.1, gain: 1, glide: 1, cutoff: 3400, room: 0.16, noise: 0.8, body: 0.35 },
  // Brighter triangles, shorter and higher, almost dry.
  crisp: { wave: 'triangle', pitch: 1.22, length: 0.72, gain: 0.85, glide: 0.8, cutoff: 7600, room: 0.04, noise: 1, body: 0.15 },
  // Wider pitch glides with a bouncy overshoot and an octave sparkle.
  playful: { wave: 'sine', pitch: 1.12, length: 1.15, gain: 1, glide: 1.6, cutoff: 5200, room: 0.2, noise: 0.7, body: 0.3, sparkle: true },
  // One voice per sound, short and quiet: barely-there confirmation.
  minimal: { wave: 'sine', pitch: 1, length: 0.6, gain: 0.6, glide: 0.6, cutoff: 3000, room: 0, noise: 0.5, body: 0, single: true },
};

/* ---------------------------------------------------------------------------
 * Recipes: arrays of voices. Tone voice: { at, f0, f1, d, g, wave? }.
 * Noise voice: { noise: true, at, d, g, band0, band1, q? }. Times in seconds.
 * ------------------------------------------------------------------------ */
const RECIPES = {
  click: [{ at: 0, f0: 1250, f1: 820, d: 0.045, g: 0.05 }],
  'toggle-on': [
    { at: 0, f0: 620, f1: 880, d: 0.07, g: 0.05 },
    { at: 0.055, f0: 880, f1: 1180, d: 0.08, g: 0.04 },
  ],
  'toggle-off': [
    { at: 0, f0: 1100, f1: 820, d: 0.07, g: 0.045 },
    { at: 0.055, f0: 820, f1: 600, d: 0.08, g: 0.035 },
  ],
  select: [{ at: 0, f0: 900, f1: 1180, d: 0.07, g: 0.05 }],
  success: [
    { at: 0, f0: 523.25, f1: 525, d: 0.2, g: 0.055 },
    { at: 0.08, f0: 659.25, f1: 661, d: 0.22, g: 0.05 },
    { at: 0.16, f0: 783.99, f1: 786, d: 0.32, g: 0.05 },
  ],
  error: [
    { at: 0, f0: 230, f1: 175, d: 0.14, g: 0.085, wave: 'triangle' },
    { at: 0.15, f0: 200, f1: 150, d: 0.2, g: 0.075, wave: 'triangle' },
  ],
  warning: [
    { at: 0, f0: 587.33, f1: 587.33, d: 0.12, g: 0.055, wave: 'triangle' },
    { at: 0.16, f0: 587.33, f1: 560, d: 0.16, g: 0.05, wave: 'triangle' },
  ],
  info: [
    { at: 0, f0: 783.99, f1: 784, d: 0.14, g: 0.045 },
    { at: 0.1, f0: 987.77, f1: 988, d: 0.2, g: 0.04 },
  ],
  notification: [
    { at: 0, f0: 1046.5, f1: 1046.5, d: 0.28, g: 0.045 },
    { at: 0, f0: 2093, f1: 2093, d: 0.16, g: 0.012 },
    { at: 0.12, f0: 1318.51, f1: 1318.51, d: 0.36, g: 0.04 },
  ],
  delete: [
    { noise: true, at: 0, d: 0.16, g: 0.07, band0: 2400, band1: 500, q: 0.9 },
    { at: 0.02, f0: 360, f1: 180, d: 0.16, g: 0.06, wave: 'triangle' },
  ],
  send: [
    { noise: true, at: 0, d: 0.22, g: 0.06, band0: 500, band1: 2800, q: 1.1 },
    { at: 0.04, f0: 620, f1: 1240, d: 0.14, g: 0.04 },
  ],
  pop: [{ at: 0, f0: 460, f1: 820, d: 0.11, g: 0.065 }],
  swipe: [{ noise: true, at: 0, d: 0.22, g: 0.07, band0: 2200, band1: 600, q: 1 }],
  open: [
    { at: 0, f0: 380, f1: 720, d: 0.16, g: 0.045 },
    { noise: true, at: 0, d: 0.18, g: 0.025, band0: 600, band1: 1800, q: 0.8 },
  ],
  close: [
    { at: 0, f0: 720, f1: 380, d: 0.14, g: 0.04 },
    { noise: true, at: 0, d: 0.15, g: 0.02, band0: 1800, band1: 600, q: 0.8 },
  ],
  'drag-start': [{ at: 0, f0: 520, f1: 640, d: 0.06, g: 0.045 }],
  drop: [{ at: 0, f0: 660, f1: 420, d: 0.09, g: 0.06 }],
  typing: [{ noise: true, at: 0, d: 0.022, g: 0.035, band0: 3600, band1: 3000, q: 2 }],
};

/** Sounds with a little random pitch/gain spread, so repeats do not sound mechanical. */
const VARIED = new Set(['click', 'typing', 'pop', 'select', 'drag-start', 'drop']);
/** Minimum gap between repeats of the same sound (ms). */
const REPEAT_GAP = { typing: 28, click: 40 };
const DEFAULT_GAP = 70;
const MASTER = 0.9;

/* ---------------------------------------------------------------------------
 * Storage (every access guarded: private mode, sandboxed iframes and quota errors throw)
 * ------------------------------------------------------------------------ */
function readPrefs(key) {
  try {
    if (!key || typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}
function writePrefs(key, prefs) {
  try {
    if (key && typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function defaultContextFactory() {
  if (!hasWindow()) return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  return Ctor ? new Ctor({ latencyHint: 'interactive' }) : null;
}

/**
 * Create a sound engine.
 * @param {import('./sound').SoundEngineOptions} [options]
 * @returns {import('./sound').SoundEngine}
 */
export function createSoundEngine(options = {}) {
  const storageKey = options.persist === false ? null : options.storageKey ?? SOUND_STORAGE_KEY;
  const stored = readPrefs(storageKey) ?? {};
  const state = {
    enabled: typeof stored.enabled === 'boolean' ? stored.enabled : Boolean(options.enabled),
    theme: isTheme(stored.theme) ? stored.theme : isTheme(options.theme) ? options.theme : 'soft',
    volume: typeof stored.volume === 'number' ? clamp01(stored.volume) : clamp01(options.volume ?? 0.6),
    reduced: typeof stored.reduced === 'boolean' ? stored.reduced : Boolean(options.reduced),
    allowed: options.allowed !== false,
    unlocked: false,
  };
  const createContext = options.createContext ?? defaultContextFactory;
  const listeners = new Set();
  const lastPlayed = new Map();
  let ctx = null;
  let out = null;
  let lowpass = null;
  let room = null;
  let noiseBuffer = null;
  let destroyed = false;
  const cleanups = [];

  const snapshot = () => ({
    enabled: state.enabled,
    theme: state.theme,
    volume: state.volume,
    reduced: state.reduced,
    allowed: state.allowed,
    unlocked: state.unlocked,
    supported: isSupported(),
  });
  let current = snapshot();
  const notify = () => {
    current = snapshot();
    listeners.forEach((l) => l(current));
  };
  const persist = () => writePrefs(storageKey, { enabled: state.enabled, theme: state.theme, volume: state.volume, reduced: state.reduced });

  function isSupported() {
    if (options.createContext) return true;
    return hasWindow() && Boolean(window.AudioContext || window.webkitAudioContext);
  }

  /* ---- gesture unlock + visibility ---- */
  // A page that already had a user gesture (sticky activation) may create audio right away.
  try {
    if (hasWindow() && window.navigator?.userActivation?.hasBeenActive) state.unlocked = true;
  } catch {
    /* ignore */
  }
  if (hasWindow() && !state.unlocked) {
    const events = ['pointerdown', 'keydown', 'touchstart'];
    const onGesture = (e) => {
      if (e && e.isTrusted === false && !options.allowSyntheticGestures) return;
      unlock();
    };
    events.forEach((t) => window.addEventListener(t, onGesture, { capture: true, passive: true }));
    cleanups.push(() => events.forEach((t) => window.removeEventListener(t, onGesture, { capture: true })));
  }
  if (hasDocument()) {
    const onVisibility = () => {
      if (!ctx) return;
      try {
        if (document.visibilityState === 'hidden') void ctx.suspend?.();
        else if (state.unlocked) void ctx.resume?.();
      } catch {
        /* ignore */
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));
  }
  if (hasWindow() && options.listen !== false) {
    const onEmit = (e) => {
      const d = e?.detail;
      if (d && isSoundName(d.name)) play(d.name, { volume: d.volume });
    };
    window.addEventListener(UI_SOUND_EVENT, onEmit);
    cleanups.push(() => window.removeEventListener(UI_SOUND_EVENT, onEmit));
  }

  function unlock() {
    if (destroyed) return;
    if (!state.unlocked) {
      state.unlocked = true;
      notify();
    }
    // Resume inside the gesture when a context already exists (Safari needs this).
    if (ctx && ctx.state === 'suspended') {
      try {
        void ctx.resume?.();
      } catch {
        /* ignore */
      }
    }
  }

  /* ---- audio graph ---- */
  function audio() {
    if (ctx) return ctx;
    ctx = createContext();
    if (!ctx) return null;
    const master = ctx.createGain();
    master.gain.value = state.volume * MASTER;
    lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = THEMES[state.theme].cutoff;
    lowpass.Q.value = 0.5;
    let tail = lowpass;
    if (typeof ctx.createDynamicsCompressor === 'function') {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 3;
      lowpass.connect(comp);
      tail = comp;
    }
    tail.connect(master);
    master.connect(ctx.destination);
    out = { master, input: lowpass };
    // Small feedback-delay "room".
    const send = ctx.createGain();
    send.gain.value = THEMES[state.theme].room;
    const delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.085;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    send.connect(delay);
    delay.connect(tone);
    tone.connect(feedback);
    feedback.connect(delay);
    tone.connect(lowpass);
    room = send;
    return ctx;
  }

  function noise(c) {
    if (noiseBuffer) return noiseBuffer;
    const len = Math.floor(c.sampleRate * 0.4);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffer = buf;
    return buf;
  }

  function envelope(c, at, d, g) {
    const gain = c.createGain();
    const peak = at + Math.min(0.012, d / 3);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(g, peak);
    gain.gain.exponentialRampToValueAtTime?.(Math.max(0.0001, g * 0.02), at + d);
    gain.gain.linearRampToValueAtTime(0, at + d + 0.01);
    gain.connect(out.input);
    if (room && THEMES[state.theme].room > 0) gain.connect(room);
    return gain;
  }

  function renderTone(c, v, t, at, vary) {
    const d = v.d * t.length;
    const g = v.g * t.gain * vary.gain;
    const f0 = v.f0 * t.pitch * vary.pitch;
    // Glide: exaggerate (playful) or flatten (minimal) the pitch movement.
    const f1 = f0 * Math.pow(v.f1 / v.f0, t.glide);
    const gain = envelope(c, at, d, g);
    const voices = [[v.wave ?? t.wave, 1, 1]];
    if (t.body > 0) voices.push(['sine', 0.5, t.body]);
    if (t.sparkle) voices.push(['sine', 2, 0.18]);
    for (const [wave, ratio, level] of voices) {
      const osc = c.createOscillator();
      const vg = c.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(Math.max(1, f0 * ratio), at);
      if (t.sparkle) {
        // Overshoot then settle: the "bounce" of the playful theme.
        osc.frequency.linearRampToValueAtTime(Math.max(1, f1 * ratio * 1.06), at + d * 0.6);
        osc.frequency.linearRampToValueAtTime(Math.max(1, f1 * ratio), at + d);
      } else {
        osc.frequency.linearRampToValueAtTime(Math.max(1, f1 * ratio), at + d);
      }
      vg.gain.value = level;
      osc.connect(vg);
      vg.connect(gain);
      osc.start(at);
      osc.stop(at + d + 0.03);
    }
  }

  function renderNoise(c, v, t, at, vary) {
    const d = v.d * t.length;
    const src = c.createBufferSource();
    src.buffer = noise(c);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = v.q ?? 1;
    filter.frequency.setValueAtTime(v.band0 * vary.pitch, at);
    filter.frequency.linearRampToValueAtTime(v.band1 * vary.pitch, at + d);
    const gain = envelope(c, at, d, v.g * t.gain * t.noise * vary.gain);
    src.connect(filter);
    filter.connect(gain);
    src.start(at, Math.random() * 0.2);
    src.stop(at + d + 0.02);
  }

  function render(c, name, gainScale) {
    const t = THEMES[state.theme];
    let recipe = RECIPES[name];
    if (t.single) recipe = recipe.slice(0, name === 'success' || name === 'error' ? 2 : 1);
    const vary = VARIED.has(name)
      ? { pitch: 1 + (Math.random() - 0.5) * 0.06, gain: (0.85 + Math.random() * 0.15) * gainScale }
      : { pitch: 1, gain: gainScale };
    const now = c.currentTime + 0.005;
    for (const v of recipe) {
      if (v.noise) renderNoise(c, v, t, now + v.at, vary);
      else renderTone(c, v, t, now + v.at, vary);
    }
  }

  function documentPreference() {
    if (!hasDocument()) return null;
    const v = document.documentElement?.getAttribute?.('data-sound');
    return v === 'off' || v === 'reduced' ? v : null;
  }

  /** Why a sound would not play right now, or null when it would. */
  function blockedReason(name) {
    if (destroyed) return 'destroyed';
    if (!isSoundName(name)) return 'unknown';
    if (!state.allowed) return 'app-disabled';
    if (!state.enabled) return 'disabled';
    if (state.volume <= 0) return 'muted';
    const docPref = documentPreference();
    if (docPref === 'off') return 'muted';
    if ((state.reduced || docPref === 'reduced') && !ESSENTIAL.has(name)) return 'reduced';
    if (!state.unlocked) return 'locked';
    if (hasDocument() && document.visibilityState === 'hidden') return 'hidden';
    return null;
  }

  /**
   * Play a sound. Returns true when it was scheduled.
   * @param {string} name
   * @param {{ volume?: number }} [opts]
   */
  function play(name, opts) {
    if (blockedReason(name)) return false;
    const now = Date.now();
    const gap = REPEAT_GAP[name] ?? DEFAULT_GAP;
    const last = lastPlayed.get(name);
    if (last !== undefined && now - last < gap) return false;
    try {
      const c = audio();
      if (!c) return false;
      lastPlayed.set(name, now);
      const reduced = state.reduced || documentPreference() === 'reduced';
      const scale = clamp01(opts?.volume ?? 1) * (reduced ? 0.6 : 1);
      if (c.state === 'suspended' && typeof c.resume === 'function') {
        const p = c.resume();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (!blockedReason(name)) render(c, name, scale);
          }).catch(() => {});
          return true;
        }
      }
      render(c, name, scale);
      return true;
    } catch {
      return false;
    }
  }

  function setEnabled(on, opts) {
    const next = Boolean(on);
    if (state.enabled === next) return;
    state.enabled = next;
    if (opts?.persist !== false) persist();
    notify();
    // Audible confirmation when turning sound on (only plays after a gesture).
    if (next && opts?.preview !== false) play('toggle-on');
  }
  function setVolume(v, opts) {
    state.volume = clamp01(v);
    if (out) {
      const param = out.master.gain;
      try {
        if (typeof param.setTargetAtTime === 'function') param.setTargetAtTime(state.volume * MASTER, ctx.currentTime, 0.02);
        else param.value = state.volume * MASTER;
      } catch {
        param.value = state.volume * MASTER;
      }
    }
    if (opts?.persist !== false) persist();
    notify();
  }
  function setTheme(theme, opts) {
    if (!isTheme(theme)) return;
    state.theme = theme;
    if (lowpass) lowpass.frequency.value = THEMES[theme].cutoff;
    if (room) room.gain.value = THEMES[theme].room;
    if (opts?.persist !== false) persist();
    notify();
  }
  function setReduced(on, opts) {
    state.reduced = Boolean(on);
    if (opts?.persist !== false) persist();
    notify();
  }
  function setAllowed(on) {
    state.allowed = Boolean(on);
    notify();
  }

  return {
    play,
    setEnabled,
    isEnabled: () => state.enabled && state.allowed,
    toggle: () => setEnabled(!state.enabled),
    setVolume,
    getVolume: () => state.volume,
    setTheme,
    getTheme: () => state.theme,
    setReduced,
    isReduced: () => state.reduced,
    setAllowed,
    isUnlocked: () => state.unlocked,
    unlock,
    canPlay: (name) => blockedReason(name) === null,
    blockedReason,
    getState: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      destroyed = true;
      cleanups.splice(0).forEach((fn) => fn());
      listeners.clear();
      try {
        void ctx?.close?.();
      } catch {
        /* ignore */
      }
      ctx = null;
    },
  };
}

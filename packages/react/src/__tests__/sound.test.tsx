import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SOUND_THEMES,
  LoaderOverlay,
  SoundProvider,
  SwalHost,
  Toaster,
  UI_SOUNDS,
  createSoundEngine,
  emitUiSound,
  swal,
  toast,
  useSound,
  type SoundEngine,
} from '../index';

/* ---------- A minimal fake Web Audio graph that records started oscillators/sources ---------- */
function param(value = 0) {
  return {
    value,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  };
}
function node(extra: Record<string, unknown> = {}) {
  return { connect: vi.fn((n: unknown) => n), disconnect: vi.fn(), ...extra };
}
function createFakeContext() {
  const started: string[] = [];
  const ctx = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    sampleRate: 8000,
    destination: node(),
    createGain: () => node({ gain: param(1) }),
    createBiquadFilter: () => node({ type: 'lowpass', frequency: param(), Q: param() }),
    createDynamicsCompressor: () => node({ threshold: param(), knee: param(), ratio: param() }),
    createDelay: () => node({ delayTime: param() }),
    createOscillator: () =>
      node({
        type: 'sine',
        frequency: param(),
        start: vi.fn(() => started.push('osc')),
        stop: vi.fn(),
      }),
    createBufferSource: () => node({ buffer: null, start: vi.fn(() => started.push('noise')), stop: vi.fn() }),
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };
  return { ctx, started };
}

const gesture = () => window.dispatchEvent(new Event('pointerdown'));

let engines: SoundEngine[] = [];
function make(opts: Parameters<typeof createSoundEngine>[0] = {}) {
  const fake = createFakeContext();
  const factory = vi.fn(() => fake.ctx as unknown as AudioContext);
  const engine = createSoundEngine({ allowSyntheticGestures: true, createContext: factory, ...opts });
  engines.push(engine);
  return { engine, factory, ...fake };
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  engines.forEach((e) => e.destroy());
  engines = [];
  vi.restoreAllMocks();
  act(() => {
    while (swal.isOpen()) swal.close();
    toast.remove();
  });
});

describe('sound engine', () => {
  it('ships the full vocabulary and four themes', () => {
    expect(UI_SOUNDS).toEqual(
      expect.arrayContaining(['click', 'toggle-on', 'toggle-off', 'select', 'success', 'error', 'warning', 'info', 'notification', 'delete', 'send', 'pop', 'swipe', 'open', 'close', 'drag-start', 'drop', 'typing']),
    );
    expect(SOUND_THEMES).toEqual(['soft', 'crisp', 'playful', 'minimal']);
  });

  it('is off by default and never touches audio while off', () => {
    const { engine, factory } = make();
    gesture();
    expect(engine.isEnabled()).toBe(false);
    expect(engine.play('click')).toBe(false);
    expect(engine.blockedReason('click')).toBe('disabled');
    expect(factory).not.toHaveBeenCalled();
  });

  it('does not play before a user gesture, then plays after one', () => {
    const { engine, factory, started } = make({ enabled: true });
    expect(engine.isUnlocked()).toBe(false);
    expect(engine.play('success')).toBe(false);
    expect(engine.blockedReason('success')).toBe('locked');
    expect(factory).not.toHaveBeenCalled();
    gesture();
    expect(engine.isUnlocked()).toBe(true);
    expect(engine.play('success')).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(started.length).toBeGreaterThan(0);
  });

  it('ignores untrusted events unless allowed', () => {
    const fake = createFakeContext();
    const engine = createSoundEngine({ enabled: true, createContext: () => fake.ctx as unknown as AudioContext });
    engines.push(engine);
    gesture(); // synthetic: isTrusted === false in jsdom
    expect(engine.isUnlocked()).toBe(false);
    engine.unlock();
    expect(engine.play('pop')).toBe(true);
  });

  it('renders every sound in every theme', () => {
    for (const theme of SOUND_THEMES) {
      const { engine, started } = make({ enabled: true, theme, persist: false });
      gesture();
      for (const name of UI_SOUNDS) expect(engine.play(name)).toBe(true);
      expect(started.length).toBeGreaterThanOrEqual(UI_SOUNDS.length);
      engine.destroy();
    }
  });

  it('throttles rapid repeats of the same sound', () => {
    const { engine } = make({ enabled: true });
    gesture();
    expect(engine.play('click')).toBe(true);
    expect(engine.play('click')).toBe(false);
    expect(engine.play('pop')).toBe(true);
  });

  it('stays silent while the document is hidden', () => {
    const { engine } = make({ enabled: true });
    gesture();
    const spy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    expect(engine.play('success')).toBe(false);
    expect(engine.blockedReason('success')).toBe('hidden');
    spy.mockRestore();
    expect(engine.play('success')).toBe(true);
  });

  it('honours the app switch, volume 0, reduced mode and <html data-sound>', () => {
    const { engine } = make({ enabled: true });
    gesture();
    engine.setAllowed(false);
    expect(engine.isEnabled()).toBe(false);
    expect(engine.blockedReason('success')).toBe('app-disabled');
    engine.setAllowed(true);

    engine.setVolume(0);
    expect(engine.blockedReason('success')).toBe('muted');
    engine.setVolume(0.5);

    engine.setReduced(true);
    expect(engine.blockedReason('click')).toBe('reduced');
    expect(engine.blockedReason('error')).toBeNull();
    engine.setReduced(false);

    document.documentElement.setAttribute('data-sound', 'off');
    expect(engine.blockedReason('success')).toBe('muted');
    document.documentElement.setAttribute('data-sound', 'reduced');
    expect(engine.blockedReason('typing')).toBe('reduced');
    document.documentElement.removeAttribute('data-sound');
    expect(engine.canPlay('typing')).toBe(true);
  });

  it('persists user preferences and restores them over app defaults', () => {
    const { engine } = make();
    engine.setEnabled(true);
    engine.setTheme('crisp');
    engine.setVolume(0.3);
    expect(JSON.parse(localStorage.getItem('pl-sound')!)).toMatchObject({ enabled: true, theme: 'crisp', volume: 0.3 });
    const { engine: next } = make({ enabled: false, theme: 'playful', volume: 1 });
    expect(next.getState()).toMatchObject({ enabled: true, theme: 'crisp', volume: 0.3 });
  });

  it('keeps working when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { engine } = make({ enabled: true, theme: 'minimal' });
    expect(engine.getState()).toMatchObject({ enabled: true, theme: 'minimal' });
    expect(() => engine.setEnabled(false)).not.toThrow();
    expect(() => engine.setTheme('soft')).not.toThrow();
    expect(engine.isEnabled()).toBe(false);
  });

  it('can opt out of persistence', () => {
    const { engine } = make({ persist: false });
    engine.setEnabled(true);
    expect(localStorage.getItem('pl-sound')).toBeNull();
  });

  it('emitUiSound dispatches a window event and ignores unknown names', () => {
    const spy = vi.fn();
    window.addEventListener('pl:ui-sound', spy);
    emitUiSound('success');
    emitUiSound('nope' as never);
    window.removeEventListener('pl:ui-sound', spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect((spy.mock.calls[0][0] as CustomEvent).detail).toEqual({ name: 'success' });
  });

  it('routes emitted sounds into the audio graph', () => {
    const { started } = make({ enabled: true });
    gesture();
    emitUiSound('notification');
    expect(started.length).toBeGreaterThan(0);
  });

  it('stops listening after destroy', () => {
    const { engine, started } = make({ enabled: true });
    gesture();
    engine.destroy();
    emitUiSound('success');
    expect(started).toHaveLength(0);
    expect(engine.play('success')).toBe(false);
  });
});

/* ---------- React ---------- */
function Controls() {
  const s = useSound();
  return (
    <div>
      <p data-testid="state">{`${s.available}|${s.enabled}|${s.theme}|${s.volume}`}</p>
      <button type="button" onClick={() => s.toggle()}>
        toggle
      </button>
      <button type="button" onClick={() => s.setTheme('playful')}>
        playful
      </button>
    </div>
  );
}

describe('SoundProvider / useSound', () => {
  it('exposes state and controls, off by default', () => {
    const fake = createFakeContext();
    render(
      <SoundProvider createContext={() => fake.ctx as unknown as AudioContext}>
        <Controls />
      </SoundProvider>,
    );
    expect(screen.getByTestId('state')).toHaveTextContent('true|false|soft|0.6');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('state')).toHaveTextContent('true|true|soft');
    fireEvent.click(screen.getByText('playful'));
    expect(screen.getByTestId('state')).toHaveTextContent('true|true|playful');
    expect(JSON.parse(localStorage.getItem('pl-sound')!)).toMatchObject({ enabled: true, theme: 'playful' });
  });

  it('works without a provider (no-op controls)', () => {
    render(<Controls />);
    expect(screen.getByTestId('state')).toHaveTextContent('false|false|soft|0');
    expect(() => fireEvent.click(screen.getByText('toggle'))).not.toThrow();
  });

  it('feedback components request sounds; the provider plays them only when enabled and unlocked', () => {
    const { engine, started } = make({ persist: false });
    const heard: string[] = [];
    const listener = (e: Event) => heard.push((e as CustomEvent).detail.name);
    window.addEventListener('pl:ui-sound', listener);
    render(
      <SoundProvider engine={engine}>
        <SwalHost />
        <Toaster />
      </SoundProvider>,
    );
    act(() => {
      void swal.fire({ icon: 'error', title: 'Nope' });
    });
    act(() => {
      toast.success('Saved');
      toast.info('Heads up', { sound: false });
    });
    expect(heard).toEqual(['error', 'success']);
    expect(started).toHaveLength(0); // off by default: nothing reached the audio graph

    act(() => engine.setEnabled(true, { preview: false }));
    act(() => swal.close());
    expect(started).toHaveLength(0); // still locked: no gesture yet

    gesture();
    heard.length = 0;
    act(() => {
      void swal.fire({ title: 'Plain', showCancelButton: true });
    });
    expect(heard).toEqual(['open']);
    expect(started.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(heard).toEqual(['open', 'close']);

    act(() => {
      void swal.fire({ title: 'Silent', sound: false, showCancelButton: true });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(heard).toEqual(['open', 'close']);
    window.removeEventListener('pl:ui-sound', listener);
  });

  it('loaders request a sound when they finish, not on mount', () => {
    const heard: string[] = [];
    const listener = (e: Event) => heard.push((e as CustomEvent).detail.name);
    window.addEventListener('pl:ui-sound', listener);
    const { rerender } = render(<LoaderOverlay active={false}>x</LoaderOverlay>);
    expect(heard).toEqual([]);
    rerender(<LoaderOverlay active>x</LoaderOverlay>);
    rerender(<LoaderOverlay active={false}>x</LoaderOverlay>);
    expect(heard).toEqual(['pop']);
    rerender(<LoaderOverlay active doneSound={false}>x</LoaderOverlay>);
    rerender(<LoaderOverlay active={false} doneSound={false}>x</LoaderOverlay>);
    expect(heard).toEqual(['pop']);
    window.removeEventListener('pl:ui-sound', listener);
  });
});

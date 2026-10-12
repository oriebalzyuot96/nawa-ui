import { act, fireEvent, render, screen } from '@testing-library/react';
import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Chart3D, Globe3D, ModelViewer, ParticlesField, Scene3D, readThemeColors } from '../index';

// Fake renderer: no real WebGL in jsdom.
const renderers: FakeRenderer[] = [];
class FakeRenderer {
  domElement = document.createElement('canvas');
  render = vi.fn();
  setPixelRatio = vi.fn();
  setClearColor = vi.fn();
  setSize = vi.fn();
  dispose = vi.fn();
  forceContextLoss = vi.fn();
  constructor() {
    renderers.push(this);
  }
}
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return { ...actual, WebGLRenderer: vi.fn((...args: unknown[]) => new (FakeRenderer as unknown as new (...a: unknown[]) => FakeRenderer)(...args)) };
});

function mockWebGL(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
    available && type.startsWith('webgl') ? ({} as RenderingContext) : null) as HTMLCanvasElement['getContext']);
}

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query.includes('reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  );
}

beforeEach(() => {
  renderers.length = 0;
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-theme');
});

describe('WebGL unavailable', () => {
  beforeEach(() => mockWebGL(false));

  it('renders static fallbacks with accessible names', () => {
    render(
      <>
        <Scene3D label="Spinning logo" setup={() => {}} />
        <ModelViewer src="/chair.glb" alt="Oak chair with curved back" />
        <ParticlesField />
      </>,
    );
    expect(renderers).toHaveLength(0);
    expect(screen.getByRole('img', { name: 'Spinning logo' })).toHaveAttribute('data-status', 'fallback');
    expect(screen.getByText('Spinning logo')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Oak chair with curved back' })).toBeInTheDocument();
    expect(document.querySelector('.nw-three--bg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the Chart3D data table visibly', () => {
    render(<Chart3D title="Sales by region" data={[{ label: 'North', value: 1200 }, { label: 'South', value: 800 }]} />);
    const table = screen.getByRole('table', { name: 'Sales by region' });
    expect(table.parentElement).toHaveClass('nw-table-wrap');
    expect(screen.getByRole('rowheader', { name: 'North' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: (1200).toLocaleString() })).toBeInTheDocument();
    expect(screen.getByRole('figure')).toContainElement(screen.getByText('Sales by region', { selector: 'figcaption' }));
    expect(document.querySelector('.nw-three')).toHaveAttribute('hidden');
  });
});

describe('WebGL available (mocked renderer)', () => {
  beforeEach(() => mockWebGL(true));

  it('renders a single static frame under reduced motion and disposes on unmount', () => {
    mockMatchMedia(true);
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const tick = vi.fn();
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial();
    const gDispose = vi.spyOn(geometry, 'dispose');
    const mDispose = vi.spyOn(material, 'dispose');
    const cleanup = vi.fn();
    const setup = vi.fn(({ scene, renderer, reducedMotion }) => {
      expect(reducedMotion).toBe(true);
      expect(renderer.setPixelRatio).toHaveBeenCalledWith(expect.any(Number));
      scene.add(new Mesh(geometry, material));
      return { tick, cleanup };
    });
    const { unmount } = render(<Scene3D label="Cube" setup={setup} />);
    expect(setup).toHaveBeenCalledTimes(1);
    const r = renderers[0];
    expect(r.render).toHaveBeenCalledTimes(1);
    expect(tick).toHaveBeenCalledTimes(1);
    expect(tick).toHaveBeenCalledWith(0, 0);
    expect(raf).not.toHaveBeenCalled();
    expect(screen.getByRole('img', { name: 'Cube' })).toHaveAttribute('data-status', 'ready');
    unmount();
    expect(cleanup).toHaveBeenCalled();
    expect(gDispose).toHaveBeenCalled();
    expect(mDispose).toHaveBeenCalled();
    expect(r.dispose).toHaveBeenCalled();
    expect(r.domElement.isConnected).toBe(false);
  });

  it('caps the pixel ratio at 2 and starts the loop when motion is allowed', () => {
    mockMatchMedia(false);
    vi.stubGlobal('devicePixelRatio', 3);
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    render(<Scene3D label="Loop" setup={() => {}} />);
    expect(renderers[0].setPixelRatio).toHaveBeenCalledWith(2);
    expect(raf).toHaveBeenCalled();
  });

  it('supports keyboard orbit when interactive', () => {
    mockMatchMedia(true);
    let cam: { position: { x: number } } | undefined;
    render(<Scene3D label="Orbit" interactive setup={({ camera }) => void (cam = camera)} description="A teal cube." />);
    const img = screen.getByRole('img', { name: 'Orbit' });
    expect(img).toHaveAccessibleDescription(/A teal cube\. .*arrow keys/);
    const focusable = img.querySelector('[tabindex="0"]') as HTMLElement;
    expect(focusable).not.toBeNull();
    const before = cam!.position.x;
    fireEvent.keyDown(focusable, { key: 'ArrowRight' });
    expect(cam!.position.x).not.toBeCloseTo(before);
    expect(renderers[0].render).toHaveBeenCalledTimes(2);
  });

  it('re-reads theme colors when data-theme changes', async () => {
    mockMatchMedia(true);
    const onColors = vi.fn();
    render(<Scene3D label="Themed" setup={() => ({ onColors })} />);
    await act(async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      await Promise.resolve();
    });
    expect(onColors).toHaveBeenCalledTimes(1);
  });

  it('keeps the Chart3D table for screen readers and labels the canvas', () => {
    mockMatchMedia(true);
    render(<Chart3D title="Visitors" data={[{ label: 'Mon', value: 3 }]} />);
    expect(screen.getByRole('table', { name: 'Visitors' }).parentElement).toHaveClass('nw-sr-only');
    expect(screen.getByRole('img', { name: /Visitors: 3D bar chart/ })).toBeInTheDocument();
  });

  it('lists globe markers as a text alternative', () => {
    mockMatchMedia(true);
    render(<Globe3D markers={[{ label: 'Riyadh', lat: 24.7, lng: 46.7 }, { label: 'Lima', lat: -12, lng: -77 }]} />);
    expect(screen.getByRole('img', { name: 'Globe, 2 locations marked' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Locations' });
    expect(list).toHaveTextContent('Riyadh (24.7° N, 46.7° E)');
    expect(list).toHaveTextContent('Lima (12.0° S, 77.0° W)');
  });

  it('decorative fields are hidden from assistive technology', () => {
    mockMatchMedia(true);
    const { container } = render(<ParticlesField />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(renderers[0].render).toHaveBeenCalledTimes(1);
  });
});

describe('readThemeColors', () => {
  it('reads CSS custom properties with fallbacks', () => {
    const el = document.createElement('div');
    el.style.setProperty('--nw-primary', '#ff0000');
    document.body.appendChild(el);
    const colors = readThemeColors(el);
    expect(colors.primary.getHexString()).toBe('ff0000');
    expect(colors.text.getHexString()).toBe('14201f');
    el.remove();
  });
});

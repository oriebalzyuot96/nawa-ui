import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { disposeObject, isWebGLAvailable, prefersReducedMotion, readThemeColors } from '../core';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('style');
});

describe('prefersReducedMotion', () => {
  it('is false when matchMedia is missing (jsdom / SSR-like)', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('follows the (prefers-reduced-motion: reduce) query', () => {
    const query = vi.fn((q: string) => ({ matches: q === '(prefers-reduced-motion: reduce)' }));
    vi.stubGlobal('matchMedia', query);
    expect(prefersReducedMotion()).toBe(true);
    expect(query).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('isWebGLAvailable', () => {
  it('is false when no WebGL context can be created', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(isWebGLAvailable()).toBe(false);
  });

  it('accepts WebGL 1 when WebGL 2 is missing', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((id: string) => (id === 'webgl' ? {} : null)) as never);
    expect(isWebGLAvailable()).toBe(true);
  });

  it('never throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('GPU blocked');
    });
    expect(isWebGLAvailable()).toBe(false);
  });
});

describe('readThemeColors', () => {
  it('reads --pl-* custom properties and falls back for missing or invalid values', () => {
    // No 2D canvas in jsdom: non-hex values cannot be normalised and must fall back.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const root = document.documentElement;
    root.style.setProperty('--pl-primary', '#5b34d6');
    root.style.setProperty('--pl-danger', 'not-a-color');
    const colors = readThemeColors(root);
    expect(`#${colors.primary.getHexString()}`).toBe('#5b34d6');
    expect(`#${colors.danger.getHexString()}`).toBe('#b91c1c'); // fallback
    expect(`#${colors.surface.getHexString()}`).toBe('#ffffff');
    expect(Object.keys(colors).sort()).toEqual(
      ['border', 'danger', 'info', 'onPrimary', 'primary', 'primaryInk', 'success', 'surface', 'surfaceAlt', 'surfaceMuted', 'text', 'textMuted', 'warning'].sort(),
    );
  });
});

describe('disposeObject', () => {
  it('disposes geometries, materials (single and arrays) and their textures', () => {
    const texture = new Texture();
    const material = new MeshStandardMaterial({ map: texture });
    const extra = new MeshBasicMaterial();
    const geometry = new BoxGeometry();
    const childGeometry = new BoxGeometry();
    const root = new Group();
    const mesh = new Mesh(geometry, material);
    const multi = new Mesh(childGeometry, [extra, new MeshBasicMaterial()]);
    root.add(mesh);
    mesh.add(multi);
    const spies = [geometry, childGeometry, material, extra, texture].map((o) => vi.spyOn(o, 'dispose'));
    disposeObject(root);
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  });
});

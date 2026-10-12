import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CubeCarousel, FlipCard, Floating3DIcon, Perspective3DStack, Text3D, TiltCard } from '../components/effects-3d';

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FlipCard', () => {
  it('toggles with a pressed button and hides the inactive side from AT', async () => {
    render(<FlipCard front={<p>Front side</p>} back={<a href="#x">Back link</a>} />);
    const button = screen.getByRole('button', { name: 'Show back' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    const back = screen.getByText('Back link').closest('.nw-flip__face')!;
    const front = screen.getByText('Front side').closest('.nw-flip__face')!;
    expect(back).toHaveAttribute('aria-hidden', 'true');
    expect(back).toHaveAttribute('inert');
    expect(screen.queryByRole('link', { name: 'Back link' })).toBeNull();

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(back).not.toHaveAttribute('aria-hidden');
    expect(back).not.toHaveAttribute('inert');
    expect(front).toHaveAttribute('aria-hidden', 'true');
    expect(front).toHaveAttribute('inert');
    expect(screen.getByRole('link', { name: 'Back link' })).toBeInTheDocument();

    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('CubeCarousel', () => {
  const slides = [
    { title: 'One', content: 'First' },
    { title: 'Two', content: 'Second' },
    { content: 'Third' },
    { content: 'Fourth' },
  ];

  it('labels the carousel and slides and moves with buttons and arrow keys', async () => {
    render(<CubeCarousel label="Features" slides={slides} />);
    const region = screen.getByRole('region', { name: 'Features' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(screen.getByRole('group', { name: 'Slide 1 of 4: One' })).toHaveAttribute('aria-roledescription', 'slide');
    // Hidden slides are not exposed.
    expect(screen.queryByRole('group', { name: 'Slide 2 of 4: Two' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('group', { name: 'Slide 2 of 4: Two' })).toBeInTheDocument();

    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(screen.getByRole('group', { name: 'Slide 3 of 4' })).toBeInTheDocument();
    fireEvent.keyDown(region, { key: 'End' });
    expect(screen.getByRole('group', { name: 'Slide 4 of 4' })).toBeInTheDocument();
    fireEvent.keyDown(region, { key: 'ArrowRight' }); // wraps
    expect(screen.getByRole('group', { name: 'Slide 1 of 4: One' })).toBeInTheDocument();
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(screen.getByRole('group', { name: 'Slide 4 of 4' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /automatic slide show/ })).toBeNull();
  });

  it('reverses arrow keys in RTL', () => {
    render(
      <div dir="rtl">
        <CubeCarousel label="Features" slides={slides} />
      </div>,
    );
    fireEvent.keyDown(screen.getByRole('region', { name: 'Features' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('group', { name: 'Slide 2 of 4: Two' })).toBeInTheDocument();
  });

  it('offers a pause button when autoplay is on', async () => {
    render(<CubeCarousel label="Auto" slides={slides} autoplay={3000} />);
    const pause = screen.getByRole('button', { name: 'Stop automatic slide show' });
    await userEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Start automatic slide show' })).toBeInTheDocument();
  });
});

describe('TiltCard', () => {
  it('does not tilt under prefers-reduced-motion', () => {
    mockMatchMedia(true);
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const { container } = render(<TiltCard>Hi</TiltCard>);
    const root = container.querySelector('.nw-tilt') as HTMLElement;
    fireEvent.pointerMove(root, { clientX: 10, clientY: 10, pointerType: 'mouse' });
    expect(raf).not.toHaveBeenCalled();
    expect(root.style.getPropertyValue('--nw-tilt-x')).toBe('');
    expect(root).not.toHaveAttribute('data-active');
    raf.mockRestore();
  });

  it('tilts toward the pointer when motion is allowed', () => {
    mockMatchMedia(false);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    const { container } = render(<TiltCard maxTilt={10}>Hi</TiltCard>);
    const root = container.querySelector('.nw-tilt') as HTMLElement;
    root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON() {} }) as DOMRect;
    // jsdom's PointerEvent lacks coordinates; a MouseEvent typed "pointermove" carries them.
    root.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 100, clientY: 50 }));
    expect(root.style.getPropertyValue('--nw-tilt-y')).toBe('10.00deg');
    fireEvent.pointerLeave(root);
    expect(root.style.getPropertyValue('--nw-tilt-y')).toBe('');
    vi.restoreAllMocks();
  });
});

describe('decorative and list semantics', () => {
  it('keeps text real, icons hidden and stacks as lists', () => {
    render(
      <>
        <Text3D as="h1">Deep title</Text3D>
        <Floating3DIcon icon="★" />
        <Perspective3DStack label="Plans" items={['A', 'B', 'C']} />
      </>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Deep title' })).toBeInTheDocument();
    expect(screen.getByText('★').closest('.nw-float3d')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('list', { name: 'Plans' }).querySelectorAll('li')).toHaveLength(3);
  });
});

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  animate,
  animateLayout,
  AnimatedList,
  AnimatedTabs,
  AuroraBackground,
  BorderBeam,
  DotPattern,
  drawPath,
  GridPattern,
  Marquee,
  Meteors,
  MorphingText,
  Motion,
  NumberTicker,
  prefersReducedMotion,
  Presence,
  Reorder,
  ScrollProgressBar,
  scrollProgress,
  ShimmerButton,
  spring,
  springValue,
  stagger,
  TextReveal,
  timeline,
  tween,
  TypingText,
  useReducedMotion,
  useSpring,
} from '../index';
import { normalizeKeyframes } from '@orca-ui/core/motion';

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

beforeEach(() => mockMatchMedia(false));
afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-a11y-motion');
});

describe('core motion engine', () => {
  it('reads reduced motion from the OS setting and from <html data-a11y-motion="off">', () => {
    expect(prefersReducedMotion()).toBe(false);
    document.documentElement.setAttribute('data-a11y-motion', 'off');
    expect(prefersReducedMotion()).toBe(true);
    document.documentElement.removeAttribute('data-a11y-motion');
    mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('jumps to the end state under reduced motion', async () => {
    mockMatchMedia(true);
    const el = document.createElement('div');
    const done = vi.fn();
    const c = animate(el, { opacity: [0, 1], x: [0, 40] }, { duration: 5000, onComplete: done });
    await c.finished;
    expect(el.style.opacity).toBe('1');
    expect(el.style.transform).toContain('translate3d(40px, 0px, 0px)');
    expect(done).toHaveBeenCalledTimes(1);

    const values: number[] = [];
    await tween(0, 120, (v) => values.push(v), { duration: 5000 }).finished;
    expect(values).toEqual([120]);

    const seen: number[] = [];
    springValue(0, {}, (v) => seen.push(v)).set(50);
    expect(seen).toEqual([50]);
  });

  it('runs the requestAnimationFrame fallback to completion when WAAPI is missing', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    await animate(el, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] }, { duration: 30, easing: 'linear' }).finished;
    expect(el.style.opacity).toBe('1');
    expect(el.style.transform).toBe('translateY(0px)');
    el.remove();
  });

  it('builds springs, staggers, timelines and keyframes', () => {
    const s = spring({ stiffness: 200, damping: 20 });
    expect(s.duration).toBeGreaterThan(100);
    expect(s.easing(0)).toBe(0);
    expect(s.easing(1)).toBe(1);
    expect(s.css.startsWith('linear(')).toBe(true);
    // Under-damped springs overshoot.
    expect(Math.max(...Array.from({ length: 60 }, (_, i) => s.easing(i / 59)))).toBeGreaterThan(1);

    const center = stagger(50, { from: 'center' });
    expect([0, 1, 2, 3, 4].map((i) => center(i, 5))).toEqual([100, 50, 0, 50, 100]);

    const tl = timeline().add(null, { opacity: 1 }, { duration: 300 }).add(null, { opacity: 1 }, { duration: 200 }, '-=100').add(null, { opacity: 1 }, { duration: 100 }, '<+50');
    expect(tl.duration).toBe(400);

    expect(normalizeKeyframes(null, { x: [0, 10], opacity: [0, 1] })).toEqual([
      { opacity: '0', transform: 'translate3d(0px, 0px, 0px)' },
      { opacity: '1', transform: 'translate3d(10px, 0px, 0px)' },
    ]);
  });

  it('animates layout changes instantly under reduced motion and draws SVG paths', async () => {
    mockMatchMedia(true);
    const list = document.createElement('ul');
    list.innerHTML = '<li>a</li><li>b</li>';
    const mutate = vi.fn(() => list.prepend(list.lastElementChild!));
    await animateLayout(list, mutate).finished;
    expect(mutate).toHaveBeenCalled();
    expect(list.textContent).toBe('ba');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    await drawPath(path).finished;
    expect(path.getAttribute('pathLength')).toBe('1');
    expect(path.style.strokeDashoffset).toBe('0');
  });

  it('reports scroll progress of a scroll container', () => {
    const box = document.createElement('div');
    Object.defineProperty(box, 'scrollHeight', { value: 300 });
    Object.defineProperty(box, 'clientHeight', { value: 100 });
    box.scrollTop = 100;
    const cb = vi.fn();
    const stop = scrollProgress(box, cb, { within: true });
    expect(cb).toHaveBeenLastCalledWith(0.5);
    stop();
  });
});

function ReducedProbe() {
  return <span>{useReducedMotion() ? 'reduced' : 'full'}</span>;
}

describe('useReducedMotion / useSpring', () => {
  it('follows data-a11y-motion on <html>', async () => {
    render(<ReducedProbe />);
    expect(screen.getByText('full')).toBeInTheDocument();
    await act(async () => {
      document.documentElement.setAttribute('data-a11y-motion', 'off');
      await new Promise((r) => setTimeout(r, 0)); // MutationObserver callbacks are microtasks
    });
    expect(screen.getByText('reduced')).toBeInTheDocument();
  });

  it('jumps to the target under reduced motion', () => {
    mockMatchMedia(true);
    function S({ to }: { to: number }) {
      return <span data-testid="v">{useSpring(to)}</span>;
    }
    const { rerender } = render(<S to={0} />);
    rerender(<S to={80} />);
    expect(screen.getByTestId('v')).toHaveTextContent('80');
  });
});

describe('Motion & Presence', () => {
  it('renders the end state directly under reduced motion', () => {
    mockMatchMedia(true);
    render(
      <Motion data-testid="m" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        Hello
      </Motion>,
    );
    expect(screen.getByTestId('m').style.opacity).toBe('1');
  });

  it('starts from `initial` when motion is allowed', () => {
    render(
      <Motion as="section" data-testid="m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 10_000 }}>
        Hello
      </Motion>,
    );
    const el = screen.getByTestId('m');
    expect(el.tagName).toBe('SECTION');
    expect(el.style.opacity).toBe('0');
  });

  it('keeps an exiting child (aria-hidden, inert) until its exit finishes, then removes it', async () => {
    const onExitComplete = vi.fn();
    function Demo() {
      const [show, setShow] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setShow((s) => !s)}>
            toggle
          </button>
          <Presence onExitComplete={onExitComplete}>
            {show && (
              <Motion key="toast" data-testid="toast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 40 }}>
                Saved
              </Motion>
            )}
          </Presence>
        </>
      );
    }
    render(<Demo />);
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveAttribute('aria-hidden', 'true');
    expect(toast).toHaveAttribute('inert');
    await waitFor(() => expect(screen.queryByTestId('toast')).toBeNull());
    expect(onExitComplete).toHaveBeenCalledTimes(1);
  });

  it('removes children without an exit animation immediately and waits in mode="wait"', async () => {
    mockMatchMedia(true);
    function Demo({ k }: { k: string }) {
      return (
        <Presence mode="wait">
          <Motion key={k} data-testid={k} exit={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {k}
          </Motion>
        </Presence>
      );
    }
    const { rerender } = render(<Demo k="one" />);
    rerender(<Demo k="two" />);
    await waitFor(() => expect(screen.queryByTestId('one')).toBeNull());
    expect(screen.getByTestId('two')).toBeInTheDocument();

    function Plain({ show }: { show: boolean }) {
      return <Presence>{show && <p key="p">plain</p>}</Presence>;
    }
    const plain = render(<Plain show />);
    plain.rerender(<Plain show={false} />);
    await waitFor(() => expect(screen.queryByText('plain')).toBeNull());
  });
});

describe('Reorder', () => {
  const fruit = [
    { id: 'a', name: 'Apple' },
    { id: 'b', name: 'Banana' },
    { id: 'c', name: 'Cherry' },
  ];
  function Demo() {
    const [items, setItems] = useState(fruit);
    return <Reorder label="Fruit" items={items} onReorder={setItems} getKey={(f) => f.id} getLabel={(f) => f.name} />;
  }
  const order = () => within(screen.getByRole('list', { name: 'Fruit' })).getAllByRole('listitem').map((li) => li.textContent);
  const status = () => screen.getByRole('status');

  it('picks up, moves and drops with the keyboard and announces each step', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const handle = screen.getByRole('button', { name: 'Reorder Apple' });
    expect(handle).toHaveAccessibleDescription(/Press Space or Enter to pick up/);
    handle.focus();
    await user.keyboard(' ');
    expect(handle).toHaveAttribute('aria-pressed', 'true');
    expect(status()).toHaveTextContent('Apple grabbed. Current position 1 of 3.');
    await user.keyboard('{ArrowDown}');
    expect(order()).toEqual(['Banana', 'Apple', 'Cherry']);
    expect(status()).toHaveTextContent('Apple moved to position 2 of 3.');
    expect(screen.getByRole('button', { name: 'Reorder Apple' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(order()).toEqual(['Banana', 'Cherry', 'Apple']);
    await user.keyboard('{Enter}');
    expect(status()).toHaveTextContent('Apple dropped at position 3 of 3.');
    expect(screen.getByRole('button', { name: 'Reorder Apple' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('restores the original order on Escape and supports Alt+Arrow quick moves', async () => {
    const user = userEvent.setup();
    render(<Demo />);
    screen.getByRole('button', { name: 'Reorder Banana' }).focus();
    await user.keyboard(' {ArrowUp}');
    expect(order()).toEqual(['Banana', 'Apple', 'Cherry']);
    await user.keyboard('{Escape}');
    expect(order()).toEqual(['Apple', 'Banana', 'Cherry']);
    expect(status()).toHaveTextContent('Reorder cancelled. Banana returned to position 2 of 3.');
    expect(screen.getByRole('button', { name: 'Reorder Banana' })).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(order()).toEqual(['Apple', 'Cherry', 'Banana']);
  });

  it('mirrors horizontal arrows in RTL', async () => {
    const user = userEvent.setup();
    function Row() {
      const [items, setItems] = useState(fruit);
      return (
        <div dir="rtl">
          <Reorder axis="x" label="Fruit" items={items} onReorder={setItems} getKey={(f) => f.id} getLabel={(f) => f.name} />
        </div>
      );
    }
    render(<Row />);
    screen.getByRole('button', { name: 'Reorder Apple' }).focus();
    await user.keyboard(' {ArrowLeft}');
    expect(order()).toEqual(['Banana', 'Apple', 'Cherry']);
  });
});

describe('Marquee', () => {
  it('hides copies from assistive tech and has a pause button', async () => {
    const { container } = render(
      <Marquee label="Customers">
        <span>Acme</span>
        <span>Globex</span>
      </Marquee>,
    );
    const region = screen.getByRole('region', { name: 'Customers' });
    const groups = container.querySelectorAll('.oc-marquee__group');
    expect(groups).toHaveLength(2);
    expect(groups[1]).toHaveAttribute('aria-hidden', 'true');
    expect(groups[1]).toHaveAttribute('inert');
    expect(screen.getAllByText('Acme')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Pause scrolling' }));
    expect(region).toHaveAttribute('data-paused');
    expect(screen.getByRole('button', { name: 'Resume scrolling' })).toBeInTheDocument();
  });

  it('is a static, scrollable row under reduced motion', () => {
    mockMatchMedia(true);
    const { container } = render(
      <Marquee label="Customers">
        <span>Acme</span>
      </Marquee>,
    );
    expect(container.querySelectorAll('.oc-marquee__group')).toHaveLength(1);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('group', { name: 'Customers' })).toHaveAttribute('tabindex', '0');
  });
});

describe('Text & number effects', () => {
  it('NumberTicker exposes only the final value to screen readers', () => {
    mockMatchMedia(true);
    const { container } = render(<NumberTicker value={12500} locale="en-US" prefix="$" live />);
    expect(container.querySelector('.oc-ticker__visual')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.oc-ticker__num')).toHaveTextContent('12,500');
    expect(screen.getByRole('status')).toHaveTextContent('$12,500');
  });

  it('TextReveal reads the whole text once and splits Arabic by word', () => {
    const { container } = render(<TextReveal text="مرحبا بالعالم" by="char" />);
    expect(container.querySelector('.oc-sr-only')).toHaveTextContent('مرحبا بالعالم');
    expect(container.querySelectorAll('.oc-textreveal__token')).toHaveLength(2);
    expect(container.querySelector('.oc-textreveal__token')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('TypingText shows the full text under reduced motion and offers pause when looping', () => {
    mockMatchMedia(true);
    const { container, unmount } = render(<TypingText text="Accessible by default" />);
    expect(container.querySelector('.oc-typing__visual')).toHaveTextContent('Accessible by default');
    expect(container.querySelector('.oc-sr-only')).toHaveTextContent('Accessible by default');
    unmount();
    mockMatchMedia(false);
    render(<TypingText words={['fast', 'accessible']} loop />);
    expect(screen.getByRole('button', { name: 'Pause typing animation' })).toBeInTheDocument();
    expect(screen.getByText('fast, accessible')).toHaveClass('oc-sr-only');
  });

  it('MorphingText can be paused and is static under reduced motion', async () => {
    const { unmount } = render(<MorphingText texts={['Design', 'Build', 'Ship']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pause text animation' }));
    expect(screen.getByRole('button', { name: 'Resume text animation' })).toBeInTheDocument();
    unmount();
    mockMatchMedia(true);
    render(<MorphingText texts={['Design', 'Build']} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Decorative and interactive pieces', () => {
  it('marks decorative layers aria-hidden and drops meteors under reduced motion', () => {
    const { container, unmount } = render(
      <AuroraBackground>
        <h2>Ship faster</h2>
        <GridPattern squares={[[1, 1]]} />
        <DotPattern />
        <BorderBeam />
        <Meteors count={3} />
      </AuroraBackground>,
    );
    expect(container.querySelector('.oc-aurora__layer')).toHaveAttribute('aria-hidden', 'true');
    for (const sel of ['.oc-pattern--grid', '.oc-pattern--dots', '.oc-beam', '.oc-meteors']) {
      expect(container.querySelector(sel)).toHaveAttribute('aria-hidden', 'true');
    }
    expect(container.querySelectorAll('.oc-meteor')).toHaveLength(3);
    unmount();
    mockMatchMedia(true);
    const reduced = render(<Meteors count={3} />);
    expect(reduced.container.querySelector('.oc-meteors')).toBeNull();
  });

  it('ShimmerButton is a real button and ScrollProgressBar is decorative unless labelled', () => {
    render(
      <>
        <ShimmerButton>Get started</ShimmerButton>
        <ScrollProgressBar />
        <ScrollProgressBar label="Reading progress" position="static" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Get started' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('progressbar', { name: 'Reading progress' })).toHaveAttribute('aria-valuenow', '0');
    expect(document.querySelectorAll('.oc-scrollbar[aria-hidden="true"]')).toHaveLength(1);
  });

  it('AnimatedList announces new items', async () => {
    mockMatchMedia(true);
    function Feed() {
      const [items, setItems] = useState([{ id: '1', text: 'Build passed' }]);
      return (
        <>
          <button type="button" onClick={() => setItems((l) => [{ id: '2', text: 'Deployed' }, ...l])}>
            add
          </button>
          <AnimatedList label="Activity" items={items} getKey={(i) => i.id} renderItem={(i) => i.text} announce={(i) => `New: ${i.text}`} />
        </>
      );
    }
    render(<Feed />);
    await userEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(within(screen.getByRole('list', { name: 'Activity' })).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('New: Deployed');
  });
});

describe('AnimatedTabs', () => {
  const tabs = [
    { value: 'overview', label: 'Overview', content: <p>Overview panel</p> },
    { value: 'specs', label: 'Specs', content: <p>Specs panel</p> },
    { value: 'faq', label: 'FAQ', content: <p>FAQ panel</p>, disabled: true },
    { value: 'reviews', label: 'Reviews', content: <p>Reviews panel</p> },
  ];

  it('follows the APG tabs pattern with a decorative indicator', async () => {
    const onChange = vi.fn();
    const { container } = render(<AnimatedTabs label="Product" tabs={tabs} onChange={onChange} />);
    const list = screen.getByRole('tablist', { name: 'Product' });
    const first = screen.getByRole('tab', { name: 'Overview' });
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tabpanel', { name: 'Overview' })).toHaveTextContent('Overview panel');
    expect(container.querySelector('.oc-atabs__indicator')).toHaveAttribute('aria-hidden', 'true');
    first.focus();
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Specs' })).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('specs');
    fireEvent.keyDown(list, { key: 'ArrowRight' }); // skips the disabled tab
    expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(list, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('mirrors arrow keys in RTL', () => {
    render(
      <div dir="rtl">
        <AnimatedTabs label="Product" tabs={tabs} />
      </div>,
    );
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Specs' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('axe-core on motion, wizard and premium components (jsdom)', { timeout: 30000 }, () => {
  it('has no violations', async () => {
    const { default: axe } = await import('axe-core');
    const { Wizard, ColorPicker, InputOtp, Carousel3D, Timeline, SpotlightCard, Stagger, AnimatedBorder, Parallax, RippleRings } = await import('../index');
    const user = userEvent.setup();
    render(
      <main>
        <h1>Motion</h1>
        <Marquee label="Logos">
          <span>Acme</span>
          <span>Globex</span>
        </Marquee>
        <NumberTicker value={42} />
        <TextReveal text="Hello there" />
        <TypingText words={['one', 'two']} loop />
        <MorphingText texts={['a', 'b']} />
        <SpotlightCard>
          <h2>Spotlight</h2>
        </SpotlightCard>
        <AnimatedBorder>Border</AnimatedBorder>
        <Stagger as="ul">
          <li>One</li>
          <li>Two</li>
        </Stagger>
        <ShimmerButton>Shine</ShimmerButton>
        <AuroraBackground>
          <p>Aurora</p>
        </AuroraBackground>
        <Parallax background={<GridPattern />}>
          <p>Parallax</p>
        </Parallax>
        <RippleRings />
        <AnimatedTabs label="Tabs" tabs={[{ value: 'a', label: 'A', content: 'Panel A' }, { value: 'b', label: 'B', content: 'Panel B' }]} />
        <Reorder label="Order" items={['x', 'y']} onReorder={() => {}} getKey={(s) => s} getLabel={(s) => s} />
        <Wizard label="Setup" steps={[{ id: 'a', title: 'First', content: 'A' }, { id: 'b', title: 'Second', optional: true, content: 'B' }]} />
        <ColorPicker label="Brand" alpha contrastWith="#ffffff" presets={['#ff0000']} />
        <InputOtp label="Code" length={6} groups={[3, 3]} mask revealable resendAfter={30} />
        <Carousel3D label="Slides" autoplay={5000} slides={[{ title: 'One', content: 'First' }, { title: 'Two', content: 'Second' }]} />
        <Timeline groupBy="day" now={new Date(2026, 0, 2)} items={[{ title: 'Done', date: new Date(2026, 0, 2), status: 'complete', details: 'More' }]} />
      </main>,
    );
    await user.click(screen.getByRole('button', { name: 'Pick a color' }));
    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } }, resultTypes: ['violations'] });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});

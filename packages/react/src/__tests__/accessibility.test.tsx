// AccessibilityPanel: behavior, persistence, keyboard, i18n and an axe audit of the open panel in every
// color scheme. jsdom cannot evaluate color-contrast or target-size (no layout); contrast of every scheme
// is verified by packages/core (check-contrast) and in a real browser by tests/e2e.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { A11Y_STORAGE_KEY, a11yOptions, type A11yPrefs } from '@pelagic-ui/core/a11y-prefs';
import { AccessibilityPanel, createTheme, useA11yPrefs } from '../index';

const html = document.documentElement;

afterEach(() => {
  localStorage.clear();
  for (const a of [...html.attributes]) if (a.name.startsWith('data-a11y-')) html.removeAttribute(a.name);
  html.style.removeProperty('--pl-user-font-scale');
  document.querySelectorAll('.pl-a11y-reading-guide, .pl-a11y-reading-mask, #pl-a11y-filters').forEach((n) => n.remove());
});

async function audit(container: Element) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } } });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

describe('AccessibilityPanel', () => {
  it('opens from the floating trigger as a labelled modal dialog and closes with Escape, restoring focus', async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel />);
    const trigger = screen.getByRole('button', { name: 'Accessibility settings' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Accessibility' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(dialog.contains(document.activeElement)).toBe(true);
    // Groups are labelled sections.
    for (const g of ['Contrast & color', 'Text', 'Reading aids', 'Motion & media', 'Interaction']) expect(within(dialog).getByRole('heading', { name: g })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('applies, persists, announces and reports every change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AccessibilityPanel defaultOpen onChange={onChange} />);
    const dialog = screen.getByRole('dialog');

    await user.click(within(dialog).getByRole('radio', { name: 'Yellow on black' }));
    expect(html.getAttribute('data-a11y-contrast')).toBe('yellow-black');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ contrast: 'yellow-black' }), { key: 'contrast', value: 'yellow-black' });
    expect(JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY)!).contrast).toBe('yellow-black');
    expect(screen.getByRole('status')).toHaveTextContent('Color scheme: Yellow on black');

    await user.click(within(dialog).getByRole('switch', { name: 'Readable font' }));
    expect(html.getAttribute('data-a11y-font')).toBe('readable');
    expect(within(dialog).getByRole('switch', { name: 'Readable font' })).toHaveAttribute('aria-checked', 'true');

    await user.click(within(dialog).getByRole('switch', { name: 'Bigger focus indicator' }));
    expect(html.getAttribute('data-a11y-focus')).toBe('large');

    await user.selectOptions(within(dialog).getByLabelText('Color vision'), 'tritanopia');
    expect(html.getAttribute('data-a11y-color-filter')).toBe('tritanopia');
    expect(document.getElementById('pl-a11y-tritanopia')).not.toBeNull();

    await user.click(within(dialog).getByRole('button', { name: 'Larger text' }));
    expect(html.getAttribute('data-a11y-font-scale')).toBe('1.1');
    expect(html.style.getPropertyValue('--pl-user-font-scale')).toBe('1.1');
    fireEvent.change(within(dialog).getByRole('slider', { name: 'Text size' }), { target: { value: '2' } });
    expect(html.getAttribute('data-a11y-font-scale')).toBe('2');
    expect(within(dialog).getByRole('button', { name: 'Larger text' })).toBeDisabled();

    await user.click(within(within(dialog).getByRole('radiogroup', { name: 'Animation' })).getByRole('radio', { name: 'Off' }));
    expect(html.getAttribute('data-a11y-motion')).toBe('off');

    expect(within(dialog).getByText('6 active')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Reset all' }));
    expect([...html.attributes].filter((a) => a.name.startsWith('data-a11y-'))).toHaveLength(0);
    expect(localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('All accessibility settings were reset.');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ contrast: 'default' }), { key: 'reset', value: null });
  });

  it('restores saved preferences on mount', () => {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ contrast: 'gray', links: 'highlight' }));
    render(<AccessibilityPanel trigger="none" />);
    expect(html.getAttribute('data-a11y-contrast')).toBe('gray');
    expect(html.getAttribute('data-a11y-links')).toBe('highlight');
  });

  it('moves through radio groups with the arrow keys (roving tabindex)', async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel defaultOpen persist={false} />);
    const group = screen.getByRole('radiogroup', { name: 'Color scheme' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    radios[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(html.getAttribute('data-a11y-contrast')).toBe(a11yOptions.contrast[1]);
    await user.keyboard('{ArrowDown}');
    expect(html.getAttribute('data-a11y-contrast')).toBe(a11yOptions.contrast[5]);
    await user.keyboard('{End}');
    expect(html.getAttribute('data-a11y-contrast')).toBe('invert');
    await user.keyboard('{Home}');
    expect(html.hasAttribute('data-a11y-contrast')).toBe(false);
  });

  it('keeps Tab inside the open panel', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">outside</button>
        <AccessibilityPanel defaultOpen persist={false} />
      </>,
    );
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 40; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement), `tab ${i}: ${document.activeElement?.outerHTML.slice(0, 80)}`).toBe(true);
    }
  });

  it('renders Arabic labels with lang and dir', () => {
    render(<AccessibilityPanel defaultOpen locale="ar" persist={false} />);
    const dialog = screen.getByRole('dialog', { name: 'إمكانية الوصول' });
    expect(dialog).toHaveAttribute('dir', 'rtl');
    expect(dialog).toHaveAttribute('lang', 'ar');
    expect(within(dialog).getByRole('radio', { name: 'أصفر على أسود' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'إعادة الضبط' })).toBeInTheDocument();
  });

  it('accepts label overrides, an inline trigger and a subset of groups', async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel trigger="inline" groups={['text']} labels={{ title: 'Display', groups: { text: 'Reading' } }} persist={false} />);
    await user.click(screen.getByRole('button', { name: 'Display' }));
    const dialog = screen.getByRole('dialog', { name: 'Display' });
    expect(within(dialog).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Reading']);
  });

  it('works controlled and scoped to a container', async () => {
    const user = userEvent.setup();
    function Demo() {
      const [prefs, setPrefs] = useState<Partial<A11yPrefs>>({ contrast: 'black-white' });
      const [el, setEl] = useState<HTMLElement | null>(null);
      return (
        <>
          <section ref={setEl} data-testid="scope" />
          {el && <AccessibilityPanel defaultOpen persist={false} value={prefs} onChange={setPrefs} target={el} />}
        </>
      );
    }
    render(<Demo />);
    const scope = screen.getByTestId('scope');
    expect(scope.getAttribute('data-a11y-contrast')).toBe('black-white');
    expect(html.hasAttribute('data-a11y-contrast')).toBe(false);
    await user.click(screen.getByRole('radio', { name: 'Inverted' }));
    expect(scope.getAttribute('data-a11y-contrast')).toBe('invert');
  });

  it.each(a11yOptions.contrast)('the open panel passes axe with contrast "%s" (and every other mode on)', async (contrast) => {
    localStorage.setItem(
      A11Y_STORAGE_KEY,
      JSON.stringify({ contrast, colorFilter: 'protanopia', fontScale: 1.5, readableFont: true, links: 'highlight', focus: 'large', cursor: 'large', readingGuide: true, readingMask: true, motion: 'off', largeTargets: true, lineHeight: 'wider' }),
    );
    const { baseElement } = render(
      <main>
        <h1>Page</h1>
        <AccessibilityPanel defaultOpen />
      </main>,
    );
    await act(async () => {});
    expect(html.getAttribute('data-a11y-contrast')).toBe(contrast === 'default' ? null : contrast);
    expect(await audit(baseElement)).toEqual([]);
  });

  it('useA11yPrefs exposes state, a setter and reset', () => {
    let api: ReturnType<typeof useA11yPrefs> | undefined;
    function Probe() {
      api = useA11yPrefs({ persist: false });
      return null;
    }
    render(<Probe />);
    act(() => api![1]('wordSpacing', 'wider'));
    expect(api![0].wordSpacing).toBe('wider');
    expect(html.getAttribute('data-a11y-word-spacing')).toBe('wider');
    act(() => api![2]());
    expect(html.hasAttribute('data-a11y-word-spacing')).toBe(false);
  });

  it('re-exports createTheme for custom brand colors', () => {
    expect(createTheme('#ff6a00').failures.light).toEqual([]);
  });
});

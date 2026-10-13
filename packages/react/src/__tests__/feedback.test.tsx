import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LOADER_TYPES,
  Loader,
  LoaderOverlay,
  PageLoader,
  SwalHost,
  TOAST_SWIPE_THRESHOLD,
  Toaster,
  TopProgressBar,
  swal,
  toast,
  topProgress,
  useAsyncAction,
  type SwalOptions,
  type SwalResult,
} from '../index';

afterEach(() => {
  act(() => {
    while (swal.isOpen()) swal.close();
    toast.remove();
    topProgress.done();
  });
  vi.useRealTimers();
});

function open(options: SwalOptions) {
  let promise!: Promise<SwalResult>;
  act(() => {
    promise = swal.fire(options);
  });
  return promise;
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/* ------------------------------------------------------------------ */
describe('swal', () => {
  it('resolves isConfirmed when the confirm button is pressed', async () => {
    render(<SwalHost />);
    const p = open({ icon: 'success', title: 'Saved', text: 'All good', showCancelButton: true });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Success: Saved');
    expect(dialog).toHaveAccessibleDescription('All good');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expect(p).resolves.toEqual({ isConfirmed: true, isDenied: false, isDismissed: false, value: true });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(swal.isOpen()).toBe(false);
  });

  it('resolves isDenied for the deny button and dismiss "cancel" for cancel', async () => {
    render(<SwalHost />);
    const p1 = open({ title: 'Save changes?', showDenyButton: true, showCancelButton: true, denyButtonText: "Don't save" });
    await userEvent.click(screen.getByRole('button', { name: "Don't save" }));
    await expect(p1).resolves.toMatchObject({ isDenied: true, isConfirmed: false, value: false });

    const p2 = open({ title: 'Again', showCancelButton: true });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expect(p2).resolves.toMatchObject({ isDismissed: true, dismiss: 'cancel' });
  });

  it('dismisses on Escape and outside click unless disabled', async () => {
    render(<SwalHost />);
    const p1 = open({ title: 'Esc me' });
    fireEvent.keyDown(document, { key: 'Escape' });
    await expect(p1).resolves.toMatchObject({ isDismissed: true, dismiss: 'esc' });

    const p2 = open({ title: 'Click outside' });
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);
    await expect(p2).resolves.toMatchObject({ dismiss: 'backdrop' });

    open({ title: 'Sticky', allowEscapeKey: false, allowOutsideClick: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('uses alertdialog for warning, error and question; dialog otherwise; status text for screen readers', () => {
    render(<SwalHost />);
    const cases: Array<[SwalOptions['icon'], string, string]> = [
      ['warning', 'alertdialog', 'Warning:'],
      ['error', 'alertdialog', 'Error:'],
      ['question', 'alertdialog', 'Question:'],
      ['info', 'dialog', 'Information:'],
      ['success', 'dialog', 'Success:'],
    ];
    for (const [icon, role, prefix] of cases) {
      open({ icon, title: 'Heads up' });
      const el = screen.getByRole(role);
      expect(el).toHaveAttribute('aria-modal', 'true');
      expect(within(el).getByText(prefix, { exact: false })).toHaveClass('oc-sr-only');
      // The animated glyph is decorative.
      expect(el.querySelector('svg.oc-glyph')).toHaveAttribute('aria-hidden', 'true');
      act(() => swal.close());
    }
    open({ icon: 'none', title: 'Plain' });
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Plain');
    expect(screen.getByRole('dialog').querySelector('.oc-glyph')).toBeNull();
  });

  it('validates input and returns the value', async () => {
    render(<SwalHost />);
    const p = open({
      title: 'Your email',
      input: 'email',
      inputLabel: 'Email address',
      inputValidator: async (v) => (!v ? 'Email is required' : null),
    });
    const input = screen.getByLabelText('Email address');
    expect(input).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Email is required');
    await userEvent.type(input, 'a@b.co{Enter}');
    await expect(p).resolves.toMatchObject({ isConfirmed: true, value: 'a@b.co' });
  });

  it('shows a loading confirm button while preConfirm runs and uses its result', async () => {
    render(<SwalHost />);
    const d = deferred<{ id: number }>();
    const p = open({ title: 'Submit', preConfirm: () => d.promise });
    const confirm = screen.getByRole('button', { name: 'OK' });
    await userEvent.click(confirm);
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    expect(swal.isLoading()).toBe(true);
    await act(async () => {
      d.resolve({ id: 7 });
    });
    await expect(p).resolves.toMatchObject({ isConfirmed: true, value: { id: 7 } });
  });

  it('keeps the dialog open when preConfirm reports a validation message', async () => {
    render(<SwalHost />);
    open({
      title: 'Username',
      input: 'text',
      preConfirm: async () => {
        swal.showValidationMessage('Name taken');
      },
    });
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Name taken');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).not.toHaveAttribute('aria-busy');
  });

  it('supports select, radio and checkbox inputs', async () => {
    render(<SwalHost />);
    const p1 = open({ title: 'Fruit', input: 'select', inputLabel: 'Fruit', inputOptions: { apple: 'Apple', pear: 'Pear' }, inputPlaceholder: 'Pick one' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Fruit' }), 'pear');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expect(p1).resolves.toMatchObject({ value: 'pear' });

    const p2 = open({ title: 'Size', input: 'radio', inputOptions: [{ value: 's', label: 'Small' }, { value: 'l', label: 'Large' }] });
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Size');
    await userEvent.click(screen.getByLabelText('Large'));
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expect(p2).resolves.toMatchObject({ value: 'l' });

    const p3 = open({ title: 'Terms', input: 'checkbox', inputLabel: 'I agree' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'I agree' }));
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expect(p3).resolves.toMatchObject({ value: true });
  });

  it('auto-closes on a timer, pausing on hover and via the pause button', async () => {
    vi.useFakeTimers();
    render(<SwalHost />);
    const p = open({ title: 'Bye soon', timer: 1000, timerProgressBar: true });
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseEnter(dialog);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.mouseLeave(dialog);

    const pause = screen.getByRole('button', { name: 'Pause auto-close' });
    fireEvent.click(pause);
    expect(pause).toHaveAttribute('aria-pressed', 'true');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(pause);
    fireEvent.blur(pause);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await expect(p).resolves.toMatchObject({ isDismissed: true, dismiss: 'timer' });
  });

  it('traps focus, locks scroll and returns focus to the opener', async () => {
    render(
      <>
        <button type="button">Open</button>
        <SwalHost />
      </>,
    );
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    const p = open({ icon: 'warning', title: 'Delete?', showCancelButton: true, confirmButtonText: 'Delete' });
    const confirm = screen.getByRole('button', { name: 'Delete' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(confirm).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await userEvent.tab();
    expect(cancel).toHaveFocus();
    await userEvent.tab();
    expect(confirm).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(cancel).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(p).resolves.toMatchObject({ dismiss: 'cancel' });
    expect(document.body.style.overflow).toBe('');
    expect(opener).toHaveFocus();
  });

  it('honours focusCancel and reverseButtons', () => {
    render(<SwalHost />);
    open({ title: 'Order', showCancelButton: true, focusCancel: true, reverseButtons: true });
    const buttons = within(screen.getByRole('dialog')).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Cancel', 'OK']);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('queues dialogs fired while one is open', async () => {
    render(<SwalHost />);
    const p1 = open({ title: 'First' });
    const p2 = open({ title: 'Second' });
    expect(screen.getByRole('dialog')).toHaveAccessibleName('First');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expect(p1).resolves.toMatchObject({ isConfirmed: true });
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Second');
    act(() => swal.close());
    await expect(p2).resolves.toMatchObject({ dismiss: 'close' });
  });

  it('renders toast mode as a non-modal status without stealing focus', async () => {
    render(
      <>
        <button type="button">Here</button>
        <SwalHost />
      </>,
    );
    const here = screen.getByRole('button', { name: 'Here' });
    here.focus();
    let p!: Promise<SwalResult>;
    act(() => {
      p = swal.success('Copied', undefined, { toast: true, position: 'bottom-end', showConfirmButton: false });
    });
    const status = screen.getByRole('status');
    expect(status).not.toHaveAttribute('aria-modal');
    expect(status.parentElement).toHaveClass('oc-swal--toast', 'oc-swal--bottom-end');
    expect(here).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
    act(() => swal.close());
    await expect(p).resolves.toMatchObject({ isDismissed: true });
  });
});

/* ------------------------------------------------------------------ */
describe('toaster', () => {
  it('renders toasts as list items in a polite live region, with errors assertive', () => {
    render(<Toaster />);
    act(() => {
      toast('Saved draft');
      toast.error('Upload failed');
    });
    const region = screen.getByRole('region', { name: 'Notifications (Alt+T)' });
    const list = region.querySelector('ol')!;
    expect(list).toHaveAttribute('aria-live', 'polite');
    const items = within(region).getAllByRole('listitem');
    const saved = items.find((li) => li.textContent?.includes('Saved draft'))!;
    const failed = items.find((li) => li.textContent?.includes('Upload failed'))!;
    expect(saved).not.toHaveAttribute('aria-live');
    expect(failed).toHaveAttribute('aria-live', 'assertive');
    expect(failed).toHaveTextContent('Error: Upload failed');
  });

  it('turns a promise toast from loading into success or error', async () => {
    render(<Toaster />);
    const ok = deferred<string>();
    const bad = deferred<string>();
    act(() => {
      toast.promise(ok.promise, { loading: 'Saving…', success: (name) => `Saved ${name}`, error: 'Could not save' });
    });
    expect(screen.getByText('Saving…').closest('li')).toHaveAttribute('data-type', 'loading');
    await act(async () => ok.resolve('report.pdf'));
    expect(screen.getByText('Saved report.pdf').closest('li')).toHaveAttribute('data-type', 'success');

    act(() => {
      toast.promise(bad.promise, { loading: 'Deleting…', success: 'Deleted', error: (e) => `Failed: ${String(e)}` });
    });
    await act(async () => bad.reject('offline'));
    const err = screen.getByText('Failed: offline').closest('li')!;
    expect(err).toHaveAttribute('aria-live', 'assertive');
  });

  it('dismisses and updates by id', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    let id: string | number = '';
    act(() => {
      id = toast('Uploading', { duration: Infinity });
    });
    act(() => toast.update(id, { message: 'Uploaded', type: 'success', description: '3 files' }));
    const item = screen.getByText('Uploaded').closest('li')!;
    expect(item).toHaveAttribute('data-type', 'success');
    expect(item).toHaveTextContent('3 files');
    act(() => toast.dismiss(id));
    expect(item).toHaveAttribute('data-state', 'closed');
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByText('Uploaded')).toBeNull();
  });

  it('auto-dismisses, pausing while hovered and while the document is hidden', () => {
    vi.useFakeTimers();
    const onAutoClose = vi.fn();
    render(<Toaster duration={1000} />);
    act(() => {
      toast('Heads up', { onAutoClose });
    });
    const list = screen.getByRole('region').querySelector('ol')!;
    fireEvent.mouseEnter(list);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    fireEvent.mouseLeave(list);

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    visibility.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    act(() => vi.advanceTimersByTime(1000));
    expect(onAutoClose).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByText('Heads up')).toBeNull();
    visibility.mockRestore();
  });

  it('keeps Infinity-duration toasts and shows a progress bar for timed ones', () => {
    vi.useFakeTimers();
    render(<Toaster progress />);
    act(() => {
      toast('Sticky', { duration: Infinity });
      toast('Timed', { duration: 2000 });
    });
    expect(screen.getByText('Timed').closest('li')!.querySelector('.oc-toaster__progress')).not.toBeNull();
    expect(screen.getByText('Sticky').closest('li')!.querySelector('.oc-toaster__progress')).toBeNull();
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText('Sticky')).toBeInTheDocument();
    expect(screen.queryByText('Timed')).toBeNull();
  });

  it('dismisses on a horizontal swipe past the threshold only', () => {
    render(<Toaster />);
    act(() => {
      toast('Swipe me', { duration: Infinity });
    });
    const item = screen.getByText('Swipe me').closest('li')!;
    const pointer = (type: string, clientX: number) => fireEvent(item, new MouseEvent(type, { bubbles: true, clientX, button: 0 }));

    pointer('pointerdown', 100);
    pointer('pointermove', 120);
    pointer('pointerup', 120);
    expect(item).toHaveAttribute('data-state', 'open');

    pointer('pointerdown', 100);
    pointer('pointermove', 100 - TOAST_SWIPE_THRESHOLD - 10);
    pointer('pointerup', 100 - TOAST_SWIPE_THRESHOLD - 10);
    expect(item).toHaveAttribute('data-state', 'closed');
    expect(item).toHaveAttribute('data-swipe-out', 'left');
  });

  it('runs action and cancel buttons, and the close button dismisses', async () => {
    render(<Toaster closeButton />);
    const onUndo = vi.fn();
    act(() => {
      toast('File deleted', { duration: Infinity, action: { label: 'Undo', onClick: onUndo }, cancel: { label: 'Keep' } });
    });
    const item = screen.getByText('File deleted').closest('li')!;
    await userEvent.click(within(item).getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(item).toHaveAttribute('data-state', 'closed');

    act(() => {
      toast('Another', { duration: Infinity });
    });
    const other = screen.getByText('Another').closest('li')!;
    await userEvent.click(within(other).getByRole('button', { name: 'Dismiss notification' }));
    expect(other).toHaveAttribute('data-state', 'closed');
  });

  it('focuses the region with Alt+T and dismisses a focused toast with Escape', () => {
    render(<Toaster />);
    act(() => {
      toast('Keyboard friendly', { duration: Infinity });
    });
    fireEvent.keyDown(document, { key: 't', code: 'KeyT', altKey: true });
    const item = screen.getByText('Keyboard friendly').closest('li')!;
    expect(item).toHaveFocus();
    expect(screen.getByRole('region')).toHaveAttribute('data-expanded', 'true');
    fireEvent.keyDown(item, { key: 'Escape' });
    expect(item).toHaveAttribute('data-state', 'closed');
  });

  it('limits visible toasts and positions the deck', () => {
    render(<Toaster position="top-start" visibleToasts={2} />);
    act(() => {
      toast('One', { duration: Infinity });
      toast('Two', { duration: Infinity });
      toast('Three', { duration: Infinity });
    });
    expect(screen.getByRole('region')).toHaveClass('oc-toaster--top-start');
    expect(screen.queryByText('One')).toBeNull();
    expect(screen.getByText('Three').closest('li')).toHaveAttribute('data-front', 'true');
    expect(screen.getByText('Two').closest('li')).toHaveAttribute('data-collapsed', 'true');
  });
});

/* ------------------------------------------------------------------ */
describe('loaders', () => {
  it('ships at least 14 distinct types', () => {
    expect(new Set(LOADER_TYPES).size).toBeGreaterThanOrEqual(14);
  });

  it.each(LOADER_TYPES)('%s renders role="status" with an accessible label and decorative art', (type) => {
    const { container } = render(<Loader type={type} label={`Loading ${type}`} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(`Loading ${type}`);
    expect(within(status).getByText(`Loading ${type}`)).toHaveClass('oc-sr-only');
    expect(status).toHaveClass(`oc-loader--${type}`);
    expect(container.querySelector('.oc-loader__art')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the label visually with showLabel and exposes determinate progress', () => {
    render(<Loader type="progress-ring" value={42} label="Uploading" showLabel variant="block" size="lg" />);
    expect(screen.getByText('Uploading')).toHaveClass('oc-loader__label');
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByRole('status')).toHaveClass('oc-loader--block', 'oc-loader--lg');
  });

  it('LoaderOverlay marks the region busy and the content inert', () => {
    const { rerender } = render(
      <LoaderOverlay active label="Refreshing">
        <button type="button">Inside</button>
      </LoaderOverlay>,
    );
    const button = screen.getByText('Inside');
    const region = button.closest('.oc-loader-overlay')!;
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(button.parentElement).toHaveAttribute('inert');
    expect(screen.getByRole('status')).toHaveTextContent('Refreshing');
    rerender(
      <LoaderOverlay active={false} label="Refreshing">
        <button type="button">Inside</button>
      </LoaderOverlay>,
    );
    expect(region).toHaveAttribute('aria-busy', 'false');
    expect(button.parentElement).not.toHaveAttribute('inert');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('PageLoader marks the page busy and fades out', () => {
    vi.useFakeTimers();
    const { rerender } = render(<PageLoader active brand="Orca" label="Starting app" />);
    expect(screen.getByRole('status')).toHaveTextContent('Starting app');
    expect(document.body).toHaveAttribute('aria-busy', 'true');
    rerender(<PageLoader active={false} brand="Orca" label="Starting app" exitDuration={300} />);
    expect(document.querySelector('.oc-page-loader')).toHaveAttribute('data-state', 'leaving');
    expect(document.body).not.toHaveAttribute('aria-busy');
    act(() => vi.advanceTimersByTime(300));
    expect(document.querySelector('.oc-page-loader')).toBeNull();
  });

  it('topProgress start/inc/done drives the TopProgressBar', () => {
    vi.useFakeTimers();
    render(<TopProgressBar label="Loading page" />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    act(() => topProgress.start());
    const bar = screen.getByRole('progressbar', { name: 'Loading page' });
    expect(bar).toHaveAttribute('aria-valuenow', '8');
    expect(topProgress.isStarted()).toBe(true);
    act(() => vi.advanceTimersByTime(1000));
    expect(Number(bar.getAttribute('aria-valuenow'))).toBeGreaterThan(8);
    act(() => topProgress.set(0.5));
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    act(() => topProgress.done());
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(topProgress.isStarted()).toBe(false);
    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
describe('useAsyncAction', () => {
  function Demo({ fn }: { fn: () => Promise<string> }) {
    const { run, loading, error } = useAsyncAction(fn);
    return (
      <>
        <button type="button" onClick={() => void run()} aria-busy={loading}>
          Go
        </button>
        <span data-testid="state">{loading ? 'loading' : error ? `error: ${String(error)}` : 'idle'}</span>
      </>
    );
  }

  it('tracks loading and captures errors', async () => {
    const d = deferred<string>();
    const { rerender } = render(<Demo fn={() => d.promise} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(screen.getByTestId('state')).toHaveTextContent('loading');
    await act(async () => d.resolve('ok'));
    expect(screen.getByTestId('state')).toHaveTextContent('idle');

    rerender(<Demo fn={() => Promise.reject(new Error('nope'))} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(await screen.findByText('error: Error: nope')).toBeInTheDocument();
  });
});

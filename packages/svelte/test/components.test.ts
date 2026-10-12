import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as lib from '../src/lib/index';
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Divider,
  ProgressBar,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Spinner,
  Stepper,
  Timeline,
  Toast,
  getPageItems,
} from '../src/lib/index';
import AccordionHost from './fixtures/AccordionHost.svelte';
import ChoiceBind from './fixtures/ChoiceBind.svelte';
import InputBind from './fixtures/InputBind.svelte';
import OverlayHost from './fixtures/OverlayHost.svelte';
import SlotsHost from './fixtures/SlotsHost.svelte';
import TableHost from './fixtures/TableHost.svelte';
import TabsHost from './fixtures/TabsHost.svelte';
import TooltipHost from './fixtures/TooltipHost.svelte';

// Clicks and value changes use fireEvent (which also flushes Svelte's update queue).
// user-event's pointer simulation does not emit mouse/click events in this Vitest 3 + jsdom
// setup, so it is only used for keyboard interaction (arrow keys, Tab, Escape).
const text = (s: string) => createRawSnippet(() => ({ render: () => `<span>${s}</span>` }));

afterEach(() => {
  document.body.style.overflow = '';
});

describe('package exports', () => {
  it('exports every component, the modal action and theme helpers', () => {
    const components = [
      'Button', 'Input', 'Textarea', 'Select', 'Checkbox', 'Switch', 'RadioGroup', 'Segmented', 'Slider',
      'Badge', 'Tag', 'Avatar', 'Alert', 'Card', 'Spinner', 'Skeleton', 'SkeletonText', 'SkeletonCard',
      'ProgressBar', 'Stepper', 'Timeline', 'EmptyState', 'Tooltip', 'Divider', 'Tabs', 'Breadcrumb',
      'Pagination', 'Accordion', 'Dialog', 'Drawer', 'DataTable', 'Toast',
    ];
    for (const name of components) expect(typeof (lib as Record<string, unknown>)[name], name).toBe('function');
    expect(typeof lib.modal).toBe('function');
    expect(typeof lib.applyTheme).toBe('function');
    expect(lib.THEME_STORAGE_KEY).toBe('orca-ui-theme');
  });

  it('getPageItems compacts long ranges', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    expect(getPageItems(1, 10)).toEqual([1, 2, 'ellipsis', 10]);
    expect(getPageItems(10, 10)).toEqual([1, 'ellipsis', 9, 10]);
  });
});

describe('Button', () => {
  it('renders a type=button with variant, size and block classes', () => {
    render(Button, { props: { variant: 'danger', size: 'lg', block: true, children: text('Delete') } });
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).toHaveClass('oc-btn', 'oc-btn--danger', 'oc-btn--lg', 'oc-btn--block');
    expect(btn).not.toHaveAttribute('aria-busy');
  });

  it('loading disables the button, sets aria-busy and shows a hidden spinner', () => {
    const onclick = vi.fn();
    render(Button, { props: { loading: true, onclick, children: text('Save') } });
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('.oc-spinner')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(btn);
    expect(onclick).not.toHaveBeenCalled();
  });

  it('forwards clicks and extra attributes; icon-only keeps its aria-label', async () => {
    const onclick = vi.fn();
    render(Button, { props: { iconOnly: true, 'aria-label': 'Settings', type: 'submit', onclick, children: text('⚙') } });
    const btn = screen.getByRole('button', { name: 'Settings' });
    expect(btn).toHaveClass('oc-btn--icon');
    expect(btn).toHaveAttribute('type', 'submit');
    await fireEvent.click(btn);
    expect(onclick).toHaveBeenCalledOnce();
  });
});

describe('Input / Textarea / Select', () => {
  it('labels the field and two-way binds value', async () => {
    render(InputBind);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input).toHaveValue('Ada');
    await fireEvent.input(input, { target: { value: 'Lin' } });
    expect(screen.getByTestId('name')).toHaveTextContent('Lin');
    await fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(input).toHaveValue('Grace');

    await fireEvent.input(screen.getByLabelText('Bio'), { target: { value: 'Hi' } });
    expect(screen.getByTestId('bio')).toHaveTextContent('Hi');

    const select = screen.getByLabelText('Fruit');
    expect(within(select).getByRole('option', { name: 'Pear' })).toBeDisabled();
    await fireEvent.change(select, { target: { value: 'apple' } });
    expect(screen.getByTestId('fruit')).toHaveTextContent('apple');
  });

  it('wires the hint with aria-describedby', () => {
    render(InputBind, { props: { hint: 'As on your ID' } });
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAccessibleDescription('As on your ID');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('error replaces the hint and sets aria-invalid', () => {
    render(InputBind, { props: { hint: 'As on your ID', error: 'Required' } });
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Required');
    expect(screen.queryByText('As on your ID')).toBeNull();
    expect(input.closest('.oc-field')).toHaveClass('oc-field--error');
  });
});

describe('Switch, Checkbox, RadioGroup, Segmented, Slider, Pagination', () => {
  const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '{}');

  it('Switch toggles aria-checked and binds checked; disabled switch does nothing', async () => {
    render(ChoiceBind);
    const sw = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(state().on).toBe(true);
    await fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
    const locked = screen.getByRole('switch', { name: 'Locked' });
    expect(locked).toBeDisabled();
    await fireEvent.click(locked);
    expect(locked).toHaveAttribute('aria-checked', 'false');
  });

  it('Checkbox binds checked', async () => {
    render(ChoiceBind);
    await fireEvent.click(screen.getByRole('checkbox', { name: 'I agree' }));
    expect(state().agree).toBe(true);
  });

  it('RadioGroup is a labelled radiogroup with bind:value and onchange', async () => {
    const onradio = vi.fn();
    render(ChoiceBind, { props: { onradio } });
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(within(group).getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(within(group).getByRole('radio', { name: 'Large' })).toBeDisabled();
    await fireEvent.click(within(group).getByRole('radio', { name: 'Small' }));
    expect(state().size).toBe('s');
    expect(onradio).toHaveBeenCalledWith('s');
  });

  it('Segmented uses roving tabindex and arrow keys wrap', async () => {
    const onsegment = vi.fn();
    render(ChoiceBind, { props: { onsegment } });
    const group = screen.getByRole('radiogroup', { name: 'View' });
    const [list, grid, map] = within(group).getAllByRole('radio');
    expect(list).toHaveAttribute('aria-checked', 'true');
    expect(list).toHaveAttribute('tabindex', '0');
    expect(grid).toHaveAttribute('tabindex', '-1');
    list.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(map).toHaveAttribute('aria-checked', 'true');
    expect(map).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(list).toHaveFocus();
    expect(state().view).toBe('list');
    await fireEvent.click(grid);
    expect(state().view).toBe('grid');
    expect(onsegment).toHaveBeenLastCalledWith('grid');
  });

  it('Slider is labelled and shows its bound value', async () => {
    render(ChoiceBind);
    const slider = screen.getByRole('slider', { name: /Volume/ });
    expect(slider).toHaveValue('30');
    await fireEvent.input(slider, { target: { value: '55' } });
    expect(state().volume).toBe(55);
    expect(slider.closest('.oc-field')).toHaveTextContent('55');
  });

  it('Pagination marks the current page and disables edges', async () => {
    const onpage = vi.fn();
    render(ChoiceBind, { props: { onpage } });
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(nav.querySelector('.oc-pagination__ellipsis')).toHaveAttribute('aria-hidden', 'true');
    await fireEvent.click(within(nav).getByRole('button', { name: 'Page 10' }));
    expect(onpage).toHaveBeenLastCalledWith(10);
    expect(within(nav).getByRole('button', { name: 'Page 10' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Next page' })).toBeDisabled();
    await fireEvent.click(within(nav).getByRole('button', { name: 'Previous page' }));
    expect(state().page).toBe(9);
  });
});

describe('Tabs', () => {
  it('follows the WAI-ARIA tabs pattern with keyboard navigation that skips disabled tabs', async () => {
    const onchange = vi.fn();
    render(TabsHost, { props: { onchange } });
    const tabs = screen.getAllByRole('tab');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[2]).toHaveAttribute('tabindex', '-1');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('Panel one');
    expect(panel).toHaveAttribute('aria-labelledby', tabs[0].id);
    expect(tabs[0]).toHaveAttribute('aria-controls', panel.id);

    tabs[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tabs[2]).toHaveFocus();
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel three');
    expect(onchange).toHaveBeenLastCalledWith('three');
    await userEvent.keyboard('{End}');
    expect(tabs[3]).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tabs[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(tabs[3]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(tabs[0]).toHaveFocus();
    expect(screen.getByTestId('tab')).toHaveTextContent('one');
    expect(tabs[1]).toBeDisabled();
  });
});

describe('DataTable', () => {
  it('has a caption and sorts with aria-sort', async () => {
    const onsort = vi.fn();
    render(TableHost, { props: { onsort } });
    const table = screen.getByRole('table', { name: 'People' });
    const names = () => within(table).getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent);
    expect(names()).toEqual(['Charlie', 'alice', 'Bob', 'dave']);
    const nameHeader = within(table).getByRole('columnheader', { name: /Name/ });
    expect(nameHeader).not.toHaveAttribute('aria-sort');
    expect(within(table).getByRole('columnheader', { name: 'ID' }).querySelector('button')).toBeNull();

    await fireEvent.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(names()).toEqual(['alice', 'Bob', 'Charlie', 'dave']);
    expect(onsort).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });

    await fireEvent.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(names()).toEqual(['dave', 'Charlie', 'Bob', 'alice']);

    const ageHeader = within(table).getByRole('columnheader', { name: /Age/ });
    await fireEvent.click(within(ageHeader).getByRole('button'));
    expect(nameHeader).not.toHaveAttribute('aria-sort');
    const ages = within(table).getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[1].textContent?.trim());
    expect(ages).toEqual(['7', '35', '120', '—']); // numeric sort, nulls last
    expect(ageHeader).toHaveClass('oc-table__align-end');
  });

  it('remote mode keeps the server order', async () => {
    render(TableHost, { props: { remote: true } });
    const table = screen.getByRole('table');
    await fireEvent.click(within(table).getByRole('button', { name: /Name/ }));
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Charlie');
  });

  it('loading shows hidden skeleton rows and aria-busy', () => {
    render(TableHost, { props: { loading: true } });
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-busy', 'true');
    const skeletons = table.querySelectorAll('.oc-skeleton');
    expect(skeletons).toHaveLength(4 * 3);
    skeletons.forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
  });

  it('shows the empty message spanning every column', () => {
    render(TableHost, { props: { rows: [] } });
    const cell = screen.getByText('No data');
    expect(cell).toHaveAttribute('colspan', '3');
  });
});

describe('Dialog / Drawer (modal action)', () => {
  it.each(['dialog', 'drawer'] as const)('%s: focus moves in, Tab is trapped, Escape closes, scroll locks and focus returns', async (kind) => {
    render(OverlayHost, { props: { kind } });
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    await fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName(kind === 'dialog' ? 'Edit profile' : 'Filters');
    expect(dialog).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    if (kind === 'dialog') expect(dialog).toHaveClass('oc-dialog--lg');
    else expect(dialog).toHaveClass('oc-drawer--right');

    const focusables = [...dialog.querySelectorAll<HTMLElement>('button, input')];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    expect(first).toHaveAccessibleName('Close');
    last.focus();
    await userEvent.tab();
    expect(first).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(last).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(opener).toHaveFocus();
  });

  it('closes on backdrop mousedown but not on mousedown inside the panel', async () => {
    render(OverlayHost);
    await fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog');
    await fireEvent.mouseDown(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await fireEvent.mouseDown(dialog.parentElement!);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closeOnBackdrop=false keeps it open; close and footer buttons close it', async () => {
    render(OverlayHost, { props: { kind: 'drawer', closeOnBackdrop: false, side: 'left' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveClass('oc-drawer--right');
    await fireEvent.mouseDown(dialog.parentElement!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Tooltip', () => {
  it('describes the trigger and Escape dismisses until focus leaves', async () => {
    render(TooltipHost);
    const trigger = screen.getByRole('button', { name: 'Copy' });
    const tip = screen.getByRole('tooltip', { hidden: true });
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
    expect(trigger).toHaveAccessibleDescription('Copy link');
    const wrapper = trigger.parentElement!;
    expect(wrapper).toHaveClass('oc-tooltip', 'oc-tooltip--bottom');
    trigger.focus();
    await userEvent.keyboard('{Escape}');
    expect(wrapper).toHaveAttribute('data-dismissed');
    await userEvent.tab();
    expect(wrapper).not.toHaveAttribute('data-dismissed');
    trigger.focus();
    await userEvent.keyboard('{Escape}');
    await fireEvent.mouseLeave(wrapper);
    expect(wrapper).not.toHaveAttribute('data-dismissed');
  });
});

describe('Toast', () => {
  it('is a polite live region and dismisses by id', async () => {
    const ondismiss = vi.fn();
    render(Toast, {
      props: {
        items: [
          { id: 1, title: 'Saved', message: 'All good', variant: 'success' },
          { id: 'b', message: 'FYI' },
        ],
        ondismiss,
      },
    });
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    const toasts = region.querySelectorAll('.oc-toast');
    expect(toasts).toHaveLength(2);
    expect(toasts[0]).toHaveClass('oc-toast--success');
    expect(toasts[1].className).toBe('oc-toast');
    const dismiss = within(region).getAllByRole('button', { name: 'Dismiss' });
    await fireEvent.click(dismiss[1]);
    expect(ondismiss).toHaveBeenCalledWith('b');
  });
});

describe('Skeletons', () => {
  it('Skeleton is hidden from assistive tech and sizes numbers in px', () => {
    const { container } = render(Skeleton, { props: { width: 120, height: '2rem' } });
    const el = container.querySelector('.oc-skeleton') as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('2rem');
  });

  it('circle skeleton is square from its height', () => {
    const { container } = render(Skeleton, { props: { circle: true, height: 40, width: 999 } });
    const el = container.querySelector('.oc-skeleton') as HTMLElement;
    expect(el).toHaveClass('oc-skeleton--circle');
    expect(el.style.width).toBe('40px');
  });

  it('SkeletonText announces one busy status with the label and N hidden lines', () => {
    render(SkeletonText, { props: { lines: 5, label: 'Loading article' } });
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading article');
    expect(status.querySelectorAll('.oc-skeleton[aria-hidden="true"]')).toHaveLength(5);
  });

  it('SkeletonCard announces once and hides its placeholder shapes', () => {
    render(SkeletonCard, { props: { lines: 2 } });
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading…');
    expect(status.querySelectorAll('.oc-skeleton')).toHaveLength(1 + 2 + 2);
  });
});

describe('display components: render + ARIA', () => {
  it('Accordion toggles aria-expanded and the controlled region', async () => {
    render(AccordionHost);
    const shipping = screen.getByRole('button', { name: 'Shipping' });
    const returns = screen.getByRole('button', { name: 'Returns' });
    expect(shipping).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region');
    expect(shipping).toHaveAttribute('aria-controls', region.id);
    expect(region).toHaveTextContent('Content a');
    await fireEvent.click(returns);
    expect(returns).toHaveAttribute('aria-expanded', 'true');
    expect(shipping).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('region')).toHaveLength(1);
    await fireEvent.click(returns);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('Accordion multiple keeps several open', async () => {
    render(AccordionHost, { props: { multiple: true } });
    await fireEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });

  it('Alert uses role alert for danger, status for info, and an optional dismiss button', async () => {
    const onclose = vi.fn();
    render(SlotsHost, { props: { onclose } });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Failed');
    expect(alert).toHaveClass('oc-alert--danger');
    await fireEvent.click(within(alert).getByRole('button', { name: 'Dismiss' }));
    expect(onclose).toHaveBeenCalledOnce();
    const info = screen.getByText('Heads up').closest('.oc-alert')!;
    expect(info).toHaveAttribute('role', 'status');
    expect(within(info as HTMLElement).queryByRole('button')).toBeNull();
  });

  it('Card, EmptyState, Badge and Tag render their slots', async () => {
    const onremove = vi.fn();
    const onclick = vi.fn();
    render(SlotsHost, { props: { onremove, onclick } });
    const card = screen.getByRole('article');
    expect(card.querySelector('.oc-card__header')).toHaveTextContent('Plan');
    expect(card.querySelector('.oc-card__footer')).toHaveTextContent('Footer');
    expect(screen.getByText('No results').closest('.oc-empty')!.querySelector('.oc-empty__icon')).toHaveAttribute('aria-hidden', 'true');
    await fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(onclick).toHaveBeenCalled();
    expect(screen.getByText('Active')).toHaveClass('oc-badge', 'oc-badge--success');
    await fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onremove).toHaveBeenCalled();
  });

  it('Badge neutral has no modifier', () => {
    render(Badge, { props: { children: text('New') } });
    expect(screen.getByText('New').parentElement!.className).toBe('oc-badge');
  });

  it('Avatar is an image with the person name and initials', () => {
    render(Avatar, { props: { name: '  ada   lovelace byron ', size: 'lg' } });
    const img = screen.getByRole('img', { name: 'ada lovelace byron' });
    expect(img).toHaveTextContent('AL');
    expect(img).toHaveClass('oc-avatar--lg');
  });

  it('Avatar with src renders a decorative img', () => {
    const { container } = render(Avatar, { props: { name: 'Ada', src: '/a.png' } });
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('Breadcrumb marks the last item as the current page', () => {
    render(Breadcrumb, { props: { items: [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Button', href: '/x' }] } });
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Home', 'Docs']);
    expect(within(nav).getByText('Button')).toHaveAttribute('aria-current', 'page');
  });

  it('ProgressBar clamps its value and supports indeterminate', () => {
    const { unmount } = render(ProgressBar, { props: { value: 140, label: 'Upload' } });
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('100%');
    unmount();
    render(ProgressBar);
    const ind = screen.getByRole('progressbar', { name: 'Progress' });
    expect(ind).not.toHaveAttribute('aria-valuenow');
    expect(ind).toHaveClass('oc-progress--indeterminate');
  });

  it('Spinner is a labelled status', () => {
    render(Spinner, { props: { size: 'lg', label: 'Saving' } });
    expect(screen.getByRole('status', { name: 'Saving' })).toHaveClass('oc-spinner--lg');
  });

  it('Stepper marks the current step', () => {
    render(Stepper, { props: { current: 1, steps: [{ label: 'Cart' }, { label: 'Shipping', description: 'Address' }, { label: 'Pay' }] } });
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.dataset.state)).toEqual(['complete', 'current', 'upcoming']);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveTextContent('Address');
  });

  it('Timeline renders an ordered list with hidden dots', () => {
    render(Timeline, { props: { items: [{ title: 'Created', time: '09:00', variant: 'success' }, { title: 'Shipped', description: 'DHL' }] } });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('.oc-timeline__dot')).toHaveClass('oc-timeline__dot--success');
    expect(items[0].querySelector('.oc-timeline__dot')).toHaveAttribute('aria-hidden', 'true');
    expect(items[1]).toHaveTextContent('DHL');
  });

  it('Divider is a separator with an optional label', () => {
    render(Divider, { props: { label: 'Or' } });
    expect(screen.getByRole('separator', { name: 'Or' })).toHaveClass('oc-divider');
  });

  it('modal action can be used directly and updates its close handler', () => {
    const node = document.createElement('div');
    node.tabIndex = -1;
    node.innerHTML = '<button>a</button>';
    document.body.append(node);
    const first = vi.fn();
    const second = vi.fn();
    const action = lib.modal(node, first);
    expect(document.activeElement).toBe(node);
    action.update(second);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    flushSync();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    action.destroy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(second).toHaveBeenCalledOnce();
    node.remove();
  });
});

describe('EmptyState (illustrated)', () => {
  const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

  it('renders an h3 title and ordered primary / secondary / legacy actions', () => {
    const { container } = render(lib.EmptyState, {
      props: {
        title: 'No results',
        description: 'Try another search',
        primaryAction: snip('<button>Clear</button>'),
        secondaryAction: snip('<button>Help</button>'),
        children: snip('<button>Legacy</button>'),
      },
    });
    expect(screen.getByRole('heading', { level: 3, name: 'No results' })).toHaveClass('oc-empty__title');
    expect(screen.getByText('Try another search')).toHaveClass('oc-empty__desc');
    expect([...container.querySelectorAll('.oc-empty__actions button')].map((b) => b.textContent)).toEqual(['Clear', 'Help', 'Legacy']);
  });

  it('maps size, align, layout, tone and headingLevel', () => {
    const { container } = render(lib.EmptyState, { props: { title: 'Down', size: 'page', align: 'start', layout: 'split', tone: 'danger', headingLevel: 1 } });
    expect(container.querySelector('.oc-empty')!.className).toBe('oc-empty oc-empty--page oc-empty--start oc-empty--split oc-empty--tone-danger');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Down');
    expect(container.querySelector('.oc-empty__actions')).toBeNull();
  });

  it('renders a paragraph title when headingLevel is false', () => {
    render(lib.EmptyState, { props: { title: 'Inline', headingLevel: false, size: 'compact' } });
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('Inline').tagName).toBe('P');
  });

  it('accepts an illustration snippet or a scene name', () => {
    let r = render(lib.EmptyState, { props: { title: 'A', illustration: snip('<svg class="art" aria-hidden="true"></svg>') } });
    expect(r.container.querySelector('.oc-empty__media svg.art')).not.toBeNull();
    r.unmount();
    r = render(lib.EmptyState, { props: { title: 'A', illustration: 'no-results', size: 'compact' } });
    const el = r.container.querySelector('.oc-empty__media oc-illustration')!;
    expect(el.getAttribute('name')).toBe('no-results');
    expect(el.hasAttribute('compact')).toBe(true);
    r.unmount();
    r = render(lib.EmptyState, { props: { title: 'A', illustration: false } });
    expect(r.container.querySelector('.oc-empty__media')).toBeNull();
  });
});

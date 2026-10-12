import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Alert,
  Button,
  DataTable,
  EmptyState,
  Dialog,
  Input,
  Pagination,
  SkeletonText,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  applyTheme,
} from '../index';
import { getPageItems } from '../utils';

describe('accessibility', () => {
  it('traps Tab inside an open dialog and restores scroll on close', async () => {
    const { rerender } = render(
      <Dialog open title="Edit" onClose={() => {}} footer={<Button>Save</Button>}>
        <input aria-label="Name" />
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    const save = screen.getByRole('button', { name: 'Save' });
    save.focus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(save).toHaveFocus();
    rerender(<Dialog open={false} title="Edit" onClose={() => {}} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('describes the tooltip trigger and hides the bubble on Escape', () => {
    render(
      <Tooltip text="Copy link">
        <button type="button">Copy</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Copy' });
    expect(trigger).toHaveAccessibleDescription('Copy link');
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(trigger.parentElement).toHaveAttribute('data-dismissed');
  });

  it('announces skeletons once as a loading status', () => {
    render(<SkeletonText lines={4} label="Loading profile" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading profile');
  });

  it('applies theme attributes', () => {
    applyTheme({ mode: 'dark', accent: 'rose', shape: 'round' });
    const html = document.documentElement;
    expect(html.dataset.theme).toBe('dark');
    expect(html.dataset.accent).toBe('rose');
    expect(html.dataset.shape).toBe('round');
    applyTheme({ mode: 'system' });
    expect(html.hasAttribute('data-theme')).toBe(false);
  });
});

describe('Button', () => {
  it('applies variant and size classes', () => {
    render(<Button variant="outline" size="lg">Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveClass('oc-btn', 'oc-btn--outline', 'oc-btn--lg');
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('is disabled and busy while loading', () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole('button', { name: 'Saving' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });
});

describe('Input', () => {
  it('links the error message and sets aria-invalid', () => {
    render(<Input label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Required');
  });
});

describe('Switch', () => {
  it('reports the toggled value', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Notifications" />);
    await userEvent.click(screen.getByRole('switch', { name: 'Notifications' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Tabs', () => {
  it('moves selection with arrow keys', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        tabs={[
          { key: 'a', label: 'First', content: 'Panel A' },
          { key: 'b', label: 'Second', content: 'Panel B' },
        ]}
        onChange={onChange}
      />,
    );
    const first = screen.getByRole('tab', { name: 'First' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B');
  });
});

describe('Pagination', () => {
  it('calls onChange with the clicked page', async () => {
    const onChange = vi.fn();
    render(<Pagination value={1} pageCount={5} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('compacts long page lists with ellipses', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    expect(getPageItems(1, 4)).toEqual([1, 2, 3, 4]);
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'qty', label: 'Qty', sortable: true, align: 'end' as const },
  ];
  const rows = [
    { id: 1, name: 'Banana', qty: 3 },
    { id: 2, name: 'Apple', qty: 10 },
    { id: 3, name: 'Cherry', qty: 2 },
  ];

  it('sorts numerically and toggles direction on repeated clicks', async () => {
    render(<DataTable columns={columns} rows={rows} />);
    await userEvent.click(screen.getByRole('button', { name: /Qty/ }));
    let body = within(screen.getByRole('table')).getAllByRole('row').slice(1).map((r) => r.textContent);
    expect(body[0]).toContain('Cherry');
    await userEvent.click(screen.getByRole('button', { name: /Qty/ }));
    body = within(screen.getByRole('table')).getAllByRole('row').slice(1).map((r) => r.textContent);
    expect(body[0]).toContain('Apple');
  });

  it('shows the empty message when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('renders nothing when closed and closes on Escape when open', () => {
    const onClose = vi.fn();
    const { rerender } = render(<Dialog open={false} title="Hi" onClose={onClose}>Body</Dialog>);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<Dialog open title="Hi" onClose={onClose}>Body</Dialog>);
    expect(screen.getByRole('dialog', { name: 'Hi' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Tag and Alert', () => {
  it('calls onRemove from the remove button', async () => {
    const onRemove = vi.fn();
    render(<Tag removable onRemove={onRemove}>React</Tag>);
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalled();
  });

  it('uses role=alert for danger messages', () => {
    render(<Alert variant="danger" title="Failed">Try again</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Try again');
  });
});

describe('EmptyState', () => {
  it('renders an h3 title, description and ordered actions by default', () => {
    render(
      <EmptyState
        title="No results"
        description="Try another search"
        primaryAction={<button type="button">Clear filters</button>}
        secondaryAction={<button type="button">Help</button>}
      >
        <button type="button">Legacy</button>
      </EmptyState>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'No results' })).toHaveClass('oc-empty__title');
    expect(screen.getByText('Try another search')).toHaveClass('oc-empty__desc');
    const names = within(document.querySelector('.oc-empty__actions') as HTMLElement).getAllByRole('button').map((b) => b.textContent);
    expect(names).toEqual(['Clear filters', 'Help', 'Legacy']);
  });

  it('supports size, align, layout, tone and headingLevel', () => {
    const { container, rerender } = render(<EmptyState title="Down" size="page" align="start" layout="split" tone="danger" headingLevel={1} />);
    const root = container.firstElementChild!;
    expect(root.className).toBe('oc-empty oc-empty--page oc-empty--start oc-empty--split oc-empty--tone-danger');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Down');
    rerender(<EmptyState title="Inline" size="compact" headingLevel={false} />);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('Inline').tagName).toBe('P');
    expect(container.querySelector('.oc-empty__actions')).toBeNull();
  });

  it('renders an illustration node or a scene name, and hides it with false', () => {
    const { container, rerender } = render(<EmptyState title="Empty" illustration={<svg data-testid="art" aria-hidden="true" />} />);
    expect(container.querySelector('.oc-empty__media [data-testid="art"]')).not.toBeNull();
    rerender(<EmptyState title="Empty" illustration="no-results" size="compact" />);
    const el = container.querySelector('.oc-empty__media oc-illustration')!;
    expect(el.getAttribute('name')).toBe('no-results');
    expect(el.hasAttribute('compact')).toBe(true);
    rerender(<EmptyState title="Empty" illustration={false} icon="★" />);
    expect(container.querySelector('.oc-empty__media')).toBeNull();
    expect(container.querySelector('.oc-empty__icon')).toHaveAttribute('aria-hidden', 'true');
  });
});

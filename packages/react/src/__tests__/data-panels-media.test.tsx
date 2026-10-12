import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  Chip,
  DataView,
  Fieldset,
  FileUpload,
  Image,
  ImageCompare,
  Message,
  MeterGroup,
  OrderList,
  OrganizationChart,
  Panel,
  Paginator,
  PickList,
  Splitter,
  SplitterPanel,
  Terminal,
  Toolbar,
  Tree,
  TreeTable,
  VirtualScroller,
  type TreeNode,
} from '../index';

const nodes: TreeNode[] = [
  {
    key: 'docs',
    label: 'Documents',
    children: [
      { key: 'work', label: 'Work' },
      { key: 'home', label: 'Home' },
    ],
  },
  { key: 'pics', label: 'Pictures' },
];

describe('Tree', () => {
  it('exposes tree semantics and supports arrow-key navigation', async () => {
    const user = userEvent.setup();
    render(<Tree nodes={nodes} label="Files" selectionMode="single" />);
    const tree = screen.getByRole('tree', { name: 'Files' });
    const docs = within(tree).getByRole('treeitem', { name: /Documents/ });
    expect(docs).toHaveAttribute('aria-level', '1');
    expect(docs).toHaveAttribute('aria-setsize', '2');
    expect(docs).toHaveAttribute('aria-posinset', '1');
    expect(docs).toHaveAttribute('aria-expanded', 'false');
    expect(docs).toHaveAttribute('tabindex', '0');

    await user.tab();
    expect(docs).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(docs).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    const work = screen.getByRole('treeitem', { name: 'Work' });
    expect(work).toHaveFocus();
    expect(work).toHaveAttribute('aria-level', '2');
    expect(within(docs).getByRole('group')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('treeitem', { name: 'Home' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(docs).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(docs).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{End}');
    const pics = screen.getByRole('treeitem', { name: 'Pictures' });
    expect(pics).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(pics).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(docs).toHaveFocus();
    await user.keyboard('p');
    expect(pics).toHaveFocus();
  });

  it('flips Left/Right in RTL', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Tree nodes={nodes} label="Files" />
      </div>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('treeitem', { name: /Documents/ })).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('treeitem', { name: /Documents/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('propagates checkbox state up and down', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tree nodes={nodes} label="Files" selectionMode="checkbox" defaultExpandedKeys={['docs']} onSelectionChange={onChange} />);
    const tree = screen.getByRole('tree');
    expect(tree).toHaveAttribute('aria-multiselectable', 'true');
    const docs = screen.getByRole('treeitem', { name: /Documents/ });

    await user.click(screen.getByText('Work'));
    expect(docs).toHaveAttribute('aria-checked', 'mixed');
    await user.click(screen.getByText('Home'));
    expect(docs).toHaveAttribute('aria-checked', 'true');
    expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining(['work', 'home', 'docs']));

    // Unchecking the parent clears all descendants.
    await user.click(screen.getByText('Documents'));
    expect(docs).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('treeitem', { name: 'Work' })).toHaveAttribute('aria-checked', 'false');
  });

  it('lazy loads children and filters', async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn(async () => [{ key: 'lazy-child', label: 'Loaded child' }]);
    render(<Tree nodes={[{ key: 'root', label: 'Remote' }, { key: 'other', label: 'Other', leaf: true }]} label="Lazy" onExpand={onExpand} filter />);
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('treeitem', { name: 'Loaded child' })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Filter' }), 'oth');
    expect(screen.queryByRole('treeitem', { name: /Remote/ })).not.toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'Other' })).toBeInTheDocument();
  });
});

describe('TreeTable', () => {
  it('renders a treegrid with expandable rows and sorting', async () => {
    const user = userEvent.setup();
    render(
      <TreeTable
        caption="Files"
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'size', label: 'Size' },
        ]}
        nodes={[
          { key: 'b', data: { name: 'Beta', size: '1 MB' }, children: [{ key: 'b1', data: { name: 'Beta child', size: '1 KB' } }] },
          { key: 'a', data: { name: 'Alpha', size: '2 MB' } },
        ]}
      />,
    );
    const grid = screen.getByRole('treegrid', { name: 'Files' });
    let rows = within(grid).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveAttribute('aria-expanded', 'false');
    expect(rows[0]).toHaveAttribute('aria-level', '1');
    act(() => rows[0].focus());
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Beta child').closest('tr')).toHaveAttribute('aria-level', '2');

    await user.click(screen.getByRole('button', { name: /Name/ }));
    rows = within(grid).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Alpha');
  });
});

describe('Paginator', () => {
  it('reports the current range and changes rows per page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Paginator totalRecords={120} rowsPerPageOptions={[10, 25]} onPageChange={onPageChange} showJumpToPage />);
    const report = screen.getByRole('status');
    expect(report).toHaveTextContent('Showing 1–10 of 120');
    expect(report).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '25');
    expect(report).toHaveTextContent('Showing 1–25 of 120');
    expect(onPageChange).toHaveBeenLastCalledWith({ first: 0, rows: 25, page: 0, pageCount: 5 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(report).toHaveTextContent('Showing 26–50 of 120');

    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(report).toHaveTextContent('Showing 101–120 of 120');

    const jump = screen.getByRole('spinbutton', { name: 'Go to page' });
    await user.clear(jump);
    await user.type(jump, '3{Enter}');
    expect(report).toHaveTextContent('Showing 51–75 of 120');
  });
});

describe('DataView', () => {
  it('toggles layout and paginates', async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `Item ${i + 1}` }));
    render(<DataView items={items} label="Products" rows={5} paginator itemTemplate={(it) => it.name} getKey={(it) => it.id} />);
    const list = screen.getByRole('list', { name: 'Products' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    const grid = screen.getByRole('button', { name: 'Grid' });
    await user.click(grid);
    expect(grid).toHaveAttribute('aria-pressed', 'true');
    expect(list).toHaveClass('oc-dataview__content--grid');
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(within(screen.getByRole('list', { name: 'Products' })).getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows the empty state', () => {
    render(<DataView items={[]} label="Products" itemTemplate={() => null} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});

describe('VirtualScroller', () => {
  it('renders only a window of items with set size and position', () => {
    const items = Array.from({ length: 1000 }, (_, i) => `Row ${i + 1}`);
    render(<VirtualScroller items={items} itemSize={20} height={100} label="Rows" itemTemplate={(t) => t} />);
    const list = screen.getByRole('list', { name: 'Rows' });
    const rendered = within(list).getAllByRole('listitem');
    expect(rendered.length).toBeLessThan(20);
    expect(rendered[0]).toHaveAttribute('aria-setsize', '1000');
    expect(rendered[0]).toHaveAttribute('aria-posinset', '1');
    fireEvent.scroll(screen.getByRole('region', { name: 'Rows' }), { target: { scrollTop: 10000 } });
    expect(screen.getByText('Row 501')).toBeInTheDocument();
    expect(screen.queryByText('Row 1')).not.toBeInTheDocument();
  });
});

describe('OrderList', () => {
  it('moves items with buttons and keyboard and announces the move', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OrderList header="Priority" defaultValue={['A', 'B', 'C', 'D']} getKey={(s) => s} getLabel={(s) => s} onChange={onChange} />);
    const listbox = screen.getByRole('listbox', { name: 'Priority' });
    await user.click(within(listbox).getByRole('option', { name: 'B' }));
    expect(within(listbox).getByRole('option', { name: 'B' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('button', { name: 'Move down' }));
    expect(onChange).toHaveBeenLastCalledWith(['A', 'C', 'B', 'D']);
    expect(screen.getByRole('status')).toHaveTextContent('Moved B to position 3 of 4');

    await user.click(screen.getByRole('button', { name: 'Move to top' }));
    expect(onChange).toHaveBeenLastCalledWith(['B', 'A', 'C', 'D']);
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();

    act(() => listbox.focus());
    await user.keyboard('{Alt>}{End}{/Alt}');
    expect(onChange).toHaveBeenLastCalledWith(['A', 'C', 'D', 'B']);
    expect(screen.getByRole('status')).toHaveTextContent('Moved B to position 4 of 4');
  });
});

describe('PickList', () => {
  it('transfers selected items and announces', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PickList defaultValue={{ source: ['Red', 'Green', 'Blue'], target: [] }} getKey={(s) => s} getLabel={(s) => s} onChange={onChange} />);
    const source = screen.getByRole('listbox', { name: /Available/ });
    expect(source).toHaveAttribute('aria-multiselectable', 'true');
    act(() => source.focus());
    // Focus lands on the first option; Space toggles, arrows move without selecting.
    await user.keyboard('{ }{ArrowDown}{ }');
    await user.click(screen.getByRole('button', { name: 'Move selected to Selected' }));
    expect(onChange).toHaveBeenLastCalledWith({ source: ['Blue'], target: ['Red', 'Green'] });
    expect(screen.getByRole('status')).toHaveTextContent('Moved 2 items to Selected');
    await user.click(screen.getByRole('button', { name: 'Move all to Available' }));
    expect(onChange).toHaveBeenLastCalledWith({ source: ['Blue', 'Red', 'Green'], target: [] });
  });
});

describe('OrganizationChart', () => {
  it('renders nested lists with collapsible and selectable nodes', async () => {
    const user = userEvent.setup();
    render(
      <OrganizationChart
        label="Company"
        selectionMode="single"
        collapsible
        value={{ key: 'ceo', label: 'CEO', children: [{ key: 'cto', label: 'CTO' }, { key: 'cfo', label: 'CFO' }] }}
      />,
    );
    const toggle = screen.getByRole('button', { name: 'Collapse CEO' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'CTO' }));
    expect(screen.getByRole('button', { name: 'CTO' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(screen.queryByRole('button', { name: 'CTO' })).not.toBeInTheDocument();
  });
});

describe('Panel and Fieldset', () => {
  it('toggles panel content via a disclosure button', async () => {
    const user = userEvent.setup();
    render(
      <Panel header="Details" toggleable footer="Foot">
        Body text
      </Panel>,
    );
    const btn = screen.getByRole('button', { name: 'Collapse' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    const content = document.getElementById(btn.getAttribute('aria-controls')!)!;
    expect(content).toBeVisible();
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(content).not.toBeVisible();
    expect(screen.getByRole('region', { name: 'Details' })).toBeInTheDocument();
  });

  it('toggles a fieldset from its legend', async () => {
    const user = userEvent.setup();
    render(
      <Fieldset legend="Address" toggleable defaultCollapsed>
        Street
      </Fieldset>,
    );
    const btn = screen.getByRole('button', { name: /Address/ });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(screen.getByText('Street')).toBeVisible();
  });
});

describe('Splitter', () => {
  afterEach(() => window.localStorage.clear());

  it('resizes with the keyboard within min sizes and persists', async () => {
    const user = userEvent.setup();
    const onResizeEnd = vi.fn();
    const { unmount } = render(
      <Splitter stateKey="split-test" onResizeEnd={onResizeEnd}>
        <SplitterPanel minSize={20}>One</SplitterPanel>
        <SplitterPanel minSize={10}>Two</SplitterPanel>
      </Splitter>,
    );
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    expect(sep).toHaveAttribute('aria-valuenow', '50');
    expect(sep).toHaveAttribute('aria-valuemin', '20');
    expect(sep).toHaveAttribute('aria-valuemax', '90');
    sep.focus();
    await user.keyboard('{ArrowRight}');
    expect(sep).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{Home}');
    expect(sep).toHaveAttribute('aria-valuenow', '20');
    await user.keyboard('{End}');
    expect(sep).toHaveAttribute('aria-valuenow', '90');
    await user.keyboard('{ArrowLeft}');
    expect(onResizeEnd).toHaveBeenLastCalledWith([85, 15]);
    expect(JSON.parse(window.localStorage.getItem('split-test')!)).toEqual([85, 15]);
    unmount();

    render(
      <Splitter stateKey="split-test" layout="vertical">
        <SplitterPanel>One</SplitterPanel>
        <SplitterPanel>Two</SplitterPanel>
      </Splitter>,
    );
    const restored = screen.getByRole('separator');
    expect(restored).toHaveAttribute('aria-valuenow', '85');
    expect(restored).toHaveAttribute('aria-orientation', 'horizontal');
  });
});

describe('Toolbar', () => {
  it('has a single tab stop with arrow-key focus movement', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar label="Formatting" start={<><button>Bold</button><button>Italic</button></>} end={<button>Save</button>} />,
    );
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  });
});

describe('Carousel', () => {
  afterEach(() => vi.useRealTimers());

  it('labels slides and pauses autoplay', () => {
    vi.useFakeTimers();
    render(<Carousel label="Featured" items={['a', 'b', 'c', 'd', 'e']} itemTemplate={(t) => <span>{t}</span>} autoplayInterval={1000} />);
    const region = screen.getByRole('region', { name: 'Featured' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    const slide2 = region.querySelector('[aria-label="Slide 2 of 5"]')!;
    expect(slide2).toHaveAttribute('aria-roledescription', 'slide');
    expect(slide2).toHaveAttribute('aria-hidden', 'true');
    expect(slide2).toHaveAttribute('inert');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(slide2).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('button', { name: 'Slide 2' })).toHaveAttribute('aria-current', 'true');

    const pause = screen.getByRole('button', { name: 'Pause automatic slide show' });
    fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Start automatic slide show' })).toBeInTheDocument();
    expect(slide2.parentElement).toHaveAttribute('aria-live', 'polite');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(slide2).not.toHaveAttribute('aria-hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('group', { name: 'Slide 3 of 5' })).not.toHaveAttribute('aria-hidden');
  });

  it('pauses while hovered', () => {
    vi.useFakeTimers();
    render(<Carousel label="Featured" items={['a', 'b', 'c']} itemTemplate={(t) => t} autoplayInterval={1000} />);
    fireEvent.mouseEnter(screen.getByRole('region', { name: 'Featured' }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('button', { name: 'Slide 1' })).toHaveAttribute('aria-current', 'true');
  });
});

describe('Image', () => {
  it('opens a preview dialog and closes it with Escape', async () => {
    const user = userEvent.setup();
    render(<Image src="/cat.jpg" alt="A cat" preview />);
    const trigger = screen.getByRole('button', { name: 'Preview A cat' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Preview: A cat' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await user.click(within(dialog).getByRole('button', { name: 'Zoom in' }));
    expect(within(dialog).getByRole('img', { name: 'A cat' })).toHaveStyle({ transform: 'rotate(0deg) scale(1.25)' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('labels the compare slider', () => {
    render(<ImageCompare before={{ src: '/a.jpg', alt: 'Before' }} after={{ src: '/b.jpg', alt: 'After' }} />);
    const slider = screen.getByRole('slider', { name: 'Comparison slider' });
    fireEvent.change(slider, { target: { value: '30' } });
    expect(slider).toHaveAttribute('aria-valuetext', '30% Before, 70% After');
  });
});

describe('MeterGroup, Chip, Message', () => {
  it('exposes meters with text values', () => {
    render(<MeterGroup label="Storage" value={[{ label: 'Apps', value: 16 }, { label: 'Photos', value: 30, color: 'success' }]} />);
    expect(screen.getByRole('group', { name: 'Storage' })).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Apps' })).toHaveAttribute('aria-valuetext', '16%');
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('removes a chip', async () => {
    const user = userEvent.setup();
    render(<Chip label="React" removable />);
    await user.click(screen.getByRole('button', { name: 'Remove React' }));
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  it('uses alert for errors and status otherwise', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Message severity="error" text="Required" closable />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Required');
    rerender(<Message severity="success" text="Saved" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    rerender(<Message severity="info" text="Note" closable />);
    await user.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(screen.queryByText('Note')).not.toBeInTheDocument();
  });
});

describe('FileUpload', () => {
  const file = (name: string, size: number, type: string) => new File(['x'.repeat(size)], name, { type });

  it('validates type, size and count with readable errors', () => {
    const onSelect = vi.fn();
    const { container } = render(<FileUpload accept=".png,image/jpeg" maxFileSize={1000} fileLimit={1} multiple onSelect={onSelect} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [file('doc.pdf', 10, 'application/pdf'), file('big.png', 5000, 'image/png'), file('ok.png', 10, 'image/png'), file('two.jpg', 10, 'image/jpeg')] },
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('doc.pdf: file type is not allowed');
    expect(alert).toHaveTextContent('big.png: file is too large (4.9 KB). Maximum size is 1000 B.');
    expect(alert).toHaveTextContent('Too many files: two.jpg was not added. Maximum is 1.');
    expect(onSelect).toHaveBeenCalledWith([expect.objectContaining({ name: 'ok.png' })]);
    expect(screen.getByText('ok.png')).toBeInTheDocument();
    expect(screen.getByText('10 B')).toBeInTheDocument();
  });

  it('uploads through the handler with per-file progress and removal', async () => {
    const user = userEvent.setup();
    let finish: () => void = () => {};
    const onUpload = vi.fn((files: File[], { onProgress }: { onProgress: (f: File, p: number) => void }) => {
      onProgress(files[0], 40);
      return new Promise<void>((resolve) => (finish = resolve));
    });
    const { container } = render(<FileUpload multiple onUpload={onUpload} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file('a.txt', 3, 'text/plain'), file('b.txt', 3, 'text/plain')] } });
    await user.click(screen.getByRole('button', { name: 'Remove b.txt' }));
    await user.click(screen.getByRole('button', { name: 'Upload' }));
    expect(screen.getByRole('progressbar', { name: 'Upload progress for a.txt' })).toHaveAttribute('aria-valuenow', '40');
    await act(async () => finish());
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('status').some((s) => s.textContent?.includes('Uploaded 1 file'))).toBe(true));
  });
});

describe('Terminal', () => {
  it('runs commands, logs responses and recalls history', async () => {
    const user = userEvent.setup();
    render(<Terminal onCommand={(cmd) => (cmd === 'date' ? 'Today' : `Unknown: ${cmd}`)} />);
    const input = screen.getByRole('textbox', { name: /command/ });
    await user.type(input, 'date{Enter}');
    const log = screen.getByRole('log');
    expect(await within(log).findByText('Today')).toBeInTheDocument();
    await user.type(input, 'foo{Enter}');
    expect(await within(log).findByText('Unknown: foo')).toBeInTheDocument();
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('foo');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('date');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveValue('');
  });
});

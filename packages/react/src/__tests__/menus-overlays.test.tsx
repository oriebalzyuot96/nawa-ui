import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  BlockUI,
  ConfirmProvider,
  ContextMenu,
  DialogProvider,
  FocusTrap,
  Menu,
  Menubar,
  PanelMenu,
  Popover,
  SpeedDial,
  SplitButton,
  TieredMenu,
  useConfirm,
  useDialog,
  type DynamicDialogContentProps,
  type MenuHandle,
  type MenuItem,
} from '../index';

const fileMenu: MenuItem[] = [
  { label: 'New' },
  { label: 'Open' },
  { separator: true },
  { label: 'Save', shortcut: 'Control+S' },
  { label: 'Delete', disabled: true },
];

describe('Menu', () => {
  it('renders groups and moves focus with arrows, Home/End and typeahead', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <Menu
        aria-label="Actions"
        model={[
          { label: 'Documents', items: [{ label: 'New' }, { label: 'Search' }] },
          { label: 'Profile', items: [{ label: 'Settings' }, { label: 'Save', command: onSave }] },
        ]}
      />,
    );
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(within(menu).getByRole('group', { name: 'Documents' })).toBeInTheDocument();
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((i) => i.tabIndex)).toEqual([0, -1, -1, -1]);

    await user.tab();
    expect(items[0]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
    expect(items[1]).toHaveAttribute('tabindex', '0');
    await user.keyboard('{End}');
    expect(items[3]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(items[0]).toHaveFocus();
    await user.keyboard('se');
    expect(items[1]).toHaveFocus(); // "Search"
    await user.keyboard('{Home}');
    expect(items[0]).toHaveFocus();
    await user.click(items[3]);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('marks disabled items and exposes shortcuts', () => {
    render(<Menu aria-label="File" model={fileMenu} />);
    expect(screen.getByRole('menuitem', { name: /Delete/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('menuitem', { name: /Save/ })).toHaveAttribute('aria-keyshortcuts', 'Control+S');
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('opens as a popup from the ref API, then Escape closes and returns focus', async () => {
    const user = userEvent.setup();
    function Demo() {
      const menu = useRef<MenuHandle>(null);
      return (
        <>
          <button type="button" onClick={(e) => menu.current?.toggle(e)}>
            Options
          </button>
          <Menu ref={menu} popup aria-label="Options" model={fileMenu} />
        </>
      );
    }
    render(<Demo />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    const menu = screen.getByRole('menu', { name: 'Options' });
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
    expect(within(menu).getAllByRole('menuitem')[0]).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes a popup on outside click without moving focus back', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Demo() {
      const anchor = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={anchor} type="button">
            Anchor
          </button>
          <input aria-label="Elsewhere" />
          <Menu popup defaultOpen anchorRef={anchor} onOpenChange={onOpenChange} aria-label="Popup" model={fileMenu} />
        </>
      );
    }
    render(<Demo />);
    expect(screen.getByRole('menu', { name: 'Popup' })).toBeInTheDocument();
    await user.click(screen.getByRole('textbox', { name: 'Elsewhere' }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('textbox', { name: 'Elsewhere' })).toHaveFocus();
  });
});

const barModel: MenuItem[] = [
  { label: 'File', items: [{ label: 'New' }, { label: 'Open', items: [{ label: 'Recent' }] }] },
  { label: 'Edit', items: [{ label: 'Undo' }, { label: 'Redo' }] },
  { label: 'Help', url: '#help' },
];

describe('Menubar', () => {
  it('follows the APG menubar keyboard model', async () => {
    const user = userEvent.setup();
    render(<Menubar aria-label="Main" model={barModel} />);
    const bar = screen.getByRole('menubar', { name: 'Main' });
    const [file, edit, help] = within(bar).getAllByRole('menuitem');
    expect(file).toHaveAttribute('aria-haspopup', 'menu');
    expect(file).toHaveAttribute('aria-expanded', 'false');

    await user.tab();
    expect(file).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(edit).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(file).toHaveFocus(); // wraps past Help

    await user.keyboard('{ArrowDown}');
    expect(file).toHaveAttribute('aria-expanded', 'true');
    const sub = screen.getByRole('menu', { name: 'File' });
    expect(within(sub).getByRole('menuitem', { name: 'New' })).toHaveFocus();

    // ArrowRight on a leaf moves to the next menubar item and opens its submenu.
    await user.keyboard('{ArrowRight}');
    expect(edit).toHaveFocus();
    expect(edit).toHaveAttribute('aria-expanded', 'true');
    expect(file).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Redo' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(edit).toHaveFocus();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(help).toHaveAttribute('href', '#help');
  });

  it('reverses horizontal arrows in RTL', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Menubar aria-label="Main" model={barModel} />
      </div>,
    );
    const [file, edit] = screen.getAllByRole('menuitem');
    act(() => file.focus());
    await user.keyboard('{ArrowLeft}');
    expect(edit).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(file).toHaveFocus();
  });
});

describe('TieredMenu', () => {
  it('opens flyouts with ArrowRight and closes them with ArrowLeft', async () => {
    const user = userEvent.setup();
    const onRecent = vi.fn();
    render(
      <TieredMenu
        aria-label="Tiered"
        model={[{ label: 'File', items: [{ label: 'Recent', command: onRecent }, { label: 'Pinned' }] }, { label: 'Quit' }]}
      />,
    );
    const file = screen.getByRole('menuitem', { name: 'File' });
    act(() => file.focus());
    await user.keyboard('{ArrowRight}');
    expect(file).toHaveAttribute('aria-expanded', 'true');
    const sub = screen.getByRole('menu', { name: 'File' });
    expect(file).toHaveAttribute('aria-controls', sub.id);
    expect(within(sub).getByRole('menuitem', { name: 'Recent' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.queryByRole('menu', { name: 'File' })).toBeNull();
    expect(file).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    expect(onRecent).toHaveBeenCalledTimes(1);
  });
});

describe('ContextMenu', () => {
  function Demo({ onShow }: { onShow?: () => void }) {
    const target = useRef<HTMLDivElement>(null);
    return (
      <>
        <div ref={target} tabIndex={0} data-testid="area">
          Right-click me
        </div>
        <ContextMenu targetRef={target} aria-label="Context" onShow={onShow} model={[{ label: 'Copy' }, { label: 'More', items: [{ label: 'Share' }] }]} />
      </>
    );
  }

  it('opens with Shift+F10, focuses the first item and returns focus on Escape', async () => {
    const user = userEvent.setup();
    const onShow = vi.fn();
    render(<Demo onShow={onShow} />);
    const area = screen.getByTestId('area');
    area.focus();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    const menu = screen.getByRole('menu', { name: 'Context' });
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(within(menu).getByRole('menuitem', { name: 'Copy' })).toHaveFocus();

    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('menuitem', { name: 'More' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(area).toHaveFocus();
  });

  it('opens at the pointer on contextmenu and prevents the native menu', () => {
    render(<Demo />);
    const notPrevented = fireEvent.contextMenu(screen.getByTestId('area'), { clientX: 40, clientY: 50 });
    expect(notPrevented).toBe(false);
    const popup = screen.getByRole('menu', { name: 'Context' }).parentElement!;
    expect(popup).toHaveClass('nw-floating');
    expect(popup.style.left).toBe('40px');
    expect(popup.style.top).toBe('50px');
  });
});

describe('SplitButton', () => {
  it('runs the main action and opens the menu button from the keyboard', async () => {
    const user = userEvent.setup();
    const onMain = vi.fn();
    const onExport = vi.fn();
    render(<SplitButton label="Save" onClick={onMain} model={[{ label: 'Save as' }, { label: 'Export', command: onExport }]} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onMain).toHaveBeenCalledTimes(1);

    const toggle = screen.getByRole('button', { name: 'More actions' });
    expect(toggle).toHaveAttribute('aria-haspopup', 'menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    toggle.focus();
    await user.keyboard('{ArrowUp}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const menu = screen.getByRole('menu', { name: 'More actions' });
    expect(within(menu).getByRole('menuitem', { name: 'Export' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(toggle).toHaveFocus();
  });
});

describe('Popover', () => {
  it('moves focus in, closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(
      <Popover aria-label="Share" trigger={<button type="button">Share</button>}>
        <input aria-label="Link" />
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Share' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Share' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    expect(screen.getByRole('textbox', { name: 'Link' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes on outside pointerdown', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover aria-label="Info" trigger={<button type="button">Info</button>}>
          Details
        </Popover>
        <p>Outside</p>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Info' }));
    expect(screen.getByRole('dialog', { name: 'Info' })).toBeInTheDocument();
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ConfirmDialog via useConfirm', () => {
  function Demo({ onAccept, onResult }: { onAccept?: () => void; onResult: (v: boolean) => void }) {
    const { confirm } = useConfirm();
    return (
      <button
        type="button"
        onClick={async () =>
          onResult(await confirm({ header: 'Delete file?', message: 'This cannot be undone.', acceptLabel: 'Delete', rejectLabel: 'Cancel', severity: 'danger', onAccept }))
        }
      >
        Delete
      </button>
    );
  }

  it('shows an alertdialog focused on the safe button and resolves on accept', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onResult = vi.fn();
    render(
      <ConfirmProvider>
        <Demo onAccept={onAccept} onResult={onResult} />
      </ConfirmProvider>,
    );
    const opener = screen.getByRole('button', { name: 'Delete' });
    await user.click(opener);
    const dialog = screen.getByRole('alertdialog', { name: 'Delete file?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    const accept = within(dialog).getByRole('button', { name: 'Delete' });
    expect(accept).toHaveClass('nw-btn--danger');

    await user.click(accept);
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('rejects on Escape', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <ConfirmProvider>
        <Demo onResult={onResult} />
      </ConfirmProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.keyboard('{Escape}');
    expect(onResult).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('anchors a ConfirmPopup when a target is given', async () => {
    const user = userEvent.setup();
    function PopupDemo() {
      const { confirm } = useConfirm();
      return (
        <button type="button" onClick={(e) => confirm({ target: e.currentTarget, message: 'Sure?' })}>
          Remove
        </button>
      );
    }
    render(
      <ConfirmProvider>
        <PopupDemo />
      </ConfirmProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    const popup = screen.getByRole('alertdialog');
    expect(popup).toHaveClass('nw-confirm-popup');
    expect(within(popup).getByRole('button', { name: 'No' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveFocus();
  });
});

describe('DynamicDialog', () => {
  it('opens a component and resolves its result on close', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    function Picker({ data, dialogRef }: DynamicDialogContentProps<{ options: string[] }, string>) {
      return (
        <>
          {data.options.map((o) => (
            <button key={o} type="button" onClick={() => dialogRef.close(o)}>
              {o}
            </button>
          ))}
        </>
      );
    }
    function Demo() {
      const dialog = useDialog();
      return (
        <button type="button" onClick={async () => onResult(await dialog.open(Picker, { header: 'Pick one', data: { options: ['Red', 'Blue'] } }).result)}>
          Choose
        </button>
      );
    }
    render(
      <DialogProvider>
        <Demo />
      </DialogProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Choose' }));
    const dialog = screen.getByRole('dialog', { name: 'Pick one' });
    await user.click(within(dialog).getByRole('button', { name: 'Blue' }));
    expect(onResult).toHaveBeenCalledWith('Blue');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('BlockUI', () => {
  it('makes the region inert and busy while blocked', () => {
    const { rerender } = render(
      <BlockUI blocked label="Saving">
        <button type="button">Inside</button>
      </BlockUI>,
    );
    const content = screen.getByRole('button', { name: 'Inside', hidden: true }).parentElement!;
    expect(content).toHaveAttribute('inert');
    expect(content).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Saving');

    rerender(
      <BlockUI blocked={false} label="Saving">
        <button type="button">Inside</button>
      </BlockUI>,
    );
    expect(content).not.toHaveAttribute('inert');
    expect(content).not.toHaveAttribute('aria-busy');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('blocks the whole document in fullScreen mode and restores it', () => {
    const { container, rerender } = render(<BlockUI blocked fullScreen label="Please wait" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Please wait');
    expect(status).not.toHaveAttribute('inert');
    expect(container).toHaveAttribute('inert');
    rerender(<BlockUI blocked={false} fullScreen label="Please wait" />);
    expect(container).not.toHaveAttribute('inert');
  });
});

describe('SpeedDial', () => {
  it('toggles, navigates labelled actions with arrows and closes on Escape', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <SpeedDial
        aria-label="Quick actions"
        direction="up"
        model={[
          { label: 'Add', icon: '+' },
          { label: 'Edit', icon: '✎', command: onEdit },
          { label: 'Delete', icon: '🗑' },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Quick actions' });
    const list = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(list).toHaveAttribute('inert');

    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(list).not.toHaveAttribute('inert');
    const actions = within(list).getAllByRole('menuitem');
    expect(actions.map((a) => a.getAttribute('aria-label'))).toEqual(['Add', 'Edit', 'Delete']);
    expect(actions[0]).toHaveFocus();

    await user.keyboard('{ArrowUp}'); // outward for an upward dial
    expect(actions[1]).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('PanelMenu', () => {
  it('expands sections as disclosures and supports arrow navigation', async () => {
    const user = userEvent.setup();
    render(
      <PanelMenu
        aria-label="Sections"
        model={[
          { label: 'Files', items: [{ label: 'Docs', items: [{ label: 'Report' }] }] },
          { label: 'Cloud', items: [{ label: 'Upload' }] },
        ]}
      />,
    );
    const files = screen.getByRole('button', { name: 'Files' });
    const cloud = screen.getByRole('button', { name: 'Cloud' });
    expect(files).toHaveAttribute('aria-expanded', 'false');
    await user.click(files);
    expect(files).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Files' })).toBeVisible();
    await user.keyboard('{ArrowDown}');
    const docs = screen.getByRole('button', { name: 'Docs' });
    expect(docs).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(docs).toHaveAttribute('aria-expanded', 'true');
    await user.click(cloud);
    expect(files).toHaveAttribute('aria-expanded', 'false'); // single-open by default
  });
});

describe('FocusTrap', () => {
  it('focuses the first element, keeps Tab inside and restores focus', async () => {
    const user = userEvent.setup();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    const { rerender } = render(
      <FocusTrap>
        <button type="button">One</button>
        <button type="button">Two</button>
      </FocusTrap>,
    );
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
    rerender(
      <FocusTrap active={false}>
        <button type="button">One</button>
      </FocusTrap>,
    );
    await act(async () => {});
    expect(outside).toHaveFocus();
    outside.remove();
  });
});

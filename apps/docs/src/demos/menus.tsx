import { useRef, useState } from 'react';
import {
  Breadcrumb,
  Button,
  ContextMenu,
  Dock,
  MegaMenu,
  Menu,
  Menubar,
  PanelMenu,
  SpeedDial,
  SplitButton,
  TieredMenu,
  type MenuHandle,
  type MenuItem,
} from '@pelagic-ui/react';
import { ClientOnly, createDemoIsland, Output } from './shared';

/** Each demo logs the last command so the menus visibly do something. */
function useLast(initial = 'none') {
  const [last, setLast] = useState(initial);
  const cmd = (label: string): MenuItem['command'] => () => setLast(label);
  return { last, cmd, setLast };
}

function MenuDemo() {
  const menu = useRef<MenuHandle>(null);
  const { last, cmd } = useLast();
  const model: MenuItem[] = [
    { label: 'Edit', icon: '✏️', shortcut: 'E', command: cmd('Edit') },
    { label: 'Duplicate', icon: '📄', shortcut: 'D', command: cmd('Duplicate') },
    { label: 'Share', icon: '🔗', command: cmd('Share'), badge: 'New' },
    { label: 'Archive (disabled)', icon: '🗄️', disabled: true },
    { separator: true },
    { label: 'Delete', icon: '🗑️', danger: true, command: cmd('Delete') },
  ];
  return (
    <>
      <div style={{ minWidth: '14rem' }}>
        <Menu aria-label="Inline actions" model={model} />
      </div>
      <div style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
        <Button onClick={(e) => menu.current?.toggle(e)} aria-haspopup="menu">
          Actions ▾
        </Button>
        <Menu ref={menu} popup aria-label="Actions" model={model} />
        <Output label="Last command">{last}</Output>
      </div>
    </>
  );
}

function MenubarDemo() {
  const { last, cmd, setLast } = useLast();
  return (
    <div className="demo-col">
      <ClientOnly fallback={<div style={{ minHeight: 48 }} />}>
      <Menubar
        aria-label="Editor"
        start={<strong style={{ paddingInline: '0.5rem' }}>Acme</strong>}
        end={<Button size="sm" variant="secondary" onClick={() => setLast('Sign in')}>Sign in</Button>}
        model={[
          { label: 'File', items: [{ label: 'New', shortcut: 'Ctrl+N', command: cmd('New') }, { label: 'Open…', shortcut: 'Ctrl+O', command: cmd('Open') }, { separator: true }, { label: 'Export', items: [{ label: 'PDF', command: cmd('Export PDF') }, { label: 'PNG', command: cmd('Export PNG') }] }] },
          { label: 'Edit', items: [{ label: 'Undo', shortcut: 'Ctrl+Z', command: cmd('Undo') }, { label: 'Redo', shortcut: 'Ctrl+Y', command: cmd('Redo') }] },
          { label: 'View', items: [{ label: 'Zoom in', command: cmd('Zoom in') }, { label: 'Zoom out', command: cmd('Zoom out') }] },
          { label: 'Help', command: cmd('Help') },
        ]}
      />
      </ClientOnly>
      <Output label="Last command">{last}</Output>
    </div>
  );
}

function TieredDemo() {
  const { last, cmd } = useLast();
  return (
    <>
      <div style={{ minWidth: '14rem' }}>
        <TieredMenu
          aria-label="Insert"
          model={[
            { label: 'Media', icon: '🖼️', items: [{ label: 'Image', command: cmd('Image') }, { label: 'Video', command: cmd('Video') }, { label: 'Audio', command: cmd('Audio') }] },
            { label: 'Table', icon: '▦', items: [{ label: '2 × 2', command: cmd('2×2 table') }, { label: '3 × 3', command: cmd('3×3 table') }, { label: 'Custom', items: [{ label: 'With header', command: cmd('Table with header') }] }] },
            { label: 'Divider', icon: '―', command: cmd('Divider') },
          ]}
        />
      </div>
      <Output label="Inserted">{last}</Output>
    </>
  );
}

function ContextDemo() {
  const area = useRef<HTMLDivElement>(null);
  const { last, cmd } = useLast();
  return (
    <div className="demo-col">
      <div
        ref={area}
        tabIndex={0}
        aria-label="report.pdf — right-click or press Shift+F10 for actions"
        style={{ display: 'grid', placeItems: 'center', minHeight: 120, border: '2px dashed var(--pl-border)', borderRadius: 'var(--pl-radius-lg)', background: 'var(--pl-surface)', cursor: 'context-menu' }}
      >
        📄 report.pdf — right-click here (or focus and press Shift+F10)
      </div>
      <ContextMenu
        targetRef={area}
        aria-label="File actions"
        model={[
          { label: 'Open', command: cmd('Open') },
          { label: 'Rename', shortcut: 'F2', command: cmd('Rename') },
          { label: 'Move to', items: [{ label: 'Documents', command: cmd('Move to Documents') }, { label: 'Archive', command: cmd('Move to Archive') }] },
          { separator: true },
          { label: 'Delete', danger: true, command: cmd('Delete') },
        ]}
      />
      <Output label="Last command">{last}</Output>
    </div>
  );
}

function MegaDemo() {
  const { last, cmd } = useLast();
  const col = (title: string, items: string[]): MenuItem[] => [{ label: title, items: items.map((l) => ({ label: l, command: cmd(l) })) }];
  return (
    <div className="demo-col">
      <MegaMenu
        aria-label="Site"
        model={[
          { label: 'Products', items: [col('Components', ['Forms', 'Data', 'Charts']), col('Themes', ['Light', 'Dark', 'High contrast']), col('Platforms', ['React', 'Vue', 'Svelte'])] },
          { label: 'Resources', items: [col('Learn', ['Docs', 'Tutorials']), col('Community', ['GitHub', 'Discussions'])] },
          { label: 'Pricing', command: cmd('Pricing') },
        ]}
      />
      <Output label="Picked">{last}</Output>
    </div>
  );
}

function PanelMenuDemo() {
  const { last, cmd } = useLast();
  return (
    <>
      <div style={{ minWidth: '16rem' }}>
        <PanelMenu
          aria-label="Settings"
          multiple
          defaultExpandedKeys={['account']}
          model={[
            { key: 'account', label: 'Account', icon: '👤', items: [{ label: 'Profile', command: cmd('Profile') }, { label: 'Security', command: cmd('Security') }] },
            { key: 'billing', label: 'Billing', icon: '💳', items: [{ label: 'Invoices', command: cmd('Invoices') }, { label: 'Payment methods', command: cmd('Payment methods') }] },
            { key: 'team', label: 'Team', icon: '👥', items: [{ label: 'Members', command: cmd('Members') }, { label: 'Roles', items: [{ label: 'Admins', command: cmd('Admins') }] }] },
          ]}
        />
      </div>
      <Output label="Opened">{last}</Output>
    </>
  );
}

function DockDemo() {
  const { last, cmd } = useLast();
  return (
    <div className="demo-col" style={{ alignItems: 'center', justifyItems: 'center' }}>
      <Dock
        aria-label="Apps"
        model={[
          { label: 'Files', icon: '📁', command: cmd('Files') },
          { label: 'Mail', icon: '✉️', command: cmd('Mail') },
          { label: 'Calendar', icon: '📅', command: cmd('Calendar') },
          { label: 'Music', icon: '🎵', command: cmd('Music') },
          { label: 'Photos', icon: '🖼️', command: cmd('Photos') },
          { label: 'Settings', icon: '⚙️', command: cmd('Settings') },
        ]}
      />
      <Output label="Launched">{last}</Output>
    </div>
  );
}

function SplitDemo() {
  const { last, cmd, setLast } = useLast();
  return (
    <>
      <SplitButton
        label="Save"
        onClick={() => setLast('Save')}
        model={[
          { label: 'Save as draft', command: cmd('Save as draft') },
          { label: 'Save and publish', command: cmd('Save and publish') },
          { separator: true },
          { label: 'Discard changes', danger: true, command: cmd('Discard') },
        ]}
      />
      <SplitButton label="Export" variant="secondary" size="sm" model={[{ label: 'CSV', command: cmd('CSV') }, { label: 'Excel', command: cmd('Excel') }]} onClick={() => setLast('Export PDF')} />
      <Output label="Last action">{last}</Output>
    </>
  );
}

function SpeedDialDemo() {
  const { last, cmd } = useLast();
  const model: MenuItem[] = [
    { label: 'Note', icon: '📝', command: cmd('Note') },
    { label: 'Photo', icon: '📷', command: cmd('Photo') },
    { label: 'Link', icon: '🔗', command: cmd('Link') },
    { label: 'Task', icon: '✅', command: cmd('Task') },
  ];
  return (
    <div className="demo-col">
      <div style={{ display: 'flex', gap: '6rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', minHeight: 230, paddingBlock: '1rem' }}>
        <SpeedDial aria-label="Create (linear)" direction="up" model={model} />
        <SpeedDial aria-label="Create (circle)" type="circle" radius={80} model={model} />
        <SpeedDial aria-label="Create (semi-circle)" type="semi-circle" direction="up" radius={80} model={model} />
      </div>
      <Output label="Created">{last}</Output>
    </div>
  );
}

function BreadcrumbDemo() {
  return <Breadcrumb label="Breadcrumb demo" items={[{ label: 'Home', href: '#breadcrumb' }, { label: 'Projects', href: '#breadcrumb' }, { label: 'Website redesign', href: '#breadcrumb' }, { label: 'Settings' }]} />;
}

export default createDemoIsland(
  {
    menu: MenuDemo,
    menubar: MenubarDemo,
    tieredmenu: TieredDemo,
    contextmenu: ContextDemo,
    megamenu: MegaDemo,
    panelmenu: PanelMenuDemo,
    dock: DockDemo,
    splitbutton: SplitDemo,
    speeddial: SpeedDialDemo,
    breadcrumb: BreadcrumbDemo,
  },
  ['menubar', 'contextmenu', 'megamenu', 'speeddial'],
);

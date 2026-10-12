import type { CategoryDoc } from './types';

const menuKeys: [string, string][] = [
  ['Arrow Down / Arrow Up', 'Next / previous item'],
  ['Home / End', 'First / last item'],
  ['Enter / Space', 'Activate the item'],
  ['Escape', 'Close and return focus to the trigger'],
];

export const menus: CategoryDoc = {
  slug: 'menus',
  nav: 'Menus',
  icon: '☰',
  title: 'Menu components — Menubar, MegaMenu, ContextMenu, SplitButton, SpeedDial, Dock',
  h1: 'Menus & navigation',
  description:
    'Accessible menu components with live demos: Menu, Menubar, TieredMenu, ContextMenu, MegaMenu, PanelMenu, Dock, SplitButton, SpeedDial and Breadcrumb — WAI-ARIA menu pattern, RTL aware.',
  intro:
    'All menus share one MenuItem model (label, icon, command, url, items, separator, shortcut). They follow the WAI-ARIA menu and menubar patterns, with type-ahead and arrow keys that mirror in right-to-left layouts.',
  entries: [
    {
      id: 'menu',
      name: 'Menu',
      description: 'A list of commands, inline or as a popup attached to a button.',
      props: [
        ['model', 'MenuItem[]', 'Items: { label, icon?, command?, url?, separator?, shortcut?, danger? }.'],
        ['popup', 'boolean', 'Render as a floating menu opened through the ref.'],
        ['ref.toggle(event)', 'MenuHandle', 'Open / close next to event.currentTarget.'],
        ['side / align', 'FloatingSide / FloatingAlign', 'Placement (logical, flips at edges).'],
      ],
      keys: [...menuKeys, ['A–Z', 'Jump to the next item starting with that letter']],
      a11y: 'role="menu" with menuitems; disabled items stay focusable but cannot be activated.',
      code: {
        react: `const menu = useRef<MenuHandle>(null);
<Button onClick={(e) => menu.current?.toggle(e)} aria-haspopup="menu">Actions</Button>
<Menu ref={menu} popup aria-label="Actions" model={[
  { label: 'Edit', icon: '✏️', shortcut: 'E', command: () => edit() },
  { separator: true },
  { label: 'Delete', icon: '🗑️', danger: true, command: () => remove() },
]} />`,
      },
    },
    {
      id: 'menubar',
      name: 'Menubar',
      description: 'A horizontal application menu with nested submenus that collapses into a toggle on small screens.',
      props: [
        ['model', 'MenuItem[]', 'Top-level items with optional nested items.'],
        ['start / end', 'ReactNode', 'Content before / after the menu (logo, search).'],
        ['breakpoint', 'number', 'Width (px) below which it collapses.'],
        ['aria-label', 'string', 'Accessible name.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Move between top-level items (mirrored in RTL)'],
        ['Arrow Down', 'Open the submenu'],
        ['Home / End', 'First / last item'],
        ['Escape', 'Close the submenu'],
      ],
      code: {
        react: `<Menubar aria-label="Main" start={<strong>Acme</strong>} model={[
  { label: 'File', items: [{ label: 'New', shortcut: '⌘N' }, { label: 'Open…' }] },
  { label: 'Edit', items: [{ label: 'Undo' }, { label: 'Redo' }] },
  { label: 'Help', url: '/help' },
]} />`,
      },
    },
    {
      id: 'tieredmenu',
      name: 'TieredMenu',
      description: 'A vertical menu whose items open nested submenus to the side.',
      props: [
        ['model', 'MenuItem[]', 'Items with nested items.'],
        ['popup', 'boolean', 'Floating mode (same handle as Menu).'],
      ],
      keys: [...menuKeys, ['Arrow Right / Arrow Left', 'Open / close a submenu (mirrored in RTL)']],
      code: {
        react: `<TieredMenu aria-label="Insert" model={[
  { label: 'Media', items: [{ label: 'Image' }, { label: 'Video' }] },
  { label: 'Table', items: [{ label: '2 × 2' }, { label: '3 × 3' }] },
]} />`,
      },
    },
    {
      id: 'contextmenu',
      name: 'ContextMenu',
      description: 'A menu that opens on right-click (or the context-menu key) over a target area.',
      props: [
        ['model', 'MenuItem[]', 'Items.'],
        ['targetRef', 'RefObject<HTMLElement>', 'Element that opens the menu.'],
        ['ref.show(event)', 'ContextMenuHandle', 'Open programmatically.'],
        ['onShow / onHide', '() => void', 'Callbacks.'],
      ],
      keys: [['Shift + F10 / Menu key', 'Open the menu for the focused target'], ...menuKeys],
      code: {
        react: `const area = useRef<HTMLDivElement>(null);
<div ref={area} tabIndex={0}>Right-click me</div>
<ContextMenu targetRef={area} aria-label="File actions"
  model={[{ label: 'Rename' }, { label: 'Duplicate' }, { label: 'Delete', danger: true }]} />`,
      },
    },
    {
      id: 'megamenu',
      name: 'MegaMenu',
      description: 'Large dropdown panels arranged in columns, for sites with many destinations.',
      props: [
        ['model', 'MegaMenuItem[]', 'Top items; items is an array of columns (MenuItem[][]).'],
        ['orientation', "'horizontal' | 'vertical'", 'Layout.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Move between top items'],
        ['Arrow Down / Arrow Up', 'Move within a panel'],
        ['Escape', 'Close the panel'],
      ],
      code: {
        react: `<MegaMenu aria-label="Products" model={[
  { label: 'Products', items: [
    [{ label: 'Components', items: [{ label: 'Forms' }, { label: 'Charts' }] }],
    [{ label: 'Resources', items: [{ label: 'Docs' }, { label: 'Blog' }] }],
  ] },
]} />`,
      },
    },
    {
      id: 'panelmenu',
      name: 'PanelMenu',
      description: 'An accordion-style navigation menu with nested groups.',
      props: [
        ['model', 'MenuItem[]', 'Groups with nested items.'],
        ['multiple', 'boolean', 'Allow several groups open.'],
        ['defaultExpandedKeys', 'string[]', 'Initially open groups (by item key).'],
      ],
      keys: [
        ['Arrow Down / Arrow Up', 'Move between items'],
        ['Arrow Right / Arrow Left', 'Expand / collapse a group'],
        ['Home / End', 'First / last item'],
        ['Enter / Space', 'Activate'],
      ],
      code: {
        react: `<PanelMenu aria-label="Settings" multiple model={[
  { key: 'account', label: 'Account', items: [{ label: 'Profile' }, { label: 'Security' }] },
  { key: 'billing', label: 'Billing', items: [{ label: 'Invoices' }] },
]} />`,
      },
    },
    {
      id: 'dock',
      name: 'Dock',
      description: 'A macOS-style launcher with icon magnification.',
      props: [
        ['model', 'MenuItem[]', 'Items; icon is required, label is the accessible name.'],
        ['position', "'bottom' | 'top' | 'start' | 'end'", 'Edge.'],
        ['magnification', 'boolean', 'Enlarge hovered / focused items (off under reduced motion).'],
      ],
      keys: [
        ['Tab', 'Move between items'],
        ['Enter', 'Activate'],
      ],
      a11y: 'A labelled navigation landmark; icons are hidden and each item is named by its label.',
      code: {
        react: `<Dock aria-label="Apps" model={[
  { label: 'Finder', icon: '📁' }, { label: 'Mail', icon: '✉️' }, { label: 'Music', icon: '🎵' },
]} />`,
      },
    },
    {
      id: 'splitbutton',
      name: 'SplitButton',
      description: 'A primary action with a menu of related secondary actions.',
      props: [
        ['label / onClick', 'ReactNode / handler', 'Main action.'],
        ['model', 'MenuItem[]', 'Secondary actions.'],
        ['variant / size', 'ButtonVariant / ButtonSize', 'Same as Button.'],
        ['menuButtonLabel', 'string', 'Accessible name of the arrow button.'],
      ],
      keys: [
        ['Enter / Space', 'Run the main action'],
        ['Arrow Down (on the arrow button)', 'Open the menu'],
      ],
      code: {
        react: `<SplitButton label="Save" onClick={save} model={[
  { label: 'Save as draft', command: saveDraft },
  { label: 'Save and publish', command: publish },
]} />`,
      },
    },
    {
      id: 'speeddial',
      name: 'SpeedDial',
      description: 'A floating action button that fans out related actions in a line or circle.',
      props: [
        ['model', 'MenuItem[]', 'Actions (icon + label).'],
        ['direction', "'up' | 'down' | 'start' | 'end' | …", 'Line direction.'],
        ['type', "'linear' | 'circle' | 'semi-circle' | 'quarter-circle'", 'Layout.'],
        ['radius', 'number', 'Radius for circular types.'],
      ],
      keys: [
        ['Enter / Space', 'Open / close'],
        ['Arrow keys', 'Move between actions'],
        ['Escape', 'Close and focus the button'],
      ],
      code: {
        react: `<SpeedDial aria-label="Create" direction="up" model={[
  { label: 'Note', icon: '📝' }, { label: 'Photo', icon: '📷' }, { label: 'Link', icon: '🔗' },
]} />`,
      },
    },
    {
      id: 'breadcrumb',
      name: 'Breadcrumb',
      description: 'Shows where the current page sits in the site hierarchy.',
      props: [['items', '{ label, href? }[]', 'Trail; the last item is the current page.']],
      a11y: 'A navigation landmark labelled “Breadcrumb”; the last item has aria-current="page".',
      code: {
        react: `<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Projects', href: '/projects' }, { label: 'Orca UI' }]} />`,
        vue: `<Breadcrumb :items="trail" />`,
        svelte: `<Breadcrumb items={trail} />`,
        astro: `<Breadcrumb items={trail} />`,
        rn: `<Breadcrumb items={[{ label: 'Home', onPress: goHome }, { label: 'Orca UI' }]} />`,
      },
    },
  ],
};

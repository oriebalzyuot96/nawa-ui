import type { CategoryDoc } from './types';
import { snippets } from '../snippets';

export const overlays: CategoryDoc = {
  slug: 'overlays',
  nav: 'Overlays',
  icon: '🪟',
  title: 'Overlay components — Dialog, Drawer, Popover, ConfirmDialog, Tooltip, BlockUI',
  h1: 'Overlays & utilities',
  description:
    'Accessible overlays with live demos: Dialog, Drawer, Tooltip, Popover, ConfirmDialog, ConfirmPopup, dynamic dialogs, BlockUI, ScrollTop, Inplace, FocusTrap, AnimateOnScroll and Ripple.',
  intro:
    'Layers that sit above the page. Modal overlays trap focus, close with Escape and return focus to the control that opened them; non-modal ones dismiss on outside click.',
  entries: [
    {
      id: 'dialog',
      name: 'Dialog',
      description: 'A modal window for focused tasks and decisions.',
      props: [
        ['open', 'boolean', 'Visibility (controlled).'],
        ['title', 'ReactNode', 'Heading; names the dialog.'],
        ['onClose', '() => void', 'Escape, close button or backdrop.'],
        ['footer', 'ReactNode', 'Action buttons.'],
        ['size', "'sm' | 'md' | 'lg'", 'Width.'],
        ['closeOnBackdrop', 'boolean', 'Close when the backdrop is clicked.'],
      ],
      keys: [
        ['Tab / Shift + Tab', 'Cycle focus inside the dialog'],
        ['Escape', 'Close and return focus to the trigger'],
      ],
      a11y: 'role="dialog" with aria-modal and aria-labelledby; the page behind cannot scroll.',
      code: snippets.dialog!,
    },
    {
      id: 'drawer',
      name: 'Drawer',
      description: 'A panel that slides in from the start or end edge.',
      props: [
        ['open / onClose', 'boolean / () => void', 'Visibility.'],
        ['title', 'ReactNode', 'Heading.'],
        ['side', "'left' | 'right'", 'Edge to slide from.'],
        ['footer', 'ReactNode', 'Actions.'],
      ],
      keys: [
        ['Tab / Shift + Tab', 'Cycle focus inside the drawer'],
        ['Escape', 'Close'],
      ],
      code: {
        react: `<Drawer open={open} title="Filters" onClose={() => setOpen(false)}>
  <Checkbox label="Only active members" />
</Drawer>`,
        vue: `<Drawer :open="open" title="Filters" @close="open = false">…</Drawer>`,
        svelte: `<Drawer {open} title="Filters" onclose={() => (open = false)}>…</Drawer>`,
        astro: `<Button data-pl-open="filters">Filters</Button>
<Drawer id="filters" title="Filters">…</Drawer>`,
        rn: `<Drawer visible={open} title="Filters" onClose={() => setOpen(false)}>…</Drawer>`,
      },
    },
    {
      id: 'tooltip',
      name: 'Tooltip',
      description: 'A short hint shown on hover and keyboard focus.',
      props: [
        ['text', 'string', 'Tooltip content.'],
        ['placement', "'top' | 'bottom'", 'Position.'],
        ['children', 'ReactElement', 'The trigger; receives aria-describedby.'],
      ],
      keys: [
        ['Tab', 'Focus the trigger to show the tooltip'],
        ['Escape', 'Hide it without moving focus'],
      ],
      a11y: 'role="tooltip" linked with aria-describedby. Never put interactive content in a tooltip — use Popover.',
      code: {
        react: `<Tooltip text="Copy link to clipboard"><Button>Copy link</Button></Tooltip>`,
        vue: `<Tooltip text="Copy link to clipboard"><Button>Copy link</Button></Tooltip>`,
        svelte: `<Tooltip text="Copy link to clipboard">
  {#snippet children(attrs)}<Button {...attrs}>Copy link</Button>{/snippet}
</Tooltip>`,
        astro: `<Tooltip text="Copy link to clipboard"><Button>Copy link</Button></Tooltip>`,
      },
    },
    {
      id: 'popover',
      name: 'Popover',
      description: 'A non-modal floating panel anchored to a trigger, for interactive content.',
      props: [
        ['trigger', 'ReactElement', 'Gets onClick, aria-expanded, aria-controls and aria-haspopup.'],
        ['open / onOpenChange', 'boolean', 'Controlled visibility.'],
        ['role', "'dialog' | 'group'", 'dialog for interactive content.'],
        ['showCloseIcon / dismissable', 'boolean', 'Close button / close on outside click.'],
        ['side / align', "'top' | 'bottom' / 'start' | 'center' | 'end'", 'Placement; flips when there is no room.'],
      ],
      keys: [
        ['Enter / Space', 'Open from the trigger'],
        ['Escape', 'Close and return focus to the trigger'],
      ],
      code: {
        react: `<Popover aria-label="Share" showCloseIcon trigger={<Button>Share</Button>}>
  <Input label="Link" readOnly value="https://…" />
</Popover>`,
      },
    },
    {
      id: 'confirmdialog',
      name: 'ConfirmDialog',
      description: 'An alert dialog that asks the user to confirm, via a component or the useConfirm() hook.',
      props: [
        ['ConfirmProvider', 'component', 'Wrap your app once.'],
        ['useConfirm().confirm(options)', 'Promise<boolean>', 'Resolves true on accept.'],
        ['message / header', 'ReactNode', 'Content.'],
        ['severity', "'danger' | 'warning' | 'info' | 'success'", 'Icon and accept-button style.'],
        ['acceptLabel / rejectLabel / defaultFocus', 'string', 'Buttons; focus starts on reject by default.'],
      ],
      keys: [
        ['Tab', 'Move between the buttons'],
        ['Escape', 'Reject and close'],
      ],
      a11y: 'role="alertdialog"; focus starts on the safe (reject) action so Enter never deletes by accident.',
      code: {
        react: `function DeleteButton() {
  const { confirm } = useConfirm();
  return <Button variant="danger" onClick={async () => {
    if (await confirm({ header: 'Delete project?', message: 'This cannot be undone.', severity: 'danger', acceptLabel: 'Delete' })) remove();
  }}>Delete</Button>;
}

<ConfirmProvider><DeleteButton /></ConfirmProvider>`,
      },
    },
    {
      id: 'confirmpopup',
      name: 'ConfirmPopup',
      description: 'A lightweight confirmation anchored to the button that triggered it.',
      props: [
        ['target', 'HTMLElement | null', 'Anchor element.'],
        ['open', 'boolean', 'Visibility.'],
        ['message / onAccept / onReject', '…', 'Same options as ConfirmDialog.'],
        ['confirm({ target })', 'useConfirm', 'Pass a target to get a popup instead of a dialog.'],
      ],
      keys: [['Escape', 'Reject and close']],
      code: {
        react: `const { confirm } = useConfirm();
<Button onClick={(e) => confirm({ target: e.currentTarget, message: 'Archive this item?' })}>Archive</Button>`,
      },
    },
    {
      id: 'dynamicdialog',
      name: 'DialogProvider / useDialog',
      description: 'Open any component in a dialog from code and await its result.',
      props: [
        ['DialogProvider', 'component', 'Wrap your app once.'],
        ['useDialog().open(Component, options)', 'DynamicDialogRef', 'Opens a dialog; ref.result resolves on close.'],
        ['options', '{ header, data?, footer?, size?, closable? }', 'Dialog settings.'],
        ['Component props', '{ data, dialogRef }', 'Call dialogRef.close(value) to return a value.'],
      ],
      keys: [['Escape', 'Close (when closable)']],
      code: {
        react: `function PickColor({ dialogRef }: DynamicDialogContentProps<void, string>) {
  return <Button onClick={() => dialogRef.close('teal')}>Teal</Button>;
}
const { open } = useDialog();
const color = await open(PickColor, { header: 'Pick a colour' }).result;`,
      },
    },
    {
      id: 'blockui',
      name: 'BlockUI',
      description: 'Blocks interaction with a region (or the whole page) while work is in progress.',
      props: [
        ['blocked', 'boolean', 'Block state.'],
        ['fullScreen', 'boolean', 'Block the whole document.'],
        ['label / spinner', 'string / boolean', 'Status text and spinner.'],
        ['template', 'ReactNode', 'Custom mask content.'],
      ],
      a11y: 'Blocked content is made inert and aria-busy, so it cannot be focused or clicked; the label is announced.',
      code: {
        react: `<BlockUI blocked={saving} label="Saving…">
  <Card title="Profile">…</Card>
</BlockUI>`,
      },
    },
    {
      id: 'scrolltop',
      name: 'ScrollTop',
      description: 'A button that appears after scrolling and returns to the top.',
      props: [
        ['target', "'window' | RefObject<HTMLElement>", 'What to watch and scroll.'],
        ['threshold', 'number', 'Pixels before it appears. Default 400.'],
        ['label', 'string', 'Accessible name.'],
        ['behavior', 'ScrollBehavior', 'smooth (instant under reduced motion).'],
      ],
      keys: [['Enter / Space', 'Scroll to top']],
      code: {
        react: `<ScrollTop />                       {/* window */}
<div ref={box} style={{ overflow: 'auto', height: 240 }}>
  …
  <ScrollTop target={box} threshold={100} />
</div>`,
      },
    },
    {
      id: 'inplace',
      name: 'Inplace',
      description: 'Shows a read-only value that turns into an editor when activated.',
      props: [
        ['display', 'ReactNode', 'What shows when inactive.'],
        ['children', 'ReactNode | (close) => ReactNode', 'Editor content.'],
        ['active / onActiveChange', 'boolean', 'Controlled state.'],
        ['closable', 'boolean', 'Adds a close button.'],
      ],
      keys: [
        ['Enter / Space', 'Activate'],
        ['Escape', 'Close and return focus to the display button'],
      ],
      code: {
        react: `<Inplace display={name} closable>
  {(close) => <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} onBlur={close} />}
</Inplace>`,
      },
    },
    {
      id: 'focustrap',
      name: 'FocusTrap',
      description: 'Keeps keyboard focus inside a region while it is active.',
      props: [
        ['active', 'boolean', 'Trap on / off.'],
        ['autoFocus', 'boolean', 'Focus the first focusable element.'],
        ['restoreFocus', 'boolean', 'Return focus when deactivated.'],
        ['as', 'ElementType', 'Wrapper element.'],
      ],
      keys: [['Tab / Shift + Tab', 'Wrap around inside the region']],
      code: {
        react: `<FocusTrap active={editing}>
  <Input label="Title" /> <Button onClick={() => setEditing(false)}>Done</Button>
</FocusTrap>`,
      },
    },
    {
      id: 'animateonscroll',
      name: 'AnimateOnScroll',
      description: 'Reveals content with an animation when it scrolls into view.',
      props: [
        ['enterClass', 'string', 'Class added when visible.'],
        ['once', 'boolean', 'Animate only the first time.'],
        ['threshold / rootMargin', 'number / string', 'IntersectionObserver options.'],
        ['as', 'ElementType', 'Wrapper element.'],
      ],
      a11y: 'Content is in the DOM from the start and simply appears when prefers-reduced-motion is set.',
      code: {
        react: `<AnimateOnScroll>
  <Card title="Fades in">…</Card>
</AnimateOnScroll>`,
      },
    },
    {
      id: 'ripple',
      name: 'Ripple',
      description: 'An ink-ripple effect for any clickable element, as a component or hook.',
      props: [
        ['<Ripple />', 'component', 'Drop inside the element: <button>Save<Ripple /></button>.'],
        ['useRipple(enabled?)', 'RefObject', 'Attach to an element ref instead.'],
      ],
      a11y: 'Purely decorative (aria-hidden) and disabled under prefers-reduced-motion.',
      code: {
        react: `<button className="pl-btn pl-btn--primary">Save<Ripple /></button>

const ref = useRipple<HTMLDivElement>();
<div ref={ref} className="tile">Click me</div>`,
      },
    },
  ],
};

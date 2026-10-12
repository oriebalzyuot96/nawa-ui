import { useRef, useState } from 'react';
import {
  AnimateOnScroll,
  BlockUI,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  ConfirmPopup,
  ConfirmProvider,
  Dialog,
  DialogProvider,
  Drawer,
  FocusTrap,
  Inplace,
  Input,
  Popover,
  Ripple,
  ScrollTop,
  Select,
  Tooltip,
  useConfirm,
  useDialog,
  useRipple,
  type DynamicDialogContentProps,
} from '@orca-ui/react';
import { createDemoIsland, Output, Row } from './shared';

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState('—');
  const close = (r: string) => {
    setResult(r);
    setOpen(false);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)} aria-haspopup="dialog">
        Delete project…
      </Button>
      <Output label="Result">{result}</Output>
      <Dialog
        open={open}
        title="Delete project?"
        onClose={() => close('dismissed')}
        footer={
          <>
            <Button variant="ghost" onClick={() => close('cancelled')}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => close('deleted')}>
              Delete
            </Button>
          </>
        }
      >
        This permanently removes “Website redesign” and its 24 files.
      </Dialog>
    </>
  );
}

function DrawerDemo() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(true);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Open filters
      </Button>
      <Drawer
        open={open}
        title="Filters"
        onClose={() => setOpen(false)}
        footer={<Button onClick={() => setOpen(false)}>Apply</Button>}
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Select label="Team" options={[{ label: 'All teams', value: '' }, { label: 'Design', value: 'd' }, { label: 'Engineering', value: 'e' }]} />
          <Checkbox label="Only active members" checked={active} onChange={(e) => setActive(e.target.checked)} />
        </div>
      </Drawer>
    </>
  );
}

function TooltipDemo() {
  return (
    <>
      <Tooltip text="Copy link to clipboard">
        <Button variant="secondary">Copy link</Button>
      </Tooltip>
      <Tooltip text="Opens in a new tab" placement="bottom">
        <Button variant="ghost">Docs</Button>
      </Tooltip>
    </>
  );
}

function PopoverDemo() {
  const [copied, setCopied] = useState(false);
  return (
    <Popover
      aria-label="Share project"
      showCloseIcon
      trigger={<Button>Share…</Button>}
      onOpenChange={(o) => !o && setCopied(false)}
    >
      <div style={{ display: 'grid', gap: '0.75rem', minWidth: '16rem' }}>
        <strong>Share “Website redesign”</strong>
        <Input label="Link" readOnly value="https://orca.dev/p/42" />
        <Button size="sm" onClick={() => setCopied(true)}>
          {copied ? 'Copied ✓' : 'Copy link'}
        </Button>
      </div>
    </Popover>
  );
}

function ConfirmInner() {
  const { confirm } = useConfirm();
  const [result, setResult] = useState('—');
  return (
    <>
      <Button
        variant="danger"
        onClick={async () => {
          const ok = await confirm({ header: 'Delete project?', message: 'This cannot be undone.', severity: 'danger', acceptLabel: 'Delete', rejectLabel: 'Keep' });
          setResult(ok ? 'deleted' : 'kept');
        }}
      >
        Delete with useConfirm()
      </Button>
      <Output label="Result">{result}</Output>
    </>
  );
}

function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);
  const [r, setR] = useState('—');
  return (
    <>
      <ConfirmProvider>
        <ConfirmInner />
      </ConfirmProvider>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Component API
      </Button>
      <ConfirmDialog
        open={open}
        header="Publish changes?"
        message="Your site will update for everyone."
        severity="info"
        acceptLabel="Publish"
        onAccept={() => {
          setR('published');
          setOpen(false);
        }}
        onReject={() => {
          setR('not published');
          setOpen(false);
        }}
      />
      <Output label="Component">{r}</Output>
    </>
  );
}

function ConfirmPopupInner() {
  const { confirm } = useConfirm();
  const [r, setR] = useState('—');
  return (
    <>
      <Button
        variant="secondary"
        onClick={async (e) => {
          const ok = await confirm({ target: e.currentTarget, message: 'Archive this item?', acceptLabel: 'Archive', severity: 'warning' });
          setR(ok ? 'archived' : 'cancelled');
        }}
      >
        Archive
      </Button>
      <Output label="Result">{r}</Output>
    </>
  );
}

function ConfirmPopupDemo() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [r, setR] = useState('—');
  return (
    <>
      <ConfirmProvider>
        <ConfirmPopupInner />
      </ConfirmProvider>
      <Button variant="ghost" onClick={(e) => setTarget(e.currentTarget)}>
        Remove (component)
      </Button>
      <ConfirmPopup
        open={!!target}
        target={target}
        message="Remove this member?"
        severity="danger"
        acceptLabel="Remove"
        onAccept={() => {
          setR('removed');
          setTarget(null);
        }}
        onReject={() => {
          setR('kept');
          setTarget(null);
        }}
      />
      <Output label="Component">{r}</Output>
    </>
  );
}

function ColorChooser({ data, dialogRef }: DynamicDialogContentProps<{ current: string }, string>) {
  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <p style={{ margin: 0 }}>Current: {data.current}</p>
      <Row>
        {['Violet', 'Teal', 'Rose', 'Amber'].map((c) => (
          <Button key={c} variant="secondary" onClick={() => dialogRef.close(c)}>
            {c}
          </Button>
        ))}
      </Row>
    </div>
  );
}

function DynamicInner() {
  const { open } = useDialog();
  const [color, setColor] = useState('Violet');
  return (
    <>
      <Button
        onClick={async () => {
          const picked = await open(ColorChooser, { header: 'Pick an accent', data: { current: color }, size: 'sm' }).result;
          if (picked) setColor(picked);
        }}
      >
        Choose accent…
      </Button>
      <Output label="Accent">{color}</Output>
    </>
  );
}

function DynamicDialogDemo() {
  return (
    <DialogProvider>
      <DynamicInner />
    </DialogProvider>
  );
}

function BlockUIDemo() {
  const [blocked, setBlocked] = useState(false);
  const save = () => {
    setBlocked(true);
    window.setTimeout(() => setBlocked(false), 2000);
  };
  return (
    <div className="demo-col" style={{ maxWidth: '28rem' }}>
      <BlockUI blocked={blocked} label="Saving profile…">
        <Card title="Profile">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <Input label="Display name" defaultValue="Lina Haddad" />
            <Button onClick={save}>Save (blocks for 2s)</Button>
          </div>
        </Card>
      </BlockUI>
    </div>
  );
}

function ScrollTopDemo() {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className="demo-col">
      <div ref={box} tabIndex={0} role="region" aria-label="Scrollable changelog" style={{ position: 'relative', height: 200, overflow: 'auto', padding: '0.75rem', border: '1px solid var(--oc-border)', borderRadius: 'var(--oc-radius)', background: 'var(--oc-surface)' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i} style={{ margin: '0 0 0.5rem' }}>
            v0.{30 - i}.0 — improvements and fixes. Scroll down to reveal the button.
          </p>
        ))}
        <ScrollTop target={box} threshold={120} />
      </div>
    </div>
  );
}

function InplaceDemo() {
  const [name, setName] = useState('Website redesign');
  return (
    <>
      <span className="muted">Project:</span>
      <Inplace display={name} closable aria-label="Edit project name">
        {(close) => (
          <Input
            aria-label="Project name"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && close()}
          />
        )}
      </Inplace>
    </>
  );
}

function FocusTrapDemo() {
  const [active, setActive] = useState(false);
  return (
    <div className="demo-col" style={{ maxWidth: '28rem' }}>
      <Button variant={active ? 'secondary' : 'primary'} onClick={() => setActive(true)} disabled={active}>
        {active ? 'Trap active — press Tab' : 'Activate focus trap'}
      </Button>
      <FocusTrap active={active} className="focus-demo">
        <div style={{ display: 'grid', gap: '0.75rem', padding: '1rem', border: `2px ${active ? 'solid var(--oc-primary)' : 'dashed var(--oc-border)'}`, borderRadius: 'var(--oc-radius)' }}>
          <Input label="Title" />
          <Input label="Tag" />
          <Button onClick={() => setActive(false)}>Done (release trap)</Button>
        </div>
      </FocusTrap>
    </div>
  );
}

function AnimateDemo() {
  const [round, setRound] = useState(0);
  return (
    <div className="demo-col">
      <Button size="sm" variant="secondary" onClick={() => setRound((r) => r + 1)}>
        Replay
      </Button>
      <div key={round} style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))' }}>
        {['Plan', 'Design', 'Build'].map((t) => (
          <AnimateOnScroll key={t} once={false}>
            <Card title={t}>Appears as it scrolls into view.</Card>
          </AnimateOnScroll>
        ))}
      </div>
    </div>
  );
}

function RippleDemo() {
  const ref = useRipple<HTMLButtonElement>();
  return (
    <>
      <button type="button" className="oc-btn oc-btn--primary" style={{ position: 'relative', overflow: 'hidden' }}>
        Click me
        <Ripple />
      </button>
      <button
        ref={ref}
        type="button"
        style={{ border: 'none', font: 'inherit', position: 'relative', overflow: 'hidden', padding: '1.25rem 2rem', borderRadius: 'var(--oc-radius-lg)', background: 'var(--oc-primary-soft)', color: 'var(--oc-primary-ink)', fontWeight: 700, cursor: 'pointer' }}
      >
        Tile with useRipple()
      </button>
    </>
  );
}

export default createDemoIsland(
  {
    dialog: DialogDemo,
    drawer: DrawerDemo,
    tooltip: TooltipDemo,
    popover: PopoverDemo,
    confirmdialog: ConfirmDialogDemo,
    confirmpopup: ConfirmPopupDemo,
    dynamicdialog: DynamicDialogDemo,
    blockui: BlockUIDemo,
    scrolltop: ScrollTopDemo,
    inplace: InplaceDemo,
    focustrap: FocusTrapDemo,
    animateonscroll: AnimateDemo,
    ripple: RippleDemo,
  },
  ['blockui', 'scrolltop', 'focustrap', 'animateonscroll'],
);

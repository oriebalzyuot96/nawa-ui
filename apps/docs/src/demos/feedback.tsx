import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LOADER_TYPES,
  Loader,
  LoaderOverlay,
  Message,
  PageLoader,
  ProgressBar,
  Select,
  SkeletonCard,
  SkeletonText,
  Skeleton,
  Spinner,
  SwalHost,
  Toast,
  Toaster,
  TopProgressBar,
  swal,
  toast,
  topProgress,
  useAsyncAction,
  type LoaderType,
  type ToastItem,
  type ToasterPosition,
} from '@orca-ui/react';
import { createDemoIsland, Output, Row, SwitchField } from './shared';

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function AlertDemo() {
  const [shown, setShown] = useState(true);
  return (
    <div className="demo-col">
      <Alert title="Heads up">Your trial ends in 3 days.</Alert>
      <Alert variant="success" title="Published">
        Your site is live.
      </Alert>
      <Alert variant="warning" title="Storage almost full">
        You have used 92% of your space.
      </Alert>
      {shown ? (
        <Alert variant="danger" title="Payment failed" onClose={() => setShown(false)}>
          Update your card to keep your plan.
        </Alert>
      ) : (
        <div>
          <Button size="sm" variant="secondary" onClick={() => setShown(true)}>
            Show the dismissed alert
          </Button>
        </div>
      )}
    </div>
  );
}

function MessageDemo() {
  return (
    <div className="demo-col">
      <Message severity="info" text="A new version is available." />
      <Message severity="success" closable>
        Profile saved.
      </Message>
      <Message severity="warn" text="Your session expires in 5 minutes." />
      <Message severity="error" text="Card number is incomplete." />
    </div>
  );
}

function SwalDemo() {
  const [result, setResult] = useState('—');
  const confirmDelete = async () => {
    const r = await swal.fire({
      icon: 'warning',
      title: 'Delete “Q3 report.pdf”?',
      text: 'You can’t undo this.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Keep it',
      focusCancel: true,
    });
    setResult(r.isConfirmed ? 'deleted' : `dismissed (${r.dismiss ?? 'cancel'})`);
    if (r.isConfirmed) void swal.success('Deleted', 'The file is gone.', { timer: 2000, timerProgressBar: true });
  };
  const prompt = async () => {
    const r = await swal.fire<string>({
      title: 'Join the newsletter',
      input: 'email',
      inputLabel: 'Email address',
      inputPlaceholder: 'you@example.com',
      showCancelButton: true,
      confirmButtonText: 'Subscribe',
      inputValidator: (v) => (typeof v === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? undefined : 'Enter a valid email address'),
      preConfirm: async (v) => {
        await wait(800);
        return v;
      },
    });
    setResult(r.isConfirmed ? `subscribed ${String(r.value)}` : 'cancelled');
  };
  const triple = async () => {
    const r = await swal.fire({
      icon: 'question',
      title: 'Save changes before closing?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Save',
      denyButtonText: 'Don’t save',
    });
    setResult(r.isConfirmed ? 'saved' : r.isDenied ? 'discarded' : 'cancelled');
  };
  const toastMode = () => {
    void swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Signed in successfully', timer: 3000, timerProgressBar: true, showConfirmButton: false });
    setResult('toast shown');
  };
  return (
    <>
      <SwalHost />
      <Button variant="danger" onClick={confirmDelete}>
        Confirm delete
      </Button>
      <Button onClick={prompt}>Prompt with validation</Button>
      <Button variant="secondary" onClick={triple}>
        Save / Don’t save / Cancel
      </Button>
      <Button variant="secondary" onClick={() => void swal.info('Did you know?', 'All Orca UI dialogs return focus to the button that opened them.')}>
        Info
      </Button>
      <Button variant="ghost" onClick={toastMode}>
        Toast mode
      </Button>
      <Output label="Result">{result}</Output>
    </>
  );
}

function ToasterDemo() {
  const [position, setPosition] = useState<ToasterPosition>('bottom-end');
  const [rich, setRich] = useState(true);
  return (
    <div className="demo-col">
      <Toaster position={position} richColors={rich} closeButton label="Demo notifications" />
      <Row>
        <Select
          label="Position"
          value={position}
          onChange={(e) => setPosition(e.target.value as ToasterPosition)}
          options={(['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'] as const).map((p) => ({ label: p, value: p }))}
        />
        <SwitchField label="Rich colours" checked={rich} onChange={setRich} />
      </Row>
      <Row>
        <Button onClick={() => toast.success('Saved', { description: 'Your changes are live.' })}>Success</Button>
        <Button variant="danger" onClick={() => toast.error('Upload failed', { description: 'The file is larger than 10 MB.' })}>
          Error
        </Button>
        <Button variant="secondary" onClick={() => toast.warning('Storage almost full')}>
          Warning
        </Button>
        <Button variant="secondary" onClick={() => toast.info('New version available', { action: { label: 'Reload', onClick: () => toast('Reloaded (demo)') } })}>
          With action
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.promise(wait(1800).then(() => 42), {
              loading: 'Generating report…',
              success: (n) => `Report ready — ${n} pages`,
              error: 'Could not generate the report',
            })
          }
        >
          Promise
        </Button>
        <Button variant="ghost" onClick={() => toast.dismiss()}>
          Dismiss all
        </Button>
      </Row>
      <p className="muted" style={{ margin: 0 }}>
        Press <kbd>Alt</kbd> + <kbd>T</kbd> to jump to the notifications.
      </p>
    </div>
  );
}

function ToastDemo() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const add = (variant: ToastItem['variant'], title: string, message: string) => {
    const id = Date.now();
    setItems((t) => [...t, { id, title, message, variant }]);
    window.setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 4000);
  };
  return (
    <>
      <Button onClick={() => add('success', 'Saved', 'Your changes are live.')}>Success toast</Button>
      <Button variant="secondary" onClick={() => add('info', 'Heads up', 'A new version is available.')}>
        Info toast
      </Button>
      <Toast items={items} onDismiss={(id) => setItems((t) => t.filter((x) => x.id !== id))} />
    </>
  );
}

function LoaderDemo() {
  const [value, setValue] = useState(64);
  return (
    <div className="demo-col">
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(7.5rem, 1fr))' }}>
        {LOADER_TYPES.map((type: LoaderType) => (
          <div key={type} style={{ display: 'grid', justifyItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', border: '1px solid var(--oc-border)', borderRadius: 'var(--oc-radius)', background: 'var(--oc-surface)' }}>
            <Loader type={type} label={`${type} loader`} value={type === 'progress-ring' ? value : undefined} />
            <code style={{ fontSize: '0.75rem' }}>{type}</code>
          </div>
        ))}
      </div>
      <Row>
        <Loader type="dots" size="sm" tone="muted" label="Small" />
        <Loader type="ring" size="lg" tone="success" label="Large success" />
        <Loader type="progress-ring" size="xl" value={value} showLabel label="Uploading" />
        <Button size="sm" variant="secondary" onClick={() => setValue((v) => (v >= 100 ? 0 : v + 12))}>
          Advance progress
        </Button>
      </Row>
    </div>
  );
}

function OverlayDemo() {
  const [active, setActive] = useState(false);
  const refresh = () => {
    setActive(true);
    window.setTimeout(() => setActive(false), 1800);
  };
  return (
    <div className="demo-col" style={{ maxWidth: '26rem' }}>
      <LoaderOverlay active={active} label="Refreshing stats">
        <Card title="Monthly active users">
          <strong style={{ fontSize: '2rem' }}>48,210</strong>
          <p className="muted" style={{ margin: 0 }}>+12% vs last month</p>
        </Card>
      </LoaderOverlay>
      <div>
        <Button onClick={refresh} disabled={active}>
          Refresh
        </Button>
      </div>
    </div>
  );
}

function PageLoaderDemo() {
  const [active, setActive] = useState(false);
  const show = () => {
    setActive(true);
    window.setTimeout(() => setActive(false), 2200);
  };
  return (
    <>
      <Button onClick={show}>Show page loader (2 s)</Button>
      <PageLoader active={active} brand={<strong style={{ fontSize: '1.5rem' }}>Orca UI</strong>} label="Loading dashboard" />
    </>
  );
}

function TopProgressDemo() {
  return (
    <>
      <TopProgressBar label="Demo page loading" />
      <Button
        onClick={() => {
          topProgress.start();
          window.setTimeout(() => topProgress.done(), 2000);
        }}
      >
        Simulate navigation
      </Button>
      <Button variant="secondary" onClick={() => topProgress.inc(0.2)}>
        +20%
      </Button>
      <Button variant="ghost" onClick={() => topProgress.done()}>
        Done
      </Button>
      <span className="muted">Watch the very top of the window.</span>
    </>
  );
}

function AsyncDemo() {
  const [fail, setFail] = useState(false);
  const save = useAsyncAction(async (name: string) => {
    await wait(1200);
    if (fail) throw new Error('Network error');
    return name;
  });
  return (
    <div className="demo-col" style={{ maxWidth: '26rem' }}>
      <SwitchField label="Make the request fail" checked={fail} onChange={setFail} />
      <div>
        <Button loading={save.loading} onClick={() => void save.run('Lina')}>
          Save profile
        </Button>
      </div>
      {save.error ? <Message severity="error" text="Could not save. Try again." closable onClose={save.reset} /> : null}
    </div>
  );
}

function EmptyDemo() {
  const [n, setN] = useState(0);
  return n === 0 ? (
    <EmptyState icon="📁" title="No projects yet" description="Create your first project to see it here.">
      <Button onClick={() => setN(1)}>New project</Button>
    </EmptyState>
  ) : (
    <Row>
      <span>1 project created.</span>
      <Button size="sm" variant="ghost" onClick={() => setN(0)}>
        Reset
      </Button>
    </Row>
  );
}

function SpinnerDemo() {
  return (
    <>
      <Spinner label="Loading results" />
      <Spinner size="lg" label="Loading page" />
    </>
  );
}

function ProgressDemo() {
  const [v, setV] = useState(64);
  return (
    <div className="demo-col">
      <ProgressBar value={v} label="Upload progress" />
      <ProgressBar label="Processing" />
      <div>
        <Button size="sm" variant="secondary" onClick={() => setV((x) => (x >= 100 ? 0 : x + 9))}>
          Advance
        </Button>
      </div>
    </div>
  );
}

function SkeletonDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="demo-col">
      <SwitchField label="Loading" checked={loading} onChange={setLoading} />
      {loading ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
          <SkeletonCard label="Loading profile" />
          <div style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
            <Row>
              <Skeleton circle width={48} height={48} />
              <Skeleton width="60%" height={16} />
            </Row>
            <SkeletonText lines={4} label="Loading article" />
          </div>
        </div>
      ) : (
        <Card title="Lina Haddad">Product designer in Amman. 7 active projects.</Card>
      )}
    </div>
  );
}

export default createDemoIsland(
  {
    alert: AlertDemo,
    message: MessageDemo,
    swal: SwalDemo,
    toaster: ToasterDemo,
    toast: ToastDemo,
    loader: LoaderDemo,
    loaderoverlay: OverlayDemo,
    pageloader: PageLoaderDemo,
    topprogress: TopProgressDemo,
    useasyncaction: AsyncDemo,
    emptystate: EmptyDemo,
    spinner: SpinnerDemo,
    progressbar: ProgressDemo,
    skeleton: SkeletonDemo,
  },
  ['alert', 'message', 'toaster', 'loader', 'loaderoverlay', 'useasyncaction', 'progressbar', 'skeleton'],
);

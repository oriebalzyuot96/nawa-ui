import { useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  Dialog,
  EmptyState,
  Input,
  Pagination,
  Segmented,
  Select,
  SkeletonCard,
  Switch,
  Toast,
  type ToastItem,
} from '@orca-ui/react';

interface Member extends Record<string, unknown> {
  id: number;
  name: string;
  role: 'Design' | 'Engineering' | 'Product';
  projects: number;
  status: 'Active' | 'Away';
}

const seed: Member[] = [
  { id: 1, name: 'Lina Haddad', role: 'Design', projects: 7, status: 'Active' },
  { id: 2, name: 'Omar Saleh', role: 'Engineering', projects: 12, status: 'Active' },
  { id: 3, name: 'Sara Nasser', role: 'Product', projects: 4, status: 'Away' },
  { id: 4, name: 'Yousef Karim', role: 'Engineering', projects: 9, status: 'Active' },
  { id: 5, name: 'Maya Fares', role: 'Design', projects: 3, status: 'Active' },
  { id: 6, name: 'Adam Aziz', role: 'Engineering', projects: 15, status: 'Away' },
  { id: 7, name: 'Noor Khalil', role: 'Product', projects: 6, status: 'Active' },
  { id: 8, name: 'Rami Toma', role: 'Engineering', projects: 2, status: 'Active' },
];

const PAGE_SIZE = 5;

/** A small working app built only from @orca-ui/react components. */
export default function Playground() {
  const [members, setMembers] = useState(seed);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', role: 'Design' });
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const filtered = useMemo(
    () =>
      members.filter(
        (m) => (role === 'all' || m.role === role) && m.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [members, query, role],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const notify = (toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, ...toast }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const save = () => {
    if (draft.name.trim().length < 2) {
      setError('Enter at least 2 characters');
      return;
    }
    const next: Member = { id: Date.now(), name: draft.name.trim(), role: draft.role as Member['role'], projects: 0, status: 'Active' };
    setMembers((m) => [next, ...m]);
    setOpen(false);
    setDraft({ name: '', role: 'Design' });
    setError('');
    setPage(1);
    notify({ title: 'Member added', message: `${next.name} joined ${next.role}.`, variant: 'success' });
  };

  return (
    <Card
      title="Team directory · live React demo"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Pagination value={Math.min(page, pageCount)} pageCount={pageCount} onChange={setPage} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Switch checked={loading} onChange={setLoading} label="Simulate loading" />
            <span className="muted" aria-hidden="true" style={{ fontSize: '0.85rem' }}>
              Simulate loading
            </span>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end', marginBottom: '1rem' }}>
        <div style={{ flex: '1 1 14rem' }}>
          <Input
            label="Search members"
            type="search"
            placeholder="Type a name…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Segmented
          label="Filter by team"
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Design', value: 'Design' },
            { label: 'Engineering', value: 'Engineering' },
            { label: 'Product', value: 'Product' },
          ]}
        />
        <Button onClick={() => setOpen(true)}>Add member</Button>
      </div>

      {loading && members.length === 0 ? (
        <SkeletonCard />
      ) : filtered.length === 0 && !loading ? (
        <EmptyState icon="🔍" title="No members found" description="Try a different name or team.">
          <Button
            variant="secondary"
            onClick={() => {
              setQuery('');
              setRole('all');
            }}
          >
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <DataTable<Member>
          caption="Team members"
          loading={loading}
          loadingRows={PAGE_SIZE}
          rows={visible}
          columns={[
            {
              key: 'name',
              label: 'Name',
              sortable: true,
              render: (m) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Avatar name={m.name} size="sm" />
                  {m.name}
                </span>
              ),
            },
            { key: 'role', label: 'Team', sortable: true },
            { key: 'projects', label: 'Projects', sortable: true, align: 'end' },
            {
              key: 'status',
              label: 'Status',
              render: (m) => <Badge variant={m.status === 'Active' ? 'success' : 'warning'}>{m.status}</Badge>,
            },
          ]}
        />
      )}

      <Dialog
        open={open}
        title="Add a team member"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save member</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Input
            label="Full name"
            autoComplete="name"
            value={draft.name}
            error={error || undefined}
            hint="Shown in the directory"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Select
            label="Team"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            options={[
              { label: 'Design', value: 'Design' },
              { label: 'Engineering', value: 'Engineering' },
              { label: 'Product', value: 'Product' },
            ]}
          />
        </div>
      </Dialog>

      <Toast items={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </Card>
  );
}

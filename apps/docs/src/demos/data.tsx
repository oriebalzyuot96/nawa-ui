import { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  DataView,
  OrderList,
  OrganizationChart,
  Pagination,
  Paginator,
  PickList,
  Timeline,
  Tree,
  TreeTable,
  VirtualScroller,
  type PickListValue,
  type TreeNode,
  type TreeTableNode,
  type TimelineItem,
} from '@pelagic-ui/react';
import { createDemoIsland, Output, SwitchField } from './shared';

interface Member extends Record<string, unknown> {
  id: number;
  name: string;
  team: string;
  projects: number;
  status: 'Active' | 'Away';
}

const members: Member[] = [
  { id: 1, name: 'Lina Haddad', team: 'Design', projects: 7, status: 'Active' },
  { id: 2, name: 'Omar Saleh', team: 'Engineering', projects: 12, status: 'Active' },
  { id: 3, name: 'Sara Nasser', team: 'Product', projects: 4, status: 'Away' },
  { id: 4, name: 'Yousef Karim', team: 'Engineering', projects: 9, status: 'Active' },
  { id: 5, name: 'Maya Fares', team: 'Design', projects: 3, status: 'Active' },
];

function DataTableDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="demo-col">
      <SwitchField label="Show loading skeleton" checked={loading} onChange={setLoading} />
      <DataTable<Member>
        caption="Team members"
        captionVisible
        rows={members}
        loading={loading}
        loadingRows={5}
        defaultSort={{ key: 'projects', direction: 'desc' }}
        columns={[
          {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (m) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Avatar name={m.name} size="sm" />
                {m.name}
              </span>
            ),
          },
          { key: 'team', label: 'Team', sortable: true },
          { key: 'projects', label: 'Projects', sortable: true, align: 'end' },
          { key: 'status', label: 'Status', render: (m) => <Badge variant={m.status === 'Active' ? 'success' : 'warning'}>{m.status}</Badge> },
        ]}
      />
    </div>
  );
}

const files: TreeNode[] = [
  {
    key: 'src',
    label: 'src',
    icon: '📁',
    children: [
      { key: 'components', label: 'components', icon: '📁', children: [{ key: 'button', label: 'Button.tsx', icon: '📄' }, { key: 'dialog', label: 'Dialog.tsx', icon: '📄' }] },
      { key: 'app', label: 'App.tsx', icon: '📄' },
      { key: 'main', label: 'main.tsx', icon: '📄' },
    ],
  },
  { key: 'public', label: 'public', icon: '📁', children: [{ key: 'favicon', label: 'favicon.svg', icon: '🖼️' }] },
  { key: 'lazy', label: 'remote (lazy)', icon: '☁️' },
  { key: 'readme', label: 'README.md', icon: '📄' },
];

function TreeDemo() {
  const [keys, setKeys] = useState<string[]>(['app']);
  return (
    <div className="demo-col" style={{ maxWidth: '28rem' }}>
      <Tree
        label="Project files"
        nodes={files}
        selectionMode="checkbox"
        filter
        defaultExpandedKeys={['src']}
        selectedKeys={keys}
        onSelectionChange={setKeys}
        onExpand={(node) =>
          node.key === 'lazy'
            ? new Promise<TreeNode[]>((r) =>
                window.setTimeout(() => r([{ key: 'lazy-a', label: 'report.pdf', icon: '📄' }, { key: 'lazy-b', label: 'data.csv', icon: '📄' }]), 700),
              )
            : undefined
        }
      />
      <Output label="Checked">{keys.join(', ') || 'none'}</Output>
    </div>
  );
}

type Cost = {
  name: string;
  owner: string;
  cost: number;
};
const budget: TreeTableNode<Cost>[] = [
  {
    key: 'eng',
    data: { name: 'Engineering', owner: 'Omar', cost: 420000 },
    children: [
      { key: 'web', data: { name: 'Web platform', owner: 'Yousef', cost: 180000 } },
      { key: 'mobile', data: { name: 'Mobile', owner: 'Rami', cost: 140000 } },
      { key: 'infra', data: { name: 'Infrastructure', owner: 'Adam', cost: 100000 } },
    ],
  },
  {
    key: 'design',
    data: { name: 'Design', owner: 'Lina', cost: 160000 },
    children: [
      { key: 'brand', data: { name: 'Brand', owner: 'Maya', cost: 60000 } },
      { key: 'product', data: { name: 'Product design', owner: 'Lina', cost: 100000 } },
    ],
  },
  { key: 'ops', data: { name: 'Operations', owner: 'Sara', cost: 90000 } },
];

function TreeTableDemo() {
  return (
    <TreeTable<Cost>
      caption="2026 budget by team"
      nodes={budget}
      defaultExpandedKeys={['eng']}
      columns={[
        { key: 'name', label: 'Team', sortable: true },
        { key: 'owner', label: 'Owner' },
        { key: 'cost', label: 'Cost', sortable: true, align: 'end', render: (d) => d.cost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) },
      ]}
    />
  );
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}
const products: Product[] = [
  { id: 1, name: 'Desk lamp', price: 49, category: 'Home', stock: 12 },
  { id: 2, name: 'Wireless keyboard', price: 89, category: 'Tech', stock: 0 },
  { id: 3, name: 'Notebook set', price: 15, category: 'Office', stock: 40 },
  { id: 4, name: 'Headphones', price: 129, category: 'Tech', stock: 5 },
  { id: 5, name: 'Plant pot', price: 22, category: 'Home', stock: 18 },
  { id: 6, name: 'Monitor stand', price: 59, category: 'Office', stock: 7 },
  { id: 7, name: 'USB-C hub', price: 39, category: 'Tech', stock: 25 },
  { id: 8, name: 'Coffee mug', price: 12, category: 'Home', stock: 60 },
];

function DataViewDemo() {
  return (
    <DataView<Product>
      label="Products"
      items={products}
      showLayoutToggle
      defaultLayout="grid"
      paginator
      rows={4}
      getKey={(p) => p.id}
      itemTemplate={(p, layout) => (
        <div style={{ display: 'flex', flexDirection: layout === 'grid' ? 'column' : 'row', gap: '0.5rem', justifyContent: 'space-between', alignItems: layout === 'grid' ? 'flex-start' : 'center', padding: '0.75rem', border: '1px solid var(--pl-border)', borderRadius: 'var(--pl-radius)', background: 'var(--pl-surface)' }}>
          <strong>{p.name}</strong>
          <span className="muted">{p.category}</span>
          <span>${p.price}</span>
          <Badge variant={p.stock ? 'success' : 'danger'}>{p.stock ? `${p.stock} in stock` : 'Sold out'}</Badge>
        </div>
      )}
    />
  );
}

function PaginatorDemo() {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  return (
    <div className="demo-col">
      <Paginator
        label="Paginator demo"
        totalRecords={240}
        first={first}
        rows={rows}
        rowsPerPageOptions={[10, 20, 50]}
        showCurrentPageReport
        showJumpToPage
        onPageChange={(s) => {
          setFirst(s.first);
          setRows(s.rows);
        }}
      />
      <Output label="Showing">{`records ${first + 1}–${Math.min(first + rows, 240)} of 240`}</Output>
    </div>
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(5);
  return (
    <>
      <Pagination label="Pagination demo" value={page} pageCount={12} onChange={setPage} />
      <Output label="Page">{page}</Output>
    </>
  );
}

const logLines = Array.from({ length: 10000 }, (_, i) => `${String(i + 1).padStart(5, '0')} · GET /api/items/${(i * 7919) % 1000} — ${200 + ((i * 13) % 3) * 100}`);

function VirtualDemo() {
  return (
    <div className="demo-col">
      <p className="muted" style={{ margin: 0 }}>10,000 rows — only the visible ones are in the DOM.</p>
      <VirtualScroller label="Request log" items={logLines} itemSize={36} height={260} itemTemplate={(line) => <code style={{ background: 'none' }}>{line}</code>} />
    </div>
  );
}

interface Task {
  id: string;
  name: string;
}
function OrderListDemo() {
  const [items, setItems] = useState<Task[]>([
    { id: 'a', name: 'Fix login bug' },
    { id: 'b', name: 'Ship dark mode' },
    { id: 'c', name: 'Write release notes' },
    { id: 'd', name: 'Update dependencies' },
    { id: 'e', name: 'Plan Q3 roadmap' },
  ]);
  return (
    <div className="demo-col" style={{ maxWidth: '30rem' }}>
      <OrderList header="Priorities" value={items} onChange={setItems} getKey={(t) => t.id} getLabel={(t) => t.name} />
      <Output label="Order">{items.map((t) => t.name).join(' → ')}</Output>
    </div>
  );
}

interface Person {
  id: string;
  name: string;
}
function PickListDemo() {
  const [lists, setLists] = useState<PickListValue<Person>>({
    source: ['Lina', 'Omar', 'Sara', 'Yousef', 'Maya', 'Adam'].map((n) => ({ id: n, name: n })),
    target: [{ id: 'Noor', name: 'Noor' }],
  });
  return (
    <div className="demo-col">
      <PickList value={lists} onChange={setLists} getKey={(p) => p.id} getLabel={(p) => p.name} sourceHeader="Available" targetHeader="On the team" />
      <Output label="Team">{lists.target.map((p) => p.name).join(', ') || 'nobody'}</Output>
    </div>
  );
}

function OrgDemo() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="demo-col">
      <div style={{ overflowX: 'auto' }}>
        <OrganizationChart
          label="Company structure"
          collapsible
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          value={{
            key: 'ceo',
            label: 'Rania · CEO',
            text: 'Rania, CEO',
            children: [
              { key: 'cto', label: 'Omar · CTO', text: 'Omar, CTO', children: [{ key: 'web', label: 'Web team' }, { key: 'mobile', label: 'Mobile team' }] },
              { key: 'cpo', label: 'Sara · CPO', text: 'Sara, CPO', children: [{ key: 'design', label: 'Design' }, { key: 'research', label: 'Research' }] },
              { key: 'cfo', label: 'Adam · CFO', text: 'Adam, CFO' },
            ],
          }}
        />
      </div>
      <Output label="Selected">{selected.join(', ') || 'none'}</Output>
    </div>
  );
}

const tlIcon = (d: string) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

function TimelineDemo() {
  const [layout, setLayout] = useState<'vertical' | 'alternate' | 'horizontal'>('vertical');
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const ago = (h: number) => new Date(now.getTime() - h * 3600_000);
  const [items, setItems] = useState<TimelineItem[]>(() => [
    { id: 'placed', title: 'Order placed', date: ago(27), status: 'complete', icon: tlIcon('M3 4h10l-1 6H4zM6 13h.01M11 13h.01'), description: '3 items · $128.00' },
    { id: 'paid', title: 'Payment confirmed', date: ago(26), status: 'complete', variant: 'success', icon: tlIcon('M3.5 8.5l3 3 6-7') },
    {
      id: 'shipped',
      title: 'Shipped from Amman',
      date: ago(3),
      status: 'current',
      avatar: { name: 'Lina Haddad' },
      description: 'Packed by Lina',
      details: <p style={{ margin: 0 }}>Carrier: Aramex · Tracking 1Z 999 AA1 0123 4567</p>,
    },
    { id: 'delivered', title: 'Out for delivery', status: 'upcoming', icon: tlIcon('M2 5h8v6H2zM10 7h3l1.5 2v2H10M4.5 12.5h.01M12 12.5h.01') },
  ]);
  return (
    <div className="demo-col">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['vertical', 'alternate', 'horizontal'] as const).map((l) => (
          <Button key={l} size="sm" variant={layout === l ? 'primary' : 'secondary'} aria-pressed={layout === l} onClick={() => setLayout(l)}>
            {l[0].toUpperCase() + l.slice(1)}
          </Button>
        ))}
        <Button size="sm" variant="ghost" aria-pressed={loading} onClick={() => setLoading((v) => !v)}>
          Loading state
        </Button>
      </div>
      <Timeline items={items} layout={layout} relative groupBy={layout === 'vertical' ? 'day' : undefined} loading={loading} label="Order history" reveal />
      <div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            setItems((list) =>
              list.map((it) =>
                it.id === 'shipped' ? { ...it, status: 'complete' } : it.id === 'delivered' ? { ...it, status: 'complete', variant: 'success', date: new Date(), title: 'Delivered' } : it,
              ),
            )
          }
          disabled={items[3].status === 'complete'}
        >
          Mark delivered
        </Button>
      </div>
    </div>
  );
}

export default createDemoIsland(
  {
    datatable: DataTableDemo,
    tree: TreeDemo,
    treetable: TreeTableDemo,
    dataview: DataViewDemo,
    paginator: PaginatorDemo,
    pagination: PaginationDemo,
    virtualscroller: VirtualDemo,
    orderlist: OrderListDemo,
    picklist: PickListDemo,
    organizationchart: OrgDemo,
    timeline: TimelineDemo,
  },
  ['datatable', 'tree', 'treetable', 'dataview', 'paginator', 'virtualscroller', 'orderlist', 'picklist', 'organizationchart', 'timeline'],
);

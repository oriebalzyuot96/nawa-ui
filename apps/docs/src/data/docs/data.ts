import type { CategoryDoc } from './types';
import { snippets } from '../snippets';

export const data: CategoryDoc = {
  slug: 'data',
  nav: 'Data',
  icon: '📋',
  title: 'Data components — DataTable, Tree, TreeTable, DataView, PickList, VirtualScroller',
  h1: 'Data components',
  description:
    'Accessible data components with live demos: sortable DataTable, Tree, TreeTable, DataView, Paginator, VirtualScroller, OrderList, PickList, OrganizationChart and Timeline.',
  intro:
    'Show, sort, page and reorder data. Tables expose aria-sort, trees follow the WAI-ARIA tree pattern, and long lists stay fast with virtual scrolling.',
  entries: [
    {
      id: 'datatable',
      name: 'DataTable',
      description: 'A sortable table with skeleton loading rows, custom cells and an accessible caption.',
      props: [
        ['columns', 'DataColumn<T>[]', '{ key, label, sortable?, align?, render?, sortValue? }.'],
        ['rows', 'T[]', 'Data.'],
        ['loading / loadingRows', 'boolean / number', 'Skeleton rows while loading.'],
        ['defaultSort / onSortChange', '{ key, direction }', 'Initial sort and change callback.'],
        ['remote', 'boolean', 'Sort on the server — the table only reports changes.'],
        ['caption', 'string', 'Table name for screen readers.'],
      ],
      keys: [
        ['Tab', 'Moves between sortable column headers'],
        ['Enter / Space', 'Toggles the sort on the focused header'],
      ],
      a11y: 'Sorted headers set aria-sort; loading rows are announced once as a status instead of as empty cells.',
      code: snippets.datatable!,
    },
    {
      id: 'tree',
      name: 'Tree',
      description: 'Hierarchical data with expand/collapse, single, multiple or checkbox selection, filtering and lazy loading.',
      props: [
        ['nodes', 'TreeNode[]', '{ key, label, icon?, children?, leaf? }.'],
        ['label', 'string', 'Accessible name (required).'],
        ['selectionMode', "'single' | 'multiple' | 'checkbox'", 'Selection behaviour.'],
        ['selectedKeys / onSelectionChange', 'string[]', 'Controlled selection.'],
        ['onExpand', '(node) => TreeNode[] | Promise', 'Lazy-load children.'],
        ['filter', 'boolean', 'Adds a filter box.'],
      ],
      keys: [
        ['Arrow Down / Arrow Up', 'Next / previous visible node'],
        ['Arrow Right / Arrow Left', 'Expand or go to child / collapse or go to parent (mirrored in RTL)'],
        ['Home / End', 'First / last node'],
        ['Enter / Space', 'Select or check the node'],
      ],
      a11y: 'role="tree" with aria-expanded, aria-level, aria-setsize and aria-posinset on each treeitem.',
      code: {
        react: `<Tree label="Project files" selectionMode="checkbox" filter
  nodes={[{ key: 'src', label: 'src', children: [{ key: 'app', label: 'App.tsx' }] }]}
  selectedKeys={keys} onSelectionChange={setKeys} />`,
      },
    },
    {
      id: 'treetable',
      name: 'TreeTable',
      description: 'A table whose rows expand into child rows, with sortable columns.',
      props: [
        ['columns', 'TreeTableColumn<T>[]', 'Same shape as DataTable columns.'],
        ['nodes', 'TreeTableNode<T>[]', '{ key, data, children? }.'],
        ['caption', 'string', 'Table name (required).'],
        ['defaultExpandedKeys', 'string[]', 'Initially open rows.'],
      ],
      keys: [
        ['Arrow Down / Arrow Up', 'Move between rows'],
        ['Arrow Right / Arrow Left', 'Expand / collapse the row'],
        ['Home / End', 'First / last row'],
      ],
      a11y: 'Uses role="treegrid" so screen readers announce row level and expanded state.',
      code: {
        react: `<TreeTable caption="Budget" nodes={budget} defaultExpandedKeys={['eng']}
  columns={[{ key: 'name', label: 'Team' }, { key: 'cost', label: 'Cost', align: 'end', sortable: true }]} />`,
      },
    },
    {
      id: 'dataview',
      name: 'DataView',
      description: 'Render items as a list or grid with a layout toggle, sorting and built-in pagination.',
      props: [
        ['items', 'T[]', 'Data.'],
        ['itemTemplate', '(item, layout, index) => ReactNode', 'How each item looks.'],
        ['label', 'string', 'Accessible name (required).'],
        ['layout / showLayoutToggle', "'list' | 'grid' / boolean", 'Current layout and toggle.'],
        ['paginator / rows', 'boolean / number', 'Paging.'],
        ['sortField / sortOrder', 'string / 1 | -1', 'Sorting.'],
      ],
      keys: [['Tab', 'Moves through the layout toggle, items and paginator']],
      code: {
        react: `<DataView label="Products" items={products} showLayoutToggle paginator rows={4}
  itemTemplate={(p, layout) => <ProductCard product={p} compact={layout === 'list'} />} />`,
      },
    },
    {
      id: 'paginator',
      name: 'Paginator',
      description: 'Full paging control with rows-per-page, page report and jump-to-page.',
      props: [
        ['totalRecords', 'number', 'Total item count.'],
        ['first / rows', 'number', 'Offset and page size.'],
        ['onPageChange', '(state) => void', '{ first, rows, page, pageCount }.'],
        ['rowsPerPageOptions', 'number[]', 'Page-size dropdown.'],
        ['showCurrentPageReport / showJumpToPage', 'boolean', 'Extra controls.'],
      ],
      keys: [
        ['Tab', 'Move between page buttons'],
        ['Enter', 'Go to the typed page number'],
      ],
      a11y: 'A labelled navigation landmark; the current page button has aria-current="page".',
      code: {
        react: `<Paginator totalRecords={240} rows={rows} first={first}
  rowsPerPageOptions={[10, 20, 50]} showCurrentPageReport showJumpToPage
  onPageChange={(s) => { setFirst(s.first); setRows(s.rows); }} />`,
      },
    },
    {
      id: 'pagination',
      name: 'Pagination',
      description: 'A compact page switcher with ellipsis for long ranges.',
      props: [
        ['value', 'number', 'Current page (1-based).'],
        ['pageCount', 'number', 'Number of pages.'],
        ['onChange', '(page) => void', 'Called with the new page.'],
      ],
      keys: [['Tab', 'Move between page links']],
      code: {
        react: `<Pagination value={page} pageCount={12} onChange={setPage} />`,
        vue: `<Pagination v-model="page" :page-count="12" />`,
        svelte: `<Pagination bind:value={page} pageCount={12} />`,
        astro: `<Pagination page={5} pageCount={12} href="?page={page}" />`,
        rn: `<Pagination value={page} pageCount={12} onChange={setPage} />`,
      },
    },
    {
      id: 'virtualscroller',
      name: 'VirtualScroller',
      description: 'Renders only the visible rows of very long lists, with optional lazy loading.',
      props: [
        ['items', 'Array<T | undefined>', 'Data (undefined = not loaded yet).'],
        ['itemTemplate', '(item, index) => ReactNode', 'Row renderer.'],
        ['itemSize / height', 'number / number | string', 'Row height and viewport height.'],
        ['onLazyLoad', '({ first, last }) => void', 'Fetch the visible range.'],
        ['label', 'string', 'Accessible name (required).'],
      ],
      keys: [
        ['Arrow Down / Arrow Up', 'Move the active row'],
        ['Home / End', 'First / last row'],
      ],
      a11y: 'Rows carry aria-setsize and aria-posinset, so the real list length is announced even though few rows exist in the DOM.',
      code: {
        react: `<VirtualScroller label="Log lines" items={lines} itemSize={36} height={280}
  itemTemplate={(line, i) => <span>{i + 1}. {line}</span>} />`,
      },
    },
    {
      id: 'orderlist',
      name: 'OrderList',
      description: 'Reorder a list with buttons or the keyboard.',
      props: [
        ['value / onChange', 'T[]', 'Items in order.'],
        ['getKey / getLabel', '(item) => Key / string', 'Identity and announced name.'],
        ['header', 'string', 'List title (required).'],
        ['itemTemplate', '(item) => ReactNode', 'Custom row.'],
      ],
      keys: [
        ['Arrow Down / Arrow Up', 'Move focus'],
        ['Space / Enter', 'Select the focused item'],
        ['Alt + Arrow Up / Alt + Arrow Down', 'Move the selected item up / down'],
        ['Alt + Home / Alt + End', 'Move it to the top / bottom'],
      ],
      a11y: 'Every move is announced ("Moved Design to position 2 of 5").',
      code: {
        react: `<OrderList header="Priorities" value={items} onChange={setItems}
  getKey={(i) => i.id} getLabel={(i) => i.name} />`,
      },
    },
    {
      id: 'picklist',
      name: 'PickList',
      description: 'Move items between two lists — available and selected.',
      props: [
        ['value / onChange', '{ source: T[]; target: T[] }', 'Both lists.'],
        ['getKey / getLabel', '(item) => Key / string', 'Identity and announced name.'],
        ['sourceHeader / targetHeader', 'string', 'List titles.'],
      ],
      keys: [
        ['Arrow Down / Arrow Up', 'Move focus within a list'],
        ['Enter / Space', 'Select the focused item'],
        ['Tab', 'Reach the transfer buttons'],
      ],
      code: {
        react: `<PickList value={lists} onChange={setLists} getKey={(p) => p.id} getLabel={(p) => p.name}
  sourceHeader="Available" targetHeader="On the team" />`,
      },
    },
    {
      id: 'organizationchart',
      name: 'OrganizationChart',
      description: 'A top-down tree for org charts and hierarchies, with selection and collapsing.',
      props: [
        ['value', 'OrgChartNode', 'Root { key, label, children? }.'],
        ['label', 'string', 'Accessible name (required).'],
        ['selectionMode', "'single' | 'multiple'", 'Selectable nodes.'],
        ['collapsible', 'boolean', 'Allow hiding branches.'],
        ['nodeTemplate', '(node) => ReactNode', 'Custom node card.'],
      ],
      keys: [
        ['Arrow keys', 'Move between parent, children and siblings'],
        ['Enter / Space', 'Select the node'],
      ],
      code: {
        react: `<OrganizationChart label="Company structure" collapsible selectionMode="single"
  value={{ key: 'ceo', label: 'CEO', children: [{ key: 'cto', label: 'CTO' }, { key: 'cfo', label: 'CFO' }] }} />`,
      },
    },
    {
      id: 'timeline',
      name: 'Timeline',
      description: 'Events in vertical, horizontal or alternating layouts, with status markers, icons or avatars, relative times, date groups, expandable details and a progress connector.',
      props: [
        ['items', 'TimelineItem[]', '{ title, description?, time?, date?, status?, variant?, icon?, avatar?, details?, meta? }.'],
        ['layout', "'vertical' | 'horizontal' | 'alternate'", 'Horizontal and alternate fall back to vertical in narrow containers.'],
        ['relative / locale / now', 'boolean / string / Date', '"2h ago" labels with the full date in the tooltip.'],
        ['groupBy', "'day' | 'month' | (item) => string", 'Date headings (Today, Yesterday…).'],
        ['loading', 'boolean', 'Skeleton while data loads.'],
        ['reveal', 'boolean', 'Fade items in on scroll (off with reduced motion).'],
      ],
      keys: [['Enter / Space', 'Show or hide the details of an item (on its toggle)']],
      a11y: 'Ordered lists (one per date group, labelled by its heading). Status is also spoken ("completed", aria-current for the current step); relative times include the absolute date for screen readers; markers are decorative.',
      code: {
        react: `<Timeline relative groupBy="day" items={[
  { title: 'Order placed', date: placedAt, status: 'complete', icon: <CartIcon /> },
  { title: 'Shipped', date: shippedAt, status: 'current', details: <Tracking id="1Z999" /> },
  { title: 'Delivered', status: 'upcoming' },
]} />`,
        vue: `<Timeline :items="events" />`,
        svelte: `<Timeline items={events} />`,
        astro: `<Timeline items={events} />`,
        rn: `<Timeline items={events} />`,
      },
      note: 'The rich options (layouts, dates, details) are React-only for now; other frameworks render the classic vertical timeline.',
    },
  ],
};

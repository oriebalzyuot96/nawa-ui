import { computed, defineComponent, h, ref, type PropType } from 'vue';
import { Skeleton } from './display';

export type SortDirection = 'asc' | 'desc';

export interface DataColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  /** Value used for sorting. Defaults to `row[key]`. */
  sortValue?: (row: Record<string, unknown>) => string | number | null | undefined;
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Sortable table. Custom cell content: slot `cell-<key>` receives `{ row, value }`.
 */
export const DataTable = defineComponent({
  name: 'OcDataTable',
  props: {
    columns: { type: Array as PropType<DataColumn[]>, required: true },
    rows: { type: Array as PropType<Record<string, unknown>[]>, required: true },
    rowKey: { type: String, default: 'id' },
    loading: Boolean,
    loadingRows: { type: Number, default: 3 },
    emptyMessage: { type: String, default: 'No data' },
    /** When true, rows are assumed sorted by the server and are not re-sorted here. */
    remote: Boolean,
    defaultSort: Object as PropType<{ key: string; direction: SortDirection }>,
    /** Accessible name of the table. Hidden visually unless `captionVisible`. */
    caption: String,
    captionVisible: Boolean,
  },
  emits: ['sort'],
  setup(props, { emit, slots }) {
    const sort = ref(props.defaultSort);

    const sortedRows = computed(() => {
      if (props.remote || !sort.value) return props.rows;
      const { key, direction } = sort.value;
      const col = props.columns.find((c) => c.key === key);
      if (!col) return props.rows;
      const value = (row: Record<string, unknown>) => (col.sortValue ? col.sortValue(row) : row[key]);
      const dir = direction === 'asc' ? 1 : -1;
      return [...props.rows].sort((a, b) => dir * compareValues(value(a), value(b)));
    });

    const toggleSort = (key: string) => {
      const direction: SortDirection = sort.value?.key === key && sort.value.direction === 'asc' ? 'desc' : 'asc';
      sort.value = { key, direction };
      emit('sort', sort.value);
    };

    const alignClass = (align?: DataColumn['align']) =>
      align === 'end' ? 'oc-table__align-end' : align === 'center' ? 'oc-table__align-center' : undefined;

    return () =>
      h('div', { class: 'oc-table-wrap', 'data-responsive': 'stack' }, [
        h('table', { class: 'oc-table', 'aria-busy': props.loading ? 'true' : undefined }, [
          props.caption ? h('caption', { class: props.captionVisible ? undefined : 'oc-sr-only' }, props.caption) : null,
          h(
            'thead',
            null,
            h(
              'tr',
              null,
              props.columns.map((col) => {
                const active = sort.value?.key === col.key;
                return h(
                  'th',
                  {
                    class: alignClass(col.align),
                    'aria-sort':
                      col.sortable && active ? (sort.value?.direction === 'asc' ? 'ascending' : 'descending') : undefined,
                  },
                  col.sortable
                    ? h('button', { type: 'button', class: 'oc-table__sort', onClick: () => toggleSort(col.key) }, [
                        col.label,
                        h('span', { 'aria-hidden': 'true' }, active ? (sort.value?.direction === 'asc' ? '▲' : '▼') : '↕'),
                      ])
                    : col.label,
                );
              }),
            ),
          ),
          h(
            'tbody',
            null,
            props.loading
              ? Array.from({ length: props.loadingRows }, (_, r) =>
                  h(
                    'tr',
                    { key: `skeleton-${r}` },
                    props.columns.map((col) => h('td', { key: col.key }, [h(Skeleton, { height: 14 })])),
                  ),
                )
              : sortedRows.value.length === 0
                ? [h('tr', null, [h('td', { class: 'oc-table__empty', colspan: props.columns.length }, props.emptyMessage)])]
                : sortedRows.value.map((row, i) =>
                    h(
                      'tr',
                      { key: String(row[props.rowKey] ?? i) },
                      props.columns.map((col) => {
                        const value = row[col.key];
                        const cellSlot = slots[`cell-${col.key}`];
                        return h(
                          'td',
                          { key: col.key, class: alignClass(col.align), 'data-label': typeof col.label === 'string' ? col.label : undefined },
                          cellSlot ? cellSlot({ row, value }) : (value as string | number | null | undefined) ?? '',
                        );
                      }),
                    ),
                  ),
          ),
        ]),
      ]);
  },
});

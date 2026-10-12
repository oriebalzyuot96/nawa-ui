import { useMemo, useState, type ReactNode } from 'react';
import { cx } from '../utils';
import { Skeleton } from './display';

export type SortDirection = 'asc' | 'desc';

export interface DataColumn<T> {
  key: string;
  label: ReactNode;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  /** Custom cell content. Defaults to `row[key]`. */
  render?: (row: T) => ReactNode;
  /** Value used for sorting. Defaults to `row[key]`. */
  sortValue?: (row: T) => string | number | null | undefined;
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  /** Field name or function that returns a unique row key. Defaults to `id`. */
  rowKey?: (keyof T & string) | ((row: T) => string | number);
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: ReactNode;
  /** When true, rows are assumed sorted by the server and are not re-sorted here. */
  remote?: boolean;
  defaultSort?: { key: string; direction: SortDirection };
  onSortChange?: (sort: { key: string; direction: SortDirection }) => void;
  /** Accessible name of the table. Hidden visually unless `captionVisible`. */
  caption?: string;
  captionVisible?: boolean;
  className?: string;
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey = 'id' as keyof T & string,
  loading = false,
  loadingRows = 3,
  emptyMessage = 'No data',
  remote = false,
  defaultSort,
  onSortChange,
  caption,
  captionVisible = false,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(defaultSort);

  const sortedRows = useMemo(() => {
    if (remote || !sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const value = (row: T) => (col.sortValue ? col.sortValue(row) : row[col.key]);
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => dir * compareValues(value(a), value(b)));
  }, [rows, columns, sort, remote]);

  const toggleSort = (key: string) => {
    const direction: SortDirection = sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc';
    const next = { key, direction };
    setSort(next);
    onSortChange?.(next);
  };

  const keyOf = (row: T, i: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(row);
    const v = row[rowKey];
    return typeof v === 'string' || typeof v === 'number' ? v : i;
  };

  const alignClass = (align?: DataColumn<T>['align']) =>
    align === 'end' ? 'nw-table__align-end' : align === 'center' ? 'nw-table__align-center' : undefined;

  return (
    <div className={cx('nw-table-wrap', className)}>
      <table className="nw-table" aria-busy={loading || undefined}>
        {caption && <caption className={captionVisible ? undefined : 'nw-sr-only'}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  className={alignClass(col.align)}
                  aria-sort={col.sortable && active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {col.sortable ? (
                    <button type="button" className="nw-table__sort" onClick={() => toggleSort(col.key)}>
                      {col.label}
                      <span aria-hidden="true">{active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }, (_, r) => (
              <tr key={`skeleton-${r}`}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <Skeleton height={14} />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedRows.length === 0 ? (
            <tr>
              <td className="nw-table__empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedRows.map((row, i) => (
              <tr key={keyOf(row, i)}>
                {columns.map((col) => (
                  <td key={col.key} className={alignClass(col.align)}>
                    {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Skeleton } from './display';
import { fontSize, radius, space, usePelagicTheme } from '../theme';

export type SortDirection = 'asc' | 'desc';

export interface DataColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: number;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey?: (keyof T & string) | ((row: T) => string);
  loading?: boolean;
  /** Placeholder rows shown while loading. */
  loadingRows?: number;
  emptyMessage?: string;
  /** When true, rows are already sorted by the server. */
  remote?: boolean;
  defaultSort?: { key: string; direction: SortDirection };
  onSortChange?: (sort: { key: string; direction: SortDirection }) => void;
}

/** Virtualized, sortable table built on FlatList. Horizontal scroll for wide tables. */
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
}: DataTableProps<T>) {
  const t = usePelagicTheme();
  const [sort, setSort] = useState(defaultSort);

  const data = useMemo(() => {
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

  const keyOf = (row: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(row);
    const v = row[rowKey];
    return typeof v === 'string' || typeof v === 'number' ? String(v) : String(index);
  };

  const justify = (align?: DataColumn<T>['align']) => (align === 'end' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start');

  const header = (
    <View style={[styles.row, { borderBottomColor: t.border, backgroundColor: t.surfaceAlt }]}>
      {columns.map((col) => {
        const active = sort?.key === col.key;
        const arrow = active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕';
        return (
          <Pressable
            key={col.key}
            disabled={!col.sortable}
            accessibilityRole={col.sortable ? 'button' : 'text'}
            accessibilityLabel={col.label}
            accessibilityState={{ selected: active }}
            onPress={() => col.sortable && toggleSort(col.key)}
            style={[styles.cell, { width: col.width ?? 120, alignItems: justify(col.align) }]}
          >
            <Text style={{ color: t.textMuted, fontWeight: '600', fontSize: fontSize.sm }}>
              {col.label}
              {col.sortable ? `  ${arrow}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.wrap, { borderColor: t.border }]} accessibilityState={{ busy: true }}>
        {header}
        <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading rows">
          {Array.from({ length: loadingRows }, (_, r) => (
            <View key={r} style={[styles.row, { borderBottomColor: t.border }]}>
              {columns.map((col) => (
                <View key={col.key} style={[styles.cell, { width: col.width ?? 120 }]}>
                  <Skeleton height={12} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { borderColor: t.border, backgroundColor: t.surface }]}>
      {header}
      <FlatList
        data={data}
        keyExtractor={(row, i) => keyOf(row, i)}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: t.textMuted }}>{emptyMessage}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: t.border }]}>
            {columns.map((col) => (
              <View key={col.key} style={[styles.cell, { width: col.width ?? 120, alignItems: justify(col.align) }]}>
                {col.render ? (
                  col.render(item)
                ) : (
                  <Text style={{ color: t.text, fontSize: fontSize.sm }}>{String(item[col.key] ?? '')}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { paddingVertical: space.md, paddingHorizontal: space.md, justifyContent: 'center' },
  center: { padding: space.xl, alignItems: 'center' },
});

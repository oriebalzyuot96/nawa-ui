<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte';

  interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'start' | 'center' | 'end';
  }

  type Direction = 'asc' | 'desc';

  let {
    columns,
    rows,
    rowKey = 'id',
    loading = false,
    loadingRows = 3,
    emptyMessage = 'No data',
    remote = false,
    defaultSort,
    onsort,
    cell,
    caption,
    captionVisible = false,
  }: {
    columns: Column[];
    rows: T[];
    rowKey?: string;
    loading?: boolean;
    loadingRows?: number;
    emptyMessage?: string;
    /** When true, rows are already sorted by the server. */
    remote?: boolean;
    defaultSort?: { key: string; direction: Direction };
    onsort?: (sort: { key: string; direction: Direction }) => void;
    /** Custom cell content: receives the row, the column key and its value. */
    cell?: Snippet<[{ row: T; key: string; value: unknown }]>;
    /** Accessible name of the table. Hidden visually unless `captionVisible`. */
    caption?: string;
    captionVisible?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  let sort = $state(defaultSort);

  function compare(a: unknown, b: unknown): number {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }

  const sorted = $derived.by(() => {
    if (remote || !sort) return rows;
    const key = sort.key;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => dir * compare(a[key], b[key]));
  });

  function toggle(key: string) {
    const direction: Direction = sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc';
    sort = { key, direction };
    onsort?.(sort);
  }

  const alignClass = (align?: Column['align']) =>
    align === 'end' ? 'pl-table__align-end' : align === 'center' ? 'pl-table__align-center' : undefined;
</script>

<div class="pl-table-wrap" data-responsive="stack">
  <table class="pl-table" aria-busy={loading || undefined}>
    {#if caption}<caption class={captionVisible ? undefined : 'pl-sr-only'}>{caption}</caption>{/if}
    <thead>
      <tr>
        {#each columns as col (col.key)}
          <th
            class={alignClass(col.align)}
            aria-sort={col.sortable && sort?.key === col.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
          >
            {#if col.sortable}
              <button type="button" class="pl-table__sort" onclick={() => toggle(col.key)}>
                {col.label}
                <span aria-hidden="true">{sort?.key === col.key ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
              </button>
            {:else}
              {col.label}
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if loading}
        {#each Array.from({ length: loadingRows }) as _, r (r)}
          <tr>
            {#each columns as col (col.key)}
              <td><span class="pl-skeleton" aria-hidden="true" style="height: 14px"></span></td>
            {/each}
          </tr>
        {/each}
      {:else if sorted.length === 0}
        <tr><td class="pl-table__empty" colspan={columns.length}>{emptyMessage}</td></tr>
      {:else}
        {#each sorted as row, i (String(row[rowKey] ?? i))}
          <tr>
            {#each columns as col (col.key)}
              <td class={alignClass(col.align)} data-label={col.label}>
                {#if cell}{@render cell({ row, key: col.key, value: row[col.key] })}{:else}{row[col.key] ?? ''}{/if}
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<script lang="ts">
  import DataTable from '../../src/lib/DataTable.svelte';
  let { onsort, loading = false, remote = false, rows }: { onsort?: (s: { key: string; direction: 'asc' | 'desc' }) => void; loading?: boolean; remote?: boolean; rows?: Record<string, unknown>[] } = $props();
  const data = [
    { id: 1, name: 'Charlie', age: 35 },
    { id: 2, name: 'alice', age: 7 },
    { id: 3, name: 'Bob', age: 120 },
    { id: 4, name: 'dave', age: null },
  ];
</script>

<DataTable
  caption="People"
  {loading}
  {remote}
  {onsort}
  loadingRows={4}
  rows={rows ?? data}
  columns={[{ key: 'name', label: 'Name', sortable: true }, { key: 'age', label: 'Age', sortable: true, align: 'end' }, { key: 'id', label: 'ID' }]}
>
  {#snippet cell({ key, value })}{#if key === 'name'}<strong>{value}</strong>{:else}{value ?? '—'}{/if}{/snippet}
</DataTable>

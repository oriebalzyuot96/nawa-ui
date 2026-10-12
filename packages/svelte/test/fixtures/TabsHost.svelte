<script lang="ts">
  import Tabs from '../../src/lib/Tabs.svelte';
  let { onchange }: { onchange?: (k: string) => void } = $props();
  let value = $state('');
</script>

<Tabs bind:value {onchange} tabs={[{ key: 'one', label: 'One' }, { key: 'two', label: 'Two', disabled: true }, { key: 'three', label: 'Three' }, { key: 'four', label: 'Four' }]}>
  {#snippet panel(key)}<p>Panel {key}</p>{/snippet}
</Tabs>
<output data-testid="tab">{value}</output>

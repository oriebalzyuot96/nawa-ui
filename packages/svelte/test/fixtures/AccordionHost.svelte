<script lang="ts">
  import Accordion from '../../src/lib/Accordion.svelte';
  let { multiple = false }: { multiple?: boolean } = $props();
</script>

<Accordion {multiple} defaultOpen={['a']} items={[{ key: 'a', title: 'Shipping' }, { key: 'b', title: 'Returns' }]}>
  {#snippet panel(key)}<p>Content {key}</p>{/snippet}
</Accordion>

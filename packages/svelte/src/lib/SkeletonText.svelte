<script lang="ts">
  import Skeleton from './Skeleton.svelte';

  /** Paragraph placeholder. The last line is shorter. Announced once as a loading status. */
  let { lines = 3, label = 'Loading…' }: { lines?: number; label?: string } = $props();
</script>

<div role="status" aria-busy="true" class="oc-skeleton-text">
  <span class="oc-sr-only">{label}</span>
  {#each Array.from({ length: lines }) as _, i (i)}
    <Skeleton height={12} />
  {/each}
</div>

<script lang="ts">
  import Skeleton from './Skeleton.svelte';

  /** Card placeholder: avatar, title lines and a body paragraph. */
  let { lines = 3, label = 'Loading…' }: { lines?: number; label?: string } = $props();
</script>

<div role="status" aria-busy="true" class="pl-skeleton-card">
  <span class="pl-sr-only">{label}</span>
  <div class="pl-skeleton-card__head">
    <Skeleton circle height={40} />
    <div class="pl-skeleton-text" aria-hidden="true">
      <Skeleton height={12} width="50%" />
      <Skeleton height={10} width="30%" />
    </div>
  </div>
  <div class="pl-skeleton-text" aria-hidden="true">
    {#each Array.from({ length: lines }) as _, i (i)}
      <Skeleton height={12} />
    {/each}
  </div>
</div>

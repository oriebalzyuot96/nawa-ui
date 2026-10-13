<script lang="ts">
  import { getPageItems } from './utils';

  /** 1-based current page. */
  let { value = $bindable(1), pageCount, onchange }: { value?: number; pageCount: number; onchange?: (page: number) => void } = $props();

  function go(page: number) {
    value = page;
    onchange?.(page);
  }
</script>

<nav aria-label="Pagination" class="pl-pagination">
  <button type="button" class="pl-pagination__btn" aria-label="Previous page" disabled={value <= 1} onclick={() => go(value - 1)}>‹</button>
  {#each getPageItems(value, pageCount) as item, i (i)}
    {#if item === 'ellipsis'}
      <span class="pl-pagination__ellipsis" aria-hidden="true">…</span>
    {:else}
      <button
        type="button"
        class="pl-pagination__btn"
        aria-current={item === value ? 'page' : undefined}
        aria-label="Page {item}"
        onclick={() => go(item)}>{item}</button
      >
    {/if}
  {/each}
  <button type="button" class="pl-pagination__btn" aria-label="Next page" disabled={value >= pageCount} onclick={() => go(value + 1)}>›</button>
</nav>

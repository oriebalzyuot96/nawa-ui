<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, footer, children }: { title?: string; footer?: Snippet; children?: Snippet } = $props();
</script>

<article class="nw-card">
  {#if title}<header class="nw-card__header">{title}</header>{/if}
  {#if children}<div class="nw-card__body">{@render children()}</div>{/if}
  {#if footer}<footer class="nw-card__footer">{@render footer()}</footer>{/if}
</article>

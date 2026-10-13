<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, footer, children }: { title?: string; footer?: Snippet; children?: Snippet } = $props();
</script>

<article class="pl-card">
  {#if title}<header class="pl-card__header">{title}</header>{/if}
  {#if children}<div class="pl-card__body">{@render children()}</div>{/if}
  {#if footer}<footer class="pl-card__footer">{@render footer()}</footer>{/if}
</article>

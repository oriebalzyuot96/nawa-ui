<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, footer, children }: { title?: string; footer?: Snippet; children?: Snippet } = $props();
</script>

<article class="oc-card">
  {#if title}<header class="oc-card__header">{title}</header>{/if}
  {#if children}<div class="oc-card__body">{@render children()}</div>{/if}
  {#if footer}<footer class="oc-card__footer">{@render footer()}</footer>{/if}
</article>

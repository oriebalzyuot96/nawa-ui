<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, description, icon, children }: { title: string; description?: string; icon?: Snippet; children?: Snippet } = $props();
</script>

<div class="nw-empty">
  {#if icon}<div class="nw-empty__icon" aria-hidden="true">{@render icon()}</div>{/if}
  <div class="nw-empty__title">{title}</div>
  {#if description}<p class="nw-empty__desc">{description}</p>{/if}
  {#if children}<div class="nw-empty__action">{@render children()}</div>{/if}
</div>

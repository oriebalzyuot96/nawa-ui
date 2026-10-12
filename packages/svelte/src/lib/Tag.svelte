<script lang="ts">
  import type { Snippet } from 'svelte';

  let { removable = false, onremove, children }: { removable?: boolean; onremove?: () => void; children?: Snippet } = $props();
</script>

<span class="nw-tag">
  {@render children?.()}
  {#if removable}
    <button type="button" class="nw-tag__remove" aria-label="Remove" onclick={onremove}>×</button>
  {/if}
</span>

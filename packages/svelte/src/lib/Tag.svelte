<script lang="ts">
  import type { Snippet } from 'svelte';

  let { removable = false, onremove, children }: { removable?: boolean; onremove?: () => void; children?: Snippet } = $props();
</script>

<span class="pl-tag">
  {@render children?.()}
  {#if removable}
    <button type="button" class="pl-tag__remove" aria-label="Remove" onclick={onremove}>×</button>
  {/if}
</span>

<script lang="ts">
  import type { Snippet } from 'svelte';

  let { removable = false, onremove, children }: { removable?: boolean; onremove?: () => void; children?: Snippet } = $props();
</script>

<span class="oc-tag">
  {@render children?.()}
  {#if removable}
    <button type="button" class="oc-tag__remove" aria-label="Remove" onclick={onremove}>×</button>
  {/if}
</span>

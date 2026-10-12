<script lang="ts">
  import type { Snippet } from 'svelte';

  let { variant = 'neutral', children }: { variant?: 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'; children?: Snippet } = $props();
</script>

<span class={['nw-badge', variant !== 'neutral' && `nw-badge--${variant}`]}>{@render children?.()}</span>

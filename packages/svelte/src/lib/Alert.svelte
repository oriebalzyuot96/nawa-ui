<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'info',
    title,
    onclose,
    children,
  }: { variant?: 'info' | 'success' | 'warning' | 'danger'; title?: string; onclose?: () => void; children?: Snippet } = $props();

  const urgent = $derived(variant === 'danger' || variant === 'warning');
</script>

<div role={urgent ? 'alert' : 'status'} class={['pl-alert', variant !== 'info' && `pl-alert--${variant}`]}>
  <div class="pl-alert__body">
    {#if title}<div class="pl-alert__title">{title}</div>{/if}
    {@render children?.()}
  </div>
  {#if onclose}
    <button type="button" class="pl-close" aria-label="Dismiss" onclick={onclose}>×</button>
  {/if}
</div>

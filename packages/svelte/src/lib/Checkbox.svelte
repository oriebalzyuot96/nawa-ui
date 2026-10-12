<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    checked = $bindable(false),
    disabled = false,
    label,
    children,
    ...rest
  }: { checked?: boolean; disabled?: boolean; label?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<label class={['nw-check', disabled && 'nw-check--disabled']}>
  <input type="checkbox" bind:checked {disabled} {...rest} />
  {label ?? ''}{@render children?.()}
</label>

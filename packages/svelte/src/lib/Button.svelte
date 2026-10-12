<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    block?: boolean;
    /** Square button for a single icon. Pass aria-label. */
    iconOnly?: boolean;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    block = false,
    iconOnly = false,
    type = 'button',
    disabled,
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

<button
  {type}
  class={['nw-btn', `nw-btn--${variant}`, size !== 'md' && `nw-btn--${size}`, block && 'nw-btn--block', iconOnly && 'nw-btn--icon', className]}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {...rest}
>
  {#if loading}<span class="nw-spinner" aria-hidden="true"></span>{/if}
  {@render children?.()}
</button>

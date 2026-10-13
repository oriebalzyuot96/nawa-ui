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
  class={['pl-btn', `pl-btn--${variant}`, size !== 'md' && `pl-btn--${size}`, block && 'pl-btn--block', iconOnly && 'pl-btn--icon', className]}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {...rest}
>
  {#if loading}<span class="pl-spinner" aria-hidden="true"></span>{/if}
  {@render children?.()}
</button>

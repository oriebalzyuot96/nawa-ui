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
  class={['oc-btn', `oc-btn--${variant}`, size !== 'md' && `oc-btn--${size}`, block && 'oc-btn--block', iconOnly && 'oc-btn--icon', className]}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {...rest}
>
  {#if loading}<span class="oc-spinner" aria-hidden="true"></span>{/if}
  {@render children?.()}
</button>

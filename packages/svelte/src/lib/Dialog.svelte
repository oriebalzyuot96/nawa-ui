<script lang="ts">
  import type { Snippet } from 'svelte';
  import { modal } from './actions';
  import { nextId } from './utils';

  let {
    open = false,
    title,
    size = 'md',
    closeOnBackdrop = true,
    onclose,
    footer,
    children,
  }: {
    open?: boolean;
    title: string;
    size?: 'sm' | 'md' | 'lg';
    closeOnBackdrop?: boolean;
    onclose?: () => void;
    footer?: Snippet;
    children?: Snippet;
  } = $props();

  const titleId = nextId('pl-dialog-title');

  function onbackdrop(e: MouseEvent) {
    if (closeOnBackdrop && e.target === e.currentTarget) onclose?.();
  }
</script>

{#if open}
  <div class="pl-overlay" role="presentation" onmousedown={onbackdrop}>
    <div
      use:modal={onclose}
      class={['pl-dialog', size !== 'md' && `pl-dialog--${size}`]}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
    >
      <div class="pl-dialog__header">
        <h2 id={titleId} class="pl-dialog__title">{title}</h2>
        <button type="button" class="pl-close" aria-label="Close" onclick={onclose}>×</button>
      </div>
      <div class="pl-dialog__body">{@render children?.()}</div>
      {#if footer}<div class="pl-dialog__footer">{@render footer()}</div>{/if}
    </div>
  </div>
{/if}

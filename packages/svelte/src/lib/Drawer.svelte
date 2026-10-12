<script lang="ts">
  import type { Snippet } from 'svelte';
  import { modal } from './actions';
  import { nextId } from './utils';

  let {
    open = false,
    title,
    side = 'right',
    closeOnBackdrop = true,
    onclose,
    footer,
    children,
  }: {
    open?: boolean;
    title: string;
    side?: 'left' | 'right';
    closeOnBackdrop?: boolean;
    onclose?: () => void;
    footer?: Snippet;
    children?: Snippet;
  } = $props();

  const titleId = nextId('nw-drawer-title');

  function onbackdrop(e: MouseEvent) {
    if (closeOnBackdrop && e.target === e.currentTarget) onclose?.();
  }
</script>

{#if open}
  <div class={['nw-overlay', 'nw-overlay--drawer', side === 'right' && 'nw-overlay--right']} role="presentation" onmousedown={onbackdrop}>
    <div
      use:modal={onclose}
      class={['nw-drawer', side === 'right' && 'nw-drawer--right']}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
    >
      <header class="nw-dialog__header">
        <h2 id={titleId} class="nw-dialog__title">{title}</h2>
        <button type="button" class="nw-close" aria-label="Close" onclick={onclose}>×</button>
      </header>
      <div class="nw-dialog__body">{@render children?.()}</div>
      {#if footer}<footer class="nw-dialog__footer">{@render footer()}</footer>{/if}
    </div>
  </div>
{/if}

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

  const titleId = nextId('pl-drawer-title');

  function onbackdrop(e: MouseEvent) {
    if (closeOnBackdrop && e.target === e.currentTarget) onclose?.();
  }
</script>

{#if open}
  <div class={['pl-overlay', 'pl-overlay--drawer', side === 'right' && 'pl-overlay--right']} role="presentation" onmousedown={onbackdrop}>
    <div
      use:modal={onclose}
      class={['pl-drawer', side === 'right' && 'pl-drawer--right']}
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

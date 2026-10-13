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

  const titleId = nextId('oc-drawer-title');

  function onbackdrop(e: MouseEvent) {
    if (closeOnBackdrop && e.target === e.currentTarget) onclose?.();
  }
</script>

{#if open}
  <div class={['oc-overlay', 'oc-overlay--drawer', side === 'right' && 'oc-overlay--right']} role="presentation" onmousedown={onbackdrop}>
    <div
      use:modal={onclose}
      class={['oc-drawer', side === 'right' && 'oc-drawer--right']}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
    >
      <div class="oc-dialog__header">
        <h2 id={titleId} class="oc-dialog__title">{title}</h2>
        <button type="button" class="oc-close" aria-label="Close" onclick={onclose}>×</button>
      </div>
      <div class="oc-dialog__body">{@render children?.()}</div>
      {#if footer}<div class="oc-dialog__footer">{@render footer()}</div>{/if}
    </div>
  </div>
{/if}

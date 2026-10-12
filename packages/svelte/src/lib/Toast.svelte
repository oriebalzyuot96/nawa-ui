<script lang="ts">
  interface Item {
    id: string | number;
    title?: string;
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'danger';
  }

  /** Presentational toast stack. Keep `items` in your state and remove on `ondismiss`. */
  let { items, ondismiss }: { items: Item[]; ondismiss: (id: string | number) => void } = $props();
</script>

<div role="status" aria-live="polite" class="nw-toast-stack">
  {#each items as t (t.id)}
    <div class={['nw-toast', t.variant && t.variant !== 'info' && `nw-toast--${t.variant}`]}>
      <div class="nw-toast__body">
        {#if t.title}<div class="nw-toast__title">{t.title}</div>{/if}
        <div class="nw-toast__message">{t.message}</div>
      </div>
      <button type="button" class="nw-close" aria-label="Dismiss" onclick={() => ondismiss(t.id)}>×</button>
    </div>
  {/each}
</div>

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

<div role="status" aria-live="polite" class="pl-toast-stack">
  {#each items as t (t.id)}
    <div class={['pl-toast', t.variant && t.variant !== 'info' && `pl-toast--${t.variant}`]}>
      <div class="pl-toast__body">
        {#if t.title}<div class="pl-toast__title">{t.title}</div>{/if}
        <div class="pl-toast__message">{t.message}</div>
      </div>
      <button type="button" class="pl-close" aria-label="Dismiss" onclick={() => ondismiss(t.id)}>×</button>
    </div>
  {/each}
</div>

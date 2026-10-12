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

<div role="status" aria-live="polite" class="oc-toast-stack">
  {#each items as t (t.id)}
    <div class={['oc-toast', t.variant && t.variant !== 'info' && `oc-toast--${t.variant}`]}>
      <div class="oc-toast__body">
        {#if t.title}<div class="oc-toast__title">{t.title}</div>{/if}
        <div class="oc-toast__message">{t.message}</div>
      </div>
      <button type="button" class="oc-close" aria-label="Dismiss" onclick={() => ondismiss(t.id)}>×</button>
    </div>
  {/each}
</div>

<script lang="ts">
  import Dialog from '../../src/lib/Dialog.svelte';
  import Drawer from '../../src/lib/Drawer.svelte';
  let { kind = 'dialog', closeOnBackdrop = true, side = 'right' }: { kind?: 'dialog' | 'drawer'; closeOnBackdrop?: boolean; side?: 'left' | 'right' } = $props();
  let open = $state(false);
  const close = () => (open = false);
</script>

<button type="button" onclick={() => (open = true)}>Open</button>
{#if kind === 'dialog'}
  <Dialog {open} title="Edit profile" size="lg" {closeOnBackdrop} onclose={close}>
    <input aria-label="Display name" />
    {#snippet footer()}<button type="button" onclick={close}>Save</button>{/snippet}
  </Dialog>
{:else}
  <Drawer {open} title="Filters" {side} {closeOnBackdrop} onclose={close}>
    <input aria-label="Search" />
    {#snippet footer()}<button type="button" onclick={close}>Apply</button>{/snippet}
  </Drawer>
{/if}

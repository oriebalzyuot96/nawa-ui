<script lang="ts">
  import type { Snippet } from 'svelte';
  import { nextId } from './utils';

  interface Item {
    key: string;
    title: string;
  }

  let {
    items,
    multiple = false,
    defaultOpen = [],
    panel,
  }: { items: Item[]; multiple?: boolean; defaultOpen?: string[]; panel: Snippet<[string]> } = $props();

  // svelte-ignore state_referenced_locally
  let open = $state<string[]>([...defaultOpen]);
  const baseId = nextId('pl-acc');

  function toggle(key: string) {
    if (open.includes(key)) open = open.filter((k) => k !== key);
    else open = multiple ? [...open, key] : [key];
  }
</script>

<div class="pl-accordion">
  {#each items as item (item.key)}
    {@const expanded = open.includes(item.key)}
    <div class="pl-accordion__item">
      <h3 style="margin: 0">
        <button
          type="button"
          class="pl-accordion__trigger"
          aria-expanded={expanded}
          aria-controls="{baseId}-{item.key}-panel"
          onclick={() => toggle(item.key)}
        >
          {item.title}
          <span class="pl-accordion__icon" aria-hidden="true">▾</span>
        </button>
      </h3>
      {#if expanded}
        <div id="{baseId}-{item.key}-panel" role="region" class="pl-accordion__panel">{@render panel(item.key)}</div>
      {/if}
    </div>
  {/each}
</div>

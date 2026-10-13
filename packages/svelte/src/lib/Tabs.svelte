<script lang="ts">
  import type { Snippet } from 'svelte';
  import { nextId } from './utils';

  interface TabItem {
    key: string;
    label: string;
    disabled?: boolean;
  }

  let {
    tabs,
    value = $bindable(''),
    onchange,
    panel,
  }: {
    tabs: TabItem[];
    value?: string;
    onchange?: (key: string) => void;
    /** Renders the active tab's content. */
    panel?: Snippet<[string]>;
  } = $props();

  const baseId = nextId('pl-tabs');
  let buttons: HTMLButtonElement[] = [];

  $effect.pre(() => {
    if (!value && tabs.length) value = tabs[0].key;
  });

  function select(key: string) {
    value = key;
    onchange?.(key);
  }

  function onkeydown(e: KeyboardEvent, index: number) {
    const enabled = tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
    if (!enabled.length) return;
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    if (e.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    buttons[next]?.focus();
    select(tabs[next].key);
  }
</script>

<div class="pl-tabs">
  <div role="tablist" class="pl-tabs__list">
    {#each tabs as t, i (t.key)}
      <button
        bind:this={buttons[i]}
        id="{baseId}-tab-{t.key}"
        type="button"
        role="tab"
        aria-selected={value === t.key}
        aria-controls="{baseId}-panel-{t.key}"
        tabindex={value === t.key ? 0 : -1}
        disabled={t.disabled}
        class="pl-tabs__tab"
        onclick={() => select(t.key)}
        onkeydown={(e) => onkeydown(e, i)}
      >
        {t.label}
      </button>
    {/each}
  </div>
  {#if panel && value}
    <div role="tabpanel" id="{baseId}-panel-{value}" aria-labelledby="{baseId}-tab-{value}" class="pl-tabs__panel">
      {@render panel(value)}
    </div>
  {/if}
</div>

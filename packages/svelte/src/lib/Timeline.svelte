<script lang="ts">
  interface Item {
    title: string;
    description?: string;
    time?: string;
    variant?: 'primary' | 'info' | 'success' | 'warning' | 'danger';
  }

  let { items }: { items: Item[] } = $props();
</script>

<ol class="oc-timeline">
  {#each items as item, i (i)}
    <li class="oc-timeline__item">
      <span class={['oc-timeline__dot', item.variant && item.variant !== 'primary' && `oc-timeline__dot--${item.variant}`]} aria-hidden="true"></span>
      {#if item.time}<div class="oc-timeline__time">{item.time}</div>{/if}
      <div class="oc-timeline__title">{item.title}</div>
      {#if item.description}<div class="oc-timeline__desc">{item.description}</div>{/if}
    </li>
  {/each}
</ol>

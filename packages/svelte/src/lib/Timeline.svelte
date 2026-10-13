<script lang="ts">
  interface Item {
    title: string;
    description?: string;
    time?: string;
    variant?: 'primary' | 'info' | 'success' | 'warning' | 'danger';
  }

  let { items }: { items: Item[] } = $props();
</script>

<ol class="pl-timeline">
  {#each items as item, i (i)}
    <li class="pl-timeline__item">
      <span class={['pl-timeline__dot', item.variant && item.variant !== 'primary' && `pl-timeline__dot--${item.variant}`]} aria-hidden="true"></span>
      {#if item.time}<div class="pl-timeline__time">{item.time}</div>{/if}
      <div class="pl-timeline__title">{item.title}</div>
      {#if item.description}<div class="pl-timeline__desc">{item.description}</div>{/if}
    </li>
  {/each}
</ol>

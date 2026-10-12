<script lang="ts">
  let { items }: { items: { label: string; href?: string }[] } = $props();
</script>

<nav aria-label="Breadcrumb">
  <ol class="nw-breadcrumb">
    {#each items as item, i (i)}
      {@const last = i === items.length - 1}
      <li class="nw-breadcrumb__item" aria-current={last ? 'page' : undefined}>
        {#if item.href && !last}<a href={item.href}>{item.label}</a>{:else}{item.label}{/if}
      </li>
    {/each}
  </ol>
</nav>

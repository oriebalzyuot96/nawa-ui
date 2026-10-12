<script lang="ts">
  let { items }: { items: { label: string; href?: string }[] } = $props();
</script>

<nav aria-label="Breadcrumb">
  <ol class="oc-breadcrumb">
    {#each items as item, i (i)}
      {@const last = i === items.length - 1}
      <li class="oc-breadcrumb__item" aria-current={last ? 'page' : undefined}>
        {#if item.href && !last}<a href={item.href}>{item.label}</a>{:else}{item.label}{/if}
      </li>
    {/each}
  </ol>
</nav>

<script lang="ts">
  let { name, src, size = 'md' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' } = $props();

  const initials = $derived(
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
  );
</script>

<span role="img" aria-label={name} class={['oc-avatar', size !== 'md' && `oc-avatar--${size}`]}>
  {#if src}<img {src} alt="" />{:else}{initials}{/if}
</span>

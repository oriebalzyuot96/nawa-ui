<script lang="ts">
  let { size = 'md', label = 'Loading' }: { size?: 'md' | 'lg'; label?: string } = $props();
</script>

<span role="status" aria-label={label} class={['oc-spinner', size === 'lg' && 'oc-spinner--lg']}></span>

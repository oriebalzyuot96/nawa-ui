<script lang="ts">
  import Tooltip from '../../src/lib/Tooltip.svelte';
</script>

<Tooltip text="Copy link" placement="bottom">
  {#snippet children(props)}<button type="button" {...props}>Copy</button>{/snippet}
</Tooltip>
<button type="button">Elsewhere</button>

<script lang="ts">
  import Card from '../../src/lib/Card.svelte';
  import EmptyState from '../../src/lib/EmptyState.svelte';
  import Alert from '../../src/lib/Alert.svelte';
  import Badge from '../../src/lib/Badge.svelte';
  import Tag from '../../src/lib/Tag.svelte';
  import Button from '../../src/lib/Button.svelte';
  let { onclose, onremove, onclick }: { onclose?: () => void; onremove?: () => void; onclick?: () => void } = $props();
</script>

<Card title="Plan">
  Body text
  {#snippet footer()}<span>Footer</span>{/snippet}
</Card>
<EmptyState title="No results" description="Try another search">
  {#snippet icon()}<svg width="10" height="10"></svg>{/snippet}
  <Button {onclick}>Reset filters</Button>
</EmptyState>
<Alert variant="danger" title="Failed" {onclose}>Could not save</Alert>
<Alert>Heads up</Alert>
<Badge variant="success">Active</Badge>
<Tag removable {onremove}>design</Tag>

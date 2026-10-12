<script lang="ts">
  import Switch from '../../src/lib/Switch.svelte';
  import Checkbox from '../../src/lib/Checkbox.svelte';
  import RadioGroup from '../../src/lib/RadioGroup.svelte';
  import Segmented from '../../src/lib/Segmented.svelte';
  import Slider from '../../src/lib/Slider.svelte';
  import Pagination from '../../src/lib/Pagination.svelte';
  let { onradio, onsegment, onpage }: { onradio?: (v: string) => void; onsegment?: (v: string) => void; onpage?: (p: number) => void } = $props();
  let on = $state(false);
  let agree = $state(false);
  let size = $state('m');
  let view = $state('list');
  let volume = $state(30);
  let page = $state(1);
</script>

<Switch label="Wi-Fi" bind:checked={on} />
<Switch label="Locked" disabled />
<Checkbox label="I agree" bind:checked={agree} />
<RadioGroup name="size" label="Size" bind:value={size} onchange={onradio} options={[{ label: 'Small', value: 's' }, { label: 'Medium', value: 'm' }, { label: 'Large', value: 'l', disabled: true }]} />
<Segmented label="View" bind:value={view} onchange={onsegment} options={[{ label: 'List', value: 'list' }, { label: 'Grid', value: 'grid' }, { label: 'Map', value: 'map' }]} />
<Slider label="Volume" showValue bind:value={volume} />
<Pagination pageCount={10} bind:value={page} onchange={onpage} />
<output data-testid="state">{JSON.stringify({ on, agree, size, view, volume, page })}</output>

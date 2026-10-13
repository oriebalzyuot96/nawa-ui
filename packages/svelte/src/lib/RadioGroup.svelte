<script lang="ts">
  interface Option {
    label: string;
    value: string;
    disabled?: boolean;
  }

  let {
    name,
    options,
    value = $bindable(''),
    label,
    onchange,
  }: { name: string; options: Option[]; value?: string; label?: string; onchange?: (value: string) => void } = $props();
</script>

<div role="radiogroup" aria-label={label} class="pl-radio-group">
  {#each options as o (o.value)}
    <label class={['pl-check', o.disabled && 'pl-check--disabled']}>
      <input type="radio" {name} value={o.value} bind:group={value} disabled={o.disabled} onchange={() => onchange?.(o.value)} />
      {o.label}
    </label>
  {/each}
</div>

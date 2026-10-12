<script lang="ts">
  import { nextId } from './utils';

  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = false,
    disabled = false,
  }: { value?: number; min?: number; max?: number; step?: number; label?: string; showValue?: boolean; disabled?: boolean } = $props();

  const id = nextId('nw-slider');
</script>

<div class="nw-field">
  {#if label}
    <label class="nw-label" for={id}>
      {label}{#if showValue}<span class="nw-hint"> {value}</span>{/if}
    </label>
  {/if}
  <input {id} type="range" class="nw-slider" {min} {max} {step} {disabled} bind:value />
</div>

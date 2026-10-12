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

  const id = nextId('oc-slider');
</script>

<div class="oc-field">
  {#if label}
    <label class="oc-label" for={id}>
      {label}{#if showValue}<span class="oc-hint"> {value}</span>{/if}
    </label>
  {/if}
  <input {id} type="range" class="oc-slider" {min} {max} {step} {disabled} bind:value />
</div>

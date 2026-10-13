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

  const id = nextId('pl-slider');
</script>

<div class="pl-field">
  {#if label}
    <label class="pl-label" for={id}>
      {label}{#if showValue}<span class="pl-hint"> {value}</span>{/if}
    </label>
  {/if}
  <input {id} type="range" class="pl-slider" {min} {max} {step} {disabled} bind:value />
</div>

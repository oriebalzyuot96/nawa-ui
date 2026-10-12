<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import { nextId } from './utils';

  interface Option {
    label: string;
    value: string;
    disabled?: boolean;
  }

  interface Props extends Omit<HTMLSelectAttributes, 'value'> {
    label?: string;
    hint?: string;
    error?: string;
    options?: Option[];
    placeholder?: string;
    value?: string;
  }

  let { label, hint, error, options = [], placeholder, value = $bindable(''), id, class: className, children, ...rest }: Props = $props();

  const selectId = id ?? nextId('nw-select');
  const describedBy = $derived(error ? `${selectId}-err` : hint ? `${selectId}-hint` : undefined);
</script>

<div class={['nw-field', error && 'nw-field--error']}>
  {#if label}<label class="nw-label" for={selectId}>{label}</label>{/if}
  <select
    id={selectId}
    class={['nw-select', className]}
    bind:value
    aria-invalid={error ? true : undefined}
    aria-describedby={describedBy}
    {...rest}
  >
    {#if placeholder}<option value="">{placeholder}</option>{/if}
    {#each options as o (o.value)}
      <option value={o.value} disabled={o.disabled}>{o.label}</option>
    {/each}
    {@render children?.()}
  </select>
  {#if error}
    <span id="{selectId}-err" class="nw-error-text">{error}</span>
  {:else if hint}
    <span id="{selectId}-hint" class="nw-hint">{hint}</span>
  {/if}
</div>

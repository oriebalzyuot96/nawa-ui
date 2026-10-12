<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { nextId } from './utils';

  interface Props extends Omit<HTMLInputAttributes, 'value'> {
    label?: string;
    hint?: string;
    error?: string;
    value?: string | number;
  }

  let { label, hint, error, value = $bindable(''), id, class: className, ...rest }: Props = $props();

  const inputId = id ?? nextId('oc-input');
  const describedBy = $derived(error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined);
</script>

<div class={['oc-field', error && 'oc-field--error']}>
  {#if label}<label class="oc-label" for={inputId}>{label}</label>{/if}
  <input
    id={inputId}
    class={['oc-input', className]}
    bind:value
    aria-invalid={error ? true : undefined}
    aria-describedby={describedBy}
    {...rest}
  />
  {#if error}
    <span id="{inputId}-err" class="oc-error-text">{error}</span>
  {:else if hint}
    <span id="{inputId}-hint" class="oc-hint">{hint}</span>
  {/if}
</div>

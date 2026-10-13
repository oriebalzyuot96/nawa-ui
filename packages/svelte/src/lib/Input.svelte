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

  const inputId = id ?? nextId('pl-input');
  const describedBy = $derived(error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined);
</script>

<div class={['pl-field', error && 'pl-field--error']}>
  {#if label}<label class="pl-label" for={inputId}>{label}</label>{/if}
  <input
    id={inputId}
    class={['pl-input', className]}
    bind:value
    aria-invalid={error ? true : undefined}
    aria-describedby={describedBy}
    {...rest}
  />
  {#if error}
    <span id="{inputId}-err" class="pl-error-text">{error}</span>
  {:else if hint}
    <span id="{inputId}-hint" class="pl-hint">{hint}</span>
  {/if}
</div>

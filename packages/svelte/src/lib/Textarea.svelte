<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { nextId } from './utils';

  interface Props extends Omit<HTMLTextareaAttributes, 'value'> {
    label?: string;
    hint?: string;
    error?: string;
    value?: string;
  }

  let { label, hint, error, value = $bindable(''), id, class: className, ...rest }: Props = $props();

  const inputId = id ?? nextId('pl-textarea');
  const describedBy = $derived(error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined);
</script>

<div class={['pl-field', error && 'pl-field--error']}>
  {#if label}<label class="pl-label" for={inputId}>{label}</label>{/if}
  <textarea
    id={inputId}
    class={['pl-textarea', className]}
    bind:value
    aria-invalid={error ? true : undefined}
    aria-describedby={describedBy}
    {...rest}
  ></textarea>
  {#if error}
    <span id="{inputId}-err" class="pl-error-text">{error}</span>
  {:else if hint}
    <span id="{inputId}-hint" class="pl-hint">{hint}</span>
  {/if}
</div>

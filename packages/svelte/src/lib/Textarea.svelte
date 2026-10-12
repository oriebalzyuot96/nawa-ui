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

  const inputId = id ?? nextId('oc-textarea');
  const describedBy = $derived(error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined);
</script>

<div class={['oc-field', error && 'oc-field--error']}>
  {#if label}<label class="oc-label" for={inputId}>{label}</label>{/if}
  <textarea
    id={inputId}
    class={['oc-textarea', className]}
    bind:value
    aria-invalid={error ? true : undefined}
    aria-describedby={describedBy}
    {...rest}
  ></textarea>
  {#if error}
    <span id="{inputId}-err" class="oc-error-text">{error}</span>
  {:else if hint}
    <span id="{inputId}-hint" class="oc-hint">{hint}</span>
  {/if}
</div>

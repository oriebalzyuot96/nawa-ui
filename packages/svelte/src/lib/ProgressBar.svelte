<script lang="ts">
  /** 0–100. Leave undefined for an indeterminate bar. */
  let { value, label = 'Progress' }: { value?: number; label?: string } = $props();

  const indeterminate = $derived(value === undefined);
  const clamped = $derived(indeterminate ? undefined : Math.min(100, Math.max(0, value as number)));
</script>

<div
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={clamped}
  class={['oc-progress', indeterminate && 'oc-progress--indeterminate']}
>
  <div class="oc-progress__bar" style:width={indeterminate ? undefined : `${clamped}%`}></div>
</div>

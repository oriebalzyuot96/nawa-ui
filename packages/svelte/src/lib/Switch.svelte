<script lang="ts">
  let {
    checked = $bindable(false),
    label,
    disabled = false,
    id,
  }: { checked?: boolean; label: string; disabled?: boolean; id?: string } = $props();
</script>

<button
  {id}
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  {disabled}
  class="nw-switch"
  onclick={() => (checked = !checked)}
></button>

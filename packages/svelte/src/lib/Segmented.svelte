<script lang="ts">
  interface Option {
    label: string;
    value: string;
  }

  let {
    options,
    value = $bindable(''),
    label,
    onchange,
  }: { options: Option[]; value?: string; label: string; onchange?: (value: string) => void } = $props();

  let buttons: HTMLButtonElement[] = [];

  function select(next: string) {
    value = next;
    onchange?.(next);
  }

  function onkeydown(e: KeyboardEvent, index: number) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const nextIndex = (index + dir + options.length) % options.length;
    select(options[nextIndex].value);
    buttons[nextIndex]?.focus();
  }
</script>

<div role="radiogroup" aria-label={label} class="pl-segmented">
  {#each options as o, i (o.value)}
    <button
      bind:this={buttons[i]}
      type="button"
      role="radio"
      aria-checked={o.value === value}
      tabindex={o.value === value ? 0 : -1}
      class="pl-segmented__item"
      onclick={() => select(o.value)}
      onkeydown={(e) => onkeydown(e, i)}>{o.label}</button
    >
  {/each}
</div>

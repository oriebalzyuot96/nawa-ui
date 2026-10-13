<!--
  @pelagic-ui/icons — Svelte 5 component.
  <Icon name="search" />  <Icon name="bell" variant="duotone" size={20} title="Notifications" />
-->
<script>
  import { icons } from '../icons.js';
  import { iconParts, nextId } from '../core.js';

  let {
    name,
    variant = 'outline',
    size = 24,
    title = undefined,
    label = undefined,
    strokeWidth = undefined,
    flipRtl = undefined,
    spin = false,
    class: className = '',
    ...rest
  } = $props();

  const id = nextId();
  const data = $derived(icons[name]);
  const parts = $derived(
    data
      ? iconParts(data, {
          variant,
          size,
          title: title ?? label ?? rest['aria-label'],
          strokeWidth,
          flipRtl,
          spin,
          className,
          id,
        })
      : null,
  );
  const extra = $derived(Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'aria-label')));
</script>

{#if parts}
  <svg {...parts.attrs} {...extra}>{@html parts.inner}</svg>
{/if}

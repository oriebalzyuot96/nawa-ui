<script lang="ts">
  import type { Snippet } from 'svelte';
  import { nextId } from './utils';

  /**
   * Spread the props given to `children` onto the trigger so it is described by the tooltip:
   * <Tooltip text="Copy link">{#snippet children(props)}<button {...props}>Copy</button>{/snippet}</Tooltip>
   * Escape hides the bubble until the pointer leaves or focus moves (WCAG 1.4.13).
   */
  let {
    text,
    placement = 'top',
    children,
  }: { text: string; placement?: 'top' | 'bottom'; children: Snippet<[{ 'aria-describedby': string }]> } = $props();

  const id = nextId('oc-tip');
  let dismissed = $state(false);
</script>

<span
  class={['oc-tooltip', placement === 'bottom' && 'oc-tooltip--bottom']}
  data-dismissed={dismissed ? '' : undefined}
  role="presentation"
  onkeydown={(e) => {
    if (e.key === 'Escape') dismissed = true;
  }}
  onmouseleave={() => (dismissed = false)}
  onfocusout={() => (dismissed = false)}
>
  {@render children({ 'aria-describedby': id })}
  <span role="tooltip" {id} class="oc-tooltip__bubble">{text}</span>
</span>

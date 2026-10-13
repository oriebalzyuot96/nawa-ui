<script lang="ts">
  import type { Snippet } from 'svelte';

  type Size = 'compact' | 'default' | 'page';
  type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

  let {
    title,
    description,
    illustration,
    icon,
    primaryAction,
    secondaryAction,
    actions,
    children,
    size = 'default',
    align = 'center',
    layout = 'stack',
    tone,
    headingLevel = 3,
    class: className = '',
  }: {
    title: string;
    description?: string;
    /** Snippet (e.g. `<Illustration name="no-results" />` from @pelagic-ui/illustrations/svelte) or a scene name rendered as `<pl-illustration>`; `false` hides it. */
    illustration?: Snippet | string | false;
    /** Legacy decorative glyph. */
    icon?: Snippet;
    primaryAction?: Snippet;
    secondaryAction?: Snippet;
    actions?: Snippet;
    /** Rendered in the action area (backwards compatible). */
    children?: Snippet;
    size?: Size;
    align?: 'center' | 'start';
    /** `split` puts the illustration beside the text when the component is ≥ 36rem wide. */
    layout?: 'stack' | 'split';
    tone?: Tone;
    /** Heading level for the title (default 3); `false` renders a paragraph. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | false;
    class?: string;
  } = $props();

  const classes = $derived(
    [
      'pl-empty',
      size !== 'default' && `pl-empty--${size}`,
      align === 'start' && 'pl-empty--start',
      layout === 'split' && 'pl-empty--split',
      tone && `pl-empty--tone-${tone}`,
      className,
    ]
      .filter(Boolean)
      .join(' '),
  );
  const tag = $derived(headingLevel ? `h${headingLevel}` : 'p');
  const hasActions = $derived(Boolean(primaryAction || secondaryAction || actions || children));
</script>

<div class={classes}>
  <div class="pl-empty__inner">
    {#if typeof illustration === 'string' && illustration}
      <div class="pl-empty__media"><pl-illustration name={illustration} compact={size === 'compact' ? '' : undefined}></pl-illustration></div>
    {:else if typeof illustration === 'function'}
      <div class="pl-empty__media">{@render illustration()}</div>
    {/if}
    {#if icon}<div class="pl-empty__icon" aria-hidden="true">{@render icon()}</div>{/if}
    <div class="pl-empty__body">
      <svelte:element this={tag} class="pl-empty__title">{title}</svelte:element>
      {#if description}<p class="pl-empty__desc">{description}</p>{/if}
      {#if hasActions}
        <div class="pl-empty__actions pl-empty__action">
          {#if primaryAction}{@render primaryAction()}{/if}
          {#if secondaryAction}{@render secondaryAction()}{/if}
          {#if actions}{@render actions()}{/if}
          {#if children}{@render children()}{/if}
        </div>
      {/if}
    </div>
  </div>
</div>

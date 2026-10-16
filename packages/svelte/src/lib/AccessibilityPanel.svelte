<script lang="ts">
  // Accessibility settings drawer: color schemes, color-vision filters, text size and spacing, reading
  // aids, motion and interaction aids. Markup and behavior are shared with every Pelagic package
  // (@pelagic-ui/core/a11y-prefs); this component adds Svelte props, bindings and callbacks.
  //
  //   <AccessibilityPanel bind:prefs bind:open locale="ar" trigger="inline" onchange={(prefs, change) => …} />
  import { onDestroy, untrack } from 'svelte';
  import {
    mountA11yPanel,
    normalizeA11yPrefs,
    renderA11yPanelHTML,
    type A11yPanelChange,
    type A11yPanelController,
    type A11yPanelLabelOverrides,
    type A11yPrefs,
  } from '@pelagic-ui/core/a11y-prefs';

  type GroupId = 'appearance' | 'color' | 'text' | 'reading' | 'motion' | 'interaction' | 'sound';

  let {
    prefs = $bindable(),
    open = $bindable(false),
    trigger = 'floating',
    triggerLabel,
    locale,
    labels,
    preview = true,
    groups,
    appearance = true,
    sound = 'auto',
    persist = true,
    target,
    id = `pl-a11y-${Math.random().toString(36).slice(2, 8)}`,
    onchange,
  }: {
    /** The preferences (bindable). The panel keeps its own state when omitted. */
    prefs?: Partial<A11yPrefs>;
    /** Open state (bindable). */
    open?: boolean;
    trigger?: 'floating' | 'inline' | 'none';
    triggerLabel?: string;
    locale?: string;
    labels?: A11yPanelLabelOverrides;
    preview?: boolean;
    groups?: GroupId[];
    /** Show the Theme group (mode, color theme, accent, own color, animated switch). Default true. */
    appearance?: boolean;
    /** Sound group: 'auto' (once a sound engine exists), true or false. */
    sound?: boolean | 'auto';
    /** localStorage key, true (default key) or false. */
    persist?: boolean | string;
    /** Element that receives the data-a11y-* attributes. Default <html>. */
    target?: HTMLElement | null;
    id?: string;
    onchange?: (prefs: A11yPrefs, change: A11yPanelChange) => void;
  } = $props();

  let host: HTMLElement;
  let ctl: A11yPanelController | null = null;
  function mount() {
    ctl?.destroy();
    const initial = untrack(() => prefs);
    host.innerHTML = renderA11yPanelHTML({ id, locale, labels, trigger, triggerLabel, preview, groups, appearance, sound, prefs: initial });
    ctl = mountA11yPanel(host.firstElementChild as HTMLElement, {
      target: () => target ?? undefined,
      persist,
      sound,
      value: initial,
      onChange: (next, change) => {
        prefs = next;
        onchange?.(next, change);
      },
      onOpenChange: (value) => (open = value),
    });
    const c = ctl;
    untrack(() => {
      prefs = c.get();
      if (open) c.open();
    });
  }

  onDestroy(() => ctl?.destroy());

  // Render on mount and again when a markup-defining prop changes.
  $effect(() => {
    void [locale, labels, trigger, triggerLabel, preview, groups, appearance, sound, persist];
    mount();
  });
  $effect(() => {
    if (!ctl) return;
    if (open && !ctl.isOpen()) ctl.open();
    else if (!open && ctl.isOpen()) ctl.close();
  });
  $effect(() => {
    if (!ctl || !prefs) return;
    const next = normalizeA11yPrefs(prefs);
    if (JSON.stringify(next) !== JSON.stringify(ctl.get())) ctl.setAll(next);
  });
</script>

<div bind:this={host} class="pl-a11y-host" style="display: contents"></div>

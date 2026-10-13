<script lang="ts">
  import AccessibilityPanel from '../../src/lib/AccessibilityPanel.svelte';
  import type { A11yPrefs } from '@pelagic-ui/core/a11y-prefs';
  let { initial = {} }: { initial?: Partial<A11yPrefs> } = $props();
  let prefs = $state<Partial<A11yPrefs>>(initial);
  let open = $state(false);
</script>

<button type="button" data-testid="set-invert" onclick={() => (prefs = { ...prefs, contrast: 'invert' })}>invert</button>
<button type="button" data-testid="open" onclick={() => (open = true)}>open</button>
<output data-testid="contrast">{prefs.contrast ?? 'default'}</output>
<output data-testid="open-state">{String(open)}</output>
<AccessibilityPanel bind:prefs bind:open persist={false} trigger="none" />

<script>
  // Themeable scene as inline SVG (Svelte 5). Decorative unless `label` is set.
  import { illustrationToSvg } from '../illustrations.js';

  let { name, label = '', compact = false, animated = true, styles = true, class: className = '' } = $props();
  const svg = $derived(illustrationToSvg(name, { label, compact, animated, styles, className }));
</script>

{@html svg}

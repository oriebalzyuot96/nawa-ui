<script lang="ts">
  let {
    width,
    height,
    circle = false,
  }: { width?: number | string; height?: number | string; circle?: boolean } = $props();

  const css = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);
</script>

<span
  aria-hidden="true"
  class={['nw-skeleton', circle && 'nw-skeleton--circle']}
  style:width={circle ? css(height ?? width) : css(width)}
  style:height={css(height)}
></span>

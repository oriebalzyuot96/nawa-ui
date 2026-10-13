import { lockScroll, trapFocus } from '@pelagic-ui/core/a11y';

/**
 * Modal behavior for a panel that exists only while open:
 * Escape calls `onclose`, focus moves in and is trapped, the page does not scroll,
 * and focus returns to the opener when the panel is removed.
 */
export function modal(node: HTMLElement, onclose?: () => void) {
  let close = onclose;
  const previous = document.activeElement as HTMLElement | null;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close?.();
  };
  node.focus();
  const releaseFocus = trapFocus(node);
  const releaseScroll = lockScroll();
  document.addEventListener('keydown', onKey);
  return {
    update(next?: () => void) {
      close = next;
    },
    destroy() {
      document.removeEventListener('keydown', onKey);
      releaseFocus();
      releaseScroll();
      previous?.focus?.();
    },
  };
}

// Tooltip: link the trigger to its bubble with aria-describedby, and let Escape dismiss it (WCAG 1.4.13).

function wire(root: ParentNode) {
  for (const tip of root.querySelectorAll<HTMLElement>('.nw-tooltip[data-nw-tooltip]')) {
    if (tip.dataset.nwWired) continue;
    tip.dataset.nwWired = '';
    const bubble = tip.querySelector<HTMLElement>('[role="tooltip"]');
    const trigger = tip.firstElementChild as HTMLElement | null;
    if (bubble && trigger && trigger !== bubble) {
      const existing = trigger.getAttribute('aria-describedby');
      trigger.setAttribute('aria-describedby', existing ? `${existing} ${bubble.id}` : bubble.id);
    }
    tip.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') tip.setAttribute('data-dismissed', '');
    });
    const reset = () => tip.removeAttribute('data-dismissed');
    tip.addEventListener('mouseleave', reset);
    tip.addEventListener('focusout', reset);
  }
}

wire(document);
document.addEventListener('astro:page-load', () => wire(document));

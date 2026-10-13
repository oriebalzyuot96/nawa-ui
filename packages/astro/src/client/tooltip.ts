// Tooltip: link the trigger to its bubble with aria-describedby, and let Escape dismiss it (WCAG 1.4.13).

function wire(root: ParentNode) {
  for (const tip of root.querySelectorAll<HTMLElement>('.pl-tooltip[data-pl-tooltip]')) {
    if (tip.dataset.plWired !== undefined) continue;
    tip.dataset.plWired = '';
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

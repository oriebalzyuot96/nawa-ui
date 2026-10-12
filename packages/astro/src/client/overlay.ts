// Native <dialog> wiring shared by Dialog and Drawer. Imported by both; runs once per page.
// Open:  any element with data-oc-open="<dialog id>"
// Close: any element with data-oc-close inside the dialog, Escape (native), or a backdrop click.

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  const opener = target.closest<HTMLElement>('[data-oc-open]');
  if (opener) {
    const dialog = document.getElementById(opener.dataset.ocOpen ?? '');
    if (dialog instanceof HTMLDialogElement && !dialog.open) {
      dialog.showModal();
      opener.setAttribute('aria-expanded', 'true');
      dialog.addEventListener('close', () => opener.setAttribute('aria-expanded', 'false'), { once: true });
    }
    return;
  }

  const closer = target.closest<HTMLElement>('[data-oc-close]');
  if (closer) {
    closer.closest('dialog')?.close();
    return;
  }

  // A click on the ::backdrop targets the <dialog> element itself, not its content.
  if (target instanceof HTMLDialogElement && (target.classList.contains('oc-dialog') || target.classList.contains('oc-drawer'))) {
    target.close();
  }
});

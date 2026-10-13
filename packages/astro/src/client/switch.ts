// Toggle role="switch" buttons and mirror the state into their hidden form input.
document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button.pl-switch[data-pl-switch]');
  if (!button || button.disabled) return;
  const checked = button.getAttribute('aria-checked') !== 'true';
  button.setAttribute('aria-checked', String(checked));
  const input = button.nextElementSibling;
  if (input instanceof HTMLInputElement && input.type === 'hidden') input.value = checked ? 'on' : '';
  button.dispatchEvent(new CustomEvent('pl-change', { bubbles: true, detail: { checked } }));
});

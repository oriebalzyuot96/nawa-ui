// Tabs: click and arrow-key navigation with roving tabindex (WAI-ARIA tabs pattern).

function select(root: HTMLElement, tab: HTMLElement, focus: boolean) {
  const tabs = Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]'));
  for (const t of tabs) {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
    if (panel) panel.hidden = !selected;
  }
  if (focus) tab.focus();
}

document.addEventListener('click', (event) => {
  const tab = (event.target as HTMLElement).closest<HTMLElement>('.nw-tabs[data-nw-tabs] [role="tab"]');
  if (tab && !tab.hasAttribute('disabled')) select(tab.closest<HTMLElement>('.nw-tabs')!, tab, false);
});

document.addEventListener('keydown', (event) => {
  const tab = (event.target as HTMLElement).closest<HTMLElement>('.nw-tabs[data-nw-tabs] [role="tab"]');
  if (!tab) return;
  const root = tab.closest<HTMLElement>('.nw-tabs')!;
  const tabs = Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'));
  const i = tabs.indexOf(tab);
  let next: HTMLElement | undefined;
  if (event.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
  else if (event.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
  else if (event.key === 'Home') next = tabs[0];
  else if (event.key === 'End') next = tabs[tabs.length - 1];
  if (!next) return;
  event.preventDefault();
  select(root, next, true);
});

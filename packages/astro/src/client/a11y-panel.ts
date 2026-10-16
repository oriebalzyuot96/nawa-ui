// Makes every server-rendered AccessibilityPanel interactive (state, persistence, keyboard, focus trap,
// announcements). The behavior lives in @pelagic-ui/core so every framework shares it.
import { mountA11yPanel, type A11yPanelController } from '@pelagic-ui/core/a11y-prefs';

declare global {
  interface HTMLElement {
    plA11yPanel?: A11yPanelController;
  }
}

export function initA11yPanels(scope: ParentNode = document) {
  for (const host of scope.querySelectorAll<HTMLElement>('[data-pl-a11y-host]')) {
    const root = host.querySelector<HTMLElement>('[data-pl-a11y-panel]');
    if (!root || root.plA11yPanel) continue;
    const persistAttr = host.dataset.persist;
    const selector = host.dataset.target;
    root.plA11yPanel = mountA11yPanel(root, {
      persist: persistAttr === 'false' ? false : persistAttr || true,
      target: selector ? () => document.querySelector<HTMLElement>(selector) : undefined,
      sound: host.dataset.sound === 'true' ? true : host.dataset.sound === 'false' ? false : 'auto',
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initA11yPanels());
else initA11yPanels();

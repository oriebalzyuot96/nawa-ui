// Client toast API for the <Toaster /> region: window.orcaToast({ title, message, variant, duration }).

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  /** Milliseconds before auto-dismiss. 0 keeps it until closed. Default 5000. */
  duration?: number;
}

function show({ title, message, variant = 'info', duration = 5000 }: ToastOptions) {
  const region = document.querySelector<HTMLElement>('[data-oc-toaster]');
  if (!region) return;

  const toast = document.createElement('div');
  toast.className = variant === 'info' ? 'oc-toast' : `oc-toast oc-toast--${variant}`;

  const body = document.createElement('div');
  body.className = 'oc-toast__body';
  if (title) {
    const t = document.createElement('div');
    t.className = 'oc-toast__title';
    t.textContent = title;
    body.append(t);
  }
  const m = document.createElement('div');
  m.className = 'oc-toast__message';
  m.textContent = message;
  body.append(m);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'oc-close';
  close.setAttribute('aria-label', 'Dismiss');
  close.textContent = '×';

  let timer: number | undefined;
  const remove = () => {
    window.clearTimeout(timer);
    toast.remove();
  };
  close.addEventListener('click', remove);

  // Pause auto-dismiss while hovered or focused (WCAG 2.2.1 timing adjustable).
  const start = () => {
    if (duration > 0) timer = window.setTimeout(remove, duration);
  };
  const pause = () => window.clearTimeout(timer);
  toast.addEventListener('mouseenter', pause);
  toast.addEventListener('mouseleave', start);
  toast.addEventListener('focusin', pause);
  toast.addEventListener('focusout', start);

  toast.append(body, close);
  region.append(toast);
  start();
}

declare global {
  interface Window {
    orcaToast: (options: ToastOptions) => void;
  }
}

window.orcaToast = show;

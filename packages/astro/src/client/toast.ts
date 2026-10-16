// Client toast API for <Toaster />: mounts the shared Pelagic toaster and exposes
// window.pelagicToast({ title, message, variant, duration }) and window.pelagicToaster (the full toast() API).
import { mountToaster, toast, type MountToasterOptions, type ToastActionDef, type ToastAvatar, type ToasterController } from '@pelagic-ui/core/toast';

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'error' | 'loading' | 'default';
  /** Milliseconds before auto-dismiss. 0 keeps it until closed. */
  duration?: number;
  action?: ToastActionDef;
  undo?: () => void;
  avatar?: string | ToastAvatar;
  id?: string | number;
}

let ctl: ToasterController | null = null;
/** Mount the region for the page's <Toaster /> (again, if the page was swapped). Returns false without one. */
export function initToaster(scope: ParentNode = document): boolean {
  if (ctl?.element.isConnected) return true;
  const el = scope.querySelector<HTMLElement>('[data-pl-toaster]');
  if (!el) return false;
  ctl?.destroy();
  let config: MountToasterOptions = {};
  try {
    config = JSON.parse(el.dataset.config || '{}');
  } catch {
    config = {};
  }
  for (const k of Object.keys(config) as Array<keyof MountToasterOptions>) if (config[k] == null) delete config[k];
  ctl = mountToaster(config);
  return true;
}

function show({ title, message, variant = 'info', duration, ...rest }: ToastOptions) {
  if (!initToaster()) return '';
  const type = variant === 'danger' ? 'error' : variant;
  return toast(title ?? message, { ...rest, type, description: title ? message : undefined, duration: duration === 0 ? Infinity : duration });
}

declare global {
  interface Window {
    pelagicToast: (options: ToastOptions) => string | number;
    pelagicToaster: typeof toast;
  }
}

window.pelagicToast = show;
window.pelagicToaster = toast;
// The region mounts on the first pelagicToast() call (pages that never notify get no extra DOM). Call
// initToaster() yourself to render toasts queued with window.pelagicToaster before that.

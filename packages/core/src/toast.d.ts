import type { UiSoundName } from './sound';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastId = string | number;
export type ToasterPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';

export declare const TOAST_TYPES: readonly ToastType[];
export declare const TOAST_POSITIONS: readonly ToasterPosition[];
export declare const TOAST_SWIPE_THRESHOLD: number;
export declare const TOAST_EXIT_MS: number;

/** Message content: text (DOM renderers never parse HTML), a DOM node, or any value a framework renders. */
export type ToastContent = unknown;

export interface ToastActionDef<E = Event> {
  label: ToastContent;
  /** Call `event.preventDefault()` to keep the toast open. */
  onClick?: (event: E) => void;
}

export interface ToastAvatar {
  src?: string;
  alt?: string;
  /** Name used for initials when there is no image. */
  name?: string;
  initials?: string;
}

export interface ToastOptions<C = ToastContent, E = Event> {
  id?: ToastId;
  type?: ToastType;
  description?: C;
  /** Picture or initials in place of the icon (chat, mention, assignment toasts). */
  avatar?: string | ToastAvatar;
  /** Milliseconds; Infinity keeps it until dismissed. Loading toasts default to Infinity. */
  duration?: number;
  /** A custom icon, or false for none. */
  icon?: C | false;
  action?: ToastActionDef<E>;
  cancel?: ToastActionDef<E>;
  /** Shorthand for an "Undo" action. */
  undo?: ((event: E) => void) | ToastActionDef<E>;
  closeButton?: boolean;
  /** Default true: swipe, Escape and the close button can dismiss it. */
  dismissible?: boolean;
  /** Show a countdown bar. */
  progress?: boolean;
  className?: string;
  /** Sound when it appears or changes type (needs a sound engine); false keeps it silent. */
  sound?: UiSoundName | false;
  onDismiss?: (toast: ToastRecord<C, E>) => void;
  onAutoClose?: (toast: ToastRecord<C, E>) => void;
}

export interface ToastRecord<C = ToastContent, E = Event> extends ToastOptions<C, E> {
  id: ToastId;
  type: ToastType;
  message: C;
  version: number;
  dismissed: boolean;
  /** Previous type when it changed (loading → success morphs the icon). */
  from?: ToastType;
  createdAt?: number;
}

export interface ToastStore<C = ToastContent, E = Event> {
  get(): ToastRecord<C, E>[];
  set(next: ToastRecord<C, E>[]): void;
  subscribe(listener: () => void): () => void;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  upsert(message: C, options?: ToastOptions<C, E>): ToastId;
  dismiss(id?: ToastId): void;
  remove(id?: ToastId): void;
}

export interface ToastPromiseMessages<T, C = ToastContent> {
  loading: C;
  success: C | ((data: T) => C);
  error: C | ((error: unknown) => C);
  description?: C;
}

export interface ToastApi<C = ToastContent, E = Event> {
  (message: C, options?: ToastOptions<C, E>): ToastId;
  success(message: C, options?: Omit<ToastOptions<C, E>, 'type'>): ToastId;
  error(message: C, options?: Omit<ToastOptions<C, E>, 'type'>): ToastId;
  warning(message: C, options?: Omit<ToastOptions<C, E>, 'type'>): ToastId;
  info(message: C, options?: Omit<ToastOptions<C, E>, 'type'>): ToastId;
  loading(message: C, options?: Omit<ToastOptions<C, E>, 'type'>): ToastId;
  promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T, C>, options?: Omit<ToastOptions<C, E>, 'type'>): ToastId;
  dismiss(id?: ToastId): void;
  remove(id?: ToastId): void;
  update(id: ToastId, options: ToastOptions<C, E> & { message?: C }): void;
  getToasts(): ToastRecord<C, E>[];
  store: ToastStore<C, E>;
}

export interface ToastLabels {
  region: string;
  close: string;
  undo: string;
  status: Record<Exclude<ToastType, 'default'>, string>;
}
export declare const toastLabels: Readonly<{ en: ToastLabels; ar: ToastLabels }>;
export declare function getToastLabels(locale?: string, overrides?: Partial<ToastLabels>): ToastLabels;

export declare function toastSound(type: ToastType): UiSoundName | null;
export declare function createToastStore<C = ToastContent, E = Event>(): ToastStore<C, E>;
export declare function createToastApi<C = ToastContent, E = Event>(store: ToastStore<C, E>): ToastApi<C, E>;
/** The page-wide queue. */
export declare const toastStore: ToastStore;
export declare const toast: ToastApi;

/** SVG markup of the animated icon for a type (`from: 'loading'` morphs the spinner into the result). */
export declare function toastIconSVG(type: ToastType, options?: { from?: ToastType }): string;
export interface ToastAnnouncer {
  announce(id: ToastId, version: number, text: string, assertive: boolean): void;
  forget(id: ToastId): void;
}
/** Speak toasts through a polite and an assertive live region, once per toast version. */
export declare function createToastAnnouncer(polite: HTMLElement | null, assertive: HTMLElement | null): ToastAnnouncer;
export declare function toastDeckLayout(heights: number[], options: { expanded: boolean; gap?: number; peek?: number }): { items: Array<{ y: number; scale: number }>; height: number };

export interface ToasterHotkey {
  code: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}
export interface MountToasterOptions {
  /** Default 'bottom-end'; start / end follow the writing direction. */
  position?: ToasterPosition;
  /** Default 3; the rest wait in the queue. */
  visibleToasts?: number;
  /** Default 4000 ms. */
  duration?: number;
  gap?: number;
  /** Keep the deck fanned out. */
  expand?: boolean;
  richColors?: boolean;
  closeButton?: boolean;
  progress?: boolean;
  /** Shortcut that focuses the region. Default Alt+T; false disables. */
  hotkey?: ToasterHotkey | false;
  hotkeyLabel?: string;
  locale?: string;
  labels?: Partial<ToastLabels>;
  dir?: 'ltr' | 'rtl' | 'auto';
  className?: string;
  store?: ToastStore;
  target?: HTMLElement;
}
export interface ToasterController {
  element: HTMLElement;
  update(options: Partial<MountToasterOptions>): void;
  destroy(): void;
}
/** Render the toast queue into the page (Vue, Svelte, Angular, Astro and plain pages). */
export declare function mountToaster(options?: MountToasterOptions): ToasterController;

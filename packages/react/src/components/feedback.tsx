import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, trapFocus } from '@pelagic-ui/core/a11y';
import { emitUiSound, type UiSoundName } from '@pelagic-ui/core/sound';
import { Illustration, isIllustrationName, type IllustrationName } from '@pelagic-ui/illustrations/react';
import { cx } from '../utils';

/* ==========================================================================
 * Shared helpers
 * ======================================================================== */

interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
}

function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Inline CSS custom properties. */
function vars(values: Record<string, string | number | undefined>): CSSProperties {
  return values as CSSProperties;
}

const canUseDom = () => typeof document !== 'undefined';

/* ==========================================================================
 * Status glyphs — SVG icons that draw themselves (stroke-dashoffset)
 * ======================================================================== */

export type StatusTone = 'success' | 'error' | 'warning' | 'info' | 'question';
const STATUS_TONES: readonly StatusTone[] = ['success', 'error', 'warning', 'info', 'question'];
const isStatusTone = (v: unknown): v is StatusTone => typeof v === 'string' && (STATUS_TONES as readonly string[]).includes(v);

const DEFAULT_STATUS_LABEL: Record<StatusTone, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
  question: 'Question',
};

/** Decorative animated status glyph. Always pair it with text that carries the status. */
function StatusGlyph({ tone, className }: { tone: StatusTone; className?: string }) {
  return (
    <svg viewBox="0 0 52 52" aria-hidden="true" focusable="false" className={cx('pl-glyph', `pl-glyph--${tone}`, className)}>
      <circle className="pl-glyph__track" cx="26" cy="26" r="23" />
      <circle className="pl-glyph__ring" cx="26" cy="26" r="23" pathLength={1} />
      {tone === 'success' && <path className="pl-glyph__mark" d="M15.5 27.5l7 7L37 19.5" pathLength={1} />}
      {tone === 'error' && (
        <>
          <path className="pl-glyph__mark" d="M18 18l16 16" pathLength={1} />
          <path className="pl-glyph__mark pl-glyph__mark--late" d="M34 18L18 34" pathLength={1} />
        </>
      )}
      {tone === 'warning' && (
        <>
          <path className="pl-glyph__mark" d="M26 14.5v14" pathLength={1} />
          <circle className="pl-glyph__dot" cx="26" cy="36.5" r="2" />
        </>
      )}
      {tone === 'info' && (
        <>
          <circle className="pl-glyph__dot" cx="26" cy="15.5" r="2" />
          <path className="pl-glyph__mark" d="M26 22.5v15" pathLength={1} />
        </>
      )}
      {tone === 'question' && (
        <>
          <path className="pl-glyph__mark" d="M20 20.5a6 6 0 1 1 8.6 5.4c-1.7.9-2.6 2.1-2.6 3.8v1.3" pathLength={1} />
          <circle className="pl-glyph__dot" cx="26" cy="37" r="2" />
        </>
      )}
    </svg>
  );
}

/* ==========================================================================
 * 1. Swal-style alert dialogs
 * ======================================================================== */

export type SwalIcon = StatusTone | 'none';
export type SwalPosition =
  | 'center'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'center-start'
  | 'center-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end';
export type SwalInputType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'range';
export type SwalDismissReason = 'cancel' | 'backdrop' | 'esc' | 'close' | 'timer';
/** Input values: strings for text-like inputs, select, radio and range; boolean for checkbox. */
export type SwalInputValue = string | boolean;
export type SwalInputOptions = Record<string, ReactNode> | Array<{ value: string; label: ReactNode; disabled?: boolean }>;

export type SwalLayout = 'icon' | 'illustration' | 'hero';
export type SwalLocale = 'en' | 'ar';

/** Every piece of built-in copy (buttons, status prefixes, presets). Override any of it with `labels`. */
export interface SwalLabels {
  confirm: string;
  deny: string;
  cancel: string;
  close: string;
  pauseTimer: string;
  status: Record<StatusTone, string>;
  deleteTitle: (item?: string) => string;
  deleteText: string;
  deleteConfirm: string;
  unsavedTitle: string;
  unsavedText: string;
  unsavedSave: string;
  unsavedDiscard: string;
  sessionTitle: string;
  sessionText: string;
  sessionConfirm: string;
  offlineTitle: string;
  offlineText: string;
  offlineRetry: string;
  permissionTitle: string;
  permissionText: string;
  permissionConfirm: string;
  serverErrorTitle: string;
  serverErrorText: string;
  serverErrorRetry: string;
}

export type SwalLabelsInput = Partial<Omit<SwalLabels, 'status'>> & { status?: Partial<Record<StatusTone, string>> };

/** Wrap user content (file names…) in Unicode first-strong isolates so mixed-direction text stays intact. */
const isolate = (text: string) => `\u2068${text}\u2069`;

export const SWAL_LABELS: Record<SwalLocale, SwalLabels> = {
  en: {
    confirm: 'OK',
    deny: 'No',
    cancel: 'Cancel',
    close: 'Close',
    pauseTimer: 'Pause auto-close',
    status: DEFAULT_STATUS_LABEL,
    deleteTitle: (item) => (item ? `Delete “${isolate(item)}”?` : 'Delete this item?'),
    deleteText: 'This can’t be undone.',
    deleteConfirm: 'Delete',
    unsavedTitle: 'You have unsaved changes',
    unsavedText: 'Save them before you leave, or discard them.',
    unsavedSave: 'Save changes',
    unsavedDiscard: 'Discard',
    sessionTitle: 'Your session has expired',
    sessionText: 'For your security you were signed out after a period of inactivity. Sign in again to pick up where you left off.',
    sessionConfirm: 'Sign in again',
    offlineTitle: 'You’re offline',
    offlineText: 'Check your internet connection, then try again. Nothing you saved is lost.',
    offlineRetry: 'Try again',
    permissionTitle: 'You don’t have access',
    permissionText: 'Ask a workspace admin to give you permission, then try again.',
    permissionConfirm: 'Got it',
    serverErrorTitle: 'Something went wrong on our end',
    serverErrorText: 'We’re already on it. Please try again in a moment.',
    serverErrorRetry: 'Try again',
  },
  ar: {
    confirm: 'حسنًا',
    deny: 'لا',
    cancel: 'إلغاء',
    close: 'إغلاق',
    pauseTimer: 'إيقاف الإغلاق التلقائي مؤقتًا',
    status: { success: 'نجاح', error: 'خطأ', warning: 'تحذير', info: 'معلومة', question: 'سؤال' },
    deleteTitle: (item) => (item ? `حذف «${isolate(item)}»؟` : 'حذف هذا العنصر؟'),
    deleteText: 'لا يمكن التراجع عن هذا الإجراء.',
    deleteConfirm: 'حذف',
    unsavedTitle: 'لديك تغييرات غير محفوظة',
    unsavedText: 'احفظها قبل المغادرة أو تجاهلها.',
    unsavedSave: 'حفظ التغييرات',
    unsavedDiscard: 'تجاهل',
    sessionTitle: 'انتهت جلستك',
    sessionText: 'حفاظًا على أمانك سُجّل خروجك بعد فترة من عدم النشاط. سجّل الدخول مجددًا لتكمل من حيث توقفت.',
    sessionConfirm: 'تسجيل الدخول مجددًا',
    offlineTitle: 'أنت غير متصل بالإنترنت',
    offlineText: 'تحقق من اتصالك ثم حاول مرة أخرى. لم يضِع شيء مما حفظته.',
    offlineRetry: 'إعادة المحاولة',
    permissionTitle: 'لا تملك صلاحية الوصول',
    permissionText: 'اطلب الصلاحية من مسؤول مساحة العمل ثم حاول مرة أخرى.',
    permissionConfirm: 'حسنًا',
    serverErrorTitle: 'حدث خطأ من جهتنا',
    serverErrorText: 'نعمل على إصلاحه الآن. حاول مرة أخرى بعد قليل.',
    serverErrorRetry: 'إعادة المحاولة',
  },
};

function resolveLabels(locale: SwalLocale | undefined, labels: SwalLabelsInput | undefined): SwalLabels {
  const base = SWAL_LABELS[locale ?? 'en'] ?? SWAL_LABELS.en;
  if (!labels) return base;
  return { ...base, ...labels, status: { ...base.status, ...labels.status } } as SwalLabels;
}

/** Scene picked by `illustration: true` for each icon type. */
export const SWAL_ILLUSTRATIONS: Record<StatusTone | 'none', IllustrationName> = {
  success: 'all-done',
  error: 'error',
  warning: 'maintenance',
  info: 'welcome',
  question: 'no-results',
  none: 'welcome',
};

export interface SwalOptions {
  /** Built-in status icon, 'none', or any custom element. */
  icon?: SwalIcon | ReactElement;
  /**
   * Illustrated header: a scene name from `@pelagic-ui/illustrations`, any React node, or `true` to pick a
   * scene from the icon type (see `SWAL_ILLUSTRATIONS`). Always decorative; the title and text carry the meaning.
   */
  illustration?: IllustrationName | ReactElement | boolean;
  /**
   * `icon` (animated status glyph), `illustration` (scene with a small status badge) or `hero`
   * (full-bleed tinted band with a large scene). Defaults to `illustration` when `illustration` is set.
   */
  layout?: SwalLayout;
  /** Built-in copy language (buttons, status prefixes, presets). Also sets `lang`/`dir` on the dialog. */
  locale?: SwalLocale;
  /** Override any built-in copy. */
  labels?: SwalLabelsInput;
  /** Style of the confirm button. Presets for destructive actions use 'danger'. */
  confirmButtonVariant?: 'primary' | 'danger';
  /** Sound requested when the dialog opens (needs a SoundProvider), or `false` to keep this dialog silent. */
  sound?: UiSoundName | false;
  /** Become a bottom sheet on small screens (modal only). Default true. */
  sheet?: boolean;
  /** Screen-reader status prefix announced before the title (default: "Success", "Error", …). */
  iconLabel?: string;
  title?: ReactNode;
  text?: ReactNode;
  /** Rich body content rendered after `text`. */
  html?: ReactNode;
  footer?: ReactNode;
  confirmButtonText?: ReactNode;
  denyButtonText?: ReactNode;
  cancelButtonText?: ReactNode;
  /** Default true. */
  showConfirmButton?: boolean;
  showDenyButton?: boolean;
  showCancelButton?: boolean;
  showCloseButton?: boolean;
  closeButtonAriaLabel?: string;
  reverseButtons?: boolean;
  /** Default true. Ignored when an input is present (the input gets focus). */
  focusConfirm?: boolean;
  focusDeny?: boolean;
  focusCancel?: boolean;
  input?: SwalInputType;
  inputLabel?: ReactNode;
  inputPlaceholder?: string;
  inputValue?: string | number | boolean;
  inputOptions?: SwalInputOptions;
  /** Extra attributes for the input, e.g. `{ min: 0, max: 10, step: 1 }` for range. */
  inputAttributes?: Record<string, string | number | boolean>;
  /** Return an error message to block confirmation, or null/undefined to accept. May be async. */
  inputValidator?: (value: SwalInputValue) => string | null | undefined | void | Promise<string | null | undefined | void>;
  /**
   * Runs on confirm with the input value (or `true`). While pending the confirm button shows a loading state.
   * Return `false` (or call `swal.showValidationMessage`) to keep the dialog open; a non-undefined return becomes `value`.
   */
  preConfirm?: (value: SwalInputValue | true) => unknown;
  /** Auto-close after this many ms (dismiss reason "timer"). Pauses on hover, keyboard focus and via the pause button. */
  timer?: number;
  timerProgressBar?: boolean;
  /** Default true (modal only). */
  allowOutsideClick?: boolean;
  /** Default true. */
  allowEscapeKey?: boolean;
  /** Non-modal, positioned notification. */
  toast?: boolean;
  /** Default 'center' (modal) or 'top-end' (toast). */
  position?: SwalPosition;
  width?: number | string;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  className?: string;
  /** Labels for the built-in timer pause button. */
  pauseTimerLabel?: string;
  didOpen?: () => void;
  didClose?: () => void;
}

export interface SwalResult<T = unknown> {
  isConfirmed: boolean;
  isDenied: boolean;
  isDismissed: boolean;
  value?: T;
  dismiss?: SwalDismissReason;
}

interface SwalEntry {
  id: number;
  options: SwalOptions;
  resolve: (result: SwalResult<unknown>) => void;
}

const swalStore = createStore<SwalEntry[]>([]);
let swalSeq = 0;
let swalOpener: HTMLElement | null = null;
const swalControl: { setValidation?: (message: string | null) => void; isLoading?: () => boolean } = {};

function settleSwal(id: number, result: SwalResult<unknown>) {
  const queue = swalStore.get();
  const entry = queue.find((e) => e.id === id);
  if (!entry) return;
  swalStore.set(queue.filter((e) => e.id !== id));
  entry.resolve(result);
}

const dismissed = (reason: SwalDismissReason): SwalResult<unknown> => ({ isConfirmed: false, isDenied: false, isDismissed: true, dismiss: reason });

/** Global defaults merged under every call (set with `swal.configure`). */
let swalDefaults: SwalOptions = {};

function fire<T = unknown>(options: SwalOptions): Promise<SwalResult<T>> {
  const merged: SwalOptions = { ...swalDefaults, ...options };
  return new Promise<SwalResult<T>>((resolve) => {
    const queue = swalStore.get();
    if (queue.length === 0 && !merged.toast && canUseDom()) {
      swalOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    swalStore.set([...queue, { id: ++swalSeq, options: merged, resolve: resolve as (r: SwalResult<unknown>) => void }]);
  });
}

const shortcut =
  (icon: StatusTone) =>
  <T = unknown,>(title: ReactNode, text?: ReactNode, options?: SwalOptions): Promise<SwalResult<T>> =>
    fire<T>({ ...options, icon, title, text });

const presetLabels = (options?: SwalOptions) => resolveLabels(options?.locale ?? swalDefaults.locale, { ...swalDefaults.labels, ...options?.labels });

/** Ready-made, consistently worded dialogs. Every preset accepts the usual options to override anything. */
const presets = {
  /** Destructive confirmation. Cancel is focused; `isConfirmed` means "delete". */
  confirmDelete<T = unknown>(item?: string, options?: SwalOptions): Promise<SwalResult<T>> {
    const L = presetLabels(options);
    return fire<T>({
      icon: 'error',
      iconLabel: L.status.warning,
      illustration: 'empty-folder',
      title: L.deleteTitle(item),
      text: L.deleteText,
      showCancelButton: true,
      confirmButtonText: L.deleteConfirm,
      confirmButtonVariant: 'danger',
      focusCancel: true,
      sound: 'warning',
      ...options,
    });
  },
  /** Save / Discard / Cancel. `isConfirmed` = save, `isDenied` = discard, dismissed = stay. */
  unsavedChanges<T = unknown>(options?: SwalOptions): Promise<SwalResult<T>> {
    const L = presetLabels(options);
    return fire<T>({
      icon: 'warning',
      illustration: 'no-files',
      title: L.unsavedTitle,
      text: L.unsavedText,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: L.unsavedSave,
      denyButtonText: L.unsavedDiscard,
      ...options,
    });
  },
  /** Session timeout. Escape and outside clicks are disabled; confirm = sign in again. */
  sessionExpired<T = unknown>(options?: SwalOptions): Promise<SwalResult<T>> {
    const L = presetLabels(options);
    return fire<T>({
      icon: 'info',
      illustration: 'no-permission',
      layout: 'hero',
      title: L.sessionTitle,
      text: L.sessionText,
      confirmButtonText: L.sessionConfirm,
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...options,
    });
  },
  /** Lost connection. Confirm = try again. */
  offline<T = unknown>(options?: SwalOptions): Promise<SwalResult<T>> {
    const L = presetLabels(options);
    return fire<T>({
      icon: 'warning',
      illustration: 'offline',
      layout: 'hero',
      title: L.offlineTitle,
      text: L.offlineText,
      confirmButtonText: L.offlineRetry,
      showCancelButton: true,
      ...options,
    });
  },
  /** 403-style message. */
  permissionDenied<T = unknown>(options?: SwalOptions): Promise<SwalResult<T>> {
    const L = presetLabels(options);
    return fire<T>({
      icon: 'error',
      illustration: 'no-permission',
      layout: 'hero',
      title: L.permissionTitle,
      text: L.permissionText,
      confirmButtonText: L.permissionConfirm,
      ...options,
    });
  },
  /** 5xx-style message. Confirm = try again. */
  serverError<T = unknown>(options?: SwalOptions): Promise<SwalResult<T>> {
    const L = presetLabels(options);
    return fire<T>({
      icon: 'error',
      illustration: 'server-error',
      layout: 'hero',
      title: L.serverErrorTitle,
      text: L.serverErrorText,
      confirmButtonText: L.serverErrorRetry,
      showCancelButton: true,
      ...options,
    });
  },
};

/**
 * Imperative alert dialogs. Render `<SwalHost />` once (e.g. in your app root).
 * Calls made while a dialog is open are queued and shown in order.
 */
export const swal = {
  fire,
  success: shortcut('success'),
  error: shortcut('error'),
  warning: shortcut('warning'),
  info: shortcut('info'),
  question: shortcut('question'),
  ...presets,
  /** Set defaults for every later call, e.g. `swal.configure({ locale: 'ar', illustration: true })`. Pass `{}` to reset. */
  configure(defaults: SwalOptions) {
    swalDefaults = { ...defaults };
  },
  /** Returns a `fire` bound to default options. */
  mixin(defaults: SwalOptions) {
    return { fire: <T = unknown,>(options: SwalOptions = {}) => fire<T>({ ...defaults, ...options }) };
  },
  /** Close the visible dialog (dismiss reason "close"); the next queued one opens. */
  close(result?: Partial<SwalResult<unknown>>) {
    const current = swalStore.get()[0];
    if (current) settleSwal(current.id, { ...dismissed('close'), ...result });
  },
  /** Dismiss every queued dialog except the visible one. */
  clearQueue() {
    const [current, ...rest] = swalStore.get();
    if (!current) return;
    swalStore.set([current]);
    rest.forEach((e) => e.resolve(dismissed('close')));
  },
  isOpen: () => swalStore.get().length > 0,
  isLoading: () => swalControl.isLoading?.() ?? false,
  /** Show a validation message in the visible dialog (keeps it open when called from preConfirm). */
  showValidationMessage(message: string) {
    swalControl.setValidation?.(message);
  },
  resetValidationMessage() {
    swalControl.setValidation?.(null);
  },
};

function normalizeOptions(options: SwalInputOptions | undefined): Array<{ value: string; label: ReactNode; disabled?: boolean }> {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  return Object.entries(options).map(([value, label]) => ({ value, label }));
}

function initialInputValue(o: SwalOptions): SwalInputValue {
  if (o.input === 'checkbox') return Boolean(o.inputValue);
  if (o.inputValue !== undefined) return String(o.inputValue);
  if (o.input === 'range') {
    const min = Number(o.inputAttributes?.min ?? 0);
    const max = Number(o.inputAttributes?.max ?? 100);
    return String(Math.round((min + max) / 2));
  }
  return '';
}

/** Sound requested when a dialog opens. */
function swalOpenSound(tone: StatusTone | null, isToast: boolean): UiSoundName {
  if (tone === 'success' || tone === 'error' || tone === 'warning' || tone === 'info') return tone;
  return isToast ? 'notification' : 'open';
}

function SwalPopup({ entry }: { entry: SwalEntry }) {
  const o = entry.options;
  const isToast = Boolean(o.toast);
  const tone = isStatusTone(o.icon) ? o.icon : null;
  const customIcon = o.icon && typeof o.icon !== 'string' ? o.icon : null;
  const L = resolveLabels(o.locale, o.labels);
  const statusLabel = tone ? o.iconLabel ?? L.status[tone] : o.iconLabel;
  // Illustration: explicit scene / node, `true` (auto by tone), or implied by an illustrated layout.
  const wantsArt = !isToast && o.illustration !== false && (o.illustration != null || o.layout === 'illustration' || o.layout === 'hero');
  const layout: SwalLayout = wantsArt ? (o.layout === 'icon' ? 'icon' : o.layout ?? 'illustration') : 'icon';
  let art: ReactNode = null;
  if (wantsArt && layout !== 'icon') {
    const ill = o.illustration;
    const name = typeof ill === 'string' && isIllustrationName(ill) ? ill : ill == null || ill === true ? SWAL_ILLUSTRATIONS[tone ?? 'none'] : null;
    art = name ? <Illustration name={name} className="pl-swal__illus" /> : typeof ill === 'object' ? ill : null;
  }
  const illustrated = art != null;
  const role = isToast
    ? tone === 'error' || tone === 'warning'
      ? 'alert'
      : 'status'
    : tone === 'warning' || tone === 'error' || tone === 'question'
      ? 'alertdialog'
      : 'dialog';
  const position: SwalPosition = o.position ?? (isToast ? 'top-end' : 'center');

  const uid = useId();
  const titleId = `${uid}-title`;
  const textId = `${uid}-text`;
  const inputId = `${uid}-input`;
  const labelId = `${uid}-label`;
  const validationId = `${uid}-validation`;

  const [value, setValue] = useState<SwalInputValue>(() => initialInputValue(o));
  const [validation, setValidationState] = useState<string | null>(null);
  const validationRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [hoverPause, setHoverPause] = useState(false);
  const [focusPause, setFocusPause] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const paused = hoverPause || focusPause || manualPause;

  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const denyRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLElement | null>(null);
  const programmaticFocus = useRef(false);
  const done = useRef(false);

  const setValidation = useCallback(
    (message: string | null) => {
      if (message && !validationRef.current && entry.options.sound !== false) emitUiSound('error');
      validationRef.current = message;
      setValidationState(message);
    },
    [entry.options.sound],
  );
  const setBusy = (busy: boolean) => {
    loadingRef.current = busy;
    setLoading(busy);
  };

  const finish = useCallback(
    (result: SwalResult<unknown>) => {
      if (done.current) return;
      done.current = true;
      if (entry.options.sound !== false) {
        if (result.isConfirmed) emitUiSound('select');
        else if (result.dismiss !== 'timer') emitUiSound('close');
      }
      settleSwal(entry.id, result);
    },
    [entry.id, entry.options.sound],
  );
  const dismiss = useCallback((reason: SwalDismissReason) => finish(dismissed(reason)), [finish]);

  // Expose validation/loading controls to the imperative API.
  useEffect(() => {
    const isLoading = () => loadingRef.current;
    swalControl.setValidation = setValidation;
    swalControl.isLoading = isLoading;
    return () => {
      if (swalControl.setValidation === setValidation) {
        swalControl.setValidation = undefined;
        swalControl.isLoading = undefined;
      }
    };
  }, [setValidation]);

  // Modal behaviour: focus in, trap, scroll lock, focus return.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;
    let releaseFocus = () => {};
    let releaseScroll = () => {};
    if (!isToast) {
      releaseFocus = trapFocus(panel);
      releaseScroll = lockScroll();
      const preferred = o.focusCancel ? cancelRef.current : o.focusDeny ? denyRef.current : o.focusConfirm === false ? null : confirmRef.current;
      const target = (o.input && !o.focusCancel && !o.focusDeny ? inputRef.current : null) ?? preferred ?? panel;
      programmaticFocus.current = true;
      target.focus();
      programmaticFocus.current = false;
    }
    if (o.sound !== false) emitUiSound(o.sound ?? swalOpenSound(tone, isToast));
    o.didOpen?.();
    return () => {
      releaseFocus();
      releaseScroll();
      o.didClose?.();
      if (!isToast && swalStore.get().length === 0) {
        const opener = swalOpener;
        swalOpener = null;
        if (opener && opener.isConnected) opener.focus();
      }
    };
    // Mount-only: each queued dialog is a fresh instance (keyed by id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape (document-level for modals; toasts handle it on their own keydown).
  useEffect(() => {
    if (isToast || o.allowEscapeKey === false) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss('esc');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isToast, o.allowEscapeKey, dismiss]);

  // Timer with pause support.
  const remaining = useRef(o.timer ?? 0);
  useEffect(() => {
    if (!o.timer || paused || loading) return undefined;
    const startedAt = Date.now();
    const t = setTimeout(() => dismiss('timer'), Math.max(0, remaining.current));
    return () => {
      clearTimeout(t);
      remaining.current -= Date.now() - startedAt;
    };
  }, [o.timer, paused, loading, dismiss]);

  const focusInput = () => inputRef.current?.focus();

  const confirm = async () => {
    if (loadingRef.current || done.current) return;
    const current: SwalInputValue | true = o.input ? value : true;
    setValidation(null);
    if (o.input && o.inputValidator) {
      const message = await o.inputValidator(current as SwalInputValue);
      if (done.current) return;
      if (message) {
        setValidation(message);
        focusInput();
        return;
      }
    }
    let result: unknown = current;
    if (o.preConfirm) {
      setBusy(true);
      try {
        const returned = await o.preConfirm(current);
        if (done.current) return;
        if (returned === false || validationRef.current) {
          setBusy(false);
          return;
        }
        if (returned !== undefined) result = returned;
      } catch (error) {
        if (done.current) return;
        setBusy(false);
        setValidation(error instanceof Error ? error.message : String(error));
        return;
      }
    }
    finish({ isConfirmed: true, isDenied: false, isDismissed: false, value: result });
  };

  const deny = () => {
    if (loadingRef.current) return;
    finish({ isConfirmed: false, isDenied: true, isDismissed: false, value: false });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void confirm();
  };

  const onBackdrop = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isToast && e.target === e.currentTarget && o.allowOutsideClick !== false) dismiss('backdrop');
  };

  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isToast && e.key === 'Escape' && o.allowEscapeKey !== false) {
      e.stopPropagation();
      dismiss('esc');
    }
  };

  const onPanelFocus = () => {
    if (!programmaticFocus.current && o.timer) setFocusPause(true);
  };
  const onPanelBlur = (e: ReactFocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusPause(false);
  };

  const hasBody = o.text != null || o.html != null;
  const invalid = Boolean(validation);
  const described = invalid ? validationId : undefined;
  const inputLabelledBy = o.inputLabel ? labelId : o.title ? titleId : undefined;
  // A real <label htmlFor> names text-like inputs; aria-labelledby is only needed without one.
  const fieldLabelledBy = o.inputLabel ? undefined : inputLabelledBy;
  const options = normalizeOptions(o.inputOptions);

  const commonInput = {
    id: inputId,
    'aria-invalid': invalid || undefined,
    'aria-describedby': described,
    'aria-labelledby': fieldLabelledBy,
    'aria-label': inputLabelledBy ? undefined : o.inputPlaceholder ?? 'Input',
  };
  const extra = (o.inputAttributes ?? {}) as Record<string, string | number | boolean>;

  let field: ReactNode = null;
  if (o.input) {
    const strValue = typeof value === 'string' ? value : '';
    const setRef = (el: HTMLElement | null) => {
      inputRef.current = el;
    };
    switch (o.input) {
      case 'textarea':
        field = (
          <textarea {...extra} {...commonInput} ref={setRef} className="pl-textarea pl-swal__input" placeholder={o.inputPlaceholder} value={strValue} onChange={(e) => setValue(e.target.value)} />
        );
        break;
      case 'select':
        field = (
          <select {...extra} {...commonInput} ref={setRef} className="pl-select pl-swal__input" value={strValue} onChange={(e) => setValue(e.target.value)}>
            {o.inputPlaceholder && (
              <option value="" disabled>
                {o.inputPlaceholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {typeof opt.label === 'string' || typeof opt.label === 'number' ? opt.label : opt.value}
              </option>
            ))}
          </select>
        );
        break;
      case 'radio':
        field = (
          <div role="radiogroup" className="pl-swal__choices" aria-labelledby={inputLabelledBy} aria-label={inputLabelledBy ? undefined : 'Options'} aria-invalid={invalid || undefined} aria-describedby={described}>
            {options.map((opt, i) => (
              <label key={opt.value} className="pl-swal__choice">
                <input
                  type="radio"
                  name={inputId}
                  value={opt.value}
                  disabled={opt.disabled}
                  checked={strValue === opt.value}
                  onChange={() => setValue(opt.value)}
                  ref={(el) => {
                    if (i === 0 || strValue === opt.value) inputRef.current = el;
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );
        break;
      case 'checkbox':
        field = (
          <label className="pl-swal__choice pl-swal__choice--single">
            <input {...extra} type="checkbox" id={inputId} aria-invalid={invalid || undefined} aria-describedby={described} ref={setRef} checked={value === true} onChange={(e) => setValue(e.target.checked)} />
            <span>{o.inputLabel ?? o.inputPlaceholder}</span>
          </label>
        );
        break;
      case 'range':
        field = (
          <div className="pl-swal__range">
            <input {...extra} {...commonInput} ref={setRef} type="range" value={strValue} onChange={(e) => setValue(e.target.value)} />
            <output htmlFor={inputId} className="pl-swal__range-value">
              {strValue}
            </output>
          </div>
        );
        break;
      default:
        field = (
          <input {...extra} {...commonInput} ref={setRef} type={o.input} className="pl-input pl-swal__input" placeholder={o.inputPlaceholder} value={strValue} onChange={(e) => setValue(e.target.value)} />
        );
    }
  }

  const buttons: ReactNode[] = [];
  if (o.showConfirmButton !== false) {
    buttons.push(
      <button
        key="confirm"
        ref={confirmRef}
        type="submit"
        className={cx('pl-swal__btn', 'pl-swal__btn--confirm', o.confirmButtonVariant === 'danger' && 'pl-swal__btn--danger', loading && 'is-loading')}
        aria-disabled={loading || undefined}
        aria-busy={loading || undefined}
      >
        {loading && <LoaderArt type="dots" className="pl-swal__btn-loader" />}
        <span>{o.confirmButtonText ?? L.confirm}</span>
      </button>,
    );
  }
  if (o.showDenyButton) {
    buttons.push(
      <button key="deny" ref={denyRef} type="button" className="pl-swal__btn pl-swal__btn--deny" aria-disabled={loading || undefined} onClick={deny}>
        {o.denyButtonText ?? L.deny}
      </button>,
    );
  }
  if (o.showCancelButton) {
    buttons.push(
      <button key="cancel" ref={cancelRef} type="button" className="pl-swal__btn pl-swal__btn--cancel" onClick={() => dismiss('cancel')}>
        {o.cancelButtonText ?? L.cancel}
      </button>,
    );
  }
  if (o.reverseButtons) buttons.reverse();

  const panel = (
    <div
      ref={panelRef}
      role={role}
      aria-modal={isToast ? undefined : true}
      aria-labelledby={o.title != null ? titleId : undefined}
      aria-label={o.title == null ? statusLabel ?? 'Dialog' : undefined}
      aria-describedby={hasBody ? textId : undefined}
      tabIndex={-1}
      className={cx('pl-swal__popup', tone && `pl-swal__popup--${tone}`, illustrated && `pl-swal__popup--${layout}`, o.className)}
      data-layout={illustrated ? layout : undefined}
      style={o.width !== undefined ? { width: typeof o.width === 'number' ? `${o.width}px` : o.width } : undefined}
      data-paused={o.timer ? String(paused) : undefined}
      onKeyDown={onPanelKeyDown}
      onMouseEnter={() => setHoverPause(true)}
      onMouseLeave={() => setHoverPause(false)}
      onFocus={onPanelFocus}
      onBlur={onPanelBlur}
    >
      {o.showCloseButton && (
        <button type="button" className="pl-swal__close" aria-label={o.closeButtonAriaLabel ?? L.close} onClick={() => dismiss('close')}>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
      {illustrated ? (
        <div className={layout === 'hero' ? 'pl-swal__hero' : 'pl-swal__art'} aria-hidden="true">
          <div className="pl-swal__scene">{art}</div>
          {(tone || customIcon) && (
            <span className={cx('pl-swal__badge', customIcon && 'pl-swal__badge--custom')}>{tone ? <StatusGlyph tone={tone} className="pl-glyph--sm" /> : customIcon}</span>
          )}
        </div>
      ) : (
        tone && (
          <div className="pl-swal__icon">
            <StatusGlyph tone={tone} />
          </div>
        )
      )}
      {customIcon && !illustrated && (
        <div className="pl-swal__icon pl-swal__icon--custom" aria-hidden="true">
          {customIcon}
        </div>
      )}
      {o.imageUrl && <img className="pl-swal__image" src={o.imageUrl} alt={o.imageAlt ?? ''} width={o.imageWidth} height={o.imageHeight} />}
      <form className="pl-swal__form" onSubmit={onSubmit} noValidate>
        <div className="pl-swal__content">
          {o.title != null && (
            <h2 id={titleId} className="pl-swal__title">
              {statusLabel && <span className="pl-sr-only">{statusLabel}: </span>}
              {o.title}
            </h2>
          )}
          {hasBody && (
            <div id={textId} className="pl-swal__text">
              {o.text != null && <div>{o.text}</div>}
              {o.html}
            </div>
          )}
        </div>
        {o.input && (
          <div className="pl-swal__field">
            {o.inputLabel && o.input !== 'checkbox' && (o.input === 'radio' ? (
              <div id={labelId} className="pl-label">
                {o.inputLabel}
              </div>
            ) : (
              <label id={labelId} htmlFor={inputId} className="pl-label">
                {o.inputLabel}
              </label>
            ))}
            {field}
          </div>
        )}
        <div id={validationId} role="alert" className="pl-swal__validation">
          {validation && (
            <>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 4.75v4M8 11.25v.01" />
              </svg>
              <span>{validation}</span>
            </>
          )}
        </div>
        {buttons.length > 0 && <div className="pl-swal__actions">{buttons}</div>}
      </form>
      {o.footer != null && <footer className="pl-swal__footer">{o.footer}</footer>}
      {o.timer ? (
        <div className="pl-swal__timer">
          {o.timerProgressBar && (
            <div className="pl-swal__timer-track" aria-hidden="true">
              <span className="pl-swal__timer-bar" style={vars({ '--pl-countdown': `${o.timer}ms`, animationPlayState: paused || loading ? 'paused' : 'running' })} />
            </div>
          )}
          <button type="button" className="pl-swal__pause" aria-pressed={manualPause} aria-label={o.pauseTimerLabel ?? L.pauseTimer} onClick={() => setManualPause((p) => !p)}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              {manualPause ? <path d="M5.5 3.5l7 4.5-7 4.5z" /> : <path d="M5.5 3.5v9M10.5 3.5v9" />}
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={cx('pl-swal', `pl-swal--${position}`, isToast ? 'pl-swal--toast' : 'pl-swal--modal')}
      data-tone={tone ?? undefined}
      data-sheet={!isToast && o.sheet === false ? 'false' : undefined}
      lang={o.locale}
      dir={o.locale === 'ar' ? 'rtl' : undefined}
      onMouseDown={onBackdrop}
    >
      {panel}
    </div>
  );
}

/** Renders the visible `swal` dialog. Mount once near your app root. */
export function SwalHost() {
  const queue = useStore(swalStore);
  const current = queue[0];
  if (!current || !canUseDom()) return null;
  return createPortal(<SwalPopup key={current.id} entry={current} />, document.body);
}

/* ==========================================================================
 * 2. Toaster
 * ======================================================================== */

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastId = string | number;
export type ToasterPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';

export interface ToastAction {
  label: ReactNode;
  /** Call `event.preventDefault()` to keep the toast open. */
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export interface ToastOptions {
  id?: ToastId;
  type?: ToastType;
  description?: ReactNode;
  /** Milliseconds; `Infinity` keeps it until dismissed. Loading toasts default to Infinity. */
  duration?: number;
  icon?: ReactNode;
  action?: ToastAction;
  cancel?: ToastAction;
  closeButton?: boolean;
  /** Default true: swipe, Escape and the close button can dismiss it. */
  dismissible?: boolean;
  /** Show a countdown bar. */
  progress?: boolean;
  className?: string;
  /** Sound requested when the toast appears or changes type (needs a SoundProvider); `false` keeps it silent. */
  sound?: UiSoundName | false;
  onDismiss?: (toast: ToastRecord) => void;
  onAutoClose?: (toast: ToastRecord) => void;
}

export interface ToastRecord extends ToastOptions {
  id: ToastId;
  type: ToastType;
  message: ReactNode;
  version: number;
  dismissed: boolean;
}

export interface ToastPromiseMessages<T> {
  loading: ReactNode;
  success: ReactNode | ((data: T) => ReactNode);
  error: ReactNode | ((error: unknown) => ReactNode);
  description?: ReactNode;
}

const toastStore = createStore<ToastRecord[]>([]);
let toastSeq = 0;
/** Exit animation length before a dismissed toast leaves the DOM. */
const TOAST_EXIT_MS = 200;

function toastSound(type: ToastType): UiSoundName | null {
  if (type === 'loading') return null;
  return type === 'default' ? 'notification' : type;
}

function upsertToast(message: ReactNode, opts: ToastOptions = {}): ToastId {
  const list = toastStore.get();
  const id = opts.id ?? `pl-toast-${++toastSeq}`;
  const existing = list.find((t) => t.id === id);
  const nextType = opts.type ?? existing?.type ?? 'default';
  const silent = (opts.sound ?? existing?.sound) === false;
  if (!silent && (!existing || existing.type !== nextType || existing.dismissed)) {
    const s = opts.sound || toastSound(nextType);
    if (s) emitUiSound(s);
  }
  if (existing) {
    toastStore.set(list.map((t) => (t.id === id ? { ...t, ...opts, message, id, type: opts.type ?? t.type, version: t.version + 1, dismissed: false } : t)));
  } else {
    toastStore.set([...list, { ...opts, id, message, type: opts.type ?? 'default', version: 0, dismissed: false }]);
  }
  return id;
}

function removeToast(id?: ToastId) {
  toastStore.set(id === undefined ? [] : toastStore.get().filter((t) => t.id !== id));
}

function dismissToast(id?: ToastId) {
  const targets = toastStore.get().filter((t) => !t.dismissed && (id === undefined || t.id === id));
  if (targets.length === 0) return;
  const ids = new Set(targets.map((t) => t.id));
  toastStore.set(toastStore.get().map((t) => (ids.has(t.id) ? { ...t, dismissed: true } : t)));
  targets.forEach((t) => t.onDismiss?.(t));
  setTimeout(() => toastStore.set(toastStore.get().filter((t) => !(ids.has(t.id) && t.dismissed))), TOAST_EXIT_MS);
}

const typed = (type: ToastType) => (message: ReactNode, opts?: Omit<ToastOptions, 'type'>) => upsertToast(message, { ...opts, type });

/**
 * Imperative notifications. Render `<Toaster />` once.
 * `toast('Saved')`, `toast.success(...)`, `toast.promise(p, { loading, success, error })`, `toast.dismiss(id)`, `toast.update(id, opts)`.
 */
export const toast = Object.assign((message: ReactNode, opts?: ToastOptions) => upsertToast(message, opts), {
  success: typed('success'),
  error: typed('error'),
  warning: typed('warning'),
  info: typed('info'),
  loading: typed('loading'),
  /** Shows a loading toast, then turns it into success or error. Returns the toast id. */
  promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, opts?: Omit<ToastOptions, 'type'>): ToastId {
    const id = upsertToast(messages.loading, { ...opts, type: 'loading', description: messages.description });
    const p = typeof promise === 'function' ? promise() : promise;
    p.then(
      (data) => {
        const message = typeof messages.success === 'function' ? (messages.success as (d: T) => ReactNode)(data) : messages.success;
        upsertToast(message, { id, type: 'success' });
      },
      (error: unknown) => {
        const message = typeof messages.error === 'function' ? (messages.error as (e: unknown) => ReactNode)(error) : messages.error;
        upsertToast(message, { id, type: 'error' });
      },
    );
    return id;
  },
  /** Dismiss one toast (with exit animation), or all when no id is given. */
  dismiss: dismissToast,
  /** Remove immediately without the exit animation (all when no id is given). */
  remove: removeToast,
  /** Merge new options (and optionally a new `message`) into an existing toast; restarts its timer. */
  update(id: ToastId, opts: ToastOptions & { message?: ReactNode }) {
    const current = toastStore.get().find((t) => t.id === id);
    if (!current) return;
    const { message, ...rest } = opts;
    upsertToast(message ?? current.message, { ...rest, id });
  },
  getToasts: () => toastStore.get(),
});

export interface ToasterHotkey {
  code: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

export interface ToasterProps {
  /** Default 'bottom-end'. start/end follow the writing direction (RTL aware). */
  position?: ToasterPosition;
  /** Tinted backgrounds per status. */
  richColors?: boolean;
  closeButton?: boolean;
  /** Always show the deck expanded instead of collapsing it. */
  expand?: boolean;
  visibleToasts?: number;
  /** Default duration in ms (4000). */
  duration?: number;
  /** Countdown bar on every toast. */
  progress?: boolean;
  gap?: number;
  /** Shortcut that moves focus to the notifications region. Default Alt+T (`{ altKey: true, code: 'KeyT' }`); `false` disables. */
  hotkey?: ToasterHotkey | false;
  hotkeyLabel?: string;
  /** Region name for assistive tech. */
  label?: string;
  closeLabel?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  className?: string;
}

/** Horizontal swipe distance (px) that dismisses a toast. */
export const TOAST_SWIPE_THRESHOLD = 64;

function ToastGlyph({ type }: { type: ToastType }) {
  if (type === 'loading') return <LoaderArt type="ring" className="pl-toaster__spinner" />;
  if (type === 'default') return null;
  return <StatusGlyph tone={type} className="pl-glyph--sm" />;
}

interface ToastViewProps {
  t: ToastRecord;
  index: number;
  count: number;
  offset: number;
  frontHeight: number;
  expanded: boolean;
  paused: boolean;
  isTop: boolean;
  defaultDuration: number;
  closeButton: boolean;
  progress: boolean;
  closeLabel: string;
  onHeight: (id: ToastId, height: number) => void;
  onSwipeChange: (active: boolean) => void;
}

function ToastView({ t, index, count, offset, frontHeight, expanded, paused, isTop, defaultDuration, closeButton, progress, closeLabel, onHeight, onSwipeChange }: ToastViewProps) {
  const ref = useRef<HTMLLIElement>(null);
  const duration = t.duration ?? (t.type === 'loading' ? Infinity : defaultDuration);
  const finite = Number.isFinite(duration);
  const dismissible = t.dismissible !== false;
  const [dx, setDx] = useState(0);
  const [swipeOut, setSwipeOut] = useState<'left' | 'right' | null>(null);
  const drag = useRef<{ x: number; time: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = el.style.height;
    el.style.height = 'auto';
    onHeight(t.id, el.getBoundingClientRect().height);
    el.style.height = prev;
  }, [t.id, t.version, t.message, t.description, onHeight]);

  // Auto-dismiss with pause/resume; restarts when the toast is updated.
  const remaining = useRef(duration);
  const lastVersion = useRef(t.version);
  if (lastVersion.current !== t.version) {
    lastVersion.current = t.version;
    remaining.current = duration;
  }
  useEffect(() => {
    if (!finite || paused || t.dismissed) return undefined;
    const startedAt = Date.now();
    const timer = setTimeout(() => {
      t.onAutoClose?.(t);
      dismissToast(t.id);
    }, Math.max(0, remaining.current));
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
    // `t` changes identity on every store update; the version covers real changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finite, paused, t.dismissed, t.version, t.id]);

  const onPointerDown = (e: ReactPointerEvent<HTMLLIElement>) => {
    if (!dismissible || (e.button !== undefined && e.button !== 0)) return;
    if ((e.target as HTMLElement).closest('button, a, input, textarea, select')) return;
    drag.current = { x: e.clientX, time: Date.now() };
    const el = e.currentTarget;
    if (typeof el.setPointerCapture === 'function' && e.pointerId !== undefined) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    }
    onSwipeChange(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLLIElement>) => {
    if (!drag.current) return;
    setDx(e.clientX - drag.current.x);
  };
  const endSwipe = (e: ReactPointerEvent<HTMLLIElement>) => {
    if (!drag.current) return;
    const distance = e.clientX - drag.current.x;
    const velocity = Math.abs(distance) / Math.max(1, Date.now() - drag.current.time);
    drag.current = null;
    onSwipeChange(false);
    if (Math.abs(distance) >= TOAST_SWIPE_THRESHOLD || (Math.abs(distance) >= 32 && velocity > 0.5)) {
      setSwipeOut(distance > 0 ? 'right' : 'left');
      if (t.sound !== false) emitUiSound('swipe');
      dismissToast(t.id);
    } else {
      setDx(0);
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Escape' && dismissible) {
      e.stopPropagation();
      dismissToast(t.id);
    }
  };

  const runAction = (action: ToastAction | undefined) => (e: ReactMouseEvent<HTMLButtonElement>) => {
    action?.onClick?.(e);
    if (!e.defaultPrevented) dismissToast(t.id);
  };

  const collapsedBack = !expanded && index > 0;
  const isError = t.type === 'error';
  const y = expanded ? offset : index * 14;
  const style = vars({
    '--pl-toast-y': `${isTop ? y : -y}px`,
    '--pl-toast-scale': expanded ? 1 : Math.max(0.8, 1 - index * 0.055),
    '--pl-toast-front-h': `${frontHeight}px`,
    '--pl-swipe-x': `${dx}px`,
    zIndex: count - index,
    opacity: dx ? Math.max(0.35, 1 - Math.abs(dx) / 220) : undefined,
  });

  return (
    <li
      ref={ref}
      // Items stay plain list items (valid ARIA); the list is a polite live region and errors interrupt.
      aria-live={isError ? 'assertive' : undefined}
      aria-atomic="true"
      tabIndex={0}
      className={cx('pl-toaster__toast', `pl-toaster__toast--${t.type}`, t.className)}
      data-type={t.type}
      data-front={index === 0 || undefined}
      data-collapsed={collapsedBack || undefined}
      data-state={t.dismissed ? 'closed' : 'open'}
      data-swipe-out={swipeOut ?? undefined}
      data-swiping={dx !== 0 || undefined}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
      onKeyDown={onKeyDown}
    >
      {(t.icon ?? t.type !== 'default') && <span className="pl-toaster__icon">{t.icon ?? <ToastGlyph type={t.type} />}</span>}
      <div className="pl-toaster__body">
        {t.type !== 'default' && t.type !== 'loading' && <span className="pl-sr-only">{DEFAULT_STATUS_LABEL[t.type]}: </span>}
        <div className="pl-toaster__title">{t.message}</div>
        {t.description != null && <div className="pl-toaster__desc">{t.description}</div>}
        {(t.action || t.cancel) && (
          <div className="pl-toaster__actions">
            {t.cancel && (
              <button type="button" className="pl-toaster__btn pl-toaster__btn--cancel" onClick={runAction(t.cancel)}>
                {t.cancel.label}
              </button>
            )}
            {t.action && (
              <button type="button" className="pl-toaster__btn pl-toaster__btn--action" onClick={runAction(t.action)}>
                {t.action.label}
              </button>
            )}
          </div>
        )}
      </div>
      {(t.closeButton ?? closeButton) && dismissible && (
        <button type="button" className="pl-toaster__close" aria-label={closeLabel} onClick={() => dismissToast(t.id)}>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
          </svg>
        </button>
      )}
      {(t.progress ?? progress) && finite && (
        <span className="pl-toaster__progress" aria-hidden="true">
          <span key={t.version} style={vars({ '--pl-countdown': `${duration}ms`, animationPlayState: paused ? 'paused' : 'running' })} />
        </span>
      )}
    </li>
  );
}

const DEFAULT_HOTKEY: ToasterHotkey = { altKey: true, code: 'KeyT' };

/** Notification region for `toast()`. Alt+T (configurable) moves focus into it. */
export function Toaster({
  position = 'bottom-end',
  richColors = false,
  closeButton = false,
  expand = false,
  visibleToasts = 3,
  duration = 4000,
  progress = false,
  gap = 12,
  hotkey = DEFAULT_HOTKEY,
  hotkeyLabel = 'Alt+T',
  label = 'Notifications',
  closeLabel = 'Dismiss notification',
  dir,
  className,
}: ToasterProps) {
  const toasts = useStore(toastStore);
  const listRef = useRef<HTMLOListElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [docHidden, setDocHidden] = useState(() => canUseDom() && document.visibilityState === 'hidden');
  const [heights, setHeights] = useState<Record<string, number>>({});

  const onHeight = useCallback((id: ToastId, h: number) => {
    setHeights((prev) => (prev[String(id)] === h ? prev : { ...prev, [String(id)]: h }));
  }, []);

  useEffect(() => {
    const onVisibility = () => setDocHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!hotkey) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const match =
        e.code === hotkey.code &&
        e.altKey === Boolean(hotkey.altKey) &&
        e.ctrlKey === Boolean(hotkey.ctrlKey) &&
        e.shiftKey === Boolean(hotkey.shiftKey) &&
        e.metaKey === Boolean(hotkey.metaKey);
      if (!match) return;
      e.preventDefault();
      const first = listRef.current?.querySelector<HTMLElement>('.pl-toaster__toast[data-state="open"]');
      (first ?? listRef.current)?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hotkey]);

  const shown = [...toasts].reverse().slice(0, Math.max(1, visibleToasts));
  const expanded = expand || hovered || focusWithin;
  const paused = hovered || focusWithin || docHidden || swiping;
  const isTop = position.startsWith('top');
  const heightOf = (t: ToastRecord) => heights[String(t.id)] ?? 0;
  const frontHeight = shown[0] ? heightOf(shown[0]) : 0;
  const offsets: number[] = [];
  shown.reduce((acc, t, i) => {
    offsets[i] = acc + i * gap;
    return acc + heightOf(t);
  }, 0);
  const expandedHeight = shown.reduce((acc, t) => acc + heightOf(t), 0) + Math.max(0, shown.length - 1) * gap;
  const listHeight = expanded ? expandedHeight : frontHeight + Math.max(0, shown.length - 1) * 14;

  return (
    <section
      aria-label={`${label} (${hotkeyLabel})`}
      className={cx('pl-toaster', `pl-toaster--${position}`, richColors && 'pl-toaster--rich', className)}
      data-expanded={expanded || undefined}
      dir={dir}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
      }}
    >
      <ol
        ref={listRef}
        tabIndex={-1}
        aria-live="polite"
        aria-relevant="additions text"
        className="pl-toaster__list"
        style={{ height: listHeight || undefined }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {shown.map((t, i) => (
          <ToastView
            key={t.id}
            t={t}
            index={i}
            count={shown.length}
            offset={offsets[i] ?? 0}
            frontHeight={frontHeight}
            expanded={expanded}
            paused={paused}
            isTop={isTop}
            defaultDuration={duration}
            closeButton={closeButton}
            progress={progress}
            closeLabel={closeLabel}
            onHeight={onHeight}
            onSwipeChange={setSwiping}
          />
        ))}
      </ol>
    </section>
  );
}

/* ==========================================================================
 * 3. Loaders
 * ======================================================================== */

export type LoaderType =
  | 'ring'
  | 'dual-ring'
  | 'dots'
  | 'bounce'
  | 'pulse'
  | 'bars'
  | 'wave'
  | 'orbit'
  | 'grid'
  | 'infinity'
  | 'square-spin'
  | 'ripple'
  | 'typing'
  | 'hourglass'
  | 'progress-ring';

export const LOADER_TYPES: readonly LoaderType[] = [
  'ring',
  'dual-ring',
  'dots',
  'bounce',
  'pulse',
  'bars',
  'wave',
  'orbit',
  'grid',
  'infinity',
  'square-spin',
  'ripple',
  'typing',
  'hourglass',
  'progress-ring',
];

const LOADER_PARTS: Partial<Record<LoaderType, number>> = {
  ring: 1,
  'dual-ring': 2,
  dots: 3,
  bounce: 3,
  pulse: 2,
  bars: 5,
  wave: 5,
  orbit: 3,
  grid: 9,
  'square-spin': 1,
  ripple: 2,
  typing: 3,
};

export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoaderTone = 'primary' | 'current' | 'muted' | 'success' | 'warning' | 'danger' | 'info';

const clampPct = (v: number) => Math.min(100, Math.max(0, v));

/** Decorative loader artwork only (aria-hidden). Used by Loader, toasts and swal buttons. */
function LoaderArt({ type, value, className, label }: { type: LoaderType; value?: number; className?: string; label?: string }) {
  if (type === 'infinity') {
    const d = 'M50 25c-6-11-12-15-19-15a15 15 0 0 0 0 30c7 0 13-4 19-15s12-15 19-15a15 15 0 0 1 0 30c-7 0-13-4-19-15z';
    return (
      <span className={cx('pl-loader__art', 'pl-loader__art--infinity', className)} aria-hidden="true">
        <svg viewBox="0 0 100 50" focusable="false">
          <path className="pl-loader__track" d={d} pathLength={100} />
          <path className="pl-loader__runner" d={d} pathLength={100} />
        </svg>
      </span>
    );
  }
  if (type === 'hourglass') {
    return (
      <span className={cx('pl-loader__art', 'pl-loader__art--hourglass', className)} aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path className="pl-loader__frame" d="M6 2.75h12M6 21.25h12M7.25 2.75c0 5 4.75 6.4 4.75 9.25S7.25 16.25 7.25 21.25M16.75 2.75c0 5-4.75 6.4-4.75 9.25s4.75 4.25 4.75 9.25" />
          <path className="pl-loader__sand pl-loader__sand--top" d="M9.2 6.4h5.6L12 10.4z" />
          <path className="pl-loader__sand pl-loader__sand--bottom" d="M8.6 19.6h6.8L12 15.4z" />
        </svg>
      </span>
    );
  }
  if (type === 'progress-ring') {
    const determinate = typeof value === 'number' && Number.isFinite(value);
    const pct = determinate ? clampPct(value) : 30;
    return (
      <span
        className={cx('pl-loader__art', 'pl-loader__art--progress-ring', !determinate && 'is-indeterminate', className)}
        role={determinate ? 'progressbar' : undefined}
        aria-label={determinate ? label : undefined}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? 100 : undefined}
        aria-valuenow={determinate ? Math.round(pct) : undefined}
        aria-hidden={determinate ? undefined : true}
      >
        <svg viewBox="0 0 36 36" focusable="false" aria-hidden="true">
          <circle className="pl-loader__track" cx="18" cy="18" r="15.5" />
          <circle className="pl-loader__value-arc" cx="18" cy="18" r="15.5" pathLength={100} style={{ strokeDashoffset: 100 - pct }} />
        </svg>
        {determinate && (
          <span className="pl-loader__value" aria-hidden="true">
            {Math.round(pct)}%
          </span>
        )}
      </span>
    );
  }
  const n = LOADER_PARTS[type] ?? 1;
  return (
    <span className={cx('pl-loader__art', `pl-loader__art--${type}`, className)} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="pl-loader__part" style={vars({ '--i': i })} />
      ))}
    </span>
  );
}

export interface LoaderProps {
  /** Default 'ring'. */
  type?: LoaderType;
  /** Token size or pixels. Inline loaders default to 1em. */
  size?: LoaderSize | number;
  /** Accessible name, always announced (default "Loading"). */
  label?: string;
  /** Show the label as visible text (recommended with reduced motion). */
  showLabel?: boolean;
  /** inline: sits in text/buttons. block: centered in its section. */
  variant?: 'inline' | 'block';
  tone?: LoaderTone;
  /** 0–100, for type="progress-ring" (determinate). */
  value?: number;
  className?: string;
  style?: CSSProperties;
}

/** Accessible loading indicator: role="status" with a (visually hidden by default) label. */
export function Loader({ type = 'ring', size, label = 'Loading', showLabel = false, variant = 'inline', tone = 'primary', value, className, style }: LoaderProps) {
  const sizeStyle = typeof size === 'number' ? vars({ '--pl-loader-size': `${size}px` }) : undefined;
  return (
    <span
      role="status"
      className={cx(
        'pl-loader',
        `pl-loader--${type}`,
        `pl-loader--${variant}`,
        typeof size === 'string' && `pl-loader--${size}`,
        tone !== 'primary' && `pl-loader--tone-${tone}`,
        showLabel && 'pl-loader--labelled',
        className,
      )}
      style={{ ...sizeStyle, ...style }}
    >
      <LoaderArt type={type} value={value} label={label} />
      <span className={showLabel ? 'pl-loader__label' : 'pl-sr-only'}>{label}</span>
    </span>
  );
}

export interface LoaderOverlayProps extends Omit<LoaderProps, 'variant'> {
  active: boolean;
  children?: ReactNode;
  /** Frost the covered content. Default true. */
  blur?: boolean;
  /** Wrapper class (the overlay is positioned relative to this wrapper). */
  className?: string;
  /** Sound requested when loading finishes (needs a SoundProvider). Default 'pop'; `false` disables. */
  doneSound?: UiSoundName | false;
}

/** Emits `sound` when `active` turns from true to false (never on mount). */
function useDoneSound(active: boolean, sound: UiSoundName | false) {
  const prev = useRef(active);
  useEffect(() => {
    if (prev.current && !active && sound) emitUiSound(sound);
    prev.current = active;
  }, [active, sound]);
}

/**
 * Covers its content while `active`: the region gets aria-busy, the content becomes inert
 * (not focusable, hidden from assistive tech) and a centered Loader announces the state.
 */
export function LoaderOverlay({ active, children, blur = true, className, type = 'orbit', label = 'Loading', doneSound = 'pop', ...loader }: LoaderOverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  useDoneSound(active, doneSound);
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (active) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }, [active]);
  return (
    <div className={cx('pl-loader-overlay', active && 'is-active', className)} aria-busy={active}>
      <div ref={contentRef} className="pl-loader-overlay__content">
        {children}
      </div>
      {active && (
        <div className={cx('pl-loader-overlay__scrim', blur && 'pl-loader-overlay__scrim--blur')}>
          <Loader {...loader} type={type} label={label} variant="block" />
        </div>
      )}
    </div>
  );
}

export interface PageLoaderProps extends Omit<LoaderProps, 'variant' | 'size'> {
  active: boolean;
  /** Logo or wordmark shown above the loader. */
  brand?: ReactNode;
  /** Fade-out length in ms. Default 450. */
  exitDuration?: number;
  /** Sound requested when loading finishes (needs a SoundProvider). Default 'pop'; `false` disables. */
  doneSound?: UiSoundName | false;
}

/** Full-page splash. Locks scroll and marks the page busy while active, then fades out. */
export function PageLoader({ active, brand, exitDuration = 450, type = 'orbit', label = 'Loading', showLabel = true, className, doneSound = 'pop', ...loader }: PageLoaderProps) {
  const [phase, setPhase] = useState<'visible' | 'leaving' | 'gone'>(active ? 'visible' : 'gone');
  useDoneSound(active, doneSound);

  useEffect(() => {
    if (active) {
      setPhase('visible');
      return undefined;
    }
    setPhase((p) => (p === 'gone' ? 'gone' : 'leaving'));
    const t = setTimeout(() => setPhase('gone'), exitDuration);
    return () => clearTimeout(t);
  }, [active, exitDuration]);

  useEffect(() => {
    if (!active) return undefined;
    const releaseScroll = lockScroll();
    const body = document.body;
    const prevBusy = body.getAttribute('aria-busy');
    body.setAttribute('aria-busy', 'true');
    return () => {
      releaseScroll();
      if (prevBusy === null) body.removeAttribute('aria-busy');
      else body.setAttribute('aria-busy', prevBusy);
    };
  }, [active]);

  if (phase === 'gone' || !canUseDom()) return null;
  return createPortal(
    <div className={cx('pl-page-loader', className)} data-state={phase} style={vars({ '--pl-page-loader-exit': `${exitDuration}ms` })} aria-hidden={phase === 'leaving' || undefined}>
      <div className="pl-page-loader__inner">
        {brand != null && <div className="pl-page-loader__brand">{brand}</div>}
        <Loader {...loader} type={type} label={label} showLabel={showLabel} size="lg" variant="block" />
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Top-of-page progress (NProgress-like) ---------- */

interface TopProgressState {
  /** 0–1, or null when hidden. */
  value: number | null;
  done: boolean;
}

const topStore = createStore<TopProgressState>({ value: null, done: false });
let trickleTimer: ReturnType<typeof setInterval> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function stopTrickle() {
  if (trickleTimer !== undefined) clearInterval(trickleTimer);
  trickleTimer = undefined;
}

/** Imperative controller for `<TopProgressBar />`. */
export const topProgress = {
  /** Show the bar and trickle forward until `done()`. */
  start() {
    if (hideTimer !== undefined) clearTimeout(hideTimer);
    hideTimer = undefined;
    const { value, done } = topStore.get();
    if (value === null || done) topStore.set({ value: 0.08, done: false });
    if (trickleTimer === undefined) trickleTimer = setInterval(() => topProgress.inc(), 500);
  },
  /** Set progress (0–1). */
  set(n: number) {
    if (hideTimer !== undefined) clearTimeout(hideTimer);
    hideTimer = undefined;
    topStore.set({ value: Math.min(1, Math.max(0, n)), done: false });
  },
  /** Nudge forward; smaller steps as it approaches the end. Never reaches 100% on its own. */
  inc(amount?: number) {
    const { value, done } = topStore.get();
    if (value === null || done) {
      topProgress.start();
      return;
    }
    const step = amount ?? (value < 0.2 ? 0.1 : value < 0.5 ? 0.04 : value < 0.8 ? 0.02 : value < 0.99 ? 0.005 : 0);
    topStore.set({ value: Math.min(value + step, 0.994), done: false });
  },
  /** Complete to 100% and fade out. */
  done() {
    stopTrickle();
    if (topStore.get().value === null) return;
    topStore.set({ value: 1, done: true });
    hideTimer = setTimeout(() => {
      hideTimer = undefined;
      topStore.set({ value: null, done: false });
    }, 400);
  },
  isStarted: () => topStore.get().value !== null && !topStore.get().done,
  get value(): number | null {
    return topStore.get().value;
  },
};

export interface TopProgressBarProps {
  label?: string;
  /** Bar thickness in px. Default 3. */
  height?: number;
  className?: string;
}

/** Thin progress bar fixed to the top of the viewport, driven by `topProgress`. */
export function TopProgressBar({ label = 'Page loading', height = 3, className }: TopProgressBarProps) {
  const { value, done } = useStore(topStore);
  if (value === null) return null;
  return (
    <div
      className={cx('pl-top-progress', className)}
      data-state={done ? 'done' : 'running'}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      style={vars({ '--pl-top-progress-h': `${height}px` })}
    >
      <div className="pl-top-progress__bar" style={vars({ '--pl-top-progress-value': value })} />
    </div>
  );
}

/* ==========================================================================
 * 4. useAsyncAction
 * ======================================================================== */

export interface AsyncActionState<A extends unknown[], R> {
  /** Runs the action; resolves to its result, or undefined when it throws (see `error`). */
  run: (...args: A) => Promise<R | undefined>;
  loading: boolean;
  error: unknown;
  reset: () => void;
}

/** Wire a button (`<Button loading={loading} onClick={() => run()}>`) to async work. Only the latest call updates state. */
export function useAsyncAction<A extends unknown[], R>(fn: (...args: A) => Promise<R> | R): AsyncActionState<A, R> {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const [state, setState] = useState<{ loading: boolean; error: unknown }>({ loading: false, error: null });
  const mounted = useRef(true);
  const callId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args: A): Promise<R | undefined> => {
    const id = ++callId.current;
    setState({ loading: true, error: null });
    try {
      const result = await fnRef.current(...args);
      if (mounted.current && id === callId.current) setState({ loading: false, error: null });
      return result;
    } catch (error) {
      if (mounted.current && id === callId.current) setState({ loading: false, error });
      return undefined;
    }
  }, []);

  const reset = useCallback(() => setState({ loading: false, error: null }), []);
  return { run, loading: state.loading, error: state.error, reset };
}

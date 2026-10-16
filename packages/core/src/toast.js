// Pelagic UI toaster — the notification queue, its icons, announcer and a framework-free DOM renderer.
//
// One store holds every toast; `toast()` / `toast.success()` / `toast.promise()` write to it from anywhere.
// React renders the store with JSX (same markup, same CSS); Vue, Svelte, Angular, Astro and plain pages use
// mountToaster(), which renders it into a <section> with:
//   • spring enter / exit from the chosen corner or edge (6 positions, RTL aware), fade only under reduced motion
//   • a collapsed deck that fans out on hover or keyboard focus, and a queue beyond `visibleToasts`
//   • swipe to dismiss (pointer, pen and touch), Escape, close button, actions, cancel and undo
//   • a countdown bar and timer that pause on hover, focus, swipe and while the tab is hidden
//   • animated icons per type; a loading spinner morphs into the result of toast.promise()
//   • one polite and one assertive live region (errors interrupt, nothing is announced twice)
//   • optional sounds through the Pelagic sound engine (emitUiSound)
import { emitUiSound } from './sound.js';

export const TOAST_TYPES = Object.freeze(['default', 'success', 'error', 'warning', 'info', 'loading']);
export const TOAST_POSITIONS = Object.freeze(['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end']);
/** Horizontal swipe distance (px) that dismisses a toast. */
export const TOAST_SWIPE_THRESHOLD = 64;
/** Exit animation length before a dismissed toast leaves the DOM. */
export const TOAST_EXIT_MS = 200;

/** Labels of the toaster in English and Arabic. */
export const toastLabels = Object.freeze({
  en: {
    region: 'Notifications',
    close: 'Dismiss notification',
    undo: 'Undo',
    status: { success: 'Success', error: 'Error', warning: 'Warning', info: 'Information', loading: 'Loading' },
  },
  ar: {
    region: 'الإشعارات',
    close: 'إغلاق الإشعار',
    undo: 'تراجع',
    status: { success: 'تم بنجاح', error: 'خطأ', warning: 'تحذير', info: 'معلومة', loading: 'جارٍ التحميل' },
  },
});

export function getToastLabels(locale = 'en', overrides) {
  const base = toastLabels[String(locale).toLowerCase().startsWith('ar') ? 'ar' : 'en'];
  if (!overrides) return base;
  return { ...base, ...overrides, status: { ...base.status, ...(overrides.status ?? {}) } };
}

/* ==========================================================================
 * Store
 * ======================================================================== */

/** The sound a toast type asks for (null: silent). */
export function toastSound(type) {
  if (type === 'loading') return null;
  return type === 'default' ? 'notification' : type;
}

/**
 * A toast queue. `get()` returns the records oldest first; `subscribe(listener)` works with React's
 * useSyncExternalStore. Records are plain objects: { id, type, message, description, avatar, icon,
 * duration, action, cancel, undo, closeButton, dismissible, progress, sound, version, dismissed, from }.
 * `from` is the previous type when it changed (loading → success lets renderers morph the icon).
 */
export function createToastStore() {
  let state = [];
  let seq = 0;
  let paused = 0;
  const listeners = new Set();
  const timers = new Map();
  const store = {
    get: () => state,
    set(next) {
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Pause every countdown from code (e.g. while a modal is open). Nested calls stack. */
    pause() {
      paused += 1;
      listeners.forEach((l) => l());
    },
    resume() {
      paused = Math.max(0, paused - 1);
      listeners.forEach((l) => l());
    },
    isPaused: () => paused > 0,
    upsert(message, opts = {}) {
      const list = state;
      const id = opts.id ?? `pl-toast-${++seq}`;
      const existing = list.find((t) => t.id === id);
      const nextType = opts.type ?? existing?.type ?? 'default';
      const silent = (opts.sound ?? existing?.sound) === false;
      if (!silent && (!existing || existing.type !== nextType || existing.dismissed)) {
        const s = opts.sound || toastSound(nextType);
        if (s) emitUiSound(s);
      }
      clearTimeout(timers.get(id));
      timers.delete(id);
      if (existing) {
        const from = existing.type !== nextType ? existing.type : existing.from;
        store.set(list.map((t) => (t.id === id ? { ...t, ...opts, message, id, type: nextType, from, version: t.version + 1, dismissed: false } : t)));
      } else {
        store.set([...list, { ...opts, id, message, type: nextType, version: 0, dismissed: false, createdAt: Date.now() }]);
      }
      return id;
    },
    dismiss(id) {
      const targets = state.filter((t) => !t.dismissed && (id === undefined || t.id === id));
      if (!targets.length) return;
      const ids = new Set(targets.map((t) => t.id));
      store.set(state.map((t) => (ids.has(t.id) ? { ...t, dismissed: true } : t)));
      targets.forEach((t) => t.onDismiss?.(t));
      for (const t of targets) {
        timers.set(
          t.id,
          setTimeout(() => {
            timers.delete(t.id);
            store.set(state.filter((x) => !(x.id === t.id && x.dismissed)));
          }, TOAST_EXIT_MS),
        );
      }
    },
    remove(id) {
      store.set(id === undefined ? [] : state.filter((t) => t.id !== id));
    },
  };
  return store;
}

/** Build the `toast()` API over a store. */
export function createToastApi(store) {
  const typed = (type) => (message, opts) => store.upsert(message, { ...opts, type });
  return Object.assign((message, opts) => store.upsert(message, opts), {
    success: typed('success'),
    error: typed('error'),
    warning: typed('warning'),
    info: typed('info'),
    loading: typed('loading'),
    /** Shows a loading toast, then morphs it into success or error. Returns the toast id. */
    promise(promise, messages, opts) {
      const id = store.upsert(messages.loading, { ...opts, type: 'loading', description: messages.description });
      const p = typeof promise === 'function' ? promise() : promise;
      Promise.resolve(p).then(
        (data) => store.upsert(typeof messages.success === 'function' ? messages.success(data) : messages.success, { id, type: 'success', ...(messages.successOptions ?? {}) }),
        (error) => store.upsert(typeof messages.error === 'function' ? messages.error(error) : messages.error, { id, type: 'error', ...(messages.errorOptions ?? {}) }),
      );
      return id;
    },
    /** Dismiss one toast (with its exit animation), or all of them. */
    dismiss: (id) => store.dismiss(id),
    /** Remove immediately, without the exit animation. */
    remove: (id) => store.remove(id),
    /** Merge new options (and optionally a new `message`) into a toast; restarts its timer. */
    update(id, opts) {
      const current = store.get().find((t) => t.id === id);
      if (!current) return;
      const { message, ...rest } = opts;
      store.upsert(message ?? current.message, { ...rest, id });
    },
    getToasts: () => store.get(),
    store,
  });
}

/** The page-wide queue every Toaster renders by default. */
export const toastStore = createToastStore();
/** `toast('Saved')`, `toast.success(…)`, `toast.promise(p, { loading, success, error })`, `toast.dismiss(id)`. */
export const toast = createToastApi(toastStore);

/* ==========================================================================
 * Icons (decorative; the type is also written out for screen readers)
 * ======================================================================== */

const MARKS = {
  success: '<path class="pl-toast-ico__mark" d="M8 12.35l2.75 2.75L16.2 9.4" pathLength="1"/>',
  error: '<path class="pl-toast-ico__mark" d="M9 9l6 6M15 9l-6 6" pathLength="1"/>',
  warning: '<path class="pl-toast-ico__mark" d="M12 7.6v5.2" pathLength="1"/><circle class="pl-toast-ico__dot" cx="12" cy="16.1" r="1.15"/>',
  info: '<circle class="pl-toast-ico__dot" cx="12" cy="7.9" r="1.15"/><path class="pl-toast-ico__mark" d="M12 11v5.4" pathLength="1"/>',
  loading: '',
};

/**
 * SVG of a toast icon: a rounded tile in the type's tone with a mark that draws in. `from: 'loading'`
 * adds the spinner arc that closes into the tile, so a promise toast morphs into its result.
 */
export function toastIconSVG(type, { from } = {}) {
  if (type === 'default') return '';
  const arc = type === 'loading' || from === 'loading' ? '<circle class="pl-toast-ico__arc" cx="12" cy="12" r="6.6" pathLength="1"/>' : '';
  return `<svg class="pl-toast-ico pl-toast-ico--${type}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"${from === 'loading' && type !== 'loading' ? ' data-morph=""' : ''}><rect class="pl-toast-ico__tile" x="1.5" y="1.5" width="21" height="21" rx="7"/>${arc}${MARKS[type] ?? ''}</svg>`;
}

/* ==========================================================================
 * Announcer: one polite and one assertive region, each message spoken once
 * ======================================================================== */

/**
 * Announce toasts through two visually hidden live regions. `announce(id, version, text, assertive)`
 * speaks `text` unless that toast version was already announced or the same text is already showing.
 */
export function createToastAnnouncer(polite, assertive) {
  const spoken = new Map();
  return {
    announce(id, version, text, isAssertive) {
      const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
      if (!clean) return;
      const key = `${version}|${clean}`;
      if (spoken.get(id) === key) return;
      // A new version with the same words (a timer restart) is not news either.
      if (spoken.get(id)?.split('|').slice(1).join('|') === clean) {
        spoken.set(id, key);
        return;
      }
      spoken.set(id, key);
      const region = isAssertive ? assertive : polite;
      if (!region) return;
      // Clear first so a repeat of an older message is announced again.
      region.textContent = '';
      const write = () => {
        region.textContent = clean;
        // Stale text would be read again when a user browses into the region: clear it after a while.
        clearTimeout(region.__plClear);
        region.__plClear = setTimeout(() => {
          if (region.textContent === clean) region.textContent = '';
        }, 7000);
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(write);
      else write();
    },
    forget(id) {
      spoken.delete(id);
    },
  };
}

/* ==========================================================================
 * Layout of the deck (shared by every renderer)
 * ======================================================================== */

/**
 * Offsets of the shown toasts (front first): expanded = stacked with `gap`, collapsed = a deck that peeks
 * by `peek` px and shrinks. Returns { items: [{ y, scale }], height }.
 */
export function toastDeckLayout(heights, { expanded, gap = 12, peek = 14 }) {
  const items = [];
  let acc = 0;
  heights.forEach((h, i) => {
    items.push(expanded ? { y: acc + i * gap, scale: 1 } : { y: i * peek, scale: Math.max(0.8, 1 - i * 0.055) });
    acc += h;
  });
  const height = expanded ? acc + Math.max(0, heights.length - 1) * gap : (heights[0] ?? 0) + Math.max(0, heights.length - 1) * peek;
  return { items, height };
}

/* ==========================================================================
 * DOM renderer
 * ======================================================================== */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const DEFAULT_HOTKEY = { altKey: true, code: 'KeyT' };
const CLOSE_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>';

/** Write a message into an element: strings as text (never HTML), DOM nodes as they are. */
function setContent(el, value) {
  if (value && typeof value === 'object' && value.nodeType) el.replaceChildren(value);
  else el.textContent = value == null ? '' : String(value);
}

function avatarHTML(avatar) {
  if (!avatar) return '';
  const a = typeof avatar === 'string' ? { src: avatar } : avatar;
  if (a.src) return `<img class="pl-toaster__avatar" src="${esc(a.src)}" alt="${esc(a.alt ?? '')}" width="36" height="36" decoding="async">`;
  const initials = a.initials ?? String(a.name ?? '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return `<span class="pl-toaster__avatar pl-toaster__avatar--initials" aria-hidden="true">${esc(initials)}</span>`;
}

/**
 * Render a toast queue into the page and keep it in sync. Options: position ('bottom-end'), visibleToasts (3),
 * duration (4000), gap (12), expand, richColors, closeButton, progress, hotkey ({ altKey, code } or false),
 * hotkeyLabel ('Alt+T'), locale ('en' | 'ar'), labels, dir, className, store (default toastStore), target
 * (default document.body). Returns { element, update(options), destroy() }.
 */
export function mountToaster(options = {}) {
  let opts = { position: 'bottom-end', visibleToasts: 3, duration: 4000, gap: 12, hotkey: DEFAULT_HOTKEY, hotkeyLabel: 'Alt+T', ...options };
  const store = opts.store ?? toastStore;
  const doc = opts.target?.ownerDocument ?? document;
  const host = opts.target ?? doc.body;
  let labels = getToastLabels(opts.locale, opts.labels);

  const section = doc.createElement('section');
  const list = doc.createElement('ol');
  list.className = 'pl-toaster__list';
  list.tabIndex = -1;
  const polite = doc.createElement('div');
  polite.className = 'pl-sr-only';
  polite.setAttribute('role', 'status');
  polite.setAttribute('aria-live', 'polite');
  polite.setAttribute('aria-atomic', 'true');
  polite.setAttribute('data-toast-announcer', 'polite');
  const assertive = doc.createElement('div');
  assertive.className = 'pl-sr-only';
  assertive.setAttribute('aria-live', 'assertive');
  assertive.setAttribute('aria-atomic', 'true');
  assertive.setAttribute('data-toast-announcer', 'assertive');
  section.append(list, polite, assertive);
  host.appendChild(section);
  const announcer = createToastAnnouncer(polite, assertive);

  const views = new Map(); // id -> { li, record, remaining, startedAt, timer, height, dx }
  let hovered = false;
  let focusWithin = false;
  let swiping = false;
  let hidden = doc.visibilityState === 'hidden';

  const applyShell = () => {
    section.className = `pl-toaster pl-toaster--${opts.position}${opts.richColors ? ' pl-toaster--rich' : ''}${opts.className ? ` ${opts.className}` : ''}`;
    section.setAttribute('aria-label', opts.hotkey ? `${labels.region} (${opts.hotkeyLabel})` : labels.region);
    if (opts.dir) section.setAttribute('dir', opts.dir);
    else section.removeAttribute('dir');
  };

  const isPaused = () => hovered || focusWithin || swiping || hidden || store.isPaused?.();
  const durationOf = (t) => t.duration ?? (t.type === 'loading' ? Infinity : opts.duration);

  const stopTimer = (v) => {
    if (v.timer) {
      clearTimeout(v.timer);
      v.timer = null;
      v.remaining -= Date.now() - v.startedAt;
    }
  };
  const startTimer = (v) => {
    if (v.timer || !Number.isFinite(v.total) || v.record.dismissed) return;
    v.startedAt = Date.now();
    v.timer = setTimeout(() => {
      v.timer = null;
      v.record.onAutoClose?.(v.record);
      store.dismiss(v.record.id);
    }, Math.max(0, v.remaining));
  };
  const syncTimers = () => {
    const paused = isPaused();
    for (const v of views.values()) {
      if (!v.shown || paused) stopTimer(v);
      else startTimer(v);
      const bar = v.li.querySelector('.pl-toaster__progress > span');
      if (bar) bar.style.animationPlayState = paused ? 'paused' : 'running';
    }
  };

  const fill = (v) => {
    const t = v.record;
    const li = v.li;
    const actionDef = t.action ?? (t.undo ? { label: labels.undo, onClick: typeof t.undo === 'function' ? t.undo : t.undo.onClick } : null);
    const closeOn = (t.closeButton ?? opts.closeButton) && t.dismissible !== false;
    const total = durationOf(t);
    const progress = (t.progress ?? opts.progress) && Number.isFinite(total);
    li.className = `pl-toaster__toast pl-toaster__toast--${t.type}${t.avatar ? ' pl-toaster__toast--avatar' : ''}${t.className ? ` ${t.className}` : ''}`;
    li.setAttribute('data-type', t.type);
    const icon = t.icon === false ? '' : t.avatar ? avatarHTML(t.avatar) : `<span class="pl-toaster__icon" aria-hidden="true">${toastIconSVG(t.type, { from: t.from })}</span>`;
    const status = t.type !== 'default' ? `<span class="pl-sr-only">${esc(labels.status[t.type] ?? t.type)}: </span>` : '';
    li.innerHTML = `${icon}<div class="pl-toaster__body">${status}<div class="pl-toaster__title"></div>${t.description != null ? '<div class="pl-toaster__desc"></div>' : ''}${actionDef || t.cancel ? `<div class="pl-toaster__actions">${t.cancel ? '<button type="button" class="pl-toaster__btn pl-toaster__btn--cancel" data-toast-cancel></button>' : ''}${actionDef ? '<button type="button" class="pl-toaster__btn pl-toaster__btn--action" data-toast-action></button>' : ''}</div>` : ''}</div>${closeOn ? `<button type="button" class="pl-toaster__close" aria-label="${esc(labels.close)}" data-toast-close>${CLOSE_SVG}</button>` : ''}${progress ? `<span class="pl-toaster__progress" aria-hidden="true"><span style="--pl-countdown: ${total}ms"></span></span>` : ''}`;
    if (t.icon && t.icon !== false && typeof t.icon === 'object' && t.icon.nodeType) li.querySelector('.pl-toaster__icon')?.replaceChildren(t.icon);
    setContent(li.querySelector('.pl-toaster__title'), t.message);
    if (t.description != null) setContent(li.querySelector('.pl-toaster__desc'), t.description);
    const run = (def) => (e) => {
      def?.onClick?.(e);
      if (!e.defaultPrevented) store.dismiss(t.id);
    };
    if (t.cancel) {
      const b = li.querySelector('[data-toast-cancel]');
      setContent(b, t.cancel.label);
      b.addEventListener('click', run(t.cancel));
    }
    if (actionDef) {
      const b = li.querySelector('[data-toast-action]');
      setContent(b, actionDef.label);
      b.addEventListener('click', run(actionDef));
    }
    li.querySelector('[data-toast-close]')?.addEventListener('click', () => store.dismiss(t.id));
    v.total = total;
    v.remaining = total;
    v.timer && clearTimeout(v.timer);
    v.timer = null;
  };

  const measure = (v) => {
    const prev = v.li.style.height;
    v.li.style.height = 'auto';
    v.height = v.li.getBoundingClientRect().height;
    v.li.style.height = prev;
  };

  const create = (t) => {
    const li = doc.createElement('li');
    li.tabIndex = 0;
    li.setAttribute('data-state', 'open');
    const v = { li, record: t, version: -1, remaining: 0, total: 0, timer: null, startedAt: 0, height: 0, shown: false, drag: null };
    li.addEventListener('pointerdown', (e) => {
      if (v.record.dismissible === false || (e.button !== undefined && e.button !== 0)) return;
      if (e.target.closest?.('button, a, input, textarea, select')) return;
      v.drag = { x: e.clientX, y: e.clientY, time: Date.now() };
      try {
        if (e.pointerId !== undefined) li.setPointerCapture?.(e.pointerId);
      } catch {
        /* already released */
      }
      swiping = true;
      syncTimers();
    });
    li.addEventListener('pointermove', (e) => {
      if (!v.drag) return;
      const dx = e.clientX - v.drag.x;
      li.style.setProperty('--pl-swipe-x', `${dx}px`);
      li.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 220));
      if (dx) li.setAttribute('data-swiping', 'true');
    });
    const end = (e) => {
      if (!v.drag) return;
      const distance = e.clientX - v.drag.x;
      const velocity = Math.abs(distance) / Math.max(1, Date.now() - v.drag.time);
      v.drag = null;
      swiping = false;
      li.removeAttribute('data-swiping');
      if (Math.abs(distance) >= TOAST_SWIPE_THRESHOLD || (Math.abs(distance) >= 32 && velocity > 0.5)) {
        li.setAttribute('data-swipe-out', distance > 0 ? 'right' : 'left');
        if (v.record.sound !== false) emitUiSound('swipe');
        store.dismiss(v.record.id);
      } else {
        li.style.removeProperty('--pl-swipe-x');
        li.style.removeProperty('opacity');
      }
      syncTimers();
    };
    li.addEventListener('pointerup', end);
    li.addEventListener('pointercancel', end);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && v.record.dismissible !== false) {
        e.stopPropagation();
        store.dismiss(v.record.id);
      }
    });
    views.set(t.id, v);
    return v;
  };

  const render = () => {
    const all = store.get();
    const shown = [...all].reverse().slice(0, Math.max(1, opts.visibleToasts));
    const shownIds = new Set(shown.map((t) => t.id));
    // Drop views whose toast is gone or queued behind the visible ones.
    for (const [id, v] of views) {
      if (!shownIds.has(id)) {
        stopTimer(v);
        v.li.remove();
        views.delete(id);
        if (!all.some((t) => t.id === id)) announcer.forget(id);
      }
    }
    shown.forEach((t, i) => {
      const v = views.get(t.id) ?? create(t);
      const changed = v.version !== t.version;
      v.record = t;
      if (changed) {
        v.version = t.version;
        fill(v);
        measure(v);
      }
      v.li.setAttribute('data-state', t.dismissed ? 'closed' : 'open');
      if (i === 0) v.li.setAttribute('data-front', 'true');
      else v.li.removeAttribute('data-front');
      v.shown = !t.dismissed;
      // Newest first in the DOM, like the React renderer.
      if (list.children[i] !== v.li) list.insertBefore(v.li, list.children[i] ?? null);
      if (changed && !t.dismissed) {
        const title = v.li.querySelector('.pl-toaster__body')?.textContent ?? '';
        announcer.announce(t.id, t.version, title, t.type === 'error');
      }
    });
    layout(shown);
    syncTimers();
  };

  const layout = (shown) => {
    const expanded = !!(opts.expand || hovered || focusWithin);
    if (expanded) section.setAttribute('data-expanded', 'true');
    else section.removeAttribute('data-expanded');
    const heights = shown.map((t) => views.get(t.id)?.height ?? 0);
    const { items, height } = toastDeckLayout(heights, { expanded, gap: opts.gap });
    const isTop = opts.position.startsWith('top');
    list.style.height = height ? `${height}px` : '';
    shown.forEach((t, i) => {
      const v = views.get(t.id);
      if (!v) return;
      const { y, scale } = items[i];
      v.li.style.setProperty('--pl-toast-y', `${isTop ? y : -y}px`);
      v.li.style.setProperty('--pl-toast-scale', String(scale));
      v.li.style.setProperty('--pl-toast-front-h', `${heights[0]}px`);
      v.li.style.zIndex = String(shown.length - i);
      if (!expanded && i > 0) v.li.setAttribute('data-collapsed', 'true');
      else v.li.removeAttribute('data-collapsed');
    });
  };

  const relayout = () => layout([...store.get()].reverse().slice(0, Math.max(1, opts.visibleToasts)));
  const onEnter = () => {
    hovered = true;
    relayout();
    syncTimers();
  };
  const onLeave = () => {
    hovered = false;
    relayout();
    syncTimers();
  };
  const onFocusIn = () => {
    focusWithin = true;
    relayout();
    syncTimers();
  };
  const onFocusOut = (e) => {
    if (section.contains(e.relatedTarget)) return;
    focusWithin = false;
    relayout();
    syncTimers();
  };
  const onVisibility = () => {
    hidden = doc.visibilityState === 'hidden';
    syncTimers();
  };
  const onHotkey = (e) => {
    const h = opts.hotkey;
    if (!h) return;
    const match = e.code === h.code && e.altKey === !!h.altKey && e.ctrlKey === !!h.ctrlKey && e.shiftKey === !!h.shiftKey && e.metaKey === !!h.metaKey;
    if (!match) return;
    e.preventDefault();
    (list.querySelector('.pl-toaster__toast[data-state="open"]') ?? list).focus();
  };
  list.addEventListener('mouseenter', onEnter);
  list.addEventListener('mouseleave', onLeave);
  section.addEventListener('focusin', onFocusIn);
  section.addEventListener('focusout', onFocusOut);
  doc.addEventListener('visibilitychange', onVisibility);
  doc.addEventListener('keydown', onHotkey);
  const unsubscribe = store.subscribe(render);
  applyShell();
  render();

  return {
    element: section,
    update(next = {}) {
      opts = { ...opts, ...next };
      labels = getToastLabels(opts.locale, opts.labels);
      applyShell();
      for (const v of views.values()) v.version = -1;
      render();
    },
    destroy() {
      unsubscribe();
      for (const v of views.values()) stopTimer(v);
      views.clear();
      list.removeEventListener('mouseenter', onEnter);
      list.removeEventListener('mouseleave', onLeave);
      doc.removeEventListener('visibilitychange', onVisibility);
      doc.removeEventListener('keydown', onHotkey);
      section.remove();
    },
  };
}

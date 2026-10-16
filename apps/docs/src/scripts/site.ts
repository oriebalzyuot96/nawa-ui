// Site chrome behaviour: appearance (theme) controls, mobile menu, ⌘K palette, copy buttons,
// package-manager memory, the home studio, motion pause, scroll-spy and small visual touches.
// Everything degrades gracefully: without this script the pages are complete, readable documents.
import { getThemeState, onThemeChange, switchTheme } from '@pelagic-ui/core/theme';

const doc = document.documentElement;
const ar = doc.lang === 'ar';
const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  },
};

/* ---------- Live region for small confirmations ---------- */
const live = document.querySelector<HTMLElement>('[data-site-live]');
function announce(message: string) {
  if (!live) return;
  live.textContent = '';
  window.setTimeout(() => (live.textContent = message), 60);
}

/* ---------- Appearance: mode, preset, accent, shape (animated with switchTheme) ---------- */
// The saved choice was applied before first paint (ThemeScript). Every change goes through switchTheme(),
// which reveals the new theme in a circle from the control that was used (instant under reduced motion)
// and tells the AccessibilityPanel, which offers the same choices, so both stay in sync.
const accentFallback = 'default';
function syncAppearance(state = getThemeState()) {
  const current: Record<string, string> = { mode: state.mode, accent: state.brand ? '' : state.accent ?? accentFallback, shape: state.shape };
  for (const input of document.querySelectorAll<HTMLInputElement>('[data-theme-choice]')) {
    input.checked = current[input.dataset.themeChoice!] === input.value || (input.dataset.themeChoice === 'accent' && current.accent === accentFallback && input.value === 'violet' && state.preset === 'default');
  }
  const preset = document.querySelector<HTMLSelectElement>('[data-theme-preset-choice]');
  if (preset) preset.value = state.preset;
}
syncAppearance();
onThemeChange((state) => syncAppearance(state));
for (const input of document.querySelectorAll<HTMLInputElement>('[data-theme-choice]')) {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    void switchTheme({ [input.dataset.themeChoice!]: input.value }, { origin: input });
  });
}
document.querySelector<HTMLSelectElement>('[data-theme-preset-choice]')?.addEventListener('change', (e) => {
  const select = e.currentTarget as HTMLSelectElement;
  void switchTheme({ preset: select.value }, { origin: select });
});

/* ---------- Disclosures: appearance popover and the mobile menu ---------- */
function disclosure(button: HTMLElement | null, panel: HTMLElement | null, opts: { useHidden: boolean; root?: HTMLElement | null }) {
  if (!button || !panel) return null;
  const isOpen = () => button.getAttribute('aria-expanded') === 'true';
  const set = (open: boolean, restoreFocus = false) => {
    button.setAttribute('aria-expanded', String(open));
    if (opts.useHidden) panel.hidden = !open;
    else panel.toggleAttribute('data-open', open);
    if (!open && restoreFocus) button.focus();
  };
  button.addEventListener('click', () => set(!isOpen()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      // Let open dialogs (palette, a11y panel) handle their own Escape first.
      if (document.querySelector('dialog[open], .pl-a11y-panel[data-open], [role="dialog"][aria-modal="true"]:not([hidden])')) return;
      set(false, true);
    }
  });
  document.addEventListener('pointerdown', (e) => {
    const root = opts.root ?? panel;
    if (isOpen() && !root.contains(e.target as Node) && !button.contains(e.target as Node)) set(false);
  });
  return { set, isOpen };
}

const appearanceRoot = document.querySelector<HTMLElement>('[data-appearance]');
disclosure(
  appearanceRoot?.querySelector<HTMLElement>('[data-appearance-toggle]') ?? null,
  appearanceRoot?.querySelector<HTMLElement>('[data-appearance-panel]') ?? null,
  { useHidden: true, root: appearanceRoot },
);

const menu = disclosure(document.querySelector<HTMLElement>('[data-menu-toggle]'), document.querySelector<HTMLElement>('[data-site-nav]'), {
  useHidden: false,
});
if (menu) {
  const wide = window.matchMedia('(min-width: 1080px)');
  wide.addEventListener('change', () => wide.matches && menu.set(false));
}

/* ---------- Motion: the site's own pause control ---------- */
const MOTION_KEY = 'pelagic-docs-motion';
function setMotion(paused: boolean, persist = true) {
  if (paused) doc.setAttribute('data-site-motion', 'paused');
  else doc.removeAttribute('data-site-motion');
  if (persist) store.set(MOTION_KEY, paused ? 'paused' : null);
  for (const sw of document.querySelectorAll<HTMLElement>('[data-motion-switch]')) {
    sw.setAttribute('aria-checked', String(!paused));
    const state = sw.querySelector<HTMLElement>('[data-motion-state]');
    if (state) state.textContent = (paused ? state.dataset.off : state.dataset.on) ?? '';
  }
  for (const btn of document.querySelectorAll<HTMLElement>('[data-motion-button]')) {
    btn.setAttribute('aria-pressed', String(paused));
    const label = btn.querySelector<HTMLElement>('[data-motion-label]');
    if (label) label.textContent = (paused ? btn.dataset.play : btn.dataset.pause) ?? '';
  }
}
setMotion(doc.getAttribute('data-site-motion') === 'paused', false);
document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('[data-motion-switch], [data-motion-button]');
  if (target) setMotion(doc.getAttribute('data-site-motion') !== 'paused');
});

/* ---------- Copy buttons ---------- */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
document.addEventListener('click', async (e) => {
  const button = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
  if (!button) return;
  const install = button.closest('[data-install]');
  const block = button.closest('[data-code-block]');
  const text = install?.querySelector('[data-install-cmd]')?.textContent ?? block?.querySelector('pre')?.textContent ?? '';
  if (!text || !(await copyText(text.trim()))) return;
  button.setAttribute('data-copied', '');
  const label = button.querySelector<HTMLElement>('[data-copy-text]');
  const before = label?.textContent;
  if (label) label.textContent = ar ? 'تم النسخ' : 'Copied';
  announce(ar ? 'تم النسخ إلى الحافظة' : 'Copied to the clipboard');
  window.setTimeout(() => {
    button.removeAttribute('data-copied');
    if (label && before) label.textContent = before;
  }, 1800);
});

/* ---------- Package manager memory ---------- */
const PM_KEY = 'pelagic-docs-pm';
function applyPm(pm: string) {
  for (const root of document.querySelectorAll<HTMLElement>('[data-install]')) {
    const cmds = JSON.parse(root.dataset.cmds ?? '{}') as Record<string, string>;
    if (!cmds[pm]) continue;
    root.dataset.pm = pm;
    const cmd = root.querySelector<HTMLElement>('[data-install-cmd]');
    if (cmd) cmd.textContent = cmds[pm];
    const prompt = root.querySelector<HTMLElement>('[data-install-prompt]');
    if (prompt) prompt.hidden = cmds[pm].includes('\n');
    for (const b of root.querySelectorAll<HTMLElement>('[data-pm-choice]')) b.setAttribute('aria-pressed', String(b.dataset.pmChoice === pm));
  }
}
const savedPm = store.get(PM_KEY);
if (savedPm) applyPm(savedPm);
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-pm-choice]');
  if (!b?.dataset.pmChoice) return;
  const pm = b.dataset.pmChoice;
  applyPm(pm);
  // npm / yarn / pnpm are shared choices; Flutter's tabs stay local to their package.
  if (['npm', 'yarn', 'pnpm'].includes(pm)) store.set(PM_KEY, pm);
});

/* ---------- Home studio ---------- */
for (const studio of document.querySelectorAll<HTMLElement>('[data-studio]')) {
  const stage = studio.querySelector<HTMLElement>('[data-studio-stage]');
  if (!stage) continue;
  studio.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.matches('[data-studio-mode]')) {
      if (input.value === 'auto') stage.removeAttribute('data-theme');
      else stage.setAttribute('data-theme', input.value);
    }
    if (input.matches('[data-studio-accent]')) stage.setAttribute('data-accent', input.value);
  });
  // The toggle flips the stage away from the page direction (to RTL on English pages, to LTR on Arabic ones).
  const dir = studio.querySelector<HTMLElement>('[data-studio-dir]');
  dir?.addEventListener('click', () => {
    const flipped = dir.getAttribute('aria-pressed') !== 'true';
    dir.setAttribute('aria-pressed', String(flipped));
    if (flipped) stage.setAttribute('dir', ar ? 'ltr' : 'rtl');
    else stage.removeAttribute('dir');
  });
  studio.querySelector('[data-studio-deploy]')?.addEventListener('click', () => {
    const w = window as unknown as { pelagicToast?: (o: { title?: string; message: string; variant?: string }) => void };
    w.pelagicToast?.({ title: studio.dataset.toastTitle, message: studio.dataset.toastMsg ?? '', variant: 'success' });
  });
}

/* ---------- Code tab sets (WAI-ARIA tabs, roving tabindex, RTL-aware arrows) ---------- */
function selectTab(root: HTMLElement, tab: HTMLElement, focus: boolean) {
  for (const t of root.querySelectorAll<HTMLElement>(':scope > [role="tablist"] > [role="tab"]')) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
    if (panel) panel.hidden = !on;
  }
  if (focus) tab.focus();
}
document.addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-site-tabs] > [role="tablist"] > [role="tab"]');
  if (tab) selectTab(tab.closest<HTMLElement>('[data-site-tabs]')!, tab, false);
});
document.addEventListener('keydown', (e) => {
  const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-site-tabs] > [role="tablist"] > [role="tab"]');
  if (!tab) return;
  const root = tab.closest<HTMLElement>('[data-site-tabs]')!;
  const tabs = [...root.querySelectorAll<HTMLElement>(':scope > [role="tablist"] > [role="tab"]')];
  const i = tabs.indexOf(tab);
  const rtl = getComputedStyle(root).direction === 'rtl';
  const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
  const back = rtl ? 'ArrowRight' : 'ArrowLeft';
  let next: HTMLElement | undefined;
  if (e.key === fwd) next = tabs[(i + 1) % tabs.length];
  else if (e.key === back) next = tabs[(i - 1 + tabs.length) % tabs.length];
  else if (e.key === 'Home') next = tabs[0];
  else if (e.key === 'End') next = tabs[tabs.length - 1];
  if (!next) return;
  e.preventDefault();
  selectTab(root, next, true);
  next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});

/* ---------- Header state ---------- */
const header = document.querySelector<HTMLElement>('[data-site-header]');
if (header) {
  const onScroll = () => header.toggleAttribute('data-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Pointer spotlight on cards (decorative) ---------- */
document.addEventListener(
  'pointermove',
  (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-spotlight]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  },
  { passive: true },
);

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
if ('IntersectionObserver' in window && reveals.length) {
  doc.classList.add('can-reveal');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of reveals) io.observe(el);
}

/* ---------- Scroll-spy for "On this page" ---------- */
const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc] a[href^="#"]')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const visible = new Set<string>();
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      const first = tocLinks.find((a) => visible.has(decodeURIComponent(a.hash.slice(1))));
      if (!first) return;
      for (const a of tocLinks) a.toggleAttribute('data-active', a === first);
    },
    { rootMargin: '-15% 0px -60% 0px' },
  );
  for (const id of byId.keys()) {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  }
}

/* ---------- Keyboard hint ---------- */
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
if (isMac) for (const k of document.querySelectorAll<HTMLElement>('[data-kbd-mod]')) k.textContent = '⌘K';

/* ---------- Command palette ---------- */
interface Item {
  g: 'page' | 'package' | 'category' | 'component';
  t: string;
  ta?: string;
  u: string;
  ua?: string;
  d?: string;
  da?: string;
  c?: string;
  s?: string;
}

const palette = document.querySelector<HTMLDialogElement>('[data-palette]');
if (palette) {
  const input = palette.querySelector<HTMLInputElement>('[data-palette-input]')!;
  const list = palette.querySelector<HTMLElement>('[data-palette-list]')!;
  const empty = palette.querySelector<HTMLElement>('[data-palette-empty]')!;
  const status = palette.querySelector<HTMLElement>('[data-palette-status]')!;
  const labels = JSON.parse(palette.dataset.labels ?? '{}') as { groups: Record<string, string>; empty: string; count: string; loading: string };
  const icons: Record<string, string> = {};
  for (const tpl of palette.querySelectorAll<HTMLTemplateElement>('template[data-kind]')) icons[tpl.dataset.kind!] = tpl.innerHTML;
  let items: Item[] | null = null;
  let loading: Promise<void> | null = null;
  let results: Item[] = [];
  let active = 0;
  let opener: HTMLElement | null = null;

  const load = () =>
    (loading ??= fetch(palette.dataset.index!)
      .then((r) => r.json())
      .then((data: Item[]) => {
        items = data;
      })
      .catch(() => {
        items = [];
      }));

  const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const title = (i: Item) => (ar && i.ta ? i.ta : i.t);
  const url = (i: Item) => (ar && i.ua ? i.ua : i.u);
  const desc = (i: Item) => (ar && i.da ? i.da : i.d) ?? '';

  function score(i: Item, q: string) {
    const t = norm(i.t);
    const ta = i.ta ? norm(i.ta) : '';
    if (t === q || ta === q) return 100;
    if (t.startsWith(q) || ta.startsWith(q)) return 80;
    if (t.split(/[\s/@-]+/).some((w) => w.startsWith(q))) return 65;
    if (t.includes(q) || ta.includes(q)) return 50;
    const rest = norm(`${i.d ?? ''} ${i.da ?? ''} ${i.c ?? ''}`);
    if (rest.includes(q)) return 20;
    let k = 0;
    for (const ch of t) if (ch === q[k]) k += 1;
    return k === q.length && q.length > 2 ? 8 : 0;
  }

  const order: Item['g'][] = ['page', 'package', 'category', 'component'];
  const limit: Record<Item['g'], number> = { page: 6, package: 12, category: 11, component: 14 };

  function render() {
    const q = norm(input.value.trim());
    list.textContent = '';
    if (!items) {
      status.textContent = labels.loading;
      return;
    }
    let groups: [Item['g'], Item[]][];
    if (!q) {
      const pick = (g: Item['g'], n: number) => items!.filter((i) => i.g === g && !(ar ? false : i.t.includes('(Arabic)'))).slice(0, n);
      groups = [
        ['page', pick('page', 6)],
        ['package', pick('package', 12)],
      ];
    } else {
      const scored = items.map((i) => ({ i, s: score(i, q) })).filter((x) => x.s > 0);
      const byGroup = new Map<Item['g'], { i: Item; s: number }[]>();
      for (const x of scored) byGroup.set(x.i.g, [...(byGroup.get(x.i.g) ?? []), x]);
      groups = [...byGroup.entries()]
        .map(([g, xs]) => [g, xs.sort((a, b) => b.s - a.s)] as const)
        .sort((a, b) => b[1][0].s - a[1][0].s || order.indexOf(a[0]) - order.indexOf(b[0]))
        .map(([g, xs]) => [g, xs.slice(0, limit[g]).map((x) => x.i)]);
    }
    results = groups.flatMap(([, xs]) => xs);
    active = Math.min(active, Math.max(0, results.length - 1));
    let n = 0;
    for (const [g, xs] of groups) {
      if (!xs.length) continue;
      const group = document.createElement('div');
      group.setAttribute('role', 'group');
      group.className = 'palette__group';
      const head = document.createElement('div');
      head.id = `palette-g-${g}`;
      head.className = 'palette__group-title';
      head.setAttribute('role', 'presentation');
      head.textContent = labels.groups[g] ?? g;
      group.setAttribute('aria-labelledby', head.id);
      group.append(head);
      for (const item of xs) {
        const opt = document.createElement('div');
        opt.setAttribute('role', 'option');
        opt.id = `palette-opt-${n}`;
        opt.className = 'palette__option';
        opt.dataset.index = String(n);
        opt.setAttribute('aria-selected', String(n === active));
        const icon = document.createElement('span');
        icon.className = `palette__icon palette__icon--${item.g}`;
        icon.innerHTML = icons[item.g] ?? '';
        const text = document.createElement('span');
        text.className = 'palette__text';
        const tt = document.createElement('span');
        tt.className = 'palette__title';
        tt.textContent = title(item);
        if (item.g === 'package') tt.dir = 'ltr';
        const dd = document.createElement('span');
        dd.className = 'palette__desc';
        dd.textContent = item.c ? `${item.c} · ${desc(item)}` : desc(item);
        text.append(tt, dd);
        const go = document.createElement('span');
        go.className = 'palette__go';
        go.setAttribute('aria-hidden', 'true');
        go.textContent = '↵';
        opt.append(icon, text, go);
        group.append(opt);
        n += 1;
      }
      list.append(group);
    }
    empty.hidden = results.length > 0;
    input.setAttribute('aria-activedescendant', results.length ? `palette-opt-${active}` : '');
    if (!results.length) input.removeAttribute('aria-activedescendant');
    status.textContent = results.length ? labels.count.replace('{n}', String(results.length)) : labels.empty;
  }

  function setActive(i: number, scroll = true) {
    if (!results.length) return;
    active = (i + results.length) % results.length;
    for (const opt of list.querySelectorAll<HTMLElement>('[role="option"]')) opt.setAttribute('aria-selected', String(opt.dataset.index === String(active)));
    input.setAttribute('aria-activedescendant', `palette-opt-${active}`);
    if (scroll) list.querySelector(`#palette-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }

  function go(i: number) {
    const item = results[i];
    if (!item) return;
    palette!.close();
    window.location.href = url(item);
  }

  function open() {
    if (palette!.open) return;
    opener = document.activeElement as HTMLElement | null;
    input.value = '';
    active = 0;
    palette!.showModal();
    document.body.style.overflow = 'hidden';
    input.focus();
    render();
    load().then(render);
  }

  palette.addEventListener('close', () => {
    document.body.style.overflow = '';
    opener?.focus?.();
  });
  palette.addEventListener('click', (e) => {
    if (e.target === palette) palette.close();
    const opt = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (opt) go(Number(opt.dataset.index));
    if ((e.target as HTMLElement).closest('[data-palette-close]')) palette.close();
  });
  list.addEventListener('pointermove', (e) => {
    const opt = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (opt && Number(opt.dataset.index) !== active) setActive(Number(opt.dataset.index), false);
  });
  input.addEventListener('input', () => {
    active = 0;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(active);
    }
  });

  for (const b of document.querySelectorAll('[data-palette-open]')) b.addEventListener('click', open);
  document.addEventListener('keydown', (e) => {
    const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]');
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (palette.open) palette.close();
      else open();
    } else if (e.key === '/' && !typing && !palette.open) {
      e.preventDefault();
      open();
    }
  });
}

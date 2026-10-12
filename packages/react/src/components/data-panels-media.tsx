// data-panels-media — PrimeNG parity components: data, panel, media and message groups.
import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type FocusEvent,
  type ImgHTMLAttributes,
  type Key,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, trapFocus } from '@orca-ui/core/a11y';
import { cx, getPageItems } from '../utils';
import { ProgressBar, Skeleton } from './display';

/* ======================================================================
 * Shared internals (not exported)
 * ==================================================================== */

/** Controlled/uncontrolled state. The setter takes a value (not an updater); `ref` always holds the latest value. */
function useControlled<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : inner;
  const ref = useRef(current);
  ref.current = current;
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const set = useCallback(
    (next: T) => {
      ref.current = next;
      if (!controlled) setInner(next);
      changeRef.current?.(next);
    },
    [controlled],
  );
  return [current, set, ref] as const;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** Nearest `dir` attribute wins; falls back to the computed direction. */
function isRtl(el: Element | null): boolean {
  if (!el) return false;
  const dir = el.closest('[dir]')?.getAttribute('dir');
  if (dir) return dir === 'rtl';
  return typeof getComputedStyle === 'function' && getComputedStyle(el).direction === 'rtl';
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Polite live-region message. Alternating a trailing no-break space makes repeated identical messages re-announce. */
function useAnnouncer() {
  const [state, setState] = useState({ text: '', n: 0 });
  const announce = useCallback((text: string) => setState((s) => ({ text, n: s.n + 1 })), []);
  return [state.text ? state.text + (state.n % 2 ? '' : ' ') : '', announce] as const;
}

function LiveRegion({ message }: { message: string }) {
  return (
    <div className="oc-sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}

/** Modal behavior shared by Image preview and Galleria full screen: focus in + trapped, Escape closes, scroll locked, focus restored. */
function useModal(open: boolean, onClose: () => void, panelRef: RefObject<HTMLDivElement>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.focus();
    const releaseFocus = trapFocus(panel);
    const releaseScroll = lockScroll();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      releaseFocus();
      releaseScroll();
      previous?.focus?.();
    };
  }, [open, panelRef]);
}

/** Interval autoplay that pauses while hovered or focused, never starts under reduced motion, and cleans up its timer. */
function useAutoplay(interval: number | undefined, canPlay: boolean, advance: () => void) {
  // Initial state must not read matchMedia, so server and first client render agree; reduced motion is applied after mount.
  const [playing, setPlaying] = useState(() => !!interval && interval > 0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    if (prefersReducedMotion()) setPlaying(false);
  }, []);
  useEffect(() => {
    if (!interval || !playing || hovered || focused || !canPlay) return;
    const id = window.setInterval(() => advanceRef.current(), interval);
    return () => window.clearInterval(id);
  }, [interval, playing, hovered, focused, canPlay]);
  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
    },
  };
  return { enabled: !!interval && interval > 0, playing, setPlaying, rotating: playing && !hovered && !focused && canPlay, handlers };
}

const safeId = (k: Key) => String(k).replace(/[^A-Za-z0-9_-]/g, '_');

/* ======================================================================
 * Tree
 * ==================================================================== */

export interface TreeNode {
  key: string;
  label: ReactNode;
  /** Plain text for filtering and typeahead when `label` is not a string. */
  text?: string;
  icon?: ReactNode;
  children?: TreeNode[];
  /** With lazy loading, marks a node without `children` as having none. */
  leaf?: boolean;
  disabled?: boolean;
}

export type TreeSelectionMode = 'single' | 'multiple' | 'checkbox';

export interface TreeProps {
  nodes: TreeNode[];
  /** Accessible name of the tree. */
  label: string;
  selectionMode?: TreeSelectionMode;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  expandedKeys?: string[];
  defaultExpandedKeys?: string[];
  onExpandedChange?: (keys: string[]) => void;
  /** Lazy loading: called when a node without `children` (and not `leaf`) expands. Return its children. */
  onExpand?: (node: TreeNode) => TreeNode[] | void | Promise<TreeNode[] | void>;
  filter?: boolean;
  filterLabel?: string;
  filterPlaceholder?: string;
  emptyMessage?: ReactNode;
  nodeTemplate?: (node: TreeNode) => ReactNode;
  className?: string;
}

type CheckState = 'true' | 'false' | 'mixed';

const nodeText = (n: TreeNode) => n.text ?? (typeof n.label === 'string' || typeof n.label === 'number' ? String(n.label) : n.key);

export function Tree({
  nodes,
  label,
  selectionMode,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectionChange,
  expandedKeys,
  defaultExpandedKeys = [],
  onExpandedChange,
  onExpand,
  filter = false,
  filterLabel = 'Filter',
  filterPlaceholder,
  emptyMessage = 'No results',
  nodeTemplate,
  className,
}: TreeProps) {
  const [expanded, setExpanded, expandedRef] = useControlled(expandedKeys, defaultExpandedKeys, onExpandedChange);
  const [selected, setSelected, selectedRef] = useControlled(selectedKeys, defaultSelectedKeys, onSelectionChange);
  const [loaded, setLoaded] = useState<Record<string, TreeNode[]>>({});
  const [loading, setLoading] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const typeahead = useRef({ text: '', at: 0 });
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const childrenOf = useCallback((n: TreeNode) => n.children ?? loaded[n.key], [loaded]);
  const canExpand = (n: TreeNode) => (childrenOf(n)?.length ?? 0) > 0 || (!n.leaf && !!onExpand && childrenOf(n) === undefined);

  // Index of the full (unfiltered) tree: key -> node + parent key.
  const index = useMemo(() => {
    const map = new Map<string, { node: TreeNode; parent: string | null }>();
    const walk = (list: TreeNode[], parent: string | null) =>
      list.forEach((n) => {
        map.set(n.key, { node: n, parent });
        walk(childrenOf(n) ?? [], n.key);
      });
    walk(nodes, null);
    return map;
  }, [nodes, childrenOf]);

  // Filtering keeps matches (with all their children) and the ancestors of matches, which are shown expanded.
  const { tree, forcedOpen } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const forced = new Set<string>();
    if (!q) return { tree: nodes, forcedOpen: forced };
    const walk = (list: TreeNode[]): TreeNode[] =>
      list.flatMap((n) => {
        if (nodeText(n).toLowerCase().includes(q)) return [n];
        const kids = walk(childrenOf(n) ?? []);
        if (!kids.length) return [];
        forced.add(n.key);
        return [{ ...n, children: kids }];
      });
    return { tree: walk(nodes), forcedOpen: forced };
  }, [query, nodes, childrenOf]);

  const isOpen = (key: string) => forcedOpen.has(key) || expanded.includes(key);

  const flat = useMemo(() => {
    const out: Array<{ node: TreeNode; parent: string | null }> = [];
    const walk = (list: TreeNode[], parent: string | null) =>
      list.forEach((n) => {
        out.push({ node: n, parent });
        if (forcedOpen.has(n.key) || expanded.includes(n.key)) walk(childrenOf(n) ?? [], n.key);
      });
    walk(tree, null);
    return out;
  }, [tree, forcedOpen, expanded, childrenOf]);

  // Checkbox state is derived: a parent is checked when all children are, mixed when some are.
  const checkState = useMemo(() => {
    const map = new Map<string, CheckState>();
    if (selectionMode !== 'checkbox') return map;
    const sel = new Set(selected);
    const walk = (n: TreeNode): CheckState => {
      const kids = childrenOf(n) ?? [];
      let s: CheckState;
      if (!kids.length) s = sel.has(n.key) ? 'true' : 'false';
      else {
        const states = kids.map(walk);
        s = states.every((x) => x === 'true') ? 'true' : states.every((x) => x === 'false') ? 'false' : 'mixed';
      }
      map.set(n.key, s);
      return s;
    };
    nodes.forEach(walk);
    return map;
  }, [selectionMode, selected, nodes, childrenOf]);

  const descendants = (n: TreeNode): string[] => (childrenOf(n) ?? []).flatMap((c) => [c.key, ...descendants(c)]);

  const toggleCheck = (key: string) => {
    const entry = index.get(key);
    if (!entry) return;
    const on = checkState.get(key) !== 'true';
    const sel = new Set(selectedRef.current);
    for (const k of [key, ...descendants(entry.node)]) on ? sel.add(k) : sel.delete(k);
    // Re-evaluate ancestors bottom-up.
    let parent = entry.parent;
    while (parent) {
      const p = index.get(parent)!;
      const all = (childrenOf(p.node) ?? []).every((c) => sel.has(c.key));
      all ? sel.add(parent) : sel.delete(parent);
      parent = p.parent;
    }
    setSelected([...sel]);
  };

  const select = (n: TreeNode) => {
    if (!selectionMode || n.disabled) return;
    if (selectionMode === 'checkbox') return toggleCheck(n.key);
    const cur = selectedRef.current;
    if (selectionMode === 'single') setSelected([n.key]);
    else setSelected(cur.includes(n.key) ? cur.filter((k) => k !== n.key) : [...cur, n.key]);
  };

  const expand = (n: TreeNode) => {
    if (!expandedRef.current.includes(n.key)) setExpanded([...expandedRef.current, n.key]);
    if (!onExpand || n.leaf || childrenOf(n) !== undefined || loading.includes(n.key)) return;
    setLoading((l) => [...l, n.key]);
    Promise.resolve(onExpand(n))
      .then((kids) => {
        if (!mounted.current || !Array.isArray(kids)) return;
        setLoaded((prev) => ({ ...prev, [n.key]: kids }));
        // A checked lazy parent checks its newly loaded children.
        if (selectionMode === 'checkbox' && selectedRef.current.includes(n.key)) {
          const add = (list: TreeNode[]): string[] => list.flatMap((c) => [c.key, ...add(c.children ?? [])]);
          setSelected([...new Set([...selectedRef.current, ...add(kids)])]);
        }
      })
      .finally(() => mounted.current && setLoading((l) => l.filter((k) => k !== n.key)));
  };

  const collapse = (key: string) => setExpanded(expandedRef.current.filter((k) => k !== key));
  const toggle = (n: TreeNode) => (isOpen(n.key) ? collapse(n.key) : expand(n));
  const focusItem = (key: string | undefined) => key && itemRefs.current.get(key)?.focus();

  const tabKey = flat.some((f) => f.node.key === focusKey)
    ? focusKey
    : flat.find((f) => selected.includes(f.node.key))?.node.key ?? flat[0]?.node.key;

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!flat.length) return;
    const i = Math.max(0, flat.findIndex((f) => f.node.key === tabKey));
    const { node, parent } = flat[i];
    const rtl = isRtl(e.currentTarget);
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let handled = true;
    if (e.key === 'ArrowDown') focusItem(flat[Math.min(i + 1, flat.length - 1)].node.key);
    else if (e.key === 'ArrowUp') focusItem(flat[Math.max(i - 1, 0)].node.key);
    else if (e.key === 'Home') focusItem(flat[0].node.key);
    else if (e.key === 'End') focusItem(flat[flat.length - 1].node.key);
    else if (e.key === forward) {
      if (canExpand(node) && !isOpen(node.key)) expand(node);
      else if (isOpen(node.key) && flat[i + 1]?.parent === node.key) focusItem(flat[i + 1].node.key);
    } else if (e.key === back) {
      if (canExpand(node) && isOpen(node.key) && !forcedOpen.has(node.key)) collapse(node.key);
      else if (parent) focusItem(parent);
    } else if (e.key === 'Enter' || e.key === ' ') select(node);
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Typeahead: characters typed within 500ms build a prefix.
      const now = Date.now();
      const t = typeahead.current;
      t.text = now - t.at > 500 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
      t.at = now;
      const order = [...flat.slice(i + 1), ...flat.slice(0, i + 1)];
      const hit = order.find((f) => nodeText(f.node).toLowerCase().startsWith(t.text));
      focusItem(hit?.node.key);
    } else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const renderNodes = (list: TreeNode[], level: number): ReactNode =>
    list.map((n, i) => {
      const expandable = canExpand(n);
      const open = expandable && isOpen(n.key);
      const kids = childrenOf(n) ?? [];
      const busy = loading.includes(n.key);
      const check = checkState.get(n.key);
      const isSelected = selected.includes(n.key);
      return (
        <li
          key={n.key}
          ref={(el) => {
            if (el) itemRefs.current.set(n.key, el);
            else itemRefs.current.delete(n.key);
          }}
          role="treeitem"
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={i + 1}
          aria-expanded={expandable ? open : undefined}
          aria-selected={selectionMode === 'single' || selectionMode === 'multiple' ? isSelected : undefined}
          aria-checked={selectionMode === 'checkbox' ? check : undefined}
          aria-disabled={n.disabled || undefined}
          aria-busy={busy || undefined}
          tabIndex={n.key === tabKey ? 0 : -1}
          className="oc-tree__item"
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusKey(n.key);
          }}
        >
          <div
            className={cx('oc-tree__row', (isSelected || check === 'true') && selectionMode !== 'checkbox' && 'is-selected')}
            style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.25}rem` }}
            onClick={() => {
              focusItem(n.key);
              select(n);
            }}
          >
            <span
              className="oc-tree__toggle"
              aria-hidden="true"
              onClick={(e) => {
                e.stopPropagation();
                if (expandable) toggle(n);
                focusItem(n.key);
              }}
            >
              {busy ? <span className="oc-spinner" /> : expandable ? '›' : null}
            </span>
            {selectionMode === 'checkbox' && <span className="oc-tree__checkbox" data-state={check} aria-hidden="true" />}
            {n.icon && (
              <span className="oc-tree__icon" aria-hidden="true">
                {n.icon}
              </span>
            )}
            <span className="oc-tree__label">{nodeTemplate ? nodeTemplate(n) : n.label}</span>
          </div>
          {open && kids.length > 0 && (
            <ul role="group" className="oc-tree__group">
              {renderNodes(kids, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <div className={cx('oc-tree', className)}>
      {filter && (
        <input
          type="search"
          className="oc-input oc-tree__filter"
          aria-label={filterLabel}
          placeholder={filterPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      {tree.length === 0 ? (
        <div className="oc-tree__empty">{emptyMessage}</div>
      ) : (
        <ul
          role="tree"
          aria-label={label}
          aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'checkbox' || undefined}
          className="oc-tree__root"
          onKeyDown={onKeyDown}
        >
          {renderNodes(tree, 1)}
        </ul>
      )}
    </div>
  );
}

/* ======================================================================
 * TreeTable
 * ==================================================================== */

export interface TreeTableNode<T> {
  key: string;
  data: T;
  children?: TreeTableNode<T>[];
}

export interface TreeTableColumn<T> {
  key: string;
  label: ReactNode;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  render?: (data: T, node: TreeTableNode<T>) => ReactNode;
  sortValue?: (data: T) => string | number | null | undefined;
}

export interface TreeTableProps<T> {
  columns: TreeTableColumn<T>[];
  nodes: TreeTableNode<T>[];
  /** Accessible name. Hidden visually unless `captionVisible`. */
  caption: string;
  captionVisible?: boolean;
  expandedKeys?: string[];
  defaultExpandedKeys?: string[];
  onExpandedChange?: (keys: string[]) => void;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { key: string; direction: 'asc' | 'desc' }) => void;
  emptyMessage?: ReactNode;
  className?: string;
}

function compareAny(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function TreeTable<T extends Record<string, unknown>>({
  columns,
  nodes,
  caption,
  captionVisible = false,
  expandedKeys,
  defaultExpandedKeys = [],
  onExpandedChange,
  defaultSort,
  onSortChange,
  emptyMessage = 'No data',
  className,
}: TreeTableProps<T>) {
  const [expanded, setExpanded] = useControlled(expandedKeys, defaultExpandedKeys, onExpandedChange);
  const [sort, setSort] = useState(defaultSort);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  // Sorting applies to each sibling group, so the hierarchy stays intact.
  const rows = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    const dir = sort?.direction === 'desc' ? -1 : 1;
    const value = (n: TreeTableNode<T>) => (col?.sortValue ? col.sortValue(n.data) : col ? n.data[col.key] : undefined);
    const order = (list: TreeTableNode<T>[]) => (col ? [...list].sort((a, b) => dir * compareAny(value(a), value(b))) : list);
    const out: Array<{ node: TreeTableNode<T>; level: number; pos: number; size: number; parent: string | null }> = [];
    const walk = (list: TreeTableNode<T>[], level: number, parent: string | null) =>
      order(list).forEach((node, i, arr) => {
        out.push({ node, level, pos: i + 1, size: arr.length, parent });
        if (node.children?.length && expanded.includes(node.key)) walk(node.children, level + 1, node.key);
      });
    walk(nodes, 1, null);
    return out;
  }, [nodes, columns, sort, expanded]);

  const toggleSort = (key: string) => {
    const next = { key, direction: (sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc' };
    setSort(next);
    onSortChange?.(next);
  };
  const toggle = (key: string) => setExpanded(expanded.includes(key) ? expanded.filter((k) => k !== key) : [...expanded, key]);
  const tabKey = rows.some((r) => r.node.key === focusKey) ? focusKey : rows[0]?.node.key;
  const focusRow = (key?: string | null) => key && rowRefs.current.get(key)?.focus();

  const onKeyDown = (e: KeyboardEvent<HTMLTableSectionElement>) => {
    const i = rows.findIndex((r) => r.node.key === tabKey);
    if (i < 0) return;
    const { node, parent } = rows[i];
    const rtl = isRtl(e.currentTarget);
    const hasKids = !!node.children?.length;
    const open = expanded.includes(node.key);
    let handled = true;
    if (e.key === 'ArrowDown') focusRow(rows[Math.min(i + 1, rows.length - 1)].node.key);
    else if (e.key === 'ArrowUp') focusRow(rows[Math.max(i - 1, 0)].node.key);
    else if (e.key === 'Home') focusRow(rows[0].node.key);
    else if (e.key === 'End') focusRow(rows[rows.length - 1].node.key);
    else if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
      if (hasKids && !open) toggle(node.key);
      else if (open) focusRow(rows[i + 1]?.node.key);
    } else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
      if (hasKids && open) toggle(node.key);
      else focusRow(parent);
    } else if ((e.key === 'Enter' || e.key === ' ') && hasKids) toggle(node.key);
    else handled = false;
    if (handled) e.preventDefault();
  };

  const alignClass = (a?: string) => (a === 'end' ? 'oc-table__align-end' : a === 'center' ? 'oc-table__align-center' : undefined);

  return (
    <div className={cx('oc-table-wrap', 'oc-treetable', className)}>
      <table className="oc-table" role="treegrid" aria-label={captionVisible ? undefined : caption}>
        {captionVisible && <caption>{caption}</caption>}
        <thead>
          <tr role="row">
            {columns.map((col) => {
              const active = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  role="columnheader"
                  className={alignClass(col.align)}
                  aria-sort={col.sortable && active ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {col.sortable ? (
                    <button type="button" className="oc-table__sort" onClick={() => toggleSort(col.key)}>
                      {col.label}
                      <span aria-hidden="true">{active ? (sort!.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody onKeyDown={onKeyDown}>
          {rows.length === 0 ? (
            <tr role="row">
              <td role="gridcell" className="oc-table__empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map(({ node, level, pos, size }) => {
              const hasKids = !!node.children?.length;
              const open = hasKids && expanded.includes(node.key);
              return (
                <tr
                  key={node.key}
                  ref={(el) => {
                    if (el) rowRefs.current.set(node.key, el);
                    else rowRefs.current.delete(node.key);
                  }}
                  role="row"
                  aria-level={level}
                  aria-posinset={pos}
                  aria-setsize={size}
                  aria-expanded={hasKids ? open : undefined}
                  tabIndex={node.key === tabKey ? 0 : -1}
                  className="oc-treetable__row"
                  onFocus={(e) => e.target === e.currentTarget && setFocusKey(node.key)}
                >
                  {columns.map((col, ci) => (
                    <td key={col.key} role="gridcell" className={alignClass(col.align)}>
                      {ci === 0 ? (
                        <span className="oc-treetable__cell" style={{ paddingInlineStart: `${(level - 1) * 1.5}rem` }}>
                          {hasKids ? (
                            <button
                              type="button"
                              tabIndex={-1}
                              className="oc-treetable__toggle"
                              aria-label={open ? 'Collapse row' : 'Expand row'}
                              aria-expanded={open}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggle(node.key);
                              }}
                            >
                              <span aria-hidden="true">›</span>
                            </button>
                          ) : (
                            <span className="oc-treetable__spacer" aria-hidden="true" />
                          )}
                          {col.render ? col.render(node.data, node) : (node.data[col.key] as ReactNode)}
                        </span>
                      ) : col.render ? (
                        col.render(node.data, node)
                      ) : (
                        (node.data[col.key] as ReactNode)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ======================================================================
 * Paginator
 * ==================================================================== */

export interface PaginatorState {
  /** Zero-based index of the first record on the page. */
  first: number;
  rows: number;
  /** Zero-based page index. */
  page: number;
  pageCount: number;
}

export interface PaginatorProps {
  totalRecords: number;
  first?: number;
  defaultFirst?: number;
  rows?: number;
  defaultRows?: number;
  onPageChange?: (state: PaginatorState) => void;
  rowsPerPageOptions?: number[];
  showFirstLast?: boolean;
  showCurrentPageReport?: boolean;
  /** Tokens: {first} {last} {totalRecords} {page} {pageCount} {rows}. */
  currentPageReportTemplate?: string;
  showJumpToPage?: boolean;
  label?: string;
  className?: string;
}

export function Paginator({
  totalRecords,
  first,
  defaultFirst = 0,
  rows,
  defaultRows = 10,
  onPageChange,
  rowsPerPageOptions,
  showFirstLast = true,
  showCurrentPageReport = true,
  currentPageReportTemplate = 'Showing {first}–{last} of {totalRecords}',
  showJumpToPage = false,
  label = 'Pagination',
  className,
}: PaginatorProps) {
  const [innerFirst, setInnerFirst] = useState(defaultFirst);
  const [innerRows, setInnerRows] = useState(defaultRows);
  const curRows = Math.max(1, rows ?? innerRows);
  const curFirst = first ?? innerFirst;
  const pageCount = Math.max(1, Math.ceil(totalRecords / curRows));
  const page = clamp(Math.floor(curFirst / curRows), 0, pageCount - 1);
  const [draft, setDraft] = useState(String(page + 1));
  const reportId = useId();
  useEffect(() => setDraft(String(page + 1)), [page]);

  const change = (nextFirst: number, nextRows: number) => {
    const pc = Math.max(1, Math.ceil(totalRecords / nextRows));
    const p = clamp(Math.floor(nextFirst / nextRows), 0, pc - 1);
    const f = p * nextRows;
    if (first === undefined) setInnerFirst(f);
    if (rows === undefined) setInnerRows(nextRows);
    onPageChange?.({ first: f, rows: nextRows, page: p, pageCount: pc });
  };
  const goPage = (p: number) => change(clamp(p, 0, pageCount - 1) * curRows, curRows);

  const lastRecord = Math.min(totalRecords, (page + 1) * curRows);
  const report = currentPageReportTemplate
    .replace('{first}', String(totalRecords === 0 ? 0 : page * curRows + 1))
    .replace('{last}', String(lastRecord))
    .replace('{totalRecords}', String(totalRecords))
    .replace('{page}', String(page + 1))
    .replace('{pageCount}', String(pageCount))
    .replace('{rows}', String(curRows));

  const commitJump = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) goPage(n - 1);
    else setDraft(String(page + 1));
  };

  return (
    <nav aria-label={label} className={cx('oc-paginator', className)}>
      {showCurrentPageReport && (
        <span id={reportId} className="oc-paginator__report" role="status" aria-live="polite">
          {report}
        </span>
      )}
      <div className="oc-paginator__pages">
        {showFirstLast && (
          <button type="button" className="oc-pagination__btn" aria-label="First page" disabled={page === 0} onClick={() => goPage(0)}>
            <span className="oc-paginator__icon" aria-hidden="true">«</span>
          </button>
        )}
        <button type="button" className="oc-pagination__btn" aria-label="Previous page" disabled={page === 0} onClick={() => goPage(page - 1)}>
          <span className="oc-paginator__icon" aria-hidden="true">‹</span>
        </button>
        {getPageItems(page + 1, pageCount).map((item, i) =>
          item === 'ellipsis' ? (
            <span key={`e${i}`} className="oc-pagination__ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className="oc-pagination__btn"
              aria-label={`Page ${item}`}
              aria-current={item === page + 1 ? 'page' : undefined}
              onClick={() => goPage(item - 1)}
            >
              {item}
            </button>
          ),
        )}
        <button type="button" className="oc-pagination__btn" aria-label="Next page" disabled={page >= pageCount - 1} onClick={() => goPage(page + 1)}>
          <span className="oc-paginator__icon" aria-hidden="true">›</span>
        </button>
        {showFirstLast && (
          <button type="button" className="oc-pagination__btn" aria-label="Last page" disabled={page >= pageCount - 1} onClick={() => goPage(pageCount - 1)}>
            <span className="oc-paginator__icon" aria-hidden="true">»</span>
          </button>
        )}
      </div>
      {rowsPerPageOptions && rowsPerPageOptions.length > 0 && (
        <label className="oc-paginator__field">
          <span className="oc-paginator__field-label">Rows per page</span>
          <select className="oc-select oc-paginator__select" value={curRows} onChange={(e) => change(curFirst, Number(e.target.value))}>
            {rowsPerPageOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      )}
      {showJumpToPage && (
        <label className="oc-paginator__field">
          <span className="oc-paginator__field-label">Go to page</span>
          <input
            type="number"
            inputMode="numeric"
            className="oc-input oc-paginator__jump"
            min={1}
            max={pageCount}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitJump}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitJump();
              }
            }}
          />
        </label>
      )}
    </nav>
  );
}

/* ======================================================================
 * DataView
 * ==================================================================== */

export type DataViewLayout = 'list' | 'grid';

export interface DataViewProps<T> {
  items: T[];
  itemTemplate: (item: T, layout: DataViewLayout, index: number) => ReactNode;
  /** Accessible name of the item list. */
  label: string;
  layout?: DataViewLayout;
  defaultLayout?: DataViewLayout;
  onLayoutChange?: (layout: DataViewLayout) => void;
  showLayoutToggle?: boolean;
  paginator?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
  /** Field to sort by (client-side). */
  sortField?: string;
  sortOrder?: 1 | -1;
  getKey?: (item: T, index: number) => Key;
  header?: ReactNode;
  footer?: ReactNode;
  emptyMessage?: ReactNode;
  loading?: boolean;
  className?: string;
}

export function DataView<T>({
  items,
  itemTemplate,
  label,
  layout,
  defaultLayout = 'list',
  onLayoutChange,
  showLayoutToggle = true,
  paginator = false,
  rows = 10,
  rowsPerPageOptions,
  sortField,
  sortOrder = 1,
  getKey,
  header,
  footer,
  emptyMessage = 'No items found',
  loading = false,
  className,
}: DataViewProps<T>) {
  const [mode, setMode] = useControlled(layout, defaultLayout, onLayoutChange);
  const [page, setPage] = useState({ first: 0, rows });

  const sorted = useMemo(() => {
    if (!sortField) return items;
    const v = (x: T) => (x as Record<string, unknown>)[sortField];
    return [...items].sort((a, b) => sortOrder * compareAny(v(a), v(b)));
  }, [items, sortField, sortOrder]);

  const first = page.first >= sorted.length ? 0 : page.first;
  const visible = paginator ? sorted.slice(first, first + page.rows) : sorted;

  return (
    <div className={cx('oc-dataview', className)}>
      {(header || showLayoutToggle) && (
        <div className="oc-dataview__header">
          <div className="oc-dataview__header-content">{header}</div>
          {showLayoutToggle && (
            <div role="group" aria-label="Layout" className="oc-segmented">
              {(['list', 'grid'] as const).map((l) => (
                <button key={l} type="button" className="oc-segmented__item oc-dataview__layout-btn" aria-pressed={mode === l} onClick={() => setMode(l)}>
                  {l === 'list' ? 'List' : 'Grid'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {loading ? (
        <div className={cx('oc-dataview__content', `oc-dataview__content--${mode}`)} aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height={64} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="oc-dataview__empty">{emptyMessage}</div>
      ) : (
        <ul aria-label={label} className={cx('oc-dataview__content', `oc-dataview__content--${mode}`)}>
          {visible.map((item, i) => (
            <li key={getKey ? getKey(item, first + i) : first + i} className="oc-dataview__item">
              {itemTemplate(item, mode, first + i)}
            </li>
          ))}
        </ul>
      )}
      {paginator && sorted.length > 0 && (
        <Paginator
          totalRecords={sorted.length}
          first={first}
          rows={page.rows}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={(s) => setPage({ first: s.first, rows: s.rows })}
          label={`${label} pages`}
        />
      )}
      {footer && <div className="oc-dataview__footer">{footer}</div>}
    </div>
  );
}

/* ======================================================================
 * VirtualScroller
 * ==================================================================== */

export interface VirtualScrollerProps<T> {
  /** Loaded items. With lazy loading, `undefined` entries (or indices beyond the array) render placeholders. */
  items: Array<T | undefined>;
  itemTemplate: (item: T, index: number) => ReactNode;
  /** Fixed item height in px. */
  itemSize: number;
  /** Viewport height (px number or CSS length). */
  height: number | string;
  /** Total count when loading lazily. Defaults to `items.length`. */
  totalItems?: number;
  overscan?: number;
  onLazyLoad?: (range: { first: number; last: number }) => void;
  label: string;
  getKey?: (item: T, index: number) => Key;
  className?: string;
}

export function VirtualScroller<T>({
  items,
  itemTemplate,
  itemSize,
  height,
  totalItems,
  overscan = 3,
  onLazyLoad,
  label,
  getKey,
  className,
}: VirtualScrollerProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const total = totalItems ?? items.length;
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(typeof height === 'number' ? height : 400);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => el.clientHeight && setViewport(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const start = Math.max(0, Math.floor(scrollTop / itemSize) - overscan);
  const end = Math.min(total, Math.ceil((scrollTop + viewport) / itemSize) + overscan);

  const lazyRef = useRef(onLazyLoad);
  lazyRef.current = onLazyLoad;
  useEffect(() => {
    if (end > start) lazyRef.current?.({ first: start, last: end - 1 });
  }, [start, end]);

  const rendered: ReactNode[] = [];
  for (let i = start; i < end; i++) {
    const item = items[i];
    rendered.push(
      <div
        key={item !== undefined && getKey ? getKey(item, i) : i}
        role="listitem"
        aria-setsize={total}
        aria-posinset={i + 1}
        aria-busy={item === undefined || undefined}
        className="oc-vscroller__item"
        style={{ top: i * itemSize, height: itemSize }}
      >
        {item === undefined ? <Skeleton height={Math.min(16, itemSize - 8)} /> : itemTemplate(item, i)}
      </div>,
    );
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="region"
      aria-label={label}
      className={cx('oc-vscroller', className)}
      style={{ height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div role="list" aria-label={label} className="oc-vscroller__spacer" style={{ height: total * itemSize }}>
        {rendered}
      </div>
    </div>
  );
}

/* ======================================================================
 * Selectable listbox (internal; used by OrderList and PickList)
 * ==================================================================== */

interface SelectListProps<T> {
  id: string;
  labelledBy: string;
  items: T[];
  getKey: (item: T) => Key;
  getLabel: (item: T) => string;
  itemTemplate?: (item: T) => ReactNode;
  multiple: boolean;
  selected: Key[];
  onSelectedChange: (keys: Key[]) => void;
  /** Enter or double click. */
  onActivate?: (keys: Key[]) => void;
  /** Extra key handling; return true when handled. */
  onExtraKey?: (e: KeyboardEvent<HTMLUListElement>) => boolean;
  emptyMessage?: ReactNode;
}

function SelectList<T>({ id, labelledBy, items, getKey, getLabel, itemTemplate, multiple, selected, onSelectedChange, onActivate, onExtraKey, emptyMessage = 'No items' }: SelectListProps<T>) {
  const [activeKey, setActiveKey] = useState<Key | null>(null);
  const keys = items.map(getKey);
  const activeIndex = activeKey === null ? -1 : keys.indexOf(activeKey);
  const optId = (k: Key) => `${id}-opt-${safeId(k)}`;

  useEffect(() => {
    if (activeKey === null) return;
    document.getElementById(optId(activeKey))?.scrollIntoView?.({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const moveTo = (i: number, extend: boolean) => {
    if (!keys.length) return;
    const k = keys[clamp(i, 0, keys.length - 1)];
    setActiveKey(k);
    if (!multiple) onSelectedChange([k]);
    else if (extend && !selected.includes(k)) onSelectedChange([...selected, k]);
  };
  const toggle = (k: Key) => onSelectedChange(multiple ? (selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]) : [k]);

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (onExtraKey?.(e)) return;
    let handled = true;
    if (e.key === 'ArrowDown') moveTo(activeIndex + 1, e.shiftKey);
    else if (e.key === 'ArrowUp') moveTo(activeIndex < 0 ? 0 : activeIndex - 1, e.shiftKey);
    else if (e.key === 'Home') moveTo(0, false);
    else if (e.key === 'End') moveTo(keys.length - 1, false);
    else if (e.key === ' ' && activeKey !== null) toggle(activeKey);
    else if (e.key === 'Enter' && onActivate) onActivate(selected.length ? selected : activeKey !== null ? [activeKey] : []);
    else if (multiple && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') onSelectedChange(selected.length === keys.length ? [] : keys);
    else handled = false;
    if (handled) e.preventDefault();
  };

  return (
    <ul
      id={id}
      role="listbox"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-multiselectable={multiple || undefined}
      aria-activedescendant={activeKey !== null && activeIndex >= 0 ? optId(activeKey) : undefined}
      className="oc-selectlist"
      onKeyDown={onKeyDown}
      onFocus={() => {
        if (activeIndex < 0 && keys.length) setActiveKey(selected.find((k) => keys.includes(k)) ?? keys[0]);
      }}
    >
      {items.length === 0 && (
        <li role="presentation" className="oc-selectlist__empty">
          {emptyMessage}
        </li>
      )}
      {items.map((item) => {
        const k = getKey(item);
        const isSel = selected.includes(k);
        return (
          <li
            key={k}
            id={optId(k)}
            role="option"
            aria-selected={isSel}
            className={cx('oc-selectlist__option', k === activeKey && 'is-active')}
            onClick={() => {
              setActiveKey(k);
              toggle(k);
            }}
            onDoubleClick={() => onActivate?.([k])}
          >
            {itemTemplate ? itemTemplate(item) : getLabel(item)}
          </li>
        );
      })}
    </ul>
  );
}

/* ======================================================================
 * OrderList
 * ==================================================================== */

export interface OrderListProps<T> {
  value?: T[];
  defaultValue?: T[];
  onChange?: (items: T[]) => void;
  getKey: (item: T) => Key;
  /** Plain-text label, used for announcements. */
  getLabel: (item: T) => string;
  itemTemplate?: (item: T) => ReactNode;
  /** Visible heading / accessible name of the list. */
  header: string;
  className?: string;
}

export function OrderList<T>({ value, defaultValue = [], onChange, getKey, getLabel, itemTemplate, header, className }: OrderListProps<T>) {
  const [items, setItems] = useControlled(value, defaultValue, onChange);
  const [selected, setSelected] = useState<Key[]>([]);
  const [message, announce] = useAnnouncer();
  const id = useId();
  const index = selected.length ? items.findIndex((it) => getKey(it) === selected[0]) : -1;

  const move = (to: number) => {
    if (index < 0) return;
    const target = clamp(to, 0, items.length - 1);
    if (target === index) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setItems(next);
    announce(`Moved ${getLabel(item)} to position ${target + 1} of ${next.length}`);
  };

  const onExtraKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!e.altKey) return false;
    const map: Record<string, number> = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: items.length - 1 };
    if (!(e.key in map)) return false;
    e.preventDefault();
    move(map[e.key]);
    return true;
  };

  const none = index < 0;
  return (
    <div className={cx('oc-orderlist', className)}>
      <div className="oc-orderlist__controls" role="group" aria-label="Reorder">
        <button type="button" className="oc-btn oc-btn--secondary oc-btn--icon oc-btn--sm" aria-label="Move to top" aria-controls={id} disabled={none || index === 0} onClick={() => move(0)}>
          <span aria-hidden="true">⤒</span>
        </button>
        <button type="button" className="oc-btn oc-btn--secondary oc-btn--icon oc-btn--sm" aria-label="Move up" aria-controls={id} disabled={none || index === 0} onClick={() => move(index - 1)}>
          <span aria-hidden="true">↑</span>
        </button>
        <button type="button" className="oc-btn oc-btn--secondary oc-btn--icon oc-btn--sm" aria-label="Move down" aria-controls={id} disabled={none || index === items.length - 1} onClick={() => move(index + 1)}>
          <span aria-hidden="true">↓</span>
        </button>
        <button type="button" className="oc-btn oc-btn--secondary oc-btn--icon oc-btn--sm" aria-label="Move to bottom" aria-controls={id} disabled={none || index === items.length - 1} onClick={() => move(items.length - 1)}>
          <span aria-hidden="true">⤓</span>
        </button>
      </div>
      <div className="oc-orderlist__panel">
        <div id={`${id}-label`} className="oc-orderlist__header">
          {header}
        </div>
        <SelectList
          id={id}
          labelledBy={`${id}-label`}
          items={items}
          getKey={getKey}
          getLabel={getLabel}
          itemTemplate={itemTemplate}
          multiple={false}
          selected={selected}
          onSelectedChange={setSelected}
          onExtraKey={onExtraKey}
        />
        <p className="oc-orderlist__hint oc-sr-only" id={`${id}-hint`}>
          Use Alt with arrow keys, Home or End to move the selected item.
        </p>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}

/* ======================================================================
 * PickList
 * ==================================================================== */

export interface PickListValue<T> {
  source: T[];
  target: T[];
}

export interface PickListProps<T> {
  value?: PickListValue<T>;
  defaultValue?: PickListValue<T>;
  onChange?: (value: PickListValue<T>) => void;
  getKey: (item: T) => Key;
  getLabel: (item: T) => string;
  itemTemplate?: (item: T) => ReactNode;
  sourceHeader?: string;
  targetHeader?: string;
  className?: string;
}

export function PickList<T>({
  value,
  defaultValue = { source: [], target: [] },
  onChange,
  getKey,
  getLabel,
  itemTemplate,
  sourceHeader = 'Available',
  targetHeader = 'Selected',
  className,
}: PickListProps<T>) {
  const [lists, setLists] = useControlled(value, defaultValue, onChange);
  const [sel, setSel] = useState<{ source: Key[]; target: Key[] }>({ source: [], target: [] });
  const [message, announce] = useAnnouncer();
  const id = useId();

  const transfer = (from: 'source' | 'target', keys: Key[]) => {
    const to = from === 'source' ? 'target' : 'source';
    const moving = lists[from].filter((it) => keys.includes(getKey(it)));
    if (!moving.length) return;
    setLists({ ...lists, [from]: lists[from].filter((it) => !keys.includes(getKey(it))), [to]: [...lists[to], ...moving] } as PickListValue<T>);
    setSel((s) => ({ ...s, [from]: [] }));
    const where = to === 'target' ? targetHeader : sourceHeader;
    announce(moving.length === 1 ? `Moved ${getLabel(moving[0])} to ${where}` : `Moved ${moving.length} items to ${where}`);
  };

  const btn = 'oc-btn oc-btn--secondary oc-btn--icon oc-btn--sm';
  const panel = (side: 'source' | 'target', header: string) => (
    <div className="oc-picklist__panel">
      <div id={`${id}-${side}-label`} className="oc-orderlist__header">
        {header} <span className="oc-picklist__count">({lists[side].length})</span>
      </div>
      <SelectList
        id={`${id}-${side}`}
        labelledBy={`${id}-${side}-label`}
        items={lists[side]}
        getKey={getKey}
        getLabel={getLabel}
        itemTemplate={itemTemplate}
        multiple
        selected={sel[side]}
        onSelectedChange={(keys) => setSel((s) => ({ ...s, [side]: keys }))}
        onActivate={(keys) => transfer(side, keys)}
      />
    </div>
  );

  return (
    <div className={cx('oc-picklist', className)}>
      {panel('source', sourceHeader)}
      <div className="oc-picklist__controls" role="group" aria-label="Transfer">
        <button type="button" className={btn} aria-label={`Move selected to ${targetHeader}`} disabled={!sel.source.length} onClick={() => transfer('source', sel.source)}>
          <span className="oc-picklist__icon" aria-hidden="true">›</span>
        </button>
        <button type="button" className={btn} aria-label={`Move all to ${targetHeader}`} disabled={!lists.source.length} onClick={() => transfer('source', lists.source.map(getKey))}>
          <span className="oc-picklist__icon" aria-hidden="true">»</span>
        </button>
        <button type="button" className={btn} aria-label={`Move selected to ${sourceHeader}`} disabled={!sel.target.length} onClick={() => transfer('target', sel.target)}>
          <span className="oc-picklist__icon" aria-hidden="true">‹</span>
        </button>
        <button type="button" className={btn} aria-label={`Move all to ${sourceHeader}`} disabled={!lists.target.length} onClick={() => transfer('target', lists.target.map(getKey))}>
          <span className="oc-picklist__icon" aria-hidden="true">«</span>
        </button>
      </div>
      {panel('target', targetHeader)}
      <LiveRegion message={message} />
    </div>
  );
}

/* ======================================================================
 * OrganizationChart
 * ==================================================================== */

export interface OrgChartNode {
  key: string;
  label: ReactNode;
  /** Plain text name for control labels when `label` is not a string. */
  text?: string;
  children?: OrgChartNode[];
  selectable?: boolean;
}

export interface OrganizationChartProps {
  value: OrgChartNode;
  label: string;
  selectionMode?: 'single' | 'multiple';
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  collapsible?: boolean;
  defaultCollapsedKeys?: string[];
  nodeTemplate?: (node: OrgChartNode) => ReactNode;
  className?: string;
}

export function OrganizationChart({
  value,
  label,
  selectionMode,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectionChange,
  collapsible = false,
  defaultCollapsedKeys = [],
  nodeTemplate,
  className,
}: OrganizationChartProps) {
  const [selected, setSelected] = useControlled(selectedKeys, defaultSelectedKeys, onSelectionChange);
  const [collapsed, setCollapsed] = useState<string[]>(defaultCollapsedKeys);
  const baseId = useId();
  const text = (n: OrgChartNode) => n.text ?? (typeof n.label === 'string' ? n.label : n.key);

  const select = (k: string) => {
    if (selectionMode === 'single') setSelected(selected.includes(k) ? [] : [k]);
    else setSelected(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]);
  };

  const renderNode = (n: OrgChartNode): ReactNode => {
    const kids = n.children ?? [];
    const open = !collapsed.includes(n.key);
    const groupId = `${baseId}-${safeId(n.key)}`;
    const isSel = selected.includes(n.key);
    const content = nodeTemplate ? nodeTemplate(n) : n.label;
    return (
      <li key={n.key} className="oc-orgchart__item">
        <div className={cx('oc-orgchart__node', isSel && 'is-selected')}>
          {selectionMode && n.selectable !== false ? (
            <button type="button" className="oc-orgchart__select" aria-pressed={isSel} onClick={() => select(n.key)}>
              {content}
            </button>
          ) : (
            <div className="oc-orgchart__content">{content}</div>
          )}
          {collapsible && kids.length > 0 && (
            <button
              type="button"
              className="oc-orgchart__toggle"
              aria-expanded={open}
              aria-controls={groupId}
              aria-label={`${open ? 'Collapse' : 'Expand'} ${text(n)}`}
              onClick={() => setCollapsed((c) => (open ? [...c, n.key] : c.filter((k) => k !== n.key)))}
            >
              <span aria-hidden="true">{open ? '−' : '+'}</span>
            </button>
          )}
        </div>
        {kids.length > 0 && (
          <ul id={groupId} className="oc-orgchart__group" hidden={!open}>
            {kids.map(renderNode)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className={cx('oc-orgchart', className)} role="group" aria-label={label}>
      <ul className="oc-orgchart__group oc-orgchart__root">{renderNode(value)}</ul>
    </div>
  );
}

/* ======================================================================
 * Panel / Fieldset / ScrollPanel
 * ==================================================================== */

export interface PanelProps {
  header: ReactNode;
  toggleable?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  /** Extra controls rendered in the header. */
  actions?: ReactNode;
  footer?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
  className?: string;
}

export function Panel({ header, toggleable = false, collapsed, defaultCollapsed = false, onToggle, actions, footer, headingLevel = 3, children, className }: PanelProps) {
  const [isCollapsed, setCollapsed] = useControlled(collapsed, defaultCollapsed, onToggle);
  const id = useId();
  const Heading = `h${headingLevel}` as 'h3';
  const hidden = toggleable && isCollapsed;
  return (
    <section className={cx('oc-panel', className)} aria-labelledby={`${id}-title`}>
      <div className="oc-panel__header">
        <Heading id={`${id}-title`} className="oc-panel__title">
          {header}
        </Heading>
        <div className="oc-panel__actions">
          {actions}
          {toggleable && (
            <button
              type="button"
              className="oc-close oc-panel__toggle"
              aria-expanded={!isCollapsed}
              aria-controls={`${id}-content`}
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              aria-describedby={`${id}-title`}
              onClick={() => setCollapsed(!isCollapsed)}
            >
              <span aria-hidden="true">{isCollapsed ? '+' : '−'}</span>
            </button>
          )}
        </div>
      </div>
      <div id={`${id}-content`} className="oc-panel__content" hidden={hidden}>
        {children}
      </div>
      {footer && !hidden && <div className="oc-panel__footer">{footer}</div>}
    </section>
  );
}

export interface FieldsetProps {
  legend: ReactNode;
  toggleable?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export function Fieldset({ legend, toggleable = false, collapsed, defaultCollapsed = false, onToggle, children, className }: FieldsetProps) {
  const [isCollapsed, setCollapsed] = useControlled(collapsed, defaultCollapsed, onToggle);
  const id = useId();
  return (
    <fieldset className={cx('oc-fieldset', className)}>
      <legend className="oc-fieldset__legend">
        {toggleable ? (
          <button type="button" className="oc-fieldset__toggle" aria-expanded={!isCollapsed} aria-controls={id} onClick={() => setCollapsed(!isCollapsed)}>
            <span className="oc-fieldset__icon" aria-hidden="true">
              {isCollapsed ? '+' : '−'}
            </span>
            {legend}
          </button>
        ) : (
          legend
        )}
      </legend>
      <div id={id} className="oc-fieldset__content" hidden={toggleable && isCollapsed}>
        {children}
      </div>
    </fieldset>
  );
}

export interface ScrollPanelProps {
  /** Accessible name, used when the content overflows (the panel then becomes a focusable region). */
  label: string;
  height?: number | string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ScrollPanel({ label, height, children, className, style }: ScrollPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
    check();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cx('oc-scrollpanel', className)}
      style={{ ...style, height }}
      tabIndex={scrollable ? 0 : undefined}
      role={scrollable ? 'region' : undefined}
      aria-label={scrollable ? label : undefined}
    >
      <div className="oc-scrollpanel__content">{children}</div>
    </div>
  );
}

/* ======================================================================
 * Splitter
 * ==================================================================== */

export interface SplitterPanelProps {
  /** Initial size in percent. */
  size?: number;
  /** Minimum size in percent. */
  minSize?: number;
  children?: ReactNode;
  className?: string;
}

/** Declares a pane of a Splitter; rendered by the Splitter. */
export function SplitterPanel({ children, className }: SplitterPanelProps) {
  return <div className={cx('oc-splitter__panel', className)}>{children}</div>;
}

export interface SplitterProps {
  layout?: 'horizontal' | 'vertical';
  /** Initial sizes in percent; otherwise from each panel's `size`, else equal. */
  defaultSizes?: number[];
  /** Persist sizes in localStorage under this key. */
  stateKey?: string;
  /** Keyboard step in percent. */
  step?: number;
  gutterSize?: number;
  /** Accessible names of the gutters (default "Resize panels"). */
  gutterLabel?: string;
  onResize?: (sizes: number[]) => void;
  onResizeEnd?: (sizes: number[]) => void;
  children: ReactNode;
  className?: string;
}

function readStoredSizes(key: string | undefined, count: number): number[] | null {
  if (!key) return null;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    return Array.isArray(parsed) && parsed.length === count && parsed.every((n) => typeof n === 'number') ? (parsed as number[]) : null;
  } catch {
    return null;
  }
}

export function Splitter({ layout = 'horizontal', defaultSizes, stateKey, step = 5, gutterSize = 8, gutterLabel = 'Resize panels', onResize, onResizeEnd, children, className }: SplitterProps) {
  const panels = Children.toArray(children).filter(isValidElement) as Array<ReactElement<SplitterPanelProps>>;
  const n = panels.length;
  const mins = panels.map((p) => p.props.minSize ?? 0);
  const [sizes, setSizes] = useState<number[]>(() => {
    const stored = readStoredSizes(stateKey, n);
    if (stored) return stored;
    if (defaultSizes?.length === n) return defaultSizes;
    const given = panels.map((p) => p.props.size);
    if (given.every((s) => typeof s === 'number')) return given as number[];
    return panels.map(() => 100 / n);
  });
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCleanup = useRef<(() => void) | null>(null);
  const id = useId();
  const horizontal = layout === 'horizontal';
  useEffect(() => () => dragCleanup.current?.(), []);

  const commit = (next: number[]) => {
    if (stateKey) {
      try {
        window.localStorage.setItem(stateKey, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    }
    onResizeEnd?.(next);
  };

  // Moves the gutter after panel i so that panel i gets `target` percent (clamped by both mins).
  const resizeTo = (i: number, target: number, base = sizesRef.current) => {
    const pair = base[i] + base[i + 1];
    const a = clamp(target, mins[i], pair - mins[i + 1]);
    const next = [...base];
    next[i] = a;
    next[i + 1] = pair - a;
    setSizes(next);
    sizesRef.current = next;
    onResize?.(next);
    return next;
  };

  const onGutterKey = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
    const cur = sizesRef.current;
    const rtl = horizontal && isRtl(e.currentTarget);
    const inc = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const dec = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    let target: number | null = null;
    if (e.key === inc) target = cur[i] + step;
    else if (e.key === dec) target = cur[i] - step;
    else if (e.key === 'Home') target = mins[i];
    else if (e.key === 'End') target = cur[i] + cur[i + 1] - mins[i + 1];
    if (target === null) return;
    e.preventDefault();
    commit(resizeTo(i, target));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>, i: number) => {
    const container = containerRef.current;
    if (!container || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.focus();
    const rect = container.getBoundingClientRect();
    const total = (horizontal ? rect.width : rect.height) || 1;
    const start = horizontal ? e.clientX : e.clientY;
    const base = [...sizesRef.current];
    const dir = horizontal && isRtl(container) ? -1 : 1;
    const move = (ev: PointerEvent) => {
      const delta = (((horizontal ? ev.clientX : ev.clientY) - start) / total) * 100 * dir;
      resizeTo(i, base[i] + delta, base);
    };
    const up = () => {
      cleanup();
      commit(sizesRef.current);
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      dragCleanup.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    dragCleanup.current = cleanup;
  };

  const gutterShare = (gutterSize * (n - 1)) / Math.max(1, n);
  return (
    <div ref={containerRef} className={cx('oc-splitter', `oc-splitter--${layout}`, className)}>
      {panels.map((p, i) => (
        <Fragment key={p.key ?? i}>
          <div
            id={`${id}-p${i}`}
            className={cx('oc-splitter__panel', p.props.className)}
            style={{ flexBasis: `calc(${sizes[i]}% - ${gutterShare}px)` }}
          >
            {p.props.children}
          </div>
          {i < n - 1 && (
            <div
              role="separator"
              tabIndex={0}
              aria-label={gutterLabel}
              aria-controls={`${id}-p${i}`}
              aria-orientation={horizontal ? 'vertical' : 'horizontal'}
              aria-valuenow={Math.round(sizes[i])}
              aria-valuemin={Math.round(mins[i])}
              aria-valuemax={Math.round(sizes[i] + sizes[i + 1] - mins[i + 1])}
              className="oc-splitter__gutter"
              style={{ [horizontal ? 'width' : 'height']: gutterSize }}
              onKeyDown={(e) => onGutterKey(e, i)}
              onPointerDown={(e) => onPointerDown(e, i)}
            >
              <span className="oc-splitter__handle" aria-hidden="true" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}

/* ======================================================================
 * Toolbar
 * ==================================================================== */

export interface ToolbarProps {
  /** Accessible name of the toolbar. */
  label: string;
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const TOOLBAR_ITEMS = 'button, a[href], input, select, textarea, [role="button"], [role="checkbox"], [role="radio"], [role="switch"]';
const TEXT_ENTRY = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, select, [contenteditable="true"]';

/** role="toolbar" with a single tab stop; arrow keys (flipped in RTL), Home and End move between controls. */
export function Toolbar({ label, start, center, end, children, orientation = 'horizontal', className }: ToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useRef(0);

  const controls = () =>
    ref.current
      ? Array.from(ref.current.querySelectorAll<HTMLElement>(TOOLBAR_ITEMS)).filter((el) => !el.hasAttribute('disabled') && !el.closest('[hidden]'))
      : [];
  const sync = () => {
    const items = controls();
    const a = clamp(active.current, 0, items.length - 1);
    items.forEach((el, i) => (el.tabIndex = i === a ? 0 : -1));
  };
  useLayoutEffect(sync);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const items = controls();
    const i = items.indexOf(target);
    if (i < 0) return;
    const horizontal = orientation === 'horizontal';
    if (horizontal && target.matches(TEXT_ENTRY) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
    const rtl = isRtl(e.currentTarget);
    const next = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const prev = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    let to: number | null = null;
    if (e.key === next) to = (i + 1) % items.length;
    else if (e.key === prev) to = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = items.length - 1;
    if (to === null) return;
    e.preventDefault();
    active.current = to;
    sync();
    items[to].focus();
  };

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      className={cx('oc-toolbar', orientation === 'vertical' && 'oc-toolbar--vertical', className)}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        const i = controls().indexOf(e.target as HTMLElement);
        if (i >= 0 && i !== active.current) {
          active.current = i;
          sync();
        }
      }}
    >
      {start && <div className="oc-toolbar__group oc-toolbar__start">{start}</div>}
      {children}
      {center && <div className="oc-toolbar__group oc-toolbar__center">{center}</div>}
      {end && <div className="oc-toolbar__group oc-toolbar__end">{end}</div>}
    </div>
  );
}

/* ======================================================================
 * Carousel
 * ==================================================================== */

export interface CarouselResponsiveOption {
  /** Max-width breakpoint, e.g. "768px". */
  breakpoint: string;
  numVisible: number;
  numScroll?: number;
}

export interface CarouselProps<T> {
  items: T[];
  itemTemplate: (item: T, index: number) => ReactNode;
  label: string;
  numVisible?: number;
  numScroll?: number;
  responsiveOptions?: CarouselResponsiveOption[];
  circular?: boolean;
  /** Milliseconds between automatic advances; 0 disables autoplay. Never starts under reduced motion. */
  autoplayInterval?: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  showIndicators?: boolean;
  showNavigators?: boolean;
  getKey?: (item: T, index: number) => Key;
  className?: string;
}

function useResponsive(options: CarouselResponsiveOption[] | undefined) {
  const [match, setMatch] = useState<CarouselResponsiveOption | undefined>();
  const key = JSON.stringify(options ?? []);
  useEffect(() => {
    const opts: CarouselResponsiveOption[] = JSON.parse(key);
    if (!opts.length || typeof window.matchMedia !== 'function') return;
    // Largest breakpoint first, so the last match is the narrowest applicable one.
    const sorted = [...opts].sort((a, b) => parseFloat(b.breakpoint) - parseFloat(a.breakpoint));
    const mqls = sorted.map((o) => window.matchMedia(`(max-width: ${o.breakpoint})`));
    const update = () => {
      let m: CarouselResponsiveOption | undefined;
      mqls.forEach((q, i) => q.matches && (m = sorted[i]));
      setMatch(m);
    };
    update();
    mqls.forEach((q) => q.addEventListener?.('change', update));
    return () => mqls.forEach((q) => q.removeEventListener?.('change', update));
  }, [key]);
  return match;
}

export function Carousel<T>({
  items,
  itemTemplate,
  label,
  numVisible = 1,
  numScroll = 1,
  responsiveOptions,
  circular = false,
  autoplayInterval = 0,
  page,
  defaultPage = 0,
  onPageChange,
  showIndicators = true,
  showNavigators = true,
  getKey,
  className,
}: CarouselProps<T>) {
  const responsive = useResponsive(responsiveOptions);
  const count = items.length;
  const vis = clamp(responsive?.numVisible ?? numVisible, 1, Math.max(1, count));
  const scroll = Math.max(1, responsive?.numScroll ?? numScroll);
  const pageCount = count <= vis ? 1 : Math.ceil((count - vis) / scroll) + 1;
  const [rawPage, setPage, pageRef] = useControlled(page, defaultPage, onPageChange);
  const current = clamp(rawPage, 0, pageCount - 1);
  const first = Math.min(current * scroll, Math.max(0, count - vis));
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trackId = useId();
  const loop = circular || autoplayInterval > 0;

  const go = (p: number) => setPage(loop ? (p + pageCount) % pageCount : clamp(p, 0, pageCount - 1));
  const auto = useAutoplay(autoplayInterval, pageCount > 1, () => setPage((clamp(pageRef.current, 0, pageCount - 1) + 1) % pageCount));

  // Off-screen slides leave the tab order and accessibility tree.
  useEffect(() => {
    slideRefs.current.forEach((el, i) => el?.toggleAttribute('inert', i < first || i >= first + vis));
  });

  const slideWord = vis === 1 ? 'Slide' : 'Page';
  return (
    <section
      className={cx('oc-carousel', className)}
      aria-roledescription="carousel"
      aria-label={label}
      {...auto.handlers}
    >
      <div className="oc-carousel__controls">
        {auto.enabled && (
          <button
            type="button"
            className="oc-carousel__rotation oc-btn oc-btn--secondary oc-btn--sm"
            aria-label={auto.playing ? 'Pause automatic slide show' : 'Start automatic slide show'}
            onClick={() => auto.setPlaying(!auto.playing)}
          >
            <span aria-hidden="true">{auto.playing ? '❚❚' : '▶'}</span>
            <span>{auto.playing ? 'Pause' : 'Play'}</span>
          </button>
        )}
      </div>
      <div className="oc-carousel__body">
        {showNavigators && (
          <button type="button" className="oc-carousel__nav oc-carousel__nav--prev" aria-label="Previous slide" aria-controls={trackId} disabled={!loop && current === 0} onClick={() => go(current - 1)}>
            <span aria-hidden="true">‹</span>
          </button>
        )}
        <div className="oc-carousel__viewport">
          <div
            id={trackId}
            className="oc-carousel__track"
            aria-live={auto.rotating ? 'off' : 'polite'}
            style={{ '--oc-carousel-offset': `${(first * 100) / vis}%` } as CSSProperties}
          >
            {items.map((item, i) => (
              <div
                key={getKey ? getKey(item, i) : i}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${i + 1} of ${count}`}
                aria-hidden={i < first || i >= first + vis ? true : undefined}
                className="oc-carousel__slide"
                style={{ flexBasis: `${100 / vis}%` }}
              >
                {itemTemplate(item, i)}
              </div>
            ))}
          </div>
        </div>
        {showNavigators && (
          <button type="button" className="oc-carousel__nav oc-carousel__nav--next" aria-label="Next slide" aria-controls={trackId} disabled={!loop && current === pageCount - 1} onClick={() => go(current + 1)}>
            <span aria-hidden="true">›</span>
          </button>
        )}
      </div>
      {showIndicators && pageCount > 1 && (
        <div className="oc-carousel__indicators" role="group" aria-label={`Choose ${slideWord.toLowerCase()} to display`}>
          {Array.from({ length: pageCount }, (_, p) => (
            <button
              key={p}
              type="button"
              className="oc-carousel__dot"
              aria-label={`${slideWord} ${p + 1}`}
              aria-current={p === current ? 'true' : undefined}
              aria-controls={trackId}
              onClick={() => go(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ======================================================================
 * Galleria
 * ==================================================================== */

export interface GalleriaItem {
  src: string;
  alt: string;
  thumbnailSrc?: string;
  caption?: ReactNode;
}

export interface GalleriaProps {
  items: GalleriaItem[];
  label: string;
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  showThumbnails?: boolean;
  showCaptions?: boolean;
  /** Offer a full-screen (modal) view. */
  fullScreen?: boolean;
  circular?: boolean;
  autoplayInterval?: number;
  className?: string;
}

export function Galleria({
  items,
  label,
  activeIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  showThumbnails = true,
  showCaptions = true,
  fullScreen = false,
  circular = true,
  autoplayInterval = 0,
  className,
}: GalleriaProps) {
  const count = items.length;
  const [raw, setIndex, indexRef] = useControlled(activeIndex, defaultActiveIndex, onActiveIndexChange);
  const index = clamp(raw, 0, Math.max(0, count - 1));
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(open, () => setOpen(false), panelRef);
  const loop = circular || autoplayInterval > 0;
  const go = (i: number) => setIndex(loop ? (i + count) % count : clamp(i, 0, count - 1));
  const auto = useAutoplay(autoplayInterval, count > 1 && !open, () => setIndex((indexRef.current + 1) % count));
  if (!count) return null;
  const item = items[index];

  const viewer = (large: boolean) => (
    <>
      <figure className={cx('oc-galleria__figure', large && 'oc-galleria__figure--full')}>
        <div className="oc-galleria__stage">
          <button type="button" className="oc-carousel__nav oc-galleria__nav oc-galleria__nav--prev" aria-label="Previous image" disabled={!loop && index === 0} onClick={() => go(index - 1)}>
            <span aria-hidden="true">‹</span>
          </button>
          <img className="oc-galleria__image" src={item.src} alt={item.alt} />
          <button type="button" className="oc-carousel__nav oc-galleria__nav oc-galleria__nav--next" aria-label="Next image" disabled={!loop && index === count - 1} onClick={() => go(index + 1)}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
        {showCaptions && item.caption && <figcaption className="oc-galleria__caption">{item.caption}</figcaption>}
      </figure>
      <p className="oc-sr-only" aria-live={auto.rotating ? 'off' : 'polite'}>
        Image {index + 1} of {count}
      </p>
      {showThumbnails && (
        <ul className="oc-galleria__thumbs">
          {items.map((it, i) => (
            <li key={i}>
              <button type="button" className="oc-galleria__thumb" aria-label={`Show image ${i + 1}: ${it.alt}`} aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)}>
                <img src={it.thumbnailSrc ?? it.src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <section className={cx('oc-galleria', className)} aria-roledescription="gallery" aria-label={label} {...auto.handlers}>
      {(auto.enabled || fullScreen) && (
        <div className="oc-galleria__toolbar">
          {auto.enabled && (
            <button type="button" className="oc-btn oc-btn--secondary oc-btn--sm" aria-label={auto.playing ? 'Pause slide show' : 'Start slide show'} onClick={() => auto.setPlaying(!auto.playing)}>
              <span aria-hidden="true">{auto.playing ? '❚❚' : '▶'}</span>
              <span>{auto.playing ? 'Pause' : 'Play'}</span>
            </button>
          )}
          {fullScreen && (
            <button type="button" className="oc-btn oc-btn--secondary oc-btn--sm" onClick={() => setOpen(true)}>
              Full screen
            </button>
          )}
        </div>
      )}
      {!open && viewer(false)}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="oc-overlay oc-galleria__overlay">
            <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="oc-galleria oc-galleria--full">
              <div className="oc-galleria__toolbar">
                <button type="button" className="oc-close oc-galleria__close" aria-label="Close full screen" onClick={() => setOpen(false)}>
                  ×
                </button>
              </div>
              {viewer(true)}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

/* ======================================================================
 * Image (with preview lightbox) / ImageCompare
 * ==================================================================== */

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> {
  /** Required. Use "" only for decorative images (preview is then labelled generically). */
  alt: string;
  preview?: boolean;
  /** Larger source shown in the preview. */
  previewSrc?: string;
}

export function Image({ alt, preview = false, previewSrc, className, ...img }: ImageProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    setScale(1);
    setRotate(0);
  };
  useModal(open, close, panelRef);
  const image = <img {...img} alt={alt} className="oc-image__img" />;
  if (!preview) return <span className={cx('oc-image', className)}>{image}</span>;
  const name = alt || 'image';
  const tool = 'oc-btn oc-btn--ghost oc-btn--icon oc-btn--sm oc-image__tool';
  return (
    <span className={cx('oc-image', 'oc-image--preview', className)}>
      <button type="button" className="oc-image__trigger" aria-label={`Preview ${name}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {image}
        <span className="oc-image__badge" aria-hidden="true">
          ⤢
        </span>
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="oc-overlay oc-image__overlay"
            onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div ref={panelRef} role="dialog" aria-modal="true" aria-label={`Preview: ${name}`} tabIndex={-1} className="oc-image__dialog">
              <div className="oc-image__toolbar" role="toolbar" aria-label="Image tools">
                <button type="button" className={tool} aria-label="Rotate left" onClick={() => setRotate((r) => r - 90)}>
                  <span aria-hidden="true">↺</span>
                </button>
                <button type="button" className={tool} aria-label="Rotate right" onClick={() => setRotate((r) => r + 90)}>
                  <span aria-hidden="true">↻</span>
                </button>
                <button type="button" className={tool} aria-label="Zoom out" disabled={scale <= 0.5} onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}>
                  <span aria-hidden="true">−</span>
                </button>
                <button type="button" className={tool} aria-label="Zoom in" disabled={scale >= 3} onClick={() => setScale((s) => Math.min(3, s + 0.25))}>
                  <span aria-hidden="true">+</span>
                </button>
                <button type="button" className={tool} aria-label="Close preview" onClick={close}>
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <img className="oc-image__preview" src={previewSrc ?? img.src} alt={alt} style={{ transform: `rotate(${rotate}deg) scale(${scale})` }} />
              <p className="oc-sr-only" aria-live="polite">
                Zoom {Math.round(scale * 100)}%, rotated {((rotate % 360) + 360) % 360} degrees
              </p>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}

export interface ImageCompareProps {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  /** Percentage of the "before" image revealed. */
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  label?: string;
  className?: string;
}

export function ImageCompare({ before, after, value, defaultValue = 50, onChange, label = 'Comparison slider', className }: ImageCompareProps) {
  const [pos, setPos] = useControlled(value, defaultValue, onChange);
  return (
    <div className={cx('oc-image-compare', className)} style={{ '--oc-ic-pos': `${pos}%` } as CSSProperties}>
      <img className="oc-image-compare__img oc-image-compare__after" src={after.src} alt={after.alt} />
      <img className="oc-image-compare__img oc-image-compare__before" src={before.src} alt={before.alt} />
      <input
        type="range"
        className="oc-image-compare__range"
        min={0}
        max={100}
        step={1}
        value={pos}
        aria-label={label}
        aria-valuetext={`${Math.round(pos)}% ${before.alt || 'before'}, ${Math.round(100 - pos)}% ${after.alt || 'after'}`}
        onChange={(e) => setPos(Number(e.target.value))}
      />
      <span className="oc-image-compare__handle" aria-hidden="true" />
    </div>
  );
}

/* ======================================================================
 * MeterGroup / Chip / Message
 * ==================================================================== */

export type MeterColor = 'primary' | 'info' | 'success' | 'warning' | 'danger';

export interface MeterItem {
  label: string;
  value: number;
  color?: MeterColor;
}

export interface MeterGroupProps {
  value: MeterItem[];
  label: string;
  min?: number;
  max?: number;
  showLegend?: boolean;
  formatValue?: (value: number, item: MeterItem) => string;
  className?: string;
}

const METER_COLORS: MeterColor[] = ['primary', 'info', 'success', 'warning', 'danger'];

export function MeterGroup({ value, label, min = 0, max = 100, showLegend = true, formatValue, className }: MeterGroupProps) {
  const range = max - min || 1;
  const fmt = (item: MeterItem) => (formatValue ? formatValue(item.value, item) : `${Math.round(((item.value - min) / range) * 100)}%`);
  const colorOf = (item: MeterItem, i: number) => item.color ?? METER_COLORS[i % METER_COLORS.length];
  return (
    <div role="group" aria-label={label} className={cx('oc-meter-group', className)}>
      <div className="oc-meter-group__bar">
        {value.map((item, i) => (
          <div
            key={item.label}
            role="meter"
            aria-label={item.label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={item.value}
            aria-valuetext={fmt(item)}
            className={cx('oc-meter-group__seg', `oc-meter-group--${colorOf(item, i)}`, `oc-meter-group__pattern--${i % 4}`)}
            style={{ width: `${clamp(((item.value - min) / range) * 100, 0, 100)}%` }}
          />
        ))}
      </div>
      {showLegend && (
        <ul className="oc-meter-group__legend" aria-hidden="true">
          {value.map((item, i) => (
            <li key={item.label} className="oc-meter-group__legend-item">
              <span className={cx('oc-meter-group__swatch', `oc-meter-group--${colorOf(item, i)}`, `oc-meter-group__pattern--${i % 4}`)} />
              <span>{item.label}</span>
              <span className="oc-meter-group__value">{fmt(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface ChipProps {
  label: string;
  image?: string;
  imageAlt?: string;
  icon?: ReactNode;
  removable?: boolean;
  /** Called when removed. Uncontrolled chips also hide themselves. */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}

export function Chip({ label, image, imageAlt = '', icon, removable = false, onRemove, removeLabel, className }: ChipProps) {
  const [removed, setRemoved] = useState(false);
  if (removed) return null;
  return (
    <span className={cx('oc-chip', image && 'oc-chip--image', className)}>
      {image && <img className="oc-chip__image" src={image} alt={imageAlt} />}
      {!image && icon && (
        <span className="oc-chip__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="oc-chip__label">{label}</span>
      {removable && (
        <button
          type="button"
          className="oc-chip__remove"
          aria-label={removeLabel ?? `Remove ${label}`}
          onClick={() => {
            if (onRemove) onRemove();
            else setRemoved(true);
          }}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
}

export type MessageSeverity = 'info' | 'success' | 'warn' | 'error';

export interface MessageProps {
  severity?: MessageSeverity;
  text?: ReactNode;
  children?: ReactNode;
  /** Custom icon, or false to hide it. */
  icon?: ReactNode | false;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

const MESSAGE_ICONS: Record<MessageSeverity, string> = { info: 'i', success: '✓', warn: '!', error: '×' };
const MESSAGE_NAMES: Record<MessageSeverity, string> = { info: 'Info', success: 'Success', warn: 'Warning', error: 'Error' };

/** Compact inline message. Errors and warnings use role="alert"; others role="status". */
export function Message({ severity = 'info', text, children, icon, closable = false, onClose, className }: MessageProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div role={severity === 'error' || severity === 'warn' ? 'alert' : 'status'} className={cx('oc-message', `oc-message--${severity}`, className)}>
      {icon !== false && (
        <span className="oc-message__icon" aria-hidden="true">
          {icon ?? MESSAGE_ICONS[severity]}
        </span>
      )}
      <span className="oc-sr-only">{MESSAGE_NAMES[severity]}: </span>
      <span className="oc-message__text">{text ?? children}</span>
      {closable && (
        <button
          type="button"
          className="oc-message__close"
          aria-label="Dismiss message"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}

/* ======================================================================
 * FileUpload
 * ==================================================================== */

export interface FileUploadHelpers {
  /** Report progress (0–100) for one file. */
  onProgress: (file: File, percent: number) => void;
}

export interface FileUploadProps {
  mode?: 'basic' | 'advanced';
  name?: string;
  accept?: string;
  multiple?: boolean;
  /** Bytes. */
  maxFileSize?: number;
  fileLimit?: number;
  disabled?: boolean;
  /** Upload immediately after selection. */
  auto?: boolean;
  chooseLabel?: string;
  uploadLabel?: string;
  cancelLabel?: string;
  /** Accessible name of the drop zone / control group. */
  label?: string;
  emptyMessage?: ReactNode;
  onSelect?: (files: File[]) => void;
  onRemove?: (file: File) => void;
  onError?: (errors: string[]) => void;
  /** Performs the upload (no network code lives in the component). Reject to mark files as failed. */
  onUpload?: (files: File[], helpers: FileUploadHelpers) => void | Promise<void>;
  className?: string;
}

interface UploadEntry {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[u]}`;
}

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => (rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

export function FileUpload({
  mode = 'advanced',
  name,
  accept,
  multiple = false,
  maxFileSize,
  fileLimit,
  disabled = false,
  auto = false,
  chooseLabel = 'Choose',
  uploadLabel = 'Upload',
  cancelLabel = 'Clear',
  label = 'File upload',
  emptyMessage = 'Drag and drop files here, or use Choose.',
  onSelect,
  onRemove,
  onError,
  onUpload,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [message, announce] = useAnnouncer();
  const errorId = useId();
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const update = (ids: string[], patch: Partial<UploadEntry>) =>
    mounted.current && setEntries((list) => list.map((e) => (ids.includes(e.id) ? { ...e, ...patch } : e)));

  const upload = async (targets: UploadEntry[]) => {
    if (!onUpload || !targets.length) return;
    const ids = targets.map((t) => t.id);
    update(ids, { status: 'uploading', progress: 0 });
    const byFile = new Map(targets.map((t) => [t.file, t.id]));
    try {
      await onUpload(
        targets.map((t) => t.file),
        {
          onProgress: (file, percent) => {
            const id = byFile.get(file);
            if (id) update([id], { progress: clamp(percent, 0, 100) });
          },
        },
      );
      update(ids, { status: 'done', progress: 100 });
      announce(`Uploaded ${targets.length} ${targets.length === 1 ? 'file' : 'files'}`);
    } catch {
      update(ids, { status: 'error' });
      announce('Upload failed');
    }
  };

  const addFiles = (list: FileList | File[] | null) => {
    if (!list || disabled) return;
    const incoming = Array.from(list);
    const errs: string[] = [];
    const accepted: UploadEntry[] = [];
    const existing = mode === 'basic' ? [] : entriesRef.current;
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) errs.push(`${file.name}: file type is not allowed. Allowed types: ${accept}.`);
      else if (maxFileSize !== undefined && file.size > maxFileSize)
        errs.push(`${file.name}: file is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxFileSize)}.`);
      else if (fileLimit !== undefined && existing.length + accepted.length >= fileLimit) {
        errs.push(`Too many files: ${file.name} was not added. Maximum is ${fileLimit}.`);
      } else {
        const id = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existing.some((e) => e.id === id) && !accepted.some((e) => e.id === id)) accepted.push({ id, file, progress: 0, status: 'pending' });
      }
    }
    setErrors(errs);
    if (errs.length) onError?.(errs);
    if (accepted.length) {
      const next = mode === 'basic' ? accepted : [...existing, ...accepted];
      setEntries(next);
      entriesRef.current = next;
      onSelect?.(accepted.map((e) => e.file));
      announce(`${accepted.length} ${accepted.length === 1 ? 'file' : 'files'} added`);
      if (auto || mode === 'basic') void upload(accepted);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (entry: UploadEntry) => {
    setEntries((l) => l.filter((e) => e.id !== entry.id));
    onRemove?.(entry.file);
    announce(`Removed ${entry.file.name}`);
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      name={name}
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      hidden
      onChange={(e) => addFiles(e.target.files)}
    />
  );
  const errorList = errors.length > 0 && (
    <ul id={errorId} role="alert" className="oc-fileupload__errors">
      {errors.map((err) => (
        <li key={err}>{err}</li>
      ))}
    </ul>
  );

  if (mode === 'basic') {
    const entry = entries[0];
    return (
      <div className={cx('oc-fileupload', 'oc-fileupload--basic', className)}>
        {input}
        <button type="button" className="oc-btn oc-btn--primary" disabled={disabled} aria-describedby={errors.length ? errorId : undefined} onClick={() => inputRef.current?.click()}>
          {chooseLabel}
        </button>
        {entry && (
          <span className="oc-fileupload__basic-name">
            {entry.file.name} ({formatFileSize(entry.file.size)})
          </span>
        )}
        {errorList}
        <LiveRegion message={message} />
      </div>
    );
  }

  const pending = entries.filter((e) => e.status === 'pending' || e.status === 'error');
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className={cx('oc-fileupload', className)}>
      {input}
      <div className="oc-fileupload__bar">
        <button type="button" className="oc-btn oc-btn--primary" disabled={disabled} aria-describedby={errors.length ? errorId : undefined} onClick={() => inputRef.current?.click()}>
          {chooseLabel}
        </button>
        {!auto && onUpload && (
          <button type="button" className="oc-btn oc-btn--secondary" disabled={disabled || !pending.length} onClick={() => void upload(pending)}>
            {uploadLabel}
          </button>
        )}
        <button
          type="button"
          className="oc-btn oc-btn--ghost"
          disabled={disabled || !entries.length}
          onClick={() => {
            setEntries([]);
            setErrors([]);
            announce('All files cleared');
          }}
        >
          {cancelLabel}
        </button>
      </div>
      <div
        role="group"
        aria-label={label}
        className={cx('oc-fileupload__zone', dragging && 'is-dragging')}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {errorList}
        {entries.length === 0 ? (
          <p className="oc-fileupload__empty">{emptyMessage}</p>
        ) : (
          <ul className="oc-fileupload__list" aria-label="Selected files">
            {entries.map((entry) => (
              <li key={entry.id} className="oc-fileupload__file">
                <div className="oc-fileupload__meta">
                  <span className="oc-fileupload__name">{entry.file.name}</span>
                  <span className="oc-fileupload__size">{formatFileSize(entry.file.size)}</span>
                  <span className={cx('oc-fileupload__status', `oc-fileupload__status--${entry.status}`)}>
                    {entry.status === 'done' ? 'Uploaded' : entry.status === 'error' ? 'Failed' : entry.status === 'uploading' ? `${Math.round(entry.progress)}%` : 'Pending'}
                  </span>
                </div>
                {entry.status !== 'pending' && <ProgressBar value={entry.progress} label={`Upload progress for ${entry.file.name}`} />}
                <button type="button" className="oc-close oc-fileupload__remove" aria-label={`Remove ${entry.file.name}`} disabled={entry.status === 'uploading'} onClick={() => remove(entry)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <LiveRegion message={message} />
    </div>
  );
}

/* ======================================================================
 * Terminal
 * ==================================================================== */

export interface TerminalProps {
  welcomeMessage?: ReactNode;
  prompt?: string;
  /** Returns the response to print (sync or async). */
  onCommand: (command: string) => ReactNode | Promise<ReactNode>;
  label?: string;
  className?: string;
}

interface TerminalEntry {
  id: number;
  command: string;
  response: ReactNode;
  pending: boolean;
}

export function Terminal({ welcomeMessage, prompt = '$', onCommand, label = 'Terminal', className }: TerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [value, setValue] = useState('');
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);
  useEffect(() => {
    const el = logRef.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const run = (command: string) => {
    const id = nextId.current++;
    history.current.push(command);
    cursor.current = -1;
    setEntries((l) => [...l, { id, command, response: null, pending: true }]);
    Promise.resolve()
      .then(() => onCommand(command))
      .then(
        (response) => mounted.current && setEntries((l) => l.map((e) => (e.id === id ? { ...e, response, pending: false } : e))),
        () => mounted.current && setEntries((l) => l.map((e) => (e.id === id ? { ...e, response: 'Command failed', pending: false } : e))),
      );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const h = history.current;
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = value.trim();
      if (cmd) run(cmd);
      setValue('');
    } else if (e.key === 'ArrowUp' && h.length) {
      e.preventDefault();
      cursor.current = cursor.current < 0 ? h.length - 1 : Math.max(0, cursor.current - 1);
      setValue(h[cursor.current]);
    } else if (e.key === 'ArrowDown' && cursor.current >= 0) {
      e.preventDefault();
      cursor.current = cursor.current + 1;
      if (cursor.current >= h.length) {
        cursor.current = -1;
        setValue('');
      } else setValue(h[cursor.current]);
    }
  };

  return (
    <div className={cx('oc-terminal', className)} dir="ltr" onClick={() => window.getSelection()?.toString() || inputRef.current?.focus()}>
      <div className="oc-terminal__scroll">
        {welcomeMessage && <div className="oc-terminal__welcome">{welcomeMessage}</div>}
        <div ref={logRef} role="log" aria-live="polite" aria-label={`${label} output`} className="oc-terminal__log">
          {entries.map((e) => (
            <div key={e.id} className="oc-terminal__entry">
              <div className="oc-terminal__command">
                <span className="oc-terminal__prompt" aria-hidden="true">
                  {prompt}
                </span>{' '}
                {e.command}
              </div>
              <div className="oc-terminal__response">{e.pending ? '…' : e.response}</div>
            </div>
          ))}
        </div>
        <div className="oc-terminal__input-row">
          <label htmlFor={inputId} className="oc-terminal__prompt">
            <span aria-hidden="true">{prompt}</span>
            <span className="oc-sr-only">{label} command</span>
          </label>
          <input
            ref={inputRef}
            id={inputId}
            className="oc-terminal__input"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </div>
  );
}

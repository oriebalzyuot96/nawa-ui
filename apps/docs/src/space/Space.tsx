/**
 * Pelagic Space — drag-and-drop page builder and "describe it, see it" playground for Pelagic UI.
 * Pointer-event drag and drop (no dependency) with a full keyboard alternative (WCAG 2.5.7).
 */
import { useCallback, useEffect, useId, useReducer, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button, Segmented, Select, Tabs, Toaster } from '@pelagic-ui/react';
import { notify, onNotice, type Notice } from './notify';
import { Canvas, type CanvasHandlers, type Device } from './Canvas';
import { Inspector, Layers, Palette, type ArrangeAction, type PaletteItem } from './Panels';
import { Describe } from './Describe';
import { ExportDialog, ShortcutsDialog, TemplatesDialog, downloadFile } from './Dialogs';
import { BLOCKS, type BlockId } from './blocks';
import { REGISTRY, isContainer, tpl } from './registry';
import { initState, reducer } from './store';
import { TEMPLATES, templateDoc } from './templates';
import { childrenOf, cloneFresh, findNode, flatten, insertNodes, isAncestor, locate, moveNode, removeNode, updateNode } from './tree';
import { decodeShare, encodeShare, loadDoc, readShareToken, sanitizeDoc, saveDoc, SHARE_PARAM } from './persist';
import { Icon } from './icons';
import { ACCENTS, emptyDoc, type NodeType, type PropValue, type SpaceDoc, type SpaceNode } from './types';
import './space.css';

type Scope = 'canvas' | 'tree';
type DragPayload = { kind: 'new'; item: PaletteItem } | { kind: 'move'; id: string };
interface DropTarget {
  parentId: string | null;
  index: number;
  rect: { left: number; top: number; width: number; height: number };
  box: boolean;
  key: string;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function MiniSelect({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <span className="sp-mini">
      <Select label={label} value={value} options={options} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

function ToolButton({ icon, label, onClick, disabled, pressed, showLabel = true, variant = 'ghost', shortcut }: { icon: string; label: string; onClick: () => void; disabled?: boolean; pressed?: boolean; showLabel?: boolean; variant?: 'ghost' | 'secondary' | 'primary'; shortcut?: string }) {
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={showLabel ? undefined : label}
      aria-keyshortcuts={shortcut}
      title={label}
      className={`sp-tb${showLabel ? '' : ' sp-tb--icon'}`}
    >
      <Icon name={icon} size={16} />
      {showLabel && <span className="sp-tb__text">{label}</span>}
    </Button>
  );
}

function parentLabel(nodes: SpaceNode[], parentId: string | null): string {
  if (!parentId) return 'the page';
  const p = findNode(nodes, parentId);
  return p ? REGISTRY[p.type].label : 'the page';
}

export default function SpaceApp() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initState(templateDoc(TEMPLATES.find((t) => t.id === 'landing')!)));
  const { doc, selected } = state;
  const stateRef = useRef(state);
  stateRef.current = state;

  const [device, setDevice] = useState<Device>('desktop');
  const [zoom, setZoom] = useState(100);
  const [preview, setPreview] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<'add' | 'layers'>('add');
  const [sheet, setSheet] = useState<'left' | 'inspect' | null>(null);
  const [dialog, setDialog] = useState<'export' | 'templates' | 'shortcuts' | null>(null);
  const [live, setLive] = useState({ msg: '', n: 0 });
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onNotice((n) => {
      setNotice(n);
      clearTimeout(timer);
      timer = setTimeout(() => setNotice(null), 4500);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);
  const [drag, setDrag] = useState<{ label: string; icon: string } | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);

  const pendingFocus = useRef<{ scope: Scope; id: string } | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);
  const describeRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const suppressClick = useRef(false);

  const announce = useCallback((msg: string) => setLive((l) => ({ msg, n: l.n + 1 })), []);

  /* ---------- Load: share link > draft > default template ---------- */
  useEffect(() => {
    let cancelled = false;
    const token = readShareToken();
    if (token) {
      decodeShare(token).then((d) => {
        if (cancelled) return;
        if (d) {
          dispatch({ type: 'replace', doc: d });
          notify('Shared page loaded');
        } else notify('This share link could not be read', 'error');
      });
    } else {
      const draft = loadDoc(true);
      if (draft && draft.nodes.length) dispatch({ type: 'replace', doc: draft });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Autosave draft ---------- */
  useEffect(() => {
    const t = setTimeout(() => saveDoc(doc, true), 500);
    return () => clearTimeout(t);
  }, [doc]);

  /* ---------- Restore focus after keyboard edits ---------- */
  useEffect(() => {
    const p = pendingFocus.current;
    if (!p) return;
    pendingFocus.current = null;
    const sel = p.scope === 'canvas' ? `.sp-root [data-node-id="${CSS.escape(p.id)}"]` : `[data-tree-id="${CSS.escape(p.id)}"]`;
    const el = document.querySelector<HTMLElement>(sel);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });

  /* ---------- Mutations ---------- */
  const commitNodes = useCallback((nodes: SpaceNode[], select?: string | null, key?: string) => {
    dispatch({ type: 'commit', doc: { ...stateRef.current.doc, nodes }, select, key });
  }, []);

  const commitDoc = useCallback((next: SpaceDoc, key?: string) => dispatch({ type: 'commit', doc: next, key }), []);

  const select = useCallback((id: string | null) => dispatch({ type: 'select', id }), []);

  const makeNodes = useCallback((item: PaletteItem): SpaceNode[] => {
    const [kind, id] = item.key.split(':');
    if (kind === 'block') return BLOCKS[id as BlockId].build({ lang: stateRef.current.doc.lang }).map(cloneFresh);
    return [cloneFresh(tpl(id as NodeType))];
  }, []);

  const defaultTarget = useCallback((): { parentId: string | null; index: number } => {
    const { doc: d, selected: sel } = stateRef.current;
    const loc = sel ? locate(d.nodes, sel) : null;
    if (!loc) return { parentId: null, index: d.nodes.length };
    if (isContainer(loc.node.type) && loc.node.type !== 'tabs') return { parentId: loc.node.id, index: loc.node.children?.length ?? 0 };
    return { parentId: loc.parentId, index: loc.index + 1 };
  }, []);

  const addItem = useCallback(
    (item: PaletteItem, target = defaultTarget()) => {
      const items = makeNodes(item);
      const nodes = insertNodes(stateRef.current.doc.nodes, target.parentId, target.index, items);
      commitNodes(nodes, items[0].id);
      announce(`Added ${item.label} to ${parentLabel(nodes, target.parentId)}, position ${target.index + 1}.`);
      pendingFocus.current = { scope: 'canvas', id: items[0].id };
      setSheet(null);
    },
    [announce, commitNodes, defaultTarget, makeNodes],
  );

  const arrange = useCallback(
    (action: ArrangeAction, id: string | null = stateRef.current.selected, scope: Scope = 'canvas') => {
      const nodes = stateRef.current.doc.nodes;
      if (!id) return;
      const loc = locate(nodes, id);
      if (!loc) return;
      const label = REGISTRY[loc.node.type].label;
      const siblings = childrenOf(nodes, loc.parentId);
      const focus = (fid: string | null) => {
        if (fid) pendingFocus.current = { scope, id: fid };
      };
      switch (action) {
        case 'up':
          if (loc.index === 0) return announce(`${label} is already first in ${parentLabel(nodes, loc.parentId)}.`);
          commitNodes(moveNode(nodes, id, loc.parentId, loc.index - 1), id);
          announce(`Moved ${label} up to position ${loc.index} of ${siblings.length}.`);
          return focus(id);
        case 'down':
          if (loc.index >= siblings.length - 1) return announce(`${label} is already last in ${parentLabel(nodes, loc.parentId)}.`);
          commitNodes(moveNode(nodes, id, loc.parentId, loc.index + 2), id);
          announce(`Moved ${label} down to position ${loc.index + 2} of ${siblings.length}.`);
          return focus(id);
        case 'indent': {
          const prev = siblings[loc.index - 1];
          if (!prev || !isContainer(prev.type)) return announce(`No container before ${label} to move into.`);
          commitNodes(moveNode(nodes, id, prev.id, prev.children?.length ?? 0), id);
          announce(`Moved ${label} into ${REGISTRY[prev.type].label}.`);
          return focus(id);
        }
        case 'outdent': {
          if (!loc.parentId) return announce(`${label} is already at the top level.`);
          const parent = locate(nodes, loc.parentId)!;
          commitNodes(moveNode(nodes, id, parent.parentId, parent.index + 1), id);
          announce(`Moved ${label} out of ${REGISTRY[parent.node.type].label}.`);
          return focus(id);
        }
        case 'duplicate': {
          const copy = cloneFresh(loc.node);
          commitNodes(insertNodes(nodes, loc.parentId, loc.index + 1, [copy]), copy.id);
          announce(`Duplicated ${label}.`);
          return focus(copy.id);
        }
        case 'delete': {
          const next = siblings[loc.index + 1] ?? siblings[loc.index - 1] ?? (loc.parentId ? findNode(nodes, loc.parentId) : null);
          commitNodes(removeNode(nodes, id), next?.id ?? null);
          announce(`Deleted ${label}. Press Ctrl+Z to undo.`);
          return focus(next?.id ?? null);
        }
        case 'parent':
          if (!loc.parentId) return;
          select(loc.parentId);
          return focus(loc.parentId);
      }
    },
    [announce, commitNodes, select],
  );

  const setProp = useCallback(
    (id: string, key: string, value: PropValue) => {
      commitNodes(updateNode(stateRef.current.doc.nodes, id, (n) => ({ ...n, props: { ...n.props, [key]: value } })), undefined, `${id}:${key}`);
    },
    [commitNodes],
  );

  const undo = useCallback(() => {
    if (!stateRef.current.past.length) return;
    dispatch({ type: 'undo' });
    announce('Undone.');
  }, [announce]);
  const redo = useCallback(() => {
    if (!stateRef.current.future.length) return;
    dispatch({ type: 'redo' });
    announce('Redone.');
  }, [announce]);

  /* ---------- Keyboard on nodes (canvas and layers share it) ---------- */
  const focusInspector = () => {
    setSheet('inspect');
    requestAnimationFrame(() => inspectorRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus());
  };

  const nodeKeyDown = (scope: Scope) => (e: KeyboardEvent<HTMLElement>, node: SpaceNode) => {
    const mod = e.ctrlKey || e.metaKey;
    const flat = flatten(stateRef.current.doc.nodes);
    const pos = flat.findIndex((f) => f.node.id === node.id);
    const go = (target: SpaceNode | undefined) => {
      if (!target) return;
      select(target.id);
      pendingFocus.current = { scope, id: target.id };
    };
    if (e.altKey && e.key === 'ArrowUp') arrange('up', node.id, scope);
    else if (e.altKey && e.key === 'ArrowDown') arrange('down', node.id, scope);
    else if (e.altKey && e.key === 'ArrowRight') arrange('indent', node.id, scope);
    else if (e.altKey && e.key === 'ArrowLeft') arrange('outdent', node.id, scope);
    else if (mod && e.key.toLowerCase() === 'd') arrange('duplicate', node.id, scope);
    else if (e.key === 'Delete' || e.key === 'Backspace') arrange('delete', node.id, scope);
    else if (e.key === 'ArrowDown' && !e.altKey) go(flat[pos + 1]?.node);
    else if (e.key === 'ArrowUp' && !e.altKey) go(flat[pos - 1]?.node);
    else if (e.key === 'Home') go(flat[0]?.node);
    else if (e.key === 'End') go(flat[flat.length - 1]?.node);
    else if (e.key === 'Escape') {
      const loc = locate(stateRef.current.doc.nodes, node.id);
      if (loc?.parentId) go(findNode(stateRef.current.doc.nodes, loc.parentId) ?? undefined);
      else return;
    } else if (scope === 'tree' && e.key === 'ArrowLeft') {
      const loc = locate(stateRef.current.doc.nodes, node.id);
      go(loc?.parentId ? findNode(stateRef.current.doc.nodes, loc.parentId) ?? undefined : undefined);
    } else if (scope === 'tree' && e.key === 'ArrowRight') go(node.children?.[0]);
    else if (e.key === 'Enter' || (scope === 'tree' && e.key === ' ')) {
      select(node.id);
      if (e.key === 'Enter') focusInspector();
    } else return;
    e.preventDefault();
    e.stopPropagation();
  };

  /* ---------- Global shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (!t.closest('.sp-app') && t !== document.body) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (mod && ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  /* ---------- Pointer drag and drop ---------- */
  const session = useRef<{ payload: DragPayload; x: number; y: number; started: boolean; label: string; icon: string } | null>(null);

  const computeDrop = useCallback((x: number, y: number): DropTarget | null => {
    const s = session.current;
    const hit = document.elementFromPoint(x, y) as HTMLElement | null;
    const root = hit?.closest<HTMLElement>('[data-sp-root]');
    if (!hit || !root) return null;
    const nodes = stateRef.current.doc.nodes;
    const rtl = stateRef.current.doc.rtl;
    const dragId = s?.payload.kind === 'move' ? s.payload.id : null;
    let el = hit.closest<HTMLElement>('[data-node-id]');
    if (dragId && el) {
      const dragEl = root.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(dragId)}"]`);
      if (dragEl && (dragEl === el || dragEl.contains(el))) return null;
    }

    const wrappersOf = (parentId: string | null) =>
      parentId === null
        ? Array.from(root.querySelectorAll<HTMLElement>(':scope > [data-node-id]'))
        : Array.from(root.querySelectorAll<HTMLElement>(`[data-parent-id="${CSS.escape(parentId)}"]`));
    const axisOf = (parentId: string | null): string => (parentId === null ? 'y' : root.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(parentId)}"]`)?.dataset.axis ?? 'y');
    const before = (r: DOMRect, axis: string) => {
      if (axis === 'y') return y < r.top + r.height / 2;
      if (y < r.top) return true;
      if (y > r.bottom) return false;
      return rtl ? x > r.left + r.width / 2 : x < r.left + r.width / 2;
    };
    const indexIn = (parentId: string | null) => {
      const axis = axisOf(parentId);
      for (const w of wrappersOf(parentId)) if (before(w.getBoundingClientRect(), axis)) return Number(w.dataset.index);
      return childrenOf(nodes, parentId).length;
    };
    const build = (parentId: string | null, index: number): DropTarget | null => {
      if (dragId && parentId && (parentId === dragId || isAncestor(nodes, dragId, parentId))) return null;
      const axis = axisOf(parentId);
      const ws = wrappersOf(parentId);
      const at = ws.find((w) => Number(w.dataset.index) === index);
      const last = ws[ws.length - 1];
      let rect: DropTarget['rect'];
      let box = false;
      if (at || last) {
        const r = (at ?? last).getBoundingClientRect();
        const start = Boolean(at);
        if (axis === 'y') rect = { left: r.left, width: r.width, top: (start ? r.top : r.bottom) - 2, height: 4 };
        else {
          const edge = rtl ? (start ? r.right : r.left) : start ? r.left : r.right;
          rect = { left: edge - 2, width: 4, top: r.top, height: r.height };
        }
      } else {
        const slot = root.querySelector<HTMLElement>(`[data-empty-for="${CSS.escape(parentId ?? '')}"]`) ?? (parentId ? root.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(parentId)}"]`) : root);
        const r = (slot ?? root).getBoundingClientRect();
        rect = { left: r.left, top: r.top, width: r.width, height: r.height };
        box = true;
      }
      return { parentId, index, rect, box, key: `${parentId}:${index}` };
    };

    if (!el) return build(null, indexIn(null));
    const id = el.dataset.nodeId!;
    const parentId = el.dataset.parentId || null;
    const ownIndex = Number(el.dataset.index);
    const r = el.getBoundingClientRect();
    if (el.dataset.container === 'true') {
      const edge = Math.min(14, r.height * 0.18);
      if (y < r.top + edge) return build(parentId, ownIndex);
      if (y > r.bottom - edge) return build(parentId, ownIndex + 1);
      return build(id, indexIn(id));
    }
    return build(parentId, before(r, axisOf(parentId)) ? ownIndex : ownIndex + 1);
  }, []);

  const endDrag = useCallback(() => {
    session.current = null;
    setDrag(null);
    setDrop(null);
    document.body.classList.remove('sp-is-dragging');
  }, []);

  useEffect(() => {
    let lastKey = '';
    const onMove = (e: globalThis.PointerEvent) => {
      const s = session.current;
      if (!s) return;
      if (!s.started) {
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 6) return;
        s.started = true;
        setDrag({ label: s.label, icon: s.icon });
        document.body.classList.add('sp-is-dragging');
      }
      e.preventDefault();
      if (ghostRef.current) ghostRef.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 10}px)`;
      const sc = canvasScrollRef.current;
      if (sc) {
        const r = sc.getBoundingClientRect();
        if (e.clientY < r.top + 40) sc.scrollBy(0, -18);
        else if (e.clientY > r.bottom - 40) sc.scrollBy(0, 18);
      }
      const t = computeDrop(e.clientX, e.clientY);
      const key = t ? `${t.key}:${Math.round(t.rect.top)}:${Math.round(t.rect.left)}` : '';
      if (key !== lastKey) {
        lastKey = key;
        setDrop(t);
      }
    };
    const onUp = (e: globalThis.PointerEvent) => {
      const s = session.current;
      if (!s) return;
      if (s.started) {
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 50);
        const t = computeDrop(e.clientX, e.clientY);
        if (t) {
          if (s.payload.kind === 'new') addItem(s.payload.item, { parentId: t.parentId, index: t.index });
          else {
            const nodes = stateRef.current.doc.nodes;
            const moved = moveNode(nodes, s.payload.id, t.parentId, t.index);
            if (moved !== nodes) {
              commitNodes(moved, s.payload.id);
              announce(`Moved ${s.label} to ${parentLabel(moved, t.parentId)}.`);
            }
          }
        } else announce('Drop cancelled.');
      }
      lastKey = '';
      endDrag();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && session.current?.started) {
        e.preventDefault();
        announce('Drag cancelled.');
        endDrag();
      }
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('keydown', onKey);
    };
  }, [addItem, announce, commitNodes, computeDrop, endDrag]);

  const startPending = (e: PointerEvent<HTMLElement>, payload: DragPayload, label: string, icon: string) => {
    session.current = { payload, x: e.clientX, y: e.clientY, started: false, label, icon };
  };

  const onPalettePointerDown = (e: PointerEvent<HTMLButtonElement>, item: PaletteItem) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch' && !(e.target as HTMLElement).closest('[data-grip]')) return;
    startPending(e, { kind: 'new', item }, item.label, item.icon);
  };

  const canvasHandlers: CanvasHandlers = {
    selected,
    focusable: selected && findNode(doc.nodes, selected) ? selected : doc.nodes[0]?.id ?? null,
    onSelect: (id) => select(id),
    onNodePointerDown: (e, node) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      if (stateRef.current.selected !== node.id) select(node.id);
      if (e.pointerType === 'touch' && !(e.target as HTMLElement).closest('[data-grip]')) return;
      startPending(e, { kind: 'move', id: node.id }, REGISTRY[node.type].label, REGISTRY[node.type].icon);
    },
    onNodeKeyDown: nodeKeyDown('canvas'),
    onAction: (a, id) => arrange(a, id, 'canvas'),
    onOpenTemplates: () => setDialog('templates'),
    onFocusDescribe: () => {
      describeRef.current?.focus();
      describeRef.current?.scrollIntoView({ block: 'center' });
    },
  };

  /* ---------- Toolbar actions ---------- */
  const setTheme = (patch: Partial<SpaceDoc['theme']>) => commitDoc({ ...stateRef.current.doc, theme: { ...stateRef.current.doc.theme, ...patch } }, 'theme');

  const share = async () => {
    const token = await encodeShare(doc);
    const url = `${location.origin}${location.pathname}#${SHARE_PARAM}${token}`;
    history.replaceState(null, '', `#${SHARE_PARAM}${token}`);
    try {
      await navigator.clipboard.writeText(url);
      notify('Share link copied', 'success', `The whole page is stored in the link (${url.length.toLocaleString()} characters).`);
    } catch {
      notify('Share link is in the address bar', 'info', 'Copy it from there to share this page.');
    }
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = sanitizeDoc(JSON.parse(await file.text()));
      if (!parsed) throw new Error('invalid');
      commitDoc(parsed);
      dispatch({ type: 'select', id: null });
      notify(`Imported “${parsed.name}”`);
      announce(`Imported ${parsed.name}.`);
    } catch {
      notify('That file is not a Pelagic Space JSON export', 'error');
    }
  };

  const selectedNode = findNode(doc.nodes, selected);
  const count = flatten(doc.nodes).length;

  return (
    <div className={`sp-app${drag ? ' is-dragging' : ''}`} data-sheet={sheet ?? undefined}>
      <Describe
        ref={describeRef}
        onGenerate={(d, mode) => {
          if (mode === 'replace') commitDoc(d);
          else commitDoc({ ...stateRef.current.doc, nodes: [...stateRef.current.doc.nodes, ...d.nodes] });
          dispatch({ type: 'select', id: d.nodes[0]?.id ?? null });
          announce(`Generated ${d.name} with ${flatten(d.nodes).length} components.`);
        }}
      />

      <div className="sp-topbar" role="group" aria-label="Document">
        <div className="sp-topbar__doc">
          <span className="sp-topbar__name" title={doc.name}>
            {doc.name || 'Untitled page'}
          </span>
          <span className="sp-topbar__meta">{count} components</span>
        </div>
        <div className="sp-topbar__actions">
          <ToolButton icon="template" label="Templates" onClick={() => setDialog('templates')} />
          <ToolButton icon="save" label="Save" onClick={() => (saveDoc(doc) ? notify('Saved in this browser') : notify('Storage is not available', 'error'))} />
          <ToolButton
            icon="folder"
            label="Load"
            onClick={() => {
              const d = loadDoc();
              if (d) {
                commitDoc(d);
                notify(`Loaded “${d.name}”`);
              } else notify('Nothing saved yet', 'info');
            }}
          />
          <ToolButton icon="share" label="Share link" onClick={share} />
          <ToolButton icon="upload" label="Import JSON" onClick={() => fileRef.current?.click()} />
          <ToolButton icon="download" label="Export JSON" onClick={() => downloadFile(`${doc.name || 'page'}.pelagic-space.json`, JSON.stringify(doc, null, 2), 'application/json')} />
          <ToolButton
            icon="trash"
            label="Clear"
            onClick={() => {
              commitDoc({ ...emptyDoc(doc.name), theme: doc.theme, rtl: doc.rtl, lang: doc.lang });
              dispatch({ type: 'select', id: null });
              announce('Canvas cleared. Press Ctrl+Z to undo.');
            }}
            disabled={!doc.nodes.length}
          />
          <ToolButton icon="keyboard" label="Keyboard shortcuts" showLabel={false} onClick={() => setDialog('shortcuts')} />
          <Button size="sm" onClick={() => setDialog('export')} className="sp-tb">
            <Icon name="code" size={16} /> Export code
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="pl-sr-only"
          tabIndex={-1}
          aria-label="Import a Pelagic Space JSON file"
          onChange={(e) => {
            importJson(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <div className="sp-workspace">
        <section className="sp-panel sp-panel--left" aria-labelledby="sp-left-title" data-open={sheet === 'left' || undefined}>
          <h2 id="sp-left-title" className="pl-sr-only">Components and layers</h2>
          <div className="sp-sheet-head">
            <span>{leftTab === 'add' ? 'Add components' : 'Layers'}</span>
            <Button variant="ghost" size="sm" iconOnly className="sp-sheet-close" aria-label="Close panel" onClick={() => setSheet(null)}>
              <Icon name="x" size={16} />
            </Button>
          </div>
          <Tabs
            className="sp-left-tabs"
            value={leftTab}
            onChange={(k) => setLeftTab(k as 'add' | 'layers')}
            tabs={[
              {
                key: 'add',
                label: 'Add',
                content: <Palette onAdd={(item) => addItem(item)} onPointerDown={onPalettePointerDown} shouldSuppressClick={() => suppressClick.current} />,
              },
              {
                key: 'layers',
                label: `Layers (${count})`,
                content: <Layers doc={doc} selected={selected} onSelect={(id) => select(id)} onKeyDown={nodeKeyDown('tree')} />,
              },
            ]}
          />
        </section>

        <section className="sp-center" aria-labelledby="sp-canvas-title">
          <h2 id="sp-canvas-title" className="pl-sr-only">Canvas</h2>
          <div className="sp-toolbar" role="group" aria-label="Canvas tools">
            <span className="sp-toolbar__group">
              <ToolButton icon="undo" label="Undo" showLabel={false} onClick={undo} disabled={!state.past.length} shortcut="Control+Z" />
              <ToolButton icon="redo" label="Redo" showLabel={false} onClick={redo} disabled={!state.future.length} shortcut="Control+Shift+Z" />
            </span>
            <Segmented
              className="sp-devices"
              label="Preview width"
              value={device}
              onChange={(v) => setDevice(v as Device)}
              options={(['desktop', 'tablet', 'mobile'] as const).map((d) => ({
                value: d,
                label: (
                  <span className="sp-device-opt">
                    <Icon name={d} size={15} />
                    <span>{cap(d)}</span>
                  </span>
                ),
              }))}
            />
            <MiniSelect label="Zoom" value={String(zoom)} onChange={(v) => setZoom(Number(v))} options={[50, 75, 90, 100, 125].map((z) => ({ label: `${z}%`, value: String(z) }))} />
            <Button
              size="sm"
              variant="secondary"
              className="sp-tb"
              aria-expanded={themeOpen}
              aria-controls="sp-theme-row"
              onClick={() => setThemeOpen((o) => !o)}
            >
              <span className="sp-swatch" data-accent={doc.theme.accent} aria-hidden="true" />
              <span className="sp-tb__text">Theme</span>
              <span className="pl-sr-only"> settings for the canvas</span>
              <span aria-hidden="true" className="sp-caret">▾</span>
            </Button>
            <span className="sp-toolbar__group">
              <ToolButton icon="rtl" label="RTL" pressed={doc.rtl} onClick={() => commitDoc({ ...doc, rtl: !doc.rtl }, 'rtl')} variant="secondary" />
              <ToolButton icon="eye" label="Preview" pressed={preview} onClick={() => setPreview((p) => !p)} variant="secondary" />
            </span>
          </div>
          {themeOpen && (
            <div className="sp-toolbar sp-toolbar--sub" id="sp-theme-row" role="group" aria-label="Canvas theme">
                <span className="sp-toolbar__group">
                  <MiniSelect label="Mode" value={doc.theme.mode} onChange={(v) => setTheme({ mode: v as SpaceDoc['theme']['mode'] })} options={[{ label: 'Site', value: 'page' }, { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }, { label: 'High contrast', value: 'hc' }]} />
                  <MiniSelect label="Accent" value={doc.theme.accent} onChange={(v) => setTheme({ accent: v as SpaceDoc['theme']['accent'] })} options={ACCENTS.map((a) => ({ label: cap(a), value: a }))} />
                  <MiniSelect label="Shape" value={doc.theme.shape} onChange={(v) => setTheme({ shape: v as SpaceDoc['theme']['shape'] })} options={['default', 'sharp', 'round'].map((s) => ({ label: cap(s), value: s }))} />
                  <MiniSelect label="Density" value={doc.theme.density} onChange={(v) => setTheme({ density: v as SpaceDoc['theme']['density'] })} options={[{ label: 'Comfortable', value: 'comfortable' }, { label: 'Compact', value: 'compact' }]} />
                </span>
              <span className="sp-help">Scoped to the canvas only; exported code carries the same data-theme attributes.</span>
            </div>
          )}
          <p id="sp-canvas-help" className="pl-sr-only">
            Arrow keys select components. Alt plus arrow keys move the selection. Control D duplicates, Delete removes, Enter edits properties.
          </p>
          <div className="sp-canvas-scroll" ref={canvasScrollRef}>
            <Canvas doc={doc} device={device} zoom={zoom} preview={preview} h={canvasHandlers} />
          </div>
        </section>

        <section className="sp-panel sp-panel--right" aria-labelledby="sp-inspector-title" data-open={sheet === 'inspect' || undefined} ref={inspectorRef}>
          <h2 id="sp-inspector-title" className="pl-sr-only">Inspector</h2>
          <div className="sp-sheet-head">
            <span>{selectedNode ? `Edit ${REGISTRY[selectedNode.type].label}` : 'Page settings'}</span>
            <Button variant="ghost" size="sm" iconOnly className="sp-sheet-close" aria-label="Close panel" onClick={() => setSheet(null)}>
              <Icon name="x" size={16} />
            </Button>
          </div>
          <Inspector
            doc={doc}
            selected={selected}
            onProp={setProp}
            onArrange={(a) => arrange(a, selected, 'canvas')}
            onDocName={(name) => commitDoc({ ...stateRef.current.doc, name }, 'doc-name')}
            onLang={(lang) => commitDoc({ ...stateRef.current.doc, lang, rtl: lang === 'ar' ? true : stateRef.current.doc.rtl })}
          />
        </section>
      </div>

      <nav className="sp-mobilebar" aria-label="Builder panels">
        <button
          type="button"
          aria-expanded={sheet === 'left' && leftTab === 'add'}
          onClick={() => {
            setLeftTab('add');
            setSheet((s) => (s === 'left' && leftTab === 'add' ? null : 'left'));
          }}
        >
          <Icon name="plus" /> Add
        </button>
        <button
          type="button"
          aria-expanded={sheet === 'left' && leftTab === 'layers'}
          onClick={() => {
            setLeftTab('layers');
            setSheet((s) => (s === 'left' && leftTab === 'layers' ? null : 'left'));
          }}
        >
          <Icon name="layers" /> Layers
        </button>
        <Button variant="ghost" size="sm" aria-expanded={sheet === 'inspect'} onClick={() => setSheet((s) => (s === 'inspect' ? null : 'inspect'))}>
          <Icon name="sliders" /> {selectedNode ? 'Edit' : 'Page'}
        </Button>
      </nav>

      {drag && (
        <div ref={ghostRef} className="sp-ghost" aria-hidden="true">
          <Icon name={drag.icon} size={16} /> {drag.label}
        </div>
      )}
      {drop && (
        <div
          className={`sp-drop${drop.box ? ' sp-drop--box' : ''}`}
          aria-hidden="true"
          style={{ left: drop.rect.left, top: drop.rect.top, width: drop.rect.width, height: drop.rect.height }}
        />
      )}

      <div className="pl-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {live.msg}
        {live.n % 2 ? '​' : ''}
      </div>

      <ExportDialog open={dialog === 'export'} doc={doc} onClose={() => setDialog(null)} />
      <TemplatesDialog
        open={dialog === 'templates'}
        onClose={() => setDialog(null)}
        onPick={(t) => {
          commitDoc(templateDoc(t));
          dispatch({ type: 'select', id: null });
          setDialog(null);
          announce(`Loaded the ${t.name} template.`);
        }}
      />
      <ShortcutsDialog open={dialog === 'shortcuts'} onClose={() => setDialog(null)} />
      {preview && <Toaster label="Preview notifications" position="bottom-center" richColors closeButton />}
      <div className="sp-notices" role="status" aria-live="polite">
        {notice && (
          <div key={notice.id} className="sp-notice" data-tone={notice.tone}>
            <Icon name={notice.tone === 'error' ? 'x' : notice.tone === 'info' ? 'sparkle' : 'check'} size={16} />
            <span>
              <strong>{notice.message}</strong>
              {notice.detail && <span className="sp-notice__detail">{notice.detail}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** The live canvas: real Pelagic UI components, wrapped in selectable, keyboard-operable node frames while editing. */
import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { applyTheme, Button, EmptyState } from '@pelagic-ui/react';
import { REGISTRY, nodeLabel, type RenderCtx } from './registry';
import { Icon } from './icons';
import type { SpaceDoc, SpaceNode } from './types';

export type Device = 'desktop' | 'tablet' | 'mobile';
export const DEVICE_WIDTH: Record<Device, number | null> = { desktop: null, tablet: 820, mobile: 390 };

export interface CanvasHandlers {
  selected: string | null;
  focusable: string | null;
  onSelect: (id: string) => void;
  onNodePointerDown: (e: PointerEvent<HTMLElement>, node: SpaceNode) => void;
  onNodeKeyDown: (e: KeyboardEvent<HTMLElement>, node: SpaceNode) => void;
  onAction: (action: 'up' | 'down' | 'duplicate' | 'delete', id: string) => void;
  onOpenTemplates: () => void;
  onFocusDescribe: () => void;
}

/** Sets `inert` on leaf content so the real component cannot be focused or clicked while editing. */
function InertBox({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.setAttribute('inert', '');
  }, []);
  return (
    <div ref={ref} className="sp-node__content">
      {children}
    </div>
  );
}

function axisOf(node: SpaceNode): 'x' | 'y' | 'grid' {
  if (node.type === 'grid') return 'grid';
  if (node.type === 'stack' && node.props.direction === 'row') return 'x';
  return 'y';
}

function NodeView({ node, parentId, index, h }: { node: SpaceNode; parentId: string | null; index: number; h: CanvasHandlers }) {
  const def = REGISTRY[node.type];
  const selected = h.selected === node.id;
  const ctx: RenderCtx = { editing: true };
  const label = nodeLabel(node);
  let body: ReactNode;
  if (def.container) {
    const kids = (node.children ?? []).map((c, i) => <NodeView key={c.id} node={c} parentId={node.id} index={i} h={h} />);
    if (!kids.length && node.type !== 'tabs') {
      kids.push(
        <div key="empty" className="sp-slot" data-empty-for={node.id}>
          Drop components here
        </div>,
      );
    }
    body = def.render(node, kids, ctx);
  } else {
    body = <InertBox>{def.render(node, [], ctx)}</InertBox>;
  }
  return (
    <div
      className={`sp-node${def.container ? ' sp-node--container' : ''}${selected ? ' is-selected' : ''} sp-node--${node.type}${node.type === 'button' || node.type === 'badge' || node.type === 'toast' || (node.type === 'avatar' && !node.props.showName) ? ' sp-node--inline' : ''}${node.props.block ? ' sp-node--block' : ''}`}
      data-node-id={node.id}
      data-node-type={node.type}
      data-parent-id={parentId ?? ''}
      data-index={index}
      data-container={def.container ? 'true' : undefined}
      data-axis={def.container ? axisOf(node) : undefined}
      role="group"
      aria-label={selected ? `${label} (selected)` : label}
      aria-describedby="sp-canvas-help"
      tabIndex={h.focusable === node.id ? 0 : -1}
      onPointerDown={(e) => h.onNodePointerDown(e, node)}
      onKeyDown={(e) => h.onNodeKeyDown(e, node)}
      onFocus={(e) => {
        if (e.target === e.currentTarget) h.onSelect(node.id);
      }}
    >
      {selected && (
        <div className="sp-node__bar" onPointerDown={(e) => e.stopPropagation()}>
          <span className="sp-node__grip" data-grip={node.id} aria-hidden="true" onPointerDown={(e) => h.onNodePointerDown(e, node)} title="Drag to move">
            <Icon name="grip" size={14} />
          </span>
          <span className="sp-node__tag">{def.label}</span>
          <button type="button" className="sp-node__btn" aria-label={`Move ${def.label} up`} onClick={() => h.onAction('up', node.id)}>
            <Icon name="up" size={14} />
          </button>
          <button type="button" className="sp-node__btn" aria-label={`Move ${def.label} down`} onClick={() => h.onAction('down', node.id)}>
            <Icon name="down" size={14} />
          </button>
          <button type="button" className="sp-node__btn" aria-label={`Duplicate ${def.label}`} onClick={() => h.onAction('duplicate', node.id)}>
            <Icon name="copy" size={14} />
          </button>
          <button type="button" className="sp-node__btn sp-node__btn--danger" aria-label={`Delete ${def.label}`} onClick={() => h.onAction('delete', node.id)}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      )}
      {body}
    </div>
  );
}

/** Interactive render with no builder chrome (Preview mode). */
function PreviewNode({ node }: { node: SpaceNode }) {
  const def = REGISTRY[node.type];
  const kids = (node.children ?? []).map((c) => <PreviewNode key={c.id} node={c} />);
  return <>{def.render(node, kids, { editing: false })}</>;
}

export function Canvas({
  doc,
  device,
  zoom,
  preview,
  h,
}: {
  doc: SpaceDoc;
  device: Device;
  zoom: number;
  preview: boolean;
  h: CanvasHandlers;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const { mode, accent, shape, density } = doc.theme;

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    applyTheme({ mode: mode === 'page' ? 'system' : mode, accent, shape }, el);
    if (density === 'compact') el.setAttribute('data-density', 'compact');
    else el.removeAttribute('data-density');
  }, [mode, accent, shape, density]);

  const width = DEVICE_WIDTH[device];
  return (
    <div className="sp-stage" data-device={device}>
      <div
        ref={frameRef}
        className={`sp-frame${preview ? ' is-preview' : ''}`}
        style={{ maxWidth: width ? `${width}px` : undefined, zoom: zoom / 100 }}
        dir={doc.rtl ? 'rtl' : 'ltr'}
        lang={doc.lang}
      >
        <div className="sp-frame__chrome" aria-hidden="true">
          <span />
          <span />
          <span />
          <em>{doc.name || 'Untitled page'}</em>
        </div>
        <div className="sp-root" data-sp-root="">
          {preview
            ? doc.nodes.map((n) => <PreviewNode key={n.id} node={n} />)
            : doc.nodes.map((n, i) => <NodeView key={n.id} node={n} parentId={null} index={i} h={h} />)}
          {!doc.nodes.length && (
            <div className="sp-empty" data-empty-for="">
              <EmptyState
                title="Start your page"
                description="Drag components here, pick a starter template, or describe what you need and let Space assemble it."
                icon="✦"
                headingLevel={2}
                primaryAction={<Button onClick={h.onOpenTemplates}>Browse templates</Button>}
                secondaryAction={
                  <Button variant="ghost" onClick={h.onFocusDescribe}>
                    Describe a page
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

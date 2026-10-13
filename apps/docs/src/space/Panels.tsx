/** Palette (add components), Layers (outline tree) and Inspector (props + arrange). */
import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button, Input, Select, Switch, Textarea } from '@pelagic-ui/react';
import { GROUPS, NODE_TYPES, REGISTRY, nodeLabel, type FieldDef } from './registry';
import { PALETTE_BLOCKS, type BlockDef } from './blocks';
import { Icon } from './icons';
import { flatten, locate } from './tree';
import type { SpaceDoc, SpaceNode, PropValue } from './types';

/* ---------------- Palette ---------------- */

export interface PaletteItem {
  key: string;
  label: string;
  icon: string;
  description: string;
  group: string;
  keywords: string;
}

export const PALETTE: PaletteItem[] = [
  ...PALETTE_BLOCKS.map((b: BlockDef) => ({ key: `block:${b.id}`, label: b.label, icon: b.icon, description: b.description, group: 'blocks', keywords: `${b.labelAr} ${b.id} section block` })),
  ...NODE_TYPES.map((t) => {
    const d = REGISTRY[t];
    return { key: `node:${t}`, label: d.label, icon: d.icon, description: d.description, group: d.group, keywords: `${t} ${d.keywords ?? ''}` };
  }),
];

export function Palette({
  onAdd,
  onPointerDown,
  shouldSuppressClick,
}: {
  onAdd: (item: PaletteItem) => void;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>, item: PaletteItem) => void;
  shouldSuppressClick: () => boolean;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const items = useMemo(
    () => (q ? PALETTE.filter((i) => `${i.label} ${i.description} ${i.keywords}`.toLowerCase().includes(q)) : PALETTE),
    [q],
  );
  const idBase = useId();
  return (
    <div className="sp-palette">
      <div className="sp-palette__search">
        <Input type="search" label="Search components" placeholder="Button, chart, pricing…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <p className="sp-help" id={`${idBase}-help`}>
        Drag onto the canvas, or press <kbd>Enter</kbd> to add after the selection.
      </p>
      <p className="pl-sr-only" role="status">
        {q ? `${items.length} components match` : ''}
      </p>
      {GROUPS.map((g) => {
        const list = items.filter((i) => i.group === g.id);
        if (!list.length) return null;
        return (
          <div key={g.id} className="sp-palette__group">
            <h3 className="sp-palette__heading" id={`${idBase}-${g.id}`}>
              {g.label}
            </h3>
            <ul className={`sp-palette__grid${g.id === 'blocks' ? ' sp-palette__grid--blocks' : ''}`} aria-labelledby={`${idBase}-${g.id}`}>
              {list.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="sp-tile"
                    data-palette={item.key}
                    aria-describedby={`${idBase}-help`}
                    onPointerDown={(e) => onPointerDown(e, item)}
                    onClick={() => {
                      if (!shouldSuppressClick()) onAdd(item);
                    }}
                  >
                    <span className="sp-tile__icon">
                      <Icon name={item.icon} />
                    </span>
                    <span className="sp-tile__text">
                      <span className="sp-tile__label">{item.label}</span>
                      {g.id === 'blocks' && <span className="sp-tile__desc">{item.description}</span>}
                    </span>
                    <span className="sp-tile__grip" data-grip="palette" aria-hidden="true">
                      <Icon name="grip" size={14} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {!items.length && <p className="sp-help">No components match “{query}”.</p>}
    </div>
  );
}

/* ---------------- Layers ---------------- */

export function Layers({
  doc,
  selected,
  onSelect,
  onKeyDown,
}: {
  doc: SpaceDoc;
  selected: string | null;
  onSelect: (id: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>, node: SpaceNode) => void;
}) {
  const flat = flatten(doc.nodes);
  const focusId = selected && flat.some((f) => f.node.id === selected) ? selected : flat[0]?.node.id;
  if (!flat.length) return <p className="sp-help">The page is empty. Add a component or a template to see its outline here.</p>;

  const renderLevel = (nodes: SpaceNode[], level: number) =>
    nodes.map((n, i) => {
      const def = REGISTRY[n.type];
      const isSel = selected === n.id;
      return (
        <li
          key={n.id}
          role="treeitem"
          aria-label={nodeLabel(n)}
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={i + 1}
          aria-selected={isSel}
          aria-expanded={def.container ? true : undefined}
          tabIndex={focusId === n.id ? 0 : -1}
          data-tree-id={n.id}
          className="sp-tree__item"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(n.id);
          }}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget) onKeyDown(e, n);
          }}
        >
          <span className="sp-tree__row" style={{ paddingInlineStart: `${0.5 + (level - 1) * 0.875}rem` }}>
            <Icon name={def.icon} size={15} />
            <span className="sp-tree__label">{nodeLabel(n)}</span>
          </span>
          {def.container && n.children && n.children.length > 0 && <ul role="group">{renderLevel(n.children, level + 1)}</ul>}
        </li>
      );
    });

  return (
    <div className="sp-layers">
      <p className="sp-help">
        <kbd>↑</kbd> <kbd>↓</kbd> select · <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> move · <kbd>Alt</kbd>+<kbd>→</kbd> into · <kbd>Alt</kbd>+<kbd>←</kbd> out
      </p>
      <ul role="tree" aria-label="Page outline" className="sp-tree">
        {renderLevel(doc.nodes, 1)}
      </ul>
    </div>
  );
}

/* ---------------- Inspector ---------------- */

function Field({ field, value, onChange }: { field: FieldDef; value: PropValue | undefined; onChange: (v: PropValue) => void }) {
  const v = value ?? '';
  switch (field.kind) {
    case 'boolean':
      return (
        <div className="sp-field-switch">
          <Switch checked={Boolean(value)} onChange={onChange} label={field.label} showLabel />
        </div>
      );
    case 'select':
      return <Select label={field.label} value={String(v)} options={field.options ?? []} onChange={(e) => onChange(/^\d+$/.test(e.target.value) && typeof value === 'number' ? Number(e.target.value) : e.target.value)} hint={field.hint} />;
    case 'number':
      return (
        <Input
          label={field.label}
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          value={String(v)}
          hint={field.hint}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (e.target.value === '' || Number.isNaN(n)) return;
            onChange(Math.min(field.max ?? Infinity, Math.max(field.min ?? -Infinity, n)));
          }}
        />
      );
    case 'textarea':
    case 'lines':
      return <Textarea label={field.label} value={String(v)} rows={field.kind === 'lines' ? 5 : 3} hint={field.hint} onChange={(e) => onChange(e.target.value)} spellCheck={field.kind !== 'lines'} />;
    default:
      return <Input label={field.label} value={String(v)} hint={field.hint} onChange={(e) => onChange(e.target.value)} />;
  }
}

export type ArrangeAction = 'up' | 'down' | 'indent' | 'outdent' | 'duplicate' | 'delete' | 'parent';

export function Inspector({
  doc,
  selected,
  onProp,
  onArrange,
  onDocName,
  onLang,
}: {
  doc: SpaceDoc;
  selected: string | null;
  onProp: (id: string, key: string, value: PropValue) => void;
  onArrange: (a: ArrangeAction) => void;
  onDocName: (name: string) => void;
  onLang: (lang: 'en' | 'ar') => void;
}) {
  const loc = selected ? locate(doc.nodes, selected) : null;
  if (!loc) {
    return (
      <div className="sp-inspector">
        <h3 className="sp-inspector__title">Page</h3>
        <Input label="Page name" value={doc.name} onChange={(e) => onDocName(e.target.value)} hint="Used for file names in code export" />
        <Select
          label="Content language"
          value={doc.lang}
          onChange={(e) => onLang(e.target.value === 'ar' ? 'ar' : 'en')}
          options={[
            { label: 'English', value: 'en' },
            { label: 'العربية (Arabic)', value: 'ar' },
          ]}
        />
        <div className="sp-tip">
          <strong>Tip</strong>
          <p>Select a component on the canvas or in Layers to edit its properties. Everything here is a real Pelagic UI component.</p>
        </div>
      </div>
    );
  }
  const { node } = loc;
  const def = REGISTRY[node.type];
  const siblings = loc.parentId ? locate(doc.nodes, loc.parentId)?.node.children ?? [] : doc.nodes;
  const prev = siblings[loc.index - 1];
  const canIndent = Boolean(prev && REGISTRY[prev.type].container);
  return (
    <div className="sp-inspector">
      <div className="sp-inspector__head">
        <span className="sp-inspector__icon">
          <Icon name={def.icon} />
        </span>
        <div>
          <h3 className="sp-inspector__title">{def.label}</h3>
          <p className="sp-inspector__sub">{def.description}</p>
        </div>
      </div>
      <div className="sp-inspector__fields">
        {def.fields.length === 0 && <p className="sp-help">No properties to edit.</p>}
        {def.fields.map((f) => (
          <Field key={`${node.id}-${f.key}`} field={f} value={node.props[f.key]} onChange={(v) => onProp(node.id, f.key, v)} />
        ))}
      </div>
      <h4 className="sp-inspector__section">Arrange</h4>
      <div className="sp-arrange" role="group" aria-label="Arrange selected component">
        <Button size="sm" variant="secondary" onClick={() => onArrange('up')} disabled={loc.index === 0} aria-keyshortcuts="Alt+ArrowUp">
          <Icon name="up" size={15} /> Up
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onArrange('down')} disabled={loc.index >= siblings.length - 1} aria-keyshortcuts="Alt+ArrowDown">
          <Icon name="down" size={15} /> Down
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onArrange('indent')} disabled={!canIndent} aria-keyshortcuts="Alt+ArrowRight">
          <Icon name="indent" size={15} /> Into previous
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onArrange('outdent')} disabled={!loc.parentId} aria-keyshortcuts="Alt+ArrowLeft">
          <Icon name="outdent" size={15} /> Out of parent
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onArrange('duplicate')} aria-keyshortcuts="Control+D">
          <Icon name="copy" size={15} /> Duplicate
        </Button>
        <Button size="sm" variant="danger" onClick={() => onArrange('delete')} aria-keyshortcuts="Delete">
          <Icon name="trash" size={15} /> Delete
        </Button>
      </div>
      {loc.parentId && (
        <button type="button" className="sp-linkbtn" onClick={() => onArrange('parent')}>
          Select parent ({nodeLabel(locate(doc.nodes, loc.parentId)!.node)})
        </button>
      )}
    </div>
  );
}

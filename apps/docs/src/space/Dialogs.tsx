/** Modal dialogs: code export, starter templates and keyboard shortcuts. */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Alert, Button, Tabs } from '@orca-ui/react';
import { notify } from './notify';
import { lockScroll, trapFocus } from '@orca-ui/core/a11y';
import { exportCode, TARGETS, type Target } from './exporters';
import { TEMPLATES, type Template } from './templates';
import { Icon } from './icons';
import type { SpaceDoc } from './types';

/**
 * Modal built on Orca's dialog classes and focus helpers. (Same behavior as the library Dialog: Escape closes,
 * focus is trapped and restored, the page does not scroll.) Its title bar is a plain div so the portal
 * does not add a second banner landmark to the page.
 */
function Dialog({ open, title, onClose, size = 'md', className, children }: { open: boolean; title: string; onClose: () => void; size?: 'md' | 'lg'; className?: string; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.focus();
    const releaseFocus = trapFocus(panel);
    const releaseScroll = lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      releaseFocus();
      releaseScroll();
      previous?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="oc-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`oc-dialog${size === 'lg' ? ' oc-dialog--lg' : ''} ${className ?? ''}`}>
        <div className="oc-dialog__header">
          <h2 id={titleId} className="oc-dialog__title">
            {title}
          </h2>
          <button type="button" className="oc-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="oc-dialog__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadFile(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CodePanel({ doc, target }: { doc: SpaceDoc; target: Target }) {
  const result = useMemo(() => exportCode(doc, target), [doc, target]);
  const info = TARGETS.find((t) => t.id === target)!;
  return (
    <div className="sp-code">
      <div className="sp-code__bar">
        <code className="sp-code__file">{result.filename}</code>
        <span className="sp-code__actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              const ok = await copyText(result.code);
              if (ok) notify(`${info.label} code copied`);
              else notify('Copy failed — select the code and copy it manually', 'error');
            }}
          >
            <Icon name="copy" size={15} /> Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={() => downloadFile(result.filename, result.code)}>
            <Icon name="download" size={15} /> Download
          </Button>
        </span>
      </div>
      {result.notes.length > 0 && (
        <Alert variant="info" title="Notes">
          <ul className="sp-code__notes">
            {result.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Alert>
      )}
      <pre className="sp-code__pre" tabIndex={0} aria-label={`${info.label} code`}>
        <code>{result.code}</code>
      </pre>
    </div>
  );
}

export function ExportDialog({ open, doc, onClose }: { open: boolean; doc: SpaceDoc; onClose: () => void }) {
  const [target, setTarget] = useState<Target>('react');
  return (
    <Dialog open={open} onClose={onClose} title="Export code" size="lg" className="sp-dialog sp-dialog--code">
      <p className="sp-help">
        Clean, dependency-light code for the page you composed. Install with <code>npm i @orca-ui/core</code> plus your framework package.
      </p>
      {open && (
        <Tabs
          value={target}
          onChange={(k) => setTarget(k as Target)}
          tabs={TARGETS.map((t) => ({ key: t.id, label: t.label, content: <CodePanel doc={doc} target={t.id} /> }))}
        />
      )}
    </Dialog>
  );
}

function Thumb({ t }: { t: Template }) {
  return (
    <span className="sp-thumb" aria-hidden="true">
      {t.outline.map((o, i) => (
        <span key={i} className={`sp-thumb__${o}`}>
          {o.startsWith('cols') && Array.from({ length: Number(o.slice(4)) }, (_, k) => <i key={k} />)}
        </span>
      ))}
    </span>
  );
}

export function TemplatesDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (t: Template) => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Starter templates" size="lg" className="sp-dialog">
      <p className="sp-help">Picking a template replaces the canvas. You can undo it.</p>
      <ul className="sp-templates">
        {TEMPLATES.map((t) => (
          <li key={t.id}>
            <button type="button" className="sp-template" onClick={() => onPick(t)}>
              <Thumb t={t} />
              <span className="sp-template__name">
                <Icon name={t.icon} size={16} /> {t.name}
              </span>
              <span className="sp-template__desc">{t.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

const SHORTCUTS: Array<[string, string]> = [
  ['Tab / Shift+Tab', 'Move between panels and controls'],
  ['↑ / ↓ (canvas or layers)', 'Select previous / next component'],
  ['Alt+↑ / Alt+↓', 'Move the selected component up / down'],
  ['Alt+→', 'Move into the previous container'],
  ['Alt+←', 'Move out of its container'],
  ['Ctrl+D', 'Duplicate'],
  ['Delete / Backspace', 'Delete'],
  ['Escape', 'Select the parent'],
  ['Enter', 'Edit properties in the inspector'],
  ['Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y', 'Undo / redo'],
  ['Enter on a palette item', 'Add it after the selection (or inside a selected container)'],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" size="md" className="sp-dialog">
      <p className="sp-help">Every drag and drop action has a keyboard or button alternative.</p>
      <table className="oc-table sp-keys">
        <caption className="oc-sr-only">Keyboard shortcuts</caption>
        <thead>
          <tr>
            <th scope="col">Keys</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {SHORTCUTS.map(([k, a]) => (
            <tr key={k}>
              <th scope="row">
                <kbd>{k}</kbd>
              </th>
              <td>{a}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

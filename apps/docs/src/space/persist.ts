/** Save/load (localStorage), share links (compressed JSON in the URL hash) and JSON import validation. */
import { REGISTRY } from './registry';
import { newId } from './tree';
import { ACCENTS, DEFAULT_THEME, MODES, SHAPES, type SpaceDoc, type SpaceNode } from './types';

const SAVE_KEY = 'pelagic-space:saved';
const DRAFT_KEY = 'pelagic-space:draft';

export function saveDoc(doc: SpaceDoc, draft = false): boolean {
  try {
    localStorage.setItem(draft ? DRAFT_KEY : SAVE_KEY, JSON.stringify(doc));
    return true;
  } catch {
    return false;
  }
}

export function loadDoc(draft = false): SpaceDoc | null {
  try {
    const raw = localStorage.getItem(draft ? DRAFT_KEY : SAVE_KEY);
    return raw ? sanitizeDoc(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const MAX_NODES = 2000;

/** Accept only known node types and primitive props; anything else is dropped. Returns null if unusable. */
export function sanitizeDoc(raw: unknown): SpaceDoc | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  let count = 0;
  const clean = (list: unknown, depth: number): SpaceNode[] => {
    if (!Array.isArray(list) || depth > 24) return [];
    const out: SpaceNode[] = [];
    for (const item of list) {
      if (!item || typeof item !== 'object' || ++count > MAX_NODES) continue;
      const it = item as Record<string, unknown>;
      const def = REGISTRY[it.type as keyof typeof REGISTRY];
      if (!def) continue;
      const props: SpaceNode['props'] = { ...def.defaults };
      if (it.props && typeof it.props === 'object') {
        for (const [k, v] of Object.entries(it.props as Record<string, unknown>)) {
          if (!(k in def.defaults)) continue;
          if (typeof v === 'string') props[k] = v.slice(0, 5000);
          else if (typeof v === 'number' && Number.isFinite(v)) props[k] = v;
          else if (typeof v === 'boolean') props[k] = v;
        }
      }
      const id = typeof it.id === 'string' && /^[\w-]{1,40}$/.test(it.id) ? it.id : newId();
      out.push({ id, type: def.type, props, ...(def.container ? { children: clean(it.children, depth + 1) } : {}) });
    }
    return out;
  };
  const theme = (r.theme && typeof r.theme === 'object' ? r.theme : {}) as Record<string, unknown>;
  const doc: SpaceDoc = {
    version: 1,
    name: typeof r.name === 'string' ? r.name.slice(0, 120) : 'Imported page',
    theme: {
      mode: MODES.includes(theme.mode as never) ? (theme.mode as SpaceDoc['theme']['mode']) : DEFAULT_THEME.mode,
      accent: ACCENTS.includes(theme.accent as never) ? (theme.accent as SpaceDoc['theme']['accent']) : DEFAULT_THEME.accent,
      shape: SHAPES.includes(theme.shape as never) ? (theme.shape as SpaceDoc['theme']['shape']) : DEFAULT_THEME.shape,
      density: theme.density === 'compact' ? 'compact' : 'comfortable',
    },
    rtl: r.rtl === true,
    lang: r.lang === 'ar' ? 'ar' : 'en',
    nodes: clean(r.nodes, 0),
  };
  // Ids must be unique for selection and drag and drop.
  const seen = new Set<string>();
  const fix = (nodes: SpaceNode[]) =>
    nodes.forEach((n) => {
      if (seen.has(n.id)) n.id = newId();
      seen.add(n.id);
      if (n.children) fix(n.children);
    });
  fix(doc.nodes);
  return doc;
}

/* ---------------- Share links ---------------- */

function toB64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Strip default props and ids to keep links short. */
function compact(nodes: SpaceNode[]): unknown[] {
  return nodes.map((n) => {
    const defaults = REGISTRY[n.type].defaults;
    const props = Object.fromEntries(Object.entries(n.props).filter(([k, v]) => defaults[k] !== v));
    return { type: n.type, ...(Object.keys(props).length ? { props } : {}), ...(n.children ? { children: compact(n.children) } : {}) };
  });
}

export async function encodeShare(doc: SpaceDoc): Promise<string> {
  const json = JSON.stringify({ ...doc, nodes: compact(doc.nodes) });
  const bytes = new TextEncoder().encode(json);
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const buf = new Uint8Array(await new Response(stream).arrayBuffer());
      return `z.${toB64Url(buf)}`;
    } catch {
      /* fall through to plain encoding */
    }
  }
  return `j.${toB64Url(bytes)}`;
}

export async function decodeShare(token: string): Promise<SpaceDoc | null> {
  try {
    const [kind, data] = [token.slice(0, 1), token.slice(2)];
    let bytes = fromB64Url(data);
    if (kind === 'z') {
      if (typeof DecompressionStream === 'undefined') return null;
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else if (kind !== 'j') return null;
    return sanitizeDoc(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export const SHARE_PARAM = 'space=';

export function readShareToken(): string | null {
  const hash = window.location.hash.slice(1);
  return hash.startsWith(SHARE_PARAM) ? hash.slice(SHARE_PARAM.length) : null;
}

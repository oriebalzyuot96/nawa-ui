/** Document state with undo/redo history. Rapid edits to the same field are coalesced into one step. */
import type { SpaceDoc } from './types';

export interface State {
  past: SpaceDoc[];
  doc: SpaceDoc;
  future: SpaceDoc[];
  selected: string | null;
  lastKey: string | null;
  lastAt: number;
}

export type Action =
  | { type: 'commit'; doc: SpaceDoc; select?: string | null; key?: string }
  | { type: 'replace'; doc: SpaceDoc; select?: string | null }
  | { type: 'select'; id: string | null }
  | { type: 'undo' }
  | { type: 'redo' };

const LIMIT = 100;
const COALESCE_MS = 1200;

export function initState(doc: SpaceDoc): State {
  return { past: [], doc, future: [], selected: null, lastKey: null, lastAt: 0 };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'commit': {
      if (action.doc === state.doc) return state;
      const now = Date.now();
      const coalesce = Boolean(action.key) && action.key === state.lastKey && now - state.lastAt < COALESCE_MS;
      return {
        past: coalesce ? state.past : [...state.past, state.doc].slice(-LIMIT),
        doc: action.doc,
        future: [],
        selected: action.select !== undefined ? action.select : state.selected,
        lastKey: action.key ?? null,
        lastAt: now,
      };
    }
    case 'replace':
      return { ...initState(action.doc), selected: action.select ?? null };
    case 'select':
      return state.selected === action.id ? state : { ...state, selected: action.id, lastKey: null };
    case 'undo': {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { ...state, past: state.past.slice(0, -1), doc: prev, future: [state.doc, ...state.future], lastKey: null };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { ...state, past: [...state.past, state.doc], doc: next, future: rest, lastKey: null };
    }
    default:
      return state;
  }
}

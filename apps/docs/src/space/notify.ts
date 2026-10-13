/** Builder notifications (save, share, copy). A tiny event bus so any part of the builder can report status. */
export type NoticeTone = 'success' | 'info' | 'error';
export interface Notice {
  id: number;
  message: string;
  detail?: string;
  tone: NoticeTone;
}

const EVENT = 'pelagic-space:notice';
let seq = 0;

export function notify(message: string, tone: NoticeTone = 'success', detail?: string) {
  window.dispatchEvent(new CustomEvent<Notice>(EVENT, { detail: { id: ++seq, message, tone, detail } }));
}

export function onNotice(fn: (n: Notice) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<Notice>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

let uid = 0;

/** Unique DOM id for label/aria wiring. */
export function nextId(prefix = 'oc'): string {
  uid += 1;
  return `${prefix}-${uid}`;
}

export type PageItem = number | 'ellipsis';

/** Compact page list for pagination: 1 … 4 5 6 … 10 (1-based). */
export function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) items.push('ellipsis');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pageCount - 1) items.push('ellipsis');
  items.push(pageCount);
  return items;
}

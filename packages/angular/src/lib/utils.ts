/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
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

let nextId = 0;

/** Unique DOM id for label/description wiring. */
export function plId(prefix = 'pl'): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

/** Numbers become pixels; strings pass through (React-style sizes). */
export function toCssSize(value: number | string | undefined | null): string | null {
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'number' ? `${value}px` : value;
}

/** Initials for an avatar without an image. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export type Variant = 'info' | 'success' | 'warning' | 'danger';

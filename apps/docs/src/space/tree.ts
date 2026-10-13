/** Immutable tree helpers for the Space document. A `null` parent id means the page root. */
import type { SpaceNode } from './types';

let seq = 0;
export function newId(): string {
  seq = (seq + 1) % 1e6;
  return `n${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}${seq.toString(36)}`;
}

/** Deep copy with fresh ids (for duplicate, palette inserts and templates). */
export function cloneFresh(node: SpaceNode): SpaceNode {
  return {
    id: newId(),
    type: node.type,
    props: { ...node.props },
    ...(node.children ? { children: node.children.map(cloneFresh) } : {}),
  };
}

export interface Located {
  node: SpaceNode;
  parentId: string | null;
  index: number;
  depth: number;
}

export function locate(nodes: SpaceNode[], id: string, parentId: string | null = null, depth = 0): Located | null {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.id === id) return { node: n, parentId, index: i, depth };
    if (n.children) {
      const found = locate(n.children, id, n.id, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export function findNode(nodes: SpaceNode[], id: string | null): SpaceNode | null {
  if (!id) return null;
  return locate(nodes, id)?.node ?? null;
}

/** Depth-first list (document order). */
export function flatten(nodes: SpaceNode[], depth = 0, parentId: string | null = null, out: Located[] = []): Located[] {
  nodes.forEach((node, index) => {
    out.push({ node, parentId, index, depth });
    if (node.children) flatten(node.children, depth + 1, node.id, out);
  });
  return out;
}

export function isAncestor(nodes: SpaceNode[], ancestorId: string, id: string): boolean {
  const anc = findNode(nodes, ancestorId);
  if (!anc?.children) return false;
  return flatten(anc.children).some((l) => l.node.id === id);
}

export function childrenOf(nodes: SpaceNode[], parentId: string | null): SpaceNode[] {
  if (parentId === null) return nodes;
  return findNode(nodes, parentId)?.children ?? [];
}

function mapChildren(nodes: SpaceNode[], parentId: string | null, fn: (children: SpaceNode[]) => SpaceNode[]): SpaceNode[] {
  if (parentId === null) return fn(nodes);
  return nodes.map((n) => {
    if (n.id === parentId) return { ...n, children: fn(n.children ?? []) };
    if (n.children) return { ...n, children: mapChildren(n.children, parentId, fn) };
    return n;
  });
}

export function insertNodes(nodes: SpaceNode[], parentId: string | null, index: number, items: SpaceNode[]): SpaceNode[] {
  return mapChildren(nodes, parentId, (children) => {
    const at = Math.max(0, Math.min(index, children.length));
    return [...children.slice(0, at), ...items, ...children.slice(at)];
  });
}

export function removeNode(nodes: SpaceNode[], id: string): SpaceNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, id) } : n));
}

export function updateNode(nodes: SpaceNode[], id: string, fn: (n: SpaceNode) => SpaceNode): SpaceNode[] {
  return nodes.map((n) => {
    if (n.id === id) return fn(n);
    if (n.children) return { ...n, children: updateNode(n.children, id, fn) };
    return n;
  });
}

/**
 * Move `id` so it ends up at `index` in `parentId`'s children (index counted before removal).
 * Returns the original array when the move is impossible (into itself or a descendant).
 */
export function moveNode(nodes: SpaceNode[], id: string, parentId: string | null, index: number): SpaceNode[] {
  const from = locate(nodes, id);
  if (!from) return nodes;
  if (parentId === id || (parentId && isAncestor(nodes, id, parentId))) return nodes;
  let target = index;
  if (from.parentId === parentId && from.index < index) target -= 1;
  const without = removeNode(nodes, id);
  return insertNodes(without, parentId, target, [from.node]);
}

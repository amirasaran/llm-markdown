import type { AnyNode, RootNode } from './ast';

export type Patch =
  | { op: 'replace'; path: number[]; node: AnyNode }
  | { op: 'insert'; path: number[]; node: AnyNode }
  | { op: 'remove'; path: number[] };

/**
 * Lightweight AST diff. Currently used mostly for debugging / telemetry;
 * actual render optimization happens via stable node ids + React.memo.
 */
export function diffTrees(prev: RootNode | undefined, next: RootNode): Patch[] {
  const patches: Patch[] = [];
  walk(prev, next, [], patches);
  return patches;
}

function walk(a: AnyNode | undefined, b: AnyNode, path: number[], out: Patch[]): void {
  if (!a) {
    out.push({ op: 'insert', path, node: b });
    return;
  }
  if (a.id === b.id) return;
  if (a.type !== b.type) {
    out.push({ op: 'replace', path, node: b });
    return;
  }
  if ('children' in a && 'children' in b && Array.isArray(a.children) && Array.isArray(b.children)) {
    const aKids = a.children as AnyNode[];
    const bKids = b.children as AnyNode[];
    const max = Math.max(aKids.length, bKids.length);
    for (let i = 0; i < max; i++) {
      const ac = aKids[i];
      const bc = bKids[i];
      if (!bc) out.push({ op: 'remove', path: [...path, i] });
      else walk(ac, bc, [...path, i], out);
    }
    return;
  }
  out.push({ op: 'replace', path, node: b });
}

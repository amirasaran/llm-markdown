import type { AnyNode, RootNode, Direction } from '../parser/ast';

/**
 * First-strong-character direction detection (a simplified form of the Unicode
 * Bidi Algorithm rule P2). We scan the plain-text content of a node and return
 * the direction of the first strong directional character we encounter.
 *
 * Strong RTL ranges covered:
 *   Hebrew      U+0590–U+05FF
 *   Arabic      U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF
 *   Syriac      U+0700–U+074F
 *   Thaana      U+0780–U+07BF
 *   NKo         U+07C0–U+07FF
 *   Arabic supp U+FB1D–U+FDFF, U+FE70–U+FEFF
 */
const RTL_RANGES: Array<[number, number]> = [
  [0x0590, 0x05ff],
  [0x0600, 0x06ff],
  [0x0700, 0x074f],
  [0x0750, 0x077f],
  [0x0780, 0x07bf],
  [0x07c0, 0x07ff],
  [0x08a0, 0x08ff],
  [0xfb1d, 0xfdff],
  [0xfe70, 0xfeff],
];

const LTR_RANGES: Array<[number, number]> = [
  [0x0041, 0x005a],
  [0x0061, 0x007a],
  [0x00c0, 0x02af],
  [0x0370, 0x04ff],
  [0x1e00, 0x1eff],
  [0x2c60, 0x2c7f],
  [0x4e00, 0x9fff], // CJK
  [0xac00, 0xd7af], // Hangul
  [0x3040, 0x30ff], // Japanese kana
];

function inRanges(code: number, ranges: Array<[number, number]>): boolean {
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i]!;
    if (code >= range[0] && code <= range[1]) return true;
  }
  return false;
}

export function directionOf(text: string): Direction | null {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (inRanges(code, RTL_RANGES)) return 'rtl';
    if (inRanges(code, LTR_RANGES)) return 'ltr';
  }
  return null;
}

function collectText(node: AnyNode, out: { s: string }, budget = 256): void {
  if (out.s.length >= budget) return;
  if ('value' in node && typeof node.value === 'string') {
    out.s += node.value;
    return;
  }
  if ('children' in node && Array.isArray(node.children)) {
    for (const c of node.children as AnyNode[]) {
      collectText(c, out, budget);
      if (out.s.length >= budget) return;
    }
  }
}

/** Walks the tree and tags each block-level node with its detected direction. */
export function annotateDirection(
  tree: RootNode,
  fallback: Direction = 'ltr'
): RootNode {
  const visit = (node: AnyNode): void => {
    if (isBlockLevel(node.type)) {
      const bag = { s: '' };
      collectText(node, bag);
      node.dir = directionOf(bag.s) ?? fallback;
    }
    if ('children' in node && Array.isArray(node.children)) {
      for (const c of node.children as AnyNode[]) visit(c);
    }
  };
  visit(tree);
  return tree;
}

function isBlockLevel(type: string): boolean {
  return (
    type === 'paragraph' ||
    type === 'heading' ||
    type === 'blockquote' ||
    type === 'listItem' ||
    type === 'tableCell' ||
    type === 'code'
  );
}

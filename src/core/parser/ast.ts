export type NodeType =
  | 'root'
  | 'paragraph'
  | 'heading'
  | 'text'
  | 'strong'
  | 'emphasis'
  | 'delete'
  | 'inlineCode'
  | 'code'
  | 'blockquote'
  | 'list'
  | 'listItem'
  | 'link'
  | 'image'
  | 'thematicBreak'
  | 'table'
  | 'tableRow'
  | 'tableCell'
  | 'html'
  | 'break'
  | 'directive';

export type Direction = 'ltr' | 'rtl';

export interface BaseNode {
  /** Stable id derived from position + content hash. Re-used across re-parses when unchanged. */
  id: string;
  type: NodeType;
  /** True while this node is still being streamed (not yet closed). */
  streaming?: boolean;
  /** Direction tagged by bidi pass for block-level nodes. */
  dir?: Direction;
}

export interface RootNode extends BaseNode {
  type: 'root';
  children: BlockNode[];
}

export interface ParagraphNode extends BaseNode {
  type: 'paragraph';
  children: InlineNode[];
}

export interface HeadingNode extends BaseNode {
  type: 'heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: InlineNode[];
}

export interface TextNode extends BaseNode {
  type: 'text';
  value: string;
}

export interface StrongNode extends BaseNode {
  type: 'strong';
  children: InlineNode[];
}

export interface EmphasisNode extends BaseNode {
  type: 'emphasis';
  children: InlineNode[];
}

export interface DeleteNode extends BaseNode {
  type: 'delete';
  children: InlineNode[];
}

export interface InlineCodeNode extends BaseNode {
  type: 'inlineCode';
  value: string;
}

export interface CodeNode extends BaseNode {
  type: 'code';
  lang?: string;
  meta?: string;
  value: string;
}

export interface BlockquoteNode extends BaseNode {
  type: 'blockquote';
  children: BlockNode[];
}

export interface ListNode extends BaseNode {
  type: 'list';
  ordered: boolean;
  start?: number;
  children: ListItemNode[];
}

export interface ListItemNode extends BaseNode {
  type: 'listItem';
  checked?: boolean | null;
  children: BlockNode[];
}

export interface LinkNode extends BaseNode {
  type: 'link';
  url: string;
  title?: string;
  children: InlineNode[];
}

export interface ImageNode extends BaseNode {
  type: 'image';
  url: string;
  title?: string;
  alt: string;
}

export interface ThematicBreakNode extends BaseNode {
  type: 'thematicBreak';
}

export interface TableNode extends BaseNode {
  type: 'table';
  align: Array<'left' | 'center' | 'right' | null>;
  children: TableRowNode[];
}

export interface TableRowNode extends BaseNode {
  type: 'tableRow';
  children: TableCellNode[];
}

export interface TableCellNode extends BaseNode {
  type: 'tableCell';
  header?: boolean;
  children: InlineNode[];
}

export interface HtmlNode extends BaseNode {
  type: 'html';
  value: string;
}

export interface BreakNode extends BaseNode {
  type: 'break';
}

export interface DirectiveNode extends BaseNode {
  type: 'directive';
  name: string;
  inline: boolean;
  attributes: Record<string, string | number | boolean>;
  /** Raw body when the directive carries opaque content (e.g. chart JSON). */
  value?: string;
  /** Parsed markdown body when the directive wraps prose (e.g. callouts). */
  children?: Array<BlockNode | InlineNode>;
}

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | CodeNode
  | BlockquoteNode
  | ListNode
  | ThematicBreakNode
  | TableNode
  | HtmlNode
  | DirectiveNode;

export type InlineNode =
  | TextNode
  | StrongNode
  | EmphasisNode
  | DeleteNode
  | InlineCodeNode
  | LinkNode
  | ImageNode
  | BreakNode
  | DirectiveNode;

export type AnyNode = RootNode | BlockNode | InlineNode | ListItemNode | TableRowNode | TableCellNode;

/** Fast 32-bit FNV-1a, used to produce stable ids from a node's content. */
export function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function nodeSignature(node: AnyNode): string {
  if ('value' in node && typeof node.value === 'string') {
    return `${node.type}:${node.value}`;
  }
  if ('children' in node && Array.isArray(node.children)) {
    return `${node.type}:${(node.children as AnyNode[]).map(nodeSignature).join('|')}`;
  }
  return node.type;
}

export function assignIds(root: RootNode): RootNode {
  const walk = (node: AnyNode, path: string) => {
    node.id = `${path}:${hashString(nodeSignature(node))}`;
    if ('children' in node && Array.isArray(node.children)) {
      (node.children as AnyNode[]).forEach((child, i) => walk(child, `${path}/${i}`));
    }
  };
  walk(root, 'r');
  return root;
}

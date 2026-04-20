import type {
  RootNode,
  BlockNode,
  InlineNode,
  ParagraphNode,
  HeadingNode,
  CodeNode,
  ListNode,
  ListItemNode,
  BlockquoteNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  DirectiveNode,
  TextNode,
} from './ast';
import {
  BLOCK_DIRECTIVE_OPEN,
  BLOCK_DIRECTIVE_CLOSE,
  INLINE_DIRECTIVE,
  isOpaqueDirective,
  parseAttributes,
} from './directives';

export interface ParseOptions {
  /** When true, the last block may be kept open (streaming) if its closing token hasn't arrived. */
  streaming?: boolean;
}

interface LineCursor {
  lines: string[];
  i: number;
}

const FENCED_CODE_OPEN = /^(\s{0,3})(`{3,}|~{3,})\s*([^\s`]*)\s*(.*)$/;
const HEADING_ATX = /^(\s{0,3})(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/;
const HR_RE = /^(\s{0,3})([-*_])(?:\s*\2){2,}\s*$/;
const BLOCKQUOTE_RE = /^(\s{0,3})>\s?(.*)$/;
const UL_RE = /^(\s{0,3})([-*+])\s+(.*)$/;
const OL_RE = /^(\s{0,3})(\d{1,9})([.)])\s+(.*)$/;
const TABLE_ALIGN_RE = /^\s*:?-{2,}:?\s*$/;

export function parseMarkdown(source: string, options: ParseOptions = {}): RootNode {
  const normalized = source.replace(/\r\n?/g, '\n');
  const cursor: LineCursor = { lines: normalized.split('\n'), i: 0 };
  const children: BlockNode[] = [];
  while (cursor.i < cursor.lines.length) {
    const block = parseBlock(cursor, options);
    if (block) children.push(block);
    else cursor.i++;
  }
  return { id: '', type: 'root', children };
}

function peek(c: LineCursor, offset = 0): string | undefined {
  return c.lines[c.i + offset];
}

function parseBlock(c: LineCursor, opts: ParseOptions): BlockNode | null {
  const line = peek(c);
  if (line === undefined) return null;
  if (line.trim() === '') return null;

  // Block directive
  const dirOpen = line.match(BLOCK_DIRECTIVE_OPEN);
  if (dirOpen) return parseBlockDirective(c, opts);

  // Fenced code block
  const fence = line.match(FENCED_CODE_OPEN);
  if (fence) return parseFencedCode(c, opts);

  // ATX heading
  const h = line.match(HEADING_ATX);
  if (h) {
    c.i++;
    const depth = h[2]!.length as 1 | 2 | 3 | 4 | 5 | 6;
    const rawText = h[3] ?? '';
    return {
      id: '',
      type: 'heading',
      depth,
      children: parseInline(rawText),
    } as HeadingNode;
  }

  // Thematic break
  if (HR_RE.test(line)) {
    c.i++;
    return { id: '', type: 'thematicBreak' };
  }

  // Blockquote
  if (BLOCKQUOTE_RE.test(line)) return parseBlockquote(c, opts);

  // Lists
  if (UL_RE.test(line) || OL_RE.test(line)) return parseList(c, opts);

  // Table
  const maybeTable = tryParseTable(c);
  if (maybeTable) return maybeTable;

  // Paragraph
  return parseParagraph(c, opts);
}

function parseBlockDirective(c: LineCursor, opts: ParseOptions): DirectiveNode {
  const opener = peek(c)!.match(BLOCK_DIRECTIVE_OPEN)!;
  const name = opener[1]!;
  const attrs = opener[2] ? parseAttributes(opener[2]) : {};
  c.i++;
  const bodyLines: string[] = [];
  let closed = false;
  while (c.i < c.lines.length) {
    const l = c.lines[c.i]!;
    if (BLOCK_DIRECTIVE_CLOSE.test(l)) {
      c.i++;
      closed = true;
      break;
    }
    bodyLines.push(l);
    c.i++;
  }
  const raw = bodyLines.join('\n');
  const streaming = !closed && !!opts.streaming;
  if (isOpaqueDirective(name)) {
    return {
      id: '',
      type: 'directive',
      name,
      inline: false,
      attributes: attrs,
      value: raw,
      streaming,
    };
  }
  const parsed = parseMarkdown(raw, opts);
  return {
    id: '',
    type: 'directive',
    name,
    inline: false,
    attributes: attrs,
    children: parsed.children,
    streaming,
  };
}

function parseFencedCode(c: LineCursor, opts: ParseOptions): CodeNode {
  const m = peek(c)!.match(FENCED_CODE_OPEN)!;
  const fence = m[2]!;
  const lang = m[3] || undefined;
  const meta = m[4] || undefined;
  c.i++;
  const body: string[] = [];
  let closed = false;
  while (c.i < c.lines.length) {
    const l = c.lines[c.i]!;
    if (l.trim().startsWith(fence[0]!) && new RegExp(`^\\s{0,3}${fence[0]}{${fence.length},}\\s*$`).test(l)) {
      c.i++;
      closed = true;
      break;
    }
    body.push(l);
    c.i++;
  }
  const node: CodeNode = {
    id: '',
    type: 'code',
    value: body.join('\n'),
  };
  if (lang) node.lang = lang;
  if (meta) node.meta = meta;
  if (!closed && opts.streaming) node.streaming = true;
  return node;
}

function parseBlockquote(c: LineCursor, opts: ParseOptions): BlockquoteNode {
  const lines: string[] = [];
  while (c.i < c.lines.length) {
    const l = c.lines[c.i]!;
    const m = l.match(BLOCKQUOTE_RE);
    if (!m) {
      // A blank line ends a blockquote
      if (l.trim() === '') break;
      // Lazy continuation: a non-blank, non-quoted line continues the quote
      lines.push(l);
      c.i++;
      continue;
    }
    lines.push(m[2] ?? '');
    c.i++;
  }
  const inner = parseMarkdown(lines.join('\n'), opts);
  return { id: '', type: 'blockquote', children: inner.children };
}

function parseList(c: LineCursor, opts: ParseOptions): ListNode {
  const first = peek(c)!;
  const ulMatch = first.match(UL_RE);
  const olMatch = first.match(OL_RE);
  const ordered = !!olMatch;
  const startNum = olMatch ? parseInt(olMatch[2]!, 10) : undefined;
  const items: ListItemNode[] = [];

  while (c.i < c.lines.length) {
    const l = c.lines[c.i]!;
    const ul = !ordered ? l.match(UL_RE) : null;
    const ol = ordered ? l.match(OL_RE) : null;
    if (!ul && !ol) break;
    const [rest, indent] = ul
      ? [ul[3]!, (ul[1]?.length ?? 0) + 2]
      : [ol![4]!, (ol![1]?.length ?? 0) + (ol![2]!.length + 2)];
    c.i++;
    const itemLines: string[] = [rest];
    // continuation: subsequent lines indented by at least `indent` or blank
    while (c.i < c.lines.length) {
      const cont = c.lines[c.i]!;
      if (cont.trim() === '') {
        // blank line; peek next to decide
        const next = c.lines[c.i + 1];
        if (next === undefined) break;
        if (next.match(UL_RE) || next.match(OL_RE)) break;
        if (next.length >= indent && next.slice(0, indent).trim() === '') {
          itemLines.push('');
          c.i++;
          continue;
        }
        break;
      }
      if (cont.match(UL_RE) || cont.match(OL_RE)) break;
      if (cont.length >= indent && cont.slice(0, indent).trim() === '') {
        itemLines.push(cont.slice(indent));
        c.i++;
        continue;
      }
      // Lazy continuation for paragraph text
      itemLines.push(cont);
      c.i++;
    }
    let checked: boolean | null | undefined;
    let body = itemLines.join('\n');
    const task = body.match(/^\s*\[( |x|X)\]\s+/);
    if (task) {
      checked = task[1] !== ' ';
      body = body.replace(/^\s*\[( |x|X)\]\s+/, '');
    }
    const parsed = parseMarkdown(body, opts);
    const items_children = parsed.children.length
      ? parsed.children
      : [{ id: '', type: 'paragraph', children: [] } as ParagraphNode];
    const item: ListItemNode = {
      id: '',
      type: 'listItem',
      children: items_children,
    };
    if (checked !== undefined) item.checked = checked;
    items.push(item);
  }
  const node: ListNode = { id: '', type: 'list', ordered, children: items };
  if (startNum !== undefined && startNum !== 1) node.start = startNum;
  return node;
}

function tryParseTable(c: LineCursor): TableNode | null {
  const header = peek(c);
  const sep = peek(c, 1);
  if (!header || !sep) return null;
  if (!header.includes('|') || !sep.includes('|')) return null;
  const headCells = splitPipeRow(header);
  const sepCells = splitPipeRow(sep);
  if (headCells.length !== sepCells.length) return null;
  if (!sepCells.every((s) => TABLE_ALIGN_RE.test(s))) return null;

  const align = sepCells.map((s): 'left' | 'center' | 'right' | null => {
    const t = s.trim();
    const L = t.startsWith(':');
    const R = t.endsWith(':');
    if (L && R) return 'center';
    if (R) return 'right';
    if (L) return 'left';
    return null;
  });

  c.i += 2;
  const headRow: TableRowNode = {
    id: '',
    type: 'tableRow',
    children: headCells.map(
      (cell): TableCellNode => ({
        id: '',
        type: 'tableCell',
        header: true,
        children: parseInline(cell.trim()),
      })
    ),
  };
  const rows: TableRowNode[] = [headRow];
  while (c.i < c.lines.length) {
    const line = c.lines[c.i]!;
    if (!line.includes('|') || line.trim() === '') break;
    const cells = splitPipeRow(line);
    rows.push({
      id: '',
      type: 'tableRow',
      children: cells.map(
        (cell): TableCellNode => ({
          id: '',
          type: 'tableCell',
          children: parseInline(cell.trim()),
        })
      ),
    });
    c.i++;
  }
  return { id: '', type: 'table', align, children: rows };
}

function splitPipeRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  const out: string[] = [];
  let buf = '';
  let escaped = false;
  for (const ch of s) {
    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '|') {
      out.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  out.push(buf);
  return out;
}

function parseParagraph(c: LineCursor, _opts: ParseOptions): ParagraphNode {
  const lines: string[] = [];
  while (c.i < c.lines.length) {
    const l = c.lines[c.i]!;
    if (l.trim() === '') break;
    if (
      HEADING_ATX.test(l) ||
      FENCED_CODE_OPEN.test(l) ||
      HR_RE.test(l) ||
      BLOCKQUOTE_RE.test(l) ||
      UL_RE.test(l) ||
      OL_RE.test(l) ||
      BLOCK_DIRECTIVE_OPEN.test(l)
    ) {
      break;
    }
    lines.push(l);
    c.i++;
  }
  return { id: '', type: 'paragraph', children: parseInline(lines.join('\n')) };
}

/* -------------------- inline tokenizer -------------------- */

export function parseInline(text: string): InlineNode[] {
  const out: InlineNode[] = [];
  let i = 0;
  let buf = '';
  const flushText = () => {
    if (buf.length === 0) return;
    out.push({ id: '', type: 'text', value: buf } as TextNode);
    buf = '';
  };

  while (i < text.length) {
    const ch = text[i]!;
    const rest = text.slice(i);

    // Hard break: two trailing spaces + newline, or backslash-newline
    if (ch === '\n') {
      flushText();
      out.push({ id: '', type: 'break' });
      i++;
      continue;
    }
    if (ch === '\\' && i + 1 < text.length) {
      // Escape next char
      if (text[i + 1] === '\n') {
        flushText();
        out.push({ id: '', type: 'break' });
        i += 2;
        continue;
      }
      buf += text[i + 1]!;
      i += 2;
      continue;
    }

    // Inline code
    if (ch === '`') {
      const tickMatch = rest.match(/^(`+)([\s\S]*?)\1(?!`)/);
      if (tickMatch) {
        flushText();
        out.push({ id: '', type: 'inlineCode', value: tickMatch[2]!.trim() });
        i += tickMatch[0]!.length;
        continue;
      }
    }

    // Image ![alt](url "title")
    if (ch === '!' && text[i + 1] === '[') {
      const img = matchLink(text, i + 1);
      if (img) {
        flushText();
        out.push({
          id: '',
          type: 'image',
          alt: img.label,
          url: img.url,
          ...(img.title ? { title: img.title } : {}),
        });
        i = img.end;
        continue;
      }
    }

    // Link [text](url "title")
    if (ch === '[') {
      const lnk = matchLink(text, i);
      if (lnk) {
        flushText();
        out.push({
          id: '',
          type: 'link',
          url: lnk.url,
          ...(lnk.title ? { title: lnk.title } : {}),
          children: parseInline(lnk.label),
        });
        i = lnk.end;
        continue;
      }
    }

    // Strong (** **) and emphasis (* *), also _ variants, and strikethrough (~~ ~~)
    if (ch === '*' || ch === '_') {
      const delim = ch === '*' ? '*' : '_';
      if (text[i + 1] === delim) {
        const close = text.indexOf(delim + delim, i + 2);
        if (close !== -1) {
          flushText();
          out.push({
            id: '',
            type: 'strong',
            children: parseInline(text.slice(i + 2, close)),
          });
          i = close + 2;
          continue;
        }
      } else {
        const close = findClosing(text, i + 1, delim);
        if (close !== -1) {
          flushText();
          out.push({
            id: '',
            type: 'emphasis',
            children: parseInline(text.slice(i + 1, close)),
          });
          i = close + 1;
          continue;
        }
      }
    }

    if (ch === '~' && text[i + 1] === '~') {
      const close = text.indexOf('~~', i + 2);
      if (close !== -1) {
        flushText();
        out.push({
          id: '',
          type: 'delete',
          children: parseInline(text.slice(i + 2, close)),
        });
        i = close + 2;
        continue;
      }
    }

    // Inline directive :name[label]{attrs}
    if (ch === ':' && /[a-zA-Z]/.test(text[i + 1] ?? '')) {
      const m = rest.match(INLINE_DIRECTIVE);
      if (m && m.index === 0) {
        flushText();
        const name = m[1]!;
        const label = m[2];
        const attrs = m[3] ? parseAttributes(m[3]) : {};
        const dir: DirectiveNode = {
          id: '',
          type: 'directive',
          name,
          inline: true,
          attributes: attrs,
        };
        if (label !== undefined) dir.children = parseInline(label);
        out.push(dir);
        i += m[0]!.length;
        continue;
      }
    }

    // Autolink <https://...>
    if (ch === '<') {
      const auto = rest.match(/^<((?:https?|mailto):[^>\s]+)>/);
      if (auto) {
        flushText();
        out.push({
          id: '',
          type: 'link',
          url: auto[1]!,
          children: [{ id: '', type: 'text', value: auto[1]! }],
        });
        i += auto[0]!.length;
        continue;
      }
    }

    buf += ch;
    i++;
  }
  flushText();
  return out;
}

function findClosing(text: string, start: number, delim: string): number {
  // Don't match if preceded by another delim (already handled) or whitespace after open
  if (text[start] === ' ' || text[start] === '\n' || text[start] === undefined) return -1;
  for (let j = start; j < text.length; j++) {
    if (text[j] === '\\') {
      j++;
      continue;
    }
    if (text[j] === delim && text[j - 1] !== ' ') return j;
  }
  return -1;
}

interface LinkMatch {
  label: string;
  url: string;
  title?: string;
  end: number;
}

function matchLink(text: string, start: number): LinkMatch | null {
  if (text[start] !== '[') return null;
  let depth = 1;
  let j = start + 1;
  while (j < text.length && depth > 0) {
    const ch = text[j];
    if (ch === '\\') {
      j += 2;
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    if (depth === 0) break;
    j++;
  }
  if (depth !== 0) return null;
  const labelEnd = j;
  if (text[j + 1] !== '(') return null;
  let k = j + 2;
  // URL until whitespace or )
  let url = '';
  while (k < text.length && text[k] !== ' ' && text[k] !== ')' && text[k] !== '\n') {
    url += text[k]!;
    k++;
  }
  let title: string | undefined;
  if (text[k] === ' ') {
    // Title may be quoted
    while (text[k] === ' ') k++;
    const q = text[k];
    if (q === '"' || q === "'") {
      const endq = text.indexOf(q, k + 1);
      if (endq === -1 || endq > text.indexOf(')', k)) {
        // Malformed
      } else {
        title = text.slice(k + 1, endq);
        k = endq + 1;
        while (text[k] === ' ') k++;
      }
    }
  }
  if (text[k] !== ')') return null;
  return {
    label: text.slice(start + 1, labelEnd),
    url,
    ...(title !== undefined ? { title } : {}),
    end: k + 1,
  };
}

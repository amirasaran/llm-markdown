import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../core/parser/tokenizer';
import { assignIds } from '../core/parser/ast';
import { annotateDirection, directionOf } from '../core/bidi/detect';

describe('parseMarkdown', () => {
  it('parses headings', () => {
    const t = assignIds(parseMarkdown('# Hello\n\n## Sub'));
    expect(t.children).toHaveLength(2);
    expect(t.children[0]!.type).toBe('heading');
    expect((t.children[0] as { depth: number }).depth).toBe(1);
    expect((t.children[1] as { depth: number }).depth).toBe(2);
  });

  it('parses strong, emphasis, code, delete inline', () => {
    const t = parseMarkdown('This is **bold**, *italic*, `code` and ~~strike~~.');
    const p = t.children[0] as { type: string; children: Array<{ type: string }> };
    expect(p.type).toBe('paragraph');
    const kinds = p.children.map((c) => c.type);
    expect(kinds).toContain('strong');
    expect(kinds).toContain('emphasis');
    expect(kinds).toContain('inlineCode');
    expect(kinds).toContain('delete');
  });

  it('parses fenced code block with language', () => {
    const t = parseMarkdown('```ts\nconst x = 1;\n```');
    const code = t.children[0] as { type: string; lang?: string; value: string };
    expect(code.type).toBe('code');
    expect(code.lang).toBe('ts');
    expect(code.value).toBe('const x = 1;');
  });

  it('parses GFM tables', () => {
    const t = parseMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
    const table = t.children[0] as { type: string; children: unknown[] };
    expect(table.type).toBe('table');
    expect(table.children).toHaveLength(2);
  });

  it('parses lists and task lists', () => {
    const t = parseMarkdown('- one\n- [x] two\n- [ ] three');
    const list = t.children[0] as { type: string; children: Array<{ checked?: boolean | null }> };
    expect(list.type).toBe('list');
    expect(list.children).toHaveLength(3);
    expect(list.children[1]!.checked).toBe(true);
    expect(list.children[2]!.checked).toBe(false);
  });

  it('parses block directive with attributes', () => {
    const t = parseMarkdown(':::chart{type=bar title="Rev"}\n{"data":[]}\n:::');
    const dir = t.children[0] as { type: string; name: string; attributes: Record<string, unknown>; value: string };
    expect(dir.type).toBe('directive');
    expect(dir.name).toBe('chart');
    expect(dir.attributes.type).toBe('bar');
    expect(dir.attributes.title).toBe('Rev');
    expect(dir.value).toBe('{"data":[]}');
  });

  it('parses nested callout directive (prose body)', () => {
    const t = parseMarkdown(':::callout{tone=info}\n**hi** there\n:::');
    const dir = t.children[0] as { name: string; children: Array<{ type: string }> };
    expect(dir.name).toBe('callout');
    expect(dir.children[0]!.type).toBe('paragraph');
  });

  it('handles unclosed code block in streaming mode', () => {
    const t = parseMarkdown('```js\nfoo(', { streaming: true });
    const code = t.children[0] as { type: string; streaming?: boolean };
    expect(code.type).toBe('code');
    expect(code.streaming).toBe(true);
  });

  it('parses links', () => {
    const t = parseMarkdown('A [link](https://x.com "t") here');
    const p = t.children[0] as { children: Array<{ type: string }> };
    const link = p.children.find((c) => c.type === 'link') as unknown as { url: string; title?: string };
    expect(link.url).toBe('https://x.com');
    expect(link.title).toBe('t');
  });

  it('assigns stable node ids', () => {
    const a = assignIds(parseMarkdown('# hi\n\npara'));
    const b = assignIds(parseMarkdown('# hi\n\npara'));
    expect(a.children[0]!.id).toBe(b.children[0]!.id);
    expect(a.children[1]!.id).toBe(b.children[1]!.id);
  });

  it('streaming re-parse keeps ids for unchanged prefix nodes', () => {
    const a = assignIds(parseMarkdown('# hi\n\npara'));
    const b = assignIds(parseMarkdown('# hi\n\npara extra'));
    expect(a.children[0]!.id).toBe(b.children[0]!.id); // heading unchanged
    // paragraph content changed, so id differs — but heading keeps its identity
  });
});

describe('bidi', () => {
  it('detects rtl for arabic', () => {
    expect(directionOf('سلام')).toBe('rtl');
  });
  it('detects ltr for english', () => {
    expect(directionOf('Hello')).toBe('ltr');
  });
  it('returns null for neutral only', () => {
    expect(directionOf('123 ... !?')).toBeNull();
  });
  it('annotates blocks with per-block direction', () => {
    const t = assignIds(parseMarkdown('Hello world\n\nسلام دنیا'));
    annotateDirection(t);
    expect(t.children[0]!.dir).toBe('ltr');
    expect(t.children[1]!.dir).toBe('rtl');
  });
});

import {
  demoMarkdown,
  headingsMarkdown,
  inlineMarkdown,
  listsMarkdown,
  codeMarkdown,
  blockquoteMarkdown,
  tableMarkdown,
  bidiMarkdown,
  directivesMarkdown,
  streamingEdgeMarkdown,
  persianMarkdown,
  arabicMarkdown,
  tableAlignmentMarkdown,
  imagesMarkdown,
} from './demo-content';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  response: string;
}

const chartOnly = `## Chart

:::chart{type=bar title="Quarterly revenue"}
{"data":[{"label":"Q1","value":12},{"label":"Q2","value":19},{"label":"Q3","value":9},{"label":"Q4","value":24}]}
:::
`;

const calloutOnly = `## Callouts

:::callout{tone=info title="Info"}
Callouts render **markdown** inside their body.
:::

:::callout{tone=warn title="Warning"}
Watch out for \`edge cases\`.
:::
`;

const wideTableOnly = `## Wide table (horizontal scroll)

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| α | β | γ | δ | ε | ζ | η | θ | ι | κ | λ |
`;

export const slashCommands: SlashCommand[] = [
  { id: 'everything', label: '/everything', description: 'Full feature tour — headings, code, tables, RTL, directives', response: demoMarkdown },
  { id: 'headings', label: '/headings', description: 'All six heading levels', response: headingsMarkdown },
  { id: 'inline', label: '/inline', description: 'Bold, italic, code, strike, links', response: inlineMarkdown },
  { id: 'lists', label: '/lists', description: 'Ordered, unordered, task lists', response: listsMarkdown },
  { id: 'code', label: '/code', description: 'Inline and fenced code blocks', response: codeMarkdown },
  { id: 'blockquote', label: '/blockquote', description: 'Single and multi-line quotes', response: blockquoteMarkdown },
  { id: 'table', label: '/table', description: 'Narrow and aligned tables', response: tableMarkdown },
  { id: 'wide', label: '/wide', description: 'A wide table that scrolls horizontally', response: wideTableOnly },
  { id: 'chart', label: '/chart', description: 'Chart directive with JSON payload', response: chartOnly },
  { id: 'callout', label: '/callout', description: 'Callout directives (info, warn, …)', response: calloutOnly },
  { id: 'directives', label: '/directives', description: 'All directives — charts + callouts', response: directivesMarkdown },
  { id: 'image', label: '/image', description: 'Images — single, list, table, blockquote, error-fallback', response: imagesMarkdown },
  { id: 'img', label: '/img', description: 'Alias for /image', response: imagesMarkdown },
  { id: 'rtl', label: '/rtl', description: 'Mixed Persian / Arabic / Hebrew / English', response: bidiMarkdown },
  { id: 'persian', label: '/persian', description: 'Full Persian document with tables and code', response: persianMarkdown },
  { id: 'farsi', label: '/farsi', description: 'Alias for /persian', response: persianMarkdown },
  { id: 'arabic', label: '/arabic', description: 'Full Arabic document with tables and code', response: arabicMarkdown },
  { id: 'align', label: '/align', description: 'Table alignment stress test (LTR + RTL + mixed, varying sizes)', response: tableAlignmentMarkdown },
  { id: 'streaming', label: '/streaming', description: 'Edge cases with partial fences and tables', response: streamingEdgeMarkdown },
];

export function resolveResponse(userInput: string): string {
  const trimmed = userInput.trim();
  if (trimmed.startsWith('/')) {
    const token = trimmed.slice(1).split(/\s+/)[0]?.toLowerCase() ?? '';
    const match = slashCommands.find((c) => c.id === token);
    if (match) return match.response;
  }
  return demoMarkdown;
}

export function findSlashSuggestions(input: string): SlashCommand[] {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return [];
  const q = trimmed.slice(1).toLowerCase();
  if (q === '') return slashCommands;
  return slashCommands.filter((c) => c.id.startsWith(q));
}

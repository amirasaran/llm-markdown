# API reference

All public exports. The API is identical on web and native unless marked otherwise.

## `LLMMarkdown`

```ts
import { LLMMarkdown } from 'llm-markdown/web';
// or
import { LLMMarkdown } from 'llm-markdown/native';
```

### Props

```ts
interface LLMMarkdownProps {
  text: string;
  streaming?: boolean;                   // default true
  components?: ComponentOverrides;
  directives?: DirectiveRegistry;
  before?: ReactNode;
  after?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  card?: CardConfig;
  theme?: DeepPartial<Theme>;
  direction?: 'auto' | 'ltr' | 'rtl';    // default 'auto'
  virtualize?: boolean;                  // native only, experimental
  textSelection?: boolean | TextSelectionConfig;
  blockSlots?: BlockSlots;
  blockStyles?: BlockStyles;
  image?: ImageConfig;
  onHeadingInView?: (id: string, depth: number, text: string) => void;
  onDirectiveRender?: (node: DirectiveNode) => ReactNode | null | undefined;
}
```

| prop                | meaning                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `text`              | The markdown source. Can change on every render while streaming.                                  |
| `streaming`         | If `true`, the parser tolerates partial/unclosed blocks and tags them `streaming: true`.          |
| `components`        | Per-node-type renderer overrides. See [theming doc](./theming-and-overrides.md).                  |
| `directives`        | `{ [name]: Component }` registry for `:::name{…}` and `:name{…}` elements.                        |
| `before` / `after`  | Nodes rendered inside the card, around the markdown content.                                      |
| `header` / `footer` | Nodes rendered inside the card, above `before` and below `after`.                                 |
| `card`              | Card appearance + animation config. See below.                                                    |
| `theme`             | Partial theme merged over the default.                                                            |
| `direction`         | `'auto'` (default) uses per-block detection; `'ltr'` / `'rtl'` force the entire document.         |
| `virtualize`        | (Native only, experimental) If `true`, uses a virtualized list for block nodes > 80.              |
| `textSelection`     | Enable text selection + optional custom action menu. See below.                                   |
| `blockSlots`        | Per-block-type slots (before / after / actions toolbar). See below.                               |
| `blockStyles`       | Per-block-type style + className overrides merged over defaults. See below.                       |
| `image`             | Image tap / long-press handlers (`onPress`, `onLongPress`). See below.                            |
| `onHeadingInView`   | Fires when a heading is visible; useful for TOCs.                                                 |
| `onDirectiveRender` | Intercept directive rendering; return a `ReactNode` to replace, `null`/`undefined` to let it run. |

### `textSelection`

```ts
type TextSelection = boolean | TextSelectionConfig;

interface TextSelectionConfig {
  enabled: boolean;
  actions?: Array<{ label: string; onPress: (selectedText: string) => void }>;
  onSelect?: (selectedText: string) => void;   // '' when selection clears
}
```

`textSelection={true}` is sugar for `{ enabled: true }`.

- **Web**: enables `user-select: text` on the card and, when `actions` are supplied, renders a floating pill toolbar anchored above the active browser selection. Works on any content.
- **Native**: consecutive text-like blocks (paragraph / heading / hr / list) render inside a single `<TextInput editable={false} multiline>` so iOS `UITextView` shows a continuous selection across them — same approach ChatGPT uses. Non-text blocks (code, table, blockquote, image, directive) intentionally break the selection range.
- Custom `actions` on native only reach plain-text code blocks via the optional peer `react-native-selectable-text`. Rich paragraphs fall back to the system menu and emit a one-shot dev warning.

### `blockSlots`

Per-block-type UI hooks around specific block renderers.

```ts
interface BlockSlots {
  code?:  BlockSlot<CodeNode>;
  table?: BlockSlot<TableNode>;
  image?: BlockSlot<ImageNode>;
}

interface BlockSlot<N> {
  before?: (node: N) => ReactNode;
  after?:  (node: N) => ReactNode;
  actions?: BlockAction<N>[];
}

interface BlockAction<N> {
  label: string;
  onPress: (node: N) => void;   // receives the full AST node
}
```

- `before` / `after` — custom ReactNode above / below the block. Full layout control.
- `actions` — shortcut: library renders a themed pill toolbar (one button per action) below the block.
- The `onPress` callback receives the typed AST node, so the handler has full access to the block's content: `code` → `{ value, lang }`, `table` → `{ children, align }`, `image` → `{ url, alt, title }`.

Example:

```tsx
<LLMMarkdown
  text={text}
  blockSlots={{
    code: {
      actions: [
        { label: 'Copy', onPress: (n) => navigator.clipboard.writeText(n.value) },
        { label: 'Run',  onPress: (n) => execute(n.lang, n.value) },
      ],
    },
    table: {
      actions: [
        { label: 'Export CSV', onPress: (n) => downloadCSV(tableToCSV(n)) },
      ],
    },
  }}
/>
```

For block types not yet in `BlockSlots` (paragraph, heading, blockquote, list, etc.), use the `components` override map instead.

### `blockStyles`

Per-node-type style + className overrides, merged **over** the default renderer's computed style. Lighter than `components` — no component reimplementation, just tweaks to the visual.

```ts
interface BlockStyles {
  heading?:        BlockStyleConfig;
  paragraph?:      BlockStyleConfig;
  code?:           BlockStyleConfig;
  blockquote?:     BlockStyleConfig;
  list?:           BlockStyleConfig;
  listItem?:       BlockStyleConfig;
  link?:           BlockStyleConfig;
  image?:          BlockStyleConfig;
  thematicBreak?:  BlockStyleConfig;
  table?:          BlockStyleConfig;
  tableRow?:       BlockStyleConfig;
  tableCell?:      BlockStyleConfig;
  // ...inline types (text, strong, emphasis, delete, inlineCode) are accepted
  // at the type level but are not yet applied in v1. Use `components` for those.
}

interface BlockStyleConfig {
  style?: CSSProperties | ((node: AnyNode) => CSSProperties | undefined);
  className?: string | ((node: AnyNode) => string | undefined);  // web only
}
```

- `style` — merged on top of the default style object. Static object or function form.
- `className` — **web only**, silently ignored on native. Handy for Tailwind, CSS Modules, or utility CSS.
- The function form receives the typed AST node, so you can style based on `node.dir`, `node.lang`, `node.depth`, etc.

Example:

```tsx
<LLMMarkdown
  text={text}
  blockStyles={{
    heading: {
      style: (node) => ({
        borderLeft: node.depth === 1 ? `4px solid ${accent}` : undefined,
        paddingLeft: node.depth === 1 ? 12 : 0,
      }),
    },
    code: {
      style: { backgroundColor: '#0B1020' },
      className: 'font-mono shadow-lg',  // web only
    },
    blockquote: {
      style: { fontStyle: 'italic', borderLeftWidth: 2 },
    },
  }}
/>
```

When you need full layout control, use `components` to replace the renderer entirely; when you only need cosmetic tweaks, use `blockStyles`.

### `image`

Tap / click and long-press handlers for rendered images. Useful for opening a lightbox, previewing alt text, copying the URL, or showing a context menu.

```ts
interface ImageConfig {
  onPress?: (node: ImageNode) => void;
  onLongPress?: (node: ImageNode) => void;
}
```

```tsx
<LLMMarkdown
  text={text}
  image={{
    onPress: (node) => openLightbox(node.url),
    onLongPress: (node) => showImageMenu(node),
  }}
/>
```

- `node` is the full `ImageNode`, so you have `url`, `alt`, `title` in the handler.
- The default `ImageR` only wraps in a pressable when at least one handler is supplied — images without handlers stay plain for accessibility/semantics.
- **Web**: `onPress` fires on `click`; `onLongPress` fires on either a 500ms `pointerdown` hold (covers mobile) **or** `contextmenu` (covers desktop right-click). If long-press fires, the follow-up click is suppressed so handlers don't double-fire. Keyboard activation (`Enter` / `Space`) also triggers `onPress`.
- **Native**: wraps the RN `<Image>` in a `<Pressable>` with `accessibilityRole="imagebutton"`. `onPress` / `onLongPress` map directly to RN's gesture handlers.

### `CardConfig`

```ts
interface CardConfig {
  animation?: 'none' | 'fade' | 'fadeSlide' | 'scale' | 'typewriter';
  enterDuration?: number;      // ms
  layoutAnimation?: boolean;   // animate height changes while streaming
  padding?: number;
  radius?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}
```

## `useLLMMarkdown`

```ts
import { useLLMMarkdown } from 'llm-markdown/web';

const { tree } = useLLMMarkdown(text, {
  streaming: true,
  direction: 'auto',
});
```

Use this when you want the parsed AST but not the default card wrapper. `tree` is a `RootNode` with stable node ids and direction already annotated.

## `Theme`

```ts
interface Theme {
  colors: {
    text;            textMuted;     background;   surface;      border;
    link;            codeBackground; codeText;     accent;       blockquoteBar;
  };
  spacing:    { xs; sm; md; lg; xl };
  radii:      { sm; md; lg };
  typography: {
    fontFamily; monoFamily;
    sizeBase; sizeSmall; sizeH1; sizeH2; sizeH3; sizeH4;
    lineHeight;
  };
  motion:     { enterDuration; layoutDuration };
  layout:     { tableColumnWidth };   // native only — per-column target (px)
}
```

Shipped presets: `defaultTheme`, `darkTheme`. `mergeTheme(base, partial)` is exported for advanced composition.

## `ComponentOverrides`

```ts
type ComponentOverrides = Partial<{
  root:           ComponentType<NodeRendererProps>;
  paragraph:      ComponentType<NodeRendererProps>;
  heading:        ComponentType<NodeRendererProps>;
  text:           ComponentType<NodeRendererProps>;
  strong:         ComponentType<NodeRendererProps>;
  emphasis:       ComponentType<NodeRendererProps>;
  delete:         ComponentType<NodeRendererProps>;
  inlineCode:     ComponentType<NodeRendererProps>;
  code:           ComponentType<NodeRendererProps>;
  blockquote:     ComponentType<NodeRendererProps>;
  list:           ComponentType<NodeRendererProps>;
  listItem:       ComponentType<NodeRendererProps>;
  link:           ComponentType<NodeRendererProps>;
  image:          ComponentType<NodeRendererProps>;
  thematicBreak:  ComponentType<NodeRendererProps>;
  table:          ComponentType<NodeRendererProps>;
  tableRow:       ComponentType<NodeRendererProps>;
  tableCell:      ComponentType<NodeRendererProps>;
  html:           ComponentType<NodeRendererProps>;
  break:          ComponentType<NodeRendererProps>;
}>;
```

## `NodeRendererProps`

```ts
interface NodeRendererProps<N = AnyNode> {
  node: N;
  children?: ReactNode;
  theme: Theme;
}
```

## `DirectiveRegistry` / `DirectiveComponentProps`

```ts
type DirectiveRegistry = Record<string, ComponentType<DirectiveComponentProps>>;

interface DirectiveComponentProps {
  node: DirectiveNode;
  attributes: Record<string, string | number | boolean>;
  value?: string;         // raw body (opaque directives)
  children?: ReactNode;   // rendered body (prose directives)
  theme: Theme;
}
```

## AST node types

From `llm-markdown` (re-exported at package root and from `/web`, `/native`):

```
RootNode        ParagraphNode   HeadingNode     TextNode
StrongNode      EmphasisNode    DeleteNode      InlineCodeNode
CodeNode        BlockquoteNode  ListNode        ListItemNode
LinkNode        ImageNode       ThematicBreakNode
TableNode       TableRowNode    TableCellNode
HtmlNode        BreakNode       DirectiveNode

BlockNode  = ParagraphNode | HeadingNode | CodeNode | BlockquoteNode
           | ListNode | ThematicBreakNode | TableNode | HtmlNode | DirectiveNode
InlineNode = TextNode | StrongNode | EmphasisNode | DeleteNode
           | InlineCodeNode | LinkNode | ImageNode | BreakNode | DirectiveNode
AnyNode    = RootNode | BlockNode | InlineNode | ListItemNode | TableRowNode | TableCellNode
```

Every node has:

- `id: string` — stable content-hash id
- `type: NodeType`
- `dir?: 'ltr' | 'rtl'` — on block-level nodes after the bidi pass
- `streaming?: true` — on pending/unclosed nodes while streaming

## Low-level utilities

```ts
import {
  parseMarkdown,       // (source, { streaming }) → RootNode (no ids, no dir)
  assignIds,           // (root) → root with stable ids
  annotateDirection,   // (root, fallback='ltr') → root with dir tags
  diffTrees,           // (prev, next) → Patch[] (for telemetry/debug)
  directionOf,         // (text) → 'ltr' | 'rtl' | null
  defaultTheme, darkTheme, mergeTheme,
  parseAttributes,     // (attrString) → Record<string, string|number|boolean>
  OPAQUE_BODY_DIRECTIVES,
} from 'llm-markdown';
```

Use these if you need to build a renderer pipeline outside React (e.g. server-side pre-processing).

## Entry points

| import path                  | what you get                                                  |
| ---------------------------- | ------------------------------------------------------------- |
| `llm-markdown`            | core AST + hook + types (no React components)                 |
| `llm-markdown/core`       | same as above (explicit alias)                                |
| `llm-markdown/web`        | `LLMMarkdown` using React DOM primitives + web defaults    |
| `llm-markdown/native`     | `LLMMarkdown` using React Native primitives + RN defaults  |

'use dom';

import { useMemo } from 'react';
import { LLMMarkdown as WebLLMMarkdown } from '../../web';
import type {
  BlockStyles,
  CardConfig,
  DeepPartial,
  Direction,
  DirectiveComponentProps,
  DirectiveRegistry,
  Theme,
} from '../../shared/types';
import type { CodeNode, ImageNode, TableNode } from '../../core/parser/ast';

/** Serializable summary of the AST node that crosses the Expo DOM bridge in
 *  response to a block action. Only primitives — no function refs. */
export interface BlockActionNodeSummary {
  id?: string;
  type: string;
  value?: string;
  lang?: string;
  url?: string;
  alt?: string;
}

/** Props for `LLMMarkdownDom`. Mirrors `LLMMarkdownProps` as closely as the
 *  Expo DOM bridge allows. Three deliberate degradations:
 *    - `textSelection.actions` is `string[]` (labels) instead of
 *      `{ label, onPress }[]`. Use `onTextSelectionAction` for the callback.
 *    - `blockSlots.<type>.actions` is `string[]` instead of `BlockAction[]`.
 *      Use `onBlockAction` for the callback.
 *    - `header` / `footer` / `before` / `after` accept a markdown `string`
 *      (rendered inside the WebView) instead of `ReactNode` — React elements
 *      can't cross the native↔WebView bridge.
 *  `components` and user-supplied `directives` are omitted (component
 *  implementations can't be serialized). The library auto-registers a
 *  built-in `html` directive that renders its body via
 *  `dangerouslySetInnerHTML`.
 */
export interface LLMMarkdownDomProps {
  text: string;
  streaming?: boolean;
  direction?: 'auto' | Direction;
  theme?: DeepPartial<Theme>;
  card?: CardConfig;
  blockStyles?: BlockStyles;
  virtualize?: boolean;
  onHeadingInView?: (id: string, depth: number, text: string) => Promise<void>;
  header?: string;
  footer?: string;
  before?: string;
  after?: string;
  textSelection?:
    | boolean
    | {
        enabled: boolean;
        actions?: string[];
      };
  onTextSelectionAction?: (label: string, selectedText: string) => Promise<void>;
  onTextSelectionChange?: (selectedText: string) => Promise<void>;
  blockSlots?: {
    code?: { actions?: string[] };
    table?: { actions?: string[] };
    image?: { actions?: string[] };
  };
  onBlockAction?: (
    blockType: 'code' | 'table' | 'image',
    label: string,
    node: BlockActionNodeSummary
  ) => Promise<void>;
  /** WebView / sizing config forwarded to the Expo DOM runtime. */
  dom?: import('expo/dom').DOMProps;
}

function HtmlDirective({ value }: DirectiveComponentProps) {
  if (!value) return null;
  return <div dangerouslySetInnerHTML={{ __html: value }} />;
}

function summarizeCode(node: CodeNode): BlockActionNodeSummary {
  return { id: node.id, type: node.type, value: node.value, lang: node.lang };
}
function summarizeTable(node: TableNode): BlockActionNodeSummary {
  return { id: node.id, type: node.type };
}
function summarizeImage(node: ImageNode): BlockActionNodeSummary {
  return { id: node.id, type: node.type, url: node.url, alt: node.alt };
}

function renderMarkdownString(md: string | undefined, theme?: DeepPartial<Theme>) {
  if (!md) return undefined;
  return <WebLLMMarkdown text={md} streaming={false} theme={theme} />;
}

export default function LLMMarkdownDom({
  text,
  streaming,
  direction,
  theme,
  card,
  blockStyles,
  virtualize,
  onHeadingInView,
  header,
  footer,
  before,
  after,
  textSelection,
  onTextSelectionAction,
  onTextSelectionChange,
  blockSlots,
  onBlockAction,
}: LLMMarkdownDomProps) {
  const resolvedTextSelection = useMemo(() => {
    if (textSelection === undefined) return undefined;
    if (typeof textSelection === 'boolean') return textSelection;
    const labels = textSelection.actions ?? [];
    return {
      enabled: textSelection.enabled,
      actions: labels.map((label) => ({
        label,
        onPress: (selectedText: string) => {
          void onTextSelectionAction?.(label, selectedText);
        },
      })),
      ...(onTextSelectionChange
        ? {
            onSelect: (selectedText: string) => {
              void onTextSelectionChange(selectedText);
            },
          }
        : {}),
    };
  }, [textSelection, onTextSelectionAction, onTextSelectionChange]);

  const resolvedBlockSlots = useMemo(() => {
    if (!blockSlots) return undefined;
    const out: Record<string, unknown> = {};
    if (blockSlots.code?.actions?.length) {
      out.code = {
        actions: blockSlots.code.actions.map((label) => ({
          label,
          onPress: (node: CodeNode) => {
            void onBlockAction?.('code', label, summarizeCode(node));
          },
        })),
      };
    }
    if (blockSlots.table?.actions?.length) {
      out.table = {
        actions: blockSlots.table.actions.map((label) => ({
          label,
          onPress: (node: TableNode) => {
            void onBlockAction?.('table', label, summarizeTable(node));
          },
        })),
      };
    }
    if (blockSlots.image?.actions?.length) {
      out.image = {
        actions: blockSlots.image.actions.map((label) => ({
          label,
          onPress: (node: ImageNode) => {
            void onBlockAction?.('image', label, summarizeImage(node));
          },
        })),
      };
    }
    return out as import('../../shared/types').BlockSlots;
  }, [blockSlots, onBlockAction]);

  const directives = useMemo<DirectiveRegistry>(
    () => ({ html: HtmlDirective }),
    []
  );

  const dark = useMemo(() => {
    const bg = (theme as { colors?: { background?: string } } | undefined)?.colors?.background;
    if (!bg) return false;
    return /^#0|^#1|^#2/.test(bg);
  }, [theme]);

  return (
    <div
      style={{
        margin: 0,
        padding: 16,
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        background: dark ? '#0B0B0F' : '#ffffff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: dark ? '#F3F4F6' : '#111827',
      }}
    >
      <style>{`
        html, body { margin: 0; padding: 0; overflow-x: hidden; width: 100%; }
        body { -webkit-text-size-adjust: 100%; }
        * { max-width: 100%; }
        pre, code {
          white-space: pre-wrap !important;
          word-break: break-word;
          overflow-wrap: anywhere;
          overflow-x: visible !important;
        }
        pre > * { overflow-x: visible !important; }
        table {
          display: block;
          width: 100%;
          table-layout: fixed;
          word-break: break-word;
          overflow-x: visible !important;
        }
        th, td { word-break: break-word; overflow-wrap: anywhere; }
      `}</style>
      <WebLLMMarkdown
        text={text}
        {...(streaming !== undefined ? { streaming } : {})}
        {...(direction !== undefined ? { direction } : {})}
        {...(theme !== undefined ? { theme } : {})}
        {...(card !== undefined ? { card } : {})}
        {...(blockStyles !== undefined ? { blockStyles } : {})}
        {...(virtualize !== undefined ? { virtualize } : {})}
        {...(onHeadingInView
          ? {
              onHeadingInView: (id: string, depth: number, text: string) => {
                void onHeadingInView(id, depth, text);
              },
            }
          : {})}
        directives={directives}
        {...(resolvedTextSelection !== undefined
          ? { textSelection: resolvedTextSelection }
          : {})}
        {...(resolvedBlockSlots !== undefined ? { blockSlots: resolvedBlockSlots } : {})}
        header={renderMarkdownString(header, theme)}
        footer={renderMarkdownString(footer, theme)}
        before={renderMarkdownString(before, theme)}
        after={renderMarkdownString(after, theme)}
      />
    </div>
  );
}

export type { Direction, Theme, BlockStyles, CardConfig, DeepPartial };

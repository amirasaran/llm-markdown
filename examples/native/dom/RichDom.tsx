'use dom';

// App-level "use dom" wrapper that registers the Chart / Callout / Email
// / html directives. Custom directive *components* cannot cross the Expo
// DOM bridge (React components aren't serializable), so they have to be
// defined in a file that runs inside the WebView — i.e. any file with the
// `"use dom"` directive. That's what this file is. The library's
// `LLMMarkdownDom` ships an html-only directive set; use this wrapper when
// you need custom directives too. Its props mirror `LLMMarkdownDomProps`
// to keep drop-in parity.

import { useMemo } from 'react';
import { LLMMarkdown as WebLLMMarkdown } from 'llm-markdown/web';
import type {
  BlockSlots,
  BlockStyles,
  CardConfig,
  Direction,
  DirectiveComponentProps,
  DirectiveRegistry,
  Theme,
} from 'llm-markdown/web';
import type { CodeNode, ImageNode, TableNode } from 'llm-markdown/web';
import type { DeepPartial } from 'llm-markdown';
import { ChartDom } from '../directives/dom/Chart';
import { CalloutDom } from '../directives/dom/Callout';
import { EmailDom } from '../directives/dom/Email';

export interface RichDomBlockNodeSummary {
  id?: string;
  type: string;
  value?: string;
  lang?: string;
  url?: string;
  alt?: string;
}

export interface RichDomProps {
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
    node: RichDomBlockNodeSummary
  ) => Promise<void>;
  /** When true, skip the decorative outer wrapper (padding, background,
   *  100vh min-height). Use this when the DOM component is embedded inside
   *  another container that already provides its own chrome — e.g. a chat
   *  bubble that passes a `card` prop for border/background. */
  bare?: boolean;
  dom?: import('expo/dom').DOMProps;
}

function HtmlDirective({ value }: DirectiveComponentProps) {
  if (!value) return null;
  return <div dangerouslySetInnerHTML={{ __html: value }} />;
}

function summarizeCode(node: CodeNode): RichDomBlockNodeSummary {
  return { id: node.id, type: node.type, value: node.value, lang: node.lang };
}
function summarizeTable(node: TableNode): RichDomBlockNodeSummary {
  return { id: node.id, type: node.type };
}
function summarizeImage(node: ImageNode): RichDomBlockNodeSummary {
  return { id: node.id, type: node.type, url: node.url, alt: node.alt };
}

function renderMarkdownString(md: string | undefined, theme?: DeepPartial<Theme>) {
  if (!md) return undefined;
  return <WebLLMMarkdown text={md} streaming={false} theme={theme} />;
}

export default function RichDom({
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
  bare,
}: RichDomProps) {
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
    return out as BlockSlots;
  }, [blockSlots, onBlockAction]);

  const directives = useMemo<DirectiveRegistry>(
    () => ({
      html: HtmlDirective,
      chart: ChartDom,
      callout: CalloutDom,
      email: EmailDom,
    }),
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
        padding: bare ? 0 : 16,
        width: '100%',
        maxWidth: '100vw',
        minHeight: bare ? undefined : '100vh',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        background: bare ? 'transparent' : dark ? '#0B0B0F' : '#ffffff',
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
              onHeadingInView: (id: string, depth: number, t: string) => {
                void onHeadingInView(id, depth, t);
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

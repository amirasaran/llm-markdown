import { useMemo } from 'react';
import type { StreamMarkdownProps } from '../shared/types';
import { useStreamMarkdown } from '../core/hooks/useStreamMarkdown';
import {
  RendererContext,
  type RendererContextValue,
} from '../core/registry/componentRegistry';
import { defaultTheme, mergeTheme } from '../core/registry/theme';
import { Card } from './Card';
import { RenderNode } from './render';

export function StreamMarkdown(props: StreamMarkdownProps) {
  const {
    text,
    streaming = true,
    components,
    directives,
    before,
    after,
    header,
    footer,
    card,
    theme,
    direction = 'auto',
  } = props;

  const mergedTheme = useMemo(() => mergeTheme(defaultTheme, theme), [theme]);

  const { tree } = useStreamMarkdown(text, { streaming, direction });

  const ctxValue = useMemo<RendererContextValue>(
    () => {
      const base: RendererContextValue = {
        components: components ?? {},
        directives: directives ?? {},
        theme: mergedTheme,
        direction,
      };
      if (props.onHeadingInView) base.onHeadingInView = props.onHeadingInView;
      return base;
    },
    [components, directives, mergedTheme, direction, props.onHeadingInView]
  );

  return (
    <RendererContext.Provider value={ctxValue}>
      <Card
        theme={mergedTheme}
        direction={direction}
        {...(card ? { config: card } : {})}
        {...(header ? { header } : {})}
        {...(before ? { before } : {})}
        {...(after ? { after } : {})}
        {...(footer ? { footer } : {})}
      >
        <RenderNode node={tree} />
      </Card>
    </RendererContext.Provider>
  );
}

export { defaultTheme, darkTheme } from '../core/registry/theme';
export { useStreamMarkdown } from '../core/hooks/useStreamMarkdown';
export type {
  StreamMarkdownProps,
  ComponentOverrides,
  DirectiveRegistry,
  DirectiveComponentProps,
  NodeRendererProps,
  CardConfig,
  CardAnimationPreset,
  Theme,
  Direction,
  BlockNode,
  InlineNode,
  DirectiveNode,
  RootNode,
  AnyNode,
} from '../shared/types';
export type {
  HeadingNode,
  ParagraphNode,
  TextNode,
  StrongNode,
  EmphasisNode,
  DeleteNode,
  InlineCodeNode,
  CodeNode,
  BlockquoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  ImageNode,
  ThematicBreakNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HtmlNode,
  BreakNode,
  BaseNode,
  NodeType,
} from '../core/parser/ast';

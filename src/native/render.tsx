import { Fragment, type ReactNode, type ComponentType, Component } from 'react';
import type {
  AnyNode,
  RootNode,
  DirectiveNode,
} from '../core/parser/ast';
import type { DirectiveComponentProps, NodeRendererProps } from '../shared/types';
import { useRenderer } from '../core/registry/componentRegistry';
import { Text } from './rn';
import * as D from './components/defaults';

export function RenderNode({ node }: { node: AnyNode }): ReactNode {
  const ctx = useRenderer();
  const { components, directives, theme } = ctx;

  if (node.type === 'root') return <RenderChildren nodes={(node as RootNode).children} />;

  if (node.type === 'directive') {
    const dn = node as DirectiveNode;
    const Comp = directives[dn.name];
    if (!Comp) {
      return <Text style={{ color: theme.colors.textMuted }}>[{dn.name}]</Text>;
    }
    const children = dn.children ? <RenderChildren nodes={dn.children as AnyNode[]} /> : undefined;
    const props: DirectiveComponentProps = {
      node: dn,
      attributes: dn.attributes,
      theme,
      ...(dn.value !== undefined ? { value: dn.value } : {}),
      ...(children !== undefined ? { children } : {}),
    };
    return (
      <ErrorBoundary fallback={<Text style={{ color: theme.colors.textMuted }}>[{dn.name} error]</Text>}>
        <Comp {...props} />
      </ErrorBoundary>
    );
  }

  const Override = (components as Record<string, ComponentType<NodeRendererProps> | undefined>)[
    node.type
  ];
  const Default = getDefault(node.type);
  const inner = hasChildren(node)
    ? <RenderChildren nodes={(node as { children: AnyNode[] }).children} />
    : undefined;

  const Comp = Override ?? Default;
  if (!Comp) return null;
  return (
    <Comp node={node} theme={theme}>
      {inner}
    </Comp>
  );
}

function RenderChildren({ nodes }: { nodes: AnyNode[] }) {
  return (
    <>
      {nodes.map((n) => (
        <Fragment key={n.id}>
          <RenderNode node={n} />
        </Fragment>
      ))}
    </>
  );
}

function hasChildren(node: AnyNode): boolean {
  return (
    'children' in node &&
    Array.isArray((node as { children?: unknown }).children) &&
    (node as { children: unknown[] }).children.length > 0
  );
}

function getDefault(type: string): ComponentType<NodeRendererProps> | null {
  const map: Record<string, unknown> = {
    root: D.RootR,
    heading: D.HeadingR,
    paragraph: D.ParagraphR,
    text: D.TextR,
    strong: D.StrongR,
    emphasis: D.EmphasisR,
    delete: D.DeleteR,
    inlineCode: D.InlineCodeR,
    code: D.CodeR,
    blockquote: D.BlockquoteR,
    list: D.ListR,
    listItem: D.ListItemR,
    link: D.LinkR,
    image: D.ImageR,
    thematicBreak: D.ThematicBreakR,
    table: D.TableR,
    tableRow: D.TableRowR,
    tableCell: D.TableCellR,
    break: D.BreakR,
  };
  return (map[type] as ComponentType<NodeRendererProps> | undefined) ?? null;
}

interface EBProps {
  children: ReactNode;
  fallback: ReactNode;
}
interface EBState { hasError: boolean; }
class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() {}
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

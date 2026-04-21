import { memo, type CSSProperties, type ReactNode } from 'react';
import type { Theme } from '../../shared/types';
import type {
  HeadingNode,
  ParagraphNode,
  TextNode,
  CodeNode,
  InlineCodeNode,
  LinkNode,
  ImageNode,
  BlockquoteNode,
  ListNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  BaseNode,
  AnyNode,
} from '../../core/parser/ast';
import { HScroll } from '../scroll/HScroll';
import { useBlockStyle } from '../../core/blockStyle';

const memoEqual = (
  a: { node: BaseNode; theme: Theme },
  b: { node: BaseNode; theme: Theme }
) => a.node.id === b.node.id && a.theme === b.theme;

export const RootR = memo(function RootR({ children }: { children?: ReactNode; theme: Theme }) {
  return <div>{children}</div>;
});

export const HeadingR = memo(function HeadingR({
  node,
  children,
  theme,
}: {
  node: HeadingNode;
  children?: ReactNode;
  theme: Theme;
}) {
  const sizeMap: Record<number, number> = {
    1: theme.typography.sizeH1,
    2: theme.typography.sizeH2,
    3: theme.typography.sizeH3,
    4: theme.typography.sizeH4,
    5: theme.typography.sizeBase,
    6: theme.typography.sizeBase,
  };
  const Tag = (`h${node.depth}` as unknown) as 'h1';
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <Tag
      dir={node.dir}
      className={className}
      style={{
        fontSize: sizeMap[node.depth],
        fontWeight: 700,
        margin: `${theme.spacing.lg}px 0 ${theme.spacing.sm}px`,
        color: theme.colors.text,
        ...(userStyle as CSSProperties | undefined),
      }}
    >
      {children}
    </Tag>
  );
}, memoEqual);

export const ParagraphR = memo(function ParagraphR({
  node,
  children,
  theme,
}: {
  node: ParagraphNode;
  children?: ReactNode;
  theme: Theme;
}) {
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <p
      dir={node.dir}
      className={className}
      style={{
        margin: `${theme.spacing.sm}px 0`,
        color: theme.colors.text,
        ...(userStyle as CSSProperties | undefined),
      }}
    >
      {children}
    </p>
  );
}, memoEqual);

export const TextR = memo(function TextR({ node }: { node: TextNode; theme: Theme }) {
  return <>{node.value}</>;
}, memoEqual);

export const StrongR = function StrongR({ children }: { children?: ReactNode; theme: Theme }) {
  return <strong style={{ fontWeight: 700 }}>{children}</strong>;
};

export const EmphasisR = function EmphasisR({ children }: { children?: ReactNode; theme: Theme }) {
  return <em style={{ fontStyle: 'italic' }}>{children}</em>;
};

export const DeleteR = function DeleteR({ children }: { children?: ReactNode; theme: Theme }) {
  return <del style={{ textDecoration: 'line-through' }}>{children}</del>;
};

export const InlineCodeR = memo(function InlineCodeR({
  node,
  theme,
}: {
  node: InlineCodeNode;
  theme: Theme;
}) {
  return (
    <code
      style={{
        fontFamily: theme.typography.monoFamily,
        fontSize: '0.9em',
        backgroundColor: theme.colors.codeBackground,
        color: theme.colors.codeText,
        padding: '1px 6px',
        borderRadius: theme.radii.sm,
      }}
    >
      {node.value}
    </code>
  );
}, memoEqual);

export const CodeR = memo(function CodeR({ node, theme }: { node: CodeNode; theme: Theme }) {
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <HScroll style={{ margin: `${theme.spacing.sm}px 0` }}>
      <pre
        className={className}
        style={{
          margin: 0,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.codeBackground,
          color: theme.colors.codeText,
          borderRadius: theme.radii.md,
          fontFamily: theme.typography.monoFamily,
          fontSize: theme.typography.sizeSmall,
          minWidth: 'fit-content',
          ...(userStyle as CSSProperties | undefined),
        }}
      >
        <code>{node.value}</code>
      </pre>
    </HScroll>
  );
}, memoEqual);

export const BlockquoteR = memo(function BlockquoteR({
  node,
  children,
  theme,
}: {
  node: BlockquoteNode;
  children?: ReactNode;
  theme: Theme;
}) {
  const rtl = node.dir === 'rtl';
  const borderStyle: CSSProperties = rtl
    ? { borderRight: `4px solid ${theme.colors.blockquoteBar}`, paddingRight: theme.spacing.md }
    : { borderLeft: `4px solid ${theme.colors.blockquoteBar}`, paddingLeft: theme.spacing.md };
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <blockquote
      dir={node.dir}
      className={className}
      style={{
        margin: `${theme.spacing.sm}px 0`,
        color: theme.colors.textMuted,
        ...borderStyle,
        ...(userStyle as CSSProperties | undefined),
      }}
    >
      {children}
    </blockquote>
  );
}, memoEqual);

export const ListR = memo(function ListR({
  node,
  children,
  theme,
}: {
  node: ListNode;
  children?: ReactNode;
  theme: Theme;
}) {
  const Tag = node.ordered ? 'ol' : 'ul';
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <Tag
      start={node.start}
      className={className}
      style={{
        margin: `${theme.spacing.sm}px 0`,
        paddingInlineStart: theme.spacing.xl,
        color: theme.colors.text,
        ...(userStyle as CSSProperties | undefined),
      }}
    >
      {children}
    </Tag>
  );
}, memoEqual);

export const ListItemR = memo(function ListItemR({
  node,
  children,
  theme,
}: {
  node: ListItemNode;
  children?: ReactNode;
  theme: Theme;
}) {
  const { style: userStyle, className } = useBlockStyle(node);
  if (node.checked !== undefined && node.checked !== null) {
    return (
      <li
        dir={node.dir}
        className={className}
        style={{
          listStyle: 'none',
          marginInlineStart: -theme.spacing.lg,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          ...(userStyle as CSSProperties | undefined),
        }}
      >
        <input
          type="checkbox"
          checked={node.checked}
          readOnly
          style={{ marginTop: 6, flexShrink: 0, accentColor: theme.colors.accent }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </li>
    );
  }
  return (
    <li dir={node.dir} className={className} style={userStyle as CSSProperties | undefined}>
      {children}
    </li>
  );
}, memoEqual);

export const LinkR = memo(function LinkR({
  node,
  children,
  theme,
}: {
  node: LinkNode;
  children?: ReactNode;
  theme: Theme;
}) {
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <a
      href={node.url}
      title={node.title}
      className={className}
      style={{
        color: theme.colors.link,
        textDecoration: 'underline',
        ...(userStyle as CSSProperties | undefined),
      }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}, memoEqual);

export const ImageR = memo(function ImageR({ node }: { node: ImageNode; theme: Theme }) {
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <img
      src={node.url}
      alt={node.alt}
      title={node.title}
      className={className}
      style={{ maxWidth: '100%', ...(userStyle as CSSProperties | undefined) }}
    />
  );
}, memoEqual);

export const ThematicBreakR = memo(
  function ThematicBreakR({ node, theme }: { node: BaseNode; theme: Theme }) {
    const { style: userStyle, className } = useBlockStyle(node as unknown as AnyNode);
    return (
      <hr
        className={className}
        style={{
          border: 0,
          borderTop: `1px solid ${theme.colors.border}`,
          margin: `${theme.spacing.lg}px 0`,
          ...(userStyle as CSSProperties | undefined),
        }}
      />
    );
  },
  (a, b) => a.node.id === b.node.id && a.theme === b.theme
);

export const TableR = memo(function TableR({
  node,
  children,
  theme,
}: {
  node: TableNode;
  children?: ReactNode;
  theme: Theme;
}) {
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <HScroll style={{ margin: `${theme.spacing.sm}px 0` }}>
      <table
        className={className}
        style={{
          borderCollapse: 'collapse',
          minWidth: '100%',
          color: theme.colors.text,
          fontSize: theme.typography.sizeBase,
          ...(userStyle as CSSProperties | undefined),
        }}
      >
        <tbody>{children}</tbody>
      </table>
    </HScroll>
  );
}, memoEqual);

export const TableRowR = memo(function TableRowR({
  children,
}: {
  node: TableRowNode;
  children?: ReactNode;
  theme: Theme;
}) {
  return <tr>{children}</tr>;
}, memoEqual);

export const TableCellR = memo(function TableCellR({
  node,
  children,
  theme,
}: {
  node: TableCellNode;
  children?: ReactNode;
  theme: Theme;
}) {
  const Tag = node.header ? 'th' : 'td';
  const { style: userStyle, className } = useBlockStyle(node);
  return (
    <Tag
      className={className}
      style={{
        border: `1px solid ${theme.colors.border}`,
        padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
        textAlign: 'start',
        fontWeight: node.header ? 600 : 400,
        whiteSpace: 'nowrap',
        ...(userStyle as CSSProperties | undefined),
      }}
    >
      {children}
    </Tag>
  );
}, memoEqual);

export const BreakR = memo(function BreakR() {
  return <br />;
});

export const HtmlR = memo(
  function HtmlR({ node }: { node: { value: string }; theme: Theme }) {
    return <div dangerouslySetInnerHTML={{ __html: node.value }} />;
  },
  (a, b) => a.node.value === b.node.value
);

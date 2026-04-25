import type { AnyNode, DirectiveComponentProps } from 'llm-markdown/web';

function extractPlainText(nodes: readonly AnyNode[] | undefined): string {
  if (!nodes) return '';
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text') {
      out += (n as { value: string }).value ?? '';
    } else if (n.type === 'break') {
      out += '\n';
    } else if (n.type === 'inlineCode' || n.type === 'code') {
      out += (n as { value: string }).value ?? '';
    } else if ('children' in n && Array.isArray((n as { children?: unknown }).children)) {
      const inner = extractPlainText((n as { children: AnyNode[] }).children);
      if (n.type === 'paragraph' || n.type === 'heading' || n.type === 'blockquote') {
        out += inner + '\n\n';
      } else if (n.type === 'listItem') {
        out += '- ' + inner.trimEnd() + '\n';
      } else {
        out += inner;
      }
    }
  }
  return out;
}

export function EmailDom({ node, attributes, children, theme }: DirectiveComponentProps) {
  const to = typeof attributes.to === 'string' ? attributes.to : '';
  const subject = typeof attributes.subject === 'string' ? attributes.subject : '';
  const body = extractPlainText(node.children as readonly AnyNode[]).trimEnd();
  const mailto =
    `mailto:${encodeURIComponent(to)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  const smallSize = theme.typography.sizeSmall;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.md,
        margin: `${theme.spacing.sm}px 0`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, color: theme.colors.textMuted }}>✉︎</span>
        <span
          style={{
            color: theme.colors.textMuted,
            fontSize: smallSize,
            fontWeight: 600,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Email draft
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Row label="To" value={to} fallback="(missing)" mono theme={theme} />
        <Row label="Subject" value={subject} fallback="(none)" bold theme={theme} />
      </div>

      <div
        style={{
          borderTop: `1px solid ${theme.colors.border}`,
          paddingTop: theme.spacing.sm,
        }}
      >
        {children}
      </div>

      <a
        href={mailto}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.accent,
          color: '#ffffff',
          fontWeight: 600,
          fontSize: smallSize,
          textDecoration: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>✉︎</span>
        Open in email client
      </a>
    </div>
  );
}

function Row({
  label,
  value,
  fallback,
  bold,
  mono,
  theme,
}: {
  label: string;
  value: string;
  fallback: string;
  bold?: boolean;
  mono?: boolean;
  theme: DirectiveComponentProps['theme'];
}) {
  const empty = !value;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span
        style={{
          width: 64,
          flexShrink: 0,
          color: theme.colors.textMuted,
          fontSize: theme.typography.sizeSmall,
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          color: empty ? theme.colors.textMuted : theme.colors.text,
          fontSize: theme.typography.sizeSmall,
          fontWeight: bold && !empty ? 600 : 400,
          fontFamily: mono && !empty ? theme.typography.monoFamily : undefined,
          fontStyle: empty ? 'italic' : 'normal',
        }}
      >
        {empty ? fallback : value}
      </span>
    </div>
  );
}

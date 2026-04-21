import type { AnyNode, DirectiveComponentProps } from 'llm-markdown/web';

/** Walk the directive's AST children and flatten them into plain text
 *  suitable for a `mailto:` URL body. Preserves paragraph and blockquote
 *  breaks with blank lines, list-items with newlines, hard breaks with `\n`. */
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

export function Email({ node, attributes, children, theme }: DirectiveComponentProps) {
  const to = typeof attributes.to === 'string' ? attributes.to : '';
  const subject = typeof attributes.subject === 'string' ? attributes.subject : '';
  const body = extractPlainText(node.children as readonly AnyNode[]).trimEnd();
  const mailto =
    `mailto:${encodeURIComponent(to)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: theme.colors.textMuted,
          fontSize: theme.typography.sizeSmall,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        <EnvelopeIcon />
        <span>Email draft</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr',
          rowGap: 4,
          columnGap: 8,
          fontSize: theme.typography.sizeSmall,
          color: theme.colors.text,
        }}
      >
        <span style={{ color: theme.colors.textMuted }}>To</span>
        <span style={{ fontFamily: theme.typography.monoFamily, wordBreak: 'break-all' }}>
          {to || <em style={{ color: theme.colors.textMuted }}>(missing)</em>}
        </span>
        <span style={{ color: theme.colors.textMuted }}>Subject</span>
        <span style={{ fontWeight: 600 }}>
          {subject || <em style={{ color: theme.colors.textMuted, fontWeight: 400 }}>(none)</em>}
        </span>
      </div>

      <div
        style={{
          borderTop: `1px solid ${theme.colors.border}`,
          paddingTop: theme.spacing.sm,
          color: theme.colors.text,
        }}
      >
        {children}
      </div>

      <a
        href={mailto}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.accent,
          color: '#ffffff',
          fontSize: theme.typography.sizeSmall,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        <EnvelopeIcon color="#ffffff" />
        Open in email client
      </a>
    </div>
  );
}

function EnvelopeIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <path d="M3 7l9 6 9-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

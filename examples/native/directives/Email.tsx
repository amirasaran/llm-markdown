import { Linking, Pressable, Text, View } from 'react-native';
import type { AnyNode, DirectiveComponentProps } from 'llm-markdown/native';

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
    <View
      style={{
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
        marginVertical: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Envelope color={theme.colors.textMuted} />
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.typography.sizeSmall,
            fontWeight: '600',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Email draft
        </Text>
      </View>

      <View style={{ gap: 4 }}>
        <Row label="To" value={to} fallback="(missing)" mono theme={theme} />
        <Row label="Subject" value={subject} fallback="(none)" bold theme={theme} />
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: theme.spacing.sm,
        }}
      >
        {children}
      </View>

      <Pressable
        onPress={() => Linking.openURL(mailto)}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.accent,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Envelope color="#ffffff" />
        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: theme.typography.sizeSmall }}>
          Open in email client
        </Text>
      </Pressable>
    </View>
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
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <Text
        style={{
          width: 64,
          color: theme.colors.textMuted,
          fontSize: theme.typography.sizeSmall,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          color: empty ? theme.colors.textMuted : theme.colors.text,
          fontSize: theme.typography.sizeSmall,
          fontWeight: bold && !empty ? '600' : '400',
          fontFamily: mono && !empty ? theme.typography.monoFamily : undefined,
          fontStyle: empty ? 'italic' : 'normal',
        }}
      >
        {empty ? fallback : value}
      </Text>
    </View>
  );
}

function Envelope({ color }: { color: string }) {
  // SVG isn't available without an extra peer dep (react-native-svg). We
  // lean on a unicode envelope glyph for zero-dep visual parity.
  return <Text style={{ fontSize: 14, color }}>✉︎</Text>;
}

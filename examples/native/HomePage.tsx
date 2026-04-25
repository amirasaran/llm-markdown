import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick } from './theme';
import type { Route } from './types';

interface HomeSectionDef {
  title: string;
  subtitle: string;
  cards: Array<{
    title: string;
    description: string;
    route: Route;
    accent: string;
  }>;
}

const SECTIONS: HomeSectionDef[] = [
  {
    title: 'LLMMarkdown Native',
    subtitle:
      'The default renderer — native views, text selection via LLMSelectableTextView, full directive and block-slot support.',
    cards: [
      {
        title: 'Playground',
        description: 'Presets, streaming controls, live block-style editor.',
        route: 'playground',
        accent: '#6366F1',
      },
      {
        title: 'Chat',
        description: 'Streaming assistant messages with directives (Chart, Callout, Email).',
        route: 'chat',
        accent: '#059669',
      },
    ],
  },
  {
    title: 'LLMMarkdownDom (Expo DOM)',
    subtitle:
      'Web renderer running inside a WebView via Expo DOM. Same props shape, serializable props only. HTML directive auto-registered.',
    cards: [
      {
        title: 'Playground',
        description: 'Web renderer in a WebView. Try the :::html directive preset.',
        route: 'dom',
        accent: '#A855F7',
      },
      {
        title: 'Chat',
        description: 'Assistant messages rendered as per-message DOM components.',
        route: 'chat-dom',
        accent: '#DB2777',
      },
    ],
  },
];

export function HomePage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const [dark, setDark] = useState(false);
  const c = pick(dark);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.page }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: c.headerBg,
          borderBottomColor: c.headerBorder,
          borderBottomWidth: 1,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.6,
              color: c.textMuted,
              textTransform: 'uppercase',
            }}
          >
            Demo
          </Text>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>llm-markdown</Text>
        </View>
        <Pressable
          onPress={() => setDark((v) => !v)}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: c.sidebarBorder,
            backgroundColor: dark ? '#1F1F27' : '#ffffff',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: c.text, fontSize: 12 }}>{dark ? '☀︎ Light' : '☾ Dark'}</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL('https://github.com/amirasaran/llm-markdown')}
          accessibilityLabel="Open GitHub"
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.sidebarBorder,
            backgroundColor: dark ? '#1F1F27' : '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>★</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: c.text, fontSize: 24, fontWeight: '700' }}>
            Pick a renderer
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 14 }}>
            Two ways to render streaming markdown in React Native. Same props where possible —
            the DOM variant trades serializable props for a real web renderer in a WebView.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={{ gap: 12 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>
                {section.title}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18 }}>
                {section.subtitle}
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {section.cards.map((card) => (
                <DemoCard
                  key={card.route}
                  title={card.title}
                  description={card.description}
                  accent={card.accent}
                  dark={dark}
                  onPress={() => onNavigate(card.route)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function DemoCard({
  title,
  description,
  accent,
  dark,
  onPress,
}: {
  title: string;
  description: string;
  accent: string;
  dark: boolean;
  onPress: () => void;
}) {
  const c = pick(dark);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: c.sidebarBorder,
        backgroundColor: dark ? '#14141A' : '#ffffff',
        opacity: pressed ? 0.85 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      })}
    >
      <View
        style={{
          width: 6,
          alignSelf: 'stretch',
          borderRadius: 3,
          backgroundColor: accent,
        }}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18 }}>{description}</Text>
      </View>
      <Text style={{ color: c.textMuted, fontSize: 20, fontWeight: '300' }}>›</Text>
    </Pressable>
  );
}

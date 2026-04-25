import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme } from 'llm-markdown/native';
import RichDom from './dom/RichDom';
import { presets } from '../shared/demo-content';
import { pick } from './theme';

export function DomPlayground({ onBack }: { onBack: () => void }) {
  const [dark, setDark] = useState(false);
  const [presetId, setPresetId] = useState('html');
  const preset = useMemo(() => presets.find((p) => p.id === presetId) ?? presets[0]!, [presetId]);
  const source = preset.text;
  const [streaming, setStreaming] = useState(true);
  const [text, setText] = useState('');
  const [restartToken, setRestartToken] = useState(0);
  const progressRef = useRef(0);

  const c = pick(dark);

  useEffect(() => {
    if (!streaming) {
      setText(source);
      return;
    }
    setText('');
    progressRef.current = 0;
    const id = setInterval(() => {
      progressRef.current += 14;
      if (progressRef.current >= source.length) {
        setText(source);
        clearInterval(id);
      } else {
        setText(source.slice(0, progressRef.current));
      }
    }, 25);
    return () => clearInterval(id);
  }, [source, streaming, restartToken]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.page }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: c.headerBg,
          borderBottomColor: c.headerBorder,
          borderBottomWidth: 1,
        }}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: c.headerBorder,
            backgroundColor: dark ? '#1F1F27' : '#ffffff',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: c.text, fontSize: 13 }}>← Home</Text>
        </Pressable>
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
            LLMMarkdownDom
          </Text>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>
            Web renderer in WebView
          </Text>
        </View>
      </View>

      <View
        style={{
          padding: 12,
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: c.headerBorder,
          backgroundColor: c.sidebarBg,
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {presets.map((p) => {
              const active = p.id === presetId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPresetId(p.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? c.accent : c.sidebarBorder,
                    backgroundColor: active ? c.accent : dark ? '#1F1F27' : '#ffffff',
                  }}
                >
                  <Text style={{ color: active ? '#ffffff' : c.text, fontSize: 12 }}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Toggle label="Streaming" value={streaming} onChange={setStreaming} dark={dark} />
          <Toggle label="Dark" value={dark} onChange={setDark} dark={dark} />
          <Btn
            label="Restart"
            onPress={() => {
              progressRef.current = 0;
              setText('');
              setRestartToken((n) => n + 1);
            }}
            dark={dark}
          />
          <Btn label="Skip to end" onPress={() => setText(source)} dark={dark} />
        </View>
        <Text style={{ color: c.textMuted, fontSize: 11, lineHeight: 16 }}>
          {text.length} / {source.length} chars · <Text style={{ fontWeight: '700' }}>:::html</Text>{' '}
          directive auto-registered by LLMMarkdownDom
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <RichDom
          text={text}
          streaming={streaming}
          direction="auto"
          theme={dark ? darkTheme : undefined}
          textSelection={{ enabled: true, actions: ['Ask AI', 'Quote', 'Share'] }}
          onTextSelectionAction={async (label, selectedText) => {
            if (label === 'Ask AI') Alert.alert('Ask AI', selectedText);
            else if (label === 'Quote') Alert.alert('Quoted', selectedText);
            else if (label === 'Share') await Share.share({ message: selectedText });
          }}
          blockSlots={{
            code: { actions: ['Copy', 'Run'] },
            table: { actions: ['Export CSV'] },
          }}
          onBlockAction={async (blockType, label, node) => {
            if (blockType === 'code' && label === 'Copy') {
              Alert.alert('Copied code', node.value ?? '');
            } else if (blockType === 'code' && label === 'Run') {
              Alert.alert(`Run ${node.lang ?? 'code'}`, node.value ?? '');
            } else if (blockType === 'table' && label === 'Export CSV') {
              Alert.alert('Export CSV', 'Table: ' + (node.id ?? ''));
            }
          }}
          dom={{ matchContents: false, scrollEnabled: true, style: { flex: 1 } }}
        />
      </View>
    </SafeAreaView>
  );
}

function Toggle({
  label,
  value,
  onChange,
  dark,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  dark: boolean;
}) {
  const c = pick(dark);
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: value ? c.accent : c.sidebarBorder,
        backgroundColor: value ? c.accent : dark ? '#1F1F27' : '#ffffff',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: value ? '#ffffff' : c.text, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: value ? '#ffffff' : c.textMuted, fontSize: 11, fontWeight: '700' }}>
        {value ? 'ON' : 'OFF'}
      </Text>
    </Pressable>
  );
}

function Btn({ label, onPress, dark }: { label: string; onPress: () => void; dark: boolean }) {
  const c = pick(dark);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: c.sidebarBorder,
        backgroundColor: dark ? '#1F1F27' : '#ffffff',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: c.text, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

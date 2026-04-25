import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LLMMarkdown, darkTheme } from 'llm-markdown/native';
import type { BlockSlots, BlockStyles, DirectiveRegistry } from 'llm-markdown/native';
import { presets } from '../shared/demo-content';
import { Chart } from './directives/Chart';
import { Callout } from './directives/Callout';
import { Email } from './directives/Email';
import { DEFAULT_SETTINGS, type Settings } from './types';
import { pick } from './theme';
import { Drawer } from './Drawer';
import { SettingsPanel } from './SettingsPanel';

export function Playground({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetId, setPresetId] = useState(presets[0]!.id);
  const preset = useMemo(() => presets.find((p) => p.id === presetId) ?? presets[0]!, [presetId]);
  const [customText, setCustomText] = useState<string | null>(null);
  const source = customText ?? preset.text;
  const [streaming, setStreaming] = useState(true);
  const [text, setText] = useState('');
  const [restartToken, setRestartToken] = useState(0);
  const progressRef = useRef(0);

  const c = pick(settings.dark);

  const patch = useCallback((p: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...p }));
  }, []);

  useEffect(() => {
    if (!streaming) {
      setText(source);
      return;
    }
    setText('');
    progressRef.current = 0;
    const id = setInterval(() => {
      progressRef.current += settings.charsPerTick;
      if (progressRef.current >= source.length) {
        setText(source);
        clearInterval(id);
      } else {
        setText(source.slice(0, progressRef.current));
      }
    }, settings.tickMs);
    return () => clearInterval(id);
  }, [source, streaming, settings.charsPerTick, settings.tickMs, restartToken]);

  const directives: DirectiveRegistry = useMemo(
    () => ({ chart: Chart, callout: Callout, email: Email }),
    []
  );

  // Demo: per-block toolbars. Using Alert / Share for demo output since
  // we're not pulling in @react-native-clipboard/clipboard.
  const blockSlots: BlockSlots = useMemo(
    () => ({
      code: {
        actions: [
          { label: 'Copy', onPress: (node) => Alert.alert('Copied code', node.value) },
          { label: 'Run', onPress: (node) => Alert.alert(`Run ${node.lang ?? 'code'}`, node.value) },
        ],
      },
      table: {
        actions: [
          {
            label: 'Export CSV',
            onPress: (node) => {
              const csv = node.children
                .map((row) =>
                  row.children
                    .map((cell) =>
                      cell.children
                        .map((c) => ('value' in c ? String((c as { value: unknown }).value) : ''))
                        .join('')
                    )
                    .join(',')
                )
                .join('\n');
              void Share.share({ message: csv });
            },
          },
        ],
      },
      image: {
        actions: [
          { label: 'Open', onPress: (node) => void Share.share({ url: node.url, message: node.url }) },
        ],
      },
    }),
    []
  );

  // Editable block-style state. Rendered as a sidebar panel; toggle per
  // block, edit fields live.
  const [bsHeading, setBsHeading] = useState({
    enabled: true,
    color: '#6366F1',
    fontSize: 32,
  });
  const [bsParagraph, setBsParagraph] = useState({
    enabled: false,
    color: '#111827',
    fontSize: 16,
  });
  const [bsCode, setBsCode] = useState({
    enabled: true,
    background: '#4B5563',
    padding: 14,
    borderRadius: 10,
  });
  const [bsBlockquote, setBsBlockquote] = useState({
    enabled: true,
    color: '#6B7280',
    fontStyle: 'italic' as 'normal' | 'italic',
  });
  const [bsTable, setBsTable] = useState({
    enabled: false,
    borderColor: '#E5E7EB',
    borderRadius: 6,
  });
  const [bsTableCell, setBsTableCell] = useState({
    enabled: false,
    padding: 10,
  });
  const [bsList, setBsList] = useState({
    enabled: false,
    paddingLeft: 12,
  });

  const blockStylesDemo: BlockStyles = useMemo(() => {
    const out: BlockStyles = {};
    if (bsHeading.enabled) {
      out.heading = { style: { color: safeColor(bsHeading.color), fontSize: bsHeading.fontSize } };
    }
    if (bsParagraph.enabled) {
      out.paragraph = {
        style: { color: safeColor(bsParagraph.color), fontSize: bsParagraph.fontSize },
      };
    }
    if (bsCode.enabled) {
      out.code = {
        style: {
          backgroundColor: safeColor(bsCode.background),
          padding: bsCode.padding,
          borderRadius: bsCode.borderRadius,
        },
      };
    }
    if (bsBlockquote.enabled) {
      out.blockquote = {
        style: { color: safeColor(bsBlockquote.color), fontStyle: bsBlockquote.fontStyle },
      };
    }
    if (bsTable.enabled) {
      out.table = {
        style: { borderColor: safeColor(bsTable.borderColor), borderRadius: bsTable.borderRadius },
      };
    }
    if (bsTableCell.enabled) {
      out.tableCell = {
        style: { padding: bsTableCell.padding },
      };
    }
    if (bsList.enabled) {
      out.list = {
        style: { paddingLeft: bsList.paddingLeft },
      };
    }
    return out;
  }, [bsHeading, bsParagraph, bsCode, bsBlockquote, bsTable, bsTableCell, bsList]);

  const progressPct =
    source.length === 0 ? 100 : Math.min(100, (text.length / source.length) * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.page }}>
      <Header dark={settings.dark} onOpenSidebar={() => setDrawerOpen(true)} onBack={onBack} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={panelStyle(settings.dark)}>
          <SectionTitle dark={settings.dark}>Preset</SectionTitle>
          <Chips
            options={presets.map((p) => ({ id: p.id, label: p.label }))}
            value={customText === null ? presetId : null}
            onChange={(id) => {
              setPresetId(id);
              setCustomText(null);
            }}
            dark={settings.dark}
          />

          <SectionTitle dark={settings.dark}>Custom markdown</SectionTitle>
          <TextInput
            value={customText ?? ''}
            placeholder="Paste your own markdown here…"
            placeholderTextColor={c.textMuted}
            multiline
            onChangeText={setCustomText}
            style={{
              minHeight: 90,
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: c.sidebarBorder,
              color: c.text,
              fontFamily: 'Menlo',
              fontSize: 12,
              textAlignVertical: 'top',
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn label="Load preset" onPress={() => setCustomText(preset.text)} dark={settings.dark} />
            <Btn label="Clear" onPress={() => setCustomText(null)} dark={settings.dark} />
          </View>

          <SectionTitle dark={settings.dark}>Streaming</SectionTitle>
          <ToggleRow
            label="Enable streaming"
            value={streaming}
            onChange={setStreaming}
            dark={settings.dark}
          />
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            Speed controls live in the Settings drawer (≡).
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            ~ {Math.round((settings.charsPerTick * 1000) / settings.tickMs)} chars/sec
          </Text>
          <View
            style={{
              height: 6,
              backgroundColor: settings.dark ? '#1F1F27' : '#E5E7EB',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: c.accent }} />
          </View>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            {text.length} / {source.length} chars
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn
              label="Restart"
              onPress={() => {
                progressRef.current = 0;
                setText('');
                setRestartToken((n) => n + 1);
              }}
              dark={settings.dark}
            />
            <Btn label="Skip to end" onPress={() => setText(source)} dark={settings.dark} />
          </View>
        </View>

        <View style={panelStyle(settings.dark)}>
          <SectionTitle dark={settings.dark}>Block styles</SectionTitle>
          <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 4 }}>
            Merged over default renderers. Toggle + tweak live.
          </Text>
          <BlockStyleRow
            label="heading"
            enabled={bsHeading.enabled}
            onToggle={(v) => setBsHeading((s) => ({ ...s, enabled: v }))}
            dark={settings.dark}
            fields={[
              {
                key: 'color',
                label: 'color',
                kind: 'color',
                value: bsHeading.color,
                onChange: (v) => setBsHeading((s) => ({ ...s, color: v })),
              },
              {
                key: 'fontSize',
                label: 'font-size',
                kind: 'number',
                value: bsHeading.fontSize,
                onChange: (v) => setBsHeading((s) => ({ ...s, fontSize: v })),
              },
            ]}
          />
          <BlockStyleRow
            label="paragraph"
            enabled={bsParagraph.enabled}
            onToggle={(v) => setBsParagraph((s) => ({ ...s, enabled: v }))}
            dark={settings.dark}
            fields={[
              {
                key: 'color',
                label: 'color',
                kind: 'color',
                value: bsParagraph.color,
                onChange: (v) => setBsParagraph((s) => ({ ...s, color: v })),
              },
              {
                key: 'fontSize',
                label: 'font-size',
                kind: 'number',
                value: bsParagraph.fontSize,
                onChange: (v) => setBsParagraph((s) => ({ ...s, fontSize: v })),
              },
            ]}
          />
          <BlockStyleRow
            label="code"
            enabled={bsCode.enabled}
            onToggle={(v) => setBsCode((s) => ({ ...s, enabled: v }))}
            dark={settings.dark}
            fields={[
              {
                key: 'background',
                label: 'background',
                kind: 'color',
                value: bsCode.background,
                onChange: (v) => setBsCode((s) => ({ ...s, background: v })),
              },
              {
                key: 'padding',
                label: 'padding',
                kind: 'number',
                value: bsCode.padding,
                onChange: (v) => setBsCode((s) => ({ ...s, padding: v })),
              },
              {
                key: 'borderRadius',
                label: 'radius',
                kind: 'number',
                value: bsCode.borderRadius,
                onChange: (v) => setBsCode((s) => ({ ...s, borderRadius: v })),
              },
            ]}
          />
          <BlockStyleRow
            label="blockquote"
            enabled={bsBlockquote.enabled}
            onToggle={(v) => setBsBlockquote((s) => ({ ...s, enabled: v }))}
            dark={settings.dark}
            fields={[
              {
                key: 'color',
                label: 'color',
                kind: 'color',
                value: bsBlockquote.color,
                onChange: (v) => setBsBlockquote((s) => ({ ...s, color: v })),
              },
              {
                key: 'fontStyle',
                label: 'font-style',
                kind: 'select',
                value: bsBlockquote.fontStyle,
                options: ['normal', 'italic'],
                onChange: (v) =>
                  setBsBlockquote((s) => ({ ...s, fontStyle: v as 'normal' | 'italic' })),
              },
            ]}
          />
          <BlockStyleRow
            label="table"
            enabled={bsTable.enabled}
            onToggle={(v) => setBsTable((s) => ({ ...s, enabled: v }))}
            dark={settings.dark}
            fields={[
              {
                key: 'borderColor',
                label: 'border color',
                kind: 'color',
                value: bsTable.borderColor,
                onChange: (v) => setBsTable((s) => ({ ...s, borderColor: v })),
              },
              {
                key: 'borderRadius',
                label: 'radius',
                kind: 'number',
                value: bsTable.borderRadius,
                onChange: (v) => setBsTable((s) => ({ ...s, borderRadius: v })),
              },
            ]}
          />
          <BlockStyleRow
            label="tableCell"
            enabled={bsTableCell.enabled}
            onToggle={(v) => setBsTableCell((s) => ({ ...s, enabled: v }))}
            dark={settings.dark}
            fields={[
              {
                key: 'padding',
                label: 'padding',
                kind: 'number',
                value: bsTableCell.padding,
                onChange: (v) => setBsTableCell((s) => ({ ...s, padding: v })),
              },
            ]}
          />
          <BlockStyleRow
            label="list"
            enabled={bsList.enabled}
            onToggle={(v) => setBsList((s) => ({ ...s, enabled: v }))}
            dark={settings.dark}
            fields={[
              {
                key: 'paddingLeft',
                label: 'indent (px)',
                kind: 'number',
                value: bsList.paddingLeft,
                onChange: (v) => setBsList((s) => ({ ...s, paddingLeft: v })),
              },
            ]}
          />
        </View>

        <LLMMarkdown
          text={text}
          streaming={streaming}
          directives={directives}
          theme={settings.dark ? darkTheme : undefined}
          direction={settings.direction}
          textSelection={{
            enabled: true,
            actions: [
              { label: 'Ask AI', onPress: (t) => Alert.alert('Ask AI', t) },
              { label: 'Quote', onPress: (t) => Alert.alert('Quoted', t) },
              { label: 'Share', onPress: (t) => Share.share({ message: t }) },
            ],
          }}
          image={{
            onPress: (node) => Alert.alert('Image tap', node.url),
            onLongPress: (node) => Alert.alert('Image long-press', node.url),
          }}
          blockSlots={blockSlots}
          blockStyles={blockStylesDemo}
          card={{ animation: settings.animation, layoutAnimation: settings.layoutAnimation }}
          header={
            settings.showHeader ? (
              <Text style={{ fontSize: 12, color: c.textMuted, fontWeight: '600' }}>
                Thread · April 2026
              </Text>
            ) : undefined
          }
          before={
            settings.showBefore ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: c.textMuted }}>Assistant message</Text>
                <Text style={{ fontSize: 12, color: c.textMuted }}>
                  streaming {streaming ? 'on' : 'off'}
                </Text>
              </View>
            ) : undefined
          }
          after={
            settings.showAfter ? (
              <Text style={{ fontSize: 12, color: c.textMuted, fontStyle: 'italic' }}>
                Rendered by llm-markdown
              </Text>
            ) : undefined
          }
          footer={
            settings.showFooter ? (
              <Text style={{ fontSize: 12, color: c.textMuted }}>3 citations · ⭐ · ⤵︎</Text>
            ) : undefined
          }
        />

      </ScrollView>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Settings"
        dark={settings.dark}
      >
        <SettingsPanel settings={settings} onChange={patch} />
      </Drawer>
    </SafeAreaView>
  );
}

function Header({
  dark,
  onOpenSidebar,
  onBack,
}: {
  dark: boolean;
  onOpenSidebar: () => void;
  onBack: () => void;
}) {
  const c = pick(dark);
  return (
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
        onPress={onOpenSidebar}
        accessibilityLabel="Open settings"
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: c.headerBorder,
          backgroundColor: dark ? '#1F1F27' : '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: c.text, fontSize: 18, lineHeight: 20 }}>≡</Text>
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
          Playground
        </Text>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>llm-markdown</Text>
      </View>
      <Pressable
        onPress={() => Linking.openURL('https://github.com/amirasaran/llm-markdown')}
        accessibilityLabel="View llm-markdown on GitHub"
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: c.headerBorder,
          backgroundColor: dark ? '#1F1F27' : '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>★</Text>
      </Pressable>
      <Pressable
        onPress={onBack}
        accessibilityLabel="Back to home"
        style={({ pressed }) => ({
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: c.sidebarBorder,
          backgroundColor: dark ? '#1F1F27' : '#ffffff',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>← Home</Text>
      </Pressable>
    </View>
  );
}

/* ---------- UI primitives ---------- */

function panelStyle(dark: boolean) {
  const c = pick(dark);
  return {
    backgroundColor: c.sidebarBg,
    borderColor: c.sidebarBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  };
}

function SectionTitle({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  const c = pick(dark);
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: c.textMuted,
        marginTop: 4,
      }}
    >
      {children}
    </Text>
  );
}

function ToggleRow({
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: c.text, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: value ? c.accent : c.textMuted, fontWeight: '700' }}>
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
        paddingVertical: 8,
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

function Chips<T extends string>({
  options,
  value,
  onChange,
  dark,
}: {
  options: Array<{ id: T; label: string }>;
  value: T | null;
  onChange: (v: T) => void;
  dark: boolean;
}) {
  const c = pick(dark);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? c.accent : c.sidebarBorder,
                backgroundColor: active ? c.accent : dark ? '#1F1F27' : '#ffffff',
              }}
            >
              <Text
                style={{
                  color: active ? '#ffffff' : c.text,
                  fontSize: 12,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR_RE = /^rgba?\(/i;
function safeColor(v: string): string | undefined {
  if (!v) return undefined;
  if (HEX_COLOR_RE.test(v)) return v;
  if (RGB_COLOR_RE.test(v)) return v;
  return undefined;
}

type NativeBsField =
  | { key: string; label: string; kind: 'color'; value: string; onChange: (v: string) => void }
  | {
      key: string;
      label: string;
      kind: 'number';
      value: number;
      onChange: (v: number) => void;
    }
  | {
      key: string;
      label: string;
      kind: 'select';
      value: string;
      options: string[];
      onChange: (v: string) => void;
    };

function BlockStyleRow({
  label,
  enabled,
  onToggle,
  dark,
  fields,
}: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  dark: boolean;
  fields: NativeBsField[];
}) {
  const c = pick(dark);
  return (
    <View
      style={{
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: c.sidebarBorder,
        backgroundColor: dark ? '#14141A' : '#FAFAFA',
        gap: 8,
      }}
    >
      <ToggleRow label={label} value={enabled} onChange={onToggle} dark={dark} />
      {enabled ? (
        <View style={{ gap: 6 }}>
          {fields.map((f) => (
            <View
              key={f.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ width: 90, color: c.textMuted, fontSize: 12 }}>{f.label}</Text>
              {f.kind === 'color' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: c.sidebarBorder,
                      backgroundColor: safeColor(f.value),
                    }}
                  />
                  <TextInput
                    value={f.value}
                    onChangeText={f.onChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: c.sidebarBorder,
                      borderRadius: 6,
                      color: c.text,
                      fontSize: 12,
                      fontFamily: 'Menlo',
                    }}
                  />
                </View>
              ) : f.kind === 'number' ? (
                <TextInput
                  value={String(f.value)}
                  onChangeText={(t) => {
                    const n = Number(t);
                    if (!isNaN(n)) f.onChange(n);
                  }}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: c.sidebarBorder,
                    borderRadius: 6,
                    color: c.text,
                    fontSize: 12,
                  }}
                />
              ) : (
                <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                  {f.options.map((opt) => {
                    const active = f.value === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => f.onChange(opt)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? c.accent : c.sidebarBorder,
                          backgroundColor: active ? c.accent : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            color: active ? '#ffffff' : c.text,
                            fontSize: 11,
                          }}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

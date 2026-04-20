import { useState } from 'react';
import { Pressable, TextInput, View, Text } from 'react-native';
import { pick } from '../theme';
import { SlashMenu } from './SlashMenu';
import type { SlashCommand } from '../../shared/slash-commands';

export function Composer({
  dark,
  onSend,
  disabled,
}: {
  dark: boolean;
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const c = pick(dark);
  const [value, setValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const autoOpen = value.startsWith('/');

  const send = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    setMenuOpen(false);
  };

  const handlePick = (cmd: SlashCommand) => {
    setValue(cmd.label + ' ');
    setMenuOpen(false);
  };

  return (
    <View
      style={{
        position: 'relative',
        backgroundColor: c.composerBg,
        borderTopColor: c.composerBorder,
        borderTopWidth: 1,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 14,
      }}
    >
      <SlashMenu
        open={menuOpen || (autoOpen && value.trim().length > 0)}
        dark={dark}
        filter={value.startsWith('/') ? value.slice(1) : ''}
        onPick={handlePick}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
          backgroundColor: dark ? '#1F1F27' : '#ffffff',
          borderColor: c.composerBorder,
          borderWidth: 1,
          borderRadius: 24,
          paddingHorizontal: 6,
          paddingVertical: 4,
        }}
      >
        <Pressable
          onPress={() => setMenuOpen((v) => !v)}
          accessibilityLabel="Show example commands"
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: menuOpen ? c.accent : c.composerBorder,
            backgroundColor: menuOpen ? c.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: menuOpen ? '#ffffff' : c.textMuted, fontWeight: '700' }}>/</Text>
        </Pressable>

        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={send}
          placeholder="Message · type /  to see examples"
          placeholderTextColor={c.textMuted}
          multiline
          style={{
            flex: 1,
            color: c.text,
            fontSize: 14,
            paddingHorizontal: 4,
            paddingVertical: 8,
            maxHeight: 140,
            minHeight: 24,
          }}
        />

        <Pressable
          onPress={send}
          disabled={disabled || value.trim().length === 0}
          accessibilityLabel="Send"
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor:
              disabled || value.trim().length === 0
                ? dark
                  ? '#2A2A33'
                  : '#E5E7EB'
                : c.sent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700' }}>➤</Text>
        </Pressable>
      </View>
    </View>
  );
}

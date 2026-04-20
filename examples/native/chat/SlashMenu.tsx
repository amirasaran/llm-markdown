import { Pressable, ScrollView, Text, View } from 'react-native';
import { slashCommands, type SlashCommand } from '../../shared/slash-commands';
import { pick } from '../theme';

export function SlashMenu({
  open,
  dark,
  filter,
  onPick,
}: {
  open: boolean;
  dark: boolean;
  filter?: string;
  onPick: (cmd: SlashCommand) => void;
}) {
  if (!open) return null;
  const c = pick(dark);
  const q = (filter ?? '').toLowerCase();
  const items = q
    ? slashCommands.filter((cmd) => cmd.id.includes(q))
    : slashCommands;

  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 78,
        maxHeight: 320,
        backgroundColor: c.popoverBg,
        borderColor: c.popoverBorder,
        borderWidth: 1,
        borderRadius: 12,
        padding: 6,
        zIndex: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: dark ? 0.5 : 0.15,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <Text
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: c.textMuted,
        }}
      >
        Examples · pick one or type to filter
      </Text>
      {items.length === 0 ? (
        <Text style={{ padding: 10, color: c.textMuted, fontSize: 13 }}>
          No match. Try / to see every example.
        </Text>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled">
          {items.map((cmd) => (
            <Pressable
              key={cmd.id}
              onPress={() => onPick(cmd)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                gap: 10,
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: pressed ? (dark ? '#1F1F27' : '#F3F4F6') : 'transparent',
              })}
            >
              <Text
                style={{
                  fontFamily: 'Menlo',
                  fontSize: 12,
                  color: c.accent,
                  minWidth: 100,
                }}
              >
                {cmd.label}
              </Text>
              <Text style={{ fontSize: 13, color: c.text, flex: 1 }}>
                {cmd.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_SETTINGS, type Settings } from '../types';
import { pick } from '../theme';
import { Drawer } from '../Drawer';
import { SettingsPanel } from '../SettingsPanel';
import { Chat } from './Chat';

export function ChatPage({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const c = pick(settings.dark);

  const patch = useCallback((p: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...p }));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.page }}>
      <View style={{ flex: 1 }}>
        <Chat
          settings={settings}
          onOpenSidebar={() => setDrawerOpen(true)}
          onBack={onBack}
        />
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Settings"
          dark={settings.dark}
        >
          <SettingsPanel settings={settings} onChange={patch} />
        </Drawer>
      </View>
    </SafeAreaView>
  );
}

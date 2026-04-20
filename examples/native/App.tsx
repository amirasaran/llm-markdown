import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Playground } from './Playground';
import { ChatPage } from './chat/ChatPage';
import type { Route } from './types';

export default function App() {
  const [route, setRoute] = useState<Route>('playground');
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {route === 'chat' ? (
        <ChatPage onBack={() => setRoute('playground')} />
      ) : (
        <Playground onOpenChat={() => setRoute('chat')} />
      )}
    </SafeAreaProvider>
  );
}

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Playground } from './Playground';
import { ChatPage } from './chat/ChatPage';
import { ChatDomPage } from './chat/ChatDomPage';
import { DomPlayground } from './DomPlayground';
import { HomePage } from './HomePage';
import type { Route } from './types';

export default function App() {
  const [route, setRoute] = useState<Route>('home');
  const home = () => setRoute('home');
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {route === 'home' ? (
        <HomePage onNavigate={setRoute} />
      ) : route === 'playground' ? (
        <Playground onBack={home} />
      ) : route === 'chat' ? (
        <ChatPage onBack={home} />
      ) : route === 'dom' ? (
        <DomPlayground onBack={home} />
      ) : (
        <ChatDomPage onBack={home} />
      )}
    </SafeAreaProvider>
  );
}

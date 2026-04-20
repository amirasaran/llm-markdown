import { useHashRoute } from './router';
import { Playground } from './playground/Playground';
import { ChatPage } from './chat/ChatPage';
import { DocsPage } from './docs/DocsPage';

export function App() {
  const [route, navigate] = useHashRoute();
  if (route === '/chat') return <ChatPage onBack={() => navigate('/')} onNavigate={navigate} />;
  if (route === '/docs') return <DocsPage onNavigate={navigate} />;
  return <Playground onNavigate={navigate} />;
}

import { useEffect, useState, useCallback } from 'react';

export type Route = '/' | '/chat' | '/docs';

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '');
  if (raw === '/chat') return '/chat';
  if (raw === '/docs') return '/docs';
  return '/';
}

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = useCallback((r: Route) => {
    window.location.hash = r === '/' ? '' : r;
  }, []);
  return [route, navigate];
}

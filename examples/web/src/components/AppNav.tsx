import type { Route } from '../router';

export function AppNav({
  current,
  onNavigate,
  dark,
}: {
  current: Route;
  onNavigate: (r: Route) => void;
  dark: boolean;
}) {
  const muted = dark ? '#9CA3AF' : '#6B7280';
  const border = dark ? '#2A2A33' : '#E5E7EB';
  const bg = dark ? '#1F1F27' : '#ffffff';
  const fg = dark ? '#F3F4F6' : '#111827';

  const items: Array<{ route: Route; label: string }> = [
    { route: '/', label: 'Playground' },
    { route: '/chat', label: 'Chat demo' },
    { route: '/docs', label: 'Docs' },
  ];

  return (
    <nav
      aria-label="Primary"
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: 4,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 999,
        fontSize: 13,
      }}
    >
      {items.map((it) => {
        const active = current === it.route;
        return (
          <button
            key={it.route}
            onClick={() => onNavigate(it.route)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: 0,
              background: active ? '#6366F1' : 'transparent',
              color: active ? '#ffffff' : muted,
              cursor: 'pointer',
              fontWeight: active ? 600 : 500,
              fontFamily: 'inherit',
              fontSize: 13,
              transition: 'background 150ms, color 150ms',
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget.style.color = fg);
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget.style.color = muted);
            }}
          >
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

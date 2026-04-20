import { useCallback, useEffect, useState } from 'react';
import { Chat } from './Chat';
import { SettingsPanel } from './SettingsPanel';
import { DEFAULT_SETTINGS, type ChatSettings } from './types';
import { pick } from './theme';
import { MOBILE_QUERY, useMediaQuery } from '../useMediaQuery';
import type { Route } from '../router';

export function ChatPage({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate?: (r: Route) => void;
}) {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const c = pick(settings.dark);

  const patch = useCallback((p: Partial<ChatSettings>) => {
    setSettings((s) => ({ ...s, ...p }));
  }, []);

  // Close drawer when switching back to desktop width
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: c.page,
        color: c.text,
        overflow: 'hidden',
      }}
    >
      {isMobile ? (
        <>
          {drawerOpen ? (
            <div
              role="presentation"
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                zIndex: 50,
                transition: 'opacity 180ms ease-out',
              }}
            />
          ) : null}
          <aside
            aria-hidden={!drawerOpen}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              width: 'min(320px, 86vw)',
              transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 220ms ease-out',
              background: c.sidebarBg,
              borderRight: `1px solid ${c.sidebarBorder}`,
              zIndex: 60,
              boxShadow: drawerOpen
                ? settings.dark
                  ? '8px 0 32px rgba(0,0,0,0.5)'
                  : '8px 0 32px rgba(0,0,0,0.15)'
                : 'none',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: 8,
                borderBottom: `1px solid ${c.sidebarBorder}`,
              }}
            >
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close settings"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: `1px solid ${c.sidebarBorder}`,
                  background: settings.dark ? '#1F1F27' : '#ffffff',
                  color: c.text,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseIcon />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <SettingsPanel settings={settings} onChange={patch} chrome={false} />
            </div>
          </aside>
        </>
      ) : (
        <SettingsPanel settings={settings} onChange={patch} />
      )}

      <Chat
        settings={settings}
        showHamburger={isMobile}
        onOpenSidebar={() => setDrawerOpen(true)}
        onBack={onBack}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

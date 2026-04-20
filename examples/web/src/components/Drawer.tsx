import { useEffect, type ReactNode } from 'react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Width in px or any CSS length. Capped at 86vw on narrow viewports. */
  width?: string | number;
  dark?: boolean;
}

export function Drawer({ open, onClose, children, width = 320, dark = false }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const w = typeof width === 'number' ? `min(${width}px, 86vw)` : width;

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        aria-hidden={!open}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 180ms ease-out',
          zIndex: 50,
        }}
      />
      <aside
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: w,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 220ms ease-out',
          background: dark ? '#14141A' : '#ffffff',
          borderRight: `1px solid ${dark ? '#2A2A33' : '#E5E7EB'}`,
          boxShadow: open
            ? dark
              ? '8px 0 32px rgba(0,0,0,0.5)'
              : '8px 0 32px rgba(0,0,0,0.15)'
            : 'none',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </aside>
    </>
  );
}

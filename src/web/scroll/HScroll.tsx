import type { CSSProperties, ReactNode } from 'react';

export function HScroll({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        maxWidth: '100%',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

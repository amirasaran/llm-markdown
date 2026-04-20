import type { ReactNode } from 'react';
import { ScrollView } from '../rn';

export function HScroll({ children, style }: { children: ReactNode; style?: unknown }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={style}
      contentContainerStyle={{ alignItems: 'flex-start' }}
    >
      {children}
    </ScrollView>
  );
}

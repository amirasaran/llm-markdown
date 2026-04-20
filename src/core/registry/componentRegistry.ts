import { createContext, useContext } from 'react';
import type { ComponentOverrides, DirectiveRegistry, Theme } from '../../shared/types';
import { defaultTheme } from './theme';

export interface RendererContextValue {
  components: ComponentOverrides;
  directives: DirectiveRegistry;
  theme: Theme;
  direction: 'auto' | 'ltr' | 'rtl';
  onHeadingInView?: (id: string, depth: number, text: string) => void;
}

export const RendererContext = createContext<RendererContextValue>({
  components: {},
  directives: {},
  theme: defaultTheme,
  direction: 'auto',
});

export function useRenderer(): RendererContextValue {
  return useContext(RendererContext);
}

export function mergeComponents(
  base: ComponentOverrides,
  override?: ComponentOverrides
): ComponentOverrides {
  if (!override) return base;
  return { ...base, ...override };
}

import { createContext, useContext } from 'react';
import type {
  BlockSlots,
  BlockStyles,
  ComponentOverrides,
  DirectiveRegistry,
  ImageConfig,
  TextSelectionConfig,
  Theme,
} from '../../shared/types';
import { DISABLED_TEXT_SELECTION } from '../textSelection';
import { defaultTheme } from './theme';

export interface RendererContextValue {
  components: ComponentOverrides;
  directives: DirectiveRegistry;
  theme: Theme;
  direction: 'auto' | 'ltr' | 'rtl';
  textSelection: TextSelectionConfig;
  blockSlots: BlockSlots;
  blockStyles: BlockStyles;
  image: ImageConfig;
  onHeadingInView?: (id: string, depth: number, text: string) => void;
}

export const RendererContext = createContext<RendererContextValue>({
  components: {},
  directives: {},
  theme: defaultTheme,
  direction: 'auto',
  textSelection: DISABLED_TEXT_SELECTION,
  blockSlots: {},
  blockStyles: {},
  image: {},
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

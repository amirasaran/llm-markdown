import type { CardAnimationPreset } from '../shared/types';
import { Reanimated } from './rn';

export function resolveEntering(preset: CardAnimationPreset): unknown {
  if (!Reanimated) return undefined;
  switch (preset) {
    case 'none':
      return undefined;
    case 'fade':
      return Reanimated.FadeIn;
    case 'scale':
    case 'typewriter':
    case 'fadeSlide':
    default:
      return Reanimated.FadeInUp ?? Reanimated.FadeIn;
  }
}

export function resolveLayout(enabled: boolean): unknown {
  if (!Reanimated || !enabled) return undefined;
  return Reanimated.LinearTransition;
}

export function getAnimatedView(): unknown {
  return Reanimated?.default?.View ?? null;
}

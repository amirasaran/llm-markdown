import type { CSSProperties } from 'react';
import type { CardAnimationPreset } from '../shared/types';

export interface AnimationKeyframe {
  initial: CSSProperties;
  animate: CSSProperties;
  transitionMs: number;
}

export function presetToKeyframe(preset: CardAnimationPreset, durationMs: number): AnimationKeyframe {
  switch (preset) {
    case 'none':
      return { initial: {}, animate: {}, transitionMs: 0 };
    case 'fade':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transitionMs: durationMs,
      };
    case 'scale':
      return {
        initial: { opacity: 0, transform: 'scale(0.96)' },
        animate: { opacity: 1, transform: 'scale(1)' },
        transitionMs: durationMs,
      };
    case 'typewriter':
    case 'fadeSlide':
    default:
      return {
        initial: { opacity: 0, transform: 'translateY(6px)' },
        animate: { opacity: 1, transform: 'translateY(0)' },
        transitionMs: durationMs,
      };
  }
}

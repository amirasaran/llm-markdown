import { useEffect, useState, type ReactNode } from 'react';
import type { CardConfig, Theme } from '../shared/types';
import { presetToKeyframe } from './animations';

export interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
  footer?: ReactNode;
  config?: CardConfig;
  theme: Theme;
  direction: 'ltr' | 'rtl' | 'auto';
}

export function Card({
  children,
  header,
  before,
  after,
  footer,
  config,
  theme,
  direction,
}: CardProps) {
  const animation = config?.animation ?? 'fadeSlide';
  const durationMs = config?.enterDuration ?? theme.motion.enterDuration;
  const kf = presetToKeyframe(animation, durationMs);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const layoutTransitionMs = config?.layoutAnimation === false ? 0 : theme.motion.layoutDuration;

  return (
    <article
      dir={direction === 'auto' ? undefined : direction}
      role="article"
      style={{
        backgroundColor: config?.backgroundColor ?? theme.colors.surface,
        borderColor: config?.borderColor ?? theme.colors.border,
        borderWidth: config?.borderWidth ?? 1,
        borderStyle: 'solid',
        borderRadius: config?.radius ?? theme.radii.lg,
        padding: config?.padding ?? theme.spacing.lg,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.sizeBase,
        lineHeight: theme.typography.lineHeight,
        transition: `opacity ${kf.transitionMs}ms ease-out, transform ${kf.transitionMs}ms ease-out, height ${layoutTransitionMs}ms ease-out`,
        ...(mounted ? kf.animate : kf.initial),
      }}
    >
      {header ? <div style={{ marginBottom: theme.spacing.md }}>{header}</div> : null}
      {before ? <div style={{ marginBottom: theme.spacing.md }}>{before}</div> : null}
      <div>{children}</div>
      {after ? <div style={{ marginTop: theme.spacing.md }}>{after}</div> : null}
      {footer ? <div style={{ marginTop: theme.spacing.md }}>{footer}</div> : null}
    </article>
  );
}

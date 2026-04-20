import type { ReactNode, ComponentType } from 'react';
import type { CardConfig, Theme } from '../shared/types';
import { View } from './rn';
import { resolveEntering, resolveLayout, getAnimatedView } from './animations';

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

export function Card({ children, header, before, after, footer, config, theme }: CardProps) {
  const animation = config?.animation ?? 'fadeSlide';
  const entering = resolveEntering(animation);
  const layout = resolveLayout(config?.layoutAnimation !== false);
  const AnimatedView = getAnimatedView() as ComponentType<{
    entering?: unknown;
    layout?: unknown;
    style?: unknown;
    children?: ReactNode;
  }> | null;

  const cardStyle = {
    backgroundColor: config?.backgroundColor ?? theme.colors.surface,
    borderColor: config?.borderColor ?? theme.colors.border,
    borderWidth: config?.borderWidth ?? 1,
    borderRadius: config?.radius ?? theme.radii.lg,
    padding: config?.padding ?? theme.spacing.lg,
  };

  const body = (
    <>
      {header ? <View style={{ marginBottom: theme.spacing.md }}>{header}</View> : null}
      {before ? <View style={{ marginBottom: theme.spacing.md }}>{before}</View> : null}
      <View>{children}</View>
      {after ? <View style={{ marginTop: theme.spacing.md }}>{after}</View> : null}
      {footer ? <View style={{ marginTop: theme.spacing.md }}>{footer}</View> : null}
    </>
  );

  if (AnimatedView && (entering || layout)) {
    return (
      <AnimatedView style={cardStyle} entering={entering} layout={layout}>
        {body}
      </AnimatedView>
    );
  }
  return <View style={cardStyle}>{body}</View>;
}

import type { DirectiveComponentProps } from 'llm-markdown/web';
import { chartPayload } from '../../../shared/demo-content';

export function ChartDom({ attributes, value, theme }: DirectiveComponentProps) {
  const data = chartPayload(value);
  const max = Math.max(1, ...data.map((d) => d.value));
  const title = typeof attributes.title === 'string' ? attributes.title : undefined;

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.md,
        padding: theme.spacing.md,
        margin: `${theme.spacing.sm}px 0`,
      }}
    >
      {title ? (
        <div
          style={{
            fontWeight: 600,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: 140,
          gap: theme.spacing.sm,
        }}
      >
        {data.map((d) => (
          <div
            key={d.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <div
                style={{
                  width: '100%',
                  height: `${(d.value / max) * 100}%`,
                  backgroundColor: theme.colors.accent,
                  borderRadius: theme.radii.sm,
                }}
              />
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: theme.colors.textMuted,
              }}
            >
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

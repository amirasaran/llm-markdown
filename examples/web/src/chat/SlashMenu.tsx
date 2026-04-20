import { useEffect, useRef, type CSSProperties } from 'react';
import { slashCommands, type SlashCommand } from './commands';
import { pick } from './theme';

export function SlashMenu({
  open,
  dark,
  onPick,
  onClose,
  filter,
  anchorBottom,
}: {
  open: boolean;
  dark: boolean;
  onPick: (cmd: SlashCommand) => void;
  onClose: () => void;
  filter?: string;
  anchorBottom: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const c = pick(dark);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  if (!open) return null;

  const q = (filter ?? '').toLowerCase();
  const items = q
    ? slashCommands.filter((cmd) => cmd.id.includes(q))
    : slashCommands;

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: anchorBottom,
        maxHeight: 320,
        overflow: 'auto',
        background: c.popoverBg,
        border: `1px solid ${c.popoverBorder}`,
        borderRadius: 12,
        boxShadow: dark
          ? '0 10px 30px rgba(0,0,0,0.6)'
          : '0 10px 30px rgba(0,0,0,0.12)',
        padding: 6,
        zIndex: 40,
      }}
    >
      <div
        style={{
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: c.textMuted,
        }}
      >
        Examples · pick one or type to filter
      </div>
      {items.length === 0 ? (
        <div style={{ padding: 10, color: c.textMuted, fontSize: 13 }}>
          No match. Try <code>/</code> to see every example.
        </div>
      ) : (
        items.map((cmd) => (
          <button
            key={cmd.id}
            role="menuitem"
            onClick={() => onPick(cmd)}
            style={itemStyle(dark)}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 13,
                color: c.accent,
                minWidth: 110,
              }}
            >
              {cmd.label}
            </span>
            <span style={{ fontSize: 13, color: c.text, flex: 1, textAlign: 'left' }}>
              {cmd.description}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

function itemStyle(dark: boolean): CSSProperties {
  const c = pick(dark);
  return {
    display: 'flex',
    gap: 12,
    width: '100%',
    padding: '8px 10px',
    border: 0,
    background: 'transparent',
    color: c.text,
    textAlign: 'left',
    borderRadius: 8,
    cursor: 'pointer',
    alignItems: 'center',
  };
}

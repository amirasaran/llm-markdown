import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { pick } from './theme';
import { SlashMenu } from './SlashMenu';
import type { SlashCommand } from './commands';

export function Composer({
  dark,
  onSend,
  disabled,
}: {
  dark: boolean;
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const c = pick(dark);
  const [value, setValue] = useState('');
  const [slashOpen, setSlashOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-open the menu when the user starts the input with `/`
  const autoOpenSlash = value.startsWith('/');

  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [value]);

  const send = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0 || disabled) return;
    onSend(trimmed);
    setValue('');
    setSlashOpen(false);
  }, [value, disabled, onSend]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === 'Escape' && slashOpen) {
      setSlashOpen(false);
    }
  };

  const handlePickCommand = (cmd: SlashCommand) => {
    setValue(cmd.label + ' ');
    setSlashOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div
      style={{
        position: 'relative',
        background: c.composerBg,
        borderTop: `1px solid ${c.composerBorder}`,
        padding: 12,
      }}
    >
      <SlashMenu
        open={slashOpen || (autoOpenSlash && value.trim().length > 0)}
        dark={dark}
        onClose={() => setSlashOpen(false)}
        onPick={handlePickCommand}
        filter={value.startsWith('/') ? value.slice(1) : ''}
        anchorBottom={72}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: dark ? '#1F1F27' : '#ffffff',
          border: `1px solid ${c.composerBorder}`,
          borderRadius: 24,
          padding: '6px 6px 6px 10px',
        }}
      >
        <button
          type="button"
          aria-label="Show example commands"
          title="Show example commands"
          onClick={() => setSlashOpen((v) => !v)}
          style={iconBtn(dark, slashOpen)}
        >
          <SlashIcon />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          placeholder="Message · type /  to see examples"
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          style={{
            flex: 1,
            resize: 'none',
            border: 0,
            outline: 'none',
            background: 'transparent',
            color: c.text,
            padding: '8px 4px',
            fontSize: 14,
            fontFamily: 'inherit',
            lineHeight: 1.4,
            minHeight: 24,
            maxHeight: 180,
          }}
        />

        <button
          type="button"
          onClick={send}
          disabled={disabled || value.trim().length === 0}
          aria-label="Send"
          title="Send (Enter)"
          style={sendBtn(dark, value.trim().length > 0 && !disabled)}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function iconBtn(dark: boolean, active: boolean): CSSProperties {
  const c = pick(dark);
  return {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: `1px solid ${active ? c.accent : c.composerBorder}`,
    background: active ? c.accent : 'transparent',
    color: active ? '#fff' : c.textMuted,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    fontWeight: 700,
  };
}

function sendBtn(dark: boolean, enabled: boolean): CSSProperties {
  const c = pick(dark);
  return {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: 0,
    background: enabled ? c.sent : dark ? '#2A2A33' : '#E5E7EB',
    color: '#ffffff',
    cursor: enabled ? 'pointer' : 'not-allowed',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    transition: 'background 150ms ease-out',
  };
}

function SlashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M16 4 L8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 20 L21 12 L3 4 L6 12 Z" fill="currentColor" />
    </svg>
  );
}

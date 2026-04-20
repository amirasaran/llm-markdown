import { useEffect, useState } from 'react';
import { slugify } from './DocsHeading';

interface TocEntry {
  id: string;
  text: string;
  depth: number;
}

/** Extract `#` and `##` headings from the docs markdown for the TOC. */
export function buildToc(markdown: string): TocEntry[] {
  const out: TocEntry[] = [];
  const lines = markdown.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const depth = m[1]!.length;
    const text = m[2]!.replace(/`/g, '');
    out.push({ id: slugify(text), text, depth });
  }
  return out;
}

export function TOC({
  entries,
  dark,
  onPick,
}: {
  entries: TocEntry[];
  dark: boolean;
  onPick?: () => void;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;
    const obs = new IntersectionObserver(
      (items) => {
        for (const it of items) {
          if (it.isIntersecting) {
            setActive(it.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [entries]);

  const muted = dark ? '#9CA3AF' : '#6B7280';
  const fg = dark ? '#E5E7EB' : '#111827';

  return (
    <nav aria-label="Table of contents" style={{ padding: '8px 4px' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: muted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          padding: '4px 12px 10px',
        }}
      >
        On this page
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {entries.map((e) => {
          const isActive = active === e.id;
          return (
            <li key={e.id} style={{ margin: 0 }}>
              <a
                href={`#${e.id}`}
                onClick={(ev) => {
                  ev.preventDefault();
                  const el = document.getElementById(e.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  // Avoid updating window.hash — that would change the app route
                  onPick?.();
                }}
                style={{
                  display: 'block',
                  padding: e.depth === 1 ? '6px 12px' : '4px 12px',
                  paddingLeft: 12 + (e.depth - 1) * 12,
                  color: isActive ? (dark ? '#A5B4FC' : '#6366F1') : e.depth === 1 ? fg : muted,
                  fontSize: e.depth === 1 ? 13 : 12,
                  fontWeight: isActive ? 600 : e.depth === 1 ? 600 : 400,
                  textDecoration: 'none',
                  borderLeft: isActive
                    ? '2px solid #6366F1'
                    : '2px solid transparent',
                  marginLeft: 4,
                }}
              >
                {e.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

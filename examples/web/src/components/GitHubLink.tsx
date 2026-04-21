import { useEffect, useState } from 'react';

export const REPO_URL = 'https://github.com/amirasaran/llm-markdown';
const API_URL = 'https://api.github.com/repos/amirasaran/llm-markdown';
const CACHE_KEY = 'llm-markdown:gh-stars';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

function formatStars(n: number): string {
  if (n < 1000) return String(n);
  return (n / 1000).toFixed(n < 10_000 ? 1 : 0) + 'k';
}

export function GitHubLink({ dark }: { dark: boolean }) {
  const [stars, setStars] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, count } = JSON.parse(raw) as { ts: number; count: number };
      if (Date.now() - ts > CACHE_TTL_MS) return null;
      return count;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { ts } = JSON.parse(cached) as { ts: number };
        if (Date.now() - ts < CACHE_TTL_MS) return;
      } catch {
        // fall through and refetch
      }
    }
    let cancelled = false;
    fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const count = typeof d.stargazers_count === 'number' ? d.stargazers_count : 0;
        setStars(count);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), count }));
        } catch {
          // ignore storage errors
        }
      })
      .catch(() => {
        // offline / rate-limited — silently stay on cached value
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const muted = dark ? '#9CA3AF' : '#6B7280';
  const border = dark ? '#2A2A33' : '#E5E7EB';
  const bg = dark ? '#1F1F27' : '#ffffff';
  const fg = dark ? '#F3F4F6' : '#111827';

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Star llm-markdown on GitHub"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 999,
        color: fg,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = dark ? '#2A2A33' : '#F3F4F6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = bg;
      }}
    >
      <GitHubMark color={fg} />
      <span>GitHub</span>
      {stars !== null ? (
        <span
          aria-label={`${stars} stars`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            color: muted,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <StarIcon color={muted} />
          {formatStars(stars)}
        </span>
      ) : null}
    </a>
  );
}

function GitHubMark({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.2-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12v3.15c0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function StarIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7.3L12 17.8 5.8 21.5l1.6-7.3L2 9.5l7.1-.6L12 2z" />
    </svg>
  );
}

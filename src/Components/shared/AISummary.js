import React, { useCallback, useEffect, useState } from 'react';
import { HiSparkles } from 'react-icons/hi';
import { BiCheckCircle, BiErrorCircle, BiInfoCircle, BiRefresh } from 'react-icons/bi';

const OPEN_EVENT = 'axispt:open-assistant';

const TONES = {
  good: { Icon: BiCheckCircle, badge: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' },
  warn: { Icon: BiErrorCircle, badge: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]' },
  info: { Icon: BiInfoCircle, badge: 'bg-brand-soft text-brand-ink' },
};

const CHIP_TONES = {
  good: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
  warn: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
  danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]',
  info: 'bg-surface-2 text-ink-2',
};

const ago = (ms) => {
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

// MOBILE: break-words on <strong> so an unbroken token (course code, URL) can't overflow the card.
const renderRich = (text) =>
  text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? <strong key={i} className="break-words font-semibold">{part}</strong> : part
  );

function parseSummary(summary = '') {
  const lines = summary.split('\n').map((l) => l.trim()).filter(Boolean);

  const highlights = lines
    .filter((l) => l.startsWith('- '))
    .map((l) => {
      const m = l.slice(2).match(/^\[(good|warn|info)\]\s*(.*)$/i);
      return m ? { tone: m[1].toLowerCase(), text: m[2] } : { tone: 'info', text: l.slice(2) };
    });

  const priorities = lines
    .filter((l) => /^\d+[.)]\s/.test(l))
    .map((l) => l.replace(/^\d+[.)]\s+/, ''))
    .slice(0, 3);

  return { highlights, priorities };
}

const normalizeChips = (chips = []) =>
  chips
    .map((c) => (typeof c === 'string' ? { label: c, tone: 'info' } : { label: c.label || c.text, tone: c.tone || 'info' }))
    .filter((c) => c.label);

export default function AISummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setFailed(false);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/dashboard/summary${refresh ? '?refresh=1' : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) setData(json.data);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { highlights, priorities } = parseSummary(data?.summary);
  const chips = normalizeChips(data?.chips);
  const hasContent = highlights.length > 0;

  let body;
  if (loading && !data) {
    body = (
      <div className="space-y-3" aria-busy="true">
        <div className="flex gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-line/60" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-line/60" />
        </div>
        <div className="h-4 w-11/12 animate-pulse rounded bg-line/60" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-line/60" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-line/60" />
      </div>
    );
  } else if (failed || data?.unavailable) {
    body = <p className="text-sm text-ink-3">The summary is unavailable right now. Your dashboard numbers are unaffected.</p>;
  } else if (data?.empty || !hasContent) {
    body = <p className="text-sm text-ink-3">No student data yet to summarize.</p>;
  } else {
    body = (
      <div className="space-y-4">
        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Key figures">
            {chips.map((c, i) => (
              <li key={i} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CHIP_TONES[c.tone] || CHIP_TONES.info}`}>
                {c.label}
              </li>
            ))}
          </ul>
        )}

        <ul className="space-y-2.5">
          {highlights.map(({ tone, text }, i) => {
            const { Icon, badge } = TONES[tone] || TONES.info;
            return (
              <li key={i} className="flex items-start gap-3 text-sm leading-snug text-ink">
                <span aria-hidden="true" className={`mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full ${badge}`}>
                  <Icon className="h-4 w-4" />
                </span>
                {/* MOBILE: min-w-0 + break-words so a long unbroken token wraps instead of overflowing */}
                <span className="min-w-0 break-words pt-0.5">{renderRich(text)}</span>
              </li>
            );
          })}
        </ul>

        {priorities.length > 0 && (
          <div className="border-t border-line pt-3">
            <h3 className="mb-2 text-sm font-semibold text-ink">Recommended priorities</h3>
            <ol className="space-y-1.5">
              {priorities.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                  <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-semibold tabular-nums text-brand-on">
                    {i + 1}
                  </span>
                  <span className="min-w-0 break-words">{renderRich(p)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="flex flex-col rounded-panel border !border-line bg-surface p-4 ">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-ctl bg-brand-soft text-brand-ink">
            <HiSparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="min-w-0 truncate text-base font-semibold text-ink">AI Summary</h2>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          aria-label="Refresh summary"
          // MOBILE: 40px touch target on mobile, 32px on md+.
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl text-ink-2 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50 md:h-8 md:w-8"
        >
          <BiRefresh className={`h-5 w-5 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
        </button>
      </header>

      <div aria-live="polite">{body}</div>

      {hasContent && !failed && (
        // MOBILE: flex-wrap so "Updated X ago" + "Ask a follow-up" stack instead of squishing.
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-xs text-ink-3">Updated {ago(data.ageMs || 0)}</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
            // MOBILE: min-h-[40px] touch target
            className="inline-flex min-h-[40px] items-center gap-2 rounded-ctl bg-brand px-3.5 py-2 text-sm font-medium text-brand-on transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HiSparkles className="h-4 w-4" aria-hidden="true" />
            Ask a follow-up
          </button>
        </footer>
      )}
    </section>
  );
}
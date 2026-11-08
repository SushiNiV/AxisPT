import React from 'react';
import { Link } from 'react-router-dom';

export default function Card({ title, hint, action, className = '', scroll = false, children }) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-col rounded-panel border !border-line bg-surface p-4 sm:p-5 ${className}`}>
      {/* MOBILE: min-w-0 + truncate on title so a long title yields to the action, never overflows */}
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg font-semibold text-ink">{title}</h2>
        <div className="shrink-0">
          {action || (hint && <span className="text-xs text-ink-3">{hint}</span>)}
        </div>
      </header>
      <div className={`min-h-0 flex-1${scroll ? ' overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}>{children}</div>
    </section>
  );
}

// MOBILE: 40px touch target on mobile, 32px pill on md+ (desktop).
export function CardLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 items-center rounded-full border border-brand/40 px-4 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:h-8 md:px-3.5"
    >
      {children}
    </Link>
  );
}

export function CardEmpty({ children }) {
  return <p className="py-10 text-center text-sm text-ink-2">{children}</p>;
}
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Dashboard panel with a title row.
 * @param {string} title
 * @param {string} [hint]   Small gray text on the right.
 * @param {React.ReactNode} [action] Replaces the hint (e.g. <CardLink />).
 */
export default function Card({ title, hint, action, className = '', children }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-panel border !border-line bg-surface p-5 ${className}`}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {action || (hint && <span className="text-xs text-ink-3">{hint}</span>)}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

/** Pill-shaped link for a card header, e.g. "View all". */
export function CardLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex h-8 items-center rounded-full border border-brand/40 px-3.5 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {children}
    </Link>
  );
}

/** Message shown inside a card with no data. */
export function CardEmpty({ children }) {
  return <p className="py-10 text-center text-sm text-ink-2">{children}</p>;
}
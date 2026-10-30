import React from 'react';

/**
 * Toggle chip, used for quick filters.
 * @param {boolean} selected
 * @param {number} [count] Optional count shown after the label.
 */
export default function Chip({ selected = false, count, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border !border-line px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        selected
          ? 'border-brand bg-brand-soft text-brand-ink'
          : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`tabular-nums ${selected ? 'text-brand-ink' : 'text-ink-3'}`}>{count}</span>
      )}
    </button>
  );
}
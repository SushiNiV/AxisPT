import React from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';

/** Page numbers with ellipses: 1 … 4 5 6 … 20 */
function getPages(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', count];
  if (page >= count - 3) return [1, '…', count - 4, count - 3, count - 2, count - 1, count];
  return [1, '…', page - 1, page, page + 1, '…', count];
}

const NAV_BTN =
  'grid h-9 w-9 place-items-center rounded-ctl border border-line-strong bg-surface text-lg text-ink-2 ' +
  'transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ' +
  'disabled:hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

/**
 * Shared pagination bar: "Showing 1–30 of 128" plus page controls.
 * Small screens get a compact "2 / 13" control and the bar hides when there is only one page.
 *
 * @param {number} page       Current page (1-based).
 * @param {number} pageCount  Total pages.
 * @param {number} total      Total items.
 * @param {number} pageSize   Items per page.
 * @param {(page:number)=>void} onPageChange
 */
export default function Pagination({ page, pageCount, total, pageSize, onPageChange, className = '' }) {
  if (!total) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const single = pageCount <= 1;
  const go = (p) => onPageChange(Math.min(Math.max(p, 1), pageCount));

  return (
    <nav
      aria-label="Pagination"
      className={`ax flex shrink-0 items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 ${
        single ? 'max-sm:hidden' : ''
      } ${className}`}
    >
      <p className="text-sm tabular-nums text-ink-2" aria-live="polite">
        <span className="hidden sm:inline">Showing </span>
        <span className="font-medium text-ink">
          {start}–{end}
        </span>{' '}
        of <span className="font-medium text-ink">{total}</span>
      </p>

      {!single && (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page" className={NAV_BTN}>
            <BiChevronLeft />
          </button>

          <span className="px-2 text-sm tabular-nums text-ink-2 sm:hidden">
            {page} / {pageCount}
          </span>

          <ul className="hidden items-center gap-1 sm:flex">
            {getPages(page, pageCount).map((p, i) =>
              typeof p === 'number' ? (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => go(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className={`h-9 min-w-9 rounded-ctl px-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                      p === page ? 'bg-brand text-brand-on' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    {p}
                  </button>
                </li>
              ) : (
                <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-3">
                  …
                </li>
              )
            )}
          </ul>

          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page === pageCount}
            aria-label="Next page"
            className={NAV_BTN}
          >
            <BiChevronRight />
          </button>
        </div>
      )}
    </nav>
  );
}
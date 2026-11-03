import React from 'react';
import { Link } from 'react-router-dom';
import { BiUpArrowAlt } from 'react-icons/bi';

/**
 * Headline number. `featured` gives the maroon gradient treatment (use on one card per row).
 * `to` adds a round arrow link to the related page.
 */
export default function StatCard({ label, value, hint, to, featured = false }) {
  const long = String(value).length > 6; // e.g. "Probationary 2"

  return (
    <div
      className={`flex min-h-[6.75rem] flex-col justify-between gap-2 rounded-panel px-4 py-3.5 ${
        featured
          ? 'bg-gradient-to-br from-maroon-700 to-maroon-950 text-white shadow-lift ring-1 ring-white/10'
          : 'border !border-line bg-surface text-ink'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        {to && (
          <Link
            to={to}
            aria-label={`Go to ${label}`}
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              featured
                ? 'border-white/30 bg-white text-maroon-800 hover:bg-white/90'
                : '!border-line-strong text-ink hover:bg-surface-2'
            }`}
          >
            <BiUpArrowAlt className="rotate-45" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div>
        <p className={`font-semibold leading-none tabular-nums ${long ? 'text-2xl' : 'text-4xl'}`}>{value}</p>
        {hint && <p className={`mt-1.5 text-xs ${featured ? 'text-white/75' : 'text-ink-2'}`}>{hint}</p>}
      </div>
    </div>
  );
}
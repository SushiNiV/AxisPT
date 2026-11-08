import React from 'react';
import { Link } from 'react-router-dom';
import { BiUpArrowAlt } from 'react-icons/bi';

export default function StatCard({ label, value, hint, to, featured = false }) {
  const long = String(value).length > 6;

  return (
    <div
      className={`flex min-h-[6.75rem] flex-col justify-between gap-2 rounded-panel px-3 py-3 sm:px-4 sm:py-3.5 ${
        featured
          ? 'bg-gradient-to-br from-maroon-700 to-maroon-950 text-white shadow-lift ring-1 ring-white/10'
          : 'border !border-line bg-surface text-ink'
      }`}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* MOBILE: 13px label so "Active students" fits one line at 2-up on 360px */}
        <p className="text-[13px] font-medium leading-tight sm:text-sm">{label}</p>
        {to && (
          <Link
            to={to}
            aria-label={`Go to ${label}`}
            // MOBILE: visual circle stays 28px, hit area expands to 40px via negative margin.
            className={`grid h-10 w-10 shrink-0 place-items-center -m-1.5 rounded-full border text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:h-7 sm:w-7 sm:m-0 ${
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
        {hint && <p className={`mt-1.5 text-xs leading-snug ${featured ? 'text-white/75' : 'text-ink-2'}`}>{hint}</p>}
      </div>
    </div>
  );
}
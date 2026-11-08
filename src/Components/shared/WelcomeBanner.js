import React from 'react';
import { BiRightArrowAlt, BiCalendar } from 'react-icons/bi';

export default function WelcomeBanner({ name, role, subtext, actionText, onAction }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-panel bg-maroon-900 shadow-lift">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-maroon-700/40 blur-3xl" />

      {/* MOBILE: px-4 py-5 on mobile; px-6 py-6 from sm up */}
      <div className="relative z-10 flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-6 md:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/90">
              {role}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/65">
              <BiCalendar className="text-sm" />
              {today}
            </span>
          </div>

          {/* MOBILE: text-xl on mobile (long names wrap less awkwardly) */}
          <h1 className="mt-2 font-display text-xl tracking-tight text-white sm:text-3xl">
            Hello, <span className="font-light italic">{name || 'User'}</span>
          </h1>

          {subtext && (
            <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75">{subtext}</p>
          )}
        </div>

        {actionText && (
          <button
            type="button"
            onClick={onAction}
            // MOBILE: min-h-[40px] ensures 40px touch target on mobile
            className="group inline-flex min-h-[40px] shrink-0 items-center gap-1.5 self-start rounded-ctl bg-white px-4 py-2.5 text-sm font-semibold text-maroon-900 transition-all hover:bg-brand-soft hover:shadow-lg active:scale-95 sm:self-center"
          >
            {actionText}
            <BiRightArrowAlt className="text-lg transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
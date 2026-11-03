import React from 'react';

// Slides the track left by exactly one copy of the list (half its width + half the gap), then repeats.
const KEYFRAMES = `
@keyframes axMarquee {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-50% - 0.5rem)); }
}`;

/**
 * Feature cards that scroll sideways on their own, in a seamless loop.
 * Add as many items as you like; the speed adjusts to the number of cards.
 * Pauses while the mouse is over it, and stays still (but scrollable) for users who prefer reduced motion.
 *
 * @param {Array<{icon:Function, title:string, text:string}>} items
 * @param {number} [secondsPerCard=8]  Lower is faster.
 */
export default function FeatureCarousel({ items, secondsPerCard = 8 }) {
  // The list is rendered twice so the loop has no visible jump.
  const loop = [...items, ...items];

  return (
    <div
      role="region"
      aria-label="Portal features"
      className="w-full motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]"
    >
      <style>{KEYFRAMES}</style>

      <ul
        className="m-0 flex w-max list-none gap-4 p-0 hover:[animation-play-state:paused] motion-reduce:!animate-none"
        style={{ animation: `axMarquee ${items.length * secondsPerCard}s linear infinite` }}
      >
        {loop.map(({ icon: Icon, title, text }, i) => (
          <li
            key={`${title}-${i}`}
            aria-hidden={i >= items.length ? 'true' : undefined}
            // CHANGED: Removed inline color styles and used Tailwind semantic classes
            className="flex min-h-[9.5rem] w-[17rem] shrink-0 flex-col rounded-panel bg-surface p-4 xl:w-[19rem] 2xl:min-h-[11rem] 2xl:w-[21rem] 2xl:p-5"
          >
            <p className="flex items-center gap-2.5 font-display text-lg font-bold text-ink 2xl:text-xl">
              {/* CHANGED: Added dark:text-brand-ink so the icon matches the theme */}
              <Icon className="shrink-0 text-2xl text-brand dark:text-brand-ink" aria-hidden="true" />
              {title}
            </p>
            <p className="mt-2 text-sm leading-snug text-ink-2">
              {text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
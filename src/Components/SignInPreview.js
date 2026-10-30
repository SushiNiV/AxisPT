import React from 'react';
import PillBars from '../Components/charts/Pillbars';

// Sample numbers for the sign-in preview only. They are not read from the database.
const SAMPLE = [
  { label: 'Year 1', value: 42 },
  { label: 'Year 2', value: 38 },
  { label: 'Year 3', value: 31 },
  { label: 'Year 4', value: 25 },
];

/** Decorative, tilted frosted-glass mini dashboard shown on the sign-in page. */
export default function SignInPreview() {
  return (
    <div
      aria-hidden="true"
      className="w-[21rem] rotate-[5deg] rounded-sheet bg-white/15 p-3 shadow-2xl ring-1 ring-white/30 backdrop-blur-md"
    >
      <div className="space-y-3 rounded-panel bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Student body</p>
          <span className="text-xs text-ink-3">Sample data</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-ctl bg-gradient-to-br from-maroon-700 to-maroon-950 p-3 text-white">
            <p className="text-xs text-white/80">Active students</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">136</p>
          </div>
          <div className="rounded-ctl bg-surface-2 p-3">
            <p className="text-xs text-ink-2">In good standing</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">92%</p>
          </div>
        </div>

        <PillBars data={SAMPLE} label="Sample enrollment by year level" height={96} />
      </div>
    </div>
  );
}
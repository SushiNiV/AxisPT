import React, { useMemo, useState } from 'react';
import Card, { CardEmpty } from '../ui/Card';
import PillBars from './Pillbars';

const OPTIONS = [
  { value: 'year', label: 'Year' },
  { value: 'program', label: 'Program' },
  { value: 'status', label: 'Standing' },
];

const STANDING_ORDER = ['Regular', 'Warning', 'Probationary 1', 'Probationary 2'];
const standingRank = (label) => {
  const i = STANDING_ORDER.indexOf(label);
  return i === -1 ? STANDING_ORDER.length : i;
};
// Short axis labels so four bars fit side by side.
const SHORT = { 'Probationary 1': 'Prob. 1', 'Probationary 2': 'Prob. 2' };

const students = (n) => `${n} student${n === 1 ? '' : 's'}`;

/** Student body card: pill-bar chart that can be grouped by year, program, or standing. */
export default function StudentBreakdown({
  studentsByYear = [],
  studentsByProgram = [],
  standingCounts = [],
  totalStudents = 0,
}) {
  const [mode, setMode] = useState('year');

  const data = useMemo(() => {
    if (mode === 'year') {
      const byYear = Object.fromEntries(studentsByYear.map((y) => [y.year_level, y.count]));
      return [1, 2, 3, 4].map((year) => ({ label: `Year ${year}`, value: byYear[year] || 0 }));
    }
    if (mode === 'program') {
      return studentsByProgram
        .map((d) => ({ label: d.program_abbr, value: d.count }))
        .filter((d) => d.value > 0);
    }
    return standingCounts
      .map((d) => {
        const label = d.status === 'None' ? 'Regular' : d.status;
        return { label, short: SHORT[label], value: d.count };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => standingRank(a.label) - standingRank(b.label));
  }, [mode, studentsByYear, studentsByProgram, standingCounts]);

  const hasData = data.some((d) => d.value > 0);

  return (
    <Card title="Student body" hint={`Total enrolled: ${totalStudents}`} className="h-full">
      <div className="flex h-full flex-col">
        <div role="group" aria-label="Group students by" className="mb-4 flex rounded-ctl bg-surface-2 p-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={mode === opt.value}
              onClick={() => setMode(opt.value)}
              className={`flex-1 rounded-ctl py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                mode === opt.value ? 'bg-brand text-brand-on shadow-lift' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Centered in whatever height the row gives us, so it lines up with the announcements card. */}
        <div className="flex flex-1 flex-col justify-center">
          {hasData ? (
            <PillBars data={data} height={150} label={`Students by ${mode}`} formatValue={students} />
          ) : (
            <CardEmpty>No enrollment data available.</CardEmpty>
          )}
        </div>
      </div>
    </Card>
  );
}
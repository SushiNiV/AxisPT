import React from 'react';

/** Whole-number axis ticks from 0 up to a round maximum (about four steps). */
function getTicks(max) {
  if (max <= 4) return Array.from({ length: Math.max(max, 1) + 1 }, (_, i) => i);
  const rough = max / 4;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= rough);
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

// Fine diagonal hatch laid over the solid pill.
const HATCH = {
  backgroundImage: 'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.2) 0 2px, transparent 2px 7px)',
};

/**
 * Compact pill-bar chart with a y-axis and dashed gridlines.
 * The tallest bar always shows its value in a bubble; hover any bar to see its value.
 *
 * @param {Array<{label:string, short?:string, value:number}>} data  `short` is an optional compact axis label.
 * @param {string} label            Accessible description of the chart.
 * @param {number} [height=160]     Plot height in px.
 * @param {(v:number)=>string|number} [formatValue]  Formats the tooltip value.
 */
export default function PillBars({ data, label, height = 160, formatValue = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const ticks = getTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const topLabel = max > 0 ? data.find((d) => d.value === max).label : null;
  const summary = data.map((d) => `${d.label}: ${d.value}`).join(', ');

  return (
    // pt-9 leaves room for the value bubble above the tallest bar.
    <div role="img" aria-label={`${label}. ${summary}`} className="pt-9">
      <div className="grid grid-cols-[2.25rem_1fr] gap-x-2">
        {/* Y axis labels */}
        <div className="relative" style={{ height }} aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 translate-y-1/2 text-xs tabular-nums text-ink-3"
              style={{ bottom: `${(t / top) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Plot: dashed gridlines behind the bars */}
        <div className="relative" style={{ height }}>
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            {ticks.map((t) => {
              const y = `${100 - (t / top) * 100}%`;
              return (
                <line
                  key={t}
                  x1="0"
                  x2="100%"
                  y1={y}
                  y2={y}
                  strokeWidth="1"
                  strokeDasharray={t === 0 ? undefined : '4 4'}
                  style={{ stroke: 'rgb(var(--c-line-strong))' }}
                />
              );
            })}
          </svg>

          <div className="relative flex h-full items-end gap-2 px-1">
            {data.map((d) => (
              <div key={d.label} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                {d.value > 0 ? (
                  <div
                    className="relative w-full max-w-[44px] rounded-full bg-brand"
                    style={{ height: `${(d.value / top) * 100}%`, minHeight: '2.25rem', ...HATCH }}
                  >
                    <span
                      className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-brand px-2 py-1 text-xs font-semibold tabular-nums text-brand-on transition-opacity ${
                        d.label === topLabel ? '' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {formatValue(d.value)}
                      <i className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-brand" />
                    </span>
                  </div>
                ) : (
                  <div className="h-1.5 w-full max-w-[44px] rounded-full bg-line-strong/60" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* X axis labels (same flex structure as the bars so they line up) */}
        <div />
        <div className="mt-2 flex gap-2 px-1" aria-hidden="true">
          {data.map((d) => (
            <span key={d.label} className="min-w-0 flex-1 truncate text-center text-xs text-ink-2">
              {d.short || d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
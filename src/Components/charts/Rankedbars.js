import React from 'react';
import { HATCH_STYLE } from './hatch';

/**
 * Ranked horizontal bars with the value as text, so nothing depends on a tooltip.
 * @param {Array<{label:string, sublabel?:string, value:number}>} items
 */
export default function RankedBars({ items }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ol className="space-y-4">
      {items.map((item, idx) => (
        <li key={`${item.label}-${idx}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{item.label}</p>
              {item.sublabel && <p className="truncate text-xs text-ink-2">{item.sublabel}</p>}
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{item.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2" style={HATCH_STYLE}>
            <div
              className={`h-full rounded-full ${idx === 0 ? 'bg-brand' : 'bg-brand/60'}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
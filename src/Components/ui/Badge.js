import React from 'react';

const TONES = {
  neutral: 'bg-surface-2 text-ink-2 ring-1 ring-inset ring-line',
  brand: 'bg-brand-soft text-brand-ink',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
};

/** Small status pill. Use tone to convey meaning, never color alone: always include text. */
export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
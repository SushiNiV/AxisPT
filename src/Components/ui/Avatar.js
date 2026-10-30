import React from 'react';

const SIZES = { md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

/** Initials avatar. Decorative: the person's name should always appear next to it. */
export default function Avatar({ first = '', last = '', size = 'md', className = '' }) {
  const initials = `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '?';
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand-ink ${SIZES[size]} ${className}`}
    >
      {initials}
    </span>
  );
}
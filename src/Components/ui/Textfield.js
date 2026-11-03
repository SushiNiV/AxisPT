import React from 'react';
import cx from './Cx';

/**
 * Labelled text input.
 * `trailing` renders a node inside the right edge of the input (e.g. a show/hide button).
 * Font size is 16px so iOS does not zoom on focus.
 */
export default function TextField({ id, label, trailing, className, inputClassName, ...props }) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
            className={cx(
              'h-12 w-full rounded-ctl bg-surface-2 px-3.5 text-base text-ink',
              'ring-1 ring-line-strong transition-shadow', // <-- Added ring here
              'placeholder:text-ink-3',
              'focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40', // <-- Updated focus ring
              'disabled:cursor-not-allowed disabled:opacity-60',
              trailing && 'pr-12',
              inputClassName
            )}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
    </div>
  );
}
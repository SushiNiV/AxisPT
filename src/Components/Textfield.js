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
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={cx(
            'h-12 w-full rounded-ctl border border-line-strong bg-surface px-3.5 text-base text-ink',
            'placeholder:text-ink-3 transition-shadow',
            'focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15',
            'disabled:cursor-not-allowed disabled:bg-surface-2',
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
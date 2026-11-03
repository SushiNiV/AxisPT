import React from 'react';
import { BiChevronUp, BiChevronDown } from 'react-icons/bi';
import cx from './Cx';

export default function NumberInput({ id, label, value, onChange, min, max, step = 1, className, ...props }) {
  const handleIncrement = () => {
    const newVal = Number(value || 0) + step;
    if (max !== undefined && newVal > Number(max)) return;
    onChange({ target: { value: newVal } });
  };

  const handleDecrement = () => {
    const newVal = Number(value || 0) - step;
    if (min !== undefined && newVal < Number(min)) return;
    onChange({ target: { value: newVal } });
  };

  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          value={value}
          onChange={onChange}
          className={cx(
            'h-12 w-full rounded-ctl bg-surface-2 pl-3.5 pr-10 text-base text-ink',
            'ring-1 ring-line-strong transition-shadow',
            'placeholder:text-ink-3',
            'focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
            'disabled:cursor-not-allowed disabled:opacity-60',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
          {...props}
        />
        
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={handleIncrement}
            tabIndex={-1}
            className="flex h-5 w-6 items-center justify-center rounded text-ink-3 hover:bg-surface hover:text-ink"
          >
            <BiChevronUp className="text-sm" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            tabIndex={-1}
            className="flex h-5 w-6 items-center justify-center rounded text-ink-3 hover:bg-surface hover:text-ink"
          >
            <BiChevronDown className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
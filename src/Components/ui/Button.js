import React from 'react';
import { BiLoaderAlt } from 'react-icons/bi';
import cx from './Cx';

const VARIANTS = {
  primary: 'bg-brand text-brand-on shadow-lift hover:bg-brand-hover',
  secondary: 'border !border-line-strong bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger-soft text-danger hover:brightness-95',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

/**
 * Button primitive.
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading  Shows a spinner and disables the button.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-ctl font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <BiLoaderAlt className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {children}
    </button>
  );
}
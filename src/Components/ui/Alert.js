import React from 'react';
import cx from './Cx';

const TONES = {
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  ok: 'bg-ok-soft text-ok',
};

/** Inline status message. role="alert" makes screen readers announce it when it appears. */
export default function Alert({ tone = 'danger', className, children }) {
  return (
    <div role="alert" className={cx('flex items-start gap-2.5 rounded-ctl px-3.5 py-3 text-sm font-medium', TONES[tone], className)}>
      {children}
    </div>
  );
}
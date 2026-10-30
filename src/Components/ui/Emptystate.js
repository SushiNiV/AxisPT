import React from 'react';

/** Empty / error placeholder: say what happened and offer the next action. */
export default function EmptyState({ icon: Icon, title, text, action, className = '' }) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-panel border border-line bg-surface px-6 py-16 text-center ${className}`}>
      {Icon && (
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-3xl text-brand-ink">
          <Icon aria-hidden="true" />
        </span>
      )}
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {text && <p className="max-w-sm text-sm text-ink-2">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
import React from 'react';
import { BiBook } from 'react-icons/bi';

export default function AssistantSources({ sources, messageId }) {
  if (!sources || sources.length === 0) return null;

  const handleCiteClick = (n) => {
    const el = document.getElementById(`msg-${messageId}-source-${n}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('bg-warn-soft', 'text-warn', 'ring-warn/30');
    setTimeout(() => el.classList.remove('bg-warn-soft', 'text-warn', 'ring-warn/30'), 1500);
  };

  return (
    <div className="AssistantSourcesBlock flex w-full flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s) => (
          <button
            key={s.n}
            id={`msg-${messageId}-source-${s.n}`}
            onClick={() => handleCiteClick(s.n)}
            className="flex items-center gap-1.5 rounded-full border !border-line bg-surface px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-ink"
          >
            <BiBook className="text-[10px] text-brand" />
            <span className="max-w-[120px] truncate">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
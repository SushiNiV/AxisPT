import React from 'react';

const SUGGESTIONS = [
  "What's the probation policy?",
  'How is GWA computed?',
  'What GPA is needed for Latin honors?',
];

export default function AssistantSuggestedChips({ onSelect }) {
  return (
    <div className="flex w-full snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {SUGGESTIONS.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="shrink-0 snap-start rounded-full border !border-line bg-surface px-4 py-2 text-xs font-medium text-ink-2 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-ink"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
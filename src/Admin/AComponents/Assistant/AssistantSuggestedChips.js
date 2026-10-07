import React from 'react';

const SUGGESTIONS = [
  "What's the probation policy?",
  'How is GWA computed?',
  'What GPA is needed for Latin honors?',
];

function AssistantSuggestedChips({ onSelect }) {
  return (
    <div className="AssistantChipsRow">
      {SUGGESTIONS.map((q) => (
        <button
          key={q}
          type="button"
          className="AssistantChip"
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}

export default AssistantSuggestedChips;
import React from 'react';

export default function AssistantTypingIndicator() {
  return (
    <div className="flex justify-start self-start">
      <div className="flex items-center gap-1.5 rounded-panel rounded-bl-sm bg-surface-2 px-4 py-3 ring-1 ring-inset ring-line">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-3 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-3 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-3" />
      </div>
    </div>
  );
}
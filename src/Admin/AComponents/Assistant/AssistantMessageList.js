import React, { useEffect, useRef } from 'react';
import { HiSparkles } from 'react-icons/hi';
import AssistantMessage from './AssistantMessage';
import AssistantTypingIndicator from './AssistantTypingIndicator';
import AssistantSuggestedChips from './AssistantSuggestedChips';

export default function AssistantMessageList({ messages, isAsking, error, onSuggestedQuestion }) {
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const stickToBottomRef = useRef(true);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  };

  useEffect(() => {
    if (stickToBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isAsking]);

  if (messages.length === 0 && !isAsking && !error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
          <HiSparkles className="text-3xl" />
        </div>
        <h3 className="mb-2 font-display text-lg font-semibold text-ink">How can I help?</h3>
        <p className="mb-6 text-sm text-ink-2">
          Ask about academic policies, grading, or anything from the CPT Handbook.
        </p>
        <AssistantSuggestedChips onSelect={onSuggestedQuestion} />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      ref={listRef}
      onScroll={handleScroll}
      aria-live="polite"
    >
      {messages.map((m) => (
        <AssistantMessage key={m.id} message={m} />
      ))}
      {isAsking && <AssistantTypingIndicator />}
      {error && (
        <div className="mt-2 flex justify-start">
          <div className="rounded-panel bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
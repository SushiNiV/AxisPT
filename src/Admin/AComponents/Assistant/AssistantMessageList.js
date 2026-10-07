import React, { useEffect, useRef } from 'react';
import AssistantMessage from './AssistantMessage';
import AssistantTypingIndicator from './AssistantTypingIndicator';
import AssistantSuggestedChips from './AssistantSuggestedChips';

function AssistantMessageList({ messages, isAsking, error, onSuggestedQuestion }) {
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
      <div className="AssistantEmptyState">
        <div className="emptyState">
          <div className="emptyStateIcon">🎓</div>
          <h3 className="emptyStateTitle">Ask About Academic Policy</h3>
          <p className="emptyStateText">
            Get answers from the Student Handbook, with citations to the exact section.
          </p>
          <AssistantSuggestedChips onSelect={onSuggestedQuestion} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="AssistantMessageList"
      ref={listRef}
      onScroll={handleScroll}
      aria-live="polite"
    >
      {messages.map((m) => (
        <AssistantMessage key={m.id} message={m} />
      ))}

      {isAsking && <AssistantTypingIndicator />}

      {error && (
        <div className="AssistantMessage AssistantMessage--error">
          <span className="AssistantErrorText">{error}</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default AssistantMessageList;
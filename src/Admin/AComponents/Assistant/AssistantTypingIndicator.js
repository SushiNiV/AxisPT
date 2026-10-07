import React from 'react';

function AssistantTypingIndicator() {
  return (
    <div className="AssistantMessage AssistantMessage--assistant">
      <div className="AssistantBubble AssistantBubble--assistant AssistantTypingDots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default AssistantTypingIndicator;
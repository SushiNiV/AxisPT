import React from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import AssistantAnswerText from './AssistantAnswerText';
import AssistantSources from './AssistantSources';

function AssistantMessage({ message }) {
  const isUser = message.role === 'user';
  const isRefusal =
    !isUser && Array.isArray(message.sources) && message.sources.length === 0;

  if (isUser) {
    return (
      <div className="AssistantMessage AssistantMessage--user">
        <div className="AssistantBubble AssistantBubble--user">{message.text}</div>
      </div>
    );
  }

  return (
    <div
      className={
        'AssistantMessage AssistantMessage--assistant' +
        (isRefusal ? ' AssistantMessage--noAnswer' : '')
      }
    >
      <div className="AssistantBubble AssistantBubble--assistant">
        {isRefusal && (
          <div className="AssistantNoAnswerIcon">
            <BiInfoCircle />
          </div>
        )}
        <AssistantAnswerText
          text={message.text}
          sources={message.sources || []}
          messageId={message.id}
        />
        {isRefusal && (
          <p className="AssistantNoAnswerHint">
            This may not be covered in the current knowledge base. Try rephrasing, or
            check the handbook directly.
          </p>
        )}
      </div>

      <AssistantSources sources={message.sources || []} messageId={message.id} />
    </div>
  );
}

export default AssistantMessage;
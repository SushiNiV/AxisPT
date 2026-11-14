import React from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import AssistantAnswerText from './AssistantAnswerText';
import AssistantSources from './AssistantSources';

export default function AssistantMessage({ message }) {
  const isUser = message.role === 'user';
  const isRefusal = !isUser && (message.refused ?? (Array.isArray(message.sources) && message.sources.length === 0));

  if (isUser) {
    return (
      <div className="flex max-w-[85%] flex-col items-end self-end gap-1">
        <div className="rounded-panel rounded-br-sm bg-brand px-4 py-2.5 text-sm text-brand-on">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex max-w-[95%] flex-col items-start self-start gap-2 ${isRefusal ? 'mt-1' : ''}`}>
      <div className={`rounded-panel rounded-bl-sm px-4 py-3 text-sm ring-1 ring-inset ${
        isRefusal 
          ? 'bg-warn-soft text-warn ring-warn/20' 
          : 'bg-surface-2 text-ink ring-line'
      }`}>
        {isRefusal && <div className="mb-2 text-lg"><BiInfoCircle /></div>}
        <AssistantAnswerText text={message.text} sources={message.sources || []} messageId={message.id} />
        {isRefusal && (
          <p className="mt-2 text-xs opacity-80">
            This may not be covered in the current knowledge base. Try rephrasing, or check the handbook directly.
          </p>
        )}
      </div>

      <AssistantSources sources={message.sources || []} messageId={message.id} />
    </div>
  );
}
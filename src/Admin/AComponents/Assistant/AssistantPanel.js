import React, { useEffect, useRef } from 'react';
import { BiTrash, BiX } from 'react-icons/bi';
import { HiSparkles } from 'react-icons/hi';
import useAssistant from './UseAssistant';
import AssistantMessageList from './AssistantMessageList';
import AssistantInput from './AssistantInput';

export default function AssistantPanel({ onClose, autoAsk, onAutoAskHandled }) {
  const { messages, isAsking, error, ask, clearHistory } = useAssistant();
  const lastAutoAskRef = useRef(null);

  useEffect(() => {
    if (!autoAsk) { lastAutoAskRef.current = null; return; }
    if (lastAutoAskRef.current === autoAsk) return;
    lastAutoAskRef.current = autoAsk;
    ask(autoAsk);
    onAutoAskHandled?.();
  }, [autoAsk, ask, onAutoAskHandled]);
  
  return (
    <div className="ax flex h-full w-full flex-col overflow-hidden bg-surface">
      {/* GRADIENT HEADER */}
      <div className="flex shrink-0 items-center justify-between bg-gradient-to-br from-brand to-[#4a0a14] px-4 py-3 text-brand-on shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-brand-on shadow-inner">
            <HiSparkles className="text-xl" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold">Axis AI</h2>
            <p className="text-xs opacity-80">CPT Handbook & Policies</p>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-ctl text-xl text-brand-on hover:bg-white/10 disabled:opacity-40 transition-colors"
            onClick={clearHistory}
            aria-label="Clear chat history"
            disabled={messages.length === 0}
          >
            <BiTrash />
          </button>
          {onClose && (
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-ctl text-xl text-brand-on hover:bg-white/10 transition-colors"
              onClick={onClose}
              aria-label="Close assistant"
            >
              <BiX />
            </button>
          )}
        </div>
      </div>

      {/* MESSAGE LIST WRAPPER */}
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AssistantMessageList messages={messages} isAsking={isAsking} error={error} onSuggestedQuestion={ask} />
      </div>
      
      {/* INPUT */}
      <div className="shrink-0">
        <AssistantInput onSend={ask} disabled={isAsking} />
      </div>
    </div>
  );
}
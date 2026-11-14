import React from 'react';
import { BiTrash, BiX } from 'react-icons/bi';
import { HiSparkles } from 'react-icons/hi';
import useAssistant from './UseAssistant';
import AssistantMessageList from './AssistantMessageList';
import AssistantInput from './AssistantInput';

export default function AssistantPanel({ onClose }) {
  const { messages, isAsking, error, ask, clearHistory } = useAssistant();
  const lastLive = [...messages].reverse().find((m) => m.role === 'assistant' && m.liveData)?.liveData;

  return (
    <div className="ax flex h-full w-full flex-col bg-surface">
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

      <AssistantMessageList messages={messages} isAsking={isAsking} error={error} onSuggestedQuestion={ask} />
      <AssistantInput onSend={ask} disabled={isAsking} />
    </div>
  );
}
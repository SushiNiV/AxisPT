import React from 'react';
import { BiTrash, BiX } from 'react-icons/bi';
import useAssistant from './UseAssistant';
import AssistantMessageList from './AssistantMessageList';
import AssistantInput from './AssistantInput';

function AssistantPanel({ onClose }) {
  const { messages, isAsking, error, ask, clearHistory } = useAssistant();
  const lastLive = [...messages].reverse().find((m) => m.role === 'assistant' && m.liveData)?.liveData;

  return (
    <>
      <div className="AssistantPanelHeader">
        {lastLive && (
          <div className="AssistantLiveStatus">
            {lastLive === 'ok' ? '🟢 Using live dashboard data' : '⚪ Live data unavailable'}
          </div>
        )}
        <span className="AssistantPanelTitle">ACADEMIC POLICY ASSISTANT</span>
        <div className="AssistantPanelActions">
          <button
            type="button"
            className="AssistantIconBtn"
            onClick={clearHistory}
            aria-label="Clear chat history"
            disabled={messages.length === 0}
          >
            <BiTrash />
          </button>
          {onClose && (
            <button
              type="button"
              className="AssistantIconBtn"
              onClick={onClose}
              aria-label="Close assistant"
            >
              <BiX />
            </button>
          )}
        </div>
      </div>

      <AssistantMessageList
        messages={messages}
        isAsking={isAsking}
        error={error}
        onSuggestedQuestion={ask}
      />

      <AssistantInput onSend={ask} disabled={isAsking} />
    </>
  );
}

export default AssistantPanel;
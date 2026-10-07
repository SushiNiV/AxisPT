import React, { useState } from 'react';
import { BiBook } from 'react-icons/bi';

function AssistantSources({ sources, messageId }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="AssistantSourcesBlock">
      <button
        type="button"
        className="AssistantSourcesToggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <BiBook className="AssistantSourcesIcon" />
        <span>
          {sources.length} SOURCE{sources.length > 1 ? 'S' : ''}
        </span>
        <span className={`arrow ${expanded ? 'open' : ''}`}>&#9660;</span>
      </button>

      {expanded && (
        <ul className="AssistantSourcesList">
          {sources.map((s) => (
            <li
              key={s.n}
              id={`msg-${messageId}-source-${s.n}`}
              className="AssistantSourceRow"
            >
              <span className="AssistantSourceNum">[{s.n}]</span>
              <span className="AssistantSourceTitle">{s.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AssistantSources;
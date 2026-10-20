import React from 'react';
import ReactMarkdown from 'react-markdown';

function AssistantAnswerText({ text, sources, messageId }) {
  if (!text) return null;

  const handleCiteClick = (n) => {
    const el = document.getElementById(`msg-${messageId}-source-${n}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('AssistantSourceRow--highlight');
    setTimeout(() => el.classList.remove('AssistantSourceRow--highlight'), 1500);
    const toggle = el
      .closest('.AssistantSourcesBlock')
      ?.querySelector('.AssistantSourcesToggle');
    if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
      toggle.click();
    }
  };

  // Custom renderer for text nodes: split on [n] and inject buttons.
  const renderTextWithCitations = (children) => {
    // children may be a string or an array; flatten to string
    const raw = Array.isArray(children)
      ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
      : String(children);

    const parts = raw.split(/(\[\d+\])/g);

    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;

      const n = Number(match[1]);
      const source = sources.find((s) => s.n === n);
      if (!source) return <React.Fragment key={i}>{part}</React.Fragment>;

      return (
        <button
          key={i}
          type="button"
          className="CitationChip"
          onClick={() => handleCiteClick(n)}
          aria-label={`View source ${n}: ${source.title}`}
        >
          {n}
        </button>
      );
    });
  };

  return (
    <div className="AssistantAnswerBody">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p style={{ marginBottom: '8px' }}>{renderTextWithCitations(children)}</p>,
          li: ({ children }) => (
            <li style={{ marginLeft: '20px', marginBottom: '4px' }}>
              {renderTextWithCitations(children)}
            </li>
          ),
          ul: ({ children }) => <ul style={{ margin: '10px 0', paddingLeft: '20px', listStyleType: 'disc' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '10px 0', paddingLeft: '20px', listStyleType: 'decimal' }}>{children}</ol>,
          strong: ({ children }) => <strong>{renderTextWithCitations(children)}</strong>,
          em: ({ children }) => <em>{renderTextWithCitations(children)}</em>,
          a: ({ children }) => <span>{children}</span>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default AssistantAnswerText;
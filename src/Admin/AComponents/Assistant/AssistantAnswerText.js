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

  // Splits string children on [n] and swaps in citation buttons. Anything that
  // is not a string (bold, nested lists, links...) is passed through untouched,
  // so it renders normally instead of becoming "[object Object]" or vanishing.
  const renderTextWithCitations = (children) =>
    React.Children.map(children, (child, idx) => {
      if (typeof child !== 'string') return child;

      return child.split(/(\[\d+\])/g).map((part, i) => {
        const key = `${idx}-${i}`;
        const match = part.match(/^\[(\d+)\]$/);
        if (!match) return <React.Fragment key={key}>{part}</React.Fragment>;

        const n = Number(match[1]);
        const source = sources.find((s) => s.n === n);
        if (!source) return <React.Fragment key={key}>{part}</React.Fragment>;

        return (
          <button
            key={key}
            type="button"
            className="CitationChip"
            onClick={() => handleCiteClick(n)}
            aria-label={`View source ${n}: ${source.title}`}
          >
            {n}
          </button>
        );
      });
    });

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
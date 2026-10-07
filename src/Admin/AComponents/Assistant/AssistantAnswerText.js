import React from 'react';

function AssistantAnswerText({ text, sources, messageId }) {
  if (!text) return null;

  const parts = text.split(/(\[\d+\])/g);

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

  return (
    <p className="AssistantAnswerBody">
      {parts.map((part, i) => {
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
      })}
    </p>
  );
}

export default AssistantAnswerText;
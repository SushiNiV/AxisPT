import React, { useState, useRef, useEffect } from 'react';
import { BiSend } from 'react-icons/bi';

const MAX_LEN = 500;
const WARN_THRESHOLD = 450;

function AssistantInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Auto-grow textarea up to ~5 rows
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 20;
    const maxHeight = lineHeight * 5;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="AssistantInputBar">
      <textarea
        ref={textareaRef}
        className="AssistantInputField"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
        onKeyDown={handleKeyDown}
        placeholder="Ask about academic policy…"
        rows={1}
        disabled={disabled}
        aria-label="Ask the assistant a question"
      />
      <div className="AssistantInputMeta">
        {value.length > WARN_THRESHOLD && (
          <span className="AssistantCharCount">
            {value.length}/{MAX_LEN}
          </span>
        )}
        <button
          type="button"
          className="AssistantSendBtn"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send question"
        >
          <BiSend />
        </button>
      </div>
    </div>
  );
}

export default AssistantInput;
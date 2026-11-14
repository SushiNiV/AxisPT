import React, { useState, useRef, useEffect } from 'react';
import { BiSend } from 'react-icons/bi';

const MAX_LEN = 500;
const WARN_THRESHOLD = 450;

export default function AssistantInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

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
    <div className="flex shrink-0 items-end gap-2 border-t !border-line bg-surface p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
        onKeyDown={handleKeyDown}
        placeholder="Ask about academic policy…"
        rows={1}
        disabled={disabled}
        aria-label="Ask the assistant a question"
        className="min-h-[44px] flex-1 resize-none rounded-ctl border !border-line bg-surface-2 px-3 py-2.5 text-base text-ink placeholder:text-ink-3 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      />
      <div className="flex flex-col items-end gap-1">
        {value.length > WARN_THRESHOLD && (
          <span className="text-[10px] text-ink-3">{value.length}/{MAX_LEN}</span>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send question"
          className="grid h-[44px] w-[44px] place-items-center rounded-ctl bg-brand text-brand-on transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          <BiSend className="text-xl" />
        </button>
      </div>
    </div>
  );
}
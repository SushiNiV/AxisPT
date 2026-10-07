import React, { useState, useEffect } from 'react';
import { BiMessageSquareDetail, BiX } from 'react-icons/bi';
import AssistantPanel from './AssistantPanel';
import '../../../Assistant.css';

function AssistantWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="AssistantWidgetRoot">
      {open && (
        <div
          className="AssistantFloatingPanel"
          role="dialog"
          aria-label="Academic policy assistant"
        >
          <AssistantPanel onClose={() => setOpen(false)} />
        </div>
      )}
      <button
        type="button"
        className="AssistantLauncherBtn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open academic policy assistant'}
      >
        {open ? <BiX /> : <BiMessageSquareDetail />}
      </button>
    </div>
  );
}

export default AssistantWidget;
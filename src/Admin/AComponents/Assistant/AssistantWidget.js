import React, { useState, useEffect, useCallback } from 'react';
import { BiX } from 'react-icons/bi';
import { HiSparkles } from 'react-icons/hi';
import AssistantPanel from './AssistantPanel';
import '../../../Assistant.css';

const NUDGE_KEY = 'axispt_assistant_nudge_seen';
const NUDGE_DELAY_MS = 1500;   // wait after page load before showing
const NUDGE_VISIBLE_MS = 9000; // auto-hide after this long

// Storage can be blocked (private mode, policies). If so, skip the nudge entirely.
const hasSeenNudge = () => {
  try {
    return localStorage.getItem(NUDGE_KEY) === '1';
  } catch {
    return true;
  }
};

const markNudgeSeen = () => {
  try {
    localStorage.setItem(NUDGE_KEY, '1');
  } catch {
    /* ignore */
  }
};

function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  // Close the panel on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // One-time speech bubble. Marked as seen the moment it appears,
  // so a reload mid-display won't show it again.
  useEffect(() => {
    if (hasSeenNudge()) return undefined;

    const showTimer = setTimeout(() => {
      setShowNudge(true);
      markNudgeSeen();
    }, NUDGE_DELAY_MS);
    const hideTimer = setTimeout(() => setShowNudge(false), NUDGE_DELAY_MS + NUDGE_VISIBLE_MS);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const toggle = useCallback(() => {
    setShowNudge(false);
    setOpen((o) => !o);
  }, []);

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

      {showNudge && !open && (
        <div className="AssistantNudge" role="status">
          <button type="button" className="AssistantNudgeText" onClick={toggle}>
            Ask me about academic policy
          </button>
          <button
            type="button"
            className="AssistantNudgeClose"
            onClick={() => setShowNudge(false)}
            aria-label="Dismiss tip"
          >
            <BiX />
          </button>
        </div>
      )}

      <button
        type="button"
        className={`AssistantLauncherBtn${open ? ' AssistantLauncherBtn--open' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Ask AI: open academic policy assistant'}
      >
        <span className="AssistantLauncherIcon" aria-hidden="true">
          {open ? <BiX /> : <HiSparkles />}
        </span>
        <span className="AssistantLauncherLabel">{open ? 'Close' : 'Ask AI'}</span>
      </button>
    </div>
  );
}

export default AssistantWidget;
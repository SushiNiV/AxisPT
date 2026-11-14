import React, { useState, useEffect, useRef } from 'react';
import { BiX } from 'react-icons/bi';
import { HiSparkles } from 'react-icons/hi';
import AssistantPanel from './AssistantPanel';

const NUDGE_KEY = 'axispt_assistant_nudge_seen';
const NUDGE_DELAY_MS = 1500;
const NUDGE_VISIBLE_MS = 9000;

const DEFAULT_BOTTOM = 24; 
const HEADER_OFFSET = 140; // Approximate height of the PageHeader + Tabs to keep it below

const hasSeenNudge = () => {
  try { return localStorage.getItem(NUDGE_KEY) === '1'; } catch { return true; }
};
const markNudgeSeen = () => {
  try { localStorage.setItem(NUDGE_KEY, '1'); } catch {}
};

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  
  const [bottomPos, setBottomPos] = useState(DEFAULT_BOTTOM);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragRef = useRef(null);
  const savedPosRef = useRef(DEFAULT_BOTTOM);
  
  const currentPosRef = useRef(DEFAULT_BOTTOM);
  const rafRef = useRef(null);

  const handleClose = () => {
    setBottomPos(savedPosRef.current);
    currentPosRef.current = savedPosRef.current;
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (hasSeenNudge()) return undefined;
    const showTimer = setTimeout(() => { setShowNudge(true); markNudgeSeen(); }, NUDGE_DELAY_MS);
    const hideTimer = setTimeout(() => setShowNudge(false), NUDGE_DELAY_MS + NUDGE_VISIBLE_MS);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  const toggleOpen = () => {
    if (!open) {
      savedPosRef.current = bottomPos;
      setBottomPos(DEFAULT_BOTTOM);
      currentPosRef.current = DEFAULT_BOTTOM;
      setOpen(true);
    } else {
      handleClose();
    }
    setShowNudge(false);
  };

  const startDrag = (e) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startY: e.clientY,
      origY: bottomPos,
      moved: false,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e) => {
      if (!dragRef.current) return;
      
      const dy = dragRef.current.startY - e.clientY;
      
      if (Math.abs(dy) > 3) dragRef.current.moved = true;

      // 1. Calculate the max height (window height - header offset)
      // 2. Ensure it doesn't go below 16px (bottom safe zone)
      const maxTop = window.innerHeight - HEADER_OFFSET;
      const newY = Math.max(16, Math.min(maxTop, dragRef.current.origY + dy));
      
      currentPosRef.current = newY;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setBottomPos(currentPosRef.current);
          rafRef.current = null;
        });
      }
    };

    const onUp = () => {
      if (!dragRef.current) return;

      setIsDragging(false);
      
      if (dragRef.current.moved) {
        savedPosRef.current = currentPosRef.current;
      } else {
        toggleOpen();
      }
      
      dragRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging]);

  return (
    <div className="ax fixed inset-0 z-[899] pointer-events-none print:hidden">
      
      {/* FLOATING PANEL (Anchored exactly above the default button pos) */}
      {open && (
        <div 
          className="pointer-events-auto absolute bottom-[88px] right-6 flex h-[min(600px,80vh)] w-[min(400px,calc(100vw-3rem))] flex-col overflow-hidden rounded-panel border !border-line bg-surface shadow-2xl animate-in slide-in-from-bottom-10 zoom-in-95 fade-in duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <AssistantPanel onClose={handleClose} />
        </div>
      )}

      {/* NUDGE BUBBLE */}
      {showNudge && !open && (
        <div 
          className="pointer-events-auto absolute flex items-center gap-2 rounded-panel border !border-line bg-surface p-2 shadow-lift animate-in slide-in-from-bottom-5 fade-in duration-300"
          style={{ right: '24px', bottom: bottomPos + 64 }}
        >
          <button type="button" className="text-sm font-medium text-ink hover:text-brand px-2" onClick={toggleOpen}>
            Ask me about academic policy
          </button>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
            onClick={() => setShowNudge(false)}
            aria-label="Dismiss tip"
          >
            <BiX />
          </button>
        </div>
      )}

      {/* LAUNCHER BUTTON (Vertical Drag) */}
      <button
        type="button"
        onMouseDown={startDrag}
        style={{ right: '24px', bottom: bottomPos }}
        className={`pointer-events-auto absolute flex h-14 items-center gap-2 rounded-full pl-2 pr-5 shadow-[0_8px_30px_rgb(110,26,43,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 bg-gradient-to-br from-brand to-[#4a0a14] text-brand-on ${
          open 
            ? 'scale-95 shadow-xl'
            : 'hover:scale-105 hover:shadow-[0_12px_40px_rgb(110,26,43,0.6)]'
        } ${
          isDragging 
            ? 'cursor-grabbing' 
            : 'cursor-grab transition-all duration-300'
        }`}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Ask AI'}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
          <div className="relative flex h-full w-full items-center justify-center">
            <HiSparkles 
              className={`absolute text-xl transition-all duration-300 ${open ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} 
            />
            <BiX 
              className={`absolute text-xl transition-all duration-300 ${open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} 
            />
          </div>
        </div>
        <span className="whitespace-nowrap font-semibold tracking-wide">
          {open ? 'Close' : 'Ask AI'}
        </span>
      </button>
      
    </div>
  );
}
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BiX } from 'react-icons/bi';

/**
 * Mobile-first bottom sheet. Closes on backdrop tap and Escape.
 * Needs `@keyframes sheetUp` from src/GlobalStyle/Tailwind.css.
 */
export default function BottomSheet({ open, onClose, title, children }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="ax fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 max-h-[88dvh] animate-[sheetUp_0.22s_ease-out] overflow-y-auto rounded-t-sheet bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-lift focus:outline-none motion-reduce:animate-none"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-xl text-ink-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <BiX />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
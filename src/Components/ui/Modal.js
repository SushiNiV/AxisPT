import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BiX } from 'react-icons/bi';
import cx from './Cx';
import ConfirmationModal from '../shared/ConfirmationModal';

export default function Modal({ 
  isOpen, onClose, variant = 'form', title, description, icon, children, footer,
  loading = false, isDirty = false, size = 'default'
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  
  const onCloseRef = useRef(onClose);
  const loadingRef = useRef(loading);
  const isDirtyRef = useRef(isDirty);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  const requestClose = () => {
    if (loadingRef.current) return;
    if (isDirtyRef.current) {
      setShowDiscardConfirm(true);
    } else {
      onCloseRef.current();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loadingRef.current) {
        if (isDirtyRef.current) setShowDiscardConfirm(true);
        else onCloseRef.current();
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const isAlert = variant === 'alert';

  // Size variants
  const sizeClass = {
    sm: 'md:max-w-md',
    default: isAlert ? 'md:max-w-[420px]' : 'md:max-w-4xl',
    lg: 'md:max-w-5xl',
    xl: 'md:max-w-6xl',
    '2xl': 'md:max-w-7xl',
    full: 'md:max-w-[95vw]',
  }[size] || (isAlert ? 'md:max-w-[420px]' : 'md:max-w-4xl');

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) requestClose();
  };

  return createPortal(
    <>
      <div 
        className="ax fixed inset-0 z-[1000] flex flex-col bg-surface md:items-center md:justify-center md:bg-black/60 md:backdrop-blur-[2px] md:p-6"
        onClick={handleBackdropClick}
      >
        <div
          ref={panelRef}
          role={isAlert ? 'alertdialog' : 'dialog'}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          onClick={(e) => e.stopPropagation()}
          className={cx(
            'relative flex w-full flex-col bg-surface shadow-lift focus:outline-none',
            'h-full rounded-none md:h-auto md:max-h-[min(90dvh,820px)] md:rounded-panel',
            sizeClass
          )}
        >
          <div className="relative flex shrink-0 flex-col px-6 pb-2 pt-6 md:px-8 md:pt-8">
            <button 
              type="button" onClick={requestClose} disabled={loading} 
              aria-label="Close"
              className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-xl text-ink-2 hover:bg-surface-2 md:right-6 md:top-6 disabled:opacity-50"
            >
              <BiX />
            </button>
            
            {icon && !isAlert && (
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border-2 border-brand/20 bg-surface text-brand dark:border-maroon-500/30 dark:text-maroon-400">
                {icon}
              </div>
            )}
            
            <h3 id={titleId} className={cx('text-xl font-semibold', isAlert ? 'text-center text-ink' : 'text-brand dark:text-maroon-400')}>
              {title}
            </h3>
            {description && (
              <p id={descId} className={cx("mt-1 text-sm text-ink-2", isAlert && "text-center")}>{description}</p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto w-full">{children}</div>
          </div>

          {footer && (
            <div className="flex shrink-0 items-center justify-end gap-3 border-t !border-line bg-surface px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">
              {typeof footer === 'function' ? footer({ requestClose }) : footer}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDiscardConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them and close this form?"
        variant="warning"
        isAlert={false}
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onCloseRef.current();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>,
    document.getElementById('portal-root') || document.body
  );
}
import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BiX, BiInfoCircle, BiError, BiCheckCircle, BiTrash } from 'react-icons/bi';
import cx from '../ui/Cx';
import Button from '../ui/Button';
import Dropdown from '../shared/Dropdown'; 

/**
 * Reusable confirmation / alert modal.
 * Desktop: centered floating panel. Mobile (<768px): bottom sheet.
 * Styled to match the centered, soft-icon, floating close button design.
 */

const TONE = {
  danger:  { Icon: BiTrash,       tile: 'bg-danger/10 text-danger', btn: 'danger',  btnClass: '' },
  warning: { Icon: BiError,       tile: 'bg-warn/10 text-warn',     btn: 'primary', btnClass: '!bg-warn !text-white hover:!brightness-95' }, 
  info:    { Icon: BiInfoCircle,  tile: 'bg-brand/10 text-brand-ink', btn: 'primary', btnClass: '' },
  success: { Icon: BiCheckCircle, tile: 'bg-ok/10 text-ok',         btn: 'primary', btnClass: '!bg-ok !text-white hover:!brightness-95' },
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ConfirmationModal({
  isOpen,
  title = 'Confirm action',
  summary,
  message,
  children,
  variant = 'info',
  confirmLabel,
  cancelLabel = 'Cancel',
  isAlert = false,
  onConfirm,
  onCancel,
  loading = false,

  selectLabel,
  selectPlaceholder = 'Select an option',
  selectValue,
  selectOptions = [],
  onSelectChange,
  selectRequired = false,

  showInput = false,
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
  inputRequired = false,
}) {
  const panelRef = useRef(null);
  const closeRef = useRef(onCancel);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();
  const descId = useId();
  const inputId = useId();

  useEffect(() => { closeRef.current = onCancel; });

  // Open lifecycle: remember the opener, lock page scroll, move focus in; undo all of it on close.
  useEffect(() => {
    if (!isOpen) return undefined;
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [isOpen]);

  // Keyboard: Esc closes (unless busy); Tab stays inside the dialog.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) {
        closeRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const items = panelRef.current.querySelectorAll(FOCUSABLE);
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const portalTarget = document.getElementById('portal-root') || document.body;

  const { Icon, tile, btn, btnClass } = TONE[variant] || TONE.info;
  const defaultConfirm = isAlert ? 'OK' : 'Confirm';
  const hasText = Boolean(summary || message);
  const hasBody = Boolean(selectLabel || showInput || children);

  const handleBackdropMouseDown = (e) => {
    pressStartedOnBackdrop.current = e.target === e.currentTarget;
  };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && pressStartedOnBackdrop.current && !loading) onCancel?.();
  };

  const confirmDisabled =
    loading ||
    (selectRequired && !selectValue) ||
    (showInput && inputRequired && !(inputValue || '').trim());

  // Map string options to { value, label } objects for the Dropdown
  const dropdownOptions = [
    { value: "", label: selectPlaceholder },
    ...selectOptions.map(opt => ({ value: opt, label: opt }))
  ];

  const modalContent = (
    <div
      className="ax fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div
        ref={panelRef}
        role={isAlert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hasText ? descId : undefined}
        tabIndex={-1}
        className={cx(
          // Changed overflow-hidden to overflow-visible so the dropdown isn't cut off
          'relative flex w-full max-w-[420px] flex-col overflow-visible rounded-[24px] bg-surface p-6 shadow-lift focus:outline-none',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-ink-2 transition-colors hover:bg-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60 z-10"
        >
          <BiX className="text-lg" />
        </button>

        {/* Centered Content */}
        <div className="flex flex-col items-center text-center mt-2">
          
          {/* Soft Icon Tile */}
          <span className={cx('mb-4 grid h-16 w-16 place-items-center rounded-full text-3xl', tile)}>
            <Icon />
          </span>

          <h3 id={titleId} className="text-xl font-semibold text-ink">{title}</h3>
          
          {/* Neutral Text - forcing ink colors here */}
          {hasText && (
            <div id={descId} className="mt-2 text-sm text-ink-2">
              {summary && <div className="font-medium text-ink">{summary}</div>}
              {message && <div className="mt-1">{message}</div>}
            </div>
          )}

          {/* Form inputs if needed */}
          {hasBody && (
            <div className="mt-6 w-full space-y-4 text-left">
              {selectLabel && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink">
                    {selectLabel}
                    {selectRequired && <span className="text-danger"> *</span>}
                  </label>
                  
                  {/* Replaced native select with custom Dropdown */}
                  <Dropdown
                    options={dropdownOptions}
                    value={selectValue || ''}
                    onChange={(val) => onSelectChange?.(val)}
                    disabled={loading}
                    placeholder={selectPlaceholder}
                  />
                </div>
              )}

              {showInput && (
                <div className="space-y-1.5">
                  <label htmlFor={inputId} className="block text-sm font-medium text-ink">
                    {inputLabel}
                    {inputRequired && <span className="text-danger"> *</span>}
                  </label>
                  <textarea
                    id={inputId}
                    placeholder={inputPlaceholder}
                    value={inputValue || ''}
                    onChange={(e) => onInputChange?.(e.target.value)}
                    disabled={loading}
                    rows={3}
                    className="w-full rounded-ctl border-0 bg-surface-2 px-3.5 py-3 text-base text-ink placeholder:text-ink-3 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              )}

              {children}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="mt-8 flex w-full gap-3">
          {!isAlert && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-12 rounded-ctl bg-surface-2 text-sm font-semibold text-ink transition-colors hover:bg-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          )}
          
          <Button
            variant={btn}
            onClick={onConfirm}
            loading={loading}
            disabled={confirmDisabled}
            className={cx('flex-1 h-12 text-sm font-semibold rounded-ctl', btnClass)}
          >
            {loading ? 'Working…' : (confirmLabel || defaultConfirm)}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalTarget);
}

export default ConfirmationModal;
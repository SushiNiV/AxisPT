import React from 'react';
import ReactDOM from 'react-dom';
import '../../GlobalOverlay.css';
import '../../GlobalForm.css';
import './Confirmation.css';
/**
 * Reusable confirmation / alert modal.
 *
 * Props:
 *   - isOpen:      boolean – show/hide
 *   - title:       string  – modal header text
 *   - summary:     ReactNode – optional large lead line
 *   - message:     string | ReactNode – smaller supporting text
 *   - children:    ReactNode – optional extra content
 *   - variant:     'danger' | 'warning' | 'info' | 'success'
 *   - confirmLabel, cancelLabel: string
 *   - isAlert:     boolean – hides cancel button
 *   - onConfirm, onCancel: () => void
 *   - loading:     boolean – disables buttons, shows "Processing..."
 *
 *   Dropdown (optional):
 *   - selectLabel:       string
 *   - selectPlaceholder: string
 *   - selectValue:       string
 *   - selectOptions:     string[]
 *   - onSelectChange:    (value) => void
 *   - selectRequired:    boolean
 *
 *   Textarea (optional):
 *   - showInput:         boolean – render the textarea
 *   - inputLabel:        string
 *   - inputPlaceholder:  string
 *   - inputValue:        string
 *   - onInputChange:     (value) => void
 *   - inputRequired:     boolean
 */
function ConfirmationModal({
  isOpen,
  title = 'Confirm Action',
  summary,
  message,
  children,
  variant = 'info',
  confirmLabel,
  cancelLabel = 'CANCEL',
  isAlert = false,
  onConfirm,
  onCancel,
  loading = false,

  // Dropdown
  selectLabel,
  selectPlaceholder = 'Select an option',
  selectValue,
  selectOptions = [],
  onSelectChange,
  selectRequired = false,

  // Textarea
  showInput = false,
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
  inputRequired = false,
}) {
  if (!isOpen) return null;

  const portalTarget = document.getElementById('portal-root') || document.body;

  const variantConfig = {
    danger:  { icon: '⚠️', color: '#c62828', buttonColor: '#3d1616' },
    warning: { icon: '⚠️', color: '#e65100', buttonColor: '#e65100' },
    info:    { icon: 'ℹ️', color: '#3d1616', buttonColor: '#3d1616' },
    success: { icon: '✅', color: '#2e7d32', buttonColor: '#2e7d32' },
  };

  const config = variantConfig[variant] || variantConfig.info;
  const defaultConfirm = isAlert ? 'OK' : 'CONFIRM';

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) onCancel?.();
  };

  const confirmDisabled =
    loading ||
    (selectRequired && !selectValue) ||
    (showInput && inputRequired && !(inputValue || '').trim());

  const modalContent = (
    <div className="modalOverlay" onClick={handleBackdropClick}>
      <div
        className="modalContainer confirmContainer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h3 className="modalTitle">{title}</h3>
          <div className="CloseBtnArea">
            <button
              type="button"
              className="CloseBtn"
              onClick={onCancel}
              disabled={loading}
            >
              &times;
            </button>
          </div>
        </div>

        <div className="modalScrollArea">
          <div className="confirmBody">
            <div className="confirmIcon" style={{ color: config.color }}>
              {config.icon}
            </div>

            {summary && <div className="confirmSummary">{summary}</div>}

            {message && <div className="confirmMessage">{message}</div>}

            {/* ---- Optional dropdown ---- */}
            {selectLabel && (
              <div className="confirmInputBlock">
                <label
                  htmlFor="confirm-modal-select"
                  className="confirmInputLabel"
                >
                  {selectLabel}
                  {selectRequired && (
                    <span className="confirmInputRequired"> *</span>
                  )}
                </label>
                <select
                  id="confirm-modal-select"
                  className="confirmSelect"
                  value={selectValue || ''}
                  onChange={(e) => onSelectChange?.(e.target.value)}
                  disabled={loading}
                >
                  <option value="">{selectPlaceholder}</option>
                  {selectOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ---- Optional textarea (e.g. "Others" specify) ---- */}
            {showInput && (
              <div className="confirmInputBlock">
                <label
                  htmlFor="confirm-modal-input"
                  className="confirmInputLabel"
                >
                  {inputLabel}
                  {inputRequired && (
                    <span className="confirmInputRequired"> *</span>
                  )}
                </label>
                <textarea
                  id="confirm-modal-input"
                  className="confirmTextarea"
                  placeholder={inputPlaceholder}
                  value={inputValue || ''}
                  onChange={(e) => onInputChange?.(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>
            )}

            {children}
          </div>

          <div className="modalFooter">
            {!isAlert && (
              <button
                type="button"
                className="cancelBtn"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              className="submitBtn"
              style={{ backgroundColor: config.buttonColor }}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {loading ? 'PROCESSING...' : (confirmLabel || defaultConfirm)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, portalTarget);
}

export default ConfirmationModal;
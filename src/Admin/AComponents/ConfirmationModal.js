import React from 'react';
import ReactDOM from 'react-dom';
import '../../GlobalOverlay.css';
import '../../GlobalForm.css';

/**
 * Reusable confirmation / alert modal.
 *
 * Props:
 *   - isOpen:      boolean – show/hide
 *   - title:       string  – modal header text
 *   - message:     string | ReactNode – main content
 *   - variant:     'danger' | 'warning' | 'info' | 'success' – controls color + icon
 *   - confirmLabel: string – confirm button text (default: "CONFIRM")
 *   - cancelLabel:  string – cancel button text (default: "CANCEL")
 *   - isAlert:     boolean – if true, hides the cancel button (OK-only)
 *   - onConfirm:   () => void – called on confirm / OK
 *   - onCancel:    () => void – called on cancel / backdrop click
 *   - loading:     boolean – disables buttons and shows "Processing..."
 */
function ConfirmationModal({
  isOpen,
  title = 'Confirm Action',
  message,
  variant = 'info',
  confirmLabel,
  cancelLabel = 'CANCEL',
  isAlert = false,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const portalTarget = document.getElementById('portal-root') || document.body;

  const variantConfig = {
    danger:  { icon: '⚠️', color: '#c62828', buttonColor: '#c62828' },
    warning: { icon: '⚠️', color: '#e65100', buttonColor: '#e65100' },
    info:    { icon: 'ℹ️', color: '#3d1616', buttonColor: '#3d1616' },
    success: { icon: '✅', color: '#2e7d32', buttonColor: '#2e7d32' },
  };

  const config = variantConfig[variant] || variantConfig.info;
  const defaultConfirm = isAlert ? 'OK' : 'CONFIRM';

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel?.();
    }
  };

  const modalContent = (
    <div className="modalOverlay" onClick={handleBackdropClick}>
      <div
        className="modalContainer"
        style={{ maxWidth: '460px' }}
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
          <div
            className="confirmBody"
            style={{ display: 'column', alignItems: 'flex-start' }}
          >
            <div
              className="confirmIcon"
              style={{
                fontSize: '3rem',
                lineHeight: 1,
                flexShrink: 0,
                color: config.color,
              }}
            >
              {config.icon}
            </div>
            <div
              className="confirmMessage"
              style={{
                fontSize: '1rem',
                color: '#333',
                lineHeight: 1.5,
                paddingTop: '4px',
              }}
            >
              {message}
            </div>
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
            disabled={loading}
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
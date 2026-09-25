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
 *   - summary:     ReactNode – optional large lead line (e.g. the question)
 *   - message:     string | ReactNode – smaller supporting text
 *   - children:    ReactNode – optional extra content below the message
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
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
              padding: '8px 0',
            }}
          >
            <div
              className="confirmIcon"
              style={{
                fontSize: '3rem',
                lineHeight: 1,
                color: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {config.icon}
            </div>

            {summary && (
              <div
                className="confirmSummary"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: '#222',
                  lineHeight: 1.4,
                  maxWidth: '380px',
                }}
              >
                {summary}
              </div>
            )}

            {message && (
              <div
                className="confirmMessage"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 400,
                  color: '#666',
                  lineHeight: 1.5,
                  maxWidth: '380px',
                }}
              >
                {message}
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
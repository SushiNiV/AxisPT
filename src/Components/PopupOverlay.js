import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './PopupOverlay.css';

const PopupOverlay = ({ isOpen, onClose, icon, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {document.body.style.overflow = 'unset'};
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="overlayBackdrop" onClick={onClose}>
      <div className="overlayContent" onClick={(e) => e.stopPropagation()}>
        
        <div className="overlayHeader">
          <h3>{title}</h3>
          <button className="closeBt" onClick={onClose}>&times;</button>
        </div>
        {icon && (
          <div className="overlayIconWrapper">
            {icon}
          </div>
        )}
        <div className="overlayBody">
          {children}
        </div>
      </div>
    </div>,
    document.getElementById('portal-root')
  );
};

export default PopupOverlay;
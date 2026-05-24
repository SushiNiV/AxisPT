import React from 'react';
import ReactDOM from 'react-dom';
import { BiInfoCircle } from 'react-icons/bi';
import PopupOverlay from './PopupOverlay';

function SessionExpired({ onConfirm }) {
  const portalRoot = document.getElementById('portal-root') || document.body;

  const modalContent = (
    <PopupOverlay 
      isOpen={true} 
      onClose={() => {}} 
      title="SESSION EXPIRED"
      icon={<BiInfoCircle />}
    >
      <div>
        <p>Your session has expired. Please log in again to continue.</p>
        <div className="overlayActionButtons">
          <button 
            className="confirmBtn" 
            onClick={onConfirm}
            style={{ backgroundColor: '#3D1616' }}
          >
            OK
          </button>
        </div>
      </div>
    </PopupOverlay>
  );

  return ReactDOM.createPortal(modalContent, portalRoot);
}

export default SessionExpired;
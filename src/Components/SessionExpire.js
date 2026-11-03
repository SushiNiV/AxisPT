import React from 'react';
import ConfirmationModal from './shared/ConfirmationModal'; 

function SessionExpired({ onConfirm }) {
  return (
    <ConfirmationModal
      isOpen={true}
      title="Session Expired"
      message="Your session has expired. Please log in again."
      variant="warning" 
      isAlert={true} 
      confirmLabel="OK"
      onConfirm={onConfirm}
      onCancel={onConfirm}
    />
  );
}

export default SessionExpired;
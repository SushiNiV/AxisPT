import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  OverlayBackdrop,
  OverlayContent,
  OverlayCloseBTArea,
  CloseBt,
  OverlayHeader,
  OverlayIconWrapper,
  OverlayHeaderTitle,
  OverlayBody
} from './PopupOverlay.styles.js';

const PopupOverlay = ({ isOpen, onClose, icon, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <OverlayBackdrop onClick={onClose}>
      <OverlayContent onClick={(e) => e.stopPropagation()}>
        <OverlayCloseBTArea>
          <CloseBt onClick={onClose}>&times;</CloseBt>
        </OverlayCloseBTArea>
        <OverlayHeader>
          {icon && (
            <OverlayIconWrapper>
              {icon}
            </OverlayIconWrapper>
          )}
          <OverlayHeaderTitle>{title}</OverlayHeaderTitle>
        </OverlayHeader>
        <OverlayBody>
          {children}
        </OverlayBody>
      </OverlayContent>
    </OverlayBackdrop>,
    document.getElementById('portal-root')
  );
};

export default PopupOverlay;
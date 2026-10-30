import React from 'react';
import ReactDOM from 'react-dom';
import { BiX } from 'react-icons/bi';
import './SelectionPanel.css'

function SelectionPanel({ selectedCount, onClear, children }) {
  if (selectedCount === 0) return null;

  const panelContent = (
    <div className="bottomPopupContainer">
      <div className="bottomPopupRow">
        <div className="bpopupLeft">
          <p>{selectedCount} items selected</p>
          <BiX 
            className="clearSelectionIcon" 
            onClick={onClear} 
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div className="bpopupRight">
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(panelContent, document.body);
}

export default SelectionPanel;
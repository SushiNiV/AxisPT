import React from 'react';
import {
  AsubheaderContainer,
  AsubheaderBlob
} from './ASubheader.styles';

function ASubheader({ tabs }) {
  if (!tabs || tabs.length === 0) return null;
  
  return (
    <AsubheaderContainer>
      {tabs.map((tab, index) => (
        <AsubheaderBlob 
          key={index} 
          to={tab.path}
        >
          {tab.label}
        </AsubheaderBlob>
      ))}
    </AsubheaderContainer>
  );
}

export default ASubheader;
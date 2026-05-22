import React from 'react';
import { NavLink } from 'react-router-dom';

import '../../Global.css'
import '../../GlobalHeader.css'

function ASubheader({ tabs }) {
  if (!tabs || tabs.length === 0) return null;
  return (
    <div className="SubheaderContainer">
      {tabs.map((tab, index) => (
          <NavLink 
            key={index} 
            to={tab.path} 
            className={({ isActive }) => `SubheaderBlob ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
    </div>
  );
}

export default ASubheader;
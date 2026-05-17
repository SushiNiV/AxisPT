import React from 'react';
import { NavLink } from 'react-router-dom';
import './ASubheader.css';

function ASubheader({ tabs }) {
  if (!tabs || tabs.length === 0) return null;
  return (
    <div className="asubheaderContainer">
      {tabs.map((tab, index) => (
          <NavLink 
            key={index} 
            to={tab.path} 
            className={({ isActive }) => `asubheaderBlob ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
    </div>
  );
}

export default ASubheader;
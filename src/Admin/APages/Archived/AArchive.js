import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from '../../AComponents/ASubheader';
import '../../../GlobalStyle/Global.css';

function AArchive() {
  const role = (sessionStorage.getItem('role') || localStorage.getItem('role') || '').toLowerCase();
  const isAdmin = role === 'admin';

  const archiveTabs = [
    { label: 'Students', path: 'students' }, // Relative path
  ];

  if (isAdmin) {
    archiveTabs.push(
      { label: 'Programs', path: 'programs' },       // Relative path
      { label: 'Sections', path: 'sections' },       // Relative path
      { label: 'Users', path: 'users' }
    );
  }

  return (
    <div className="InnerContainer">
      <ASubheader tabs={archiveTabs} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default AArchive;
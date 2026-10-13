import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from '../../AComponents/ASubheader';
import '../../../Global.css';

function AArchive() {
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';

  const allTabs = [
    { label: 'Students', path: '/admin/archive/students' },
    { label: 'Programs', path: '/admin/archive/programs' },
    { label: 'Sections', path: '/admin/archive/sections' },
  ];

  // Faculty only see Students; Programs/Sections archives are admin-only.
  const archiveTabs = isAdmin
    ? allTabs
    : allTabs.filter((tab) => tab.path === '/admin/archive/students');

  return (
    <div className="ContentContainer">
      <ASubheader tabs={archiveTabs} />
      <Outlet />
    </div>
  );
}

export default AArchive;
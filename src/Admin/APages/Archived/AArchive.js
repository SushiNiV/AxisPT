import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from '../../AComponents/ASubheader';
import '../../../Global.css';

function AArchive() {
  const archiveTabs = [
    { label: 'Students', path: '/admin/archive/students' },
    { label: 'Programs', path: '/admin/archive/programs' },
    { label: 'Sections', path: '/admin/archive/sections' },
  ];

  return (
    <div className="ContentContainer">
      <ASubheader tabs={archiveTabs} />
      <Outlet />
    </div>
  );
}

export default AArchive;
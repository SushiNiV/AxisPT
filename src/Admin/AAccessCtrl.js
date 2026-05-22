import React from 'react';
import { Outlet } from 'react-router-dom';
import './AAccessCtrl.css';
import ASubheader from './AComponents/ASubheader';

function AGrades() {
  const accessCtrlTabs = [
    { label: 'Manage People', path: '/admin/access-control/manage-people' },
    { label: 'Academic Year', path: '/admin/access-control/academic-year' },
    {label: 'Curricula', path: '/admin/access-control/curricula'},
  ];
  return (
    <div className="aaccessContainer">
      <ASubheader tabs={accessCtrlTabs} />
      <div className="pageContent">
        <Outlet />
      </div>
    </div>
  );
}

export default AGrades;
import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from '../../AComponents/ASubheader';
import '../../../GlobalStyle/Global.css';

function AAccessCtrl() {
  const accessCtrlTabs = [
    { label: 'Manage People', path: '/admin/access-control/manage-people' },
    { label: 'Academic Year', path: '/admin/access-control/academic-year' },
    { label: 'Curriculum', path: '/admin/access-control/curricula' },
  ];
  
  return (
    <div className="InnerContainer">
      <ASubheader tabs={accessCtrlTabs} />
      <Outlet />
    </div>
  );
}

export default AAccessCtrl;
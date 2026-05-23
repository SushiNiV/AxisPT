import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from './AComponents/ASubheader';
import './../Global.css';

function AGrades() {
  const accessCtrlTabs = [
    {label: 'Manage People', path: '/admin/access-control/manage-people' },
    {label: 'Academic Year', path: '/admin/access-control/academic-year' },
    {label: 'Curriculum', path: '/admin/access-control/curricula'},
  ];
  return (
    <div className="ContentContainer">
      <ASubheader tabs={accessCtrlTabs} />
      <Outlet />
    </div>
  );
}

export default AGrades;
import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from '../AComponents/ASubheader';
import '../../Global.css';

function AGrades() {
  const gradesTabs = [
    { label: 'Programs & Sections', path: '/admin/academics/programs&sections' },
    { label: 'Courses', path: '/admin/academics/courses' }
  ];
  return (
    <div className="InnerContainer">
      <ASubheader tabs={gradesTabs} />
      <Outlet />
    </div>
  );
}

export default AGrades;
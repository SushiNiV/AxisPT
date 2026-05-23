import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from './AComponents/ASubheader';
import './../Global.css'

function AGrades() {
  const gradesTabs = [
    { label: 'Programs & Sections', path: '/admin/academics/programs&sections' },
    { label: 'Courses', path: '/admin/academics/courses' },
    { label: 'Academic Grades', path: '/admin/academics/grades' },
  ];
  return (
    <div className="InnerContainer">
      <ASubheader tabs={gradesTabs} />
      <div className="Content">
        <Outlet />
      </div>
    </div>
  );
}

export default AGrades;
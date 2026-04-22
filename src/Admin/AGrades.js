import React from 'react';
import { Outlet } from 'react-router-dom';
import './AGrades.css';
import ASubheader from './AComponents/ASubheader';

function AGrades() {
  const gradesTabs = [
    { label: 'Academic Grades', path: '/admin/academics/grades' },
    { label: 'Courses', path: '/admin/academics/courses' },
  ];
  return (
    <div className="agradesContainer">
      <ASubheader tabs={gradesTabs} />
      <div className="pageContent">
        <Outlet />
      </div>
    </div>
  );
}

export default AGrades;
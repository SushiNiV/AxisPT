import React from 'react';
import { Outlet } from 'react-router-dom';
import './AAcademics.css';
import ASubheader from './AComponents/ASubheader';

function AAcademics() {
  const gradesTabs = [
    { label: 'Programs & Sections', path: '/admin/academics/programs&sections' },
    { label: 'Courses', path: '/admin/academics/courses' },
    { label: 'Curriculum', path: '/admin/academics/curriculum' },
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

export default AAcademics;
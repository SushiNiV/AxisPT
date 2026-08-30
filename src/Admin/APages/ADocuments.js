import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from '../AComponents/ASubheader';
import '../../Global.css';

function ADocuments() {
  const documentTabs = [
    { label: 'Student Form', path: '/admin/documents/student-form' },
    { label: 'Term Grade', path: '/admin/documents/term-grade' },
    { label: 'Course Curriculum', path: '/admin/documents/course-curriculum' },
  ];
  return (
    <div className="InnerContainer">
      <ASubheader tabs={documentTabs} />
      <Outlet />
    </div>
  );
}

export default ADocuments;
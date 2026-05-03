import React from 'react';
import { Outlet } from 'react-router-dom';
import './ADocuments.css';
import ASubheader from './AComponents/ASubheader';

function ADocuments() {
  const documentsTabs = [
    { label: 'Student Form', path: '/admin/academics/student-form' },
    { label: 'Course Outline', path: '/admin/documents/course-outline' },
    { label: 'Term Grade', path: '/admin/documents/term-grade' },
    
  
  ];
  return (
    <div className="adocumentsContainer">
      <ASubheader tabs={documentsTabs} />
      <div className="pageContent">
        <Outlet />
      </div>
    </div>
  );
}

export default ADocuments;
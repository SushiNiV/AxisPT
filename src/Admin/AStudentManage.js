import React from 'react';
import { Outlet } from 'react-router-dom';
import './AStudentManage.css';
import ASubheader from './AComponents/ASubheader';

function AStudentManage() {
  const studentTabs = [
    { label: 'Masterlist', path: '/admin/student-management/masterlist' },
    { label: 'Pending Students', path: '/admin/student-management/pending-students' },
    { label: 'Student Grades', path: '/admin/student-management/student-grades' },
  ];
  return (
    <div className="astudentManageContainer">
      <ASubheader tabs={studentTabs} />
      <div className="pageContent">
        <Outlet />
      </div>
    </div>
  );
}

export default AStudentManage;
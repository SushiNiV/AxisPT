import React from 'react';
import { Outlet } from 'react-router-dom';
import './AStudentManage.css';
import ASubheader from './AComponents/ASubheader';

function AStudentManage() {
  const studentTabs = [
    { label: 'Masterlist', path: '/admin/student-management/masterlist' },
    { label: 'Pending Students', path: '/admin/student-management/pending-students' },
    { label: 'Access Control', path: '/admin/student-management/access-control' },
    { label: 'History', path: '/admin/student-management/history' }
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
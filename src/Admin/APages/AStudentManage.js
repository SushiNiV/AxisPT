import React from 'react';
import { Outlet } from 'react-router-dom';
import ASubheader from '../AComponents/ASubheader';
import '../../Global.css';

function AStudentManage() {
  const studentTabs = [
    { label: 'Masterlist', path: '/admin/student-management/masterlist' },
    { label: 'Pending Students', path: '/admin/student-management/pending-students' },
  ];
  return (
    <div className="InnerContainer">
            <ASubheader tabs={studentTabs} />
            <Outlet />
    </div>
  );
}

export default AStudentManage;
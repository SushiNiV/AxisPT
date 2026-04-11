import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="admin-layout" style={{ display: 'flex' }}>
      {/* <Sidebar /> */}
      <div className="admin-content" style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
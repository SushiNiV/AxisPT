import ASidebar from './ASideBar';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => (
  <div className="admin-container" style={{ display: 'flex' }}>
    <ASidebar /> 
    <div className="main-content" style={{ flex: 1 }}>
      <Outlet />
    </div>
  </div>
);
import SSidebar from './SSideBar';
import { Outlet } from 'react-router-dom';

const StudentLayout = () => (
  <div className="student-container" style={{ display: 'flex' }}>
    <SSidebar />
    <div className="main-content" style={{ flex: 1 }}>
      <Outlet />
    </div>
  </div>
);
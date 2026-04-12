import SSidebar from './SSideBar';
import { Outlet } from 'react-router-dom';

function SLayout() {
  return (
    <div className="admin-container" style={{ display: 'flex' }}>
      <SSidebar /> 
      <div className="main-content" style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default SLayout;
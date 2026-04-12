import ASidebar from './ASideBar';
import { Outlet } from 'react-router-dom';

function ALayout() {
  return (
    <div className="admin-container" style={{ display: 'flex' }}>
      <ASidebar /> 
      <div className="main-content" style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default ALayout;
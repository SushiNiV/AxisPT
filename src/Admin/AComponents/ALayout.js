import ASidebar from './ASideBar';
import { Outlet } from 'react-router-dom';

function ALayout() {
  return (
    <div className="adminContainer" style={{ display: 'flex' }}>
      <ASidebar /> 
      <div className="mainContent" style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default ALayout;
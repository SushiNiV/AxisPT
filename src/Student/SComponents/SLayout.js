import SSidebar from './SSideBar';
import SHeader from './SHeader';
import { Outlet } from 'react-router-dom';

function SLayout() {
  return (
    <div className="student-container" style={{ display: 'flex' }}>
      <SSidebar /> 
      <div className="main-content" style={{ flex: 1 }}>
        <SHeader/>
        <Outlet />
      </div>
    </div>
  );
}

export default SLayout;
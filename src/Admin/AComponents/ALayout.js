import ASideBar from './ASideBar';
import AHeader from './AHeader';
import ASubheader from './ASubheader';
import { Outlet } from 'react-router-dom';

function ALayout() {
  return (
    <div className="adminContainer" style={{ display: 'flex' }}>
      <ASideBar />
      <div className="adminMainContainer" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AHeader />
        <ASubheader />
        <main className="adminPageContent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ALayout;
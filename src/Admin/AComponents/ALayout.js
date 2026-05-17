import ASideBar from './ASideBar';
import AHeader from './AHeader';
import ASubheader from './ASubheader';
import './ALayout.css';
import { Outlet } from 'react-router-dom';

function ALayout() {
  return (
    <div className="adminContainer">
      <ASideBar />
      <div className="adminMainContainer">
        <AHeader />
        <main className="adminPageContent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ALayout;
import ASideBar from './ASideBar';
import AHeader from './AHeader';
import { Outlet } from 'react-router-dom';

import '../../Global.css'

function ALayout() {
  return (
    <div className="Container NoScroll">
      <ASideBar />
      <div className="MainContainer">
        <AHeader />
        <main className="PageContent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ALayout;
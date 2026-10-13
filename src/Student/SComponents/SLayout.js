import SSideBar from './SSideBar';
import SHeader from './SHeader';
import { Outlet } from 'react-router-dom';
import '../../Global.css';

function SLayout() {
  return (
    <div className="Container NoScroll">
      <SSideBar />
      <div className="MainContainer">
        <SHeader />
        <main className="PageContent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SLayout;
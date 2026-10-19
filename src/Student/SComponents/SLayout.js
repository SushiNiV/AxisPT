import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SSideBar from './SSideBar';
import SHeader from './SHeader';
import useMediaQuery from '../../Components/useMediaQuery'; // Ensure this path is correct
import '../../GlobalStyle/Global.css';

function SLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="Container NoScroll">
      <SSideBar 
        isMobile={isMobile} 
        mobileNavOpen={mobileNavOpen} 
        closeNav={() => setMobileNavOpen(false)} 
      />
      
      <div className="MainContainer">
        <SHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="PageContent">
          <Outlet />
        </main>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobile && mobileNavOpen && (
        <div 
          className="SidebarOverlay" 
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </div>
  );
}

export default SLayout;
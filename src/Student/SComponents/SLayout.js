import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SSideBar from './SSideBar';
import SHeader from './SHeader';
import AssistantWidget from '../../Admin/AComponents/Assistant/AssistantWidget';
import useMediaQuery from '../../Components/useMediaQuery';
import '../../GlobalStyle/Global.css';
import '../../ResponsiveStyle/ResponsiveComponent.css'; // Ensure this is imported

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

      {isMobile && mobileNavOpen && (
        <div 
          className="SidebarBackdrop" 
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <AssistantWidget />
    </div>
  );
}

export default SLayout;
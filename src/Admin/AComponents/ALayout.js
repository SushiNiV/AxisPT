import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import ASideBar from './ASideBar';
import AHeader from './AHeader';
import AssistantWidget from './Assistant/AssistantWidget';
import useMediaQuery from '../../Components/useMediaQuery';

import '../../GlobalStyle/Global.css';

function ALayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hideAssistant, setHideAssistant] = useState(false);
  
  const mainRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll handler for hiding the Assistant widget
  const handlePageScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY > lastScrollY.current + 10) {
      setHideAssistant(true);
    } else if (currentScrollY < lastScrollY.current - 10) {
      setHideAssistant(false);
    }
    lastScrollY.current = currentScrollY;
  };

  // Build the user object from storage so the profile drawer can read it
  const user = {
    name: sessionStorage.getItem('username') || localStorage.getItem('username') || 'Administrator',
    email: sessionStorage.getItem('email') || localStorage.getItem('email') || '—',
    role: sessionStorage.getItem('role') || localStorage.getItem('role') || 'admin',
    profileUrl: sessionStorage.getItem('profileUrl') || localStorage.getItem('profileUrl') || null,
  };

  return (
    <div className="Container NoScroll">
      <ASideBar
        isMobile={isMobile}
        mobileNavOpen={mobileNavOpen}
        closeNav={() => setMobileNavOpen(false)}
      />

      {mobileNavOpen && (
        <div className="SidebarBackdrop" onClick={() => setMobileNavOpen(false)} />
      )}

      <div className="MainContainer">
        <AHeader 
          user={user} 
          onMenuClick={() => setMobileNavOpen(true)} 
        />
        
        <main 
          className="PageContent" 
          onScroll={handlePageScroll}
          ref={mainRef}
        >
          <Outlet />
        </main>
      </div>

      <div className={`AssistantWrap ${hideAssistant ? 'scrolledDown' : ''}`}>
        <AssistantWidget />
      </div>
    </div>
  );
}

export default ALayout;
import { useState, useEffect } from 'react';
import ASideBar from './ASideBar';
import AHeader from './AHeader';
import { Outlet } from 'react-router-dom';
import AssistantWidget from './Assistant/AssistantWidget';
import useMediaQuery from '../../Components/useMediaQuery';
import {BiChevronLeft} from 'react-icons/bi';

import '../../GlobalStyle/Global.css';

function ALayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

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
      <button
        className={`SidebarHandle ${mobileNavOpen ? 'open' : ''}`}
        aria-label="Close menu"
        aria-hidden={!mobileNavOpen}
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={() => setMobileNavOpen(false)}
      >
  <BiChevronLeft />
</button>
      <div className="MainContainer">
        <AHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="PageContent">
          <Outlet />
        </main>
      </div>
      <div className="AssistantWrap">
        <AssistantWidget />
      </div>
    </div>
  );
}

export default ALayout;
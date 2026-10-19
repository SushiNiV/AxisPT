import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import cptLogo from '../../assets/cpt-logo.png';
import { 
  BiGridAlt, BiBookAlt, BiUser, BiPowerOff, 
  BiSun, BiMoon, BiChevronLeft, BiChevronRight 
} from 'react-icons/bi';
import ConfirmationModal from '../../Admin/AComponents/ConfirmationModal'; // Adjust path if necessary

import '../../GlobalStyle/GlobalSidebar.css';
import '../../GlobalStyle/Global.css';

function SSideBar({ isMobile, mobileNavOpen, closeNav }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [collapsedPref, setCollapsedPref] = useState(false);
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isCollapsed = collapsedPref && !isMobile;

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);
  const toggleCollapse = () => setCollapsedPref(!collapsedPref);

  const handleLogoutConfirm = () => {
    document.body.classList.remove('dark');
    sessionStorage.clear();
    localStorage.clear();
    navigate('/signin');
  };

  const touchStartX = useRef(null);
  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null && touchStartX.current - e.changedTouches[0].clientX > 60) {
      if (closeNav) closeNav();
    }
    touchStartX.current = null;
  };

  return (
    <>
      <div 
        className={`SidebarContainer ${isCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'mobileOpen' : ''}`}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={handleTouchEnd}
      >
        <div className="SidebarArea">  
          <div className='Sidebar LogoArea'>
            <img src={cptLogo} alt='CPT Logo' className='Logo'/>
            {!isCollapsed && (
              <div>
                <h1 className='LogoText'>Student</h1>
                <p className='LogoText'>Axis CPT Portal</p>
              </div>
            )}
            <div className='collapseBtnArea'>
              <button
                className="collapseBtn"
                onClick={toggleCollapse}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <BiChevronRight /> : <BiChevronLeft />}
              </button>
            </div>
          </div>

          <nav className='NavContainer' onClick={closeNav}>
            <NavLink to="/student/dashboard" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
              <BiGridAlt className="linkIcon" /> {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
            
            <NavLink to="/student/grades" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
              <BiBookAlt className="linkIcon" /> {!isCollapsed && <span>Grades</span>}
            </NavLink>
            
            <NavLink to="/student/subjects" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
              <BiBookAlt className="linkIcon" /> {!isCollapsed && <span>Subjects</span>}
            </NavLink>

            <NavLink to="/student/profile" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
              <BiUser className="linkIcon" /> {!isCollapsed && <span>My Profile</span>}
            </NavLink>
          </nav>

          <div className="SidebarFooter">
            {/* Theme Toggle */}
            <div className="themeToggleRow" onClick={toggleTheme}>
              {!isCollapsed && (
                <div className="themeLabel">
                  {isDarkMode ? <BiMoon /> : <BiSun />}
                  <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
              )}
              <label className="themeSwitch" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" onChange={toggleTheme} checked={isDarkMode} />
                <span className="slider">
                  {isCollapsed && <BiSun className="icon-sun" />}
                  {isCollapsed && <BiMoon className="icon-moon" />}
                </span>
              </label>
            </div>

            {/* Logout Button */}
            <button 
              className="logoutSidebarBtn" 
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <BiPowerOff className="logoutIcon" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Confirm Logout"
        summary="Are you sure you want to log out of the system?"
        message="Any unsaved changes may be lost."
        variant="info"
        confirmLabel="LOG OUT"
        cancelLabel="CANCEL"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
}

export default SSideBar;
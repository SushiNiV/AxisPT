import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import cptLogo from '../../assets/cpt-logo.png';
import { 
  BiGridAlt, BiUser, BiBookAlt, BiFile, BiBell, BiHistory, BiArchive, 
  BiSun, BiMoon, BiChevronLeft, BiChevronRight, BiPowerOff 
} from 'react-icons/bi';
import ConfirmationModal from './ConfirmationModal'; // Adjust path if necessary

import '../../GlobalStyle/GlobalSidebar.css';
import '../../GlobalStyle/Global.css';

function ASideBar({ isMobile, mobileNavOpen, closeNav }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [collapsedPref, setCollapsedPref] = useState(false);
  
  // Logout Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isCollapsed = collapsedPref && !isMobile;

  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';

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

  // The actual logout logic
  const handleLogoutConfirm = () => {
    document.body.classList.remove('dark');
    sessionStorage.clear();
    localStorage.clear();
    navigate('/admin/signin');
  };

  const touchStartX = useRef(null);
  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null && touchStartX.current - e.changedTouches[0].clientX > 60) {
      closeNav();
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
                <h1 className='LogoText'>Administrator</h1>
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
            <NavLink to="/admin/dashboard" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
              <BiGridAlt className="linkIcon" /> {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
            
            <NavLink 
              to="/admin/student-management/masterlist" 
              className={() => `navLink ${location.pathname.includes('/admin/student-management') ? 'activeLink' : ''}`}
            >
              <BiUser className="linkIcon" /> {!isCollapsed && <span>Student Management</span>}
            </NavLink>
            
            <NavLink
              to="/admin/academics/programs&sections"
              className={() => `navLink ${location.pathname.includes('/admin/academics') ? 'activeLink' : ''}`}
            >
              <BiBookAlt className="linkIcon" /> {!isCollapsed && <span>Program Management</span>}
            </NavLink>

            <NavLink to="/admin/documents/student-form" className={() => `navLink ${location.pathname.includes('/admin/documents') ? 'activeLink' : ''}`}>
              <BiFile className="linkIcon" /> {!isCollapsed && <span>Documents</span>}
            </NavLink>

            {isAdmin && (
              <NavLink to="/admin/access-control" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
                <BiBell className="linkIcon" /> {!isCollapsed && <span>Access Control</span>}
              </NavLink>
            )}

            {isAdmin && (
              <NavLink to="/admin/history" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
                <BiHistory className="linkIcon" /> {!isCollapsed && <span>History</span>}
              </NavLink>
            )}

            <NavLink to="/admin/archive" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
              <BiArchive className="linkIcon" /> {!isCollapsed && <span>Archive</span>}
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

            {/* Logout Button (Triggers Modal) */}
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
        variant="info" /* <-- CHANGED FROM 'danger' */
        confirmLabel="LOG OUT"
        cancelLabel="CANCEL"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
}

export default ASideBar;
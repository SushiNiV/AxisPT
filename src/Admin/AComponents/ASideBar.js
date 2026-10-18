import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import cptLogo from '../../assets/cpt-logo.png';
import { BiGridAlt, BiUser, BiBookAlt, BiFile, BiBell, BiHistory, BiArchive, BiSun, BiMoon, BiChevronLeft, BiChevronRight } from 'react-icons/bi';

import '../../GlobalStyle/GlobalSidebar.css';
import '../../GlobalStyle/Global.css';

function ASideBar({ isMobile, mobileNavOpen, closeNav }) {
  
  const location = useLocation();
  
  // Initialize from localStorage so the theme persists on reload
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const [collapsedPref, setCollapsedPref] = useState(false);

  const isCollapsed = collapsedPref && !isMobile;

  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';

  // Apply theme class on mount and whenever isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleCollapse = () => {
    setCollapsedPref(!collapsedPref);
  };

  const touchStartX = useRef(null);
  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null && touchStartX.current - e.changedTouches[0].clientX > 60) {
      closeNav();
    }
    touchStartX.current = null;
  };

  return (
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
            className={() => 
              `navLink ${location.pathname.includes('/admin/student-management') ? 'activeLink' : ''}`
            }
          >
            <BiUser className="linkIcon" /> {!isCollapsed && <span>Student Management</span>}
          </NavLink>
          
          <NavLink
            to="/admin/academics/programs&sections"
            className={() => 
              `navLink ${location.pathname.includes('/admin/academics') ? 'activeLink' : ''}`
            }
          >
            <BiBookAlt className="linkIcon" /> {!isCollapsed && <span>Program Management</span>}
          </NavLink>

          <NavLink to="/admin/documents/student-form" className={() => `navLink ${location.pathname.includes('/admin/documents') ? 'activeLink' : ''}`}>
            <BiFile className="linkIcon" /> {!isCollapsed && <span>Documents</span>}
          </NavLink>

          {/* Admin-only: Access Control */}
          {isAdmin && (
            <NavLink to="/admin/access-control" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
              <BiBell className="linkIcon" /> {!isCollapsed && <span>Access Control</span>}
            </NavLink>
          )}

          {/* Admin-only: History */}
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
        <div className="themeToggleArea">
          <label className="themeSwitch">
            <input type="checkbox" onChange={toggleTheme} checked={isDarkMode} />
            <span className="slider">
              <BiSun className="icon-sun" />
              <BiMoon className="icon-moon" />
            </span>
          </label>
        </div>
      </div>
      </div>
    </div>
  );
}

export default ASideBar;
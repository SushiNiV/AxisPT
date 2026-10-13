import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import cptLogo from '../assets/cpt-logo.png';
import { BiGridAlt, BiBookAlt, BiUser, BiSun, BiMoon, BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import '../../GlobalSidebar.css';
import '../../Global.css';

function SSideBar() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className={`SidebarContainer ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="SidebarArea">
        <div className='Sidebar LogoArea'>
          <img src={cptLogo} alt='CPT Logo' className='Logo'/>
          {!isCollapsed && (
            <div>
              <h1 className='LogoText'>Student</h1>
              <p className='LogoText'>Axis CPT Portal</p>
            </div>
          )}
        </div>

        <nav className='NavContainer'>
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
          <div className='collapseBtnArea'>
            <button className="collapseBtn" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <BiChevronRight /> : <BiChevronLeft />}
            </button>
          </div>
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

export default SSideBar;
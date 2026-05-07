import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './SSideBar.css';
import cptLogo from '../../assets/cpt-logo.png';
import { BiGridAlt, BiUser, BiBookAlt, BiGroup, BiBriefcase, BiCheckShield, BiFile, BiBell, BiHistory, BiSun, BiMoon, BiChevronLeft, BiChevronRight } from 'react-icons/bi';

function SSideBar() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`AsidebarContainer ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="AsidebarArea">  
      <div className='AlogoArea'>
        <img src={cptLogo} alt='CPT Logo' className='AmainLogo'/>
        {!isCollapsed && (
          <div className='AlogoText'>
            <h1 className='headT'>Administrator</h1>
            <p className='headT'>Axis CPT Portal</p>
          </div>
        )}
      </div>

      <nav className='navContainer'>
          <NavLink to="/student/dashboard" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
            <BiGridAlt className="linkIcon" /> {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink to="/student/courses" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
            <BiBookAlt className="linkIcon" /> {!isCollapsed && <span>Courses</span>}
          </NavLink>

          {/* Add calendar feature */}

      </nav>

      <div className="botBtns">
        <div className='collapseBtnArea'>
        <button className="collapseBtn" onClick={toggleCollapse}>
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
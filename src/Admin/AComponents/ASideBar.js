import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './ASideBar.css';
import cptLogo from '../../assets/cpt-logo.png';
import { BiGridAlt, BiUser, BiBookAlt, BiGroup, BiBriefcase, BiCheckShield, BiFile, BiBell, BiHistory, BiSun, BiMoon, BiChevronLeft, BiChevronRight } from 'react-icons/bi';

function ASideBar() {
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
            <BiBookAlt className="linkIcon" /> {!isCollapsed && <span>Academics & Grades</span>}
          </NavLink>
          
          {/*}
          <NavLink to="/ojt-clinical" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
            <BiBriefcase className="linkIcon" /> {!isCollapsed && <span>OJT & Clinical</span>}
          </NavLink>
          */}

          <NavLink to="/admin/documents/student-form" className={() => `navLink ${location.pathname.includes('/admin/documents') ? 'activeLink' : ''}`}>
            <BiFile className="linkIcon" /> {!isCollapsed && <span>Documents</span>}
          </NavLink>
          
          <NavLink to="/admin/access-control/manage-people" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
            <BiBell className="linkIcon" /> {!isCollapsed && <span>Access Control</span>}
          </NavLink>
          
          <NavLink to="/admin/history" className={({ isActive }) => `navLink ${isActive ? 'activeLink' : ''}`}>
            <BiHistory className="linkIcon" /> {!isCollapsed && <span>History</span>}
          </NavLink>
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

export default ASideBar;
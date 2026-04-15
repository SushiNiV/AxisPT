import React from 'react';
import { useLocation } from 'react-router-dom';
import './AHeader.css';
import { BiPowerOff, BiBell, BiUserCircle } from 'react-icons/bi';

function AHeader({ user }) {
  const profilePic = user?.profileUrl;
  const location = useLocation();
  const getHeaderTitle = () => {
    const path = location.pathname;
    
    if (path.startsWith('/admin/dashboard')) return 'Dashboard';
    if (path.startsWith('/admin/student-management')) return 'Student Management';
    if (path.startsWith('/academics')) return 'Academics & Grades';
    if (path.startsWith('/settings')) return 'Settings';
    
    return 'Administrator';
  };
    const currentTitle = getHeaderTitle();

  return (
    <div className="aheaderContainer">
      <span className="headerTitle">{currentTitle}</span>
      <div className="headerRight">
        <div className="notificationBtn">
          <BiBell className="headerIcon" />
          <span className=" notificationBadge"></span>
        </div>
        <div className="profileBtn">
          {user && profilePic ? (
            <img 
              src={profilePic} 
              alt="Profile" 
              className="profilePic" 
            />
          ) : (
            <BiUserCircle className="headerIcon profileIconPlaceholder" />
          )}
        </div>
        <div className= "logoutBtn">
          <BiPowerOff className="linkIcon logoutIconMar" /> Log out
        </div>
      </div>
      <div className="subheaderContainer">
          
      </div>
    </div>
  );
}

export default AHeader;
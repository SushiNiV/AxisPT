import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BiPowerOff, BiBell, BiUserCircle, BiMenu, BiInfoCircle } from 'react-icons/bi';
import PopupOverlay from '../../Components/PopupOverlay';

import '../../GlobalStyle/Global.css';
import '../../GlobalStyle/GlobalHeader.css'

function AHeader({ user, onMenuClick }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const profilePic = user?.profileUrl;
  const location = useLocation();
  const navigate = useNavigate();

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/dashboard')) return 'Dashboard';
    if (path.startsWith('/admin/student-management')) return 'Student Management';
    if (path.startsWith('/admin/academics')) return 'Program Management';
    if (path.startsWith('/admin/documents')) return 'Documents';
    if (path.startsWith('/admin/access-control')) return 'Access Control';
    if (path.startsWith('/admin/history')) return 'History';
    if (path.startsWith('/admin/archive')) return 'Archive';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Administrator';
  };

  const handleLogoutAction = () => {
    sessionStorage.clear();
localStorage.clear();
    navigate('/admin/signin');
  };

  return (
    <div className="HeaderContainer">
      <button className="MobileMenuBtn" aria-label="Open menu" onClick={onMenuClick}>
        <BiMenu />
      </button>
      <div className="HeaderLeft">
        <span className="HeaderTitle">{getHeaderTitle()}</span>
        <p className="SubHeaderTitle">
          Our Lady of Fatima University &middot; College of Physical Therapy
        </p>
      </div>
      
      <div className="HeaderRight">
        <div className="notificationBtn">
          <BiBell className="HeaderIcon" />
        </div>
        
        <div className="profileBtn">
          {user && profilePic ? (
            <img src={profilePic} alt="Profile" className="profilePic" />
          ) : (
            <BiUserCircle className="HeaderIcon profileIconPlaceholder" />
          )}
        </div>

        <div className="logoutBtn" role="button" aria-label="Log out" onClick={() => setIsLogoutModalOpen(true)}>
          <BiPowerOff className="linkIcon logoutIconMar" />
          <span className="logoutText">Log out</span>
        </div>
      </div>

      <PopupOverlay 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        icon={<BiInfoCircle />}
      >
        <div>
          <p>Are you sure you want to log out of the system?<br></br>Any unsaved changes may be lost.</p>
          <div className="overlayActionButtons">
            <button 
              className="confirmBtn" 
              onClick={handleLogoutAction}
            >
              Log out
            </button>
          </div>
        </div>
      </PopupOverlay>

    </div>
  );
}

export default AHeader;
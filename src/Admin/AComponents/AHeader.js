import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BiPowerOff, BiBell, BiUserCircle, BiInfoCircle } from 'react-icons/bi';
import PopupOverlay from '../../Components/PopupOverlay';

import '../../Global.css'
import '../../GlobalHeader.css'

function AHeader({ user }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const profilePic = user?.profileUrl;
  const location = useLocation();
  const navigate = useNavigate();

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/dashboard')) return 'Dashboard';
    if (path.startsWith('/admin/student-management')) return 'Student Management';
    if (path.startsWith('/admin/academics')) return 'Academics & Grades';
    if (path.startsWith('/admin/documents')) return 'Documents';
    if (path.startsWith('/admin/access-control')) return 'Access Control';
    if (path.startsWith('/admin/history')) return 'History';
    
    if (path.startsWith('/settings')) return 'Settings';
    return 'Administrator';
  };

  const handleLogoutAction = () => {
    sessionStorage.clear();
    navigate('/admin/signin');
  };

  return (
    <div className="HeaderContainer">
      <span className="HeaderTitle">{getHeaderTitle()}</span>
      
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

        <div className="logoutBtn" onClick={() => setIsLogoutModalOpen(true)}>
          <BiPowerOff className="linkIcon logoutIconMar" /> Log out
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
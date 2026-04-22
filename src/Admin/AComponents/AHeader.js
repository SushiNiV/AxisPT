import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AHeader.css';
import { BiPowerOff, BiBell, BiUserCircle, BiLogOutCircle } from 'react-icons/bi';
import PopupOverlay from '../../Components/PopupOverlay';

function AHeader({ user }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const profilePic = user?.profileUrl;
  const location = useLocation();
  const navigate = useNavigate();

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/dashboard')) return 'Dashboard';
    if (path.startsWith('/admin/student-management')) return 'Student Management';
    if (path.startsWith('/academics')) return 'Academics & Grades';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Administrator';
  };

  const handleLogoutAction = () => {
    sessionStorage.clear();
    navigate('/admin-signin');
  };

  return (
    <div className="aheaderContainer">
      <span className="headerTitle">{getHeaderTitle()}</span>
      
      <div className="headerRight">
        <div className="notificationBtn">
          <BiBell className="headerIcon" />
          <span className="notificationBadge"></span>
        </div>
        
        <div className="profileBtn">
          {user && profilePic ? (
            <img src={profilePic} alt="Profile" className="profilePic" />
          ) : (
            <BiUserCircle className="headerIcon profileIconPlaceholder" />
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
        icon={<BiLogOutCircle size={50} color="#dc3545" />}
      >
        <div className="logoutModalContent">
          <p>Are you sure you want to log out of the system? Any unsaved changes may be lost.</p>
          <div className="overlayActionButtons">
            <button 
              className="cancelBtn" 
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </button>
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
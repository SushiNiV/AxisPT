import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BiBell, BiUserCircle, BiMenu } from 'react-icons/bi';
import ProfileDrawer from './ProfileDrawer'; 
import '../../GlobalStyle/Global.css';
import '../../GlobalStyle/GlobalHeader.css';

function AHeader({ user, onMenuClick }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const profilePic = user?.profileUrl;
  const location = useLocation();

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

  // This function is passed to ProfileDrawer and runs the real API call
  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Throwing inside this function makes the ProfileDrawer
      // automatically show the red error message in its form
      throw new Error(data.message || 'Failed to change password.');
    }

    return data;
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
        
        <button
          type="button"
          className="profileBtn"
          onClick={() => setIsProfileOpen(true)}
          aria-label="Open profile"
        >
          {user && profilePic ? (
            <img src={profilePic} alt="Profile" className="profilePic" />
          ) : (
            <BiUserCircle className="HeaderIcon profileIconPlaceholder" />
          )}
        </button>
      </div>

      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
}

export default AHeader;
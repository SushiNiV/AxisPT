import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BiPowerOff, BiBell, BiUserCircle, BiInfoCircle } from 'react-icons/bi';
import PopupOverlay from '../../Components/PopupOverlay';
import {
  AheaderContainer,
  HeaderTitle,
  HeaderRight,
  NotificationBtn,
  ProfileBtn,
  LogoutBtn,
  LogoutIconMar,
  ProfilePic,
  LogoutModalContent,
  OverlayActionButtons,
  ConfirmBtn
} from './AHeader.styles';

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
    navigate('/admin-signin');
  };

  return (
    <AheaderContainer>
      <HeaderTitle>{getHeaderTitle()}</HeaderTitle>
      
      <HeaderRight>
        <NotificationBtn>
          <BiBell style={{ fontSize: '20px', color: '#3d1616' }} />
          <span className="notificationBadge"></span>
        </NotificationBtn>
        
        <ProfileBtn>
          {user && profilePic ? (
            <ProfilePic src={profilePic} alt="Profile" />
          ) : (
            <BiUserCircle style={{ fontSize: '20px', color: '#3d1616' }} />
          )}
        </ProfileBtn>

        <LogoutBtn onClick={() => setIsLogoutModalOpen(true)}>
          <LogoutIconMar>
            <BiPowerOff style={{ fontSize: '20px' }} />
          </LogoutIconMar>
          Log out
        </LogoutBtn>
      </HeaderRight>

      <PopupOverlay 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        icon={<BiInfoCircle />}
      >
        <LogoutModalContent>
          <p>Are you sure you want to log out of the system?<br />Any unsaved changes may be lost.</p>
          <OverlayActionButtons>
            <ConfirmBtn onClick={handleLogoutAction}>
              Log out
            </ConfirmBtn>
          </OverlayActionButtons>
        </LogoutModalContent>
      </PopupOverlay>
    </AheaderContainer>
  );
}

export default AHeader;
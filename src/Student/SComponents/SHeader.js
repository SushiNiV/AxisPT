import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BiBell, BiUserCircle, BiMenu } from 'react-icons/bi';
import ProfileDrawer from '../../Components/ProfileDrawer'; // Adjust path if necessary
import '../../GlobalStyle/Global.css';
import '../../GlobalStyle/GlobalHeader.css';
import '../../Components/useMediaQuery'

function SHeader({ onMenuClick }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch basic student info for the profile drawer
  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) return;

    fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUser({
            firstName: d.data.first_name,
            lastName: d.data.last_name,
            email: d.data.school_email || d.data.personal_email,
            role: 'Student',
            studentNumber: d.data.student_number
          });
        }
      })
      .catch((err) => console.error('Error fetching header data:', err));
  }, []);

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/student/dashboard')) return 'Dashboard';
    if (path.startsWith('/student/grades')) return 'My Grades';
    if (path.startsWith('/student/subjects')) return 'Current Subjects';
    if (path.startsWith('/student/profile')) return 'My Profile';
    return 'Student Portal';
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    // Note: Ensure this endpoint exists in your backend
    const response = await fetch(`${process.env.REACT_APP_API_URL}/student/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to change password.');
    }

    return data;
  };

  return (
    <div className="HeaderContainer">
      {/* Hamburger Menu Button for Mobile */}
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
          <BiUserCircle className="HeaderIcon profileIconPlaceholder" />
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

export default SHeader;
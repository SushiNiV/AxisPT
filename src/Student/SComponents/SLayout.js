import React, { useEffect, useState } from 'react';
import { BiGridAlt, BiBookAlt, BiUser } from 'react-icons/bi';
import AppShell from '../../Components/shell/AppShell';
import AssistantWidget from '../../Admin/AComponents/Assistant/AssistantWidget';
import cptLogo from '../../assets/cpt-logo.png';

const NAV = [
  { to: '/student/dashboard', label: 'Dashboard', icon: BiGridAlt },
  { to: '/student/academics', label: 'Academics', title: 'My Academics', icon: BiBookAlt },
  { to: '/student/profile', label: 'My Profile', icon: BiUser },
];

const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

function useStudentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
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
            studentNumber: d.data.student_number,
          });
        }
      })
      .catch((err) => console.error('Error fetching header data:', err));
  }, []);

  return user;
}

async function changePassword({ currentPassword, newPassword }) {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/student/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Failed to change password.');
  return data;
}

function SLayout() {
  const user = useStudentUser();

  return (
    <AppShell
      nav={NAV}
      portalRole="Student"
      product="Axis CPT Portal"
      logo={cptLogo}
      subtitle="Our Lady of Fatima University · College of Physical Therapy"
      user={user}
      logoutTo="/signin"
      assistant={<AssistantWidget />}
      onChangePassword={changePassword}
    />
  );
}

export default SLayout;
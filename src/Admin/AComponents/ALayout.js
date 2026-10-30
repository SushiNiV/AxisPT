import React from 'react';
import { BiGridAlt, BiUser, BiBookAlt, BiFile, BiBell, BiHistory, BiArchive } from 'react-icons/bi';
import AppShell from '../../Components/shell/AppShell';
import AssistantWidget from './Assistant/AssistantWidget';
import cptLogo from '../../assets/cpt-logo.png';

const stored = (key) => sessionStorage.getItem(key) || localStorage.getItem(key);

// `match` keeps a section highlighted for every nested route under it.
const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: BiGridAlt },
  { to: '/admin/student-management/masterlist', match: '/admin/student-management', label: 'Student Management', icon: BiUser },
  { to: '/admin/academics/programs&sections', match: '/admin/academics', label: 'Program Management', icon: BiBookAlt },
  { to: '/admin/documents/student-form', match: '/admin/documents', label: 'Documents', icon: BiFile },
  { to: '/admin/access-control', label: 'Access Control', icon: BiBell, adminOnly: true },
  { to: '/admin/history', label: 'History', icon: BiHistory, adminOnly: true },
  { to: '/admin/archive', label: 'Archive', icon: BiArchive },
];

const EXTRA_TITLES = [{ match: '/settings', title: 'Settings' }];

function ALayout() {
  const role = stored('role') || 'admin';
  const isAdmin = role === 'admin' || role === 'superadmin';

  const user = {
    name: stored('username') || 'Administrator',
    email: stored('email') || '—',
    role,
    profileUrl: stored('profileUrl') || null,
  };

  return (
    <AppShell
      nav={NAV.filter((item) => !item.adminOnly || isAdmin)}
      extraTitles={EXTRA_TITLES}
      portalRole="Administrator"
      product="Axis CPT Portal"
      logo={cptLogo}
      subtitle="Our Lady of Fatima University · College of Physical Therapy"
      user={user}
      logoutTo="/admin/signin"
      assistant={<AssistantWidget />}
    />
  );
}

export default ALayout;
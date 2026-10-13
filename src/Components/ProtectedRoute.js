import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/admin/signin" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Wrong portal — bounce to their correct home
    const home = role === 'student' ? '/student/dashboard' : '/admin/dashboard';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Route gate.
 *
 * Props:
 *   allowedRoles        — array of role strings ('admin', 'faculty', 'student').
 *                         Empty/missing = any authenticated user.
 *   allowedDesignations — array of designation strings ('Faculty', 'Dean', ...).
 *                         Optional. When provided, the user must match at
 *                         least one; combined with allowedRoles via OR.
 *
 * Reads from sessionStorage first, then localStorage. The sign-in pages
 * write to whichever storage the user chose via "Remember Me".
 */
const ProtectedRoute = ({ allowedRoles = [], allowedDesignations = [] }) => {
  const token =
    sessionStorage.getItem('token') || localStorage.getItem('token');
  const role =
    sessionStorage.getItem('role') || localStorage.getItem('role');
  const designation =
    sessionStorage.getItem('designation') || localStorage.getItem('designation');

  // 1. Not logged in at all
  if (!token) {
    return <Navigate to="/admin/signin" replace />;
  }

  // 2. No restrictions — any authenticated user passes
  const noRoleGate = allowedRoles.length === 0;
  const noDesignationGate = allowedDesignations.length === 0;
  if (noRoleGate && noDesignationGate) {
    return <Outlet />;
  }

  // 3. Role check (OR across role/designation gates if both are provided)
  const rolePass = !noRoleGate && allowedRoles.includes(role);
  const designationPass =
    !noDesignationGate && allowedDesignations.includes(designation);

  if (!rolePass && !designationPass) {
    // Wrong portal — bounce to their correct home
    const home = role === 'student' ? '/student/dashboard' : '/admin/dashboard';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
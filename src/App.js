import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './utils/api';
import SessionExpired from './Components/SessionExpire';

import ASignIn from './Admin/ASignIn';
import AChangePass from './Admin/AChangePass';

import ADashboard from './Admin/APages/Dashboard/ADashboard';

import AStudentManage from './Admin/APages/StudentManagement/AStudentManage';
import Masterlist from './Admin/APages/StudentManagement/Masterlist';
import Archive from './Admin/APages/Archived/AArchive';

import AAcademics from './Admin/APages/ProgramManagement/AGrades';
import AProgSec from './Admin/APages/ProgramManagement/AProgSec';
import ACourses from './Admin/APages/ProgramManagement/ACourses';

import ADocuments from './Admin/APages/Documents/ADocuments';
import DocumentsStudentForm from './Admin/APages/Documents/DocumentsStudentForm';
import DocumentsTermGrade from './Admin/APages/Documents/DocumentsTermGrade';
import DocumentsCourseOutline from './Admin/APages/Documents/DocumentsCourseOutline';

import AAccessCtrl from './Admin/APages/AccessControl/AAccessCtrl';
import Manage from './Admin/APages/AccessControl/Manage';
import AcadYear from './Admin/APages/AccessControl/AcadYear';
import Curricula from './Admin/APages/AccessControl/Curricula';

import AHistory from './Admin/APages/AHistory';

import AArchive from './Admin/APages/Archived/AArchive';
import ArchivedStudents from './Admin/APages/Archived/ArchivedStudents';
import ArchivedPrograms from './Admin/APages/Archived/ArchivedPrograms';
import ArchivedSections from './Admin/APages/Archived/ArchivedSections';
import ArchivedUsers from './Admin/APages/Archived/ArchivedUsers';


import ProtectedRoute from './Components/ProtectedRoute';
import ALayout from './Admin/AComponents/ALayout';

import SSignIn from './Student/SignIn';

import AssistantWidget from './Admin/AComponents/Assistant/AssistantWidget';

const ADMIN_AND_FACULTY = ['admin', 'faculty'];
const ADMIN_ONLY = ['admin'];

// --- Auth-aware helper for public routes ---

function PublicOnlyRoute({ children }) {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return <Navigate to={token ? '/admin/dashboard' : '/admin/signin'} replace />;
}

function AppContent() {
  const navigate = useNavigate();
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  const logoutHandler = () => {
    sessionStorage.clear();
    localStorage.clear();
    setShowSessionExpired(false);
    navigate('/admin/signin');
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      setShowSessionExpired(true);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  return (
    <>
      {showSessionExpired && (
        <SessionExpired onConfirm={logoutHandler} />
      )}
      <Routes>
        {/* Root: token-aware redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* ADMIN SIGN-IN: if already logged in, bounce to dashboard */}
        <Route
          path="/admin/signin"
          element={
            <PublicOnlyRoute>
              <ASignIn />
            </PublicOnlyRoute>
          }
        />

        {/* Authenticated area — any role with a valid token */}
        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<AChangePass />} />

          {/* Admin + faculty shell */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_AND_FACULTY} />}>
            <Route element={<ALayout />}>

              {/* Dashboard — both roles */}
              <Route path="/admin/dashboard" element={<ADashboard />} />

              {/* Student Management — both roles */}
              <Route
                path="/admin/student-management"
                element={<ProtectedRoute allowedRoles={ADMIN_AND_FACULTY} />}
              >
                <Route element={<AStudentManage />}>
                  <Route index element={<Navigate to="masterlist" replace />} />
                  <Route path="masterlist" element={<Masterlist />} />
                  <Route path="archive" element={<Archive />} />
                </Route>
              </Route>

              {/* Academics — both roles (faculty is view-only, enforced in-page) */}
              <Route
                path="/admin/academics"
                element={<ProtectedRoute allowedRoles={ADMIN_AND_FACULTY} />}
              >
                <Route element={<AAcademics />}>
                  <Route index element={<Navigate to="programs&sections" replace />} />
                  <Route path="programs&sections" element={<AProgSec />} />
                  <Route path="courses" element={<ACourses />} />
                </Route>
              </Route>

              {/* Documents — both roles */}
              <Route
                path="/admin/documents"
                element={<ProtectedRoute allowedRoles={ADMIN_AND_FACULTY} />}
              >
                <Route element={<ADocuments />}>
                  <Route path="student-form" element={<DocumentsStudentForm />} />
                  <Route path="term-grade" element={<DocumentsTermGrade />} />
                  <Route path="course-curriculum" element={<DocumentsCourseOutline />} />
                </Route>
              </Route>

              {/* Access Control — admin only */}
              <Route
                path="/admin/access-control"
                element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}
              >
                <Route element={<AAccessCtrl />}>
                  <Route index element={<Navigate to="manage-people" replace />} />
                  <Route path="manage-people" element={<Manage />} />
                  <Route path="academic-year" element={<AcadYear />} />
                  <Route path="curricula" element={<Curricula />} />
                </Route>
              </Route>

              {/* History — admin only */}
              <Route
                path="/admin/history"
                element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}
              >
                <Route index element={<AHistory />} />
              </Route>

              <Route
                path="/admin/archive"
                element={<ProtectedRoute allowedRoles={ADMIN_AND_FACULTY} />}
              >
                <Route element={<AArchive />}>
                  <Route index element={<Navigate to="students" replace />} />
                  
                  <Route path="students" element={<ArchivedStudents />} />
                  <Route path="programs" element={<ArchivedPrograms />} />
                  <Route path="sections" element={<ArchivedSections />} />
                  <Route path="users" element={<ArchivedUsers />} />
                </Route>
              </Route>

            </Route>
          </Route>
        </Route>

        {/* STUDENT */}
        <Route path="/student/signin" element={<SSignIn />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
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

import ProtectedRoute from './Components/ProtectedRoute';
import ALayout from './Admin/AComponents/ALayout';

import SSignIn from './Student/SignIn';

// --- Auth-aware helper for public routes ---

// If a token exists -> send to dashboard. Otherwise, render children (the sign-in page).
function PublicOnlyRoute({ children }) {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

// Root path: decide where to send the user based on token presence.
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

        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<AChangePass />} />
          <Route element={<ALayout />}>
            <Route path="/admin/dashboard" element={<ADashboard />} />

            <Route path="/admin/student-management" element={<AStudentManage />}>
              <Route index element={<Navigate to="masterlist" replace />} />
              <Route path="masterlist" element={<Masterlist />} />
              <Route path="archive" element={<Archive />} />
            </Route>

            <Route path="/admin/academics" element={<AAcademics />}>
              <Route index element={<Navigate to="programs&sections" replace />} />
              <Route path="programs&sections" element={<AProgSec />} />
              <Route path="courses" element={<ACourses />} />
            </Route>

            <Route path="/admin/documents" element={<ADocuments />}>
              <Route path="student-form" element={<DocumentsStudentForm />} />
              <Route path="term-grade" element={<DocumentsTermGrade />} />
              <Route path="course-curriculum" element={<DocumentsCourseOutline />} />
            </Route>

            <Route path="/admin/access-control" element={<AAccessCtrl />}>
              <Route index element={<Navigate to="manage-people" replace />} />
              <Route path="manage-people" element={<Manage />} />
              <Route path="academic-year" element={<AcadYear />} />
              <Route path="curricula" element={<Curricula />} />
            </Route>

            <Route path="/admin/history" element={<AHistory />} />

            <Route path="/admin/archive" element={<AArchive />}>
              <Route index element={<Navigate to="students" replace />} />
              <Route path="students" element={<ArchivedStudents />} />
              <Route path="programs" element={<ArchivedPrograms />} />
              <Route path="sections" element={<ArchivedSections />} />
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
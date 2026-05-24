import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SessionExpired from './Components/SessionExpire';

import ASignIn from './Admin/ASignIn';
import AChangePass from './Admin/AChangePass';
import ADashboard from './Admin/ADashboard';

import AStudentManage from './Admin/AStudentManage';

import AAcademics from './Admin/AGrades';
import AProgSec from './Admin/APages/AProgSec';
import Course from './Admin/APages/ACourses';

import AAccessCtrl from './Admin/AAccessCtrl';
import Manage from './Admin/APages/Manage';
import AcadYear from './Admin/APages/AcadYear';
import Curricula from './Admin/APages/Curricula';

import AHistory from './Admin/AHistory';

import ProtectedRoute from './Components/ProtectedRoute';
import ALayout from './Admin/AComponents/ALayout';

import SSignIn from './Student/SignIn';
import ACourses from './Admin/APages/ACourses';

function AppContent() {
  const navigate = useNavigate();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  let logoutTimer = null;

  const logoutHandler = () => {
    sessionStorage.clear();
    setShowSessionExpired(false);
    navigate('/admin/signin');
  };

  const checkTokenExpiration = () => {
    const token = sessionStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      if (currentTime >= expTime) {
        setShowSessionExpired(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  };

  const resetTimer = () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }
    
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expTime - currentTime;
        
        if (timeUntilExpiry <= 0) {
          setShowSessionExpired(true);
        } else {
          logoutTimer = setTimeout(() => {
            setShowSessionExpired(true);
          }, timeUntilExpiry);
        }
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }
  };

  useEffect(() => {
    resetTimer();
    
    const events = ['click', 'keypress', 'mousemove', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 60000);
    
    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      clearInterval(interval);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

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
        <Route path="/" element={<Navigate to="/admin/signin" />} />

        {/* ADMIN */}
        <Route path="/admin/signin" element={<ASignIn />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<AChangePass />} />
          <Route element={<ALayout />}>
            <Route path="/admin/dashboard" element={<ADashboard />} />

            <Route path="/admin/student-management" element={<AStudentManage />}>
              <Route index element={<Navigate to="" replace />} />
            </Route>
            <Route path="/admin/academics" element={<AAcademics />}>
              <Route index element={<Navigate to="programs&sections" replace />} />
              <Route path="programs&sections" element={<AProgSec />} />
              <Route path="courses" element={<ACourses />} />
            </Route>

            <Route path="/admin/access-control" element={<AAccessCtrl />}>
              <Route index element={<Navigate to="manage-people" replace />} />
              <Route path="manage-people" element={<Manage />} />
              <Route path="academic-year" element={<AcadYear />} />
              <Route path="curricula" element={<Curricula />} />
            </Route>
            <Route path="/admin/history" element={<AHistory />} />
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
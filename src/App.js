import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ASignIn from './Admin/ASignIn';
import AChangePass from './Admin/AChangePass';
import ADashboard from './Admin/ADashboard';

import AHistory from './Admin/AHistory';

import ProtectedRoute from './Components/ProtectedRoute';
import ALayout from './Admin/AComponents/ALayout';

import SSignIn from './Student/SignIn';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/signin" />} />

        {/* ADMIN */}
        <Route path="/admin/signin" element={<ASignIn />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<AChangePass />} />
          <Route element={<ALayout />}>
            <Route path="/admin/dashboard" element={<ADashboard />} />

            <Route path="/admin/history" element={<AHistory />} />
          </Route>
          
        </Route>   

         {/* STUDENT */}
        <Route path="/student/signin" element={<SSignIn />} />
 
      </Routes>
    </Router>
  );
}

export default App;
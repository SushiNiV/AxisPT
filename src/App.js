import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ASignIn from './Admin/ASignIn';
import AChangePass from './Admin/AChangePass';
import ADashboard from './Admin/ADashboard';

import AStudentManage from './Admin/AStudentManage';

import AAcademics from './Admin/AGrades';
import AProgSec from './Admin/APages/AProgSec';

import AAccessCtrl from './Admin/AAccessCtrl';
import AcadYear from './Admin/APages/AcadYear';
import Curricula from './Admin/APages/Curricula';

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

            <Route path="/admin/student-management" element={<AStudentManage />} >
              <Route index element={<Navigate to="" replace />} />
            </Route>
            <Route path="/admin/academics" element={<AAcademics />} >
                <Route index element={<Navigate to="programs&sections" replace />} />
                <Route path="programs&sections" element={<AProgSec />} />
              </Route>

            <Route path="/admin/access-control" element={<AAccessCtrl />} >
              <Route index element={<Navigate to="" replace />} />
              <Route path="academic-year" element={<AcadYear />} />
              <Route path="curricula" element={<Curricula />} />
            </Route>
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
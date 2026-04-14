import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './Main/Home';

import SignIn from './Student/SignIn';
import Enrollment from './Main/Enrollment';

import ASignIn from './Admin/ASignIn';
import ADashboard from './Admin/ADashboard';
import AStudentManage from './Admin/AStudentManage';

import ChangePass from './Admin/AChangePass';

import ProtectedRoute from './Components/ProtectedRoute';
import ALayout from './Admin/AComponents/ALayout';
import SLayout from './Student/SComponents/SLayout';

import StudentForm from './Components/StudentForm'
import TermGrade from './Components/TermGrade';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/student-form" element={<StudentForm />} />
        <Route path="/term-grade" element={<TermGrade />} />

        {/* ADMIN */}
        <Route path="/admin-signin" element={<ASignIn />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ALayout />}>
            <Route path="/admin/dashboard" element={<ADashboard />} />
            <Route path="/admin/student-management" element={<AStudentManage />} />
          </Route>
          <Route path="/change-password" element={<ChangePass />} />
        </Route>   

        {/* STUDENT */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/enrollment-form" element={<Enrollment />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<SLayout />}>

          </Route>
        </Route> 
 
      </Routes>
    </Router>
  );
}

export default App;
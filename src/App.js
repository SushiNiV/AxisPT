import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './Main/Home';

import SignIn from './Student/SignIn';
import Enrollment from './Main/Enrollment';

import ASignIn from './Admin/ASignIn';
import ADashboard from './Admin/ADashboard';
import AChangePass from './Admin/AChangePass';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />

        <Route path="/signin" element={<SignIn />} />
        
        <Route path="/enrollment-form" element={<Enrollment />} />

        <Route path="/admin-signin" element={<ASignIn />} />
        <Route path="/admin-dashboard" element={<ADashboard />} />
        <Route path="/admin-change-password" element={<AChangePass />} />
      </Routes>
    </Router>
  );
}

export default App;
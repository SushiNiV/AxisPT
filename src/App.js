import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './Main/Home';

import SignUp from './Student/SignUp';
import Enrollment from './Main/Enrollment';

import ASignIn from './Admin/ASignIn';
import ADashboard from './Admin/ADashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />

        <Route path="/signup" element={<SignUp />} />
        
        <Route path="/enrollment-form" element={<Enrollment />} />

        <Route path="/admin-signin" element={<ASignIn />} />
        <Route path="/admin-dashboard" element={<ADashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ASignIn from './Admin/ASignIn';
import AChangePass from './Admin/AChangePass';
import ProtectedRoute from './Components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/signin" />} />

        {/* ADMIN */}
        <Route path="/admin/signin" element={<ASignIn />} />

        <Route element={<ProtectedRoute />}>

          <Route path="/change-password" element={<AChangePass />} />
        </Route>   
 
      </Routes>
    </Router>
  );
}

export default App;
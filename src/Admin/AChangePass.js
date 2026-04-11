import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AChangePass.css';
import cptLogo from '../assets/cpt-logo.png'; 

function AChangePass() {
  const navigate = useNavigate();
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please log in.");
      navigate('/admin-signin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
      
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
      
    if (formData.newPassword.length < 8) {
      alert("New password must be at least 8 characters long.");
      return;
    }
      
    if (formData.newPassword === formData.currentPassword) {
      alert("The new password cannot be the same as your current password.");
      return;
    }

    const token = sessionStorage.getItem('token');
    const employeeID = sessionStorage.getItem('employeeID'); // Make sure you save this during login!

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeID: employeeID,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Password changed successfully!");
        sessionStorage.clear();
        navigate('/admin-signin');
      } else {
        alert(data.message || "Failed to change password.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Server connection failed.");
    }
  };

  return (
    <div className='AchangepassContainer'>
      <div className='AchangepasstopBar'>
        <div className='logoArea'>
          <img src={cptLogo} alt='CPT Logo' className='mainLogo'/>
          <p className='mainTitle'>Axis CPT</p>
        </div>
        <button className='returnBT' onClick={() => navigate('/dashboard')}>
          <span className="material-icons">arrow_back</span>
        </button>
      </div>

      <form className='AchangepassCard' onSubmit={handlePasswordChange}>
        <p className='AchangepassTitle'>Change Password</p>

        <div className="input-group">
          <label>Current Password <span style={{color: 'red'}}>*</span></label>
          <div className="password-wrapper">
            <input 
              type={showCurrent ? "text" : "password"} 
              name="currentPassword"
              placeholder="Current Password" 
              className='AchangepassInput'
              value={formData.currentPassword}
              onChange={handleChange}
              required 
            />
            <span className="material-icons eye-icon" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? 'visibility' : 'visibility_off'}
            </span>
          </div>
        </div>

        <div className="input-group">
          <label>New Password <span style={{color: 'red'}}>*</span></label>
          <div className="password-wrapper">
            <input 
              type={showNew ? "text" : "password"} 
              name="newPassword"
              placeholder="New Password" 
              className='AchangepassInput'
              value={formData.newPassword}
              onChange={handleChange}
              required 
              minLength="8" 
            />
            <span className="material-icons eye-icon" onClick={() => setShowNew(!showNew)}>
              {showNew ? 'visibility' : 'visibility_off'}
            </span>
          </div>
        </div>

        <div className="input-group">
          <label>Confirm New Password <span style={{color: 'red'}}>*</span></label>
          <div className="password-wrapper">
            <input 
              type={showConfirm ? "text" : "password"} 
              name="confirmPassword"
              placeholder="Confirm New Password" 
              className='AchangepassInput'
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
            <span className="material-icons eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? 'visibility' : 'visibility_off'}
            </span>
          </div>
        </div>

        <button type='submit' className='AchangepassBT'>
          Change Password
        </button>
      </form>

      <div className="bottomBar">
          <p className="bottomText">© Copyright 2026. Our Lady of Fatima University - College of Physical Therapy. All Rights reserved. | Powered by VGR </p>
      </div>
    </div>
  );
}

export default AChangePass;
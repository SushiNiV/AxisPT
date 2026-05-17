import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AChangePass.css';
import PopupOverlay from '../Components/PopupOverlay';
import cptLogo from '../assets/cpt-logo.png'; 

function AChangePass() {
  const navigate = useNavigate();
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [popupStatus, setPopupStatus] = useState(null); 
  const [errorMessage, setErrorMessage] = useState('');
  
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
      setErrorMessage("New passwords do not match!");
      setPopupStatus('error');
      return;
    }
      
    if (formData.newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      setPopupStatus('error');
      return;
    }

    const token = sessionStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPopupStatus('success');
      } else {
        setErrorMessage(data.message || "Failed to change password.");
        setPopupStatus('error');
      }
    } catch (err) {
      console.error("Error:", err);
      setErrorMessage("Server connection failed.");
      setPopupStatus('error');
    }
  };

  const handleFinalizeSuccess = () => {
    sessionStorage.clear();
    setPopupStatus(null);
    navigate('/admin-signin');
  };

  return (
    <div className='AchangepassContainer'>
      <div className='AchangepasstopBar'>
        <div className='logoArea'>
          <img src={cptLogo} alt='CPT Logo' className='mainLogo'/>
          <p className='mainTitle'>Axis CPT</p>
        </div>
        <button className='returnBT' onClick={() => navigate('/admin/dashboard')}>
          <span className="material-icons">arrow_back</span>
        </button>
      </div>

      <form className='AchangepassCard' onSubmit={handlePasswordChange}>
        <p className='AchangepassTitle'>Change Password</p>

        <div className="cpinput-group">
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

        <div className="cpinput-group">
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

        <div className="cpinput-group">
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
          <p className="bottomText">© Copyright 2026. Our Lady of Fatima University - College of Physical Therapy. All Rights reserved. | Powered by VDG </p>
      </div>

      {popupStatus === 'success' && (
        <PopupOverlay 
          isOpen={true} 
          onClose={handleFinalizeSuccess} 
          title="PASSWORD UPDATED"
          icon={
            <span className="material-icons" style={{ color: '#22C55E', fontSize: '50px' }}>
              check_circle
            </span>
          }
        >
          <p>Your password has been changed successfully. You will now be redirected to the sign-in page.</p>
          <button onClick={handleFinalizeSuccess}>
            GOT IT
          </button>
        </PopupOverlay>
      )}

      {popupStatus === 'error' && (
        <PopupOverlay 
          isOpen={true} 
          onClose={() => setPopupStatus(null)} 
          title="PASSWORD UPDATE FAILED"
          icon={
            <span className="material-icons" style={{ color: '#EF4444', fontSize: '50px' }}>
              error
            </span>
          }
        >
          <p>{errorMessage}</p>
          <button 
            style={{ backgroundColor: '#EF4444' }} 
            onClick={() => setPopupStatus(null)}
          >
            TRY AGAIN
          </button>
        </PopupOverlay>
      )}

    </div>
  );
}

export default AChangePass;
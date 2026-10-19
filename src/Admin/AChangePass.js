import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiArrowBack, BiShow, BiHide, BiLockAlt } from 'react-icons/bi';
import ConfirmationModal from './AComponents/ConfirmationModal'; 
import '../GlobalStyle/ChangePass.css';
import cptLogo from '../assets/cpt-logo.png';

function AChangePass() {
  const navigate = useNavigate();
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // State for the ConfirmationModal
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      alert('Session expired. Please log in.');
      navigate('/admin/signin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper to open the modal easily
  const openModal = (title, summary, message, variant, confirmLabel, onConfirm) => {
    setConfirmState({
      isOpen: true,
      title,
      summary,
      message,
      variant,
      confirmLabel,
      cancelLabel: 'CANCEL',
      isAlert: true, // Makes it an alert (single button) rather than a prompt
      onConfirm: () => {
        setConfirmState({ isOpen: false });
        if (onConfirm) onConfirm();
      },
      onCancel: () => setConfirmState({ isOpen: false }),
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 8) {
      openModal(
        'Invalid Password', 
        'Password Too Short', 
        'New password must be at least 8 characters long.', 
        'warning', 
        'OK'
      );
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      openModal(
        'Passwords Do Not Match', 
        'Mismatch Detected', 
        'New passwords do not match! Please re-enter them.', 
        'danger', 
        'RETRY'
      );
      return;
    }

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

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
        openModal(
          'Password Updated', 
          'Success', 
          'Your password has been changed successfully. You will now be redirected to the sign-in page.', 
          'success', 
          'GOT IT',
          () => {
            document.body.classList.remove('dark');
            sessionStorage.clear();
            localStorage.clear();
            navigate('/admin/signin');
          }
        );
      } else {
        openModal(
          'Update Failed', 
          'Action Failed', 
          data.message || "Failed to change password.", 
          'danger', 
          'RETRY'
        );
      }
    } catch (err) {
      console.error("Error:", err);
      openModal(
        'Connection Error', 
        'Server Unreachable', 
        'Server connection failed. Please try again later.', 
        'danger', 
        'OK'
      );
    }
  };

  return (
    <div className="ChangePassContainer">
      <div className="ChangePassTopBar">
        <div className="ChangePassLogoArea">
          <img src={cptLogo} alt='CPT Logo' />
          <p>AXIS CPT</p>
        </div>
        <button className="ChangePassReturnBtn" onClick={() => navigate(-1)}>
          <BiArrowBack /> <span>Back</span>
        </button>
      </div>

      <div className="ChangePassMobileHeader">
        <h2>Set Password</h2>
        <button className="ChangePassMobileBack" onClick={() => navigate(-1)}>
          <BiArrowBack />
        </button>
      </div>

      <form className="ChangePassCard" onSubmit={handlePasswordChange}>
        
        <div className="ChangePassMobileIntro">
          <div className="ChangePassMobileIcon">
            <BiLockAlt />
          </div>
          <h1 className="ChangePassMobileTitle">
            Change Password
          </h1>
        </div>

        <div className="ChangePassDesktopTitles">
          <h1 className="ChangePassTitle">Change Password</h1>
          <p className="ChangePassSubtitle">
            Update the password for your account. Ensure it is at least 8 characters long.
          </p>
        </div>

        <div className="ChangePassInputGroup">
          <label>Current Password <span>*</span></label>
          <div className="ChangePassPasswordWrapper">
            <input 
              type={showCurrent ? "text" : "password"} 
              name="currentPassword"
              placeholder="Enter current password" 
              value={formData.currentPassword}
              onChange={handleChange}
              required 
            />
            <span className="ChangePassEyeIcon" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <BiHide /> : <BiShow />}
            </span>
          </div>
        </div>

        <div className="ChangePassInputGroup">
          <label>New Password <span>*</span></label>
          <div className="ChangePassPasswordWrapper">
            <input 
              type={showNew ? "text" : "password"} 
              name="newPassword"
              placeholder="Min. 8 characters" 
              value={formData.newPassword}
              onChange={handleChange}
              required 
              minLength="8" 
            />
            <span className="ChangePassEyeIcon" onClick={() => setShowNew(!showNew)}>
              {showNew ? <BiHide /> : <BiShow />}
            </span>
          </div>
        </div>

        <div className="ChangePassInputGroup">
          <label>Confirm Password <span>*</span></label>
          <div className="ChangePassPasswordWrapper">
            <input 
              type={showConfirm ? "text" : "password"} 
              name="confirmPassword"
              placeholder="Min. 8 characters" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
            <span className="ChangePassEyeIcon" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <BiHide /> : <BiShow />}
            </span>
          </div>
        </div>

        <button className="ChangePassSubmitBtn" type="submit">
          Confirm
        </button>
      </form>

      <div className="ChangePassBottomBar">
        <p>© Copyright 2026. Our Lady of Fatima University - College of Physical Therapy. All Rights Reserved. | Powered by VDG</p>
      </div>

      {/* GLOBAL CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        summary={confirmState.summary}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </div>
  );
}

export default AChangePass;
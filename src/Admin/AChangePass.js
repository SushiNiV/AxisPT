import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiInfoCircle, BiCheckCircle } from 'react-icons/bi';
import PopupOverlay from '../Components/PopupOverlay';
import cptLogo from '../assets/cpt-logo.png';
import {
  Container,
  TopBar,
  LogoArea,
  MainLogo,
  ReturnButton,
  Card,
  Title,
  InputGroup,
  PasswordWrapper,
  EyeIcon,
  ChangeButton,
  BottomBar,
  BottomText
} from './AChangePass.styles';

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
      navigate('/admin/signin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      setPopupStatus('error');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("New passwords do not match!");
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
    navigate('/admin/signin');
  };

  return (
    <Container>
      <TopBar>
        <LogoArea>
          <MainLogo src={cptLogo} alt='CPT Logo' />
          <p>AXIS CPT</p>
        </LogoArea>
        <ReturnButton onClick={() => navigate('/admin/signin')}>
          <span className="material-icons">arrow_back</span>
        </ReturnButton>
      </TopBar>

      <Card onSubmit={handlePasswordChange}>
        <Title>Change Password</Title>

        <InputGroup>
          <label>Current Password <span style={{color: 'red'}}>*</span></label>
          <PasswordWrapper>
            <input 
              type={showCurrent ? "text" : "password"} 
              name="currentPassword"
              placeholder="Current Password" 
              value={formData.currentPassword}
              onChange={handleChange}
              required 
            />
            <EyeIcon className="material-icons" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? 'visibility' : 'visibility_off'}
            </EyeIcon>
          </PasswordWrapper>
        </InputGroup>

        <InputGroup>
          <label>New Password <span style={{color: 'red'}}>*</span></label>
          <PasswordWrapper>
            <input 
              type={showNew ? "text" : "password"} 
              name="newPassword"
              placeholder="New Password" 
              value={formData.newPassword}
              onChange={handleChange}
              required 
              minLength="8" 
            />
            <EyeIcon className="material-icons" onClick={() => setShowNew(!showNew)}>
              {showNew ? 'visibility' : 'visibility_off'}
            </EyeIcon>
          </PasswordWrapper>
        </InputGroup>

        <InputGroup>
          <label>Confirm New Password <span style={{color: 'red'}}>*</span></label>
          <PasswordWrapper>
            <input 
              type={showConfirm ? "text" : "password"} 
              name="confirmPassword"
              placeholder="Confirm New Password" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
            <EyeIcon className="material-icons" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? 'visibility' : 'visibility_off'}
            </EyeIcon>
          </PasswordWrapper>
        </InputGroup>

        <ChangeButton type='submit'>
          Change Password
        </ChangeButton>
      </Card>

      <BottomBar>
        <BottomText>© Copyright 2026. Our Lady of Fatima University - College of Physical Therapy. All Rights reserved. | Powered by VDG</BottomText>
      </BottomBar>

      {popupStatus === 'success' && (
        <PopupOverlay 
          isOpen={true} 
          onClose={handleFinalizeSuccess} 
          title="PASSWORD UPDATED"
          icon={<BiCheckCircle style={{color: '#3d1616' }} />} 
        >
          <p>Your password has been changed successfully.<br></br>You will now be redirected to the sign-in page.</p>
          <button 
            style={{ backgroundColor: '#3d1616' }} 
            onClick={handleFinalizeSuccess}
          >
            GOT IT
          </button>
        </PopupOverlay>
      )}

      {popupStatus === 'error' && (
        <PopupOverlay 
          isOpen={true} 
          onClose={() => setPopupStatus(null)} 
          title="PASSWORD UPDATE FAILED"
          icon={<BiInfoCircle style={{color: '#3d1616' }} />} 
        >
          <p>{errorMessage}</p>
          <button 
            style={{ backgroundColor: '#3d1616' }} 
            onClick={() => setPopupStatus(null)}
          >
            RETRY
          </button>
        </PopupOverlay>
      )}
    </Container>
  );
}

export default AChangePass;
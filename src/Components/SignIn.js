import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../Admin/AComponents/ConfirmationModal'; 

import '../GlobalStyle/GlobalSignin.css';
import '../GlobalStyle/Global.css';
import '../ResponsiveStyle/ResponsiveSignin.css';

function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
      username: '',  
      password: '',
      rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsErrorModalOpen(false);

    try {
      // Unified login endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Non-JSON response:', response.status);
        setErrorMessage('Server returned an unexpected response. Please contact the administrator.');
        setIsErrorModalOpen(true);
        return;
      }

      const data = await response.json();

      if (data.success) {
        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', data.token);
        storage.setItem('username', data.username);
        storage.setItem('role', (data.role || '').toLowerCase());
        sessionStorage.setItem('email', data.email || '—');
        
        if (data.designation) storage.setItem('designation', data.designation);
        
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          if (payload.id != null) storage.setItem('user_id', String(payload.id));
          if (payload.student_id != null) storage.setItem('student_id', String(payload.student_id));
          if (payload.faculty_id != null) storage.setItem('faculty_id', String(payload.faculty_id));
        } catch (decodeErr) {
          console.warn('Could not decode JWT for IDs:', decodeErr);
        }

        if (data.mustChangePassword === true) {
          navigate('/change-password');
        } else {
          // Route based on role
          if (data.role?.toLowerCase() === 'student') {
            navigate('/student/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        }
        return;
      }

      setErrorMessage(data.message || 'Invalid Username or Password.');
      setIsErrorModalOpen(true);

    } catch (error) {
      console.error('Login Error:', error);
      setErrorMessage('Unable to connect to the server. Please try again later.');
      setIsErrorModalOpen(true);
    }
  };

  return (
    <div className="Container SigninPage">

      <div className="SigninCard">
      </div>

      <div className="SigninFormCard">
        <div className="SigninTopbar Left">
          <p className="SigninText">
            <span>Have Trouble Signing In? </span>
            <b>Contact CPT Administrator.</b>
          </p>
        </div>

        <form className="SigninForm" onSubmit={handleLogin}>
          <p className="SigninTitle">Axis Portal</p>
          <p className="SigninTitle">Sign In</p>
          
          <div className="Signin FormColumn">
            <div className="Signin Column">
              <label>Username <span style={{color: 'red'}}>*</span></label>
              <input 
                type="text" 
                name="username"
                placeholder="Enter username" 
                value={formData.username}
                onChange={handleChange}
                autoComplete='username'
                required
              />
            </div>

            <div className="Signin Column">
              <label>Password <span style={{color: 'red'}}>*</span></label>
              <div className="PasswordWrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="Enter your password" 
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete='current-password'
                  required 
                />
                <span className="Material-Icon Icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </div>
            </div>

            <div className="FormOptions">
              <div className="OptionsContainer">
                <input 
                    type="checkbox" 
                    name="rememberMe" 
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </div>
              <div className="OptionsContainer">
                  <p>Forgot Password?</p>
              </div>
            </div>
                      
            <div className="ButtonContainer">
                <button type="submit" className="Button">
                    Sign In
                </button>
                <div className="PrivacyText small italic">
                    <p>"By logging in, you agree to handle all data in accordance with the Data Privacy Act of 2012 and Privacy Policies."</p>
                </div>
            </div>
          </div>
        </form>
      </div>

      {/* ERROR MODAL */}
      <ConfirmationModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="ACCESS DENIED"
        variant="danger"
        confirmLabel="RETRY"
        isAlert={true} // Hides the cancel button
        onConfirm={() => setIsErrorModalOpen(false)}
      >
        <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '10px' }}>
          {errorMessage}
        </p>
      </ConfirmationModal>

    </div>
  );
}

export default SignIn;
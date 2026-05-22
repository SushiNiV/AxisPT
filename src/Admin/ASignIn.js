import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiInfoCircle } from 'react-icons/bi';
import PopupOverlay from '../Components/PopupOverlay';

import '../SigninGlobal.css';

function ASignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [popupStatus, setPopupStatus] = useState(null);
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

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('username', data.username);
          
        if (data.changedPass === true) {
          navigate('/change-password'); 
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setErrorMessage(data.message || "Invalid Username or Password.");
        setPopupStatus('error');
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage("Unable to connect to the server. Please try again later.");
      setPopupStatus('error');
    }
  };

  return (
    <div className="Container">

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
          <p className="SigninTitle">Administrative</p>
          <p className="SigninTitle">Axis Portal</p>
          
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

      {popupStatus === 'error' && (
        <PopupOverlay 
          isOpen={true} 
          onClose={() => setPopupStatus(null)} 
          title="ACCESS DENIED"
          icon={<BiInfoCircle />}
        >
          <p>{errorMessage}</p>
          <button 
            style={{ backgroundColor: '#3d1616  ' }} 
            onClick={() => setPopupStatus(null)}
          >
            RETRY
          </button>
        </PopupOverlay>
      )}

    </div>
  );
}

export default ASignIn;
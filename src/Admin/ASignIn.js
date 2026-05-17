import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ASignIn.css';
import { BiInfoCircle } from 'react-icons/bi';
import PopupOverlay from '../Components/PopupOverlay';

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
    <div className="asigninContainer">

      <div className="asigninLcard">
        <div className="brandingContent">

        </div>
      </div>

      <div className="asigninRcontainer">
        <div className="asignintopBar">
          <p className="asigninText">
            <span>Have Trouble Signing In? </span>
            <b>Contact CPT Administrator.</b>
          </p>
        </div>

        <form className="asigninForm" onSubmit={handleLogin}>
          <p className="asigninTitle">Administrative</p>
          <p className="asigninTitle">Axis Portal</p>
          
          <div className="aformColumn">
            <div className="ascol">
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

            <div className="ascol">
              <label>Password <span style={{color: 'red'}}>*</span></label>
              <div className="apasswordWrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="Enter your password" 
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete='current-password'
                  required 
                />
                <span className="material-icons aeyeIcon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </div>
            </div>

            <div className="aformOptions">
              <div className="arememberMeContainer">
                <input 
                    type="checkbox" 
                    name="rememberMe" 
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </div>
              <div className="aforgotPassContainer">
                  <p className="aforgotPass">Forgot Password?</p>
              </div>
            </div>
                      
            <div className="asigninBTContainer">
                <button type="submit" className="asignInBT">
                    Sign In
                </button>
                <div className="aprivText">
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
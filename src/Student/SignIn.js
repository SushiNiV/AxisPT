import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiInfoCircle } from 'react-icons/bi';
import PopupOverlay from '../Components/PopupOverlay';

import '../SigninGlobal.css';
import '../Global.css';

function SignIn() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);

    const [formData, setFormData] = useState({
      studentID: '',
      password: '',
      birthday: '',
      rememberMe: false
    });

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
        if (name === "studentID") {
          const onlyNums = value.replace(/\D/g, "");
          setFormData(prev => ({ ...prev, [name]: onlyNums }));
        } else {
          setFormData(prev => ({ 
          ...prev, 
          [name]: type === 'checkbox' ? checked : value 
        }));
      }
    };

    const handleInitialSignIn = (e) => {
      e.preventDefault();
      if (formData.studentID && formData.password) {
        setShowPopUp(true);
      } else {
        alert("Please enter both ID and Password.");
      }
    };

    const handleFinalLogin = async (e) => {
      e.preventDefault();
        
      try {
      console.log("Sending login request with:", formData);
      console.log("API URL:", `${process.env.REACT_APP_API_URL}/student/login`);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
        if (data.success) {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('studentID', formData.studentID);
          sessionStorage.setItem('userName', data.user);
          sessionStorage.setItem('role', 'student');

          if (data.mustChangePassword) {
            navigate('/student-change-password');
          } else {
            navigate('/student/dashboard');
          } 
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Error logging in:", error);
        alert("Server connection failed.");
      }
    };

  return (
    <div className="Container NoScroll">
      <div className="SigninFormCard">
        <div className="SigninTopbar Right">
          <p className="SigninText">
            <span>Have Trouble Signing In? </span>
            <b>Contact CPT Administrator.</b>
          </p>
        </div>

        <form className="SigninForm" onSubmit={handleInitialSignIn}>
          <p className="SigninTitle">Axis CPT</p>
          <p className="SigninTitle">Student Portal</p>
                    
          <div className="Signin FormColumn">
            <div className="Signin Column">
              <label>Student ID <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  name="studentID"
                  placeholder="Enter student ID" 
                  value={formData.studentID}
                  onChange={handleChange}
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

      <div className="SigninCard">
      </div>

      {showPopUp && (
        <PopupOverlay 
          isOpen={true} 
          onClose={() => setShowPopUp(false)} 
          title={<span>Verify Birthday <span style={{color: 'red'}}>*</span></span>}
          icon={<BiInfoCircle />}
        > 
          <form className="PopUpCard" onSubmit={handleFinalLogin}>
            <input 
              type="date" 
              name="birthday"
              className="Column" 
              value={formData.birthday}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            <div className="ButtonContainer">
              <button type="submit" className="Button">
                Confirm & Sign In
              </button>
            </div>
          </form>
        </PopupOverlay>
      )}
    </div>
  );
}

export default SignIn;
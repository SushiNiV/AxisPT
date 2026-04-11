import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import '../App.css';

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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
        if (data.success) {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('studentID', formData.studentID);
          sessionStorage.setItem('userName', data.user);
          sessionStorage.setItem('role', 'student');

          if (data.mustChangePassword) {
            navigate('/student-change-password');
          } else {
            navigate('/dashboard');
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
    <div className="signinContainer">
      <div className="signinLcontainer">
        <div className="signintopBar">
          <p className="signinText">
            <span>Have Trouble Signing In? </span>
            <b>Contact CPT Administrator.</b>
          </p>
        </div>

        <form className="signinForm" onSubmit={handleInitialSignIn}>
          <p className="signinTitle">Axis CPT</p>
          <p className="signinTitle">Student Portal</p>
                    
          <div className="sformColumn">
            <div className="scol">
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

            <div className="scol">
              <label>Password <span style={{color: 'red'}}>*</span></label>
                <div className="password-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    placeholder="Enter your password" 
                    value={formData.password}
                    onChange={handleChange}
                    required 
                    />
                    <span className="material-icons eye-icon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                </div>
            </div>

            <div className="sformOptions">
              <div className="srememberMeContainer">
                <input 
                  type="checkbox" 
                  name="rememberMe" 
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </div>
              <div className="sforgotPassContainer">
                <p className="sforgotPass">Forgot Password?</p>
              </div>
            </div>
                        
            <div className="signinBTContainer">
              <button type="submit" className="signInBT">
                Sign In
              </button>
              <div className="sprivText">
                <p>"By logging in, you agree to handle all data in accordance with the Data Privacy Act of 2012 and Privacy Policies."</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="signinRcontainer">
        <div className="signinRcard">
          <div className="brandingContent"></div>
          </div>
        </div>

        {showPopUp && (
          <div className="popUpOverlay">
            <div className="popUpContainer">
              <div className="topBar">
                <button className='returnBT' onClick={() => setShowPopUp(false)}>
                  <span className="material-icons">arrow_back</span>
                </button>
              </div>
              <form className="popUpCard" onSubmit={handleFinalLogin}>
                <label>Verify Birthday <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="date" 
                  name="birthday"
                  className="col-input" 
                  value={formData.birthday}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
                <button type="submit" className="signInBT">
                  Confirm & Sign In
                </button>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default SignIn;
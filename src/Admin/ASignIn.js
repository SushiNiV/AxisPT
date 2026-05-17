import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiInfoCircle } from 'react-icons/bi';
import PopupOverlay from '../Components/PopupOverlay';
import {
  SignInContainer,
  LeftCard,
  RightContainer,
  TopBar,
  SignInText,
  SignInForm,
  FormTitle,
  FormColumn,
  FormCol,
  Label,
  PasswordWrapper,
  Input,
  EyeIcon,
  FormOptions,
  RememberMeContainer,
  ForgotPass,
  SignInButtonContainer,
  SignInButton,
  PrivText
} from './ASignIn.styles';

function ASignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [popupStatus, setPopupStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    employeeID: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "employeeID") {
      const onlyNums = value.replace(/\D/g, "");
      setFormData(prev => ({ ...prev, [name]: onlyNums }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    // Map employeeID to username for backend compatibility
    const requestBody = {
      username: formData.employeeID,  // Change this line
      password: formData.password,
      rememberMe: formData.rememberMe
    };

    const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)  // Use the mapped body
    });

    const data = await response.json();
    console.log("Server Response:", data);

    if (data.success) {
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('employeeID', data.employeeID);
        
      if (data.mustChangePassword === true) {
        navigate('/change-password'); 
      } else {
        navigate('/admin/dashboard');
      }
    } else {
      setErrorMessage(data.message || "Invalid Employee ID or Password.");
      setPopupStatus('error');
    }
  } catch (error) {
    console.error("Login Error:", error);
    setErrorMessage("Unable to connect to the server. Please try again later.");
    setPopupStatus('error');
  }
};

  return (
    <SignInContainer>
      <LeftCard>
        <div className="brandingContent">
          {/* Content here */}
        </div>
      </LeftCard>

      <RightContainer>
        <TopBar>
          <SignInText>
            <span>Have Trouble Signing In? </span>
            <b>Contact CPT Administrator.</b>
          </SignInText>
        </TopBar>

        <SignInForm onSubmit={handleLogin}>
          <FormTitle>Administrative</FormTitle>
          <FormTitle>Axis Portal</FormTitle>
          
          <FormColumn>
            <FormCol>
              <Label>Employee ID <span style={{color: 'red'}}>*</span></Label>
              <Input 
                type="text" 
                name="employeeID"
                placeholder="Enter employee ID" 
                value={formData.employeeID}
                onChange={handleChange}
                required
              />
            </FormCol>

            <FormCol>
              <Label>Password <span style={{color: 'red'}}>*</span></Label>
              <PasswordWrapper>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="Enter your password" 
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
                <EyeIcon className="material-icons" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'visibility' : 'visibility_off'}
                </EyeIcon>
              </PasswordWrapper>
            </FormCol>

            <FormOptions>
              <RememberMeContainer>
                <input 
                    type="checkbox" 
                    name="rememberMe" 
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </RememberMeContainer>
              <ForgotPass>Forgot Password?</ForgotPass>
            </FormOptions>
                      
            <SignInButtonContainer>
              <SignInButton type="submit">
                Sign In
              </SignInButton>
              <PrivText>
                <p>"By logging in, you agree to handle all data in accordance with the Data Privacy Act of 2012 and Privacy Policies."</p>
              </PrivText>
            </SignInButtonContainer>
          </FormColumn>
        </SignInForm>
      </RightContainer>

      {popupStatus === 'error' && (
        <PopupOverlay 
          isOpen={true} 
          onClose={() => setPopupStatus(null)} 
          title="ACCESS DENIED"
          icon={<BiInfoCircle />}
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
    </SignInContainer>
  );
}

export default ASignIn;
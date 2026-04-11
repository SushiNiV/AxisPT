import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Enrollment.css';
import cptLogo from '../assets/cpt-logo.png'; 

function Enrollment() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("enrollment_data");
    const timestamp = localStorage.getItem("enrollment_timestamp");
          
    if (saved && timestamp) {
      const isExpired = Date.now() - parseInt(timestamp) > 3600000; // 1 hour
        if (!isExpired) {
          return JSON.parse(saved);
        }
    }

    return {
      firstName: '', lastName: '', middleName: '', suffix: '', 
      sex: '', email: '', phoneNumber: '09', telephone: '',
      birthday: '', placeOfBirth: ''
    };
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  useEffect(() => {
    localStorage.setItem("enrollment_data", JSON.stringify(formData));
    if (!localStorage.getItem("enrollment_timestamp")) {
      localStorage.setItem("enrollment_timestamp", Date.now().toString());
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      if (value.length < 2) {
        setFormData(prev => ({ ...prev, [name]: "09" }));
        return;
      }

      const digits = value.replace(/\D/g, "");
      const limited = digits.slice(0, 11);
            
      let formatted = limited;
        if (limited.length > 4 && limited.length <= 7) {
          formatted = `${limited.slice(0, 4)}-${limited.slice(4)}`;
        } else if (limited.length > 7) {
          formatted = `${limited.slice(0, 4)}-${limited.slice(4, 7)}-${limited.slice(7)}`;
        }
            
        setFormData(prev => ({ ...prev, [name]: formatted }));
    }
      else if (name === "email") {
        setFormData(prev => ({ ...prev, [name]: value.toLowerCase() }));
    }
      else {
        setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const today = new Date().toISOString().split('T')[0];
      if (
        !formData.firstName.trim() || 
        !formData.lastName.trim() || 
        !formData.sex ||
        !formData.birthday || 
        !formData.placeOfBirth.trim() ||
        !formData.email.trim() || 
        !formData.phoneNumber.trim()
      ) {
        alert("Please fill in all required fields marked with *.");
        return;
      }

      if (!emailPattern.test(formData.email)) {
        alert("Please enter a valid email address.");
        return;
      }

      if (formData.phoneNumber.length < 13) {
        alert("Please enter a complete phone number (09XX-XXX-XXXX).");
        return;
      }

      if (formData.birthday > today) {
        alert("Birthday cannot be a future date.");
        return;
      }
    }
    setCurrentStep(Math.min(totalSteps, currentStep + 1));
  };

  const handleSubmit = () => {
    sessionStorage.removeItem("enrollment_data");
    sessionStorage.removeItem("enrollment_timestamp");
    alert("Enrollment Submitted Successfully!");
  };

  return (
    <div className="enrollmentContainer">
      <div className="etopBar">
        <div className='logoArea'>
          <img src={cptLogo} alt='CPT Logo' className='mainLogo'/>
          <p className='mainTitle'>Axis CPT</p>
        </div>
        <button className='returnBT' onClick={() => navigate('/home')}>
          <span className="material-icons">arrow_back</span>
        </button>
      </div>

      <div className="enrollmentNav">
        <div className="navLinks">
          <a className={`enrollmentLink ${currentStep === 1 ? 'active' : ''}`}>Personal Info</a>
          <a className={`enrollmentLink ${currentStep === 2 ? 'active' : ''}`}>Educational</a>
          <a className={`enrollmentLink ${currentStep === 3 ? 'active' : ''}`}>Program</a>
          <a className={`enrollmentLink ${currentStep === 4 ? 'active' : ''}`}>Documents</a>
          <a className={`enrollmentLink ${currentStep === 5 ? 'active' : ''}`}>Review</a>
        </div>
        <div className="progressBar">
          <div className="progressFill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
        </div>
      </div>

      <div className="enrollmentContent">
        {currentStep === 1 && (
          <div className="slides">
            <h1 className="enrollmentTitle">Personal Information</h1>
              <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                      
                <div className="row">
                  <div className="col">
                    <label>First Name <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="firstName"
                      placeholder="First Name" 
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col">
                    <label>Last Name <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="lastName" 
                      placeholder="Last Name" 
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col">
                    <label>Middle Name</label>
                    <input 
                      type="text" 
                      name="middleName"
                      placeholder="Middle Name" 
                      value={formData.middleName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col">
                    <label>Suffix</label>
                    <select 
                      name="suffix"
                      className="col-input"
                      value={formData.suffix}
                      onChange={handleChange}
                    >
                      <option value="">None</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                  </div>
                  <div className="col">
                    <label>Sex <span style={{color: 'red'}}>*</span></label>
                    <select 
                      name="sex"
                      className="col-input"
                      value={formData.sex}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="col">
                    <label>Birthday <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="date" 
                      name="birthday"
                      className="col-input" 
                      value={formData.birthday}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="col">
                    <label>Place of Birth <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="placeOfBirth"
                      placeholder="Place of Birth" 
                      value={formData.placeOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col">
                    <label>Email <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="Email" 
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col">
                    <label>Phone Number <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="phoneNumber"
                      placeholder="Phone Number" 
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col">
                    <label>Telephone</label>
                    <input 
                        type="text" 
                        name="telephone"
                        placeholder="Telephone" 
                        value={formData.telephone}
                        onChange={handleChange}
                      />
                  </div>
              </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="slides">
            <h1 className="enrollmentTitle">Educational Background</h1>
            <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
            <p className="enrollmentText">This is where the enrollment form will be.</p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="slides">
            <h1 className="enrollmentTitle">Program Information</h1>
            <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
            <p className="enrollmentText">This is where the enrollment form will be.</p>
          </div>
        )}

        {currentStep === 4 && (
          <div className="slides">
            <h1 className="enrollmentTitle">Document Upload</h1>
            <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
            <p className="enrollmentText">This is where the enrollment form will be.</p>
          </div>
        )}

        {currentStep === 5 && (
          <div className="slides">
            <h1 className="enrollmentTitle">Review & Submit</h1>
            <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
            <p className="enrollmentText">This is where the enrollment form will be.</p>
          </div>
        )}

        <div className="enrollmentBTs">
          <button 
            className="iconBT" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <span className="material-icons">chevron_left</span>
          </button>

          <button 
            className="iconBT" 
            onClick={handleNext}
          >
            <span className="material-icons">
              {currentStep === totalSteps ? 'check_circle' : 'chevron_right'}
            </span>
          </button>
        </div>
      </div>

      <div className="bottomBar">
        <p className="bottomText">© Copyright 2026. Our Lady of Fatima University - College of Physical Therapy. All Rights reserved. | Powered by VGR </p>
      </div>
    </div>
  );
}

export default Enrollment;
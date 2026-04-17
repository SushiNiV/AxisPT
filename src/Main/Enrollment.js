import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { countries } from 'countries-list'
import countryList from 'react-select-country-list';
import nationality from 'i18n-nationality';
import './Enrollment.css';
import cptLogo from '../assets/cpt-logo.png'; 
import { BiChevronLeft, BiChevronRight, BiCheck } from 'react-icons/bi';

nationality.registerLocale(require("i18n-nationality/langs/en.json"));

function Enrollment() {
  const navigate = useNavigate();
  const countryOptions = useMemo(() => countryList().getData(), []);
  const nationalityOptions = useMemo(() => {
    const list = nationality.getNames("en");
    return Object.entries(list).map(([code, name]) => ({
      value: code,
      label: name
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

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
      sex: '', email: '', phoneNumber: '', landline: '',
      dateOfBirth: '', placeOfBirth: '',
      religion: '', nationality: '', civilStatus: '',
      permHouseNo: '', permStreet: '', permSubdivision: '', permCity: '',
      provHouseNo: '', provStreet: '', provSubdivision: '', provCity: '',
      sameAsPermanent: false
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
      const cleaned = value.replace(/[^\d+-]/g, "");
      const limited = cleaned.slice(0, 15);
      setFormData(prev => ({ ...prev, [name]: limited }));
    }
      else if (name === "email") {
        setFormData(prev => ({ ...prev, [name]: value.toLowerCase() }));
    }
      else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
  let countryCode = null;
  const currentNationality = formData.nationality.toUpperCase();

  if (currentNationality === 'PILIPINO') {
    countryCode = 'PH';
  } else {
    const selectedNationality = nationalityOptions.find(n => 
      n.label.toUpperCase() === currentNationality
    );
    if (selectedNationality) countryCode = selectedNationality.value;
  }

  if (countryCode) {
    const countryData = countries[countryCode]; 
    
    if (countryData && countryData.phone) {
      const dialCode = `+${Array.isArray(countryData.phone) ? countryData.phone[0] : countryData.phone}`;
      
      if (!formData.phoneNumber || formData.phoneNumber.startsWith('+')) {
        setFormData(prev => ({ ...prev, phoneNumber: dialCode }));
      }
    }
  }
}, [formData.nationality, nationalityOptions]);

  const handleNext = () => {
    if (currentStep === 1) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const today = new Date().toISOString().split('T')[0];
      if (
        !formData.firstName.trim() || 
        !formData.lastName.trim() || 
        !formData.sex ||
        !formData.dateOfBirth || 
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

      if (formData.dateOfBirth > today) {
        alert("Date of Birth cannot be a future date.");
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

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        sameAsPermanent: true,
        provHouseNo: prev.permHouseNo,
        provStreet: prev.permStreet,
        provSubdivision: prev.permSubdivision,
        provCity: prev.permCity,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sameAsPermanent: false,
        // Optional: Clear provincial fields when unchecked
        provHouseNo: '', provStreet: '', provSubdivision: '', provCity: ''
      }));
    }
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

      <div className="enrollmentMain">
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

              <h2 className="enrollmentSubtitle">Fullname</h2>
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
                      value={formData.suffix}
                      onChange={handleChange}
                    >
                      <option value="">None</option>
                      <option value="JR.">Jr.</option>
                      <option value="SR.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                  </div>
                  <div className="col">
                    <label>Sex <span style={{color: 'red'}}>*</span></label>
                    <select 
                      name="sex"
                      value={formData.sex}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Sex</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div className="col">
                    <label>Date of Birth <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="date" 
                      name="dateOfBirth"
                      className="col-input" 
                      value={formData.dateOfBirth}
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
                    <label>Landline</label>
                    <input 
                        type="text" 
                        name="landline"
                        placeholder="Landline" 
                        value={formData.landline}
                        onChange={handleChange}
                      />
                  </div>
                </div>

                <div className="row">
                <div className="col">
                  <label>Religion <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    name="religion"
                    placeholder="Religion" 
                    value={formData.religion}
                    onChange={handleChange}
                  />
                </div>
                <div className="col">
                  <label>Nationality <span style={{color: 'red'}}>*</span></label>
                    <select 
                    name="nationality" 
                    value={formData.nationality}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select Nationality</option>              
                    <option value="PILIPINO">Pilipino</option>
                    <option disabled>──────────</option>
                    {nationalityOptions.map((n) => (
                      <option key={n.value} value={n.label}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col">
                  <label>Civil Status</label>
                  <select 
                      name="civilStatus"
                      value={formData.civilStatus}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Civil Status</option>
                      <option value="SINGLE">Single</option>
                      <option value="MARRIED">Married</option>
                      <option value="WIDOWED">Widowed</option>
                    </select>
                </div>
                </div>

                <h2 className="enrollmentSubtitle">Permanent Address</h2>
                <div className="row">
                  <div className="col">
                    <label>House No. <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="permHouseNo"
                      placeholder="House No." 
                      value={formData.permHouseNo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col">
                    <label>Street <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="permStreet"
                      placeholder="Street" 
                      value={formData.permStreet}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col">
                    <label>Subdivision <span style={{color: 'red'}}>*</span></label>
                    <input 
                        type="text" 
                        name="permSubdivision"
                        placeholder="Subdivision/Barangay" 
                        value={formData.permSubdivision}
                        onChange={handleChange}
                      />
                  </div>
                  <div className="col">
                    <label>City <span style={{color: 'red'}}>*</span></label>
                    <input 
                        type="text" 
                        name="permCity"
                        placeholder="City/Municipality" 
                        value={formData.permCity}
                        onChange={handleChange}
                      />
                  </div>
                </div>

                <h2 className="enrollmentSubtitle">Provincial Address</h2>
                <label className="sameAddressLabel">
                  <input 
                    type="checkbox" 
                    checked={formData.sameAsPermanent} 
                    onChange={handleCheckboxChange} 
                  />
                  Same with Permanent Address
                </label>
                {!formData.sameAsPermanent && (
                <>
                  <div className="row">
                  <div className="col">
                    <label>House No. <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="provHouseNo"
                      placeholder="House No." 
                      value={formData.provHouseNo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col">
                    <label>Street <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="provStreet"
                      placeholder="Street" 
                      value={formData.provStreet}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col">
                    <label>Subdivision <span style={{color: 'red'}}>*</span></label>
                    <input 
                        type="text" 
                        name="provSubdivision"
                        placeholder="Subdivision/Barangay" 
                        value={formData.provSubdivision}
                        onChange={handleChange}
                      />
                  </div>
                  <div className="col">
                    <label>City <span style={{color: 'red'}}>*</span></label>
                    <input 
                        type="text" 
                        name="provCity"
                        placeholder="City/Municipality" 
                        value={formData.provCity}
                        onChange={handleChange}
                      />
                  </div>
                </div>
                </>
              )}
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
              className="enrollIconBT" 
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}>
              <BiChevronLeft />
            </button>
            
            {currentStep < totalSteps ? (
              <button 
                className="enrollIconBT" 
                onClick={handleNext}
              >
                <BiChevronRight />
              </button>
            ) : (
              <button 
                className="iconBT submitBT" 
                onClick={handleSubmit}
              >
                <BiCheck />
              </button>
            )}
          </div>
        </div>

      </div>

      <div className="bottomBar">
        <p className="bottomText">© Copyright 2026. Our Lady of Fatima University - College of Physical Therapy. All Rights reserved. | Powered by VDG </p>
      </div>
    </div>
  );
}

export default Enrollment;
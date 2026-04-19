import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Enrollment.css';
import cptLogo from '../assets/cpt-logo.png'; 
import { BiChevronLeft, BiChevronRight, BiCheck } from 'react-icons/bi';

import PersonalInfo from '../Components/EnrollmentForm/PersonalInfo';
import Educational from '../Components/EnrollmentForm/Education';
import FamilyInfo from '../Components/EnrollmentForm/FamilyInfo';
import Achievements from '../Components/EnrollmentForm/Achievements';
import DocumentUpload from '../Components/EnrollmentForm/DocumentUpload';
import Review from '../Components/EnrollmentForm/Review';

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
      sex: '', dateOfBirth: '', placeOfBirth: '',
      email: '', phoneNumber: '', landline: '',
      religion: '', nationality: '', civilStatus: '',
      height: '', weight: '', language: '',
      visualProblems: '',
      permHouseNo: '', permStreet: '', permSubdivision: '', permCity: '',
      provHouseNo: '', provStreet: '', provSubdivision: '', provCity: '',
      sameAsPermanent: false,

      program: '', yearLevel: '', classification: '',
      highschoolGraduated: '', pubprivHS: '', schoolAddress: '', hsFinalGWA: '',

      fatherFirstName: '', fatherLastName: '', fatherMiddleName: '', fatherStatus: '', fatherOccupation: '', fatherContactNumber: '',
      motherFirstName: '', motherLastName: '', motherMiddleName: '', motherStatus: '', motherOccupation: '', motherContactNumber: '',
      guardianFirstName: '', guardianLastName: '', guardianMiddleName: '', guardianRelationship: '', guardianContactNumber: '',
      support: [], parentsIncome: '', livingArrangement: '', transportExpense: '', numSibling: '', ordinalPosition: '',


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
      let cleaned = value.replace(/[^\d+]/g, "");
      const isPH = cleaned.startsWith('09') || cleaned.startsWith('63') || cleaned.startsWith('+63');

      if (cleaned.startsWith('09')) {
        cleaned = '+63' + cleaned.substring(1);
      } else if (cleaned.startsWith('63')) {
        cleaned = '+63' + cleaned.substring(2);
      }
      
      const limit = isPH ? 13 : 15;
      const limited = cleaned.slice(0, limit);
      setFormData(prev => ({ ...prev, [name]: limited }));
    } 
    else if (name === "email") {
      setFormData(prev => ({ ...prev, [name]: value.toLowerCase() }));
    }
    else if (["firstName", "lastName", "middleName", "placeOfBirth", "religion", "language", "permHouseNo", "permStreet", "permSubdivision", "permCity", "provHouseNo", "provStreet", "provSubdivision", "provCity"].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const today = new Date().toISOString().split('T')[0];
      const phone = formData.phoneNumber;
      const isPH = phone.startsWith('+63');

      const requiredFields = [
        'firstName', 'lastName', 'sex', 'dateOfBirth', 
        'placeOfBirth', 'email', 'phoneNumber', 'religion', 
        'nationality', 'height', 'weight', 'permHouseNo', 
        'permStreet', 'permSubdivision', 'permCity'
      ];

      const isFieldEmpty = requiredFields.some(field => !formData[field]?.toString().trim());

      const isProvincialEmpty = !formData.sameAsPermanent && (
        !formData.provHouseNo.trim() || 
        !formData.provStreet.trim() || 
        !formData.provSubdivision.trim() || 
        !formData.provCity.trim()
      );

      if (isFieldEmpty || isProvincialEmpty) {
        alert("Please fill in all required fields marked with *.");
        return;
      }

      if (!emailPattern.test(formData.email)) {
        alert("Please enter a valid email address.");
        return;
      }

      if (isPH && phone.length < 13) {
        alert("Invalid Philippine phone number.");
        return;
      } else if (!isPH && phone.length < 7) {
        alert("Please enter a valid international phone number.");
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
    localStorage.removeItem("enrollment_data");
    localStorage.removeItem("enrollment_timestamp");
    alert("Enrollment Submitted Successfully!");
    navigate('/home'); 
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
            <a className={`enrollmentLink ${currentStep === 3 ? 'active' : ''}`}>Family Info</a>
            <a className={`enrollmentLink ${currentStep === 4 ? 'active' : ''}`}>Achievements</a>
            <a className={`enrollmentLink ${currentStep === 5? 'active' : ''}`}>Review</a>
          </div>
        <div className="progressBar">
          <div className="progressFill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
          </div>
        </div>

        <div className="enrollmentContent">
          {currentStep === 1 && (
            <PersonalInfo 
              formData={formData} 
              setFormData={setFormData} 
              handleChange={handleChange} 
            />
          )}

          {currentStep === 2 && (
            <Educational 
              formData={formData} 
              setFormData={setFormData} 
              handleChange={handleChange} 
            />
          )}

          {currentStep === 3 && (
            <FamilyInfo
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
            />
          )}

          {currentStep === 4 && (
            <Achievements
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
            />
          )}

          {currentStep === 5 && (
            <Review
              formData={formData}
            />
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
                className="enrollIconBT" 
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
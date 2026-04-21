import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registration.css';
import cptLogo from '../assets/cpt-logo.png'; 
import { BiChevronLeft, BiChevronRight, BiCheck } from 'react-icons/bi';

import PersonalInfo from '../Components/RegistrationSection/PersonalInfo';
import Educational from '../Components/RegistrationSection/Education';
import FamilyInfo from '../Components/RegistrationSection/FamilyInfo';
import Achievements from '../Components/RegistrationSection/Achievements';
import DocumentUpload from '../Components/RegistrationSection/DocumentUpload';
import Review from '../Components/RegistrationSection/Review';

import PopupOverlay from '../Components/PopupOverlay';

const initialFields = {
  firstName: '', lastName: '', middleName: '', suffix: '', 
  sex: '', dateOfBirth: '', placeOfBirth: '',
  email: '', phoneNumber: '', landline: '',
  religion: '', nationality: '', civilStatus: '',
  height: '', weight: '', language: '',
  visualProblems: '',
  permHouseNo: '', permStreet: '', permSubdivision: '', permCity: '',
  provHouseNo: '', provStreet: '', provSubdivision: '', provCity: '',
  sameAsPermanent: false,
  fatimaEmail: '', studentID: '',
  program: '', classification: '', yearLevel: '', section: '', acadYear: '', semester: '',
  highschoolGraduated: '', pubprivHS: '', schoolAddress: '', hsFinalGWA: '',
  fatherFirstName: '', fatherLastName: '', fatherMiddleName: '', fatherSuffix: '',
  fatherStatus: '', fatherOccupation: '', fatherContactNumber: '',
  motherFirstName: '', motherLastName: '', motherMiddleName: '', motherSuffix: '',
  motherStatus: '', motherOccupation: '', motherContactNumber: '',
  guardianFirstName: '', guardianLastName: '', guardianMiddleName: '', guardianSuffix: '',
  guardianRelationship: '', guardianContactNumber: '',
  support: [], parentsIncome: '', livingArrangement: '', transportExpense: '', numSiblings: null, ordinalPosition: '',
  awards: '', interests: '', careerGoal: '', extracurricular: '',
};

function Registration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("enrollment_data");
    return saved ? JSON.parse(saved) : initialFields;
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  useEffect(() => {
    localStorage.setItem("enrollment_data", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (type === "checkbox") {
      if (name === "sameAsPermanent") {
        setFormData(prev => ({ 
          ...prev, 
          [name]: checked,
          provHouseNo: checked ? prev.permHouseNo : '',
          provStreet: checked ? prev.permStreet : '',
          provSubdivision: checked ? prev.permSubdivision : '',
          provCity: checked ? prev.permCity : '',
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
      return;
    }

    if (name === "hsFinalGWA") {
      if (value === "") {
        setFormData(prev => ({ ...prev, [name]: "" }));
        return;
      }
      
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "numSiblings") {
      if (value === "") {
        setFormData(prev => ({ ...prev, [name]: "" }));
        return;
      }
      
      if (/^\d+$/.test(value)) {
        const val = parseInt(value, 10);
        if (val >= 0) {
          setFormData(prev => ({ ...prev, [name]: value }));
        }
      }
      return;
    }

    if (name === "support") {
      setFormData(prev => {
        const currentSupport = Array.isArray(prev.support) ? prev.support : [];
        if (checked) {
          return { ...prev, support: [...currentSupport, value] };
        } else {
          return { ...prev, support: currentSupport.filter(item => item !== value) };
        }
      });
      return;
    }

    const contactFields = [
      "phoneNumber", 
      "fatherContactNumber", 
      "motherContactNumber", 
      "guardianContactNumber"
    ];

    if (contactFields.includes(name)) {
      let cleaned = value.replace(/[^\d+]/g, "");

      if (cleaned.startsWith('09')) {
        cleaned = '+63' + cleaned.substring(1);
      } else if (cleaned.startsWith('63')) {
        cleaned = '+63' + cleaned.substring(2);
      }

      const isPH = cleaned.startsWith('+63');
      const limit = isPH ? 13 : 15;

      setFormData(prev => ({ 
        ...prev, 
        [name]: cleaned.slice(0, limit) 
      }));
      return;
    }

    const capsRequired = [
      'firstName', 'lastName', 'middleName', 'suffix', 'sex', 'placeOfBirth',
      'religion', 'nationality', 'civilStatus', 'language',
      'permHouseNo', 'permStreet', 'permSubdivision', 'permCity',
      'provHouseNo', 'provStreet', 'provSubdivision', 'provCity',
      'program', 'classification', 'yearLevel', 'section', 'acadYear', 'semester',
      'highschoolGraduated', 'pubprivHS', 'schoolAddress',
      'fatherFirstName', 'fatherLastName', 'fatherMiddleName', 'fatherSuffix',
      'fatherStatus', 'fatherOccupation',
      'motherFirstName', 'motherLastName','motherMiddleName', 'motherSuffix',
      'motherStatus', 'motherOccupation',
      'guardianFirstName', 'guardianLastName', 'guardianMiddleName', 'guardianSuffix',
      'guardianRelationship', 'livingArrangement', 'transportExpense', 'ordinalPosition'
    ];

      if (capsRequired.includes(name)) {
        const upperValue = value.toUpperCase();
        setFormData(prev => {
            const updated = { ...prev, [name]: upperValue };
            
            if (prev.sameAsPermanent) {
                if (name === 'permHouseNo') updated.provHouseNo = upperValue;
                if (name === 'permStreet') updated.provStreet = upperValue;
                if (name === 'permSubdivision') updated.provSubdivision = upperValue;
                if (name === 'permCity') updated.provCity = upperValue;
            }
            
            return updated;
        });
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
};

  const [errors, setErrors] = useState({});

  const getStepErrors = () => {
    let newErrors = {};

    if (currentStep === 1) {
      const personalRequired = [
        'firstName', 'lastName', 'sex', 'dateOfBirth', 'placeOfBirth',
        'email', 'phoneNumber', 'religion', 'nationality', 'civilStatus',
        'height', 'weight', 'language', 'permHouseNo', 'permStreet', 
        'permSubdivision', 'permCity'
      ];
      
      personalRequired.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === "") {
          newErrors[field] = "This field is required";
        }
      });

      if (!formData.sameAsPermanent) {
        const provFields = ['provHouseNo', 'provStreet', 'provSubdivision', 'provCity'];
        provFields.forEach(field => {
          if (!formData[field] || formData[field].toString().trim() === "") {
            newErrors[field] = "This field is required";
          }
        });
      }
    }

    if (currentStep === 2) {
      const eduFields = ['fatimaEmail', 'studentID', 'program', 'classification', 'yearLevel', 'section', 'acadYear', 'semester', 'highschoolGraduated', 'pubprivHS', 'schoolAddress', 'hsFinalGWA'];
      eduFields.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === "") {
          newErrors[field] = "This field is required";
        }
      });
    }

    if (currentStep === 3) {
      const familyBase = ['fatherFirstName', 'fatherLastName', 'fatherStatus', 'motherFirstName', 'motherLastName', 'motherStatus', 'support', 'parentsIncome', 'livingArrangement', 'transportExpense', 'ordinalPosition'];
      familyBase.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === "") newErrors[field] = "This field is required";
      });

      if (formData.fatherStatus?.toUpperCase() === 'LIVING') {
        if (!formData.fatherOccupation) newErrors.fatherOccupation = "This field is required";
        if (!formData.fatherContactNumber) newErrors.fatherContactNumber = "This field is required";
      }
      if (formData.motherStatus?.toUpperCase() === 'LIVING') {
        if (!formData.motherOccupation) newErrors.motherOccupation = "This field is required";
        if (!formData.motherContactNumber) newErrors.motherContactNumber = "This field is required";
      }
      if (formData.support.length === 0) newErrors.support = "This field is required";
    }

    if (currentStep === 4) {
      ['awards', 'interests', 'careerGoal', 'extracurricular'].forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === "") newErrors[field] = "This field is required";
      });
    }

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = getStepErrors();
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return; 
    }

    setErrors({});
    setCurrentStep(prev => prev + 1);
  };

  const [popupStatus, setPopupStatus] = useState(null);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/student/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.removeItem("enrollment_data");
        setPopupStatus('success'); 
      } else {
        if (result.error && result.error.toLowerCase().includes("exists")) {
          setPopupStatus('duplicate');
        } else {
          setPopupStatus('error');
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setPopupStatus('error');
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
              errors={errors}
            />
          )}

          {currentStep === 2 && (
            <Educational 
              formData={formData} 
              setFormData={setFormData} 
              handleChange={handleChange}
              errors={errors}
            />
          )}

          {currentStep === 3 && (
            <FamilyInfo
              formData={formData}
              setFormData={setFormData}
              setErrors={setErrors}
              handleChange={handleChange}
              errors={errors}
            />
          )}

          {currentStep === 4 && (
            <Achievements
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              errors={errors}
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

      {popupStatus === 'success' && (
        <PopupOverlay 
          isOpen={true} 
          onClose={() => setPopupStatus(null)} 
          title="SUBMISSION SUCCESSFUL!"
        >
          <div className="popup-body-centered">
            <p>Your registration has been successfully submitted.<br/><br/>
            We are currently processing your application. Please wait for an email confirmation shortly.</p>
            <button className="enrollmentBT" onClick={() => window.location.reload()}>Got it</button>
          </div>
        </PopupOverlay>
      )}

      {popupStatus === 'duplicate' && (
        <PopupOverlay 
          isOpen={true} 
          onClose={() => setPopupStatus(null)} 
          title="RECORD ALREADY EXISTS"
        >
          <div className="popup-body-centered">
            <p>This student ID has already been used for a registration.<br/><br/>
            If you believe this is an error, please contact the College Administrators.</p>
            <button className="enrollmentBT" onClick={() => setPopupStatus(null)}>Okay</button>
          </div>
        </PopupOverlay>
      )}

    </div>
  );
}

export default Registration;
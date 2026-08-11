import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../GlobalForm.css'
import '../../GlobalOverlay.css';
import '../../Global.css';

const AddStudent = ({ isOpen, onClose, isEditMode, initialData, onSubmit, isSubmitting }) => {
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    studentNumber: '',
    email: '',
    accountStatus: true,
    programId: '',
    yearLevel: '1',
    sectionId: '',
    birthDate: '',
    sex: 'Male',
    mobileNo: '',
    civilStatus: 'Single',
    street: '',
    barangay: '',
    city: '',
    province: '',
    highschoolName: '',
    hsGwa: ''
  });

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        firstName: initialData.first_name || '',
        middleName: initialData.middle_name || '',
        lastName: initialData.last_name || '',
        suffix: initialData.suffix || '',
        studentNumber: initialData.student_number || '',
        email: initialData.personal_email || '',
        accountStatus: initialData.account_status ?? true,
        programId: initialData.program_id || '',
        yearLevel: initialData.year_level || '1',
        sectionId: initialData.section_id || '',
        birthDate: initialData.birth_date ? initialData.birth_date.split('T')[0] : '',
        sex: initialData.sex || 'Male',
        mobileNo: initialData.mobile_no || '',
        civilStatus: initialData.civil_status || 'Single',
        street: initialData.street || '',
        barangay: initialData.barangay || '',
        city: initialData.city_municipality || '',
        province: initialData.province || '',
        highschoolName: initialData.highschool_graduated || '',
        hsGwa: initialData.hs_final_gwa || ''
      });
    }
  }, [isEditMode, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modalOverlay">
      <div className="modalContainer">
        
        {/* Global Modal Header */}
        <div className="modalHeader">
          <h3 className="modalTitle">
            {isEditMode ? "EDIT STUDENT RECORD" : "ADD NEW STUDENT"}
          </h3>
          <div className="CloseBtnArea">
            <button className="CloseBtn" onClick={onClose} disabled={isSubmitting}>
              &times;
            </button>
          </div>
        </div>

        {/* Global Scroll Area Body */}
        <form onSubmit={handleSubmit} className="modalScrollArea">
          
          {/* SECTION 1: PRIMARY DETAILS */}
          <div className="formSection">
            <h4 className="sectionHeading">Primary Information</h4>
            
            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">FIRST NAME *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="formGroup">
                <label className="formLabel">MIDDLE NAME</label>
                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">LAST NAME *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">STUDENT NUMBER *</label>
                <input type="text" name="studentNumber" value={formData.studentNumber} onChange={handleChange} required />
              </div>
              <div className="formGroup span2">
                <label className="formLabel">EMAIL ADDRESS *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">PROGRAM *</label>
                <select name="programId" value={formData.programId} onChange={handleChange} required>
                  <option value="">Select Program</option>
                  <option value="1">BS Information Technology</option>
                  <option value="2">BS Computer Science</option>
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">YEAR LEVEL *</label>
                <select name="yearLevel" value={formData.yearLevel} onChange={handleChange} required>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">STATUS</label>
                <div className="statusToggleContainer" onClick={() => setFormData(p => ({ ...p, accountStatus: !p.accountStatus }))}>
                  <div className={`statusSwitch ${formData.accountStatus ? 'active' : 'inactive'}`}>
                    <div className="switchHandle" />
                  </div>
                  <span className={`statusLabel ${formData.accountStatus ? 'text-active' : 'text-inactive'}`}>
                    {formData.accountStatus ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACCORDION TOGGLE BUTTON */}
          <div className="accordionToggleArea">
            <button 
              type="button" 
              className="accordionBtn"
              onClick={() => setShowDetailedInfo(!showDetailedInfo)}
            >
              <span>{showDetailedInfo ? "Hide Detailed Information" : "View / Edit Detailed Student Information"}</span>
              <span className={`arrow ${showDetailedInfo ? 'open' : ''}`}>&#9660;</span>
            </button>
          </div>

          {/* SECTION 3: COLLAPSIBLE DETAILED INFORMATION */}
          {showDetailedInfo && (
            <div className="detailedInfoContainer">
              
              <h4 className="sectionHeading">Personal & Demographics</h4>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">BIRTH DATE</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">SEX</label>
                  <select name="sex" value={formData.sex} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel">MOBILE NO.</label>
                  <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleChange} />
                </div>
              </div>

              <h4 className="sectionHeading">Address Details</h4>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">STREET / HOUSE NO.</label>
                  <input type="text" name="street" value={formData.street} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">BARANGAY</label>
                  <input type="text" name="barangay" value={formData.barangay} onChange={handleChange} />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">CITY / MUNICIPALITY</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">PROVINCE</label>
                  <input type="text" name="province" value={formData.province} onChange={handleChange} />
                </div>
              </div>

              <h4 className="sectionHeading">Educational History</h4>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">HIGHSCHOOL GRADUATED</label>
                  <input type="text" name="highschoolName" value={formData.highschoolName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">FINAL HS GWA</label>
                  <input type="number" step="0.01" name="hsGwa" value={formData.hsGwa} onChange={handleChange} />
                </div>
              </div>

            </div>
          )}

          {/* Modal Actions */}
          <div className="modalFooter">
            <button type="button" className="cancelBtn" onClick={onClose} disabled={isSubmitting}>
              CANCEL
            </button>
            <button type="submit" className="submitBtn" disabled={isSubmitting}>
              {isSubmitting ? "SAVING..." : (isEditMode ? "UPDATE STUDENT" : "CREATE STUDENT")}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddStudent;
import React, { useState, useEffect, useRef } from 'react';
import './FamilyInfo.css';

function FamilyInfo({ formData, setFormData, setErrors, handleChange, errors }) {
  const isFatherRequired = formData.fatherStatus !== "DECEASED" && formData.fatherStatus !== "N/A";
  const isMotherRequired = formData.motherStatus !== "DECEASED" && formData.motherStatus !== "N/A";

  const [isOpen, setIsOpen] = useState(false);
  const multiselectRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (multiselectRef.current && !multiselectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const options = ["PARENTS", "RELATIVES", "BROTHER/SISTER", "BENEFACTORS", "SCHOLARSHIPS"];

  const toggleOption = (option) => {
    const current = Array.isArray(formData.support) ? formData.support : [];
    const newSupport = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];
  
    setFormData(prev => ({ ...prev, support: newSupport }));

    if (errors.support) {
      setErrors(prev => {
        const { support, ... rest } = prev; 
        return rest;
      });
    }
  };

  return (
    <div className="slides">
      <h1 className="enrollmentTitle">Family Information</h1>

      <h2 className="enrollmentSubtitle">Father's Information</h2>
      <div className="row">
        <div className="col">
          <label>First Name <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="fatherFirstName"
            placeholder="Father's First Name" 
            value={formData.fatherFirstName}
            onChange={handleChange}
            className={errors.fatherFirstName ? "input-error" : ""}
            required
          />
          {errors.fatherFirstName && <span className="error-text">{errors.fatherFirstName}</span>}
        </div>
        <div className="col">
          <label>Last Name <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="fatherLastName" 
              placeholder="Father's Last Name" 
              value={formData.fatherLastName}
              onChange={handleChange}
              className={errors.fatherLastName ? "input-error" : ""}
              required
            />
            {errors.fatherLastName && <span className="error-text">{errors.fatherLastName}</span>}
        </div>
        <div className="col">
          <label>Middle Name</label>
          <input 
            type="text" 
            name="fatherMiddleName"
            placeholder="Father's Middle Name" 
            value={formData.fatherMiddleName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Suffix</label>
          <select 
            name="fatherSuffix"
            value={formData.fatherSuffix}
            onChange={handleChange}
          >
            <option value="">NONE</option>
            <option value="JR.">JR.</option>
            <option value="SR.">SR.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>
        <div className="col">
          <label>Status <span style={{color: 'red'}}>*</span></label>
          <select 
            name="fatherStatus"
            value={formData.fatherStatus}
            onChange={handleChange}
            className={errors.fatherStatus ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select Status</option>
            <option value="N/A">N/A</option>
            <option value="LIVING">LIVING</option>
            <option value="DECEASED">DECEASED</option>
          </select>
          {errors.fatherStatus && <span className="error-text">{errors.fatherStatus}</span>}
        </div>
        <div className="col">
          <label>
            Occupation
            {isFatherRequired && <span style={{ color: 'red' }}> *</span>}
          </label>
          <input 
            type="text" 
            name="fatherOccupation"
            placeholder="Father's Occupation" 
            value={formData.fatherOccupation}
            onChange={handleChange}
            disabled={!isFatherRequired}
            placeholder={!isFatherRequired ? "NOT APPLICABLE" : "Enter Occupation"}
            className={!isFatherRequired ? "disabled-input" : ""}
            className={errors.fatherOccupation ? "input-error" : ""}
          />
          {errors.fatherOccupation && <span className="error-text">{errors.fatherOccupation}</span>}
        </div>
        <div className="col">
          <label>
            Contact Number
            {isFatherRequired && <span style={{ color: 'red' }}> *</span>}
          </label>
          <input 
            type="tel" 
            name="fatherContactNumber"
            placeholder="Father's Contact Number" 
            value={formData.fatherContactNumber}
            onChange={handleChange}
            disabled={!isFatherRequired}
            placeholder={!isFatherRequired ? "NOT APPLICABLE" : "Enter Occupation"}
            className={!isFatherRequired ? "disabled-input" : ""}
            className={errors.fatherContactNumber ? "input-error" : ""}
          />
          {errors.fatherContactNumber && <span className="error-text">{errors.fatherContactNumber}</span>}
        </div>
      </div>

      <h2 className="enrollmentSubtitle">Mother's Information</h2>
      <div className="row">
        <div className="col">
          <label>First Name <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="motherFirstName"
            placeholder="Mother's First Name" 
            value={formData.motherFirstName}
            onChange={handleChange}
            className={errors.motherFirstName ? "input-error" : ""}
            required
          />
          {errors.motherFirstName && <span className="error-text">{errors.motherFirstName}</span>}
        </div>
        <div className="col">
          <label>Last Name <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="motherLastName" 
              placeholder="Mother's Last Name" 
              value={formData.motherLastName}
              onChange={handleChange}
              className={errors.motherLastName ? "input-error" : ""}
              required
            />
            {errors.motherLastName && <span className="error-text">{errors.motherLastName}</span>}
        </div>
        <div className="col">
          <label>Middle Name</label>
          <input 
            type="text" 
            name="motherMiddleName"
            placeholder="Mother's Middle Name" 
            value={formData.motherMiddleName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Suffix</label>
          <select 
            name="motherSuffix"
            value={formData.motherSuffix}
            onChange={handleChange}
          >
            <option value="">NONE</option>
            <option value="JR.">JR.</option>
            <option value="SR.">SR.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>
        <div className="col">
          <label>Status <span style={{color: 'red'}}>*</span></label>
          <select 
            name="motherStatus"
            value={formData.motherStatus}
            onChange={handleChange}
            className={errors.motherStatus ? "input-error" : ""}
            required
          >
            <option value="">Select Status</option>
            <option value="N/A">N/A</option>
            <option value="LIVING">LIVING</option>
            <option value="DECEASED">DECEASED</option>
          </select>
          {errors.motherStatus && <span className="error-text">{errors.motherStatus}</span>}
        </div>
        <div className="col">
          <label>
            Occupation
            {isMotherRequired && <span style={{ color: 'red' }}> *</span>}
          </label>
          <input 
            type="text" 
            name="motherOccupation"
            placeholder="Mother's Occupation" 
            value={formData.motherOccupation}
            onChange={handleChange}
            disabled={!isMotherRequired}
            placeholder={!isMotherRequired ? "NOT APPLICABLE" : "Enter Occupation"}
            className={!isMotherRequired ? "disabled-input" : ""}
            className={errors.motherOccupation ? "input-error" : ""}
          />
          {errors.motherOccupation && <span className="error-text">{errors.motherOccupation}</span>}
        </div>
        <div className="col">
          <label>
            Contact Number
            {isMotherRequired && <span style={{ color: 'red' }}> *</span>}
          </label>
          <input 
            type="tel" 
            name="motherContactNumber"
            placeholder="Mother's Contact Number" 
            value={formData.motherContactNumber}
            onChange={handleChange}
            disabled={!isMotherRequired}
            placeholder={!isMotherRequired ? "NOT APPLICABLE" : "Enter Occupation"}
            className={!isMotherRequired ? "disabled-input" : ""}
            className={errors.motherContactNumber ? "input-error" : ""}
          />
          {errors.motherContactNumber && <span className="error-text">{errors.motherContactNumber}</span>}
        </div>
      </div>

      <h2 className="enrollmentSubtitle">Guardian's Information</h2>
      <div className="row">
        <div className="col">
          <label>First Name </label>
          <input 
            type="text" 
            name="guardianFirstName"
            placeholder="Guardian's First Name" 
            value={formData.guardianFirstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Last Name </label>
            <input 
              type="text" 
              name="guardianLastName" 
              placeholder="Guardian's Last Name" 
              value={formData.guardianLastName}
              onChange={handleChange}
              required
            />
        </div>
        <div className="col">
          <label>Middle Name</label>
          <input 
            type="text" 
            name="guardianMiddleName"
            placeholder="Guardian's Middle Name" 
            value={formData.guardianMiddleName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Suffix</label>
          <select 
            name="guardianSuffix"
            value={formData.guardianSuffix}
            onChange={handleChange}
          >
            <option value="">NONE</option>
            <option value="JR.">JR.</option>
            <option value="SR.">SR.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>
        <div className="col">
          <label>Relationship </label>
          <input 
            type="text" 
            name="guardianRelationship"
            placeholder="Guardian's Relationship" 
            value={formData.guardianRelationship}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Contact Number </label>
          <input 
            type="tel" 
            name="guardianContactNumber"
            placeholder="Guardian's Contact Number" 
            value={formData.guardianContactNumber}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <h2 className="enrollmentSubtitle">More Information</h2>
      <div className="row">
        <div className="col">
          <label>Who supports your college education? <span style={{color: 'red'}}>*</span></label>
          <div className="custom-multiselect" ref={multiselectRef}>
            <div 
              className={`select-display ${errors.support ? "input-error" : ""}`}   
              onClick={() => setIsOpen(!isOpen)}
              tabIndex="0"
            >
              <span className="selected-text">
                {formData.support.length > 0 
                  ? formData.support.join(", ") 
                  : "Select options"}
              </span>
            </div>
            {isOpen && (
              <div className="dropdown-menu">
                {options.map(option => (
                  <label key={option} className="dropdown-item">
                    <input 
                      type="checkbox"
                      checked={formData.support.includes(option)}
                      onChange={() => toggleOption(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {errors.support && <span className="error-text">{errors.support}</span>}
        </div>
        <div className="col">
          <label>Parent's Joint Monthly Income <span style={{color: 'red'}}>*</span></label>
          <select 
            name="parentsIncome"
            value={formData.parentsIncome}
            onChange={handleChange}
            className={errors.parentsIncome ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select an option</option>
            <option value="BELOW P20K">BELOW P20K</option>
            <option value="P21K TO P40K">P21K TO P40K</option>
            <option value="P41K TO P80K">P41K TO P80K</option>
            <option value="ABOVE P80K">ABOVE P80K</option>
          </select>
          {errors.parentsIncome && <span className="error-text">{errors.parentsIncome}</span>}
        </div>
      </div>    

      <div className="row">
        <div className="col">
          <label>While studying in OLFU will you live in? <span style={{color: 'red'}}>*</span></label>
          <select 
            name="livingArrangement"
            value={formData.livingArrangement}
            onChange={handleChange}
            className={errors.livingArrangement ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select an option</option>
            <option value="DORM/BOARDING HOUSE">DORM/BOARDING HOUSE</option>
            <option value="PARENT'S HOUSE">PARENT'S HOUSE</option>
            <option value="RELATIVE'S HOUSE">RELATIVE'S HOUSE</option>
          </select>
          {errors.livingArrangement && <span className="error-text">{errors.livingArrangement}</span>}
        </div>
        <div className="col">
          <label>Daily Transportation Expense <span style={{color: 'red'}}>*</span></label>
          <select 
            name="transportExpense"
            value={formData.transportExpense}
            onChange={handleChange}
            className={errors.transportExpense ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select an option</option>
            <option value="&lt; P50">&lt; P50</option>
            <option value="BETWEEN P51-P100">BETWEEN P51-P100</option>
            <option value="&gt; P100">&gt; P100</option>
          </select>
          {errors.transportExpense && <span className="error-text">{errors.transportExpense}</span>}
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Number of siblings? </label>
          <input 
            type="number"
            name="numSiblings"
            placeholder="Number of siblings (kapatid), if any"
            value={formData.numSiblings}
            onChange={handleChange}
            required
          >
          </input>
        </div>
        <div className="col">
          <label>Ordinal Position <span style={{color: 'red'}}>*</span></label>
          <select 
            name="ordinalPosition"
            value={formData.ordinalPosition}
            onChange={handleChange}
            className={errors.ordinalPosition ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select an option</option>
            <option value="ONLY CHILD">ONLY CHILD</option>
            <option value="ELDEST CHILD">ELDEST CHILD</option>
            <option value="MIDDLE CHILD">MIDDLE CHILD</option>
            <option value="YOUNGEST CHILD">YOUNGEST CHILD</option>
          </select>
          {errors.ordinalPosition && <span className="error-text">{errors.ordinalPosition}</span>}
        </div>
      </div>
    </div>
  );
};

export default FamilyInfo;
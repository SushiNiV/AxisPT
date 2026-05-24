import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import { BiChevronDown } from 'react-icons/bi';

import '../../GlobalForm.css'
import '../../GlobalOverlay.css';
import '../../Global.css';

function AddCurricula({ onClose, onSuccess, curriculumToEdit = null }) {
  const isEditMode = !!curriculumToEdit;
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    program: "",
    start_year: currentYear,
    version: "",
    is_active: true
  });
  const [programs, setPrograms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [portalRoot, setPortalRoot] = useState(null);

  const yearOptions = [];
  for (let year = currentYear - 10; year <= currentYear + 10; year++) {
    yearOptions.push(year);
  }

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setPrograms(data.data);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    fetchPrograms();
    
    setPortalRoot(document.getElementById('portal-root') || document.body);
  }, []);

  useEffect(() => {
    if (isEditMode && curriculumToEdit) {
      setFormData({
        program: curriculumToEdit.program_id || "",
        start_year: curriculumToEdit.start_year || currentYear,
        version: curriculumToEdit.version_name || "",
        is_active: curriculumToEdit.is_active || false
      });
      setIsActive(curriculumToEdit.is_active || false);
    }
  }, [isEditMode, curriculumToEdit, currentYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const handleSubmit = async () => {
    const { program, start_year, version } = formData;

    if (!program || !start_year || !version) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const url = isEditMode 
        ? `${process.env.REACT_APP_API_URL}/admin/curricula/${curriculumToEdit.curriculum_id}`
        : `${process.env.REACT_APP_API_URL}/admin/curricula`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          program_id: parseInt(program),
          start_year: parseInt(start_year),
          version_name: version,
          is_active: isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(isEditMode ? "Curriculum updated successfully!" : "Curriculum created successfully!");
        onSuccess();
      } else {
        alert(data.message || (isEditMode ? "Failed to update curriculum." : "Failed to create curriculum."));
      }
    } catch (error) {
      console.error("Error submitting curriculum:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="modalOverlay">
      <div className="modalContainer">
        <div className="CloseBtnArea">
          <button className="CloseBtn" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>
        <div className="modalHeader">
          <h3 className="modalTitle">{isEditMode ? "UPDATE CURRICULUM" : "ADD NEW CURRICULUM"}</h3>
        </div>

        <div className="modalScrollArea">
          <div className="FormContent">
            <div className="formGroup">
              <label className="formLabel">Program <span style={{color: 'red'}}>*</span></label>
              <select 
                name="program" 
                value={formData.program} 
                onChange={handleChange}
                className="formSelect"
              >
                <option value="">Select Program</option>
                {programs.map(program => (
                  <option key={program.program_id} value={program.program_id}>
                    {program.program_name} ({program.program_abbr})
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label className="formLabel">Start Year <span style={{color: 'red'}}>*</span></label>
              <select 
                name="start_year" 
                value={formData.start_year} 
                onChange={handleChange}
                className="formSelect"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label className="formLabel">Version <span style={{color: 'red'}}>*</span></label>
              <input 
                type="text" 
                name="version" 
                placeholder="Version 1.0" 
                value={formData.version}
                onChange={handleChange}
              />
            </div>

            <div className="formGroup">
              <label className="formLabel">CURRICULUM STATUS <span style={{color: 'red'}}>*</span></label>
              <div className="statusToggleContainer" onClick={toggleActive}>
                <div className={`statusSwitch ${isActive ? 'active' : 'inactive'}`}>
                  <div className="switchHandle"></div>
                </div>
                <span className={`statusLabel ${isActive ? 'text-active' : 'text-inactive'}`}>
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>

            <div className="BtnsContainer">
              <button className="ResetFilterBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
              <button className="ApplyFilterBtn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (isEditMode ? "UPDATING..." : "CREATING...") : (isEditMode ? "UPDATE" : "CREATE")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!portalRoot) return null;
  
  return ReactDOM.createPortal(modalContent, portalRoot);
}

export default AddCurricula;
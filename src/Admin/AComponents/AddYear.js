import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import '../../GlobalForm.css'
import '../../GlobalOverlay.css';
import '../../Global.css';

function AddYear({ onClose, onSuccess, yearToEdit = null }) {
  const currentYear = new Date().getFullYear();
  const isEditMode = !!yearToEdit;
  
  let initialStartYear = currentYear;
  let initialEndYear = currentYear + 1;
  let initialIsActive = false;
  
  if (isEditMode && yearToEdit.year_label) {
    const [start, end] = yearToEdit.year_label.split('-');
    initialStartYear = parseInt(start);
    initialEndYear = parseInt(end);
    initialIsActive = yearToEdit.is_active || false;
  }
  
  const [startYear, setStartYear] = useState(initialStartYear);
  const [endYear, setEndYear] = useState(initialEndYear);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalRoot, setPortalRoot] = useState(document.getElementById('portal-root') || document.body);

  useEffect(() => {
    if (isEditMode && yearToEdit.year_label) {
      const [start, end] = yearToEdit.year_label.split('-');
      setStartYear(parseInt(start));
      setEndYear(parseInt(end));
      setIsActive(yearToEdit.is_active || false);
    }
  }, [yearToEdit, isEditMode]);

  const handleStartYearChange = (e) => {
    const value = parseInt(e.target.value);
    setStartYear(value);
    if (value && !isNaN(value)) {
      setEndYear(value + 1);
    }
  };

  const getTermType = (startYear) => {
    if (startYear > currentYear) return "future term";
    if (startYear < currentYear) return "past term";
    return "current term";
  };

  const handleSubmit = async () => {
    if (!startYear || !endYear) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const url = isEditMode 
        ? `${process.env.REACT_APP_API_URL}/admin/academic-years/${yearToEdit.year_id}`
        : `${process.env.REACT_APP_API_URL}/admin/academic-years`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          year_label: `${startYear}-${endYear}`,
          is_active: isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        if (isEditMode) {
          alert("Academic year updated successfully!");
        } else {
          const termType = getTermType(startYear);
          alert(isActive 
            ? "Academic year created and set as active!" 
            : `Academic year created as ${termType}.`
          );
        }
        onSuccess();
      } else {
        alert(data.message || (isEditMode ? "Failed to update academic year." : "Failed to create academic year."));
      }
    } catch (error) {
      console.error("Error submitting academic year:", error);
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
          <h3 className="modalTitle">{isEditMode ? "UPDATE ACADEMIC YEAR" : "ADD ACADEMIC YEAR"}</h3>
        </div>

        <div className="modalScrollArea">
          <div className="FormContent">
            <div className="formGroup">
              <label className="formLabel">START YEAR <span style={{color: 'red'}}>*</span></label>
              <input 
                type="number"
                className="formInput" 
                value={startYear}
                onChange={handleStartYearChange}
                min="2000"
                max="2100"
              />
            </div>

            <div className="formGroup">
              <label className="formLabel">END YEAR <span style={{color: 'red'}}>*</span></label>
              <input
                type="number"
                className="formInput" 
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value))}
                min={startYear + 1}
                max="2100"
              />
            </div>

            <div className="formGroup">
              <label className="formLabel">ACADEMIC YEAR STATUS <span style={{color: 'red'}}>*</span></label>
              <div className="statusToggleContainer" onClick={() => setIsActive(!isActive)}>
                <div className={`statusSwitch ${isActive ? 'active' : 'inactive'}`}>
                  <div className="switchHandle"></div>
                </div>
                <span className={`statusLabel ${isActive ? 'text-active' : 'text-inactive'}`}>
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              {isEditMode && isActive && (
                <small>Note: Setting this as active will deactivate other active academic years.</small>
              )}
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

  return ReactDOM.createPortal(modalContent, portalRoot);
}

export default AddYear;
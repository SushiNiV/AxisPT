import React, { useState } from "react";
import './AddModal.css';

function AddYear({ onClose, onSuccess }) { 
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear + 1);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartYearChange = (e) => {
    const value = e.target.value;
    setStartYear(value);
    if (value && value.length === 4) {
      setEndYear(parseInt(value) + 1);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/add-academic-year`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ startYear, endYear, isActive })
      });
      const result = await response.json();
      if (result.success) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sampleBG">
      <div className="createContainer" onClick={(e) => e.stopPropagation()}>
        <div className="closeBTArea">
          <button className="closeBt" onClick={onClose}>&times;</button>
        </div>
        
        <div className="createHeader">
          <h3>ADD ACADEMIC YEAR</h3>
        </div>

        <div className="formScrollArea">
          <div className="createFormContent">
            <div className="formGroup">
              <label>START YEAR <span style={{color: 'red'}}>*</span></label>
              <input 
                type="number"
                className="formInput" 
                value={startYear}
                onChange={handleStartYearChange}
              />
            </div>

            <div className="formGroup">
              <label>END YEAR <span style={{color: 'red'}}>*</span></label>
              <input
                type="number"
                className="formInput" 
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
              />
            </div>

            <div className="formGroup">
                <label>PROGRAM STATUS <span style={{color: 'red'}}>*</span></label>
                <div className="statusToggleContainer" onClick={() => setIsActive(!isActive)}>
                  <div className={`statusSwitch ${isActive ? 'active' : 'inactive'}`}>
                    <div className="switchHandle"></div>
                  </div>
                  <span className={`statusLabel ${isActive ? 'text-active' : 'text-inactive'}`}>
                    {isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>

            <div className="filterBtnsContainer">
              <button type="button" className="resetFilterBtn" onClick={onClose}>CANCEL</button>
              <button className="applyFilterBtn" onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? "CREATING..." : "CREATE YEAR"}
              </button>
            </div>  
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddYear;
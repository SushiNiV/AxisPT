import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import { BiChevronDown } from "react-icons/bi";
import '../../GlobalForm.css'
import '../../GlobalOverlay.css';
import '../../Global.css';

function AddProgram({ onClose, onSuccess, programToEdit = null }) {
  const [programName, setProgramName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [selectedYears, setSelectedYears] = useState([]);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalRoot, setPortalRoot] = useState(document.getElementById('portal-root') || document.body);
  
  const dropdownRef = useRef(null);
  const isEditMode = !!programToEdit;

  const options = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
  const yearOrder = {
    "1st Year": 1,
    "2nd Year": 2,
    "3rd Year": 3,
    "4th Year": 4,
    "5th Year": 5
  };

  useEffect(() => {
    if (programToEdit) {
      setProgramName(programToEdit.program_name || "");
      setAbbreviation(programToEdit.program_abbr || "");
      setDescription(programToEdit.program_description || "");
      setIsActive(programToEdit.program_status === true);
      
      const yearsArray = [];
      const totalYears = programToEdit.total_year || 0;
      for (let i = 1; i <= totalYears; i++) {
        yearsArray.push(`${i}${getYearSuffix(i)} Year`);
      }
      setSelectedYears(yearsArray);
    }
  }, [programToEdit]);

  const getYearSuffix = (year) => {
    if (year === 1) return "st";
    if (year === 2) return "nd";
    if (year === 3) return "rd";
    return "th";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleYearClick = (clickedYear) => {
    const clickedYearNum = yearOrder[clickedYear];
    
    if (selectedYears.includes(clickedYear)) {
      setSelectedYears(prev => prev.filter(y => y !== clickedYear));
      return;
    }
    
    const yearsToSelect = [];
    for (let i = 1; i <= clickedYearNum; i++) {
      yearsToSelect.push(options[i - 1]);
    }
    
    const allSelected = yearsToSelect.every(year => selectedYears.includes(year));
    
    if (allSelected) {
      setSelectedYears(prev => [...prev, clickedYear]);
    } else {
      setSelectedYears(yearsToSelect);
    }
  };

  const handleSubmit = async () => {
    if (!programName || !abbreviation || selectedYears.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const url = isEditMode 
        ? `${process.env.REACT_APP_API_URL}/admin/programs/${programToEdit.program_id}`
        : `${process.env.REACT_APP_API_URL}/admin/programs`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          program_name: programName,
          program_abbr: abbreviation,
          total_year: selectedYears.length,
          program_description: description,
          program_status: isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(isEditMode ? "Program updated successfully!" : "Program created successfully!");
        onSuccess();
      } else {
        alert(data.message || (isEditMode ? "Failed to update program." : "Failed to create program."));
      }
    } catch (error) {
      console.error("Error submitting program:", error);
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
          <h3 className="modalTitle">{isEditMode ? "UPDATE PROGRAM" : "ADD NEW PROGRAM"}</h3>
        </div>

        <div className="modalScrollArea">
          <div className="FormContent">
            <div className="formGroup">
              <label className="formLabel">PROGRAM NAME <span style={{color: 'red'}}>*</span></label>
              <input 
                type="text" 
                placeholder="Physical Therapy" 
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
            </div>

            <div className="formGroup">
              <label className="formLabel">PROGRAM ABBREVIATION <span style={{color: 'red'}}>*</span></label>
              <input 
                type="text" 
                placeholder="BSPT" 
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
              />
            </div>

            <div className="formGroup">
              <label className="formLabel">TOTAL YEAR <span style={{color: 'red'}}>*</span></label>
              <div className="custom-multiselect" ref={dropdownRef}>
                <div 
                  className={`select-display`} 
                  onClick={() => setIsOpen(!isOpen)}
                  tabIndex="0"
                >
                  <span className="selected-text">
                    {selectedYears.length > 0 
                      ? selectedYears.join(", ") 
                      : "Select Year Levels"}
                  </span>
                </div>

                {isOpen && (
                  <div className="dropdown-menu">
                    {options.map(year => (
                      <label key={year} className="dropdown-item">
                        <input 
                          type="checkbox" 
                          checked={selectedYears.includes(year)}
                          onChange={() => handleYearClick(year)}
                        />
                        <span>{year}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="formGroup">
              <label className="formLabel">PROGRAM DESCRIPTION</label>
              <textarea 
                rows="4" 
                placeholder="Enter program description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="formGroup">
              <label className="formLabel">PROGRAM STATUS <span style={{color: 'red'}}>*</span></label>
              <div className="statusToggleContainer" onClick={() => setIsActive(!isActive)}>
                <div className={`statusSwitch ${isActive ? 'active' : 'inactive'}`}>
                  <div className="switchHandle"></div>
                </div>
                <span className={`statusLabel ${isActive ? 'text-active' : 'text-inactive'}`}>
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>

            <div className="FilterBtnsContainer">
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

export default AddProgram;
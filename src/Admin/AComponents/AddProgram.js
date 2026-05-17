  import React, { useState } from "react";
  import './AddModal.css';
  import { BiChevronDown } from 'react-icons/bi';

  function AddProgram({ onClose, onSuccess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedYears, setSelectedYears] = useState([]);
    const [isActive, setIsActive] = useState(true);
    
    const [programName, setProgramName] = useState("");
    const [abbreviation, setAbbreviation] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [errors, setErrors] = useState({});

    const options = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

    const toggleYear = (year) => {
      const selectedIndex = options.indexOf(year);
      const currentMaxIndex = Math.max(...selectedYears.map(y => options.indexOf(y)), -1);

      setSelectedYears(prev => {
        if (selectedIndex === currentMaxIndex) {
          return options.slice(0, selectedIndex);
        }
        return options.slice(0, selectedIndex + 1);
      });
    };

    const handleCreate = async () => {
      if (!programName || !abbreviation || selectedYears.length === 0) {
        alert("Please fill in all required fields.");
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/add-program`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            name: programName,
            abbreviation: abbreviation,
            total_years: selectedYears.length,
            description: description,
            status: isActive
          })
        });

        const data = await response.json();

        if (data.success) {
          alert("Program created successfully!");
          onSuccess();
        } else {
          alert(data.message || "Failed to create program.");
        }
      } catch (error) {
        console.error("Error creating program:", error);
        alert("An error occurred. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="modalOverlay">
        <div className="createContainer">
          <div className="createHeader">
            <h3>ADD PROGRAM</h3>
            <button className="closeBt" onClick={onClose} disabled={isSubmitting}>&times;</button>
          </div>

          <div className="formScrollArea">
            <div className="createFormContent">
              
              <div className="formGroup">
                <label>PROGRAM NAME <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Bachelor of Science in Physical Therapy" 
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label>PROGRAM ABBREVIATION <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. BSPT" 
                  value={abbreviation}
                  onChange={(e) => setAbbreviation(e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label>TOTAL YEAR <span style={{color: 'red'}}>*</span></label>
                <div className="custom-multiselect">
              <div 
                className={`select-display ${errors?.years ? "input-error" : ""}`} 
                onClick={() => setIsOpen(!isOpen)}
                tabIndex="0"
              >
                <span className="selected-text">
                  {selectedYears.length > 0 
                    ? selectedYears.join(", ") 
                    : "Select options"}
                </span>
              </div>

              {isOpen && (
                <div className="dropdown-menu">
                  {options.map(year => (
                    <label key={year} className="dropdown-item">
                      <input 
                        type="checkbox" 
                        checked={selectedYears.includes(year)}
                        onChange={() => toggleYear(year)}
                      />
                      <span>{year}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
              </div>

              <div className="formGroup">
                <label>PROGRAM DESCRIPTION</label>
                <textarea 
                  rows="4" 
                  placeholder="Enter curriculum details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
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
                <button 
                  className="resetFilterBtn" 
                  onClick={onClose} 
                  disabled={isSubmitting}
                >
                  CANCEL
                </button>
                <button 
                  className="applyFilterBtn" 
                  onClick={handleCreate} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "CREATING..." : "CREATE PROGRAM"}
                </button>
              </div>  

            </div>
          </div>
        </div>
      </div>
    );
  }

  export default AddProgram;
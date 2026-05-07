import React, { useState } from "react";
import './Sample.css';
import { BiChevronDown } from 'react-icons/bi';

function Sample() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYears, setSelectedYears] = useState([]);
  const [isActive, setIsActive] = useState(true);

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

  return (
    <div className="sampleBG">
      <div className="createContainer">
        <div className="closeBTArea">
          <button className="closeBt">&times;</button>
        </div>
        
        <div className="createHeader">
          <h3>ADD SECTION</h3>
        </div>

        <div className="formScrollArea">
          <div className="createFormContent">
            
            <div className="formGroup">
              <label>PROGRAM <span style={{color: 'red'}}>*</span></label>
              <input type="text" placeholder="e.g. BSPT" />
            </div>

            <div className="formGroup">
              <label>YEAR LEVEL <span style={{color: 'red'}}>*</span></label>
              <input type="text" placeholder="e.g. BSPT" />
            </div>

            <div className="formGroup">
              <label>SEMESTER <span style={{color: 'red'}}>*</span></label>
              <input type="text" placeholder="e.g. BSPT" />
            </div>

            <div className="formGroup">
              <label>ACADEMIC YEAR <span style={{color: 'red'}}>*</span></label>
              <input type="text" placeholder="e.g. BSPT" />
            </div>

            <div className="formGroup">
              <label>TOTAL YEAR <span style={{color: 'red'}}>*</span></label>
              <div className="custom-multiselect">
                <div className="select-display" onClick={() => setIsOpen(!isOpen)} tabIndex="0">
                  <span className="selected-text">
                    {selectedYears.length > 0 ? selectedYears.join(", ") : "Select options"}
                  </span>
                  <BiChevronDown className={`arrow ${isOpen ? 'open' : ''}`} />
                </div>
                
                {isOpen && (
                  <div className="dropdownMenu">
                    {options.map(year => (
                      <label key={year} className="dropdownItem">
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

            <div className="filterBtnsContainer">
              <button className="resetFilterBtn">CANCEL</button>
              <button className="applyFilterBtn">CREATE PROGRAM</button>
            </div>  

          </div>
        </div>
      </div>
    </div>
  );
}

export default Sample;
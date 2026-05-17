import React, { useState } from "react";
import './Sample.css';
import { BiChevronDown } from 'react-icons/bi';

function AddCourse() {
  const [checkedItems, setCheckedItems] = useState({});

  const handleCheck = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderYear = (programId, yearNum) => {
    const yearId = `${programId}_Y${yearNum}`;
    const labels = ["1ST", "2ND", "3RD", "4TH", "5TH"];
    
    return (
      <div key={yearId}>
        <span className="rowItem">
          <input 
            type="checkbox" 
            id={yearId}
            checked={!!checkedItems[yearId]} 
            onChange={() => handleCheck(yearId)} 
          />
          <label htmlFor={yearId} className="assignmentLabel">{labels[yearNum - 1]} YEAR</label>
        </span>
        
        {checkedItems[yearId] && (
          <div className="subTier">
            {["1ST SEMESTER", "2ND SEMESTER", "SUMMER TERM"].map((sem, idx) => {
              const semId = `${yearId}_S${idx}`;
              return (
                <span className="rowItem last" key={semId}>
                  <input type="checkbox" id={semId} />
                  <label htmlFor={semId} className="assignmentLabel">{sem}</label>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sampleBG">
      <div className="createContainer">
        <div className="closeBTArea">
          <button className="closeBt">&times;</button>
        </div>
        
        <div className="createHeader">
          <h3>ADD NEW COURSE</h3>
        </div>

        <div className="formScrollArea">
          <div className="createFormContent">
            <div className="formGroup">
              <label>COURSE CODE</label>
              <input type="text" placeholder="E.G. IT101" />
            </div>

            <div className="formGroup">
              <label>COURSE NAME</label>
              <input type="text" placeholder="E.G. INTRODUCTION TO COMPUTING" />
            </div>

            <div className="formRow">
              <div className="formGroup">
                <label>LEC UNITS</label>
                <input type="number" placeholder="0" />
              </div>
              <div className="formGroup">
                <label>LAB UNITS</label>
                <input type="number" placeholder="0" />
              </div>
              <div className="formGroup">
                <label>TOTAL UNITS</label>
                <input type="number" disabled className="readOnlyInput" placeholder="0" />
              </div>
            </div>

            <div className="formGroupProgYear">
              <label className="mainlabel">PROGRAM AND YEAR ASSIGNMENT</label>
              <div className="assignmentBox">
                
                {/* --- PHYSICAL THERAPY --- */}
                <div className="nestedItem">
                  <span className="rowItem">
                    <input 
                      type="checkbox" 
                      id="PT"
                      checked={!!checkedItems['PT']} 
                      onChange={() => handleCheck('PT')} 
                    />
                    <label htmlFor="PT" className="assignmentLabel">PHYSICAL THERAPY</label>
                  </span>
                  
                  {checkedItems['PT'] && (
                    <div className="subTier">
                      {[1, 2, 3, 4].map(year => renderYear('PT', year))}
                    </div>
                  )}
                </div>

                {/* --- RADIOLOGY THERAPY --- */}
                <div className="nestedItem">
                  <span className="rowItem">
                    <input 
                      type="checkbox" 
                      id="RAD"
                      checked={!!checkedItems['RAD']} 
                      onChange={() => handleCheck('RAD')} 
                    />
                    <label htmlFor="RAD" className="assignmentLabel">RADIOLOGY THERAPY</label>
                  </span>
                  {checkedItems['RAD'] && (
                    <div className="subTier">
                      {[1, 2, 3, 4].map(year => renderYear('RAD', year))}
                    </div>
                  )}
                </div>

                {/* --- RESPIRATORY THERAPY --- */}
                <div className="nestedItem">
                  <span className="rowItem">
                    <input 
                      type="checkbox" 
                      id="RESP"
                      checked={!!checkedItems['RESP']} 
                      onChange={() => handleCheck('RESP')} 
                    />
                    <label htmlFor="RESP" className="assignmentLabel">RESPIRATORY THERAPY</label>
                  </span>
                  {checkedItems['RESP'] && (
                    <div className="subTier">
                      {[1, 2, 3, 4].map(year => renderYear('RESP', year))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="formGroup">
              <label>PREREQUISITES</label>
              <div className="customSelectTrigger">
                <div className="selectedTextDisplay">SELECT PREREQUISITES</div>
                <BiChevronDown className="arrowIcon" />
              </div>
            </div>

            <div className="formGroup">
              <label>COURSE DESCRIPTION</label>
              <textarea rows="4" placeholder="ENTER COURSE DESCRIPTION..."></textarea>
            </div>

            <div className="filterBtnsContainer">
              <button className="resetFilterBtn">CANCEL</button>
              <button className="applyFilterBtn">CREATE COURSE</button>
            </div>  

          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCourse;
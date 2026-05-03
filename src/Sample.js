import React, { useState } from "react";
import './Sample.css';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';

function Sample() {
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
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

            <div className="formGroup">
            <label>PROGRAM AND YEAR ASSIGNMENT</label>
            <div className="assignmentBox">
              
              <div className="nestedItem">
                <span className="rowItem">
                  <input type="checkbox" />
                  <span>PHYSICAL THERAPY</span>
                </span>
                
                <div className="subTier">
                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>1ST YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>2ND YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>3RD YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>4TH YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>5TH YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="nestedItem">
                <span className="rowItem">
                  <input type="checkbox" />
                  <span>RADIOLOGY THERAPY</span>
                </span>
                
                <div className="subTier">
                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>1ST YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>2ND YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>3RD YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>4TH YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>5TH YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="nestedItem">
                <span className="rowItem">
                  <input type="checkbox" />
                  <span>RESPIRATORY THERAPY</span>
                </span>
                
                <div className="subTier">
                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>1ST YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>2ND YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>3RD YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>4TH YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>

                  <span className="rowItem">
                    <input type="checkbox" />
                    <span>5TH YEAR</span>
                  </span>
                  <div className="subTier">
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>1ST SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>2ND SEMESTER</span>
                    </span>
                    <span className="rowItem last">
                      <input type="checkbox" />
                      <span>SUMMER TERM</span>
                    </span>
                  </div>
                </div>
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

export default Sample;
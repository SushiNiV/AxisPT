import React from 'react';
import './Education.css';

const Education = ({ formData, handleChange }) => {
  return (
    <div className="slides">
              <h1 className="enrollmentTitle">Education and Program</h1>

              <h2 className="enrollmentSubtitle">Current Program</h2>
              <div className="row">
                <div className="col">
                  <label>Program <span style={{color: 'red'}}>*</span></label>
                  <select 
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select Program</option>
                    <option value="PHYSICAL THERAPHY">PHYSICAL THERAPY</option>
                    <option value="RADIOLOGIC THERAPHY">RADIOLOGIC THERAPY</option>
                    <option value="RESPIRATORY THERAPHY">RESPIRATORY THERAPY</option>
                  </select>
                </div>
                <div className="col">
                  <label>Year Level <span style={{color: 'red'}}>*</span></label>
                  <select 
                    name="yearLevel"
                    value={formData.yearLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select Year Level</option>
                    <option value="1ST YEAR">1ST YEAR</option>
                    <option value="2ND YEAR">2ND YEAR</option>
                    <option value="3RD YEAR">3RD YEAR</option>
                    <option value="4TH YEAR">4TH YEAR</option>
                  </select>
                </div>
                <div className="col">
                  <label>Classification <span style={{color: 'red'}}>*</span></label>
                  <select 
                    name="classification"
                    value={formData.classification}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select Classification</option>
                    <option value="NEW">NEW</option>
                    <option value="CONTINUING">CONTINUING</option>
                    <option value="RETURNEE">RETURNEE</option>
                    <option value="SHIFTEE">SHIFTEE</option>
                    <option value="TRANSFEREE">TRANSFEREE</option>
                    <option value="CROSS-ENROLLEE">CROSS-ENROLLEE</option>
                    <option value="SECOND COURSER">SECOND COURSER</option>
                  </select>
                </div>
              </div>

              <h2 className="enrollmentSubtitle">Last School Attended</h2>
              <div className="row">
                <div className="col">
                  <label>High School Graduated <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    name="highschoolGraduated"
                    placeholder="High School Graduated" 
                    value={formData.highschoolGraduated}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col">
                  <label>Public or Private <span style={{color: 'red'}}>*</span></label>
                  <select 
                    name="pubprivHS"
                    value={formData.pubprivHS}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select</option>
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <label>School Address <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    name="schoolAddress"
                    placeholder="School Address" 
                    value={formData.schoolAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <label>Fourth Year High School Final General Average <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="number" 
                    name="hsFinalGWA"
                    placeholder="Fourth Year High School Final General Average" 
                    value={formData.hsFinalGWA}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

            </div>
  );
};

export default Education;
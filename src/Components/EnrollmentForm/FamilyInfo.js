import React from 'react';
import './FamilyInfo.css';

const FamilyInfo = ({ formData, handleChange }) => {
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
            required
          />
        </div>
        <div className="col">
          <label>Last Name <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="fatherLastName" 
              placeholder="Father's Last Name" 
              value={formData.fatherLastName}
              onChange={handleChange}
              required
            />
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
          <label>Status <span style={{color: 'red'}}>*</span></label>
          <select 
            name="fatherStatus"
            value={formData.fatherStatus}
            onChange={handleChange}
            required
          >
            <option value="">Select Status</option>
            <option value="LIVING">LIVING</option>
            <option value="DECEASED">DECEASED</option>
          </select>
        </div>
        <div className="col">
          <label>Occupation <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="fatherOccupation"
            placeholder="Father's Occupation" 
            value={formData.fatherOccupation}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Contact Number <span style={{color: 'red'}}>*</span></label>
          <input 
            type="tel" 
            name="fatherContactNumber"
            placeholder="Father's Contact Number" 
            value={formData.fatherContactNumber}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <h2 className="enrollmentSubtitle">Mother's Information</h2>
      <div className="row">
        <div className="col">
          <label>First Name <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="fatherFirstName"
            placeholder="Mother's First Name" 
            value={formData.mother}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Last Name <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="motherLastName" 
              placeholder="Mother's Last Name" 
              value={formData.motherLastName}
              onChange={handleChange}
              required
            />
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
          <label>Status <span style={{color: 'red'}}>*</span></label>
          <select 
            name="motherStatus"
            value={formData.motherStatus}
            onChange={handleChange}
            required
          >
            <option value="">Select Status</option>
            <option value="LIVING">LIVING</option>
            <option value="DECEASED">DECEASED</option>
          </select>
        </div>
        <div className="col">
          <label>Occupation <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="motherOccupation"
            placeholder="Mother's Occupation" 
            value={formData.motherOccupation}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Contact Number <span style={{color: 'red'}}>*</span></label>
          <input 
            type="tel" 
            name="motherContactNumber"
            placeholder="Mother's Contact Number" 
            value={formData.motherContactNumber}
            onChange={handleChange}
            required
          />
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
          <select 
            name="support"
            value={formData.support}
            onChange={handleChange}
          >
            <option value="">Select an option</option>
            <option value="PARENTS">PARENTS</option>
            <option value="RELATIVES">RELATIVES</option>
            <option value="BROTHER/SISTER">BROTHER/SISTER</option>
            <option value="BENEFACTORS">BENEFACTORS</option>
            <option value="SCHOLARSHIPS">SCHOLARSHIPS</option>
          </select>
        </div>
        <div className="col">
          <label>Parent's Joint Monthly Income <span style={{color: 'red'}}>*</span></label>
          <select 
            name="parentsIncome"
            value={formData.parentsIncome}
            onChange={handleChange}
          >
            <option value="">Select an option</option>
            <option value="BELOW P20K">BELOW P20K</option>
            <option value="P21K TO P40K">P21K TO P40K</option>
            <option value="P41K TO P80K">P41K TO P80K</option>
            <option value="ABOVE P80K">ABOVE P80K</option>
          </select>
        </div>
      </div>    

      <div className="row">
        <div className="col">
          <label>While studying in OLFU will you live in? <span style={{color: 'red'}}>*</span></label>
          <select 
            name="livingArrangement"
            value={formData.livingArrangement}
            onChange={handleChange}
          >
            <option value="">Select an option</option>
            <option value="DORM/BOARDING HOUSE">DORM/BOARDING HOUSE</option>
            <option value="PARENT'S HOUSE">PARENT'S HOUSE</option>
            <option value="RELATIVE'S HOUSE">RELATIVE'S HOUSE</option>
          </select>
        </div>
        <div className="col">
          <label>Daily Transportation Expense <span style={{color: 'red'}}>*</span></label>
          <select 
            name="transportExpense"
            value={formData.transportExpense}
            onChange={handleChange}
          >
            <option value="">Select an option</option>
            <option value="&lt; P50">&lt; P50</option>
            <option value="BETWEEN P51-P100">BETWEEN P51-P100</option>
            <option value="&gt; P100">&gt; P100</option>
          </select>
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
          >
          </input>
        </div>
        <div className="col">
          <label>Ordinal Position <span style={{color: 'red'}}>*</span></label>
          <select 
            name="ordinalPosition"
            value={formData.ordinalPosition}
            onChange={handleChange}
          >
            <option value="">Select an option</option>
            <option value="ONLY CHILD">ONLY CHILD</option>
            <option value="ELDEST CHILD">ELDEST CHILD</option>
            <option value="MIDDLE CHILD">MIDDLE CHILD</option>
            <option value="YOUNGEST CHILD">YOUNGEST CHILD</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FamilyInfo;
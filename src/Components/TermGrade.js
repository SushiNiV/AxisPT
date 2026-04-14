import React from 'react';
import './TermGrade.css';

const StudentForm = ({ data }) => {
  return (
    <div className="term-container">
      {/* Personal Information */}
      <div className="term-title">Student Term Grade Records</div>

      {/* FULL NAME */}
      <div className="grid-row four-cols border">
        <div className="label-group">
          <span className="field-label">Name</span>
        </div>
        <div className="input-group">
          <div className="value-field">{data?.name}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Student No.</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{data?.studentNumber}</div>
        </div>
      </div>
      <div className="grid-row four-cols" border-bottom>
        <div className="label-group">
          <span className="field-label">Year Level & Section</span>
        </div>
        <div className="input-group">
          <div className="value-field">{data?.name}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Semester</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{data?.studentNumber}</div>
        </div>
      </div>
      <div>
      </div>
      <div className="grid-row four-cols" border-bottom>
        <div className="label-group">
          <span className="field-label">Year Level & Section</span>
        </div>
        <div className="input-group">
          <div className="value-field">{data?.name}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Semester</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{data?.studentNumber}</div>
        </div>
      </div>
    </div>
    
  );
};

export default StudentForm;
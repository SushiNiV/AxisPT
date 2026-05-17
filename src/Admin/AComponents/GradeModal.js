import React, { useState } from 'react';
import { BiX, BiPrinter } from 'react-icons/bi';
import './GradeModal.css';

function GradeModal({ student, onClose }) {
  const [activeYear, setActiveYear] = useState(1);

  // Sample static data for UI building
  const sampleGrades = [
    { code: 'ANAT 101', name: 'Human Anatomy & Physiology', units: 5, prelim: '1.25', midterm: '1.50', finals: '1.25', total: '1.33', remarks: 'PASSED' },
    { code: 'CHEM 102', name: 'General Chemistry', units: 3, prelim: '2.00', midterm: '2.25', finals: '1.75', total: '2.00', remarks: 'PASSED' },
    { code: 'PT 101', name: 'Intro to Physical Therapy', units: 2, prelim: '1.00', midterm: '1.25', finals: '1.00', total: '1.08', remarks: 'PASSED' },
  ];

  return (
    <div className="modalOverlay">
      <div className="gradeModalContainer">
        {/* Header Section */}
        <div className="gradeModalHeader">
          <div className="studentInfo">
            <h2>{student.name}</h2>
            <p>{student.student_id} | {student.program || 'BS PHYSICAL THERAPY'}</p>
          </div>
          <div className="modalActions">
            <button className="closeModalBtn" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* Year Navigation */}
        <div className="yearTabContainer">
          {[1, 2, 3, 4].map(year => (
            <button 
              key={year} 
              className={`yearTab ${activeYear === year ? 'active' : ''}`}
              onClick={() => setActiveYear(year)}
            >
              {year}{year === 1 ? 'ST' : year === 2 ? 'ND' : year === 3 ? 'RD' : 'TH'} YEAR
            </button>
          ))}
        </div>

        <div className="gradeContentArea">
          <div className="semesterSection">
            <h3>FIRST SEMESTER</h3>
            <table className="gradeMatrix">
              <thead>
                <tr>
                  <th>COURSE CODE</th>
                  <th>COURSE NAME</th>
                  <th>UNITS</th>
                  <th>PRELIM</th>
                  <th>MIDTERM</th>
                  <th>FINALS</th>
                  <th>GWA</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {sampleGrades.map((grade, idx) => (
                  <tr key={idx}>
                    <td>{grade.code}</td>
                    <td>{grade.name}</td>
                    <td>{grade.units}</td>
                    <td>{grade.prelim}</td>
                    <td>{grade.midterm}</td>
                    <td>{grade.finals}</td>
                    <td className="finalGrade">{grade.total}</td>
                    <td className={grade.remarks === 'PASSED' ? 'pass' : 'fail'}>
                      {grade.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Second Semester Placeholder */}
          <div className="semesterSection">
            <h3>SECOND SEMESTER</h3>
            <p className="noDataNotice">Select subjects to display grades.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradeModal;
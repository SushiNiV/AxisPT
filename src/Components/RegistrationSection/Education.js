import React, { useState, useEffect } from 'react';
import './Education.css';

const Education = ({ formData, handleChange, errors }) => {
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progRes, acadRes, sectRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/public/programs`),
          fetch(`${process.env.REACT_APP_API_URL}/admin/public/academic-years`),
          fetch(`${process.env.REACT_APP_API_URL}/admin/public/sections`)
        ]);

        const progData = await progRes.json();
        const acadData = await acadRes.json();
        const sectData = await sectRes.json();

        if (progData.success) setPrograms(progData.data);
        if (acadData.success) setAcademicYears(acadData.data);
        if (sectData.success) setSections(sectData.data);
      } catch (error) {
        console.error("Error fetching education data:", error);
      }
    };
    fetchData();
  }, []);

  // Filter sections based on selected program
  const filteredSections = sections.filter(s => {
    if (!formData.program) return false;
    const prog = programs.find(p => p.program_name === formData.program || p.program_abbr === formData.program);
    return s.program_name === prog?.program_abbr;
  });

  return (
    <div className="slides">
      <h1 className="enrollmentTitle">Education and Program</h1>
      <h2 className="enrollmentSubtitle">Current Program</h2>

      <div className="row">
        <div className="col">
          <label>Fatima Email <span style={{color: 'red'}}>*</span></label>
          <input 
            type="email" 
            name="fatimaEmail"
            placeholder=".student.fatima.edu.ph" 
            value={formData.fatimaEmail}
            onChange={handleChange}
            className={errors.fatimaEmail ? "input-error" : ""}
            required
          />
          {errors.fatimaEmail && <span className="error-text">{errors.fatimaEmail}</span>}
        </div>
        <div className="col">
          <label>Student ID <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="studentID"
            placeholder="Enter Student ID" 
            value={formData.studentID}
            onChange={handleChange}
            className={errors.studentID ? "input-error" : ""}
            required
          />
          {errors.studentID && <span className="error-text">{errors.studentID}</span>}
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Program <span style={{color: 'red'}}>*</span></label>
          <select 
            name="program"
            value={formData.program}
            onChange={handleChange}
            className={errors.program ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select Program</option>
            {programs.map(p => (
              <option key={p.program_id} value={p.program_name}>
                {p.program_abbr} - {p.program_name}
              </option>
            ))}
          </select>
          {errors.program && <span className="error-text">{errors.program}</span>}
        </div>
        <div className="col">
          <label>Classification <span style={{color: 'red'}}>*</span></label>
          <select 
            name="classification"
            value={formData.classification}
            onChange={handleChange}
            className={errors.classification ? "input-error" : ""}
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
          {errors.classification && <span className="error-text">{errors.classification}</span>}
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Year Level <span style={{color: 'red'}}>*</span></label>
          <select 
            name="yearLevel"
            value={formData.yearLevel}
            onChange={handleChange}
            className={errors.yearLevel ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select Year Level</option>
            <option value="1ST YEAR">1ST YEAR</option>
            <option value="2ND YEAR">2ND YEAR</option>
            <option value="3RD YEAR">3RD YEAR</option>
            <option value="4TH YEAR">4TH YEAR</option>
          </select>
          {errors.yearLevel && <span className="error-text">{errors.yearLevel}</span>}
        </div>
        <div className="col">
          <label>Section <span style={{color: 'red'}}>*</span></label>
          <select 
            name="section"
            value={formData.section}
            onChange={handleChange}
            className={errors.section ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select Section</option>
            {filteredSections.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
          {errors.section && <span className="error-text">{errors.section}</span>}
        </div>
        <div className="col">
          <label>Academic Year <span style={{color: 'red'}}>*</span></label>
          <select 
            name="acadYear"
            value={formData.acadYear}
            onChange={handleChange}
            className={errors.acadYear ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select Academic Year</option>
            {academicYears.map(y => (
              <option key={y.year_id} value={y.year_label}>{y.year_label}</option>
            ))}
          </select>
          {errors.acadYear && <span className="error-text">{errors.acadYear}</span>}
        </div>
        <div className="col">
          <label>Semester <span style={{color: 'red'}}>*</span></label>
          <select 
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className={errors.semester ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select Current Semester</option>
            <option value="1ST SEMESTER">1ST SEMESTER</option>
            <option value="2ND SEMESTER">2ND SEMESTER</option>
          </select>
          {errors.semester && <span className="error-text">{errors.semester}</span>}
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
            className={errors.highschoolGraduated ? "input-error" : ""}
            required
          />
          {errors.highschoolGraduated && <span className="error-text">{errors.highschoolGraduated}</span>}
        </div>
        <div className="col">
          <label>Public or Private <span style={{color: 'red'}}>*</span></label>
          <select 
            name="pubprivHS"
            value={formData.pubprivHS}
            onChange={handleChange}
            className={errors.pubprivHS ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
          {errors.pubprivHS && <span className="error-text">{errors.pubprivHS}</span>}
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
            className={errors.schoolAddress ? "input-error" : ""}
            required
          />
          {errors.schoolAddress && <span className="error-text">{errors.schoolAddress}</span>}
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
            className={errors.hsFinalGWA ? "input-error" : ""}
            required
          />
          {errors.hsFinalGWA && <span className="error-text">{errors.hsFinalGWA}</span>}
        </div>
      </div>

    </div>
  );
};

export default Education;
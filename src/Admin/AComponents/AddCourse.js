import React, { useState, useEffect } from "react";
import { BiChevronDown } from 'react-icons/bi';

function AddCourse({ onClose, onSuccess }) {
  // Form state
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    lec_units: 0,
    lab_units: 0,
    total_units: 0,
    course_desc: "",
    prerequisites: ""
  });

  // Assignment state
  const [checkedItems, setCheckedItems] = useState({});
  const [programs, setPrograms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch programs on load
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setPrograms(data.data);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    fetchPrograms();
  }, []);

  // Update total units when lec or lab changes
  const lecUnits = parseInt(formData.lec_units) || 0;
  const labUnits = parseInt(formData.lab_units) || 0;
  const totalUnits = lecUnits + labUnits;

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox toggle
  const handleCheck = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Build assignments array from checked items
  const buildAssignments = () => {
    const assignments = [];

    programs.forEach(program => {
      const progPrefix = program.program_abbr; // e.g., "BSPT", "BSRT", "BSRT"

      for (let year = 1; year <= 5; year++) {
        const yearId = `${progPrefix}_Y${year}`;

        if (checkedItems[yearId]) {
          // Check which semesters are selected for this year
          const semesters = ["1ST SEMESTER", "2ND SEMESTER", "SUMMER TERM"];
          const semMap = { "1ST SEMESTER": 1, "2ND SEMESTER": 2, "SUMMER TERM": 3 };

          // If no semester checkbox exists, default to all semesters
          // Find checked semesters
          const checkedSemesters = semesters.filter((sem, idx) => {
            const semId = `${yearId}_S${idx}`;
            return checkedItems[semId];
          });

          if (checkedSemesters.length > 0) {
            checkedSemesters.forEach(sem => {
              assignments.push({
                program_id: program.program_id,
                year_level: year,
                semester: sem,
                semester_id: semMap[sem]
              });
            });
          }
        }
      }
    });

    return assignments;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const { course_code, course_name, course_desc, prerequisites } = formData;

    if (!course_code || !course_name || !lecUnits) {
      alert("Please fill in Course Code, Course Name, and Lec Units.");
      return;
    }

    const assignments = buildAssignments();
    if (assignments.length === 0) {
      alert("Please select at least one Program, Year, and Semester assignment.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/add-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          course_code: course_code.toUpperCase(),
          course_name: course_name.toUpperCase(),
          lec_units: lecUnits,
          lab_units: labUnits,  
          course_desc: course_desc,
          prerequisites: prerequisites,
          assignments: assignments
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("Course created successfully!");
        onSuccess();
      } else {
        alert(data.message || "Failed to create course.");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render year and semester checkboxes for a program
  const renderYear = (programAbbr, yearNum) => {
    const yearId = `${programAbbr}_Y${yearNum}`;
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
                  <input
                    type="checkbox"
                    id={semId}
                    checked={!!checkedItems[semId]}
                    onChange={() => handleCheck(semId)}
                  />
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
    <div className="modalOverlay">
      <div className="createContainer">
        <div className="createHeader">
          <h3>ADD NEW COURSE</h3>
          <button className="closeBt" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>

        <div className="formScrollArea">
          <div className="createFormContent">

            {/* COURSE CODE */}
            <div className="formGroup">
              <label>COURSE CODE <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                name="course_code"
                placeholder="E.G. FOHP111"
                value={formData.course_code}
                onChange={handleChange}
              />
            </div>

            {/* COURSE NAME */}
            <div className="formGroup">
              <label>COURSE NAME <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                name="course_name"
                placeholder="e.g FOHA111"
                value={formData.course_name}
                onChange={handleChange}
              />
            </div>

            {/* UNITS */}
            <div className="formRow">
              <div className="formGroup">
                <label>LEC UNITS <span style={{color: 'red'}}>*</span></label>
                <input
                  type="number"
                  name="lec_units"
                  value={formData.lec_units}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="formGroup">
                <label>LAB UNITS</label>
                <input
                  type="number"
                  name="lab_units"
                  value={formData.lab_units}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="formGroup">
                <label>TOTAL UNITS</label>
                <input
                  type="number"
                  disabled
                  className="readOnlyInput"
                  value={totalUnits}
                />
              </div>
            </div>

            {/* PROGRAM AND YEAR ASSIGNMENT */}
            <div className="formGroupProgYear">
              <label className="mainlabel">PROGRAM AND YEAR ASSIGNMENT <span style={{color: 'red'}}>*</span></label>
              <div className="assignmentBox">
                {programs.map(program => (
                  <div className="nestedItem" key={program.program_id}>
                    <span className="rowItem">
                      <input
                        type="checkbox"
                        id={program.program_abbr}
                        checked={!!checkedItems[program.program_abbr]}
                        onChange={() => handleCheck(program.program_abbr)}
                      />
                      <label htmlFor={program.program_abbr} className="assignmentLabel">
                        {program.program_name?.toUpperCase() || program.program_abbr}
                      </label>
                    </span>

                    {checkedItems[program.program_abbr] && (
                      <div className="subTier">
                        {[1, 2, 3, 4].map(year => renderYear(program.program_abbr, year))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PREREQUISITES */}
            <div className="formGroup">
              <label>PREREQUISITES</label>
              <input
                type="text"
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleChange}
              />
            </div>

            {/* COURSE DESCRIPTION */}
            <div className="formGroup">
              <label>COURSE DESCRIPTION</label>
              <textarea
                name="course_desc"
                rows="4"
                placeholder="Enter Course Description..."
                value={formData.course_desc}
                onChange={handleChange}
              ></textarea>
            </div>

            {/* BUTTONS */}
            <div className="filterBtnsContainer">
              <button className="resetFilterBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
              <button className="applyFilterBtn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "CREATING..." : "CREATE COURSE"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCourse;
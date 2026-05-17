import React, { useState, useEffect } from "react";
import './AddModal.css'; 

function AddSection({ onClose, onSuccess }) {
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    section_name: "",
    program_id: "",
    year_level: "",
    semester_id: "",
    year_id: "",
    is_active: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const yearOptions = [
    { label: "1st Year", value: 1 },
    { label: "2nd Year", value: 2 },
    { label: "3rd Year", value: 3 },
    { label: "4th Year", value: 4 },
    { label: "5th Year", value: 5 }
  ];

  const semesterOptions = [
    { label: "1st Semester", value: 1 },
    { label: "2nd Semester", value: 2 },
    { label: "Summer", value: 3 }
  ];

  // Fetch Programs and Academic Years on load
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [progRes, acadRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years`, { headers })
        ]);

        const progData = await progRes.json();
        const acadData = await acadRes.json();

        if (progData.success) setPrograms(progData.data);
        if (acadData.success) setAcademicYears(acadData.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleCreate = async () => {
    const { section_name, program_id, year_level, semester_id, year_id } = formData;
    
    if (!section_name || !program_id || !year_level || !semester_id || !year_id) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/add-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert("Section created successfully!");
        onSuccess();
      } else {
        alert(data.message || "Failed to create section.");
      }
    } catch (error) {
      console.error("Error creating section:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="createContainer">
        <div className="createHeader">
          <h3>ADD SECTION</h3>
          <button className="closeBt" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>

        <div className="formScrollArea">
          <div className="createFormContent">
            
            {/* SECTION NAME */}
            <div className="formGroup">
              <label>SECTION NAME <span style={{color: 'red'}}>*</span></label>
              <input 
                type="text" 
                placeholder="e.g. -1 or A" 
                value={formData.section_name}
                onChange={(e) => setFormData({...formData, section_name: e.target.value})}
              />
            </div>

            {/* SELECT PROGRAM */}
            <div className="formGroup">
              <label>PROGRAM <span style={{color: 'red'}}>*</span></label>
              <select 
                className="select-display"
                value={formData.program_id}
                onChange={(e) => setFormData({...formData, program_id: e.target.value})}
              >
                <option value="">Select Program</option>
                {programs.map(p => (
                  <option key={p.program_id} value={p.program_id}>
                    {p.program_abbr} - {p.program_name}
                  </option>
                ))}
              </select>
            </div>

            {/* SELECT YEAR LEVEL */}
            <div className="formGroup">
              <label>YEAR LEVEL <span style={{color: 'red'}}>*</span></label>
              <select 
                className="select-display"
                value={formData.year_level}
                onChange={(e) => setFormData({...formData, year_level: e.target.value})}
              >
                <option value="">Select Year</option>
                {yearOptions.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </div>

            {/* SELECT SEMESTER */}
            <div className="formGroup">
              <label>SEMESTER <span style={{color: 'red'}}>*</span></label>
              <select 
                className="select-display"
                value={formData.semester_id}
                onChange={(e) => setFormData({...formData, semester_id: e.target.value})}
              >
                <option value="">Select Semester</option>
                {semesterOptions.map(sem => (
                  <option key={sem.value} value={sem.value}>{sem.label}</option>
                ))}
              </select>
            </div>

            {/* SELECT ACADEMIC YEAR */}
            <div className="formGroup">
              <label>ACADEMIC YEAR<span style={{color: 'red'}}>*</span></label>
              <select 
                className="select-display"
                value={formData.year_id}
                onChange={(e) => setFormData({...formData, year_id: e.target.value})}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map(year => (
                  <option key={year.year_id} value={year.year_id}>
                    {year.year_label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterBtnsContainer">
              <button className="resetFilterBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
              <button className="applyFilterBtn" onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? "CREATING..." : "CREATE SECTION"}
              </button>
            </div>  

          </div>
        </div>
      </div>
    </div>
  );
}

export default AddSection;
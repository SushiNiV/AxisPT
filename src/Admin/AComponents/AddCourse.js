import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import '../../GlobalForm.css'
import '../../GlobalOverlay.css';
import '../../Global.css';

function AddCourse({ onClose, onSuccess, courseToEdit = null }) {
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    lec_units: 0,
    lab_units: 0,
    total_units: 0,
    course_desc: ""
  });
  const [selectedPrerequisites, setSelectedPrerequisites] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tempProgram, setTempProgram] = useState("");
  const [tempCurriculum, setTempCurriculum] = useState("");
  const [tempYear, setTempYear] = useState("");
  const [tempSemester, setTempSemester] = useState("");
  const [programs, setPrograms] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [filteredCurricula, setFilteredCurricula] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalRoot, setPortalRoot] = useState(document.getElementById('portal-root') || document.body);
  const isEditMode = !!courseToEdit;

  useEffect(() => {
    const fetchPrograms = async () => {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers });
        const data = await response.json();
        if (data.success) setPrograms(data.data);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    
    const fetchCurricula = async () => {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/curricula`, { headers });
        const data = await response.json();
        if (data.success) setCurricula(data.data);
      } catch (err) {
        console.error("Error fetching curricula:", err);
      }
    };
    
    const fetchCourses = async () => {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, { headers });
        const data = await response.json();
        if (data.success) setAvailableCourses(data.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    
    fetchPrograms();
    fetchCurricula();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (tempProgram) {
      const filtered = curricula.filter(c => c.program_id === parseInt(tempProgram));
      setFilteredCurricula(filtered);
      setTempCurriculum("");
    } else {
      setFilteredCurricula([]);
      setTempCurriculum("");
    }
  }, [tempProgram, curricula]);

  const lecUnits = parseInt(formData.lec_units) || 0;
  const labUnits = parseInt(formData.lab_units) || 0;
  const totalUnits = lecUnits + labUnits;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lec_units' || name === 'lab_units') {
      const numValue = value === '' ? 0 : parseInt(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: isNaN(numValue) ? 0 : numValue 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePrerequisiteChange = (e) => {
    const courseId = parseInt(e.target.value);
    const course = availableCourses.find(c => c.course_id === courseId);
    if (course) {
      setSelectedPrerequisites([{ id: course.course_id, code: course.course_code, name: course.course_name }]);
    } else {
      setSelectedPrerequisites([]);
    }
  };

  const addAssignment = () => {
    console.log("tempCurriculum:", tempCurriculum);
    console.log("tempYear:", tempYear);
    console.log("tempSemester:", tempSemester);
    
    if (!tempCurriculum || !tempYear || !tempSemester) {
      alert("Please select Curriculum, Year, and Semester.");
      return;
    }

    const curriculum = curricula.find(c => c.curriculum_id === parseInt(tempCurriculum));
    console.log("Found curriculum:", curriculum);
    
    const existing = assignments.find(a => a.curriculum_id === parseInt(tempCurriculum) && a.year_level === parseInt(tempYear) && a.semester_id === parseInt(tempSemester));

    if (existing) {
      alert("This assignment already exists.");
      return;
    }

    const newAssignment = {
      curriculum_id: parseInt(tempCurriculum),
      curriculum_name: curriculum?.program_name,
      start_year: curriculum?.start_year,
      version_name: curriculum?.version_name,
      year_level: parseInt(tempYear),
      semester_id: parseInt(tempSemester)
    };
    
    console.log("New assignment:", newAssignment);
    setAssignments([...assignments, newAssignment]);

    setTempProgram("");
    setTempCurriculum("");
    setTempYear("");
    setTempSemester("");
  };

  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const { course_code, course_name, course_desc } = formData;

    if (!course_code || !course_name || !lecUnits) {
      alert("Please fill in Course Code, Course Name, and Lec Units.");
      return;
    }

    if (assignments.length === 0) {
      alert("Please add at least one curriculum assignment.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const url = isEditMode 
        ? `${process.env.REACT_APP_API_URL}/admin/courses/${courseToEdit.course_id}`
        : `${process.env.REACT_APP_API_URL}/admin/courses`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_code: course_code.toUpperCase(),
          course_name: course_name.toUpperCase(),
          lec_units: lecUnits,
          lab_units: labUnits,
          course_desc: course_desc,
          prerequisites: selectedPrerequisites.map(p => p.id),
          assignments: assignments
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(isEditMode ? "Course updated successfully!" : "Course created successfully!");
        onSuccess();
      } else {
        alert(data.message || (isEditMode ? "Failed to update course." : "Failed to create course."));
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSemesterLabel = (semesterId) => {
    switch(semesterId) {
      case 1: return "1st Semester";
      case 2: return "2nd Semester";
      case 3: return "Summer Term";
      default: return "";
    }
  };

  const modalContent = (
    <div className="modalOverlay">
      <div className="modalContainer">
        <div className="CloseBtnArea">
          <button className="CloseBtn" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>
        <div className="modalHeader">
          <h3 className="modalTitle">{isEditMode ? "UPDATE COURSE" : "ADD NEW COURSE"}</h3>
        </div>

        <div className="modalScrollArea">
          <div className="FormContent">
            <div className="formGroup">
              <label className="formLabel">COURSE CODE <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                name="course_code"
                placeholder="VRTS111"
                value={formData.course_code}
                onChange={handleChange}
              />
            </div>

            <div className="formGroup">
              <label className="formLabel">COURSE NAME <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                name="course_name"
                placeholder="Veritas Et Misericordia 1"
                value={formData.course_name}
                onChange={handleChange}
              />
            </div>

            <div className="formRow">
              <div className="formGroup">
                <label className="formLabel">LEC UNITS <span style={{color: 'red'}}>*</span></label>
                <input
                  type="number"
                  name="lec_units"
                  value={formData.lec_units === 0 ? "" : formData.lec_units}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="formGroup">
                <label className="formLabel">LAB UNITS</label>
                <input
                  type="number"
                  name="lab_units"
                  value={formData.lab_units === 0 ? "" : formData.lab_units}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="formGroup">
                <label className="formLabel">TOTAL UNITS</label>
                <input
                  type="number"
                  disabled
                  className="readOnlyInput"
                  value={totalUnits}
                />
              </div>
            </div>

            <div className="formGroup">
              <label className="formLabel">PREREQUISITES</label>
              <select 
                value={selectedPrerequisites.length > 0 ? selectedPrerequisites[0].id : ""}
                onChange={handlePrerequisiteChange}
                className="formSelect"
              >
                <option value="">No Prerequisite</option>
                {availableCourses.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label className="formLabel">CURRICULUM ASSIGNMENT <span style={{color: 'red'}}>*</span></label>
              
              <div className="formRow">
                <div className="formGroup">
                  <select 
                    value={tempProgram} 
                    onChange={(e) => setTempProgram(e.target.value)}
                    className="formSelect"
                  >
                    <option value="">Select Program</option>
                    {programs.map(program => (
                      <option key={program.program_id} value={program.program_id}>
                        {program.program_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="formGroup">
                  <select 
                    value={tempCurriculum} 
                    onChange={(e) => setTempCurriculum(e.target.value)}
                    className="formSelect"
                    disabled={!tempProgram}
                  >
                    <option value="">Select Curriculum</option>
                    {filteredCurricula.map(curriculum => (
                      <option key={curriculum.curriculum_id} value={curriculum.curriculum_id}>
                        {curriculum.version_name} ({curriculum.start_year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <select 
                    value={tempYear} 
                    onChange={(e) => setTempYear(e.target.value)}
                    className="formSelect"
                    disabled={!tempCurriculum}
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>

                <div className="formGroup">
                  <select 
                    value={tempSemester} 
                    onChange={(e) => setTempSemester(e.target.value)}
                    className="formSelect"
                    disabled={!tempCurriculum}
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Sem</option>
                    <option value="2">2nd Sem</option>
                    <option value="3">Summer</option>
                  </select>
                </div>

                <button type="button" className="AddBtn" onClick={addAssignment}>+ Add</button>
              </div>

              {assignments.length > 0 && (
                <div className="assignmentList">
                  {assignments.map((assignment, idx) => (
                    <div key={idx} className="assignmentItem">
                      <span>
                        {assignment.curriculum_name} ({assignment.version_name} {assignment.start_year}) - {assignment.year_level} Year, {getSemesterLabel(assignment.semester_id)}
                      </span>
                      <button type="button" onClick={() => removeAssignment(idx)} className="RemoveBtn">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="formGroup">
              <label className="formLabel">COURSE DESCRIPTION</label>
              <textarea
                name="course_desc"
                rows="4"
                placeholder="Enter Course Description..."
                value={formData.course_desc}
                onChange={handleChange}
                style={{ resize: 'none' }}
              ></textarea>
            </div>

            <div className="BtnsContainer">
              <button className="ResetFilterBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
              <button className="ApplyFilterBtn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (isEditMode ? "UPDATING..." : "CREATING...") : (isEditMode ? "UPDATE" : "CREATE")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, portalRoot);
}

export default AddCourse;
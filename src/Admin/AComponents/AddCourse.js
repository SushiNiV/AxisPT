import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import ConfirmationModal from './ConfirmationModal';
import '../../GlobalForm.css';
import '../../GlobalOverlay.css';
import '../../Global.css';

function AddCourse({ onClose, onSuccess, courseToEdit = null }) {
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    lec_units: 0,
    lab_units: 0,
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
  const portalRoot = document.getElementById('portal-root') || document.body;
  const isEditMode = !!courseToEdit;

  // --- Searchable multi-select state ---
  const [prereqSearch, setPrereqSearch] = useState("");
  const [showPrereqDropdown, setShowPrereqDropdown] = useState(false);
  const prereqInputRef = useRef(null);
  const prereqDropdownRef = useRef(null);

  // --- Confirmation / Success modal states ---
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  // ---------------------------------------------------------------------
  // Confirmation / Alert helpers
  // ---------------------------------------------------------------------
  const closeConfirm = () => setConfirmState({ isOpen: false });

  const openConfirm = (config) => {
    setConfirmState({
      isOpen: true,
      variant: 'info',
      confirmLabel: 'CONFIRM',
      cancelLabel: 'CANCEL',
      isAlert: false,
      loading: false,
      ...config,
    });
  };

  const openAlert = (title, message, variant = 'info') => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      variant,
      isAlert: true,
      onConfirm: closeConfirm,
      onCancel: closeConfirm,
    });
  };

  const showSuccess = (title, message) => {
    setSuccessState({ isOpen: true, title, message, variant: 'success' });
  };

  // --- Fetch data on mount ---
  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [programsRes, curriculaRes, coursesRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/curricula`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, { headers })
        ]);
        const programsData = await programsRes.json();
        const curriculaData = await curriculaRes.json();
        const coursesData = await coursesRes.json();
        if (programsData.success) setPrograms(programsData.data);
        if (curriculaData.success) setCurricula(curriculaData.data);
        if (coursesData.success) setAvailableCourses(coursesData.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // --- Populate form and assignments when editing ---
  useEffect(() => {
    if (courseToEdit) {
      setFormData({
        course_code: courseToEdit.course_code || "",
        course_name: courseToEdit.course_name || "",
        lec_units: courseToEdit.lec_units || 0,
        lab_units: courseToEdit.lab_units || 0,
        course_desc: courseToEdit.course_desc || ""
      });

      const fetchFullCourse = async () => {
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/courses/${courseToEdit.course_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await response.json();
          if (data.success && data.data) {
            // Prerequisites – populate tags
            if (data.data.prerequisites) {
              let prereqIds = [];
              if (Array.isArray(data.data.prerequisites)) {
                prereqIds = data.data.prerequisites;
              } else if (typeof data.data.prerequisites === 'string') {
                prereqIds = data.data.prerequisites.split(',').map(Number).filter(Boolean);
              }
              const prereqCourses = availableCourses.filter(c => prereqIds.includes(c.course_id));
              setSelectedPrerequisites(prereqCourses.map(c => ({ id: c.course_id, code: c.course_code, name: c.course_name })));
            }
            // Assignments
            if (data.data.assignments && data.data.assignments.length > 0) {
              const mapped = data.data.assignments.map(a => ({
                curriculum_id: a.curriculum_id,
                curriculum_name: a.program_abbr || a.program_name || "Unknown",
                program_name: a.program_name,
                program_abbr: a.program_abbr,
                version_name: a.version_name,
                start_year: a.start_year,
                year_level: a.year_level,
                semester_id: a.semester_id,
                semester_label: a.semester_label
              }));
              setAssignments(mapped);
            }
          }
        } catch (err) {
          console.error("Error fetching full course:", err);
        }
      };
      fetchFullCourse();
    }
  }, [courseToEdit, availableCourses]);

  // --- Filter curricula by selected program ---
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

  // --- Close dropdown when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        prereqInputRef.current && !prereqInputRef.current.contains(e.target) &&
        prereqDropdownRef.current && !prereqDropdownRef.current.contains(e.target)
      ) {
        setShowPrereqDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lecUnits = parseInt(formData.lec_units) || 0;
  const labUnits = parseInt(formData.lab_units) || 0;
  const totalUnits = lecUnits + labUnits;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lec_units' || name === 'lab_units') {
      const numValue = value === '' ? 0 : parseInt(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- Prerequisite search logic (excludes current course when editing) ---
  const filteredAvailable = availableCourses.filter(c =>
    !selectedPrerequisites.some(p => p.id === c.course_id) &&
    (isEditMode ? c.course_id !== courseToEdit.course_id : true) &&
    (c.course_code.toLowerCase().includes(prereqSearch.toLowerCase()) ||
     c.course_name.toLowerCase().includes(prereqSearch.toLowerCase()))
  );

  const togglePrereq = (course) => {
    setSelectedPrerequisites(prev => {
      const exists = prev.some(p => p.id === course.course_id);
      if (exists) {
        return prev.filter(p => p.id !== course.course_id);
      } else {
        return [...prev, { id: course.course_id, code: course.course_code, name: course.course_name }];
      }
    });
    setPrereqSearch("");
    setShowPrereqDropdown(false);
    if (prereqInputRef.current) prereqInputRef.current.focus();
  };

  const removePrereq = (id) => {
    setSelectedPrerequisites(prev => prev.filter(p => p.id !== id));
    if (prereqInputRef.current) prereqInputRef.current.focus();
  };

  // --- Assignment handlers ---
  const addAssignment = () => {
    if (!tempCurriculum || !tempYear || !tempSemester) {
      openAlert('Missing Selection', 'Please select Curriculum, Year, and Semester.', 'warning');
      return;
    }
    const curriculum = curricula.find(c => c.curriculum_id === parseInt(tempCurriculum));
    const program = programs.find(p => p.program_id === curriculum?.program_id);
    const existing = assignments.find(a =>
      a.curriculum_id === parseInt(tempCurriculum) &&
      a.year_level === parseInt(tempYear) &&
      a.semester_id === parseInt(tempSemester)
    );
    if (existing) {
      openAlert('Duplicate Assignment', 'This assignment already exists.', 'warning');
      return;
    }
    const newAssignment = {
      curriculum_id: parseInt(tempCurriculum),
      curriculum_name: program?.program_abbr || program?.program_name || curriculum?.version_name || "Unknown",
      program_name: program?.program_name,
      program_abbr: program?.program_abbr,
      start_year: curriculum?.start_year,
      version_name: curriculum?.version_name,
      year_level: parseInt(tempYear),
      semester_id: parseInt(tempSemester)
    };
    setAssignments([...assignments, newAssignment]);
    setTempProgram("");
    setTempCurriculum("");
    setTempYear("");
    setTempSemester("");
  };

  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  // --- Render selected prerequisites as tags ---
  const renderPrereqTags = () => {
    if (selectedPrerequisites.length === 0) return null;
    return (
      <div className="tags-container">
        {selectedPrerequisites.map(p => (
          <span key={p.id} className="tags">
            {p.code} - {p.name}
            <button type="button" className="remove-btn" onClick={() => removePrereq(p.id)}>
              &times;
            </button>
          </span>
        ))}
      </div>
    );
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!formData.course_code || !formData.course_name) {
      openAlert('Missing Fields', 'Please fill in Course Code and Course Name.', 'warning');
      return;
    }
    if (lecUnits === 0 && labUnits === 0) {
      openAlert('Missing Units', 'Please specify at least one unit (Lecture or Lab).', 'warning');
      return;
    }
    if (assignments.length === 0) {
      openAlert('No Assignments', 'Please add at least one curriculum assignment.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const url = isEditMode
        ? `${process.env.REACT_APP_API_URL}/admin/courses/${courseToEdit.course_id}`
        : `${process.env.REACT_APP_API_URL}/admin/courses`;
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        course_code: formData.course_code.toUpperCase(),
        course_name: formData.course_name.toUpperCase(),
        lec_units: lecUnits,
        lab_units: labUnits,
        course_desc: formData.course_desc || null,
        prerequisites: selectedPrerequisites.map(p => p.id),
        assignments: assignments
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(
          isEditMode ? 'Course Updated' : 'Course Created',
          isEditMode
            ? 'The course has been updated successfully.'
            : 'The course has been created successfully.'
        );
      } else {
        openAlert(
          isEditMode ? 'Update Failed' : 'Creation Failed',
          data.message || (isEditMode ? "Failed to update course." : "Failed to create course."),
          'danger'
        );
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
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
        <div className="modalHeader">
          <h3 className="modalTitle">{isEditMode ? "UPDATE COURSE" : "ADD NEW COURSE"}</h3>
          <div className="CloseBtnArea">
            <button className="CloseBtn" onClick={onClose} disabled={isSubmitting}>&times;</button>
          </div>
        </div>

        <div className="modalScrollArea">
          {/* Course Details */}
          <div className="formSection">
            <h4 className="sectionHeading">Course Details</h4>
            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">COURSE CODE <span style={{color: 'red'}}>*</span></label>
                <input type="text" name="course_code" value={formData.course_code} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">COURSE NAME <span style={{color: 'red'}}>*</span></label>
                <input type="text" name="course_name" value={formData.course_name} onChange={handleChange} />
              </div>
            </div>
            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">LEC UNITS <span style={{color: 'red'}}>*</span></label>
                <input type="number" name="lec_units" value={formData.lec_units === 0 ? "" : formData.lec_units} onChange={handleChange} min="0" placeholder="0" />
              </div>
              <div className="formGroup">
                <label className="formLabel">LAB UNITS</label>
                <input type="number" name="lab_units" value={formData.lab_units === 0 ? "" : formData.lab_units} onChange={handleChange} min="0" placeholder="0" />
              </div>
              <div className="formGroup">
                <label className="formLabel">TOTAL UNITS</label>
                <input type="number" disabled className="readOnlyInput" value={totalUnits} />
              </div>
            </div>
          </div>

          {/* Prerequisites - Searchable Multi-Select */}
          <div className="formSection">
            <h4 className="sectionHeading">Prerequisites</h4>
            <div className="formGroup">
              <label className="formLabel">Search and select prerequisite courses</label>
              <div ref={prereqInputRef} style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={prereqSearch}
                  onChange={(e) => setPrereqSearch(e.target.value)}
                  onFocus={() => setShowPrereqDropdown(true)}
                  placeholder="Type to search courses..."
                  className="formInput"
                  style={{ width: '100%' }}
                />
                {showPrereqDropdown && filteredAvailable.length > 0 && (
                  <div
                    ref={prereqDropdownRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    {filteredAvailable.map(course => (
                      <div
                        key={course.course_id}
                        onClick={() => togglePrereq(course)}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.85rem'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {course.course_code} - {course.course_name}
                      </div>
                    ))}
                  </div>
                )}
                {showPrereqDropdown && prereqSearch && filteredAvailable.length === 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '8px', zIndex: 10 }}>
                    No courses found
                  </div>
                )}
              </div>
              {renderPrereqTags()}
            </div>
          </div>

          {/* Curriculum Assignments */}
          <div className="formSection">
            <h4 className="sectionHeading">Curriculum Assignment <span style={{color: 'red'}}>*</span></h4>
            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">Program</label>
                <select value={tempProgram} onChange={(e) => setTempProgram(e.target.value)} className="formSelect">
                  <option value="">Select Program</option>
                  {programs.map(p => (
                    <option key={p.program_id} value={p.program_id}>
                      {p.program_abbr || p.program_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">Curriculum</label>
                <select value={tempCurriculum} onChange={(e) => setTempCurriculum(e.target.value)} className="formSelect" disabled={!tempProgram}>
                  <option value="">Select Curriculum</option>
                  {filteredCurricula.map(cur => (
                    <option key={cur.curriculum_id} value={cur.curriculum_id}>
                      {cur.version_name} ({cur.start_year})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">Year Level</label>
                <select value={tempYear} onChange={(e) => setTempYear(e.target.value)} className="formSelect" disabled={!tempCurriculum}>
                  <option value="">Select Year</option>
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>{y} Year</option>)}
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">Semester</label>
                <select value={tempSemester} onChange={(e) => setTempSemester(e.target.value)} className="formSelect" disabled={!tempCurriculum}>
                  <option value="">Select Semester</option>
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                  <option value="3">Summer</option>
                </select>
              </div>
            </div>
            <button type="button" className="AddBtn" onClick={addAssignment} style={{ marginTop: '6px' }}>+ Add</button>

            {assignments.length > 0 && (
              <div className="assignment-table-wrapper" style={{ marginTop: '12px' }}>
                <table className="Table assignment-table">
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>Curriculum</th>
                      <th>Year</th>
                      <th>Semester</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment, idx) => (
                      <tr key={idx}>
                        <td>{assignment.program_abbr || assignment.curriculum_name}</td>
                        <td>{assignment.version_name} ({assignment.start_year})</td>
                        <td>{assignment.year_level}</td>
                        <td>{getSemesterLabel(assignment.semester_id)}</td>
                        <td>
                          <button
                            type="button"
                            className="RemoveBtn"
                            onClick={() => removeAssignment(idx)}
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Course Description */}
          <div className="formSection">
            <h4 className="sectionHeading">Course Description</h4>
            <div className="formGroup">
              <textarea name="course_desc" rows="4" value={formData.course_desc} onChange={handleChange} style={{ resize: 'none' }} />
            </div>
          </div>

          <div className="modalFooter">
            <button type="button" className="cancelBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
            <button type="submit" className="submitBtn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "SAVING..." : (isEditMode ? "UPDATE COURSE" : "CREATE COURSE")}
            </button>
          </div>
        </div>
      </div>

      {/* Success modal (green) */}
      <ConfirmationModal
        isOpen={successState.isOpen}
        title={successState.title}
        message={successState.message}
        variant={successState.variant}
        isAlert={true}
        onConfirm={() => {
          setSuccessState({ isOpen: false });
          onSuccess();
        }}
        onCancel={() => {
          setSuccessState({ isOpen: false });
          onSuccess();
        }}
      />

      {/* Confirmation / alert modal (warning/danger/info) */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </div>
  );

  return ReactDOM.createPortal(modalContent, portalRoot);
}

export default AddCourse;
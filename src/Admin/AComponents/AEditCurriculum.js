import React, { useState, useEffect } from "react";
import './AEditCurriculum.css';
import { BiTrash, BiPlus } from 'react-icons/bi';

function AEditCurriculum({ curriculumId, onClose, onSuccess }) {
  const [programs, setPrograms] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    program_id: "",
    curriculum_year: "",
    version_name: "",
    is_active: false
  });

  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_id: "",
    year_level: "1",
    semester_id: "1"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const yearOptions = [
    { label: "1st Year", value: 1 },
    { label: "2nd Year", value: 2 },
    { label: "3rd Year", value: 3 },
    { label: "4th Year", value: 4 },
  ];

  const semesterOptions = [
    { label: "1st Semester", value: 1 },
    { label: "2nd Semester", value: 2 },
    { label: "Summer", value: 3 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      try {
        const [progRes, courseRes, currRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/curriculum/${curriculumId}`, { headers })
        ]);
        const progData = await progRes.json();
        const courseData = await courseRes.json();
        const currData = await currRes.json();

        if (progData.success) setPrograms(progData.data);
        if (courseData.success) setAllCourses(courseData.data);
        if (currData.success) {
          setFormData({
            program_id: currData.data.program_id,
            curriculum_year: currData.data.curriculum_year,
            version_name: currData.data.version_name || '',
            is_active: currData.data.is_active
          });
          setCurriculumCourses(currData.data.courses.map(c => ({
            course_id: c.course_id,
            course_code: c.course_code,
            course_name: c.course_name,
            units: c.total_units,
            year_level: c.year_level,
            semester_id: c.semester_id
          })));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [curriculumId]);

  const handleAddCourse = () => {
    if (!newCourse.course_id) return;
    
    const course = allCourses.find(c => c.id == newCourse.course_id);
    if (!course) return;

    if (curriculumCourses.some(c => c.course_id == newCourse.course_id)) {
      alert("Course already added!");
      return;
    }

    setCurriculumCourses(prev => [...prev, {
      course_id: newCourse.course_id,
      course_code: course.code,
      course_name: course.name,
      units: course.units,
      year_level: newCourse.year_level,
      semester_id: newCourse.semester_id
    }]);

    setNewCourse({ course_id: "", year_level: "1", semester_id: "1" });
    setShowAddCourse(false);
  };

  const handleRemoveCourse = (courseId) => {
    setCurriculumCourses(prev => prev.filter(c => c.course_id != courseId));
  };

  const handleSubmit = async () => {
    if (!formData.program_id || !formData.curriculum_year) {
      alert("Please fill in Program and Year Label");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/curriculum/${curriculumId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          courses: curriculumCourses
        })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.message || "Failed to update curriculum");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating curriculum");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCourses = allCourses.filter(
    c => !curriculumCourses.some(cc => cc.course_id == c.id)
  );

  if (loading) return (
    <div className="modalOverlay">
      <div className="editCurriculumContainer createContainer" style={{ maxWidth: '600px', maxHeight: '90vh' }}>
      <div className="createContainer">
        <div className="createFormContent">
          <p style={{ textAlign: 'center', padding: '40px' }}>Loading curriculum...</p>
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <div className="modalOverlay">
      <div className="createContainer" style={{ maxWidth: '600px', maxHeight: '90vh' }}>
        <div className="closeBTArea">
          <button className="closeBt" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>

        <div className="createHeader">
          <h3>EDIT CURRICULUM</h3>
        </div>

        <div className="formScrollArea">
          <div className="createFormContent">

            <div className="formGroup">
              <label>PROGRAM <span style={{color: 'red'}}>*</span></label>
              <select className="select-display" value={formData.program_id}
                onChange={(e) => setFormData({...formData, program_id: e.target.value})}>
                <option value="">Select Program</option>
                {programs.map(p => (
                  <option key={p.program_id} value={p.program_id}>{p.program_abbr} - {p.program_name}</option>
                ))}
              </select>
            </div>

            <div className="formRow">
              <div className="formGroup">
                <label>YEAR LABEL <span style={{color: 'red'}}>*</span></label>
                <input type="text" placeholder="e.g. 2025-2026" value={formData.curriculum_year}
                  onChange={(e) => setFormData({...formData, curriculum_year: e.target.value})} />
              </div>
              <div className="formGroup">
                <label>VERSION</label>
                <input type="text" placeholder="e.g. Default" value={formData.version_name}
                  onChange={(e) => setFormData({...formData, version_name: e.target.value})} />
              </div>
            </div>

            <div className="formGroup">
              <label>STATUS</label>
              <div className="statusToggleContainer" onClick={() => setFormData({...formData, is_active: !formData.is_active})}>
                <div className={`statusSwitch ${formData.is_active ? 'active' : 'inactive'}`}>
                  <div className="switchHandle"></div>
                </div>
                <span className="statusLabel">
                  {formData.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>

            <hr style={{ margin: '5px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

            <div className="formGroup">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>COURSES ({curriculumCourses.length})</label>
                <button 
                  type="button"
                  onClick={() => setShowAddCourse(!showAddCourse)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 10px', fontSize: '11px', cursor: 'pointer',
                    background: '#3D1616', color: '#fff', border: 'none', borderRadius: '5px'
                  }}
                >
                  <BiPlus size={14} /> Add Course
                </button>
              </div>

              {showAddCourse && (
                <div style={{ 
                  background: '#f1f5f9', padding: '12px', borderRadius: '8px',
                  marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 2, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 600, color: '#555' }}>Course</label>
                    <select className="select-display" value={newCourse.course_id}
                      onChange={(e) => setNewCourse({...newCourse, course_id: e.target.value})}>
                      <option value="">Select</option>
                      {availableCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 600, color: '#555' }}>Year</label>
                    <select className="select-display" value={newCourse.year_level}
                      onChange={(e) => setNewCourse({...newCourse, year_level: e.target.value})}>
                      {yearOptions.map(y => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '110px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 600, color: '#555' }}>Semester</label>
                    <select className="select-display" value={newCourse.semester_id}
                      onChange={(e) => setNewCourse({...newCourse, semester_id: e.target.value})}>
                      {semesterOptions.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={handleAddCourse}
                    style={{
                      padding: '10px 16px', background: '#22c55e', color: '#fff',
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600
                    }}>
                    Add
                  </button>
                </div>
              )}

              <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px' }}>
                {curriculumCourses.length > 0 ? (
                  curriculumCourses.map((c, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', background: idx % 2 === 0 ? '#f8fafc' : '#fff',
                      borderRadius: '4px', marginBottom: '3px', fontSize: '12px'
                    }}>
                      <div>
                        <strong>{c.course_code}</strong> - {c.course_name}
                        <span style={{ color: '#888', marginLeft: '8px', fontSize: '11px' }}>
                          {yearOptions.find(y => y.value == c.year_level)?.label} | {semesterOptions.find(s => s.value == c.semester_id)?.label}
                        </span>
                      </div>
                      <button type="button" onClick={() => handleRemoveCourse(c.course_id)}
                        style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '2px' }}>
                        <BiTrash size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '15px' }}>No courses added yet</p>
                )}
              </div>
            </div>

            <div className="filterBtnsContainer">
              <button className="resetFilterBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
              <button className="applyFilterBtn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AEditCurriculum;
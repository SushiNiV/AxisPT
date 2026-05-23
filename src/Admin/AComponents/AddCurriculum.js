import React, { useState, useEffect } from "react";
import './AddCurriculum.css';
import { BiTrash, BiPlus } from 'react-icons/bi';

function AddCurriculum({ onClose, onSuccess }) {
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  
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
    year_level: "",
    semester_id: ""
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
        const [progRes, courseRes, acadRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years`, { headers })
        ]);
        const progData = await progRes.json();
        const courseData = await courseRes.json();
        const acadData = await acadRes.json();
        if (progData.success) setPrograms(progData.data);
        if (courseData.success) setAllCourses(courseData.data);
        if (acadData.success) setAcademicYears(acadData.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

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
      alert("Please fill in Program and Academic Year");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/add-curriculum`, {
        method: 'POST',
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
        alert(data.message || "Failed to create curriculum");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating curriculum");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCourses = allCourses.filter(
    c => !curriculumCourses.some(cc => cc.course_id == c.id)
  );

  return (
    <div className="addCurriculumOverlay">
      <div className="addCurriculumContainer">

        <div className="addCurriculumHeader">
          <h3>CREATE CURRICULUM</h3>
          <button className="addCurriculumCloseBt" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>

        <div className="addCurriculumFormScroll">
          <div className="addCurriculumFormContent">

            {/* PROGRAM */}
            <div className="addCurriculumFormGroup">
              <label>PROGRAM <span className="addCurriculumRequired">*</span></label>
              <select className="addCurriculumSelect" value={formData.program_id}
                onChange={(e) => setFormData({...formData, program_id: e.target.value})}>
                <option value="">Select Program</option>
                {programs.map(p => (
                  <option key={p.program_id} value={p.program_id}>{p.program_abbr} - {p.program_name}</option>
                ))}
              </select>
            </div>

            {/* ACADEMIC YEAR + VERSION */}
            <div className="addCurriculumFormRow">
              <div className="addCurriculumFormGroup">
                <label>ACADEMIC YEAR <span className="addCurriculumRequired">*</span></label>
                <select className="addCurriculumSelect" value={formData.curriculum_year}
                  onChange={(e) => setFormData({...formData, curriculum_year: e.target.value})}>
                  <option value="">Select Academic Year</option>
                  {academicYears.map(y => (
                    <option key={y.year_id} value={y.year_label}>{y.year_label}</option>
                  ))}
                </select>
              </div>
              <div className="addCurriculumFormGroup">
                <label>VERSION</label>
                <input type="text" className="addCurriculumInput" placeholder="e.g. Default" value={formData.version_name}
                  onChange={(e) => setFormData({...formData, version_name: e.target.value})} />
              </div>
            </div>

            {/* STATUS */}
            <div className="addCurriculumFormGroup">
              <label>STATUS</label>
              <div className="addCurriculumToggle" onClick={() => setFormData({...formData, is_active: !formData.is_active})}>
                <div className={`addCurriculumSwitch ${formData.is_active ? 'active' : 'inactive'}`}>
                  <div className="addCurriculumSwitchHandle"></div>
                </div>
                <span className={`addCurriculumStatusLabel ${formData.is_active ? 'text-active' : 'text-inactive'}`}>
                  {formData.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>

            {/* COURSES SECTION */}
            <div className="addCurriculumFormGroup">
              <div className="addCurriculumCoursesHeader">
                <label>COURSES ({curriculumCourses.length})</label>
                <button 
                  type="button"
                  className="addCurriculumAddCourseBtn"
                  onClick={() => setShowAddCourse(!showAddCourse)}
                >
                  <BiPlus size={14} /> Add Course
                </button>
              </div>

              {/* ADD COURSE MINI-FORM */}
              {showAddCourse && (
                <div className="addCurriculumMiniForm">
                  <div className="addCurriculumMiniField">
                    <label>Course</label>
                    <select className="addCurriculumSelect" value={newCourse.course_id}
                      onChange={(e) => setNewCourse({...newCourse, course_id: e.target.value})}>
                      <option value="" disabled>Select Course</option>
                      {availableCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="addCurriculumMiniField">
                    <label>Year</label>
                    <select className="addCurriculumSelect" value={newCourse.year_level}
                      onChange={(e) => setNewCourse({...newCourse, year_level: e.target.value})}>
                      <option value="" disabled>Year</option>
                      {yearOptions.map(y => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="addCurriculumMiniField">
                    <label>Semester</label>
                    <select className="addCurriculumSelect" value={newCourse.semester_id}
                      onChange={(e) => setNewCourse({...newCourse, semester_id: e.target.value})}>
                      <option value="" disabled>Semester</option>
                      {semesterOptions.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="addCurriculumAddBtn" onClick={handleAddCourse}>Add</button>
                </div>
              )}

              {/* COURSES LIST */}
              <div className="addCurriculumCoursesList">
                {curriculumCourses.length > 0 ? (
                  curriculumCourses.map((c, idx) => (
                    <div key={idx} className={`addCurriculumCourseItem ${idx % 2 === 0 ? 'even' : 'odd'}`}>
                      <div className="addCurriculumCourseInfo">
                        <strong>{c.course_code}</strong> - {c.course_name}
                        <span className="addCurriculumCourseMeta">
                          {yearOptions.find(y => y.value == c.year_level)?.label} | {semesterOptions.find(s => s.value == c.semester_id)?.label}
                        </span>
                      </div>
                      <button type="button" className="addCurriculumRemoveBtn" onClick={() => handleRemoveCourse(c.course_id)}>
                        <BiTrash size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="addCurriculumNoCourses">No courses added yet</p>
                )}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="addCurriculumBtns">
              <button className="addCurriculumCancelBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
              <button className="addCurriculumSubmitBtn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "CREATING..." : "CREATE CURRICULUM"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCurriculum;
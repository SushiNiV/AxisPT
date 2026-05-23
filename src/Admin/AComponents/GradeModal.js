import React, { useState, useEffect } from 'react';
import { BiEdit, BiSave, BiX } from 'react-icons/bi';
import './GradeModal.css';

function GradeModal({ student, onClose }) {
  const [activeYear, setActiveYear] = useState(1);
  const [activeSemester, setActiveSemester] = useState(1);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [grades, setGrades] = useState({});
  const fetchCourses = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/student-courses/${student.id}?year_level=${activeYear}&semester_id=${activeSemester}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) {
          setCourses(data.courses);
          const gradeState = {};
          data.courses.forEach(c => {
            gradeState[c.course_id] = {
              prelim: c.prelim || '',
              midterm: c.midterm || '',
              finals: c.finals || '',
              final_grade: c.final_grade || '',
              remarks: c.remarks || ''
            };
          });
          setGrades(gradeState);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
  
  useEffect(() => {
  fetchCourses();
  }, [student.id, activeYear, activeSemester]);

  const handleGradeChange = (courseId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [courseId]: { ...prev[courseId], [field]: value }
    }));
  };

  const getSemesterLabel = (semId) => {
    const labels = { 1: 'FIRST SEMESTER', 2: 'SECOND SEMESTER', 3: 'SUMMER' };
    return labels[semId] || '';
  };

  const handleSave = async () => {
  try {
    const token = sessionStorage.getItem('token');
    const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/save-grades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        student_id: student.id,
        year_id: activeYear,
        semester_id: activeSemester,
        grades: grades
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('Grades saved successfully!');
      setEditMode(false);
      fetchCourses();
    } else {
      alert(data.message || 'Failed to save grades');
    }
  } catch (err) {
    console.error("Error saving grades:", err);
    alert('Error saving grades');
  }
};

  // Show one semester at a time
  const filteredCourses = courses.filter(c => c.semester_id == activeSemester);

  return (
    <div className="modalOverlay">
      <div className="gradeModalContainer">
        {/* Header Section */}
        <div className="gradeModalHeader">
          <div className="studentInfo">
            <h2>{student.name}</h2>
            <p>{student.id} | {student.program || 'BS PHYSICAL THERAPY'}</p>
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

        {/* Semester Tabs - Smaller, nested style */}
        <div className="semesterTabContainer">
          <button 
            className={`semesterTab ${activeSemester === 1 ? 'active' : ''}`}
            onClick={() => setActiveSemester(1)}
          >
            1st Semester
          </button>
          <button 
            className={`semesterTab ${activeSemester === 2 ? 'active' : ''}`}
            onClick={() => setActiveSemester(2)}
          >
            2nd Semester
          </button>
          <button 
            className={`semesterTab ${activeSemester === 3 ? 'active' : ''}`}
            onClick={() => setActiveSemester(3)}
          >
            Summer
          </button>
          {!editMode ? (
              <button className="editGradeBtn" onClick={() => setEditMode(true)}><BiEdit/>Edit</button>
            ) : (
              <button className="saveGradeBtn" onClick={handleSave}><BiSave/>Done</button>
            )}
        </div>

        <div className="gradeContentArea">
          <div className="semesterSection">
            <h3>{getSemesterLabel(activeSemester)}</h3>
            {loading ? (
              <p className="noDataNotice">Loading courses...</p>
            ) : filteredCourses.length > 0 ? (
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
                  {filteredCourses.map(course => (
                    <tr key={course.course_id}>
                      <td>{course.course_code}</td>
                      <td>{course.course_name}</td>
                      <td>{course.total_units || (course.lec_units + course.lab_units)}</td>
                      {editMode ? (
                        <>
                        <td>
                          <select className="gradeInput"
                            value={grades[course.course_id]?.prelim || ''}
                            onChange={(e) => handleGradeChange(course.course_id, 'prelim', e.target.value)}>
                            <option value="">—</option>
                            <option value="1.00">1.00</option>
                            <option value="1.25">1.25</option>
                            <option value="1.50">1.50</option>
                            <option value="1.75">1.75</option>
                            <option value="2.00">2.00</option>
                            <option value="2.25">2.25</option>
                            <option value="2.50">2.50</option>
                            <option value="2.75">2.75</option>
                            <option value="3.00">3.00</option>
                            <option value="4.00">4.00</option>
                            <option value="5.00">5.00</option>
                          </select>
                        </td>
                          <td>
                            <select className="gradeInput"
                              value={grades[course.course_id]?.midterm || ''}
                              onChange={(e) => handleGradeChange(course.course_id, 'midterm', e.target.value)}>
                              <option value="">—</option>
                              <option value="1.00">1.00</option>
                              <option value="1.25">1.25</option>
                              <option value="1.50">1.50</option>
                              <option value="1.75">1.75</option>
                              <option value="2.00">2.00</option>
                              <option value="2.25">2.25</option>
                              <option value="2.50">2.50</option>
                              <option value="2.75">2.75</option>
                              <option value="3.00">3.00</option>
                              <option value="4.00">4.00</option>
                              <option value="5.00">5.00</option>
                            </select>
                          </td>
                          <td>
                            <select  className="gradeInput"
                              value={grades[course.course_id]?.finals || ''}
                              onChange={(e) => handleGradeChange(course.course_id, 'finals', e.target.value)}>
                              <option value="">—</option>
                              <option value="1.00">1.00</option>
                              <option value="1.25">1.25</option>
                              <option value="1.50">1.50</option>
                              <option value="1.75">1.75</option>
                              <option value="2.00">2.00</option>
                              <option value="2.25">2.25</option>
                              <option value="2.50">2.50</option>
                              <option value="2.75">2.75</option>
                              <option value="3.00">3.00</option>
                              <option value="4.00">4.00</option>
                              <option value="5.00">5.00</option>
                            </select>
                          </td>
                          <td className="finalGrade">—</td>
                          <td>
                            <select className="gradeInput"
                              value={grades[course.course_id]?.remarks || ''}
                              onChange={(e) => handleGradeChange(course.course_id, 'remarks', e.target.value)}>
                              <option value="">—</option>
                              <option value="P">PASSED</option>
                              <option value="F">FAILED</option>
                              <option value="INC">INC</option>
                            </select>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{course.prelim || '—'}</td>
                          <td>{course.midterm || '—'}</td>
                          <td>{course.finals || '—'}</td>
                          <td className="finalGrade">{course.final_grade || '—'}</td>
                          <td className={course.remarks === 'P' ? 'pass' : course.remarks === 'F' ? 'fail' : ''}>
                            {course.remarks === 'P' ? 'PASSED' : course.remarks === 'F' ? 'FAILED' : course.remarks === 'INC' ? 'INC' : '—'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="noDataNotice">No courses available for this semester.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradeModal;
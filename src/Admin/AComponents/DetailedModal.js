import React, { useState, useEffect } from 'react';
import { BiX, BiSave } from 'react-icons/bi';
import './DetailedModal.css';

function DetailedModal({ student, course, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({});
  
  const isLabCourse = course.lab_units > 0;

  // Lecture components (always present)
  const lectureComponents = [
    { name: 'Quizzes/Assessment Task', key: 'lec_quizzes', pct: 35 },
    { name: 'Prelim Exam', key: 'lec_prelim_exam', pct: 20 },
    { name: 'Midterm Exam', key: 'lec_midterm_exam', pct: 20 },
    { name: 'Final Exam', key: 'lec_final_exam', pct: 20 },
    { name: 'CANVAS Activities/Other AT', key: 'lec_canvas', pct: 5 },
  ];

  // Lab components (only for lab courses)
  const labComponents = [
    { name: 'Unit Practical Exam', key: 'lab_practical', pct: 40 },
    { name: 'Prelim OSCE/OSPE', key: 'lab_prelim_osce', pct: 20 },
    { name: 'Midterm OSCE/OSPE', key: 'lab_midterm_osce', pct: 20 },
    { name: 'Final OSCE/OSPE', key: 'lab_final_osce', pct: 20 },
  ];

  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    // Fetch existing grades if any
    const fetchGradeDetails = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/grade-details/${student.id}/${course.course_id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && data.components) {
          const existingScores = {};
          data.components.forEach(c => {
            existingScores[c.component_name] = c.score || '';
          });
          setScores(existingScores);
          setRemarks(data.remarks || '');
        }
      } catch (err) {
        console.error("Error fetching grade details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGradeDetails();
  }, [student.id, course.course_id]);

  const handleScoreChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const computeTotal = () => {
    let total = 0;
    
    if (isLabCourse) {
      // Lecture 60%
      let lecTotal = 0;
      lectureComponents.forEach(c => {
        const score = parseFloat(scores[c.key]) || 0;
        lecTotal += score * (c.pct / 100);
      });
      total += lecTotal * 0.60;
      
      // Lab 40%
      let labTotal = 0;
      labComponents.forEach(c => {
        const score = parseFloat(scores[c.key]) || 0;
        labTotal += score * (c.pct / 100);
      });
      total += labTotal * 0.40;
    } else {
      // Lecture 100%
      lectureComponents.forEach(c => {
        const score = parseFloat(scores[c.key]) || 0;
        total += score * (c.pct / 100);
      });
    }
    
    return total.toFixed(2);
  };

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/save-grade-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: student.id,
          course_id: course.course_id,
          scores: scores,
          remarks: remarks,
          is_lab: isLabCourse
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Grades saved!');
        onSave();
      }
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  if (loading) return (
    <div className="gradeDetailOverlay">
      <div className="gradeDetailContainer">
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="gradeDetailOverlay">
      <div className="gradeDetailContainer">

        {/* Header */}
        <div className="gradeDetailHeader">
          <div>
            <h3>{course.course_code} - {course.course_name}</h3>
            <span className="gradeDetailSubtitle">
              {isLabCourse ? 'Lecture + Laboratory' : 'Lecture Only'} | {course.total_units || (course.lec_units + course.lab_units)} Units
            </span>
          </div>
          <button className="gradeDetailCloseBt" onClick={onClose}>&times;</button>
        </div>

        <div className="gradeDetailFormScroll">
          <div className="gradeDetailFormContent">

            {/* LECTURE SECTION */}
            <div className="gradeDetailSection">
              <h4 className="gradeDetailSectionTitle">
                LECTURE ({isLabCourse ? '60%' : '100%'})
              </h4>
              {lectureComponents.map(comp => (
                <div className="gradeDetailRow" key={comp.key}>
                  <label>{comp.name} ({comp.pct}%)</label>
                  <input 
                    type="number" 
                    className="gradeDetailInput"
                    value={scores[comp.key] || ''}
                    onChange={(e) => handleScoreChange(comp.key, e.target.value)}
                    min="0" max="100" step="0.01"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>

            {/* LAB SECTION (only if lab course) */}
            {isLabCourse && (
              <div className="gradeDetailSection">
                <h4 className="gradeDetailSectionTitle">LABORATORY (40%)</h4>
                {labComponents.map(comp => (
                  <div className="gradeDetailRow" key={comp.key}>
                    <label>{comp.name} ({comp.pct}%)</label>
                    <input 
                      type="number" 
                      className="gradeDetailInput"
                      value={scores[comp.key] || ''}
                      onChange={(e) => handleScoreChange(comp.key, e.target.value)}
                      min="0" max="100" step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TOTAL */}
            <div className="gradeDetailTotalRow">
              <label>TOTAL GRADE</label>
              <span className="gradeDetailTotal">{computeTotal()}</span>
            </div>

            {/* REMARKS */}
            <div className="gradeDetailRow">
              <label>REMARKS</label>
              <select 
                className="gradeDetailSelect"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              >
                <option value="">—</option>
                <option value="P">PASSED</option>
                <option value="F">FAILED</option>
                <option value="INC">INC</option>
              </select>
            </div>

            {/* BUTTONS */}
            <div className="gradeDetailBtns">
              <button className="gradeDetailCancelBtn" onClick={onClose}>CANCEL</button>
              <button className="gradeDetailSaveBtn" onClick={handleSave}>
                <BiSave size={14} /> SAVE
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailedModal;
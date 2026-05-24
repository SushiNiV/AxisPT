import React, { useState, useEffect } from 'react';
import { BiX, BiSave } from 'react-icons/bi';
import './DetailedModal.css';

function DetailedModal({ student, course, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState('Prelim');
  const [scores, setScores] = useState({
    Prelim: {},
    Midterm: {},
    Final: {}
  });
  
  const isLabCourse = course.lab_units > 0;

  // Components per term
  const lectureComponents = {
    Prelim: [
      { name: 'Quizzes/Assessment Task', key: 'lec_quizzes', pct: 35 },
      { name: 'Prelim Exam', key: 'lec_prelim_exam', pct: 20 },
      { name: 'CANVAS Activities/Other AT', key: 'lec_canvas', pct: 5 },
    ],
    Midterm: [
      { name: 'Quizzes/Assessment Task', key: 'lec_quizzes', pct: 35 },
      { name: 'Midterm Exam', key: 'lec_midterm_exam', pct: 20 },
      { name: 'CANVAS Activities/Other AT', key: 'lec_canvas', pct: 5 },
    ],
    Final: [
      { name: 'Quizzes/Assessment Task', key: 'lec_quizzes', pct: 35 },
      { name: 'Final Exam', key: 'lec_final_exam', pct: 20 },
      { name: 'CANVAS Activities/Other AT', key: 'lec_canvas', pct: 5 },
    ],
  };

  const labComponents = {
    Prelim: [
      { name: 'Unit Practical Exam', key: 'lab_practical', pct: 40 },
      { name: 'Prelim OSCE/OSPE', key: 'lab_prelim_osce', pct: 20 },
    ],
    Midterm: [
      { name: 'Unit Practical Exam', key: 'lab_practical', pct: 40 },
      { name: 'Midterm OSCE/OSPE', key: 'lab_midterm_osce', pct: 20 },
    ],
    Final: [
      { name: 'Unit Practical Exam', key: 'lab_practical', pct: 40 },
      { name: 'Final OSCE/OSPE', key: 'lab_final_osce', pct: 20 },
    ],
  };

  const [remarks, setRemarks] = useState('');

  const terms = ['Prelim', 'Midterm', 'Final'];

  useEffect(() => {
    const fetchGradeDetails = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/grade-details/${student.id}/${course.course_id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success && data.components) {
          const existingScores = { Prelim: {}, Midterm: {}, Final: {} };
          data.components.forEach(c => {
            const term = c.term || 'Prelim';
            if (!existingScores[term]) existingScores[term] = {};
            existingScores[term][c.component_name] = {
              score: c.score !== null && c.score !== undefined ? String(c.score) : '',
              total: c.total !== null && c.total !== undefined ? String(c.total) : ''
            };
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

  const handleScoreChange = (term, key, field, value) => {
    setScores(prev => ({
      ...prev,
      [term]: {
        ...prev[term],
        [key]: { ...(prev[term]?.[key] || {}), [field]: value }
      }
    }));
  };

  const computeTermGrade = (term) => {
    const lecComps = lectureComponents[term] || [];
    const labComps = labComponents[term] || [];

    const computeComp = (components, weight) => {
      let compTotal = 0;
      let totalPct = 0;
      components.forEach(c => {
        const data = scores[term]?.[c.key];
        const score = parseFloat(data?.score);
        const maxScore = parseFloat(data?.total);
        // Only count this component if both score AND total were explicitly entered
        if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
          compTotal += (score / maxScore * 100) * (c.pct / 100);
          totalPct += c.pct;
        }
      });
      return totalPct > 0 ? (compTotal / (totalPct / 100)) * weight : 0;
    };

    let total = 0;
    if (isLabCourse) {
      total += computeComp(lecComps, 0.60);
      total += computeComp(labComps, 0.40);
    } else {
      total += computeComp(lecComps, 1.0);
    }
    return total.toFixed(2);
  };

  // A term "has data" only if at least one component in it has a score + total entered
  const termHasData = (term) => {
    const allComps = [...(lectureComponents[term] || []), ...(labComponents[term] || [])];
    return allComps.some(c => {
      const data = scores[term]?.[c.key];
      return !isNaN(parseFloat(data?.score)) && !isNaN(parseFloat(data?.total));
    });
  };

  const computeOverallGrade = () => {
    const terms = ['Prelim', 'Midterm', 'Final'];
    const activeTotals = terms
      .filter(t => termHasData(t))
      .map(t => parseFloat(computeTermGrade(t)));
    if (activeTotals.length === 0) return '0.00';
    return (activeTotals.reduce((a, b) => a + b, 0) / activeTotals.length).toFixed(2);
  };

  const convertToGrade = (percentage) => {
    const num = parseFloat(percentage);
    if (num >= 98) return '1.00';
    if (num >= 95) return '1.25';
    if (num >= 92) return '1.50';
    if (num >= 89) return '1.75';
    if (num >= 86) return '2.00';
    if (num >= 83) return '2.25';
    if (num >= 80) return '2.50';
    if (num >= 76) return '2.75';
    if (num >= 75) return '3.00';
    return '5.00';
  };

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const overallPct = computeOverallGrade();
      const overallGrade = convertToGrade(overallPct);
      
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
          final_percentage: overallPct,
          final_grade: overallGrade,
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

  const activeComps = {
    lec: lectureComponents[activeTerm] || [],
    lab: labComponents[activeTerm] || []
  };

  return (
    <div className="gradeDetailOverlay">
      <div className="gradeDetailContainer">

        <div className="gradeDetailHeader">
          <div>
            <h3>{course.course_code} - {course.course_name}</h3>
            <span className="gradeDetailSubtitle">
              {isLabCourse ? 'Lecture + Laboratory' : 'Lecture Only'} | {course.total_units || (course.lec_units + course.lab_units)} Units
            </span>
          </div>
          <button className="gradeDetailCloseBt" onClick={onClose}>&times;</button>
        </div>

        {/* Term Tabs */}
        <div className="gradeDetailTermTabs">
          {terms.map(term => (
            <button
              key={term}
              className={`gradeDetailTermTab ${activeTerm === term ? 'active' : ''}`}
              onClick={() => setActiveTerm(term)}
            >
              {term.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="gradeDetailFormScroll">
          <div className="gradeDetailFormContent">

            {/* LECTURE SECTION */}
            {activeComps.lec.length > 0 && (
              <div className="gradeDetailSection">
                <h4 className="gradeDetailSectionTitle">
                  LECTURE ({isLabCourse ? '60%' : '100%'})
                </h4>
                {activeComps.lec.map(comp => (
                  <div className="gradeDetailRow" key={comp.key + activeTerm}>
                    <label>{comp.name} ({comp.pct}%)</label>
                    <div className="gradeDetailInputGroup">
                      <input 
                        type="number" 
                        className="gradeDetailInput"
                        value={scores[activeTerm]?.[comp.key]?.score || ''}
                        onChange={(e) => handleScoreChange(activeTerm, comp.key, 'score', e.target.value)}
                        min="0" step="0.01"
                        placeholder="Score"
                      />
                      <span className="gradeDetailSlash">/</span>
                      <input 
                        type="number" 
                        className="gradeDetailInput"
                        value={scores[activeTerm]?.[comp.key]?.total || ''}
                        onChange={(e) => handleScoreChange(activeTerm, comp.key, 'total', e.target.value)}
                        min="0" step="0.01"
                        placeholder="Total"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LAB SECTION */}
            {isLabCourse && activeComps.lab.length > 0 && (
              <div className="gradeDetailSection">
                <h4 className="gradeDetailSectionTitle">LABORATORY (40%)</h4>
                {activeComps.lab.map(comp => (
                  <div className="gradeDetailRow" key={comp.key + activeTerm}>
                    <label>{comp.name} ({comp.pct}%)</label>
                    <div className="gradeDetailInputGroup">
                      <input 
                        type="number" 
                        className="gradeDetailInput"
                        value={scores[activeTerm]?.[comp.key]?.score || ''}
                        onChange={(e) => handleScoreChange(activeTerm, comp.key, 'score', e.target.value)}
                        min="0" step="0.01"
                        placeholder="Score"
                      />
                      <span className="gradeDetailSlash">/</span>
                      <input 
                        type="number" 
                        className="gradeDetailInput"
                        value={scores[activeTerm]?.[comp.key]?.total || ''}
                        onChange={(e) => handleScoreChange(activeTerm, comp.key, 'total', e.target.value)}
                        min="0" step="0.01"
                        placeholder="Total"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CURRENT TERM GRADE */}
            <div className="gradeDetailTermGrade">
              <span>{activeTerm} GRADE</span>
              <span className="gradeDetailTermGradeValue">
                {computeTermGrade(activeTerm)}% → {convertToGrade(computeTermGrade(activeTerm))}
              </span>
            </div>

            {/* OVERALL GRADE */}
            <div className="gradeDetailTotalRow">
              <label>OVERALL GRADE</label>
              <div style={{ textAlign: 'right' }}>
                <span className="gradeDetailTotal">{computeOverallGrade()}%</span>
                <span style={{ marginLeft: '12px', fontSize: '1rem', fontWeight: 700, opacity: 0.9 }}>
                  → {convertToGrade(computeOverallGrade())}
                </span>
              </div>
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
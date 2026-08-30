import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../GlobalForm.css';
import '../../GlobalOverlay.css';
import '../../Global.css';

/**
 * ============================================================================
 * AddGrade
 * ============================================================================
 * Modal for viewing and updating a student's grades, organized the same way
 * their curriculum is: Year Level -> Semester -> [Prelim / Midterm / Final
 * tables]. This mirrors TermGrade.js's own layout on purpose - the editor
 * should visually match the document it produces.
 *
 * Each semester renders three term tables. Columns are fixed (Quizzes/AT,
 * Exam, Lab Practical, OSCE/OSPE, Grade, Remarks) matching TermGrade.js's
 * structure - a cell simply has no input when a course's category doesn't
 * need that component (e.g. a lecture-only course has no Lab Practical
 * cell), rather than varying the column set per course.
 *
 * Courses can be added beyond the curriculum's default list (retakes,
 * electives, carried-over courses for shifting/irregular students) via a
 * course picker fetched from GET /admin/courses/gradable, and removed via
 * a delete button on each row - both act at the semester level, since a
 * course's row spans all three term tables at once.
 *
 * Every field a course needs (which components, at what weight, in which
 * term) comes from the backend as `enterableFields` - nothing about
 * GradingEngine's weight tables is duplicated here; the preview functions
 * below only replicate the ALGORITHM shape (local re-weighting, cumulative
 * re-weighting), never the actual weight numbers themselves.
 *
 * Props:
 *   - onClose:   () => void         called when the modal is dismissed
 *   - onSuccess: () => void         called after a successful save
 *   - student:   { student_id, first_name, last_name, student_number, ... }
 *                the row selected from the masterlist table
 * ============================================================================
 */

const TERMS = ['Prelim', 'Midterm', 'Final'];

const AddGrade = ({ onClose, onSuccess, student }) => {
  const studentId = student?.student_id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [meta, setMeta] = useState(null);

  // Curriculum structure: [{ yearLevel, semesters: [{ semesterId, semesterLabel, courses: [...] }] }]
  const [years, setYears] = useState([]);

  const [openYears, setOpenYears] = useState(new Set());

  // Editable grade state, keyed by courseId:
  // { [courseId]: { yearLevel, semesterId, category, enterableFields, scoresByTerm } }
  const [gradesMap, setGradesMap] = useState({});

  // Which course IDs are currently displayed per semester (curriculum
  // defaults + manually added), keyed by `${yearLevel}-${semesterId}`.
  const [courseIdsBySemester, setCourseIdsBySemester] = useState({});

  // Full catalog of addable courses (with category/enterableFields
  // pre-resolved server-side), fetched once for the "add course" pickers.
  const [gradableCourses, setGradableCourses] = useState([]);

  // Which semester's "add course" picker is currently open, if any.
  const [addingToSemesterKey, setAddingToSemesterKey] = useState(null);
  const [courseToAdd, setCourseToAdd] = useState('');

  // ---------------------------------------------------------------------
  // Load the grade sheet + gradable course catalog on open.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!studentId) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem('token');

        const [sheetRes, coursesRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/courses/gradable`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const sheetJson = await sheetRes.json();
        const coursesJson = await coursesRes.json();

        if (!sheetJson.success) {
          setError(sheetJson.message || 'Failed to load grade sheet.');
          return;
        }

        const sheet = sheetJson.data;
        setMeta({
          programName: sheet.programName,
          programAbbr: sheet.programAbbr,
          totalYears: sheet.totalYears,
          currentYearLevel: sheet.currentYearLevel,
          gradeScale: sheet.gradeScale
        });
        setYears(sheet.years);

        const map = {};
        const idsBySemester = {};
        sheet.years.forEach((yearBlock) => {
          yearBlock.semesters.forEach((sem) => {
            const semKey = `${yearBlock.yearLevel}-${sem.semesterId}`;
            idsBySemester[semKey] = sem.courses.map((c) => c.courseId);

            sem.courses.forEach((course) => {
              map[course.courseId] = {
                yearLevel: yearBlock.yearLevel,
                semesterId: sem.semesterId,
                courseCode: course.courseCode,
                courseName: course.courseName,
                units: course.units,
                category: course.category,
                enterableFields: course.enterableFields,
                scoresByTerm: {
                  Prelim: { ...course.scoresByTerm?.Prelim },
                  Midterm: { ...course.scoresByTerm?.Midterm },
                  Final: { ...course.scoresByTerm?.Final }
                }
              };
            });
          });
        });
        setGradesMap(map);
        setCourseIdsBySemester(idsBySemester);
        setOpenYears(new Set([sheet.currentYearLevel]));

        if (coursesJson.success) setGradableCourses(coursesJson.data);
      } catch (err) {
        console.error('Error fetching grade sheet:', err);
        setError('Failed to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [studentId]);

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  const ordinalYear = (n) => {
    const labels = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' };
    return labels[n] || `Year ${n}`;
  };

  const toggleYear = (yearLevel) => {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(yearLevel)) next.delete(yearLevel);
      else next.add(yearLevel);
      return next;
    });
  };

  /** Finds a course's applicable field for a given term (its own term, or a spans-all-terms field). */
  const getFieldForTerm = (enterableFields, component, term) => (
    (enterableFields || []).find((f) => f.component === component && (f.term === null || f.term === term)) || null
  );

  /** Updates one component score for one course/term, clamped to 0-100. */
  const handleScoreChange = (courseId, term, component, rawValue) => {
    if (rawValue !== '' && (Number(rawValue) < 0 || Number(rawValue) > 100)) return;

    setGradesMap((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        scoresByTerm: {
          ...prev[courseId].scoresByTerm,
          [term]: { ...prev[courseId].scoresByTerm[term], [component]: rawValue }
        }
      }
    }));
  };

  /**
   * Mirrors GradingEngine.percentageToGradePoint() so the live preview
   * can never drift from what the backend actually computes and saves.
   */
  const percentageToGradePoint = (percentage, scale) => {
    if (percentage < scale.passingPercentage) return scale.failingPoint;
    const steps = Math.floor((100 - percentage) / scale.percentageStep);
    const gradePoint = scale.highestPoint + scale.pointStep * steps;
    return Math.min(gradePoint, scale.lowestPassingPoint);
  };

  /**
   * Period-local term preview - mirrors GradingEngine.computeTermGrade():
   * only this term's applicable fields, re-weighted to sum to 100% among
   * themselves, using only whatever's been entered for THIS term.
   */
  const previewTermGrade = (enterableFields, term, scoresByTerm) => {
    if (!meta) return { pointGrade: null };

    const termScores = scoresByTerm[term] || {};
    const applicable = (enterableFields || []).filter((f) => f.term === null || f.term === term);
    const provided = applicable.filter((f) => termScores[f.component] !== undefined && termScores[f.component] !== '');

    if (provided.length === 0) return { pointGrade: null };

    const localWeightSum = provided.reduce((sum, f) => sum + f.weight, 0);
    const weightedSum = provided.reduce(
      (sum, f) => sum + (Number(termScores[f.component]) * f.weight) / localWeightSum, 0
    );
    const average = Math.round(weightedSum * 100) / 100;
    return { pointGrade: percentageToGradePoint(average, meta.gradeScale) };
  };

  /**
   * Cumulative preview - mirrors GradingEngine.computeCumulativeGrade():
   * spans-all-terms fields average whichever terms have an entry; single-
   * term fields use that term directly. Incomplete -> 'INC', not a guess.
   */
  const previewCumulativeGrade = (enterableFields, scoresByTerm) => {
    if (!meta || !enterableFields) return { finalGrade: null, remarks: null };

    const resolved = enterableFields.map((f) => {
      if (f.term === null) {
        const values = TERMS
          .map((t) => scoresByTerm[t]?.[f.component])
          .filter((v) => v !== undefined && v !== '')
          .map(Number);
        return { weight: f.weight, score: values.length ? values.reduce((s, v) => s + v, 0) / values.length : null };
      }
      const v = scoresByTerm[f.term]?.[f.component];
      return { weight: f.weight, score: (v === undefined || v === '') ? null : Number(v) };
    });

    const provided = resolved.filter((r) => r.score !== null);
    if (provided.length === 0) return { finalGrade: null, remarks: null };

    const isComplete = provided.length === resolved.length;
    const weightSum = provided.reduce((sum, r) => sum + r.weight, 0);
    const weightedSum = provided.reduce((sum, r) => sum + (r.score * r.weight) / weightSum, 0);
    const percentage = Math.round(weightedSum * 100) / 100;
    const finalGrade = percentageToGradePoint(percentage, meta.gradeScale);
    const remarks = !isComplete ? 'INC' : (finalGrade === meta.gradeScale.failingPoint ? 'F' : 'P');

    return { finalGrade, remarks };
  };

  const renderRemarksBadge = (remarks) => {
    if (!remarks) return <span style={{ color: '#aaa' }}>—</span>;
    if (remarks === 'INC') {
      return <span className="statusBadge" style={{ backgroundColor: '#fff3cd', color: '#8a6512' }}>INC</span>;
    }
    return (
      <span className={`statusBadge ${remarks === 'P' ? 'active-bg' : 'inactive-bg'}`}>
        {remarks === 'P' ? 'Passed' : 'Failed'}
      </span>
    );
  };

  // ---------------------------------------------------------------------
  // Add / delete rows
  // ---------------------------------------------------------------------

  const handleAddCourse = (yearLevel, semesterId) => {
    const semKey = `${yearLevel}-${semesterId}`;
    if (!courseToAdd) return;

    const course = gradableCourses.find((c) => c.courseId === Number(courseToAdd));
    if (!course) return;

    setGradesMap((prev) => ({
      ...prev,
      [course.courseId]: {
        yearLevel,
        semesterId,
        courseCode: course.courseCode,
        courseName: course.courseName,
        units: course.units,
        category: course.category,
        enterableFields: course.enterableFields,
        scoresByTerm: { Prelim: {}, Midterm: {}, Final: {} }
      }
    }));

    setCourseIdsBySemester((prev) => ({
      ...prev,
      [semKey]: [...(prev[semKey] || []), course.courseId]
    }));

    setCourseToAdd('');
    setAddingToSemesterKey(null);
  };

  const handleRemoveCourse = (yearLevel, semesterId, courseId) => {
    const semKey = `${yearLevel}-${semesterId}`;
    setCourseIdsBySemester((prev) => ({
      ...prev,
      [semKey]: (prev[semKey] || []).filter((id) => id !== courseId)
    }));
    setGradesMap((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
  };

  // ---------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const entries = Object.entries(gradesMap)
        .filter(([, v]) => TERMS.some((t) => Object.values(v.scoresByTerm[t] || {}).some((val) => val !== '' && val !== undefined)))
        .map(([courseId, v]) => ({
          courseId: Number(courseId),
          yearLevel: v.yearLevel,
          semesterId: v.semesterId,
          scoresByTerm: v.scoresByTerm
        }));

      if (entries.length === 0) {
        alert('Enter at least one grade before saving.');
        setIsSubmitting(false);
        return;
      }

      const token = sessionStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ grades: entries })
        }
      );
      const data = await response.json();

      if (data.success) {
        alert('Student grades updated successfully!');
        onSuccess();
      } else {
        alert(data.message || 'Failed to save grades.');
      }
    } catch (err) {
      console.error('Error saving grades:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!studentId) return null;

  const studentLabel = student.full_name || `${student.last_name || ''}, ${student.first_name || ''}`.trim();

  // ---------------------------------------------------------------------
  // Render: one table per term for a given semester's current course list.
  // ---------------------------------------------------------------------
  const renderTermTable = (yearLevel, semesterId, term, courseIds) => {
    // Only show the Lab / Special Exam columns if something in this
    // semester actually needs them - avoids permanently-empty columns
    // for programs with no lab courses.
    const semesterCourses = courseIds.map((id) => gradesMap[id]).filter(Boolean);
    const needsLab = semesterCourses.some((c) => (c.enterableFields || []).some((f) => f.component === 'Unit Practical Exam'));
    const specialExamField = term === 'Final'
      ? semesterCourses.map((c) => getFieldForTerm(c.enterableFields, 'Comprehensive Examination', 'Final') || getFieldForTerm(c.enterableFields, 'Revalida Examination', 'Final')).find(Boolean)
      : null;

    return (
      <div key={term} style={{ marginBottom: '1rem' }}>
        <h6 style={{ margin: '0 0 6px', fontSize: '0.8rem', fontWeight: 700, color: '#3d1616', textTransform: 'uppercase' }}>
          {term} Term
        </h6>
        <table className="Table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course</th>
              <th>Quizzes/AT</th>
              <th>{term} Exam</th>
              {needsLab && <th>Lab Practical</th>}
              {needsLab && <th>OSCE/OSPE</th>}
              {specialExamField && <th>{specialExamField.component}</th>}
              <th>Grade</th>
              <th>Remarks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courseIds.map((courseId) => {
              const entry = gradesMap[courseId];
              if (!entry) return null;

              const termScores = entry.scoresByTerm[term] || {};
              const quizField = getFieldForTerm(entry.enterableFields, 'Quizzes/AT', term);
              const examField = getFieldForTerm(entry.enterableFields, `${term} Exam`, term);
              const labField = needsLab ? getFieldForTerm(entry.enterableFields, 'Unit Practical Exam', term) : null;
              const osceField = needsLab ? getFieldForTerm(entry.enterableFields, `${term} OSCE/OSPE`, term) : null;
              const ownSpecialField = specialExamField
                ? getFieldForTerm(entry.enterableFields, specialExamField.component, term)
                : null;

              const { pointGrade } = previewTermGrade(entry.enterableFields, term, entry.scoresByTerm);
              const cumulative = term === 'Final' ? previewCumulativeGrade(entry.enterableFields, entry.scoresByTerm) : null;

              const renderInput = (field, component) => {
                if (!field) return <span style={{ color: '#ccc' }}>—</span>;
                return (
                  <input
                    type="number" min="0" max="100" step="0.01"
                    value={termScores[component] ?? ''}
                    onChange={(e) => handleScoreChange(courseId, term, component, e.target.value)}
                    style={{ width: '65px', padding: '4px 6px' }}
                  />
                );
              };

              return (
                <tr key={courseId}>
                  <td>{entry.courseCode}</td>
                  <td>{entry.courseName}</td>
                  <td>{renderInput(quizField, 'Quizzes/AT')}</td>
                  <td>{renderInput(examField, `${term} Exam`)}</td>
                  {needsLab && <td>{renderInput(labField, 'Unit Practical Exam')}</td>}
                  {needsLab && <td>{renderInput(osceField, `${term} OSCE/OSPE`)}</td>}
                  {specialExamField && (
                    <td>{ownSpecialField ? renderInput(ownSpecialField, specialExamField.component) : <span style={{ color: '#ccc' }}>—</span>}</td>
                  )}
                  <td>
                    {term === 'Final'
                      ? (cumulative.finalGrade !== null ? cumulative.finalGrade.toFixed(2) : '—')
                      : (pointGrade !== null ? pointGrade.toFixed(2) : '—')}
                  </td>
                  <td>{term === 'Final' ? renderRemarksBadge(cumulative.remarks) : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="RemoveBtn"
                      onClick={() => handleRemoveCourse(yearLevel, semesterId, courseId)}
                      title="Remove this course from the sheet"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const modalContent = (
    <div className="modalOverlay">
      <form onSubmit={handleSubmit} className="modalContainer" style={{ display: 'flex', flexDirection: 'column', maxWidth: '1200px' }}>

        <div className="modalHeader">
          <h3 className="modalTitle">STUDENT GRADES</h3>
          <div className="CloseBtnArea">
            <button type="button" className="CloseBtn" onClick={onClose} disabled={isSubmitting}>&times;</button>
          </div>
        </div>

        <div className="modalScrollArea">
          {loading ? (
            <p>Loading grade sheet...</p>
          ) : error ? (
            <p style={{ color: '#c62828' }}>{error}</p>
          ) : (
            <>
              <div className="formSection" style={{ marginBottom: '0.5rem' }}>
                <h4 className="sectionHeading" style={{ marginBottom: '0.25rem' }}>
                  {studentLabel} {student.student_number ? `(${student.student_number})` : ''}
                </h4>
                {meta && (
                  <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
                    {meta.programName} {meta.programAbbr ? `(${meta.programAbbr})` : ''}
                    {' — '}Currently {ordinalYear(meta.currentYearLevel)}
                  </p>
                )}
              </div>

              {years.map((yearBlock) => {
                const isYearOpen = openYears.has(yearBlock.yearLevel);
                const isCurrentYear = meta && yearBlock.yearLevel === meta.currentYearLevel;

                return (
                  <div key={yearBlock.yearLevel} className="accordionToggleArea" style={{ flexDirection: 'column' }}>
                    <button
                      type="button"
                      className="accordionBtn"
                      onClick={() => toggleYear(yearBlock.yearLevel)}
                      style={isCurrentYear ? { borderColor: '#3d1616', borderWidth: '2px' } : undefined}
                    >
                      <span>{ordinalYear(yearBlock.yearLevel)}{isCurrentYear ? ' (Current Year Level)' : ''}</span>
                      <span className={`arrow ${isYearOpen ? 'open' : ''}`}>&#9660;</span>
                    </button>

                    {isYearOpen && (
                      <div className="detailedInfoContainer">
                        {yearBlock.semesters.map((sem) => {
                          const semKey = `${yearBlock.yearLevel}-${sem.semesterId}`;
                          const courseIds = courseIdsBySemester[semKey] || [];
                          const usedIds = new Set(courseIds);
                          const addableCourses = gradableCourses.filter((c) => !usedIds.has(c.courseId));

                          return (
                            <div key={sem.semesterId} style={{ marginBottom: '1.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h5 className="subSectionHeading" style={{ margin: 0, color: '#555' }}>{sem.semesterLabel}</h5>
                                <button
                                  type="button"
                                  className="AddBtn"
                                  style={{ height: '30px', fontSize: '0.75rem' }}
                                  onClick={() => setAddingToSemesterKey(addingToSemesterKey === semKey ? null : semKey)}
                                >
                                  + Add Course
                                </button>
                              </div>

                              {addingToSemesterKey === semKey && (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                  <select
                                    value={courseToAdd}
                                    onChange={(e) => setCourseToAdd(e.target.value)}
                                    style={{ flex: 1 }}
                                  >
                                    <option value="">-- Select a course to add --</option>
                                    {addableCourses.map((c) => (
                                      <option key={c.courseId} value={c.courseId}>
                                        {c.courseCode} — {c.courseName}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="submitBtn"
                                    style={{ padding: '0 1rem' }}
                                    onClick={() => handleAddCourse(yearBlock.yearLevel, sem.semesterId)}
                                    disabled={!courseToAdd}
                                  >
                                    Add
                                  </button>
                                </div>
                              )}

                              {courseIds.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: '#999' }}>No courses in this semester yet.</p>
                              ) : (
                                TERMS.map((term) => renderTermTable(yearBlock.yearLevel, sem.semesterId, term, courseIds))
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <div className="modalFooter">
            <button type="button" className="cancelBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
            <button type="submit" className="submitBtn" disabled={isSubmitting || loading || !!error}>
              {isSubmitting ? 'SAVING...' : 'SAVE GRADES'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  const portalTarget = document.getElementById('portal-root') || document.body;
  return ReactDOM.createPortal(modalContent, portalTarget);
};

export default AddGrade;
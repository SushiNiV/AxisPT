import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../../GlobalForm.css';
import '../../../GlobalOverlay.css';
import '../../../Global.css';
import ConfirmationModal from '../ConfirmationModal';

/**
 * ============================================================================
 * AddGrade
 * ============================================================================
 * Modal for viewing and updating a student's grades, organized the same way
 * their curriculum is: Year Level -> Semester -> [Prelim / Midterm / Final
 * tables]. This mirrors TermGrade.js's layout on purpose - the editor
 * should visually match the document it produces.
 *
 * RETAKES: the same course can appear in more than one (yearLevel, semesterId)
 * slot - e.g. a Y1 S1 fail and a Y2 S1 retake. Editable state is keyed by a
 * composite `courseId-yearLevel-semesterId` so the two attempts keep their
 * own scores and never overwrite each other on save.
 *
 * PREREQUISITES: every row carries prereqEligible + prereqMissing (codes)
 * + prereqMissingIds (course IDs). Ineligible rows show a passive orange ⚠
 * with a tooltip listing the missing prereqs. On save, if any ineligible row
 * would be written, a single confirmation modal lists them. Confirming
 * records the override (rows in grade_prereq_overrides + a history_logs entry).
 *
 * COURSE PICKER: the "+ Add Course" list is filtered per year block:
 *   - Only courses in the student's curriculum
 *   - Curriculum year level must be ≤ the block's year
 *   - Courses already passed by the student are hidden
 *   - Courses already present in this semester's row set are hidden
 *
 * FUTURE-YEAR LOCK: higher year accordions render disabled. Backend also
 * rejects grades for year levels the student hasn't reached.
 * ============================================================================
 */

const TERMS = ['Prelim', 'Midterm', 'Final'];

const makeAttemptKey = (courseId, yearLevel, semesterId) =>
  `${courseId}-${yearLevel}-${semesterId}`;

const GRADE_TABLE_STYLE_OVERRIDES = `
  .gradeTermTable th {
    position: static;
    top: auto;
  }
`;

const AddGrade = ({ onClose, onSuccess, student }) => {
  const studentId = student?.student_id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [meta, setMeta] = useState(null);
  const [years, setYears] = useState([]);
  const [openYears, setOpenYears] = useState(new Set());
  const [gradesMap, setGradesMap] = useState({});
  const [attemptKeysBySemester, setAttemptKeysBySemester] = useState({});
  const [gradableCourses, setGradableCourses] = useState([]);
  const [addingToSemesterKey, setAddingToSemesterKey] = useState(null);
  const [courseToAdd, setCourseToAdd] = useState('');

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

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
          fetch(`${process.env.REACT_APP_API_URL}/admin/students/${studentId}/gradable-courses`, {
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
        const keysBySemester = {};
        sheet.years.forEach((yearBlock) => {
          yearBlock.semesters.forEach((sem) => {
            const semKey = `${yearBlock.yearLevel}-${sem.semesterId}`;
            keysBySemester[semKey] = sem.courses.map((c) =>
              makeAttemptKey(c.courseId, yearBlock.yearLevel, sem.semesterId)
            );

            sem.courses.forEach((course) => {
              const key = makeAttemptKey(course.courseId, yearBlock.yearLevel, sem.semesterId);
              map[key] = {
                courseId: course.courseId,
                yearLevel: yearBlock.yearLevel,
                semesterId: sem.semesterId,
                courseCode: course.courseCode,
                courseName: course.courseName,
                units: course.units,
                category: course.category,
                enterableFields: course.enterableFields,
                attemptCount: course.attemptCount || 1,
                prereqEligible: course.prereqEligible !== false,
                prereqMissing: course.prereqMissing || [],
                prereqMissingIds: course.prereqMissingIds || [],
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
        setAttemptKeysBySemester(keysBySemester);
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

  const getFieldForTerm = (enterableFields, component, term) => (
    (enterableFields || []).find((f) => f.component === component && (f.term === null || f.term === term)) || null
  );

  const handleScoreChange = (attemptKey, term, component, rawValue) => {
    if (rawValue !== '' && (Number(rawValue) < 0 || Number(rawValue) > 100)) return;

    setGradesMap((prev) => ({
      ...prev,
      [attemptKey]: {
        ...prev[attemptKey],
        scoresByTerm: {
          ...prev[attemptKey].scoresByTerm,
          [term]: { ...prev[attemptKey].scoresByTerm[term], [component]: rawValue }
        }
      }
    }));
  };

  const percentageToGradePoint = (percentage, scale) => {
    if (percentage < scale.passingPercentage) return scale.failingPoint;
    const steps = Math.floor((100 - percentage) / scale.percentageStep);
    const gradePoint = scale.highestPoint + scale.pointStep * steps;
    return Math.min(gradePoint, scale.lowestPassingPoint);
  };

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
    if (!remarks) return renderPending('Grade not yet computed');
    if (remarks === 'INC') {
      return <span className="statusBadge" style={{ backgroundColor: '#fff3cd', color: '#8a6512' }}>INC</span>;
    }
    return (
      <span className={`statusBadge ${remarks === 'P' ? 'active-bg' : 'inactive-bg'}`}>
        {remarks === 'P' ? 'Passed' : 'Failed'}
      </span>
    );
  };

  const renderNA = () => <span style={{ color: '#d5d5d5' }}>—</span>;

  const renderPending = (label = 'Awaiting scores') => (
    <span style={{ color: '#999', fontStyle: 'italic' }} title={label}>—</span>
  );

  const insertCourseRow = (course, yearLevel, semesterId) => {
    const semKey = `${yearLevel}-${semesterId}`;
    const attemptKey = makeAttemptKey(course.courseId, yearLevel, semesterId);

    setGradesMap((prev) => ({
      ...prev,
      [attemptKey]: {
        courseId: course.courseId,
        yearLevel,
        semesterId,
        courseCode: course.courseCode,
        courseName: course.courseName,
        units: course.units,
        category: course.category,
        enterableFields: course.enterableFields,
        attemptCount: 1,
        prereqEligible: course.prereqEligible !== false,
        prereqMissing: course.prereqMissing || [],
        prereqMissingIds: course.prereqMissingIds || [],
        scoresByTerm: { Prelim: {}, Midterm: {}, Final: {} }
      }
    }));

    setAttemptKeysBySemester((prev) => ({
      ...prev,
      [semKey]: [...(prev[semKey] || []), attemptKey]
    }));

    setCourseToAdd('');
    setAddingToSemesterKey(null);
  };

  const handleAddCourse = (yearLevel, semesterId) => {
    if (!courseToAdd) return;

    const course = gradableCourses.find((c) => c.courseId === Number(courseToAdd));
    if (!course) return;

    // No confirmation here anymore — the save-time prompt is the only gate.
    insertCourseRow(course, yearLevel, semesterId);
  };

  const handleRemoveCourse = (yearLevel, semesterId, attemptKey) => {
    openConfirm({
      title: 'Remove Course',
      message: 'Are you sure you want to remove this course from the grade sheet? Any unsaved entries for this course will be lost.',
      variant: 'warning',
      confirmLabel: 'REMOVE',
      onConfirm: () => {
        const semKey = `${yearLevel}-${semesterId}`;
        setAttemptKeysBySemester((prev) => ({
          ...prev,
          [semKey]: (prev[semKey] || []).filter((k) => k !== attemptKey)
        }));
        setGradesMap((prev) => {
          const next = { ...prev };
          delete next[attemptKey];
          return next;
        });
        closeConfirm();
      },
      onCancel: closeConfirm,
    });
  };

  const submitGrades = async (entries) => {
    setIsSubmitting(true);
    try {
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
        showSuccess('Grades Saved', "The student's grades have been updated successfully.");
      } else {
        openAlert('Save Failed', data.message || 'Failed to save grades.', 'danger');
      }
    } catch (err) {
      console.error('Error saving grades:', err);
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const entries = Object.entries(gradesMap)
      .filter(([, v]) => TERMS.some((t) => Object.values(v.scoresByTerm[t] || {}).some((val) => val !== '' && val !== undefined)))
      .map(([key, v]) => ({
        _attemptKey: key,
        courseId: v.courseId,
        yearLevel: v.yearLevel,
        semesterId: v.semesterId,
        scoresByTerm: v.scoresByTerm,
        prereqEligible: v.prereqEligible !== false,
        prereqMissing: v.prereqMissing || [],
        prereqMissingIds: v.prereqMissingIds || []
      }));

    if (entries.length === 0) {
      openAlert('No Grades Entered', 'Please enter at least one grade before saving.', 'warning');
      return;
    }

    const overrideNeeded = entries.filter((en) => !en.prereqEligible);

    if (overrideNeeded.length > 0) {
      const labelled = overrideNeeded
        .map((en) => {
          const metaRow = gradesMap[en._attemptKey];
          return `• ${metaRow?.courseCode || `#${en.courseId}`} — missing: ${en.prereqMissing.join(', ')}`;
        })
        .join('\n');

      openConfirm({
        title: 'Prerequisite(s) Not Met',
        message: (
          <>
            The following course(s) have unmet prerequisites:
            <pre style={{ margin: '8px 0', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{labelled}</pre>
            Save anyway? This will be recorded in the audit log.
          </>
        ),
        variant: 'warning',
        confirmLabel: 'SAVE ANYWAY',
        cancelLabel: 'CANCEL',
        onConfirm: () => {
          closeConfirm();
          const finalEntries = entries.map((en) => ({
            courseId: en.courseId,
            yearLevel: en.yearLevel,
            semesterId: en.semesterId,
            scoresByTerm: en.scoresByTerm,
            missingPrereqs: !en.prereqEligible ? en.prereqMissingIds : []
          }));
          submitGrades(finalEntries);
        },
        onCancel: closeConfirm
      });
      return;
    }

    const finalEntries = entries.map((en) => ({
      courseId: en.courseId,
      yearLevel: en.yearLevel,
      semesterId: en.semesterId,
      scoresByTerm: en.scoresByTerm,
      missingPrereqs: []
    }));
    submitGrades(finalEntries);
  };

  if (!studentId) return null;

  const studentLabel = student.full_name || `${student.last_name || ''}, ${student.first_name || ''}`.trim();

  const renderTermTable = (yearLevel, semesterId, term, attemptKeys) => {
    const semesterAttempts = attemptKeys.map((k) => gradesMap[k]).filter(Boolean);
    const needsLab = semesterAttempts.some((c) => (c.enterableFields || []).some((f) => f.component === 'Unit Practical Exam'));
    const specialExamField = term === 'Final'
      ? semesterAttempts.map((c) => getFieldForTerm(c.enterableFields, 'Comprehensive Examination', 'Final') || getFieldForTerm(c.enterableFields, 'Revalida Examination', 'Final')).find(Boolean)
      : null;

    return (
      <div key={term} id={`term-${yearLevel}-${semesterId}-${term}`} style={{ marginBottom: '1rem', scrollMarginTop: '12px' }}>
        <h6 style={{ margin: '0 0 6px', fontSize: '0.8rem', fontWeight: 700, color: '#3d1616', textTransform: 'uppercase' }}>
          {term}
        </h6>
        <table className="Table gradeTermTable">
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
            {attemptKeys.map((attemptKey) => {
              const entry = gradesMap[attemptKey];
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
                if (!field) return renderNA();
                return (
                  <input
                    type="number" min="0" max="100" step="0.01"
                    value={termScores[component] ?? ''}
                    onChange={(e) => handleScoreChange(attemptKey, term, component, e.target.value)}
                    style={{ width: '65px', padding: '4px 6px' }}
                  />
                );
              };

              return (
                <tr key={attemptKey}>
                  <td>
                    {entry.courseCode}
                    {entry.attemptCount > 1 && (
                      <sup
                        title={`Retake — ${entry.attemptCount} attempts on file`}
                        style={{
                          marginLeft: '3px',
                          fontSize: '0.65rem',
                          color: '#c62828',
                          fontWeight: 700,
                          cursor: 'help',
                          letterSpacing: '0.5px',
                        }}
                      >
                        ×{entry.attemptCount}
                      </sup>
                    )}
                    {entry.prereqEligible === false && (
                      <sup
                        title={`Prerequisite(s) not met: ${entry.prereqMissing.join(', ')}`}
                        style={{
                          marginLeft: '3px',
                          fontSize: '0.75rem',
                          color: '#e65100',
                          fontWeight: 700,
                          cursor: 'help',
                        }}
                      >
                        ⚠
                      </sup>
                    )}
                  </td>
                  <td>{entry.courseName}</td>
                  <td>{renderInput(quizField, 'Quizzes/AT')}</td>
                  <td>{renderInput(examField, `${term} Exam`)}</td>
                  {needsLab && <td>{renderInput(labField, 'Unit Practical Exam')}</td>}
                  {needsLab && <td>{renderInput(osceField, `${term} OSCE/OSPE`)}</td>}
                  {specialExamField && (
                    <td>{ownSpecialField ? renderInput(ownSpecialField, specialExamField.component) : renderNA()}</td>
                  )}
                  <td>
                    {term === 'Final'
                      ? (cumulative.finalGrade !== null ? cumulative.finalGrade.toFixed(2) : renderPending('Final grade not yet computed - some scores are still missing'))
                      : (pointGrade !== null ? pointGrade.toFixed(2) : renderPending('No scores entered for this term yet'))}
                  </td>
                  <td>{term === 'Final' ? renderRemarksBadge(cumulative.remarks) : renderPending('Only shown on the Final table')}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(yearLevel, semesterId, attemptKey)}
                      title="Remove this course from the sheet"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'color 0.15s ease, background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#c62828'; e.currentTarget.style.backgroundColor = '#ffebee'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.backgroundColor = 'transparent'; }}
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
        <style>{GRADE_TABLE_STYLE_OVERRIDES}</style>

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
                  <p style={{ fontSize: '1rem', color: '#666', margin: 0 }}>
                    {meta.programName} {meta.programAbbr ? `(${meta.programAbbr})` : ''}
                    {' — '}Currently {ordinalYear(meta.currentYearLevel)}
                  </p>
                )}
              </div>

              {years.map((yearBlock) => {
                const isYearOpen = openYears.has(yearBlock.yearLevel);
                const isCurrentYear = meta && yearBlock.yearLevel === meta.currentYearLevel;
                const isFutureYear = meta && yearBlock.yearLevel > meta.currentYearLevel;

                return (
                  <div key={yearBlock.yearLevel} className="accordionToggleArea" style={{ flexDirection: 'column' }}>
                    <button
                      type="button"
                      className="accordionBtn"
                      onClick={() => !isFutureYear && toggleYear(yearBlock.yearLevel)}
                      disabled={isFutureYear}
                      style={{
                        ...(isCurrentYear ? { borderColor: '#3d1616', borderWidth: '2px' } : {}),
                        ...(isFutureYear ? { opacity: 0.45, cursor: 'not-allowed' } : {}),
                      }}
                      title={isFutureYear ? 'Student has not yet reached this year level' : ''}
                    >
                      <span>
                        {ordinalYear(yearBlock.yearLevel)}
                        {isCurrentYear ? ' (Current Year Level)' : ''}
                        {isFutureYear ? ' — Not yet enrolled' : ''}
                      </span>
                      <span className={`arrow ${isYearOpen ? 'open' : ''}`}>&#9660;</span>
                    </button>

                    {isYearOpen && !isFutureYear && (
                      <div className="detailedInfoContainer">
                        {yearBlock.semesters.map((sem) => {
                          const semKey = `${yearBlock.yearLevel}-${sem.semesterId}`;
                          const attemptKeys = attemptKeysBySemester[semKey] || [];

                          const usedCourseIds = new Set(
                            attemptKeys.map((k) => gradesMap[k]?.courseId).filter(Boolean)
                          );

                          const addableCourses = gradableCourses.filter((c) => {
                            if (usedCourseIds.has(c.courseId)) return false;
                            if (c.alreadyPassed === true) return false;
                            if (c.curriculumYearLevel && c.curriculumYearLevel > yearBlock.yearLevel) return false;
                            if (!c.curriculumYearLevel) return false;
                            return true;
                          });

                          return (
                            <div key={sem.semesterId} style={{ marginBottom: '1.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h5 className="subSectionHeading">{sem.semesterLabel}</h5>
                                <button
                                  type="button"
                                  className="AddBtn"
                                  style={{ height: '30px', fontSize: '0.75rem' }}
                                  onClick={() => setAddingToSemesterKey(addingToSemesterKey === semKey ? null : semKey)}
                                  title="Adds this course to the Prelim, Midterm, and Final tables below"
                                >
                                  + Add Course
                                </button>
                              </div>

                              {attemptKeys.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jump to:</span>
                                  {TERMS.map((t) => (
                                    <a
                                      key={t}
                                      href={`#term-${yearBlock.yearLevel}-${sem.semesterId}-${t}`}
                                      style={{ fontSize: '0.75rem', color: '#3d1616', fontWeight: 600, textDecoration: 'none' }}
                                    >
                                      {t}
                                    </a>
                                  ))}
                                  <span style={{ fontSize: '0.7rem', color: '#bbb' }}>· Adding a course applies it to all three terms</span>
                                </div>
                              )}

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

                              {attemptKeys.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: '#999' }}>No courses in this semester yet.</p>
                              ) : (
                                TERMS.map((term) => renderTermTable(yearBlock.yearLevel, sem.semesterId, term, attemptKeys))
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

  const portalTarget = document.getElementById('portal-root') || document.body;
  return ReactDOM.createPortal(modalContent, portalTarget);
};

export default AddGrade;
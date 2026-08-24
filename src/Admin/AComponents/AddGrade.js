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
 * their curriculum is: Year Level -> Semester -> Course.
 *
 * Each year level renders as a collapsible accordion (same visual language
 * as the "Detailed Information" accordion in AddStudent.js). The accordion
 * matching the student's current year level opens automatically once the
 * grade sheet loads; every other year can still be expanded and edited,
 * since grades are editable regardless of term.
 *
 * Every course row exposes three inputs - Prelim, Midterm, Final - matching
 * grade_components. The Final Grade and Remarks (P / F / INC) shown per row
 * are a live client-side preview computed with the same weights the backend
 * uses (returned alongside the grade sheet so the two can't drift apart);
 * the authoritative value is always recomputed server-side on save.
 *
 * Props:
 *   - onClose:   () => void         called when the modal is dismissed
 *   - onSuccess: () => void         called after a successful save
 *   - student:   { student_id, first_name, last_name, student_number, ... }
 *                the row selected from the masterlist table
 * ============================================================================
 */
const AddGrade = ({ onClose, onSuccess, student }) => {
  const studentId = student?.student_id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Grade-sheet metadata: program info, current year level, and the
  // grading rules (term weights / passing score) mirrored from the backend.
  const [meta, setMeta] = useState(null);

  // Curriculum structure: [{ yearLevel, semesters: [{ semesterId, semesterLabel, courses: [...] }] }]
  const [years, setYears] = useState([]);

  // Which year-level accordions are currently expanded.
  const [openYears, setOpenYears] = useState(new Set());

  // Editable grade state, keyed by courseId:
  // { [courseId]: { yearLevel, semesterId, prelim, midterm, final } }
  const [gradesMap, setGradesMap] = useState({});

  // ---------------------------------------------------------------------
  // Load the grade sheet whenever the target student changes.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!studentId) return;

    const fetchGradeSheet = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.message || 'Failed to load grade sheet.');
          return;
        }

        const sheet = data.data;
        setMeta({
          programName: sheet.programName,
          programAbbr: sheet.programAbbr,
          totalYears: sheet.totalYears,
          currentYearLevel: sheet.currentYearLevel,
          termWeights: sheet.termWeights,
          gradeScale: sheet.gradeScale
        });
        setYears(sheet.years);

        // Flatten the nested structure into a flat, editable lookup map.
        const map = {};
        sheet.years.forEach((yearBlock) => {
          yearBlock.semesters.forEach((sem) => {
            sem.courses.forEach((course) => {
              map[course.courseId] = {
                yearLevel: yearBlock.yearLevel,
                semesterId: sem.semesterId,
                prelim: course.prelim ?? '',
                midterm: course.midterm ?? '',
                final: course.final ?? ''
              };
            });
          });
        });
        setGradesMap(map);

        // Auto-open the accordion matching the student's current year level.
        setOpenYears(new Set([sheet.currentYearLevel]));
      } catch (err) {
        console.error('Error fetching grade sheet:', err);
        setError('Failed to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchGradeSheet();
  }, [studentId]);

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  /** Converts a numeric year level into its display label. */
  const ordinalYear = (n) => {
    const labels = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' };
    return labels[n] || `Year ${n}`;
  };

  /** Expands/collapses a single year-level accordion. */
  const toggleYear = (yearLevel) => {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(yearLevel)) next.delete(yearLevel);
      else next.add(yearLevel);
      return next;
    });
  };

  /** Updates one term score for one course, clamped to a 0-100 scale. */
  const handleScoreChange = (courseId, yearLevel, semesterId, term, rawValue) => {
    if (rawValue !== '' && (Number(rawValue) < 0 || Number(rawValue) > 100)) return;

    setGradesMap((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || { prelim: '', midterm: '', final: '' }),
        yearLevel,
        semesterId,
        [term]: rawValue
      }
    }));
  };

  /**
   * Mirrors GradeManageModel.percentageToGradePoint() so the live preview
   * can never drift from what the backend will actually compute and save.
   */
  const percentageToGradePoint = (percentage, scale) => {
    if (percentage < scale.passingPercentage) return scale.failingPoint;

    const steps = Math.floor((100 - percentage) / scale.percentageStep);
    const gradePoint = scale.highestPoint + scale.pointStep * steps;
    return Math.min(gradePoint, scale.lowestPassingPoint);
  };

  /**
   * Client-side preview of a course's final grade point + remarks, using
   * the exact same term weights and grade scale the backend applies on
   * save (both come straight from the API response — no local duplication
   * of the actual numbers, just the conversion steps).
   * Untouched courses (no scores entered at all) show no badge, so
   * future-year courses the student hasn't taken yet don't look "failed".
   */
  const previewGrade = (entry) => {
    if (!meta) return { finalGrade: null, remarks: null };

    const termKeyMap = { prelim: 'Prelim', midterm: 'Midterm', final: 'Final' };
    const anyEntered = ['prelim', 'midterm', 'final'].some((k) => entry[k] !== '' && entry[k] !== undefined);
    if (!anyEntered) return { finalGrade: null, remarks: null };

    const provided = Object.keys(termKeyMap).filter(
      (k) => entry[k] !== '' && entry[k] !== null && entry[k] !== undefined && !Number.isNaN(Number(entry[k]))
    );

    if (provided.length < 3) return { finalGrade: null, remarks: 'INC' };

    let weightedSum = 0;
    provided.forEach((k) => {
      weightedSum += (Number(entry[k]) * meta.termWeights[termKeyMap[k]]) / 100;
    });

    const percentage = Math.round(weightedSum * 100) / 100;
    const finalGrade = percentageToGradePoint(percentage, meta.gradeScale);
    const remarks = finalGrade === meta.gradeScale.failingPoint ? 'F' : 'P';
    return { finalGrade, remarks };
  };

  /** Renders the small P / F / INC badge, reusing the existing badge classes. */
  const renderRemarksBadge = (remarks) => {
    if (!remarks) return <span style={{ color: '#aaa' }}>—</span>;
    if (remarks === 'INC') {
      return (
        <span className="statusBadge" style={{ backgroundColor: '#fff3cd', color: '#8a6512' }}>
          INC
        </span>
      );
    }
    return (
      <span className={`statusBadge ${remarks === 'P' ? 'active-bg' : 'inactive-bg'}`}>
        {remarks === 'P' ? 'Passed' : 'Failed'}
      </span>
    );
  };

  // ---------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Only send rows that actually have at least one score entered -
      // untouched courses shouldn't create empty grade rows.
      const entries = Object.entries(gradesMap)
        .filter(([, v]) => v.prelim !== '' || v.midterm !== '' || v.final !== '')
        .map(([courseId, v]) => ({
          courseId: Number(courseId),
          yearLevel: v.yearLevel,
          semesterId: v.semesterId,
          prelim: v.prelim,
          midterm: v.midterm,
          final: v.final
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
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
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

  const studentLabel = student.full_name
    || `${student.last_name || ''}, ${student.first_name || ''}`.trim();

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  const modalContent = (
    <div className="modalOverlay">
      <form onSubmit={handleSubmit} className="modalContainer" style={{ display: 'flex', flexDirection: 'column', maxWidth: '1100px' }}>

        {/* Header */}
        <div className="modalHeader">
          <h3 className="modalTitle">STUDENT GRADES</h3>
          <div className="CloseBtnArea">
            <button type="button" className="CloseBtn" onClick={onClose} disabled={isSubmitting}>
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="modalScrollArea">

          {loading ? (
            <p>Loading grade sheet...</p>
          ) : error ? (
            <p style={{ color: '#c62828' }}>{error}</p>
          ) : (
            <>
              {/* Student / Program Summary */}
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

              {/* Per-Year Accordions */}
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
                      <span>
                        {ordinalYear(yearBlock.yearLevel)}
                        {isCurrentYear ? ' (Current Year Level)' : ''}
                      </span>
                      <span className={`arrow ${isYearOpen ? 'open' : ''}`}>&#9660;</span>
                    </button>

                    {isYearOpen && (
                      <div className="detailedInfoContainer">
                        {yearBlock.semesters.map((sem) => (
                          <div key={sem.semesterId}>
                            <h5 className="subSectionHeading" style={{ marginBottom: '8px', color: '#555' }}>
                              {sem.semesterLabel}
                            </h5>

                            <table className="Table">
                              <thead>
                                <tr>
                                  <th>Code</th>
                                  <th>Course</th>
                                  <th>Units</th>
                                  <th>Prelim</th>
                                  <th>Midterm</th>
                                  <th>Final</th>
                                  <th>Grade</th>
                                  <th>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sem.courses.map((course) => {
                                  const entry = gradesMap[course.courseId] || { prelim: '', midterm: '', final: '' };
                                  const { finalGrade, remarks } = previewGrade(entry);

                                  return (
                                    <tr key={course.courseId}>
                                      <td>{course.courseCode}</td>
                                      <td>{course.courseName}</td>
                                      <td>{course.units}</td>
                                      {['prelim', 'midterm', 'final'].map((term) => (
                                        <td key={term}>
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={entry[term]}
                                            onChange={(e) => handleScoreChange(
                                              course.courseId,
                                              yearBlock.yearLevel,
                                              sem.semesterId,
                                              term,
                                              e.target.value
                                            )}
                                            style={{ width: '70px', padding: '4px 6px' }}
                                          />
                                        </td>
                                      ))}
                                      <td>{finalGrade !== null ? finalGrade.toFixed(2) : '—'}</td>
                                      <td>{renderRemarksBadge(remarks)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Footer Actions */}
          <div className="modalFooter">
            <button type="button" className="cancelBtn" onClick={onClose} disabled={isSubmitting}>
              CANCEL
            </button>
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
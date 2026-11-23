import React, { useEffect } from 'react';
import './TermGrade.css';
import EditableField from './EditableField';

const Sk = ({ w = '100%', h = 12 }) => (
  <span className="tg-sk" aria-hidden="true" style={{ width: w, height: h }} />
);

const INFO_ROWS = [
  ['Name', 'Student No.', 'border'],
  ['Year Level & Section:', 'Semester:', 'border-bottom'],
  ['Parent/Legal Guardian Name:', 'Contact No:', 'border spacer'],
  ['Email:', 'Adviser:', 'border-bottom'],
];
const TERMS = ['PRELIMINARY TERM', 'MIDTERM', 'FINAL'];

const TermGradeSkeleton = () => (
  <div className="term-container density-cozy tg-sk-root" role="status" aria-busy="true" aria-label="Loading term grades">
    <div className="term-title">STUDENT TERM GRADE RECORDS</div>
    {INFO_ROWS.map(([a, b, cls]) => (
      <div key={a} className={`grid-row four-columns ${cls}`}>
        <div className="label-group"><span className="field-label">{a}</span></div>
        <div className="input-group"><Sk w="70%" /></div>
        <div className="label-group"><span className="field-label">{b}</span></div>
        <div className="input-group last-cell"><Sk w="60%" /></div>
      </div>
    ))}
    <div className="part-title align-left spacer">Grading System</div>
    <div className="border" style={{ padding: 8, display: 'grid', gap: 6 }}>
      <Sk w="90%" /><Sk w="75%" /><Sk w="60%" />
    </div>
    <div className="part-title align-left spacer">Probationary and Residency Policy</div>
    <div className="grid-row two-columns right-heavy border" style={{ padding: 8 }}>
      <div style={{ display: 'grid', gap: 6 }}><Sk w="85%" /><Sk w="80%" /><Sk w="82%" /></div>
      <div style={{ display: 'grid', gap: 6 }}><Sk w="70%" /><Sk w="50%" /></div>
    </div>
    {TERMS.map((term) => (
      <React.Fragment key={term}>
        <div className="part-title spacer">{term}</div>
        <table className="grade-table">
          <thead>
            <tr>{Array.from({ length: 11 }).map((_, i) => <th key={i}><Sk h={10} /></th>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, r) => (
              <tr key={r}>{Array.from({ length: 11 }).map((_, c) => <td key={c}><Sk h={10} /></td>)}</tr>
            ))}
          </tbody>
        </table>
      </React.Fragment>
    ))}
  </div>
);

const TermGrade = ({ data, loading = false, error = null, onReady, isEditing = false, onUpdate }) => {
  useEffect(() => {
    if (!loading && data && typeof onReady === 'function') onReady();
  }, [loading, data, onReady]);

  if (loading) return <TermGradeSkeleton />;
  if (error)   return <div className="term-container" role="alert">{error}</div>;
  if (!data)   return <div className="term-container">No data available</div>;

  const courseCount = Math.max(
    data.prelimCourses?.length || 0,
    data.midtermCourses?.length || 0,
    data.finalCourses?.length || 0
  );
  const densityClass =
    courseCount <= 6 ? 'density-cozy' :
    courseCount <= 9 ? 'density-compact' :
    courseCount <= 13 ? 'density-tight' :
    'density-tiny';

  const handleFieldChange = (field, newValue) => {
    if (onUpdate) onUpdate({ ...data, [field]: newValue });
  };

  const handleCourseChange = (termType, courseIndex, field, newValue) => {
    if (!onUpdate) return;
    const termKey = termType === 'Prelim' ? 'prelimCourses' : termType === 'Midterm' ? 'midtermCourses' : 'finalCourses';
    const newCourses = [...data[termKey]];
    newCourses[courseIndex] = { ...newCourses[courseIndex], [field]: newValue };
    onUpdate({ ...data, [termKey]: newCourses });
  };

  const renderCourseRows = (courses, termType) => {
    if (!courses || courses.length === 0) {
      return (
        <tr>
          <td colSpan="11" style={{ textAlign: 'center', padding: '8px', color: '#999' }}>No courses found</td>
        </tr>
      );
    }
    return courses.map((course, idx) => (
      <tr key={idx}>
        <td><EditableField isTable value={course.courseCode} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'courseCode', v)} /></td>
        <td><EditableField isTable value={course.quizzesAverage} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'quizzesAverage', v)} /></td>
        <td><EditableField isTable value={course.examScore} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'examScore', v)} /></td>
        <td><EditableField isTable value={course.examAverage} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'examAverage', v)} /></td>
        <td><EditableField isTable value={course.labPracticalAverage} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'labPracticalAverage', v)} /></td>
        <td><EditableField isTable value={course.oscespe} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'oscespe', v)} /></td>
        <td><EditableField isTable value={course.average} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'average', v)} /></td>
        <td><EditableField isTable value={course.transmuted} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'transmuted', v)} /></td>
        <td><EditableField isTable value={course.pointGrade} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'pointGrade', v)} /></td>
        <td><EditableField isTable value={course.remarks} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'remarks', v)} /></td>
        <td><EditableField isTable value={course.faculty} isEditing={isEditing} onChange={(v) => handleCourseChange(termType, idx, 'faculty', v)} /></td>
      </tr>
    ));
  };

  const formatDatePHT = (date = new Date()) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);

  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  const studentNumber = data.student_number || '';
  const yearLevel = data.year_level || '';
  const section = data.section || '';
  const semesterLabel = data.semesterLabel || '';
  const adviser = data.adviserName || '';
  const guardian = data.guardianName || '';
  const guardianContact = data.guardianContact || '';
  const email = data.personal_email || '';
  const probationStatus = data.probationStatus || 'Regular';
  const residencyStatus = data.residencyStatus || '';
  const residencyYear = data.residencyYear || '';

  return (
    <div className={`term-container ${densityClass}`}>
      <div className="term-title">STUDENT TERM GRADE RECORDS</div>

      {/* Personal Information */}
      <div className="grid-row four-columns border">
        <div className="label-group"><span className="field-label">Name</span></div>
        <div className="input-group"><EditableField value={fullName} isEditing={isEditing} onChange={(v) => { const p = v.split(' '); handleFieldChange('first_name', p[0]); handleFieldChange('last_name', p.slice(1).join(' ')); }} /></div>
        <div className="label-group"><span className="field-label">Student No.</span></div>
        <div className="input-group last-cell"><EditableField value={studentNumber} isEditing={isEditing} onChange={(v) => handleFieldChange('student_number', v)} /></div>
      </div>
      <div className="grid-row four-columns border-bottom">
        <div className="label-group"><span className="field-label">Year Level & Section:</span></div>
        <div className="input-group"><EditableField value={`${yearLevel} - ${section}`} isEditing={isEditing} onChange={(v) => handleFieldChange('section', v)} /></div>
        <div className="label-group"><span className="field-label">Semester:</span></div>
        <div className="input-group last-cell"><EditableField value={semesterLabel} isEditing={isEditing} onChange={(v) => handleFieldChange('semesterLabel', v)} /></div>
      </div>
      <div className="grid-row four-columns border spacer">
        <div className="label-group"><span className="field-label">Parent/Legal <br/> Guardian Name:</span></div>
        <div className="input-group"><EditableField value={guardian} isEditing={isEditing} onChange={(v) => handleFieldChange('guardianName', v)} /></div>
        <div className="label-group"><span className="field-label">Contact No:</span></div>
        <div className="input-group last-cell"><EditableField value={guardianContact} isEditing={isEditing} onChange={(v) => handleFieldChange('guardianContact', v)} /></div>
      </div>
      <div className="grid-row four-columns border-bottom">
        <div className="label-group"><span className="field-label">Email:</span></div>
        <div className="input-group"><EditableField value={email} isEditing={isEditing} onChange={(v) => handleFieldChange('personal_email', v)} /></div>
        <div className="label-group"><span className="field-label">Adviser:</span></div>
        <div className="input-group last-cell"><EditableField value={adviser} isEditing={isEditing} onChange={(v) => handleFieldChange('adviserName', v)} /></div>
      </div>

      {/* GRADING SYSTEM */}
      <div className="part-title align-left spacer">Grading System</div>
      {/* ... (Static Grading System Text remains unchanged) ... */}
      
      <div className="two-columns border no-bottom">
        <div className="label-group"><span className="field-label align-left">Lecture Only Course:</span></div>
        <div className="label-group"><span className="body-text">Lecture (100%): Quizzes/Assessment Task (AT) - 35%, Prelim Exam - 20%, Midterm Exam - 20%, Final Exam - 20%, CANVAS Activities/Other AT - 5%</span></div>
      </div>
      <div className="two-columns border no-bottom">
        <div className="label-group"><span className="field-label align-left">Lecture with <br/> Laboratory Course:</span></div>
        <div className="label-group"><span className="body-text">Lecture (60%): Quizzes/Assessment Task (AT) - 35%, Prelim Exam - 20%, Midterm Exam - 20%, Final Exam - 20%, CANVAS Activities/Other AT - 5%<br/>Laboratory (40%): Unit Practical Exam - 40%, Prelim OSCE/OSPE - 20%, Midterm OSCE/OSPE - 20%, OSCE/OSPE - 20%</span></div>
      </div>
      <div className="two-columns border no-bottom">
        <div className="label-group"><span className="field-label align-left">PTCD/CCMT/FPRP2:</span></div>
        <div className="label-group"><span className="body-text">Course Grade: 60% | Comprehensive Examination: 40%</span></div>
      </div>
      <div className="two-columns border">
        <div className="label-group"><span className="field-label align-left">ACEP2/RTEP2/RTAP2:</span></div>
        <div className="label-group"><span className="body-text">Course Grade: 50% | Revalida Examination: 50%</span></div>
      </div>

      <span className="note"><b>Note:</b> <i>Grades may change over the course of the semester as additional assessments and scores are recorded.</i></span>

      {/* POLICIES */}
      <div className="part-title align-left spacer">Probationary and Residency Policy</div>
      <div className="grid-row"><span className="body-text"><b>This section must be completed by Program Head. Probationary status applies to a student if: </b> </span></div>

      <div className="grid-row two-columns right-heavy border">
        <div className="input-group">
          <div className="checkbox-column">
            <div className="checkbox-field"><input type="checkbox" className="small-check" checked={probationStatus === 'Warning'} readOnly /><span className="body-text no-pad"><b>Warning:</b> (failed 2 courses regardless of curricular year)</span></div>
            <div className="checkbox-field"><input type="checkbox" className="small-check" checked={probationStatus === 'Probationary 1'} readOnly /><span className="body-text no-pad"><b>Probationary 1:</b> (failed course/s 2x OR 3-4 courses in a semester)</span></div>
            <div className="checkbox-field"><input type="checkbox" className="small-check" checked={probationStatus === 'Probationary 2'} readOnly /><span className="body-text no-pad"><b>Probationary 2:</b> (failed course/s 3x OR 5+ courses in a semester)</span></div>
          </div>
        </div>
        <div className="input-group">
          <span className="body-text"><b>Residency Status ________ (current residency year)</b></span>
          <div className="checkbox-field"><input type="checkbox" className="small-check" checked={residencyStatus === 'Within Residency'} readOnly /><span className="body-text no-pad"><b>Within residency period</b></span></div>
          <div className="checkbox-field"><input type="checkbox" className="small-check" checked={residencyStatus === 'Exceeded Residency'} readOnly /><span className="body-text no-pad"><b>Exceeded residency</b></span></div>
          {residencyYear && <div className="checkbox-field"><span className="body-text no-pad"><b>Residency Year:</b> {residencyYear}</span></div>}
        </div>
      </div>

      <div className="grid-row two-columns right-heavy no-border spacer">
        <div className="label-group no-border"><span className="field-label align-left">Verified by:___________________________________(Program Head)</span></div>
        <div className="label-group no-border"><span className="field-label">Date: <span className="date-with-underline">{formatDatePHT()}</span></span></div>
      </div>

      {/* PRELIMINARY TERM TABLE */}
      <div className="part-title spacer">PRELIMINARY TERM</div>
      <table className="grade-table">
        <colgroup><col /><col /><col /><col /><col /><col /><col /><col /><col /><col /><col /></colgroup>
        <thead>
          <tr>
            <th rowSpan="3">Course <br/>Code</th>
            <th colSpan="3">LECTURE</th>
            <th colSpan="2">LABORATORY</th>
            <th colSpan="3">PRELIM GRADE</th>
            <th>REMARKS</th>
            <th rowSpan="3">FACULTY</th>
          </tr>
          <tr>
            <th rowSpan="2">Quizzes (Average)</th>
            <th colSpan="2">Prelim Exam</th>
            <th rowSpan="2">Unit Practical Exam <br/> (Average)</th>
            <th rowSpan="2">OSCE/OSPE</th>
            <th rowSpan="2">Average</th>
            <th rowSpan="2">Transmuted</th>
            <th rowSpan="2">Prelim Point Grade</th>
            <th rowSpan="2" className="legend-cell"><b>P = Passed<br/>F = Failed</b></th>
          </tr>
          <tr><th>Score</th><th>Average</th></tr>
        </thead>
        <tbody>
          {renderCourseRows(data.prelimCourses, 'Prelim')}
        </tbody>
      </table>

      <span className="note"><i>By affixing my signature and that of my parent/legal guardian, I have reviewed and acknowledged my academic performance for each term...</i></span>

      {/* MIDTERM TERM TABLE */}
      <div className="part-title spacer">MIDTERM</div>
      <table className="grade-table">
        <colgroup><col /><col /><col /><col /><col /><col /><col /><col /><col /><col /><col /></colgroup>
        <thead>
          <tr>
            <th rowSpan="3">Course <br/>Code</th>
            <th colSpan="3">LECTURE</th>
            <th colSpan="2">LABORATORY</th>
            <th colSpan="3">MIDTERM GRADE</th>
            <th>REMARKS</th>
            <th rowSpan="3">FACULTY</th>
          </tr>
          <tr>
            <th rowSpan="2">Quizzes (Average)</th>
            <th colSpan="2">Midterm Exam</th>
            <th rowSpan="2">Unit Practical Exam <br/> (Average)</th>
            <th rowSpan="2">OSCE/OSPE</th>
            <th rowSpan="2">Average</th>
            <th rowSpan="2">Transmuted</th>
            <th rowSpan="2">Midterm Point Grade</th>
            <th rowSpan="2" className="legend-cell"><b>P = Passed<br/>F = Failed</b></th>
          </tr>
          <tr><th>Score</th><th>Average</th></tr>
        </thead>
        <tbody>
          {renderCourseRows(data.midtermCourses, 'Midterm')}
        </tbody>
      </table>

      {/* FINAL TERM TABLE */}
      <div className="part-title spacer">FINAL TERM</div>
      <table className="grade-table">
        <colgroup><col /><col /><col /><col /><col /><col /><col /><col /><col /><col /><col /></colgroup>
        <thead>
          <tr>
            <th rowSpan="3">Course <br/>Code</th>
            <th colSpan="3">LECTURE</th>
            <th colSpan="2">LABORATORY</th>
            <th colSpan="3">FINAL GRADE</th>
            <th>REMARKS</th>
            <th rowSpan="3">FACULTY</th>
          </tr>
          <tr>
            <th rowSpan="2">Quizzes (Average)</th>
            <th colSpan="2">Final Exam</th>
            <th rowSpan="2">Unit Practical Exam <br/> (Average)</th>
            <th rowSpan="2">OSCE/OSPE</th>
            <th rowSpan="2">Average</th>
            <th rowSpan="2">Transmuted</th>
            <th rowSpan="2">Final Point Grade</th>
            <th rowSpan="2" className="legend-cell"><b>P = Passed<br/>F = Failed</b></th>
          </tr>
          <tr><th>Score</th><th>Average</th></tr>
        </thead>
        <tbody>
          {renderCourseRows(data.finalCourses, 'Final')}
        </tbody>
      </table>
    </div>
  );
};

export default TermGrade;
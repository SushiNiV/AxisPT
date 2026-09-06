import React from 'react';
import './TermGrade.css';

const TermGrade = ({ data }) => {
  if (!data) {
    return <div className="term-container">No data available</div>;
  }

  /**
   * The document must fit one physical page (215.9mm x 330.2mm) regardless
   * of how many courses a semester has - rather than letting print either
   * clip overflow or spill a couple of rows onto an otherwise-empty second
   * page, font size/padding/spacing scale down in tiers as the row count
   * grows. Thresholds are a starting point tuned by eye against an 8-course
   * semester (the density-cozy default) - adjust in TermGrade.css if a
   * tier still doesn't fit once you see real printed output.
   */
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

  const renderCourseRows = (courses) => {
    if (!courses || courses.length === 0) {
      return (
        <tr>
          <td colSpan="11" style={{ textAlign: 'center', padding: '8px', color: '#999' }}>
            No courses found
          </td>
        </tr>
      );
    }
    return courses.map((course, idx) => (
      <tr key={idx}>
        <td>{course.courseCode || ''}</td>
        <td>{course.quizzesAverage ?? ''}</td>
        <td>{course.examScore ?? ''}</td>
        <td>{course.examAverage ?? ''}</td>
        <td>{course.labPracticalAverage ?? ''}</td>
        <td>{course.oscespe ?? ''}</td>
        <td>{course.average ?? ''}</td>
        <td>{course.transmuted ?? ''}</td>
        <td>{course.pointGrade ?? ''}</td>
        <td>{course.remarks ?? ''}</td>
        <td>{course.faculty || ''}</td>
      </tr>
    ));
  };

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
        <div className="label-group">
          <span className="field-label">Name</span>
        </div>
        <div className="input-group">
          <div className="value-field">{fullName}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Student No.</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{studentNumber}</div>
        </div>
      </div>
      <div className="grid-row four-columns border-bottom">
        <div className="label-group">
          <span className="field-label">Year Level & Section:</span>
        </div>
        <div className="input-group">
          <div className="value-field">{yearLevel} - {section}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Semester:</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{semesterLabel}</div>
        </div>
      </div>

      <div className="grid-row four-columns border spacer">
        <div className="label-group">
          <span className="field-label">Parent/Legal <br/> Guardian Name:</span>
        </div>
        <div className="input-group">
          <div className="value-field">{guardian}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Contact No:</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{guardianContact}</div>
        </div>
      </div>

      <div className="grid-row four-columns border-bottom">
        <div className="label-group">
          <span className="field-label">Email:</span>
        </div>
        <div className="input-group">
          <div className="value-field">{email}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Adviser:</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{adviser}</div>
        </div>
      </div>

      {/* GRADING SYSTEM */}
      <div className="part-title align-left spacer">Grading System</div>
      <div className="two-columns border no-bottom">
        <div className="label-group">
          <span className="field-label align-left">Lecture Only Course:</span>
        </div>
        <div className="label-group">
          <span className="body-text">
            Lecture (100%): Quizzes/Assessment Task (AT) - 35%, Prelim Exam - 20%,
            Midterm Exam - 20%, Final Exam - 20%, CANVAS Activities/Other AT - 5%
          </span>
        </div>
      </div>

      <div className="two-columns border no-bottom">
        <div className="label-group">
          <span className="field-label align-left">Lecture with <br/> Laboratory Course:</span>
        </div>
        <div className="label-group">
          <span className="body-text">
            Lecture (60%): Quizzes/Assessment Task (AT) - 35%, Prelim Exam - 20%,
            Midterm Exam - 20%, Final Exam - 20%, CANVAS Activities/Other AT - 5%
            <br/>
            Laboratory (40%): Unit Practical Exam - 40%, Prelim OSCE/OSPE - 20%, Midterm OSCE/OSPE - 20%, OSCE/OSPE - 20%
          </span>
        </div>
      </div>

      <div className="two-columns border no-bottom">
        <div className="label-group">
          <span className="field-label align-left">PTCD/CCMT/FPRP2:</span>
        </div>
        <div className="label-group">
          <span className="body-text">Course Grade: 60% | Comprehensive Examination: 40%</span>
        </div>
      </div>

      <div className="two-columns border">
        <div className="label-group">
          <span className="field-label align-left">ACEP2/RTEP2/RTAP2:</span>
        </div>
        <div className="label-group">
          <span className="body-text">Course Grade: 50% | Revalida Examination: 50%</span>
        </div>
      </div>

      <span className="note">
        <b>Note:</b>
        <i>Grades may change over the course of the semester as additional assessments and scores are recorded.</i>
      </span>

      {/* POLICIES */}
      <div className="part-title align-left spacer">Probationary and Residency Policy</div>
      <div className="grid-row">
        <span className="body-text"><b>This section must be completed by Program Head. Probationary status applies to a student if: </b> </span>
      </div>

      <div className="grid-row two-columns right-heavy border">
        <div className="input-group">
          <div className="checkbox-column">
            <div className="checkbox-field">
              <input type="checkbox" className="small-check" checked={probationStatus === 'Warning'} readOnly />
              <span className="body-text no-pad"><b>Warning:</b> (failed 2 courses regardless of curricular year)</span>
            </div>
            <div className="checkbox-field">
              <input type="checkbox" className="small-check" checked={probationStatus === 'Probationary 1'} readOnly />
              <span className="body-text no-pad"><b>Probationary 1:</b> (failed course/s 2x OR 3-4 courses in a semester)</span>
            </div>
            <div className="checkbox-field">
              <input type="checkbox" className="small-check" checked={probationStatus === 'Probationary 2'} readOnly />
              <span className="body-text no-pad"><b>Probationary 2:</b> (failed course/s 3x OR 5+ courses in a semester)</span>
            </div>
          </div>
        </div>

        <div className="input-group">
          <span className="body-text"><b>Residency Status ________ (current residency year)</b></span>
          <div className="checkbox-field">
            <input type="checkbox" className="small-check" checked={residencyStatus === 'Within Residency'} readOnly />
            <span className="body-text no-pad"><b>Within residency period</b></span>
          </div>
          <div className="checkbox-field">
            <input type="checkbox" className="small-check" checked={residencyStatus === 'Exceeded Residency'} readOnly />
            <span className="body-text no-pad"><b>Exceeded residency</b></span>
          </div>
          {residencyYear && (
            <div className="checkbox-field">
              <span className="body-text no-pad"><b>Residency Year:</b> {residencyYear}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid-row two-columns right-heavy no-border spacer">
        <div className="label-group no-border">
          <span className="field-label align-left">Verified by:___________________________________(Program Head)</span>
        </div>
        <div className="label-group no-border">
          <span className="field-label">Date:______________________</span>
        </div>
      </div>

      {/* PRELIMINARY TERM TABLE */}
      <div className="part-title spacer">PRELIMINARY TERM</div>
      <table className="grade-table">
        <colgroup>
          <col /><col /><col /><col /><col /><col />
          <col /><col /><col /><col /><col />
        </colgroup>
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
          <tr>
            <th>Score</th>
            <th>Average</th>
          </tr>
        </thead>
        <tbody>
          {renderCourseRows(data.prelimCourses)}
        </tbody>
      </table>

      <span className="note">
        <i>By affixing my signature and that of my parent/legal guardian,
          I have reviewed and acknowledged my academic performance for each
          term, as provided by my Instructor during the grade consultation.
          I also acknowledge the academic intervention to be implemented
          (if deemed necessary), as set forth in the University Student
          Handbook
        </i>
      </span>

      <div className="grid-row two-columns right-very-heavy no-border small-spacer">
        <div className="label-group no-border">
          <span className="field-label align-right">Student Signature over printed name: ____________________________________________</span>
        </div>
        <div className="label-group no-border">
          <span className="field-label">Date:__________________________________</span>
        </div>
      </div>
      <div className="grid-row two-columns right-very-heavy no-border">
        <div className="label-group no-border">
          <span className="field-label align-right"> Signature over printed name: ____________________________________________</span>
        </div>
        <div className="label-group no-border">
          <span className="field-label">Date:__________________________________</span>
        </div>
      </div>
      <div className="grid-row no-border">
        <div className="label-group no-border">
          <span className="field-label align-right">Parent/Legal Guardian's Remarks/Comments: ____________________________________________________________________________________</span>
        </div>
      </div>

      {/* MIDTERM TERM TABLE */}
      <div className="part-title spacer">MIDTERM</div>
      <table className="grade-table">
        <colgroup>
          <col /><col /><col /><col /><col /><col />
          <col /><col /><col /><col /><col />
        </colgroup>
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
          <tr>
            <th>Score</th>
            <th>Average</th>
          </tr>
        </thead>
        <tbody>
          {renderCourseRows(data.midtermCourses)}
        </tbody>
      </table>

      <span className="note">
        <i>By affixing my signature and that of my parent/legal guardian,
          I have reviewed and acknowledged my academic performance for each
          term, as provided by my Instructor during the grade consultation.
          I also acknowledge the academic intervention to be implemented
          (if deemed necessary), as set forth in the University Student
          Handbook
        </i>
      </span>

      <div className="grid-row two-columns right-very-heavy no-border small-spacer">
        <div className="label-group no-border">
          <span className="field-label align-right">Student Signature over printed name: ____________________________________________</span>
        </div>
        <div className="label-group no-border">
          <span className="field-label">Date:__________________________________</span>
        </div>
      </div>
      <div className="grid-row two-columns right-very-heavy no-border">
        <div className="label-group no-border">
          <span className="field-label align-right"> Signature over printed name: ____________________________________________</span>
        </div>
        <div className="label-group no-border">
          <span className="field-label">Date:__________________________________</span>
        </div>
      </div>
      <div className="grid-row no-border">
        <div className="label-group no-border">
          <span className="field-label align-right">Parent/Legal Guardian's Remarks/Comments: ____________________________________________________________________________________</span>
        </div>
      </div>

      {/* FINAL TERM TABLE */}
      <div className="part-title spacer">FINAL TERM</div>
      <table className="grade-table">
        <colgroup>
          <col /><col /><col /><col /><col /><col />
          <col /><col /><col /><col /><col />
        </colgroup>
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
          <tr>
            <th>Score</th>
            <th>Average</th>
          </tr>
        </thead>
        <tbody>
          {renderCourseRows(data.finalCourses)}
        </tbody>
      </table>

      <span className="note">
        <i>By affixing my signature and that of my parent/legal guardian,
          I have reviewed and acknowledged my academic performance for each
          term, as provided by my Instructor during the grade consultation.
          I also acknowledge the academic intervention to be implemented
          (if deemed necessary), as set forth in the University Student
          Handbook
        </i>
      </span>

      <div className="grid-row two-columns right-very-heavy no-border small-spacer">
        <div className="label-group no-border">
          <span className="field-label align-right">Student Signature over printed name: ____________________________________________</span>
        </div>
        <div className="label-group no-border">
          <span className="field-label">Date:__________________________________</span>
        </div>
      </div>
      <div className="grid-row two-columns right-very-heavy no-border">
        <div className="label-group no-border">
          <span className="field-label align-right"> Signature over printed name: ____________________________________________</span>
        </div>
        <div className="label-group no-border">
          <span className="field-label">Date:__________________________________</span>
        </div>
      </div>
      <div className="grid-row no-border">
        <div className="label-group no-border">
          <span className="field-label align-right">Parent/Legal Guardian's Remarks/Comments: ____________________________________________________________________________________</span>
        </div>
      </div>

      <div className="grid-row border spacer"></div>
      <span className="note">
        This STAMP form is an official document of the University and shall be duly returned
        by the student following acknowledgment by the parent or legal guardian. Any form of modification, tampering,
        unauthorized use, non-compliance with its return, or unlawful possession constitutes a violation of University
        policies and may warrant disciplinary sanctions as prescribed by the College and University Student Code of Conduct.
        Furthermore, this document does not supersede nor serve as a replacement for the official academic records
        issued exclusively by the Registrar's Office.
      </span>

    </div>
  );
};

export default TermGrade;
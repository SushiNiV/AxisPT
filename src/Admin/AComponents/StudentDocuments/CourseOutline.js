import React from 'react';
import './CourseOutline.css';

const CourseOutline = ({ data }) => {
  if (!data) {
    return <div className="course-outline">No curriculum data available.</div>;
  }

  const {
    programName,
    effectiveYear,
    years,
    grandTotals,
    student,
    facultyName,
    schoolYear,
  } = data;

  const currentYear = new Date().getFullYear();
  const syLabel = schoolYear || `${currentYear} - ${currentYear + 1}`;
  const studentFullName = student
    ? `${student.last_name}, ${student.first_name}${student.middle_name ? ` ${student.middle_name.charAt(0)}.` : ''}`
    : '';
  const studentNumber = student?.student_number || '';

  const formatDatePHT = (date = new Date()) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date);

  // --- Render column header row (CODE | TITLE | LEC | LAB | TOTAL | PRE) ---
  const renderColumnLabels = () => (
    <div className="row-cells">
      <div className="cell col-empty"></div>
      <div className="cell col-code">CODE</div>
      <div className="cell col-title text-center">SUBJECT TITLE</div>
      <div className="units-container">
        <div className="units-label">UNITS</div>
        <div className="units-sub-cells">
          <div className="cell col-unit">LEC</div>
          <div className="cell col-unit">LAB</div>
        </div>
      </div>
      <div className="cell col-total text-center">TOTAL <br /> UNITS</div>
      <div className="cell col-pre text-center no-border-right">PRE REQUISITE/S</div>
    </div>
  );

  // --- Header for one or two semesters side by side ---
  const renderHeader = (leftLabel, rightLabel = null) => (
    <div className="dynamic-row header-row">
      <div className={`semester-side ${rightLabel ? 'sem-left' : ''}`}>
        <div className="semester-label">{leftLabel}</div>
        {renderColumnLabels()}
      </div>
      {rightLabel && (
        <div className="semester-side sem-right">
          <div className="semester-label">{rightLabel}</div>
          {renderColumnLabels()}
        </div>
      )}
    </div>
  );

  // --- Course row for a single side ---
  const renderCourseRowCells = (course) => (
    <div className="row-cells">
      <div className="cell col-empty"></div>
      <div className="cell col-code">{course?.courseCode || ''}</div>
      <div className="cell col-title text-left">{course?.courseName || ''}</div>
      <div className="cell col-unit">{course?.lecUnits ?? ''}</div>
      <div className="cell col-unit">{course?.labUnits ?? ''}</div>
      <div className="cell col-total">{course?.totalUnits ?? ''}</div>
      <div className="cell col-pre text-center no-border-right">
        {course?.prerequisites || ''}
      </div>
    </div>
  );

  // --- Footer row with semester totals ---
  const renderFooterCells = (semester) => {
    const totals = semester?.totals || { lec: 0, lab: 0, total: 0 };
    return (
      <div className="row-cells footer-cells">
        <div className="cell col-empty"></div>
        <div className="cell col-code"></div>
        <div className="cell col-title text-right font-bold">TOTAL</div>
        <div className="cell col-unit font-bold">{totals.lec}</div>
        <div className="cell col-unit font-bold">{totals.lab}</div>
        <div className="cell col-total font-bold">{totals.total}</div>
        <div className="cell col-pre no-border-right"></div>
      </div>
    );
  };

  // --- Full body for a year ---
  const renderYearBody = (yearBlock) => {
    const first = yearBlock.semesters.find((s) => s.semesterId === 1);
    const second = yearBlock.semesters.find((s) => s.semesterId === 2);
    const summer = yearBlock.semesters.find((s) => s.semesterId === 3);

    const maxRows = Math.max(
      first?.courses.length || 0,
      second?.courses.length || 0
    );

    return (
      <>
        <div className="curriculum-container">
          <div className="year-header">YEAR {yearBlock.yearLevel}</div>
          {renderHeader(first?.semesterLabel || 'FIRST SEMESTER', second?.semesterLabel || 'SECOND SEMESTER')}

          {Array.from({ length: maxRows }).map((_, i) => (
            <div className="dynamic-row" key={i}>
              <div className="semester-side sem-left">
                {renderCourseRowCells(first?.courses[i])}
              </div>
              <div className="semester-side sem-right">
                {renderCourseRowCells(second?.courses[i])}
              </div>
            </div>
          ))}

          <div className="dynamic-row footer-row">
            <div className="semester-side sem-left">
              {renderFooterCells(first)}
            </div>
            <div className="semester-side sem-right">
              {renderFooterCells(second)}
            </div>
          </div>
        </div>

        {summer && summer.courses.length > 0 && (
          <div className="curriculum-container summer-table">
            {renderHeader(summer.semesterLabel || 'SUMMER')}
            {summer.courses.map((course, i) => (
              <div className="dynamic-row" key={i}>
                <div className="semester-side">
                  {renderCourseRowCells(course)}
                </div>
              </div>
            ))}
            <div className="dynamic-row footer-row">
              <div className="semester-side">
                {renderFooterCells(summer)}
              </div>
            </div>
          </div>
        )}

        <div className="divider"></div>
      </>
    );
  };

  return (
    <div className="course-outline">
      <div className="header-text">
        <p className="CO-title">
          OUR LADY OF FATIMA UNIVERSITY <br />
          COLLEGE OF PHYSICAL THERAPY <br />
          {programName?.toUpperCase() || ''} <br />
          EFFECTIVE SCHOOL YEAR {effectiveYear || `${currentYear} - ${currentYear + 1}`}
        </p>
        <p className="campus-list">
          <b>Valenzuela * Quezon City * Antipolo * Pampanga * Laguna<br />
            Based on CMO55, Series of 2017 </b>
        </p>
      </div>

      {years.map((yearBlock) => (
        <React.Fragment key={yearBlock.yearLevel}>
          {renderYearBody(yearBlock)}
        </React.Fragment>
      ))}

      {/* Footer with totals + student / faculty / SY */}
      <table className="grand-footer-table">
        <tbody>
          <tr>
            <td className="footer-col student-label-col">
              <div className="input-row">Name:</div>
              <div className="input-row">Student No.:</div>
              <div className="input-row">S.Y.:</div>
              <div className="type-row">Type: </div>
            </td>

           <td className="footer-col student-underline-col">
              <div className="field-block">
                <span className="field-value">{studentFullName}</span>
                <span className="field-line"></span>
              </div>
              <div className="field-block">
                <span className="field-value">{studentNumber}</span>
                <span className="field-line"></span>
              </div>
              <div className="field-block">
                <span className="field-value">{syLabel}</span>
                <span className="field-line"></span>
              </div>
              <div className="input-row">_______________________Freshman</div>
              <div className="input-row">_______________________Transferee</div>
            </td>

            <td className="footer-col eval-label-col">
              <div className="input-row">Evaluated by:</div>
              <div className="spacer"></div>
              <div className="input-row">Date:</div>
            </td>

            <td className="footer-col eval-sig-col">
              <div className="field-block">
                <span className="field-value">{facultyName}</span>
                <span className="field-line"></span>
              </div>
              <div className="sig-label text-left">College of Physical Therapy</div>
              <div className="field-block">
                <span className="field-value">{formatDatePHT()}</span>
                <span className="field-line"></span>
              </div>
            </td>

            <td className="footer-col totals-label-col">
              <div className="total-entry-label">TOTAL UNITS:</div>
              <div className="total-entry-label">TOTAL NO. OF COURSES:</div>
            </td>

            <td className="footer-col totals-value-col">
              <div className="total-entry-value">{grandTotals?.totalUnits ?? 0}</div>
              <div className="total-entry-value">{grandTotals?.totalCourses ?? 0}</div>
            </td>
          </tr>

          <tr>
            <td colSpan="2" className="reminders-cell">
              <p>Important Reminders to All Students:</p>
              <p>1. Do not lose copy for credit evaluation.</p>
              <p>2. No alteration from original evaluation.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CourseOutline;
import React from 'react';
import './CourseOutline.css';

const CourseOutline = () => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // --- DATA ARRAYS ---
  const sem1Subjects = [
    { code: 'PURC111', title: 'Purposive Communication', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'MATM111', title: 'Mathematics in the Modern World', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'VRTS111', title: 'Veritas et Misericordia 1', lec: 1, lab: 0, total: 1, pre: 'None' },
    { code: 'PSYP111', title: 'Psychology for Physical Therapy', lec: 2, lab: 0, total: 2, pre: 'None' },
    { code: 'FOHA111', title: 'Fundamentals of Human Physiology', lec: 2, lab: 1, total: 3, pre: 'None' },
    { code: 'LSDG111', title: 'Lifespan Development with Genetics', lec: 2, lab: 1, total: 3, pre: 'None' },
    { code: 'FOHA111', title: 'Theoretical Foundation for Physical Therapy Practice', lec: 2, lab: 1, total: 3, pre: 'None' },
  ];

  const sem2Subjects = [
    { code: 'PHED121', title: 'PATHFIT 1: Movement Competency Training', lec: 0, lab: 2, total: 2, pre: 'None' },
    { code: 'UNDS111', title: 'Understanding Self', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'VRTS112', title: 'Veritas Et Misericordia 2', lec: 1, lab: 0, total: 1, pre: 'None' },
    { code: 'ENGL111', title: 'College English', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'FAPM111', title: 'Functional Anatomy, Physiology of the Musculoskeletal System', lec: 2, lab: 1, total: 3, pre: 'FOHA111' },
    { code: 'FAPC111', title: 'Functional Anatomy, Physiology of the Cardiopulmonary System', lec: 2, lab: 1, total: 3, pre: 'FOHP111' },
    { code: 'FAPM111', title: 'Functional Anatomy, Physiology of the Neuromuscular System', lec: 2, lab: 1, total: 3, pre: 'FOHA111 FOHP111' },
    { code: 'BPCS111', title: 'Basic Patient Care Skills and Emergency', lec: 2, lab: 1, total: 3, pre: 'TFPT111' },
  ];

  const summer1Subjects = [
    { code: 'NSTP111', title: 'National Service Training Program 1', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'NSTP112', title: 'National Service Training Program 2', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'PHED122', title: 'PATHFIT 2: Exercise-based Fitness Activities', lec: 0, lab: 2, total: 2, pre: 'PHED121' },
  ];

  const sem3Subjects = [
    { code: 'PHED123', title: 'PATHFIT 3: Dance/Group Exercises', lec: 0, lab: 2, total: 2, pre: 'PHED121 PHED122' },
    { code: 'CRWT111', title: 'Critical Reading, Writing and Thinking', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'VRTS113', title: 'Veritas Et Misericordia 3', lec: 1, lab: 0, total: 1, pre: 'None' },
    { code: 'MRAT211', title: 'Musculoskeletal Rehabilitation, Assessment and Treatment', lec: 2, lab: 1, total: 3, pre: 'FAPM111' },
    { code: 'CRAT211', title: 'Cardiopulmonary and Integumentary Rehabilitation', lec: 2, lab: 1, total: 3, pre: 'FAPC111' },
    { code: 'THEX211', title: 'Therapeutic Exercise', lec: 2, lab: 1, total: 3, pre: 'BPCS111' },
    { code: 'EEPT211', title: 'Examination and Evaluation in Physical Therapy', lec: 3, lab: 1, total: 4, pre: 'FAPM11 FAPC111 FAPN111' },
    { code: 'MSAE211', title: 'Movement Science and Ergonomics', lec: 2, lab: 1, total: 3, pre: 'FAPM111' },
    { code: 'BPPT211', title: 'Basic Pathology in Physical Therapy', lec: 3, lab: 0, total: 3, pre: 'FAPC11 FAPN111 FAPM111' },
  ];

  const sem4Subjects = [
    { code: 'PHED124', title: 'PATHFIT 4: Team Sports/Group Exercises', lec: 0, lab: 2, total: 2, pre: 'PHED121 PHED122' },
    { code: 'PPGC211', title: 'Philippine Politics, Governance and Citizenship', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'VRTS114', title: 'Veritas Et Misericordia 4', lec: 1, lab: 0, total: 1, pre: 'None' },
    { code: 'STAS211', title: 'Science, Technology, and Society', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'NRAT211', title: 'Neurology and Rehabilitation, Assessment and Treatment', lec: 2, lab: 1, total: 3, pre: 'FAPN111' },
    { code: 'PRAT211', title: 'Pediatric and Rehabilitation, Assessment and Treatment', lec: 2, lab: 1, total: 3, pre: 'FAPN111 FAPC111' },
    { code: 'GRAT211', title: 'Geriatric and Rehabilitation, Assessment and Treatment', lec: 2, lab: 1, total: 3, pre: 'FAPN111 FAPC111' },
    { code: 'PHPT211', title: 'Physics for Physical Therapy', lec: 2, lab: 1, total: 3, pre: 'None' },
    { code: 'PTRS211', title: 'Introduction to Physical Therapy Research', lec: 3, lab: 0, total: 3, pre: 'TPPT111 BPCS111' },
  ];

  const summer2Subjects = [
    { code: 'PTPM211', title: 'PT Policy and Management (PT as a Manager)', lec: 3, lab: 0, total: 3, pre: 'TPTF111 BPCS111' },
    { code: 'HIPT211', title: 'Health Informatics for Physical Therapy', lec: 2, lab: 1, total: 3, pre: 'TPTF111 BPCS111' },
    { code: 'RIPH211', title: 'Readings in Phil History', lec: 3, lab: 0, total: 3, pre: 'None' },
  ];

  const sem5Subjects = [
    { code: 'RIZL111', title: 'Life and Works of Rizal', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'EEPT311', title: 'Ethics and Professionalism in Physical Therapy', lec: 3, lab: 0, total: 3, pre: 'TPTF111 BPCS111' },
    { code: 'PAER311', title: 'Physical Agents and Electrotherapy in Rehabilitation', lec: 2, lab: 1, total: 3, pre: 'PHPT211' },
    { code: 'WNHP311', title: 'Wellness Nutrition and Health Promotion in PT', lec: 2, lab: 1, total: 3, pre: 'TPTF111 BPCS111' },
    { code: 'ICBRS311', title: 'Introduction to Community Based Rehabilitation', lec: 2, lab: 1, total: 3, pre: 'TPTF111 BPCS111' },
    { code: 'PHAR311', title: 'Pharmacology in Physical Therapy', lec: 3, lab: 0, total: 3, pre: 'MRAT211 CRAT211 NRAT211' },
    { code: 'CCPT311', title: 'Clinical Correlation for PT (Seminar)', lec: 0, lab: 2, total: 2, pre: 'EEPT211 MRAT211' },
    { code: 'PTRS312', title: 'PT Research 2 (Thesis Proposal)', lec: 1, lab: 1, total: 2, pre: 'PTRS211' },
  ];

  const sem6Subjects = [
    { code: 'ARTA111', title: 'Art Appreciation', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'TCWD111', title: 'The Contemporary World', lec: 3, lab: 0, total: 3, pre: 'None' },
    { code: 'DCCP311', title: 'Diversity Cultural Competence in PT Practice', lec: 2, lab: 1, total: 3, pre: 'EPPT311' },
    { code: 'POAT311', title: 'Prosthetics/Orthotics and Assistive Technology', lec: 2, lab: 1, total: 3, pre: 'MSAE211' },
    { code: 'PTCO311', title: 'PT Competencies in Different Practice Setting', lec: 2, lab: 1, total: 3, pre: 'ALL SUBJECTS' },
    { code: 'ETPT311', title: 'Educational Theory and Practice', lec: 3, lab: 0, total: 3, pre: 'PTPM211' },
    { code: 'CCPT312', title: 'Clinical Correlation for PT (Seminar 2)', lec: 0, lab: 2, total: 2, pre: 'CCPT311' },
    { code: 'IRPT311', title: 'Industrial Rehabilitation', lec: 1, lab: 1, total: 2, pre: 'MSAE211' },
    { code: 'PTRS213', title: 'PT Research 3 (Implementation and Defense)', lec: 1, lab: 1, total: 2, pre: 'PTRS212' }
  ];

  const summer3Subjects = [
    { code: 'INPT31', title: 'PT Internship', lec: 6, lab: 0, total: 6, pre: 'ALL SUBJECTS' },
  ];

  const sem7Subjects = [
    { code: 'INPT312', title: 'Physical Therapy Internship 2', lec: 12, lab: 0, total: 12, pre: 'ALL' },
    { code: 'ACEP411', title: 'Academic Enrichment Program 1 (Musculoskeletal, Cardiopulmonary, and Integumentary Integration)', lec: 0, lab: 2, total: 2, pre: 'ALL' },
    
  ];

  const sem8Subjects = [
    { code: 'INPT313', title: 'Physical Therapy Internship 3', lec: 12, lab: 0, total: 12, pre: 'INPT312' },
    { code: 'ACEP412', title: 'Academic Enrichment Program 2 (Neurologic, Geriatric, and Pediatric Integration)', lec: 0, lab: 2, total: 2, pre: 'ACEP411' },
    
  ];

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
      <div className="cell col-total text-center">TOTAL <br/> UNITS</div>
      <div className="cell col-pre text-center no-border-right">PRE REQUISITE/S</div>
    </div>
  );

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

  const calculateTotals = (subjects) => {
    return subjects.reduce(
      (acc, curr) => ({
        lec: acc.lec + (curr.lec || 0),
        lab: acc.lab + (curr.lab || 0),
        total: acc.total + (curr.total || 0),
      }),
      { lec: 0, lab: 0, total: 0 }
    );
  };

  const renderFooterCells = (subjects, noBorderRight = false) => {
    const totals = calculateTotals(subjects);
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

  const renderFooter = (leftSubjects, rightSubjects = null) => (
    <div className="dynamic-row footer-row">
      <div className={`semester-side ${rightSubjects ? 'sem-left' : ''}`}>
        {renderFooterCells(leftSubjects)}
      </div>
      {rightSubjects && (
        <div className="semester-side sem-right">
          {renderFooterCells(rightSubjects)}
        </div>
      )}
    </div>
  );

  return (
    <div className="course-outline">
      <div className="header-text">
        <p className="CO-title">
          OUR LADY OF FATIMA UNIVERSITY <br/> 
          COLLEGE OF PHYSICAL THERAPY <br/> 
          BACHELOR OF SCIENCE IN PHYSICAL THERAPY <br/> 
          EFFECTIVE SCHOOL YEAR {currentYear} - {nextYear}
        </p>
        <p className='campus-list'> 
          <b>Valenzuela * Quezon City * Antipolo * Pampanga * Laguna<br/>
          Based on CMO55, Series of 2017 </b>
        </p>
      </div>

      {/* --- FIRST YEAR --- */}
      <div className="curriculum-container">
        <div className="year-header">FIRST YEAR</div>
        {renderHeader("FIRST SEMESTER", "SECOND SEMESTER")}

        {Array.from({ length: Math.max(sem1Subjects.length, sem2Subjects.length) }).map((_, index) => (
          <div className="dynamic-row" key={index}>
            <div className="semester-side sem-left">
              <div className="row-cells">
                <div className="cell col-empty"></div>
                <div className="cell col-code">{sem1Subjects[index]?.code || ""}</div>
                <div className="cell col-title text-left">{sem1Subjects[index]?.title || ""}</div>
                <div className="cell col-unit">{sem1Subjects[index]?.lec ?? ""}</div>
                <div className="cell col-unit">{sem1Subjects[index]?.lab ?? ""}</div>
                <div className="cell col-total">{sem1Subjects[index]?.total ?? ""}</div>
                <div className="cell col-pre">{sem1Subjects[index]?.pre || ""}</div>
              </div>
            </div>
            <div className="semester-side sem-right">
              <div className="row-cells">
                <div className="cell col-empty"></div> 
                <div className="cell col-code">{sem2Subjects[index]?.code || ""}</div>
                <div className="cell col-title text-left">{sem2Subjects[index]?.title || ""}</div>
                <div className="cell col-unit">{sem2Subjects[index]?.lec ?? ""}</div>
                <div className="cell col-unit">{sem2Subjects[index]?.lab ?? ""}</div>
                <div className="cell col-total">{sem2Subjects[index]?.total ?? ""}</div>
                <div className="cell col-pre text-center">{sem2Subjects[index]?.pre || ""}</div>
              </div>
            </div>
          </div>
        ))}
        {renderFooter(sem1Subjects, sem2Subjects)}
      </div>

      {/* SUMMER 1 */}
      <div className="curriculum-container summer-table">
        {renderHeader("SUMMER")}
        {summer1Subjects.map((sub, index) => (
          <div className="dynamic-row" key={index}>
            <div className="semester-side">
              <div className="row-cells">
                <div className="cell col-empty"></div>
                <div className="cell col-code">{sub.code}</div>
                <div className="cell col-title text-left">{sub.title}</div>
                <div className="cell col-unit">{sub.lec}</div>
                <div className="cell col-unit">{sub.lab}</div>
                <div className="cell col-total">{sub.total}</div>
                <div className="cell col-pre no-border-right text-center">{sub.pre}</div>
              </div>
            </div>
          </div>
        ))}
        {renderFooter(summer1Subjects)}
      </div>

      <div className='divider'></div>

      {/* --- SECOND YEAR --- */}
      <div className="curriculum-container">
        <div className="year-header">SECOND YEAR</div>
        {renderHeader("FIRST SEMESTER", "SECOND SEMESTER")}
        
        {Array.from({ length: Math.max(sem3Subjects.length, sem4Subjects.length) }).map((_, index) => (
          <div className="dynamic-row" key={index}>
            <div className="semester-side sem-left">
              <div className="row-cells">
                <div className="cell col-empty"></div>
                <div className="cell col-code">{sem3Subjects[index]?.code || ""}</div>
                <div className="cell col-title text-left">{sem3Subjects[index]?.title || ""}</div>
                <div className="cell col-unit">{sem3Subjects[index]?.lec ?? ""}</div>
                <div className="cell col-unit">{sem3Subjects[index]?.lab ?? ""}</div>
                <div className="cell col-total">{sem3Subjects[index]?.total ?? ""}</div>
                <div className="cell col-pre text-center">{sem3Subjects[index]?.pre || ""}</div>
              </div>
            </div>
            <div className="semester-side sem-right">
              <div className="row-cells">
                <div className="cell col-empty"></div> 
                <div className="cell col-code">{sem4Subjects[index]?.code || ""}</div>
                <div className="cell col-title text-left">{sem4Subjects[index]?.title || ""}</div>
                <div className="cell col-unit">{sem4Subjects[index]?.lec ?? ""}</div>
                <div className="cell col-unit">{sem4Subjects[index]?.lab ?? ""}</div>
                <div className="cell col-total">{sem4Subjects[index]?.total ?? ""}</div>
                <div className="cell col-pre text-center">{sem4Subjects[index]?.pre || ""}</div>
              </div>
            </div>
          </div>
        ))}
        {renderFooter(sem3Subjects, sem4Subjects)}
      </div>

      {/* SUMMER 2 */}
      <div className="curriculum-container summer-table">
        {renderHeader("SUMMER")}
        {summer2Subjects.map((sub, index) => (
          <div className="dynamic-row" key={index}>
            <div className="semester-side">
              <div className="row-cells">
                <div className="cell col-empty"></div>
                <div className="cell col-code">{sub.code}</div>
                <div className="cell col-title text-left">{sub.title}</div>
                <div className="cell col-unit">{sub.lec}</div>
                <div className="cell col-unit">{sub.lab}</div>
                <div className="cell col-total">{sub.total}</div>
                <div className="cell col-pre no-border-right text-center">{sub.pre}</div>
              </div>
            </div>
          </div>
        ))}
        {renderFooter(summer2Subjects)}
      </div>

      <div className='divider'></div>

      {/* --- THIRD YEAR --- */}
      <div className="curriculum-container">
        <div className="year-header">THIRD YEAR</div>
        {renderHeader("FIRST SEMESTER", "SECOND SEMESTER")}
        
        {Array.from({ length: Math.max(sem5Subjects.length, sem6Subjects.length) }).map((_, index) => (
          <div className="dynamic-row" key={index}>
            <div className="semester-side sem-left">
              <div className="row-cells">
                <div className="cell col-empty"></div>
                <div className="cell col-code">{sem5Subjects[index]?.code || ""}</div>
                <div className="cell col-title text-left">{sem5Subjects[index]?.title || ""}</div>
                <div className="cell col-unit">{sem5Subjects[index]?.lec ?? ""}</div>
                <div className="cell col-unit">{sem5Subjects[index]?.lab ?? ""}</div>
                <div className="cell col-total">{sem5Subjects[index]?.total ?? ""}</div>
                <div className="cell col-pre text-center">{sem5Subjects[index]?.pre || ""}</div>
              </div>
            </div>
            <div className="semester-side sem-right">
              <div className="row-cells">
                <div className="cell col-empty"></div> 
                <div className="cell col-code">{sem6Subjects[index]?.code || ""}</div>
                <div className="cell col-title text-left">{sem6Subjects[index]?.title || ""}</div>
                <div className="cell col-unit">{sem6Subjects[index]?.lec ?? ""}</div>
                <div className="cell col-unit">{sem6Subjects[index]?.lab ?? ""}</div>
                <div className="cell col-total">{sem6Subjects[index]?.total ?? ""}</div>
                <div className="cell col-pre text-center">{sem6Subjects[index]?.pre || ""}</div>
              </div>
            </div>
          </div>
        ))}
        {renderFooter(sem5Subjects, sem6Subjects)}
      </div>

      {/* SUMMER 3 */}
      <div className="curriculum-container summer-table">
        {renderHeader("SUMMER")}
        {summer3Subjects.map((sub, index) => (
          <div className="dynamic-row" key={index}>
            <div className="semester-side">
              <div className="row-cells">
                <div className="cell col-empty"></div>
                <div className="cell col-code">{sub.code}</div>
                <div className="cell col-title text-left">{sub.title}</div>
                <div className="cell col-unit">{sub.lec}</div>
                <div className="cell col-unit">{sub.lab}</div>
                <div className="cell col-total">{sub.total}</div>
                <div className="cell col-pre no-border-right text-center">{sub.pre}</div>
              </div>
            </div>
          </div>
        ))}
        {renderFooter(summer3Subjects)}
      </div>

      <div className='divider'></div>

      <div className="curriculum-container">
        <div className="year-header">FOURTH YEAR</div>
        {renderHeader("FIRST SEMESTER", "SECOND SEMESTER")}
        
        {Array.from({ length: Math.max(sem7Subjects.length, sem8Subjects.length) }).map((_, index) => (
          <div className="dynamic-row" key={index}>
            <div className="semester-side sem-left">
              <div className="row-cells">
                <div className="cell col-empty"></div>
                <div className="cell col-code">{sem7Subjects[index]?.code || ""}</div>
                <div className="cell col-title text-left">{sem7Subjects[index]?.title || ""}</div>
                <div className="cell col-unit">{sem7Subjects[index]?.lec ?? ""}</div>
                <div className="cell col-unit">{sem7Subjects[index]?.lab ?? ""}</div>
                <div className="cell col-total">{sem7Subjects[index]?.total ?? ""}</div>
                <div className="cell col-pre text-center">{sem7Subjects[index]?.pre || ""}</div>
              </div>
            </div>
            <div className="semester-side sem-right">
              <div className="row-cells">
                <div className="cell col-empty"></div> 
                <div className="cell col-code">{sem8Subjects[index]?.code || ""}</div>
                <div className="cell col-title text-left">{sem8Subjects[index]?.title || ""}</div>
                <div className="cell col-unit">{sem8Subjects[index]?.lec ?? ""}</div>
                <div className="cell col-unit">{sem8Subjects[index]?.lab ?? ""}</div>
                <div className="cell col-total">{sem8Subjects[index]?.total ?? ""}</div>
                <div className="cell col-pre text-center">{sem8Subjects[index]?.pre || ""}</div>
              </div>
            </div>
          </div>
        ))}
        {renderFooter(sem5Subjects, sem6Subjects)}
      </div>
      

    <table className="grand-footer-table">
      <tbody>
        <tr>
          {/* Column 1: Student Info Labels */}
          <td className="footer-col student-label-col">
            <div className="input-row">Name:</div>
            <div className="input-row">Student No.:</div>
            <div className="input-row">S.Y.:</div>
            <div className="type-row">Type: </div>
          </td>

          {/* Column 2: Student Info Underlines */}
          <td className="footer-col student-underline-col">
            <div className="input-row">_____________________________________________</div>
            <div className="input-row">_______________________</div>
            <div className="input-row">_______________________</div>
            <div className="input-row">_______________________Freshman</div>
            <div className="input-row">_______________________Transferee</div>
          </td>

          {/* Column 3: Evaluation Labels */}
          <td className="footer-col eval-label-col">
            <div className="input-row">Evaluated by:</div>
            <div className="spacer"></div>
            <div className="input-row">Date:</div>
          </td>

          {/* Column 4: Evaluation Underlines */}
          <td className="footer-col eval-sig-col">
            <div className="input-row text-left">_______________________________</div>
            <div className="sig-label text-left">College of Physical Therapy</div>
            <div className="input-row text-left">________________________________</div>
          </td>

          {/* Column 5: Grand Totals */}
          <td className="footer-col totals-label-col">
            <div className="total-entry-label">TOTAL UNITS:</div>
            <div className="total-entry-label">TOTAL NO. OF COURSES:</div>
          </td>

          {/* Column 6: Grand Totals Values (Aligned Right) */}
          <td className="footer-col totals-value-col">
            <div className="total-entry-value ">189</div>
            <div className="total-entry-value">63</div>
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
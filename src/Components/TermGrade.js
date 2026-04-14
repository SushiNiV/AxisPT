import React from 'react';
import './TermGrade.css';

const StudentForm = ({ data }) => {
  return (
    <div className="term-container">

      <div className="term-title">STUDENT TERM GRADE RECORDS</div>

      {/* Personal Information */}
      <div className="grid-row four-columns border">
        <div className="label-group">
          <span className="field-label">Name</span>
        </div>
        <div className="input-group">
          <div className="value-field">{data?.name}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Student No.</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{data?.studentNumber}</div>
        </div>
      </div>
      <div className="grid-row four-columns border-bottom" >
        <div className="label-group">
          <span className="field-label">Year Level & Section:</span>
        </div>
        <div className="input-group">
          <div className="value-field">{data?.name}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Semester:</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{data?.studentNumber}</div>
        </div>
      </div>

      <div className="grid-row four-columns border spacer" >
        <div className="label-group">
          <span className="field-label">Parent/Legal <br/> Guardian Name:</span>
        </div>
        <div className="input-group">
          <div className="value-field">{data?.name}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Contact No:</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{data?.studentNumber}</div>
        </div>
      </div>

       <div className="grid-row four-columns border-bottom" >
        <div className="label-group">
          <span className="field-label">Email:</span>
        </div>
        <div className="input-group">
          <div className="value-field">{data?.name}</div>
        </div>
        <div className="label-group">
          <span className="field-label">Adviser:</span>
        </div>
        <div className="input-group last-cell">
          <div className="value-field">{data?.studentNumber}</div>
        </div>
      </div>

      {/* GRADING SYSTEM*/}
      <div className="part-title align-left spacer">Grading System</div>
        <div className='two-columns border no-bottom' >
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

        <div className='two-columns border no-bottom' >
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

        <div className='two-columns border no-bottom' >
          <div className="label-group">
            <span className="field-label align-left">PTCD/CCMT/FPRP2:</span>
          </div>
          <div className="label-group">
            <span className="body-text">Course Grade: 60% | Comprehensive Examination: 40%</span>
          </div>
        </div>

        <div className='two-columns border' >
          <div className="label-group">
            <span className="field-label align-left">ACEP2/RTEP2/RTAP2:</span>
          </div>
          <div className="label-group">
            <span className="body-text">Course Grade: 50% | Revalida Examination: 50%</span>
          </div>
        </div>

        <span className="note">
          <b>Note:</b> 
          <i>Grades may change over the course of the semester 
                                
          as additional assessments and scores are recorded.</i> </span>
 
       {/* POLICIES */}
        <div className="part-title align-left spacer">Probationary and Residency Policy</div>   
        <div className='grid-row ' >
          <span className="body-text"><b>This section must be completed by Program Head. Probationary status applies to a student if: </b> </span>
        </div>

        <div className='grid-row two-columns right-heavy border' >
          <div className="input-group">
            <div className = 'checkbox-column'>
              <div className="checkbox-field">
                <input type="checkbox" className="small-check" checked={data?.fatherLiving} readOnly />
                <span className="body-text no-pad"><b>Warning:</b> (failed 2 courses regardless of curricular year) </span>
              </div>

              <div className="checkbox-field">
                <input type="checkbox" className="small-check" checked={data?.fatherLiving} readOnly />
                <span className="body-text no-pad"><b>Probationary 1:</b> (failed course/s 2x OR 3-4 courses in a semester) </span>
              </div>
               <div className="checkbox-field">
                <input type="checkbox" className="small-check" checked={data?.fatherLiving} readOnly />
                <span className="body-text no-pad"><b>Probationary 1:</b> (failed course/s 2x OR 3-4 courses in a semester) </span>
             </div>
            </div>
          </div>

          <div className="input-group">
             <span className="body-text "><b>Residency Status ________ (current residency year)</b>  </span>
             <div className="checkbox-field">
                <input type="checkbox" className="small-check" checked={data?.fatherLiving} readOnly />
                <span className="body-text no-pad"><b>Within residency period</b>  </span>
             </div>
             <div className="checkbox-field">
                <input type="checkbox" className="small-check" checked={data?.fatherLiving} readOnly />
                <span className="body-text no-pad"><b>Exceeded residency</b> </span>
             </div>
          </div>
        </div>
        
        <div className='grid-row two-columns right-heavy no-border spacer ' > 
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
              <th  rowSpan="2" className="legend-cell" >P = Passed<br/>F = Failed</th>
            </tr>
            <tr>
              <th>Score</th>
              <th>Average</th>
             
            </tr>
          </thead>
          <tbody>

            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}
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

        <div className='grid-row two-columns right-heavy no-border spacer ' > 
          <div className="label-group border">
            <span className="field-label align-right">Verified by:___________________________________(Program Head)</span>
          </div>

          <div className="label-group border">
            <span className="body-text">Date:______________________</span>
          </div>
        </div>

    </div>
        
        
     
  );
};
export default StudentForm;
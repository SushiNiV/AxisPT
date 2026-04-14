import React, { useState, useEffect } from 'react';
import './StudentForm.css';

function StudentForm() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/student/form')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => console.error("Error fetching student data:", err));
  }, []);

  return (
    <div className="form-container">
      {/* Personal Information */}
      <div className="section-title">Personal Information</div>

      <div className="grid-row three-cols height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right">
          <label>FULL NAME</label>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.mobile}</div>
          <span className="sub-label center-text">First Name</span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.email}</div>
          <span className="sub-label center-text">Last Name</span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.email}</div>
          <span className="sub-label center-text">Middle Name</span>
        </div>
      </div>

      {/* PRESENT ADDRESS SECTION */}
      <div className="grid-row four-cols-address height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right">
          <label>PRESENT ADDRESS:</label>
        </div>
        <div className="sfinput-group col-small-left">
          <div className="value-line">{data?.streetNo}</div>
          <span className="sub-label">No.</span>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.streetName}</div>
          <span className="sub-label">Street</span>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.subdivision}</div>
          <span className="sub-label">Subdivision/Barangay</span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.city}</div>
          <span className="sub-label">City/Municipality</span>
        </div>
      </div>

      {/* PROVINCIAL ADDRESS SECTION */}
      <div className="grid-row four-cols-address height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right">
          <label>PROVINCIAL ADDRESS:</label>
        </div>
        <div className="sfinput-group col-small-left">
          <div className="value-line">{data?.streetNo}</div>
          <span className="sub-label">No.</span>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.streetName}</div>
          <span className="sub-label">Street</span>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.subdivision}</div>
          <span className="sub-label">Subdivision/Barangay</span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.city}</div>
          <span className="sub-label">City/Municipality</span>
        </div>
      </div>

      {/* CONTACT INFO */}
      <div className="grid-row three-cols height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>Landline:</label>
          <div className="value-line">{data?.landline}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
        <div className="sfinput-group vertical-border">
          <label>Mobile Number/s:</label>
          <div className="value-line">{data?.mobile}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
        <div className="sfinput-group">
          <label>E-mail Address:</label>
          <div className="value-line">{data?.email}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
      </div>

      {/* STATUS */}
      <div className="grid-row six-cols-aligned height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>DATE OF BIRTH</label>
          <div className="value-line">{data?.dob}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
        <div className="sfinput-group vertical-border">
          <label>AGE</label>
          <div className="value-line">{data?.age}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
        <div className="sfinput-group vertical-border">
          <label>GENDER</label>
          <div className="value-line">{data?.gender}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
        <div className="sfinput-group vertical-border">
          <label>RELIGION</label>
          <div className="value-line">{data?.religion}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
        <div className="sfinput-group vertical-border">
          <label>NATIONALITY</label>
          <div className="value-line">{data?.nationality}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
        <div className="sfinput-group vertical-border last-cell">
          <label>CIVIL STATUS</label>
          <div className="value-line">{data?.civilStatus}</div>
          <span className="sub-label">&nbsp;</span>
        </div>
      </div>

      {/* STATUS 2 */}
      <div className="grid-row six-cols-merged height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>HEIGHT (ft)</label>
          <div className="value-line">{data?.dob}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>WEIGHT (lbs)</label>
          <div className="value-line">{data?.age}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>BMI (for school nurse)</label>
          <div className="value-line">{data?.gender}</div>
        </div>
        <div className="sfinput-group vertical-border span-two">
          <label>Do you have eye or visual problems?<br></br><i>If yes, please specify</i></label>
          <div className="value-line">{data?.religion}</div>
        </div>
        <div className="sfinput-group vertical-border last-cell">
          <label>Languages/<br></br>Dialects</label>
          <div className="value-line">{data?.civilStatus}</div>
        </div>
      </div>

      <div className="grid-row six-cols-aligned height-one border-bottom">
        <div className="sfinput-group hs-name">
          <label>HIGH SCHOOL GRADUATED</label>
          <div className="value-line">{data?.highSchool}</div>
        </div>

        <div className="sfinput-group hs-type vertical-border">
          <label>Public or Private HS?</label>
          <div className="value-line">{data?.hsType}</div>
        </div>

        <div className="sfinput-group last-cell">
          <label>4th Year HS Final<br></br>Gen Average</label>
          <div className="value-line">{data?.hsAverage}</div>
        </div>
      </div>

      {/* Familys Information */}
      <div className="section-title">Family Information</div>
      
      <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>FATHER'S NAME:</label>
          <div className="value-line">{data?.fatherName}</div>
          <div className="checkbox-row">
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Living</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Deceased</span>
            </div>
          </div>    
        </div>

        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Occupation:</label>
            <div className="value-line">{data?.fatherOccupation}</div>
          </div>
          <div className="internal-row">
            <label>Father's Contact Number:</label>
            <div className="value-line">{data?.fatherContact}</div>
          </div>
        </div>
      </div>  

      <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>MOTHER'S NAME:</label>
          <div className="value-line">{data?.fatherName}</div>
          <div className="checkbox-row">
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Living</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Deceased</span>
            </div>
          </div>    
        </div>

        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Occupation:</label>
            <div className="value-line">{data?.fatherOccupation}</div>
          </div>
          <div className="internal-row">
            <label>Mother's Contact Number:</label>
            <div className="value-line">{data?.fatherContact}</div>
          </div>
        </div>
      </div> 

      <div className="grid-row two-cols height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>GUARDIAN'S NAME:</label>
          <div className="value-line">{data?.fatherName}</div>   
        </div>

        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Relationship:</label>
            <div className="value-line">{data?.fatherOccupation}</div>
          </div>
          <div className="internal-row">
            <label>Guardians's Contact Number:</label>
            <div className="value-line">{data?.fatherContact}</div>
          </div>
        </div>
      </div>

      <div className="grid-row six-cols-merged height-three border-bottom">
        <div className="sfinput-group vertical-border">
          <label>Who supports your college education?</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Parents</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Relatives</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Brother or Sister</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Benefactors</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Scholarships</span>
            </div>
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>Parent's Joint Monthly Income</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Below P20K</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">P21K to P40K</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">P41K to P80K</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Above P80K</span>
            </div>
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>While studying in OLFU will you live in?</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Dorm/Boarding house</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Parent's house</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Relative's house</span>
            </div>
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>Daily transportation expense (pesos)</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">&lt;P50</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Bet. P51-P100</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">&gt;P100</span>
            </div>
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>Number of siblings? <i>(kapatid, if any)</i></label>
        </div>
        <div className="sfinput-group">
          <label>ORDINAL POSITION:<br></br><i>Are you the (please check)</i></label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Only Child</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Eldest Child</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Middle Child</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" className="tiny-check" checked={data?.fatherLiving} readOnly />
              <span className="sub-label">Youngest Child</span>
            </div>
          </div> 
        </div>
      </div>

      {/* Familys Information */}
      <div className="section-title sec-title">Achievements, Hobbies, Interest, Etc.</div>
      <div className="grid-row two-cols height-two border-bottom">
        <div className="sfinput-group vertical-border">
          <label>AWARD'S / HONORS RECEIVED</label>
          <div className="value-line">{data?.fatherName}</div>   
        </div>
        <div className="sfinput-group last-cell">
          <label>WHAT CAREER / WORK DO YOU REALLY LIKE TO PURSUE?</label>
          <div className="value-line">{data?.fatherName}</div>   
        </div>
      </div> 

      <div className="grid-row two-cols height-two border-bottom">
        <div className="sfinput-group vertical-border">
          <label>HOBBIES / SPORTS / INTERESTS</label>
          <div className="value-line">{data?.fatherName}</div>   
        </div>
        <div className="sfinput-group last-cell">
          <label>WHAT ACADEMIC CLUB OR EXTRACURRICULAR ACTIVITIES DO YOU WANT TO JOIN?</label>
          <div className="value-line">{data?.fatherName}</div>   
        </div>
      </div>

      {/* Familys Information */}
      <div className="section-title sec-title">Certifications</div>
      <div className="grid-row ">
        <div className="sfinput-group">
          <label><i>I hereby certify that the above information is true and correct to the best  of my knowledge and belief. I understand that I will be subject to disciplinary action should the above information be proved false.</i></label>
        </div>
      </div>
      <div className="grid-row two-cols center-text border-bottom">
        <div className="sfinput-group">
          <div className="value-line">&nbsp;</div>   
          <label>SIGNATURE OVER PRINTED NAME</label>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.fatherName}</div>   
          <label>DATE</label>
        </div>
      </div>
      <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>Course/Year/Section</label>
          <div className="value-line">{data?.fatherName}</div>  
        </div>
        <div className="sfinput-group last-cell">
          <label>Name of Class Adviser</label>
          <div className="value-line">{data?.fatherName}</div>  
        </div>
      </div>

      <div className="grid-row no-border">
        <div className="sfinput-group">
          <label className="footer-label">This record shall only be accomplished by the faculty-in-charge of the course. The student grades below are considered unofficial and are for the STAMP program use only. Any, modification, alteration and unauthorized use of this document is strictly restricted and is subjected to disiplinary actions. The official student academic  records are available only at the Registrar's Office.</label>
        </div>
      </div>

    </div>
   );
}
export default StudentForm;
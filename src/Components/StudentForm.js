import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './StudentForm.css';


function StudentForm({ adminMode = false, studentId: propsId }) {
  const { studentId: paramId } = useParams();  
  

  const effectiveId = propsId || paramId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatToPHT = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const calculateBMI = (weightLbs, heightFt) => {
    if (!weightLbs || !heightFt) return "---";
    const heightInMeters = heightFt * 0.3048;
    const weightInKg = weightLbs * 0.453592;
    const bmi = weightInKg / (heightInMeters ** 2);
    return bmi.toFixed(2);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return "";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
  };

  useEffect(() => {
    if (adminMode && !effectiveId) return;

    const token = sessionStorage.getItem('token');
    
    const fetchUrl = adminMode && effectiveId 
      ? `http://localhost:5000/api/admin/student-form/${effectiveId}` 
      : `http://localhost:5000/api/student/form/me`;

    setLoading(true);

    fetch(fetchUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          let studentData = json.data;

          if (Array.isArray(studentData.support) && studentData.support.length > 0) {
            const rawString = studentData.support[0]; 
            studentData.support = rawString
              .replace(/{|}/g, '')
              .split(',')
              .map(item => item.replace(/"/g, '').trim());
          }
          
          setData(studentData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [effectiveId, adminMode]); // 5. Added effectiveId as dependency

  const formatFullName = (f, m, l, s) => `${f || ''} ${m || ''} ${l || ''} ${s || ''}`.trim();

  if (loading) return <div className="loading-spinner">Loading Form Data...</div>;

  return (
    <div className="form-container">
      {/* ... Personal Information Section ... */}
      <div className="section-title">Personal Information</div>

      <div className="grid-row three-cols height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right">
          <label>FULL NAME</label>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.firstname}</div>
          <span className="sub-label center-text">First Name</span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.lastname}</div>
          <span className="sub-label center-text">Last Name</span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.middlename}</div>
          <span className="sub-label center-text">Middle Name</span>
        </div>
      </div>

      {/* ... Present Address ... */}
      <div className="grid-row four-cols-address height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right">
          <label>PRESENT ADDRESS:</label>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.present_houseno}</div>
          <span className="sub-label center-text">No.</span>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.present_street}</div>
          <span className="sub-label center-text">Street</span>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.present_sbdvsn_brgy}</div>
          <span className="sub-label center-text">Subdivision/Barangay</span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.present_city_mncplty}</div>
          <span className="sub-label center-text">City/Municipality</span>
        </div>
      </div>

      {/* ... Provincial Address ... */}
      <div className="grid-row four-cols-address height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right">
          <label>PROVINCIAL ADDRESS:</label>
        </div>
        <div className="sfinput-group"> 
          <div className="value-line">{data?.provincial_houseno}</div>
          <span className="sub-label center-text">No.</span>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.provincial_street}</div>
          <span className="sub-label center-text">Street</span>
        </div>
        <div className="sfinput-group">
          <div className="value-line">{data?.provincial_sbdvsn_brgy}</div>
          <span className="sub-label center-text">Subdivision/Barangay</span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line">{data?.provincial_city_mncplty}</div>
          <span className="sub-label center-text">City/Municipality</span>
        </div>
      </div>

      {/* ... Contact Info ... */}
      <div className="grid-row three-cols height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>Landline:</label>
          <div className="value-line">{data?.landline_no}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>Mobile Number/s:</label>
          <div className="value-line">{data?.mobile_no}</div>
        </div>
        <div className="sfinput-group">
          <label>E-mail Address:</label>
          <div className="value-line">{data?.email}</div>
        </div>
      </div>

      {/* ... Status & Personal Details ... */}
      <div className="grid-row six-cols-aligned height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>DATE OF BIRTH</label>
          <div className="value-line">{formatToPHT(data?.birth_date)}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>AGE</label>
          <div className="value-line">{calculateAge(data?.birth_date)}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>GENDER</label>
          <div className="value-line">{data?.sex}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>RELIGION</label>
          <div className="value-line">{data?.religion}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>NATIONALITY</label>
          <div className="value-line">{data?.nationality}</div>
        </div>
        <div className="sfinput-group vertical-border last-cell">
          <label>CIVIL STATUS</label>
          <div className="value-line">{data?.civil_status}</div>
        </div>
      </div>

      {/* ... BMI & Physical ... */}
      <div className="grid-row six-cols-merged height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>HEIGHT (ft)</label>
          <div className="value-line">{data?.height}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>WEIGHT (lbs)</label>
          <div className="value-line">{data?.weight}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>BMI</label>
          <div className="value-line">{calculateBMI(data?.weight, data?.height)}</div>
        </div>
        <div className="sfinput-group vertical-border span-two">
          <label>Eye/Visual Problems?</label>
          <div className="value-line">{data?.visual_problems}</div>
        </div>
        <div className="sfinput-group vertical-border last-cell">
          <label>Languages</label>
          <div className="value-line">{data?.language_dialects}</div>
        </div>
      </div>

      {/* ... School Info ... */}
      <div className="grid-row six-cols-aligned height-one border-bottom">
        <div className="sfinput-group hs-name">
          <label>HIGH SCHOOL GRADUATED</label>
          <div className="value-line">{data?.highschool_graduated}</div>
        </div>
        <div className="sfinput-group hs-type vertical-border">
          <label>Public or Private HS?</label>
          <div className="value-line">{data?.pubpriv_hs}</div>
        </div>
        <div className="sfinput-group last-cell">
          <label>HS Final Gen Average</label>
          <div className="value-line">{data?.hs_final_gwa}</div>
        </div>
      </div>

      {/* Family Information */}
      <div className="section-title">Family Information</div>
      
      {/* FATHER */}
      <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>FATHER'S NAME:</label>
          <div className="value-line">
            {formatFullName(data?.father_firstname, data?.father_middlename, data?.father_lastname, data?.father_suffix)}
          </div>
          <div className="checkbox-row">
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.father_alive === 'LIVING'} readOnly />
              <span className="sub-label">Living</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.father_alive === 'DECEASED'} readOnly />
              <span className="sub-label">Deceased</span>
            </div>
          </div>    
        </div>
        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Occupation:</label>
            <div className="value-line">{data?.father_occupation}</div>
          </div>
          <div className="internal-row">
            <label>Contact Number:</label>
            <div className="value-line">{data?.father_contact_no}</div>
          </div>
        </div>
      </div>  

      {/* MOTHER */}
      <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>MOTHER'S NAME:</label>
          <div className="value-line">
            {formatFullName(data?.mother_firstname, data?.mother_middlename, data?.mother_lastname, data?.mother_suffix)}
          </div>
          <div className="checkbox-row">
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.mother_alive === 'LIVING'} readOnly />
              <span className="sub-label">Living</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.mother_alive === 'DECEASED'} readOnly />
              <span className="sub-label">Deceased</span>
            </div>
          </div>    
        </div>
        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Occupation:</label>
            <div className="value-line">{data?.mother_occupation}</div>
          </div>
          <div className="internal-row">
            <label>Contact Number:</label>
            <div className="value-line">{data?.mother_contact_no}</div>
          </div>
        </div>
      </div> 

      {/* GUARDIAN */}
      <div className="grid-row two-cols height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>GUARDIAN'S NAME:</label>
          <div className="value-line">
            {formatFullName(data?.guardian_firstname, data?.guardian_middlename, data?.guardian_lastname, data?.guardian_suffix)}
          </div>   
        </div>
        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Relationship:</label>
            <div className="value-line">{data?.guardian_relation}</div>
          </div>
          <div className="internal-row">
            <label>Contact Number:</label>
            <div className="value-line">{data?.guardian_contact_no}</div>
          </div>
        </div>
      </div>

      {/* SOCIO-ECONOMIC */}
      <div className="grid-row six-cols-merged height-three border-bottom">
        <div className="sfinput-group vertical-border">
          <label>Who supports your college education?</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.support?.includes('PARENTS')} readOnly />
              <span className="sub-label">Parents</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.support?.includes('RELATIVES')} readOnly />
              <span className="sub-label">Relatives</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.support?.includes('BROTHER/SISTER')} readOnly />
              <span className="sub-label">Brother or Sister</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.support?.includes('BENEFACTORS')} readOnly />
              <span className="sub-label">Benefactors</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.support?.includes('SCHOLARSHIPS')} readOnly />
              <span className="sub-label">Scholarships</span>
            </div>
          </div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>Parent's Joint Monthly Income</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.parents_income === 'BELOW P20K'} readOnly />
              <span className="sub-label">Below P20K</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.parents_income === 'P21K TO P40K'} readOnly />
              <span className="sub-label">P21K to P40K</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.parents_income === 'P41K TO P80K'} readOnly />
              <span className="sub-label">P41K to P60K</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.parents_income === 'ABOVE P80K'} readOnly />
              <span className="sub-label">Above P80K</span>
            </div>
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>While studying in OLFU, will you live in</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.living_in === 'DORM/BOARDING HOUSE'} readOnly />
              <span className="sub-label">Dorm/Boarding House</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.living_in === "PARENT'S HOUSE"} readOnly />
              <span className="sub-label">Parent's house</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.living_in === "RELATIVE'S HOUSE"} readOnly />
              <span className="sub-label">Relative's house</span>
            </div>
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>Daily Transportation</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.daily_transpo_expense === '<P50'} readOnly />
              <span className="sub-label">&lt;P50</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.daily_transpo_expense === 'BETWEEN P51-P100'} readOnly />
              <span className="sub-label">Bet. P51-P100</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.daily_transpo_expense === '>P100'} readOnly />
              <span className="sub-label">&gt;P100</span>
            </div>
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>Siblings:</label>
          <div className="value-line large-text">{data?.no_siblings}</div>
        </div>
        <div className="sfinput-group">
          <label>Ordinal Position</label>
          <div className="checkbox-col">
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.ordinal_position === 'ONLY CHILD'} readOnly />
              <span className="sub-label">Only Child</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.ordinal_position === 'ELDEST CHILD'} readOnly />
              <span className="sub-label">Eldest Child</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.ordinal_position === 'MIDDLE CHILD'} readOnly />
              <span className="sub-label">Middle Child</span>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" checked={data?.ordinal_position === 'YOUNGEST CHILD'} readOnly />
              <span className="sub-label">Youngest Child</span>
            </div>
          </div> 
        </div>
      </div>

      {/* ACHIEVEMENTS */}
      <div className="section-title sec-title">Achievements & Interests</div>
      <div className="grid-row two-cols height-two border-bottom">
        <div className="sfinput-group vertical-border">
          <label>AWARD'S / HONORS RECEIVED</label>
          <div className="value-line">{data?.awards_honors}</div>   
        </div>
        <div className="sfinput-group last-cell">
          <label>WHAT CAREER/WORK DO YOU REALLY LIKE TO PURSUE?</label>
          <div className="value-line">{data?.future_career}</div>   
        </div>
      </div> 

      <div className="grid-row two-cols height-two border-bottom">
        <div className="sfinput-group vertical-border">
          <label>HOBBIES / SPORTS / INTERESTS</label>
          <div className="value-line">{data?.hobbies_interests}</div>   
        </div>
        <div className="sfinput-group last-cell">
          <label>WHAT ACADEMIC CLUB OR EXTRACURRICULAR ACTIVITIES DO YOU WANT TO JOIN?</label>
          <div className="value-line">{data?.acad_clubs_extracurr}</div>   
        </div>
      </div>

      <div className="section-title sec-title">Certifications</div>
      <div className="grid-row">
        <span className="sub-label left-text divider">
          <i> 
            I hereby certify that the information above is true an correct to the best of my knowledge an belief. 
            I understand that I will be subject to disciplinary action should the above information to be proved false.
          </i>
        </span>
      </div>

      {/* FOOTER */}
      <div className="grid-row two-cols center-text border-bottom">
        <div className="sfinput-group">
          <div className="value-line small-text">{data?.firstname} {data?.lastname}</div>   
          <span className="sub-label center-text closer">SIGNATURE OVER PRINTED NAME </span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line small-text"> {new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          }).format(new Date())}
        </div>
          <span className="sub-label center-text closer">Date</span>
        </div>
      </div>

       <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>COURSE/YEAR/SECTION</label>
          <div className="value-line">{data?.program} {data?.year_level} {data?.section}</div>
        </div>
        <div className="sfinput-group last-cell">
          <label>NAME OF CLASS ADVISER</label>
        </div>
      </div> 

    </div>
  );
}
export default StudentForm;
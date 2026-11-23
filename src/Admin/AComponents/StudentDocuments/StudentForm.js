import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './StudentForm.css';
import EditableField from './EditableField';
import EditableCheckbox from './EditableCheckbox';

const Sk = ({ w = '100%', h = 14 }) => (
  <span className="sf-sk" aria-hidden="true" style={{ width: w, height: h }} />
);

const SkField = ({ cls = '', label = '60%', span }) => (
  <div className={`sfinput-group ${cls}`} style={{ gap: 8, ...(span ? { gridColumn: `span ${span}` } : {}) }}>
    <Sk w={label} h={12} />
    <Sk />
  </div>
);

const StudentFormSkeleton = () => (
  <div className="form-container sf-sk-root" role="status" aria-busy="true" aria-label="Loading student form">
    <div className="section-title sf-sk" style={{ height: 24, width: '40%', marginBottom: 12 }} />
    <div className="grid-row three-cols height-one border-bottom">
      <div className="sfinput-group col-span-4 no-border-right"><Sk w={80} h={12} /></div>
      <div className="sfinput-group"><Sk h={16} /></div>
      <div className="sfinput-group last-cell"><Sk h={16} /></div>
      <div className="sfinput-group last-cell"><Sk h={16} /></div>
    </div>
    {[0, 1].map((i) => (
      <div key={i} className="grid-row four-cols-address height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right"><Sk w={100} h={12} /></div>
        <div className="sfinput-group"><Sk h={16} /></div>
        <div className="sfinput-group"><Sk h={16} /></div>
        <div className="sfinput-group"><Sk h={16} /></div>
        <div className="sfinput-group last-cell"><Sk h={16} /></div>
      </div>
    ))}
    <div className="grid-row three-cols height-one border-bottom">
      <SkField cls="vertical-border" label={60} />
      <SkField cls="vertical-border" label={80} />
      <SkField label={80} />
    </div>
    <div className="grid-row six-cols-aligned height-one border-bottom">
      {Array.from({ length: 6 }).map((_, i) => <SkField key={i} cls={i < 5 ? 'vertical-border' : 'last-cell'} />)}
    </div>
    <div className="grid-row six-cols-merged height-one border-bottom">
      {Array.from({ length: 5 }).map((_, i) => <SkField key={i} cls={i < 4 ? 'vertical-border' : 'last-cell'} span={i === 3 ? 2 : undefined} />)}
    </div>
    <div className="grid-row six-cols-aligned height-one border-bottom">
      <SkField cls="hs-name" span={3} />
      <SkField cls="hs-type vertical-border" span={2} />
      <SkField cls="last-cell" />
    </div>
    <div className="section-title sf-sk" style={{ height: 24, width: '40%', margin: '12px 0' }} />
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="grid-row two-cols border-bottom" style={{ marginBottom: 8 }}>
        <div className="sfinput-group vertical-border" style={{ padding: 12, gap: 8 }}>
          <Sk w={80} h={12} />
          <Sk w="80%" h={16} />
        </div>
        <div className="sfinput-group last-cell" style={{ padding: 12, gap: 8 }}>
          <Sk h={16} />
          <Sk h={16} />
        </div>
      </div>
    ))}
  </div>
);

function StudentForm({ adminMode = false, studentId: propsId, studentData, onReady, isEditing = false, onUpdate }) {
  const { studentId: paramId } = useParams();
  const effectiveId = propsId || paramId;

  const [data, setData] = useState(studentData || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!studentData);

  const formatToPHT = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);
  };

  const calculateBMI = (weightLbs, heightFt) => {
    if (!weightLbs || !heightFt) return "---";
    const heightInMeters = heightFt * 0.3048;
    const weightInKg = weightLbs * 0.453592;
    return (weightInKg / (heightInMeters ** 2)).toFixed(2);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return "";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  useEffect(() => {
    if (studentData) {
      setData(studentData);
      setLoading(false);
      return;
    }
    if (adminMode && !effectiveId) return;

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const fetchUrl = adminMode && effectiveId ? `${process.env.REACT_APP_API_URL}/admin/student-form/${effectiveId}` : `${process.env.REACT_APP_API_URL}/student/form/me`;
    setLoading(true);

    fetch(fetchUrl, { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => { if (!res.ok) throw new Error('Request failed'); return res.json(); })
      .then((json) => {
        if (json.success) {
          let fetchedData = json.data;
          if (Array.isArray(fetchedData.support) && fetchedData.support.length > 0) {
            const rawString = fetchedData.support[0]; 
            fetchedData.support = rawString.replace(/{|}/g, '').split(',').map(item => item.replace(/"/g, '').trim());
          }
          setData(fetchedData);
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load form'); setLoading(false); });
  }, [effectiveId, adminMode, studentData]);

  useEffect(() => {
    if (!loading && data && typeof onReady === 'function') onReady();
  }, [loading, data, onReady]);

  const handleFieldChange = (field, newValue) => {
    const newData = { ...data, [field]: newValue };
    if (onUpdate) onUpdate(newData);
    else setData(newData);
  };

  const formatFullName = (f, m, l, s) => `${f || ''} ${m || ''} ${l || ''} ${s || ''}`.trim();

  if (loading) return <StudentFormSkeleton />;
  if (error)   return <div className="loading-spinner" role="alert">{error}</div>;
  if (!data)   return <div className="loading-spinner">No form data available.</div>;

  return (
    <div className="form-container">
      <div className="section-title">Personal Information</div>

      <div className="grid-row three-cols height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right"><label>FULL NAME</label></div>
        <div className="sfinput-group">
          <EditableField value={data?.firstname} onChange={(val) => handleFieldChange('firstname', val)} isEditing={isEditing} />
          <span className="sub-label center-text">First Name</span>
        </div>
        <div className="sfinput-group last-cell">
          <EditableField value={data?.lastname} onChange={(val) => handleFieldChange('lastname', val)} isEditing={isEditing} />
          <span className="sub-label center-text">Last Name</span>
        </div>
        <div className="sfinput-group last-cell">
          <EditableField value={data?.middlename} onChange={(val) => handleFieldChange('middlename', val)} isEditing={isEditing} />
          <span className="sub-label center-text">Middle Name</span>
        </div>
      </div>

      <div className="grid-row four-cols-address height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right"><label>PRESENT ADDRESS:</label></div>
        <div className="sfinput-group">
          <EditableField value={data?.present_houseno} onChange={(val) => handleFieldChange('present_houseno', val)} isEditing={isEditing} />
          <span className="sub-label center-text">No.</span>
        </div>
        <div className="sfinput-group">
          <EditableField value={data?.present_street} onChange={(val) => handleFieldChange('present_street', val)} isEditing={isEditing} />
          <span className="sub-label center-text">Street</span>
        </div>
        <div className="sfinput-group">
          <EditableField value={data?.present_sbdvsn_brgy} onChange={(val) => handleFieldChange('present_sbdvsn_brgy', val)} isEditing={isEditing} />
          <span className="sub-label center-text">Subdivision/Barangay</span>
        </div>
        <div className="sfinput-group last-cell">
          <EditableField value={data?.present_city_mncplty} onChange={(val) => handleFieldChange('present_city_mncplty', val)} isEditing={isEditing} />
          <span className="sub-label center-text">City/Municipality</span>
        </div>
      </div>

      <div className="grid-row four-cols-address height-one border-bottom">
        <div className="sfinput-group col-span-4 no-border-right"><label>PROVINCIAL ADDRESS:</label></div>
        <div className="sfinput-group">
          <EditableField value={data?.provincial_houseno} onChange={(val) => handleFieldChange('provincial_houseno', val)} isEditing={isEditing} />
          <span className="sub-label center-text">No.</span>
        </div>
        <div className="sfinput-group">
          <EditableField value={data?.provincial_street} onChange={(val) => handleFieldChange('provincial_street', val)} isEditing={isEditing} />
          <span className="sub-label center-text">Street</span>
        </div>
        <div className="sfinput-group">
          <EditableField value={data?.provincial_sbdvsn_brgy} onChange={(val) => handleFieldChange('provincial_sbdvsn_brgy', val)} isEditing={isEditing} />
          <span className="sub-label center-text">Subdivision/Barangay</span>
        </div>
        <div className="sfinput-group last-cell">
          <EditableField value={data?.provincial_city_mncplty} onChange={(val) => handleFieldChange('provincial_city_mncplty', val)} isEditing={isEditing} />
          <span className="sub-label center-text">City/Municipality</span>
        </div>
      </div>

      <div className="grid-row three-cols height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>Landline:</label>
          <EditableField value={data?.landline_no} onChange={(val) => handleFieldChange('landline_no', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group vertical-border">
          <label>Mobile Number/s:</label>
          <EditableField value={data?.mobile_no} onChange={(val) => handleFieldChange('mobile_no', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group">
          <label>E-mail Address:</label>
          <EditableField value={data?.email} onChange={(val) => handleFieldChange('email', val)} isEditing={isEditing} />
        </div>
      </div>

      <div className="grid-row six-cols-aligned height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>DATE OF BIRTH</label>
          {isEditing ? (
            <EditableField value={data?.birth_date?.split('T')[0]} onChange={(val) => handleFieldChange('birth_date', val)} isEditing={isEditing} />
          ) : (
            <div className="value-line">{formatToPHT(data?.birth_date)}</div>
          )}
        </div>
        <div className="sfinput-group vertical-border">
          <label>AGE</label>
          <div className="value-line">{calculateAge(data?.birth_date)}</div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>GENDER</label>
          <EditableField value={data?.sex} onChange={(val) => handleFieldChange('sex', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group vertical-border">
          <label>RELIGION</label>
          <EditableField value={data?.religion} onChange={(val) => handleFieldChange('religion', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group vertical-border">
          <label>NATIONALITY</label>
          <EditableField value={data?.nationality} onChange={(val) => handleFieldChange('nationality', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group vertical-border last-cell">
          <label>CIVIL STATUS</label>
          <EditableField value={data?.civil_status} onChange={(val) => handleFieldChange('civil_status', val)} isEditing={isEditing} />
        </div>
      </div>

      <div className="grid-row six-cols-merged height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>HEIGHT (ft)</label>
          <EditableField value={data?.height} onChange={(val) => handleFieldChange('height', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group vertical-border">
          <label>WEIGHT (lbs)</label>
          <EditableField value={data?.weight} onChange={(val) => handleFieldChange('weight', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group vertical-border">
          <label>BMI</label>
          <div className="value-line">{calculateBMI(data?.weight, data?.height)}</div>
        </div>
        <div className="sfinput-group vertical-border span-two">
          <label>Eye/Visual Problems?</label>
          <EditableField value={data?.visual_problems} onChange={(val) => handleFieldChange('visual_problems', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group vertical-border last-cell">
          <label>Languages</label>
          <EditableField value={data?.language_dialects} onChange={(val) => handleFieldChange('language_dialects', val)} isEditing={isEditing} />
        </div>
      </div>

      <div className="grid-row six-cols-aligned height-one border-bottom">
        <div className="sfinput-group hs-name">
          <label>HIGH SCHOOL GRADUATED</label>
          <EditableField value={data?.highschool_graduated} onChange={(val) => handleFieldChange('highschool_graduated', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group hs-type vertical-border">
          <label>Public or Private HS?</label>
          <EditableField value={data?.pubpriv_hs} onChange={(val) => handleFieldChange('pubpriv_hs', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group last-cell">
          <label>HS Final Gen Average</label>
          <EditableField value={data?.hs_final_gwa} onChange={(val) => handleFieldChange('hs_final_gwa', val)} isEditing={isEditing} />
        </div>
      </div>

      <div className="section-title">Family Information</div>
      
      <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>FATHER'S NAME:</label>
          <EditableField value={formatFullName(data?.father_firstname, data?.father_middlename, data?.father_lastname, data?.father_suffix)} onChange={(val) => handleFieldChange('father_firstname', val)} isEditing={isEditing} />
          <div className="checkbox-row">
            <EditableCheckbox label="Living" checked={data?.father_alive === 'LIVING'} onChange={(checked) => handleFieldChange('father_alive', checked ? 'LIVING' : 'DECEASED')} isEditing={isEditing} />
            <EditableCheckbox label="Deceased" checked={data?.father_alive === 'DECEASED'} onChange={(checked) => handleFieldChange('father_alive', checked ? 'DECEASED' : 'LIVING')} isEditing={isEditing} />
          </div>    
        </div>
        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Occupation:</label>
            <EditableField value={data?.father_occupation} onChange={(val) => handleFieldChange('father_occupation', val)} isEditing={isEditing} />
          </div>
          <div className="internal-row">
            <label>Contact Number:</label>
            <EditableField value={data?.father_contact_no} onChange={(val) => handleFieldChange('father_contact_no', val)} isEditing={isEditing} />
          </div>
        </div>
      </div>  

      <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>MOTHER'S NAME:</label>
          <EditableField value={formatFullName(data?.mother_firstname, data?.mother_middlename, data?.mother_lastname, data?.mother_suffix)} onChange={(val) => handleFieldChange('mother_firstname', val)} isEditing={isEditing} />
          <div className="checkbox-row">
            <EditableCheckbox label="Living" checked={data?.mother_alive === 'LIVING'} onChange={(checked) => handleFieldChange('mother_alive', checked ? 'LIVING' : 'DECEASED')} isEditing={isEditing} />
            <EditableCheckbox label="Deceased" checked={data?.mother_alive === 'DECEASED'} onChange={(checked) => handleFieldChange('mother_alive', checked ? 'DECEASED' : 'LIVING')} isEditing={isEditing} />
          </div>    
        </div>
        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Occupation:</label>
            <EditableField value={data?.mother_occupation} onChange={(val) => handleFieldChange('mother_occupation', val)} isEditing={isEditing} />
          </div>
          <div className="internal-row">
            <label>Contact Number:</label>
            <EditableField value={data?.mother_contact_no} onChange={(val) => handleFieldChange('mother_contact_no', val)} isEditing={isEditing} />
          </div>
        </div>
      </div> 

      <div className="grid-row two-cols height-one border-bottom">
        <div className="sfinput-group vertical-border">
          <label>GUARDIAN'S NAME:</label>
          <EditableField value={formatFullName(data?.guardian_firstname, data?.guardian_middlename, data?.guardian_lastname, data?.guardian_suffix)} onChange={(val) => handleFieldChange('guardian_firstname', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group two-rows last-cell">
          <div className="internal-row two-cols border-bottom">
            <label>Relationship:</label>
            <EditableField value={data?.guardian_relation} onChange={(val) => handleFieldChange('guardian_relation', val)} isEditing={isEditing} />
          </div>
          <div className="internal-row">
            <label>Contact Number:</label>
            <EditableField value={data?.guardian_contact_no} onChange={(val) => handleFieldChange('guardian_contact_no', val)} isEditing={isEditing} />
          </div>
        </div>
      </div>

      <div className="grid-row six-cols-merged height-three border-bottom">
        <div className="sfinput-group vertical-border">
          <label>Who supports your college education?</label>
          <div className="checkbox-col">
            <EditableCheckbox label="Parents" checked={data?.support?.includes('PARENTS')} onChange={(checked) => handleFieldChange('support', checked ? [...(data.support||[]), 'PARENTS'] : (data.support||[]).filter(s => s !== 'PARENTS'))} isEditing={isEditing} />
            <EditableCheckbox label="Relatives" checked={data?.support?.includes('RELATIVES')} onChange={(checked) => handleFieldChange('support', checked ? [...(data.support||[]), 'RELATIVES'] : (data.support||[]).filter(s => s !== 'RELATIVES'))} isEditing={isEditing} />
            <EditableCheckbox label="Brother or Sister" checked={data?.support?.includes('BROTHER/SISTER')} onChange={(checked) => handleFieldChange('support', checked ? [...(data.support||[]), 'BROTHER/SISTER'] : (data.support||[]).filter(s => s !== 'BROTHER/SISTER'))} isEditing={isEditing} />
            <EditableCheckbox label="Benefactors" checked={data?.support?.includes('BENEFACTORS')} onChange={(checked) => handleFieldChange('support', checked ? [...(data.support||[]), 'BENEFACTORS'] : (data.support||[]).filter(s => s !== 'BENEFACTORS'))} isEditing={isEditing} />
            <EditableCheckbox label="Scholarships" checked={data?.support?.includes('SCHOLARSHIPS')} onChange={(checked) => handleFieldChange('support', checked ? [...(data.support||[]), 'SCHOLARSHIPS'] : (data.support||[]).filter(s => s !== 'SCHOLARSHIPS'))} isEditing={isEditing} />
          </div>
        </div>
        <div className="sfinput-group vertical-border">
          <label>Parent's Joint Monthly Income</label>
          <div className="checkbox-col">
            <EditableCheckbox label="Below P20K" checked={data?.parents_income === 'BELOW P20K'} onChange={(checked) => handleFieldChange('parents_income', checked ? 'BELOW P20K' : '')} isEditing={isEditing} />
            <EditableCheckbox label="P21K to P40K" checked={data?.parents_income === 'P21K TO P40K'} onChange={(checked) => handleFieldChange('parents_income', checked ? 'P21K TO P40K' : '')} isEditing={isEditing} />
            <EditableCheckbox label="P41K to P60K" checked={data?.parents_income === 'P41K TO P80K'} onChange={(checked) => handleFieldChange('parents_income', checked ? 'P41K TO P80K' : '')} isEditing={isEditing} />
            <EditableCheckbox label="Above P80K" checked={data?.parents_income === 'ABOVE P80K'} onChange={(checked) => handleFieldChange('parents_income', checked ? 'ABOVE P80K' : '')} isEditing={isEditing} />
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>While studying in OLFU, will you live in</label>
          <div className="checkbox-col">
            <EditableCheckbox label="Dorm/Boarding House" checked={data?.living_in === 'DORM/BOARDING HOUSE'} onChange={(checked) => handleFieldChange('living_in', checked ? 'DORM/BOARDING HOUSE' : '')} isEditing={isEditing} />
            <EditableCheckbox label="Parent's house" checked={data?.living_in === "PARENT'S HOUSE"} onChange={(checked) => handleFieldChange('living_in', checked ? "PARENT'S HOUSE" : '')} isEditing={isEditing} />
            <EditableCheckbox label="Relative's house" checked={data?.living_in === "RELATIVE'S HOUSE"} onChange={(checked) => handleFieldChange('living_in', checked ? "RELATIVE'S HOUSE" : '')} isEditing={isEditing} />
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>Daily Transportation</label>
          <div className="checkbox-col">
            <EditableCheckbox label="<P50" checked={data?.daily_transpo_expense === '<P50'} onChange={(checked) => handleFieldChange('daily_transpo_expense', checked ? '<P50' : '')} isEditing={isEditing} />
            <EditableCheckbox label="Bet. P51-P100" checked={data?.daily_transpo_expense === 'BETWEEN P51-P100'} onChange={(checked) => handleFieldChange('daily_transpo_expense', checked ? 'BETWEEN P51-P100' : '')} isEditing={isEditing} />
            <EditableCheckbox label=">P100" checked={data?.daily_transpo_expense === '>P100'} onChange={(checked) => handleFieldChange('daily_transpo_expense', checked ? '>P100' : '')} isEditing={isEditing} />
          </div> 
        </div>
        <div className="sfinput-group vertical-border">
          <label>Siblings:</label>
          <EditableField className="value-line large-text" value={data?.no_siblings} onChange={(val) => handleFieldChange('no_siblings', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group">
          <label>Ordinal Position</label>
          <div className="checkbox-col">
            <EditableCheckbox label="Only Child" checked={data?.ordinal_position === 'ONLY CHILD'} onChange={(checked) => handleFieldChange('ordinal_position', checked ? 'ONLY CHILD' : '')} isEditing={isEditing} />
            <EditableCheckbox label="Eldest Child" checked={data?.ordinal_position === 'ELDEST CHILD'} onChange={(checked) => handleFieldChange('ordinal_position', checked ? 'ELDEST CHILD' : '')} isEditing={isEditing} />
            <EditableCheckbox label="Middle Child" checked={data?.ordinal_position === 'MIDDLE CHILD'} onChange={(checked) => handleFieldChange('ordinal_position', checked ? 'MIDDLE CHILD' : '')} isEditing={isEditing} />
            <EditableCheckbox label="Youngest Child" checked={data?.ordinal_position === 'YOUNGEST CHILD'} onChange={(checked) => handleFieldChange('ordinal_position', checked ? 'YOUNGEST CHILD' : '')} isEditing={isEditing} />
          </div> 
        </div>
      </div>

      <div className="section-title sec-title">Achievements & Interests</div>
      <div className="grid-row two-cols height-two border-bottom">
        <div className="sfinput-group vertical-border">
          <label>AWARD'S / HONORS RECEIVED</label>
          <EditableField value={data?.awards_honors} onChange={(val) => handleFieldChange('awards_honors', val)} isEditing={isEditing} multiline />
        </div>
        <div className="sfinput-group last-cell">
          <label>WHAT CAREER/WORK DO YOU REALLY LIKE TO PURSUE?</label>
          <EditableField value={data?.future_career} onChange={(val) => handleFieldChange('future_career', val)} isEditing={isEditing} multiline />
        </div>
      </div> 

      <div className="grid-row two-cols height-two border-bottom">
        <div className="sfinput-group vertical-border">
          <label>HOBBIES / SPORTS / INTERESTS</label>
          <EditableField value={data?.hobbies_interests} onChange={(val) => handleFieldChange('hobbies_interests', val)} isEditing={isEditing} multiline />
        </div>
        <div className="sfinput-group last-cell">
          <label>WHAT ACADEMIC CLUB OR EXTRACURRICULAR ACTIVITIES DO YOU WANT TO JOIN?</label>
          <EditableField value={data?.acad_clubs_extracurr} onChange={(val) => handleFieldChange('acad_clubs_extracurr', val)} isEditing={isEditing} multiline />
        </div>
      </div>

      <div className="section-title sec-title" style={{ backgroundColor: '#000', color: '#fff', textAlign: 'center', fontWeight: 'bold', padding: '5px', margin: '0', height: 'auto', display: 'block', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        Certifications
      </div>
      <div className="grid-row" style={{ padding: '0', margin: '0' }}>
        <span className="sub-label left-text" style={{ display: 'block', padding: '10px', margin: '0', fontSize: '10px', lineHeight: '1.3', textAlign: 'justify', color: '#000' }}>
          <i>I hereby certify that the information above is true and correct to the best of my knowledge and belief. I understand that I will be subject to disciplinary action should the above information be proved false.</i>
        </span>
      </div>

      <div className="grid-row two-cols center-text border-bottom">
        <div className="sfinput-group">
          <div className="value-line small-text">{data?.firstname} {data?.lastname}</div>   
          <span className="sub-label center-text closer">SIGNATURE OVER PRINTED NAME </span>
        </div>
        <div className="sfinput-group last-cell">
          <div className="value-line small-text">{new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date())}</div>
          <span className="sub-label center-text closer">Date</span>
        </div>
      </div>

       <div className="grid-row two-cols border-bottom">
        <div className="sfinput-group vertical-border">
          <label>COURSE/YEAR/SECTION</label>
          <EditableField value={data?.section} onChange={(val) => handleFieldChange('section', val)} isEditing={isEditing} />
        </div>
        <div className="sfinput-group last-cell">
          <label>NAME OF CLASS ADVISER</label>
        </div>
      </div> 
    </div>
  );
}
export default StudentForm;
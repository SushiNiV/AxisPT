import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../GlobalForm.css';
import '../../GlobalOverlay.css';
import '../../Global.css';

const AddStudent = ({ onClose, onSuccess, studentToEdit = null, initialData = null }) => {
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [portalRoot] = useState(document.getElementById('portal-root') || document.body);

  // Accept either prop name to prevent breakage
  const studentData = studentToEdit || initialData;
  const isEditMode = !!studentData;

  const [formData, setFormData] = useState({
    // Primary / System
    studentNumber: '',
    email: '',
    accountStatus: true,
    
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    sex: 'Male',
    birthDate: '',
    placeOfBirth: '',
    phoneNumber: '',
    landline: '',
    religion: '',
    nationality: 'Filipino',
    civilStatus: 'Single',
    height: '',
    weight: '',
    language: '',
    visualProblems: '',

    // Permanent Address
    permHouseNo: '',
    permStreet: '',
    permSubdivision: '',
    permBarangay: '',
    permCity: '',
    permProvince: '',

    // Provincial Address
    sameAsPermanent: false,
    provHouseNo: '',
    provStreet: '',
    provSubdivision: '',
    provBarangay: '',
    provCity: '',
    provProvince: '',

    // Program & Education
    programId: '',
    yearLevel: '1',
    classification: 'Regular',
    highschoolGraduated: '',
    pubprivHS: 'Public',
    schoolAddress: '',
    hsFinalGWA: '',

    // Family Information
    fatherName: '',
    fatherStatus: 'Living',
    fatherOccupation: '',
    fatherContact: '',
    motherName: '',
    motherStatus: 'Living',
    motherOccupation: '',
    motherContact: ''
  });

  // Fetch Programs on Mount
  useEffect(() => {
    const fetchPrograms = async () => {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers });
        const data = await response.json();
        if (data.success) setPrograms(data.data);
      } catch (error) {
        console.error("Error fetching programs:", error);
      }
    };

    fetchPrograms();
  }, []);

  // Populate form in edit mode
  useEffect(() => {
    if (studentData) {
      setFormData({
        studentNumber: studentData.student_number || '',
        email: studentData.email || studentData.school_email || studentData.personal_email || '',
        accountStatus: typeof studentData.account_status === 'boolean' 
          ? studentData.account_status 
          : studentData.account_status === 'Active' || studentData.account_status === 1 || studentData.account_status === true,
        
        firstName: studentData.first_name || '',
        middleName: studentData.middle_name || '',
        lastName: studentData.last_name || '',
        suffix: studentData.suffix || '',
        sex: studentData.sex || 'Male',
        birthDate: studentData.birth_date ? studentData.birth_date.split('T')[0] : '',
        placeOfBirth: studentData.place_of_birth || '',
        phoneNumber: studentData.mobile_no || studentData.phone_number || '',
        landline: studentData.landline || '',
        religion: studentData.religion || '',
        nationality: studentData.nationality || 'Filipino',
        civilStatus: studentData.civil_status || 'Single',
        height: studentData.height || '',
        weight: studentData.weight || '',
        language: studentData.language_dialect || studentData.language || '',
        visualProblems: studentData.visual_problems || '',

        permHouseNo: studentData.perm_house_no || '',
        permStreet: studentData.perm_street || studentData.street || '',
        permSubdivision: studentData.perm_subdivision || '',
        permBarangay: studentData.perm_barangay || studentData.barangay || '',
        permCity: studentData.perm_city || studentData.city_municipality || '',
        permProvince: studentData.perm_province || studentData.province || '',

        sameAsPermanent: !!studentData.same_as_permanent,
        provHouseNo: studentData.prov_house_no || '',
        provStreet: studentData.prov_street || '',
        provSubdivision: studentData.prov_subdivision || '',
        provBarangay: studentData.prov_barangay || '',
        provCity: studentData.prov_city || '',
        provProvince: studentData.prov_province || '',

        programId: studentData.program_id || '',
        yearLevel: studentData.year_level?.toString() || '1',
        classification: studentData.classification || 'Regular',
        highschoolGraduated: studentData.highschool_graduated || '',
        pubprivHS: studentData.pub_priv_hs || 'Public',
        schoolAddress: studentData.hs_school_address || '',
        hsFinalGWA: studentData.hs_final_gwa || '',

        fatherName: studentData.father_name || '',
        fatherStatus: studentData.father_status || 'Living',
        fatherOccupation: studentData.father_occupation || '',
        fatherContact: studentData.father_contact || '',
        motherName: studentData.mother_name || '',
        motherStatus: studentData.mother_status || 'Living',
        motherOccupation: studentData.mother_occupation || '',
        motherContact: studentData.mother_contact || ''
      });
    }
  }, [studentData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'sameAsPermanent') {
      setFormData(prev => ({
        ...prev,
        sameAsPermanent: checked,
        ...(checked ? {
          provHouseNo: prev.permHouseNo,
          provStreet: prev.permStreet,
          provSubdivision: prev.permSubdivision,
          provBarangay: prev.permBarangay,
          provCity: prev.permCity,
          provProvince: prev.permProvince
        } : {})
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.studentNumber || !formData.email || !formData.programId || !formData.yearLevel) {
      alert("Please fill in all required primary fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const studentId = studentData?.student_id;
      const url = isEditMode && studentId
        ? `${process.env.REACT_APP_API_URL}/admin/students/${studentId}`
        : `${process.env.REACT_APP_API_URL}/admin/students`;
      
      const method = isEditMode && studentId ? 'PUT' : 'POST';

      const payload = {
        // Primary
        student_number: formData.studentNumber,
        email: formData.email,
        account_status: Boolean(formData.accountStatus),

        // Personal Information
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        suffix: formData.suffix,
        sex: formData.sex,
        birth_date: formData.birthDate || null,
        place_of_birth: formData.placeOfBirth,
        mobile_no: formData.phoneNumber,
        landline: formData.landline,
        religion: formData.religion,
        nationality: formData.nationality,
        civil_status: formData.civilStatus,
        height: formData.height,
        weight: formData.weight,
        language_dialect: formData.language,
        visual_problems: formData.visualProblems,

        // Permanent Address
        perm_house_no: formData.permHouseNo,
        perm_street: formData.permStreet,
        perm_subdivision: formData.permSubdivision,
        perm_barangay: formData.permBarangay,
        perm_city: formData.permCity,
        perm_province: formData.permProvince,

        // Provincial Address
        same_as_permanent: formData.sameAsPermanent,
        prov_house_no: formData.sameAsPermanent ? formData.permHouseNo : formData.provHouseNo,
        prov_street: formData.sameAsPermanent ? formData.permStreet : formData.provStreet,
        prov_subdivision: formData.sameAsPermanent ? formData.permSubdivision : formData.provSubdivision,
        prov_barangay: formData.sameAsPermanent ? formData.permBarangay : formData.provBarangay,
        prov_city: formData.sameAsPermanent ? formData.permCity : formData.provCity,
        prov_province: formData.sameAsPermanent ? formData.permProvince : formData.provProvince,

        // Program and Education
        program_id: formData.programId ? parseInt(formData.programId) : null,
        year_level: formData.yearLevel ? parseInt(formData.yearLevel) : null,
        classification: formData.classification,
        highschool_graduated: formData.highschoolGraduated,
        pub_priv_hs: formData.pubprivHS,
        hs_school_address: formData.schoolAddress,
        hs_final_gwa: formData.hsFinalGWA ? parseFloat(formData.hsFinalGWA) : null,

        // Family
        father_name: formData.fatherName,
        father_status: formData.fatherStatus,
        father_occupation: formData.fatherOccupation,
        father_contact: formData.fatherContact,
        mother_name: formData.motherName,
        mother_status: formData.motherStatus,
        mother_occupation: formData.motherOccupation,
        mother_contact: formData.motherContact
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        alert(isEditMode ? "Student record updated successfully!" : "Student record created successfully!");
        onSuccess();
      } else {
        alert(data.message || (isEditMode ? "Failed to update student." : "Failed to create student."));
      }
    } catch (error) {
      console.error("Error submitting student:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="modalOverlay">
      <div className="modalContainer">
        
        {/* Global Modal Header */}
        <div className="modalHeader">
          <h3 className="modalTitle">
            {isEditMode ? "EDIT STUDENT RECORD" : "ADD NEW STUDENT"}
          </h3>
          <div className="CloseBtnArea">
            <button className="CloseBtn" onClick={onClose} disabled={isSubmitting}>
              &times;
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modalScrollArea">
          
          {/* SECTION 1: PRIMARY DETAILS */}
          <div className="formSection">
            <h4 className="sectionHeading">Primary Details</h4>
            
            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">FIRST NAME *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="formGroup">
                <label className="formLabel">MIDDLE NAME</label>
                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">LAST NAME *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">SUFFIX</label>
                <input type="text" name="suffix" value={formData.suffix} onChange={handleChange} placeholder="e.g. Jr., III" />
              </div>
              <div className="formGroup">
                <label className="formLabel">STUDENT NUMBER *</label>
                <input type="text" name="studentNumber" value={formData.studentNumber} onChange={handleChange} required />
              </div>
              <div className="formGroup">
                <label className="formLabel">EMAIL ADDRESS *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">PROGRAM *</label>
                <select name="programId" value={formData.programId} onChange={handleChange} required>
                  <option value="">Select Program</option>
                  {programs.map(prog => (
                    <option key={prog.program_id} value={prog.program_id}>
                      {prog.program_abbr || prog.program_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">YEAR LEVEL *</label>
                <select name="yearLevel" value={formData.yearLevel} onChange={handleChange} required>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">STATUS</label>
                <div className="statusToggleContainer" onClick={() => setFormData(p => ({ ...p, accountStatus: !p.accountStatus }))}>
                  <div className={`statusSwitch ${formData.accountStatus ? 'active' : 'inactive'}`}>
                    <div className="switchHandle" />
                  </div>
                  <span className={`statusLabel ${formData.accountStatus ? 'text-active' : 'text-inactive'}`}>
                    {formData.accountStatus ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACCORDION TOGGLE BUTTON */}
          <div className="accordionToggleArea">
            <button 
              type="button" 
              className="accordionBtn"
              onClick={() => setShowDetailedInfo(!showDetailedInfo)}
            >
              <span>{showDetailedInfo ? "Hide Detailed Information" : "View / Edit Detailed Student Information"}</span>
              <span className={`arrow ${showDetailedInfo ? 'open' : ''}`}>&#9660;</span>
            </button>
          </div>

          {/* SECTION 3: COLLAPSIBLE DETAILED INFORMATION */}
          {showDetailedInfo && (
            <div className="detailedInfoContainer">
              
              {/* GROUP 1: PERSONAL INFORMATION */}
              <h4 className="sectionHeading">Personal Information</h4>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">SEX</label>
                  <select name="sex" value={formData.sex} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel">DATE OF BIRTH</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">PLACE OF BIRTH</label>
                  <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} />
                </div>
              </div>

              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">PHONE (MOBILE)</label>
                  <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">LANDLINE</label>
                  <input type="text" name="landline" value={formData.landline} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">CIVIL STATUS</label>
                  <select name="civilStatus" value={formData.civilStatus} onChange={handleChange}>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
              </div>

              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">RELIGION</label>
                  <input type="text" name="religion" value={formData.religion} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">NATIONALITY</label>
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">LANGUAGE / DIALECT</label>
                  <input type="text" name="language" value={formData.language} onChange={handleChange} />
                </div>
              </div>

              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">HEIGHT</label>
                  <input type="text" name="height" value={formData.height} onChange={handleChange} placeholder="e.g. 170 cm" />
                </div>
                <div className="formGroup">
                  <label className="formLabel">WEIGHT</label>
                  <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 65 kg" />
                </div>
                <div className="formGroup">
                  <label className="formLabel">VISUAL PROBLEM</label>
                  <input type="text" name="visualProblems" value={formData.visualProblems} onChange={handleChange} placeholder="e.g. N/A or Glasses" />
                </div>
              </div>

              {/* PERMANENT ADDRESS */}
              <h5 className="subSectionHeading" style={{ marginTop: '10px', marginBottom: '8px', color: '#555' }}>Permanent Address</h5>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">HOUSE NO. / STREET</label>
                  <input type="text" name="permHouseNo" value={formData.permHouseNo} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">SUBDIVISION / STREET</label>
                  <input type="text" name="permStreet" value={formData.permStreet} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">BARANGAY</label>
                  <input type="text" name="permBarangay" value={formData.permBarangay} onChange={handleChange} />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">CITY / MUNICIPALITY</label>
                  <input type="text" name="permCity" value={formData.permCity} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">PROVINCE</label>
                  <input type="text" name="permProvince" value={formData.permProvince} onChange={handleChange} />
                </div>
              </div>

              {/* PROVINCIAL ADDRESS */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px', marginBottom: '8px' }}>
                <h5 className="subSectionHeading" style={{ margin: 0, color: '#555' }}>Provincial Address</h5>
                <label style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input 
                    type="checkbox" 
                    name="sameAsPermanent" 
                    checked={formData.sameAsPermanent} 
                    onChange={handleChange} 
                  />
                  Same as Permanent Address
                </label>
              </div>

              {!formData.sameAsPermanent && (
                <>
                  <div className="formRow split3">
                    <div className="formGroup">
                      <label className="formLabel">HOUSE NO. / STREET</label>
                      <input type="text" name="provHouseNo" value={formData.provHouseNo} onChange={handleChange} />
                    </div>
                    <div className="formGroup">
                      <label className="formLabel">SUBDIVISION / STREET</label>
                      <input type="text" name="provStreet" value={formData.provStreet} onChange={handleChange} />
                    </div>
                    <div className="formGroup">
                      <label className="formLabel">BARANGAY</label>
                      <input type="text" name="provBarangay" value={formData.provBarangay} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="formRow split2">
                    <div className="formGroup">
                      <label className="formLabel">CITY / MUNICIPALITY</label>
                      <input type="text" name="provCity" value={formData.provCity} onChange={handleChange} />
                    </div>
                    <div className="formGroup">
                      <label className="formLabel">PROVINCE</label>
                      <input type="text" name="provProvince" value={formData.provProvince} onChange={handleChange} />
                    </div>
                  </div>
                </>
              )}

              {/* GROUP 2: PROGRAM AND EDUCATION */}
              <h4 className="sectionHeading" style={{ marginTop: '20px' }}>Program and Education</h4>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">CLASSIFICATION</label>
                  <select name="classification" value={formData.classification} onChange={handleChange}>
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                    <option value="Transferee">Transferee</option>
                    <option value="Returnee">Returnee</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel">PRIVATE OR PUBLIC</label>
                  <select name="pubprivHS" value={formData.pubprivHS} onChange={handleChange}>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">HIGH SCHOOL GRADUATED</label>
                  <input type="text" name="highschoolGraduated" value={formData.highschoolGraduated} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">4TH YEAR HS FINAL GWA</label>
                  <input type="number" step="0.01" name="hsFinalGWA" value={formData.hsFinalGWA} onChange={handleChange} placeholder="e.g. 88.50" />
                </div>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label className="formLabel">SCHOOL ADDRESS</label>
                  <input type="text" name="schoolAddress" value={formData.schoolAddress} onChange={handleChange} />
                </div>
              </div>

              {/* GROUP 3: FAMILY INFORMATION */}
              <h4 className="sectionHeading" style={{ marginTop: '20px' }}>Family Information</h4>
              
              <h5 className="subSectionHeading" style={{ marginBottom: '8px', color: '#555' }}>Father's Details</h5>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">FATHER FULL NAME</label>
                  <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">STATUS</label>
                  <select name="fatherStatus" value={formData.fatherStatus} onChange={handleChange}>
                    <option value="Living">Living</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">OCCUPATION</label>
                  <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">CONTACT NUMBER</label>
                  <input type="text" name="fatherContact" value={formData.fatherContact} onChange={handleChange} />
                </div>
              </div>

              <h5 className="subSectionHeading" style={{ marginTop: '10px', marginBottom: '8px', color: '#555' }}>Mother's Details</h5>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">MOTHER FULL NAME</label>
                  <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">STATUS</label>
                  <select name="motherStatus" value={formData.motherStatus} onChange={handleChange}>
                    <option value="Living">Living</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">OCCUPATION</label>
                  <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">CONTACT NUMBER</label>
                  <input type="text" name="motherContact" value={formData.motherContact} onChange={handleChange} />
                </div>
              </div>

            </div>
          )}

          {/* Modal Actions */}
          <div className="modalFooter">
            <button type="button" className="cancelBtn" onClick={onClose} disabled={isSubmitting}>
              CANCEL
            </button>
            <button type="submit" className="submitBtn" disabled={isSubmitting}>
              {isSubmitting ? "SAVING..." : (isEditMode ? "UPDATE STUDENT" : "CREATE STUDENT")}
            </button>
          </div>

        </form>

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, portalRoot);
};

export default AddStudent;
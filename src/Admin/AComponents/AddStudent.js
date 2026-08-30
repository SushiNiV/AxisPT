import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../GlobalForm.css';
import '../../GlobalOverlay.css';
import '../../Global.css';

const AddStudent = ({ onClose, onSuccess, studentToEdit = null, initialData = null }) => {
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programs, setPrograms] = useState([]);

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
    motherContact: '',

    // Guardian's Details (optional)
    guardianName: '',
    guardianOccupation: '',
    guardianContact: '',

    // Family Background
    support: '',
    parentsIncome: '',
    livingIn: '',
    dailyTranspoExpense: '',
    noSiblings: '',
    ordinalPosition: '',

    // Achievements, Hobbies, Interests
    awardsHonors: '',
    hobbiesInterests: '',
    futureCareer: '',
    academicClubsExtracurr: ''
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
        studentNumber: studentData.student_number || studentData.studentNumber || '',
        email: studentData.email || studentData.school_email || studentData.personal_email || '',
        accountStatus: typeof studentData.account_status === 'boolean' 
          ? studentData.account_status 
          : studentData.account_status === 'Active' || studentData.account_status === 1 || studentData.account_status === true,
        
        firstName: studentData.first_name || studentData.firstname || studentData.firstName || '',
        middleName: studentData.middle_name || studentData.middlename || studentData.middleName || '',
        lastName: studentData.last_name || studentData.lastname || studentData.lastName || '',
        suffix: studentData.suffix || '',
        sex: studentData.sex || 'Male',
        birthDate: studentData.birth_date ? studentData.birth_date.split('T')[0] : (studentData.birthDate || ''),
        placeOfBirth: studentData.place_of_birth || studentData.placeOfBirth || '',
        phoneNumber: studentData.mobile_no || studentData.phoneNumber || studentData.phone_number || '',
        landline: studentData.landline || studentData.landline_no || '',
        religion: studentData.religion || '',
        nationality: studentData.nationality || 'Filipino',
        civilStatus: studentData.civil_status || studentData.civilStatus || 'Single',
        height: studentData.height || '',
        weight: studentData.weight || '',
        language: studentData.language_dialect || studentData.language_dialects || studentData.language || '',
        visualProblems: studentData.visual_problems || studentData.visualProblems || '',

        // Permanent / Present Address
        permHouseNo: studentData.perm_house_no || studentData.present_houseno || studentData.permHouseNo || '',
        permStreet: studentData.perm_street || studentData.present_street || studentData.street || studentData.permStreet || '',
        permSubdivision: studentData.perm_subdivision || studentData.permSubdivision || '',
        permBarangay: studentData.perm_barangay || studentData.present_sbdvsn_brgy || studentData.barangay || studentData.permBarangay || '',
        permCity: studentData.perm_city || studentData.present_city_mncplty || studentData.city_municipality || studentData.permCity || '',
        permProvince: studentData.perm_province || studentData.province || studentData.permProvince || '',

        // Provincial Address
        sameAsPermanent: !!studentData.same_as_permanent,
        provHouseNo: studentData.prov_house_no || studentData.provincial_houseno || studentData.provHouseNo || '',
        provStreet: studentData.prov_street || studentData.provincial_street || studentData.provStreet || '',
        provSubdivision: studentData.prov_subdivision || studentData.provSubdivision || '',
        provBarangay: studentData.prov_barangay || studentData.provincial_sbdvsn_brgy || studentData.provBarangay || '',
        provCity: studentData.prov_city || studentData.provincial_city_mncplty || studentData.provCity || '',
        provProvince: studentData.prov_province || studentData.provProvince || '',

        // Program and Education
        programId: studentData.program_id || studentData.curriculum_id || studentData.programId || '',
        yearLevel: studentData.year_level?.toString() || studentData.yearLevel?.toString() || '1',
        classification: studentData.classification || 'Regular',
        highschoolGraduated: studentData.highschool_graduated || studentData.highschoolGraduated || '',
        pubprivHS: studentData.pub_priv_hs || studentData.pubprivHS || 'Public',
        schoolAddress: studentData.hs_school_address || studentData.schoolAddress || '',
        hsFinalGWA: studentData.hs_final_gwa || studentData.hsFinalGWA || '',

        // Family Details
        fatherName: studentData.father_name || studentData.father_firstname || studentData.fatherName || '',
        fatherStatus: studentData.father_status || studentData.fatherStatus || 'Living',
        fatherOccupation: studentData.father_occupation || studentData.fatherOccupation || '',
        fatherContact: studentData.father_contact || studentData.father_contact_no || studentData.fatherContact || '',
        motherName: studentData.mother_name || studentData.mother_firstname || studentData.motherName || '',
        motherStatus: studentData.mother_status || studentData.motherStatus || 'Living',
        motherOccupation: studentData.mother_occupation || studentData.motherOccupation || '',
        motherContact: studentData.mother_contact || studentData.mother_contact_no || studentData.motherContact || '',

        // Guardian's Details
        guardianName: studentData.guardian_name || studentData.guardian_firstname || studentData.guardianName || '',
        guardianOccupation: studentData.guardian_occupation || studentData.guardianOccupation || '',
        guardianContact: studentData.guardian_contact || studentData.guardian_contact_no || studentData.guardianContact || '',

        // Family Background
        support: studentData.support || '',
        parentsIncome: studentData.parents_income || studentData.parentsIncome || '',
        livingIn: studentData.living_in || studentData.livingIn || '',
        dailyTranspoExpense: studentData.daily_transpo_expense || studentData.dailyTranspoExpense || '',
        noSiblings: studentData.no_siblings ?? studentData.noSiblings ?? '',
        ordinalPosition: studentData.ordinal_position || studentData.ordinalPosition || '',

        // Achievements, Hobbies, Interests
        awardsHonors: studentData.awards_honors || studentData.awardsHonors || '',
        hobbiesInterests: studentData.hobbies_interests || studentData.hobbiesInterests || '',
        futureCareer: studentData.future_career || studentData.futureCareer || '',
        academicClubsExtracurr: studentData.acad_extracurr || studentData.acad_clubs_extracurr || studentData.academicClubsExtracurr || ''
      });

      // Expand accordion automatically in Edit mode
      setShowDetailedInfo(true);
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
      const studentId = studentData?.student_id || studentData?.studentId;
      const url = isEditMode && studentId
        ? `${process.env.REACT_APP_API_URL}/admin/students/${studentId}`
        : `${process.env.REACT_APP_API_URL}/admin/students`;
      
      const method = isEditMode && studentId ? 'PUT' : 'POST';

      const payload = {
        // Primary / User
        student_number: formData.studentNumber,
        studentNumber: formData.studentNumber,
        school_email: formData.email,
        email: formData.email,
        account_status: Boolean(formData.accountStatus),
        accountStatus: Boolean(formData.accountStatus),

        // Personal Information (PII)
        first_name: formData.firstName,
        firstName: formData.firstName,
        middle_name: formData.middleName || null,
        middleName: formData.middleName || null,
        last_name: formData.lastName,
        lastName: formData.lastName,
        suffix: formData.suffix || null,
        sex: formData.sex,
        birth_date: formData.birthDate || null,
        birthDate: formData.birthDate || null,
        place_of_birth: formData.placeOfBirth || null,
        placeOfBirth: formData.placeOfBirth || null,
        mobile_no: formData.phoneNumber || null,
        phoneNumber: formData.phoneNumber || null,
        landline: formData.landline || null,
        religion: formData.religion || null,
        nationality: formData.nationality || 'Filipino',
        civil_status: formData.civilStatus || 'Single',
        civilStatus: formData.civilStatus || 'Single',
        height: formData.height || null,
        weight: formData.weight || null,
        language_dialects: formData.language || null,
        language_dialect: formData.language || null,
        language: formData.language || null,
        visual_problems: formData.visualProblems || null,
        visualProblems: formData.visualProblems || null,

        // Permanent / Present Address
        present_houseno: formData.permHouseNo || null,
        present_street: formData.permStreet || null,
        present_sbdvsn_brgy: formData.permBarangay || null,
        present_city_mncplty: formData.permCity || null,
        perm_house_no: formData.permHouseNo || null,
        perm_street: formData.permStreet || null,
        perm_barangay: formData.permBarangay || null,
        perm_city: formData.permCity || null,
        perm_province: formData.permProvince || null,

        // Provincial Address
        same_as_permanent: formData.sameAsPermanent,
        provincial_houseno: formData.sameAsPermanent ? formData.permHouseNo : formData.provHouseNo || null,
        provincial_street: formData.sameAsPermanent ? formData.permStreet : formData.provStreet || null,
        provincial_sbdvsn_brgy: formData.sameAsPermanent ? formData.permBarangay : formData.provBarangay || null,
        provincial_city_mncplty: formData.sameAsPermanent ? formData.permCity : formData.provCity || null,
        prov_house_no: formData.sameAsPermanent ? formData.permHouseNo : formData.provHouseNo || null,
        prov_street: formData.sameAsPermanent ? formData.permStreet : formData.provStreet || null,
        prov_barangay: formData.sameAsPermanent ? formData.permBarangay : formData.provBarangay || null,
        prov_city: formData.sameAsPermanent ? formData.permCity : formData.provCity || null,
        prov_province: formData.sameAsPermanent ? formData.permProvince : formData.provProvince || null,

        // Program and Education
        program_id: formData.programId ? parseInt(formData.programId, 10) : null,
        curriculum_id: formData.programId ? parseInt(formData.programId, 10) : null,
        programId: formData.programId ? parseInt(formData.programId, 10) : null,
        year_level: formData.yearLevel ? String(formData.yearLevel) : '1',
        yearLevel: formData.yearLevel ? String(formData.yearLevel) : '1',
        classification: formData.classification || 'Regular',
        highschool_graduated: formData.highschoolGraduated || null,
        highschoolGraduated: formData.highschoolGraduated || null,
        pub_priv_hs: formData.pubprivHS || 'Public',
        pubprivHS: formData.pubprivHS || 'Public',
        hs_school_address: formData.schoolAddress || null,
        schoolAddress: formData.schoolAddress || null,
        hs_final_gwa: formData.hsFinalGWA && !isNaN(formData.hsFinalGWA) ? parseFloat(formData.hsFinalGWA) : null,
        hsFinalGWA: formData.hsFinalGWA && !isNaN(formData.hsFinalGWA) ? parseFloat(formData.hsFinalGWA) : null,

        // Family Information
        father_firstname: formData.fatherName || null,
        father_name: formData.fatherName || null,
        fatherName: formData.fatherName || null,
        father_status: formData.fatherStatus || 'Living',
        fatherStatus: formData.fatherStatus || 'Living',
        father_occupation: formData.fatherOccupation || null,
        fatherOccupation: formData.fatherOccupation || null,
        father_contact: formData.fatherContact || null,
        father_contact_no: formData.fatherContact || null,
        fatherContact: formData.fatherContact || null,

        mother_firstname: formData.motherName || null,
        mother_name: formData.motherName || null,
        motherName: formData.motherName || null,
        mother_status: formData.motherStatus || 'Living',
        motherStatus: formData.motherStatus || 'Living',
        mother_occupation: formData.motherOccupation || null,
        motherOccupation: formData.motherOccupation || null,
        mother_contact: formData.motherContact || null,
        mother_contact_no: formData.motherContact || null,
        motherContact: formData.motherContact || null,

        // Guardian's Details
        guardian_firstname: formData.guardianName || null,
        guardian_name: formData.guardianName || null,
        guardianName: formData.guardianName || null,
        guardian_occupation: formData.guardianOccupation || null,
        guardianOccupation: formData.guardianOccupation || null,
        guardian_contact: formData.guardianContact || null,
        guardian_contact_no: formData.guardianContact || null,
        guardianContact: formData.guardianContact || null,

        // Family Background
        support: formData.support || null,
        supportSource: formData.support || null,
        parents_income: formData.parentsIncome || null,
        parentsIncome: formData.parentsIncome || null,
        living_in: formData.livingIn || null,
        livingIn: formData.livingIn || null,
        daily_transpo_expense: formData.dailyTranspoExpense || null,
        dailyTranspoExpense: formData.dailyTranspoExpense || null,
        no_siblings: formData.noSiblings !== '' ? parseInt(formData.noSiblings, 10) : null,
        noSiblings: formData.noSiblings !== '' ? parseInt(formData.noSiblings, 10) : null,
        ordinal_position: formData.ordinalPosition || null,
        ordinalPosition: formData.ordinalPosition || null,

        // Achievements, Hobbies, Interests
        awards_honors: formData.awardsHonors || null,
        awardsHonors: formData.awardsHonors || null,
        hobbies_interests: formData.hobbiesInterests || null,
        hobbiesInterests: formData.hobbiesInterests || null,
        future_career: formData.futureCareer || null,
        futureCareer: formData.futureCareer || null,
        acad_extracurr: formData.academicClubsExtracurr || null,
        academicClubsExtracurr: formData.academicClubsExtracurr || null
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

      if (data.success || response.ok) {
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
      {/* Form now correctly wraps the container with full-height flex rendering */}
      <form onSubmit={handleSubmit} className="modalContainer" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Global Modal Header */}
        <div className="modalHeader">
          <h3 className="modalTitle">
            {isEditMode ? "EDIT STUDENT RECORD" : "ADD NEW STUDENT"}
          </h3>
          <div className="CloseBtnArea">
            <button type="button" className="CloseBtn" onClick={onClose} disabled={isSubmitting}>
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable Modal Area */}
        <div className="modalScrollArea">
          
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
                      {prog.program_abbr || prog.program_code || prog.program_name}
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
              onClick={() => setShowDetailedInfo(prev => !prev)}
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

              <h5 className="subSectionHeading" style={{ marginTop: '10px', marginBottom: '8px', color: '#555' }}>Guardian's Details (if any)</h5>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">GUARDIAN FULL NAME</label>
                  <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">CONTACT NUMBER</label>
                  <input type="text" name="guardianContact" value={formData.guardianContact} onChange={handleChange} />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">OCCUPATION</label>
                  <input type="text" name="guardianOccupation" value={formData.guardianOccupation} onChange={handleChange} />
                </div>
              </div>

              {/* GROUP 4: FAMILY BACKGROUND */}
              <h4 className="sectionHeading" style={{ marginTop: '20px' }}>Family Background</h4>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">WHO SUPPORTS YOUR EDUCATION?</label>
                  <select name="support" value={formData.support} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Parents">Parents</option>
                    <option value="Relatives">Relatives</option>
                    <option value="Brother or Sister">Brother or Sister</option>
                    <option value="Benefactors">Benefactors</option>
                    <option value="Scholarship">Scholarship</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel">PARENTS' JOINT MONTHLY INCOME</label>
                  <select name="parentsIncome" value={formData.parentsIncome} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Below P20K">Below P20K</option>
                    <option value="P21K to P40K">P21K to P40K</option>
                    <option value="P41K to P60K">P41K to P60K</option>
                    <option value="Above P80K">Above P80K</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel">WHILE STUDYING, WILL YOU LIVE IN</label>
                  <select name="livingIn" value={formData.livingIn} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Dorm/Boarding House">Dorm/Boarding House</option>
                    <option value="Parent's House">Parent's House</option>
                    <option value="Relative's House">Relative's House</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">DAILY TRANSPORTATION EXPENSE</label>
                  <select name="dailyTranspoExpense" value={formData.dailyTranspoExpense} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="< P50">Less than P50</option>
                    <option value="P51-P100">P51 to P100</option>
                    <option value="> P100">More than P100</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label className="formLabel">NUMBER OF SIBLINGS</label>
                  <input type="number" min="0" name="noSiblings" value={formData.noSiblings} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">ORDINAL POSITION</label>
                  <select name="ordinalPosition" value={formData.ordinalPosition} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Only Child">Only Child</option>
                    <option value="Eldest Child">Eldest Child</option>
                    <option value="Middle Child">Middle Child</option>
                    <option value="Youngest Child">Youngest Child</option>
                  </select>
                </div>
              </div>

              {/* GROUP 5: ACHIEVEMENTS, HOBBIES, INTERESTS */}
              <h4 className="sectionHeading" style={{ marginTop: '20px' }}>Achievements, Hobbies &amp; Interests</h4>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">AWARDS / HONORS RECEIVED</label>
                  <textarea rows="2" name="awardsHonors" value={formData.awardsHonors} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">CAREER / WORK YOU WANT TO PURSUE</label>
                  <textarea rows="2" name="futureCareer" value={formData.futureCareer} onChange={handleChange} />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">HOBBIES / SPORTS / INTERESTS</label>
                  <textarea rows="2" name="hobbiesInterests" value={formData.hobbiesInterests} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">ACADEMIC CLUBS / EXTRACURRICULARS</label>
                  <textarea rows="2" name="academicClubsExtracurr" value={formData.academicClubsExtracurr} onChange={handleChange} />
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

        </div>

      </form>
    </div>
  );

  const portalTarget = document.getElementById('portal-root') || document.body;
  return ReactDOM.createPortal(modalContent, portalTarget);
};

export default AddStudent;
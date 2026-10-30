import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import ConfirmationModal from '../ConfirmationModal';
import Dropdown from '../../../Components/shared/Dropdown'; 
import '../../../GlobalStyle/GlobalForm.css';
import '../../../GlobalStyle/GlobalOverlay.css';
import '../../../GlobalStyle/Global.css';

const AddStudent = ({ onClose, onSuccess, studentToEdit = null, initialData = null }) => {
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [rawSections, setRawSections] = useState([]);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  const studentData = studentToEdit || initialData;
  const isEditMode = !!studentData;

  const [formData, setFormData] = useState({
    // Primary / System
    studentNumber: '',
    email: '',
    accountStatus: true,

    // Manual status (edit mode only)
    probationStatus: 'Automatic',
    standing: 'Regular',
    statusReason: '',

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
    sectionId:'',
    yearLevel: '1',
    classification: 'New',
    highschoolGraduated: '',
    pubprivHS: 'Public',
    schoolAddress: '',
    hsFinalGWA: '',

    // Father
    fatherFirstName: '',
    fatherMiddleName: '',
    fatherLastName: '',
    fatherSuffix: '',
    fatherStatus: 'Living',
    fatherOccupation: '',
    fatherContact: '',

    // Mother
    motherFirstName: '',
    motherMiddleName: '',
    motherLastName: '',
    motherSuffix: '',
    motherStatus: 'Living',
    motherOccupation: '',
    motherContact: '',

    // Guardian
    guardianFirstName: '',
    guardianMiddleName: '',
    guardianLastName: '',
    guardianSuffix: '',
    guardianOccupation: '',
    guardianContact: '',

    // Family Background
    support: '',
    parentsIncome: '',
    livingIn: '',
    dailyTranspoExpense: '',
    noSiblings: '',
    ordinalPosition: '',

    // Achievements
    awardsHonors: '',
    hobbiesInterests: '',
    futureCareer: '',
    academicClubsExtracurr: ''
  });

  // Fetch Programs on Mount
  useEffect(() => {
    const fetchPrograms = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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

  useEffect(() => {
    setRawSections([]);
    if (!formData.programId) return;

    let cancelled = false;
    const fetchSections = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      try {
        const params = new URLSearchParams();
        if (formData.yearLevel) params.set('yearLevel', formData.yearLevel);
        const qs = params.toString();

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/sections/by-program/${formData.programId}${qs ? `?${qs}` : ''}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await response.json();
        if (!cancelled && data.success) setRawSections(data.data);
      } catch (err) {
        if (!cancelled) console.error('Error fetching sections:', err);
      }
    };
    fetchSections();

    return () => { cancelled = true; };
  }, [formData.programId, formData.yearLevel]);
  
  const sections = useMemo(() => {
    const yl = String(formData.yearLevel || '');
    let list = rawSections.filter((s) => !yl || String(s.year_level) === yl);

    const programUnchanged =
      isEditMode &&
      String(studentData?.program_id || studentData?.curriculum_id || '') === String(formData.programId || '');

    if (
      programUnchanged &&
      studentData?.section_id &&
      !list.some((s) => String(s.section_id) === String(studentData.section_id))
    ) {
      list = [
        {
          section_id: studentData.section_id,
          assignment_id: studentData.assignment_id,
          section_name: studentData.section || `(Section #${studentData.section_id})`,
          year_level: studentData.year_level,
          year_id: studentData.year_id,
          semester_id: studentData.semester_id,
        },
        ...list,
      ];
    }
    return list;
  }, [rawSections, formData.yearLevel, formData.programId, isEditMode, studentData]);

  // Populate form in edit mode
  useEffect(() => {
    if (studentData) {
      setFormData({
        studentNumber: studentData.student_number || studentData.studentNumber || '',
        email: studentData.email || studentData.school_email || studentData.personal_email || '',
        accountStatus: typeof studentData.account_status === 'boolean'
          ? studentData.account_status
          : studentData.account_status === 'Active' || studentData.account_status === 1 || studentData.account_status === true,
        sectionId: studentData.section_id || studentData.sectionId || '',
        firstName: studentData.first_name || studentData.firstname || studentData.firstName || '',
        middleName: studentData.middle_name || studentData.middlename || studentData.middleName || '',
        lastName: studentData.last_name || studentData.lastname || studentData.lastName || '',
        suffix: studentData.suffix || '',
        sex: studentData.sex || 'Male',
        probationStatus: studentData.academic_status_overridden ? studentData.academic_status : 'Automatic',
        standing: studentData.standing || 'Regular',
        statusReason: '',
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

        permHouseNo: studentData.perm_house_no || studentData.present_houseno || studentData.permHouseNo || '',
        permStreet: studentData.perm_street || studentData.present_street || studentData.street || studentData.permStreet || '',
        permSubdivision: studentData.perm_subdivision || studentData.permSubdivision || '',
        permBarangay: studentData.perm_barangay || studentData.present_sbdvsn_brgy || studentData.barangay || studentData.permBarangay || '',
        permCity: studentData.perm_city || studentData.present_city_mncplty || studentData.city_municipality || studentData.permCity || '',
        permProvince: studentData.perm_province || studentData.province || studentData.permProvince || '',

        sameAsPermanent: !!studentData.same_as_permanent,
        provHouseNo: studentData.prov_house_no || studentData.provincial_houseno || studentData.provHouseNo || '',
        provStreet: studentData.prov_street || studentData.provincial_street || studentData.provStreet || '',
        provSubdivision: studentData.prov_subdivision || studentData.provSubdivision || '',
        provBarangay: studentData.prov_barangay || studentData.provincial_sbdvsn_brgy || studentData.provBarangay || '',
        provCity: studentData.prov_city || studentData.provincial_city_mncplty || studentData.provCity || '',
        provProvince: studentData.prov_province || studentData.provProvince || '',

        programId: studentData.program_id || studentData.curriculum_id || studentData.programId || '',
        sectionId: studentData.section_id || studentData.sectionId || '',
        yearLevel: studentData.year_level?.toString() || studentData.yearLevel?.toString() || '1',
        classification: studentData.classification || 'New',
        highschoolGraduated: studentData.highschool_graduated || studentData.highschoolGraduated || '',
        pubprivHS: studentData.pub_priv_hs || studentData.pubprivHS || 'Public',
        schoolAddress: studentData.hs_school_address || studentData.schoolAddress || '',
        hsFinalGWA: studentData.hs_final_gwa || studentData.hsFinalGWA || '',

        fatherFirstName: studentData.father_firstname || studentData.father_first_name || studentData.fatherFirstName || '',
        fatherMiddleName: studentData.father_middlename || studentData.father_middle_name || studentData.fatherMiddleName || '',
        fatherLastName: studentData.father_lastname || studentData.father_last_name || studentData.fatherLastName || '',
        fatherSuffix: studentData.father_suffix || studentData.fatherSuffix || '',
        fatherStatus: studentData.father_status || studentData.fatherStatus || 'Living',
        fatherOccupation: studentData.father_occupation || studentData.fatherOccupation || '',
        fatherContact: studentData.father_contact || studentData.father_contact_no || studentData.fatherContact || '',

        motherFirstName: studentData.mother_firstname || studentData.mother_first_name || studentData.motherFirstName || '',
        motherMiddleName: studentData.mother_middlename || studentData.mother_middle_name || studentData.motherMiddleName || '',
        motherLastName: studentData.mother_lastname || studentData.mother_last_name || studentData.motherLastName || '',
        motherSuffix: studentData.mother_suffix || studentData.motherSuffix || '',
        motherStatus: studentData.mother_status || studentData.motherStatus || 'Living',
        motherOccupation: studentData.mother_occupation || studentData.motherOccupation || '',
        motherContact: studentData.mother_contact || studentData.mother_contact_no || studentData.motherContact || '',

        guardianFirstName: studentData.guardian_firstname || studentData.guardian_first_name || studentData.guardianFirstName || '',
        guardianMiddleName: studentData.guardian_middlename || studentData.guardian_middle_name || studentData.guardianMiddleName || '',
        guardianLastName: studentData.guardian_lastname || studentData.guardian_last_name || studentData.guardianLastName || '',
        guardianSuffix: studentData.guardian_suffix || studentData.guardianSuffix || '',
        guardianOccupation: studentData.guardian_occupation || studentData.guardianOccupation || '',
        guardianContact: studentData.guardian_contact || studentData.guardian_contact_no || studentData.guardianContact || '',

        support: studentData.support || '',
        parentsIncome: studentData.parents_income || studentData.parentsIncome || '',
        livingIn: studentData.living_in || studentData.livingIn || '',
        dailyTranspoExpense: studentData.daily_transpo_expense || studentData.dailyTranspoExpense || '',
        noSiblings: studentData.no_siblings ?? studentData.noSiblings ?? '',
        ordinalPosition: studentData.ordinal_position || studentData.ordinalPosition || '',

        awardsHonors: studentData.awards_honors || studentData.awardsHonors || '',
        hobbiesInterests: studentData.hobbies_interests || studentData.hobbiesInterests || '',
        futureCareer: studentData.future_career || studentData.futureCareer || '',
        academicClubsExtracurr: studentData.acad_extracurr || studentData.acad_clubs_extracurr || studentData.academicClubsExtracurr || ''
      });

      setShowDetailedInfo(false);
    }
  }, [studentData]);

  const originalProbation = studentData?.academic_status_overridden ? studentData.academic_status : 'Automatic';
  const originalStanding = studentData?.standing || 'Regular';
  const statusChanges = {};
  if (formData.probationStatus !== originalProbation) statusChanges.probation_status = formData.probationStatus;
  if (formData.standing !== originalStanding) statusChanges.standing = formData.standing;
  const hasStatusChanges = isEditMode && Object.keys(statusChanges).length > 0;

  const closeConfirm = () => setConfirmState({ isOpen: false });

  const openAlert = (title, message, variant = 'info') => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      variant,
      isAlert: true,
      onConfirm: closeConfirm,
      onCancel: closeConfirm,
    });
  };

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

    if (name === 'yearLevel') {
      setFormData((prev) => ({ ...prev, yearLevel: value, sectionId: '' }));
      return;
    }

    if (name === 'programId') {
      setFormData((prev) => ({ ...prev, programId: value, sectionId: '' }));
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
      openAlert('Missing Fields', 'Please fill in all required primary fields.', 'warning');
      return;
    }
    if (hasStatusChanges && !formData.statusReason.trim()) {
      openAlert('Reason Required', 'Please enter a reason for the status change.', 'warning');
      return;
    }
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const studentId = studentData?.student_id || studentData?.studentId;
      const url = isEditMode && studentId
        ? `${process.env.REACT_APP_API_URL}/admin/students/${studentId}`
        : `${process.env.REACT_APP_API_URL}/admin/students`;

      const method = isEditMode && studentId ? 'PUT' : 'POST';

      const pickedSection = sections.find(
        (s) => String(s.section_id) === String(formData.sectionId)
      );

      const payload = {
        student_number: formData.studentNumber,
        studentNumber: formData.studentNumber,
        school_email: formData.email,
        email: formData.email,
        account_status: Boolean(formData.accountStatus),
        accountStatus: Boolean(formData.accountStatus),
        section_id: formData.sectionId ? parseInt(formData.sectionId, 10) : null,
        assignment_id: pickedSection?.assignment_id ? parseInt(pickedSection.assignment_id, 10) : null,
        year_id: pickedSection?.year_id ? parseInt(pickedSection.year_id, 10) : null,
        semester_id: pickedSection?.semester_id ? parseInt(pickedSection.semester_id, 10) : null,
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

        present_houseno: formData.permHouseNo || null,
        present_street: formData.permStreet || null,
        present_sbdvsn_brgy: formData.permBarangay || null,
        present_city_mncplty: formData.permCity || null,
        perm_house_no: formData.permHouseNo || null,
        perm_street: formData.permStreet || null,
        perm_barangay: formData.permBarangay || null,
        perm_city: formData.permCity || null,
        perm_province: formData.permProvince || null,

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

        program_id: formData.programId ? parseInt(formData.programId, 10) : null,
        curriculum_id: formData.programId ? parseInt(formData.programId, 10) : null,
        programId: formData.programId ? parseInt(formData.programId, 10) : null,
        year_level: formData.yearLevel ? String(formData.yearLevel) : '1',
        yearLevel: formData.yearLevel ? String(formData.yearLevel) : '1',
        classification: formData.classification || 'New',
        highschool_graduated: formData.highschoolGraduated || null,
        highschoolGraduated: formData.highschoolGraduated || null,
        pub_priv_hs: formData.pubprivHS || 'Public',
        pubprivHS: formData.pubprivHS || 'Public',
        hs_school_address: formData.schoolAddress || null,
        schoolAddress: formData.schoolAddress || null,
        hs_final_gwa: formData.hsFinalGWA && !isNaN(formData.hsFinalGWA) ? parseFloat(formData.hsFinalGWA) : null,
        hsFinalGWA: formData.hsFinalGWA && !isNaN(formData.hsFinalGWA) ? parseFloat(formData.hsFinalGWA) : null,

        father_firstname: formData.fatherFirstName || null,
        father_middlename: formData.fatherMiddleName || null,
        father_lastname: formData.fatherLastName || null,
        father_suffix: formData.fatherSuffix || null,
        father_status: formData.fatherStatus || 'Living',
        father_occupation: formData.fatherOccupation || null,
        father_contact: formData.fatherContact || null,

        mother_firstname: formData.motherFirstName || null,
        mother_middlename: formData.motherMiddleName || null,
        mother_lastname: formData.motherLastName || null,
        mother_suffix: formData.motherSuffix || null,
        mother_status: formData.motherStatus || 'Living',
        mother_occupation: formData.motherOccupation || null,
        mother_contact: formData.motherContact || null,

        guardian_firstname: formData.guardianFirstName || null,
        guardian_middlename: formData.guardianMiddleName || null,
        guardian_lastname: formData.guardianLastName || null,
        guardian_suffix: formData.guardianSuffix || null,
        guardian_occupation: formData.guardianOccupation || null,
        guardian_contact: formData.guardianContact || null,

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
        if (hasStatusChanges) {
          const statusRes = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/students/${studentId}/status`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ ...statusChanges, reason: formData.statusReason.trim() })
            }
          );
          const statusData = await statusRes.json();
          if (!statusData.success) {
            openAlert(
              'Status Change Failed',
              `The student record was saved, but the status change failed: ${statusData.message || 'Unknown error.'}`,
              'danger'
            );
            return; 
          }
        }

        setSuccessState({
          isOpen: true,
          title: isEditMode ? 'Student Updated' : 'Student Created',
          summary: isEditMode
            ? 'The student record has been updated successfully.'
            : 'The student record has been created successfully.',
          variant: 'success',
        });
      } else {
        openAlert(
          isEditMode ? 'Update Failed' : 'Creation Failed',
          data.message || (isEditMode ? "Failed to update student." : "Failed to create student."),
          'danger'
        );
      }
    } catch (error) {
      console.error("Error submitting student:", error);
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Dropdown Options ---
  const programChoices = [
    { value: "", label: "Select Program" },
    ...programs.map(prog => ({
      value: prog.program_id,
      label: prog.program_abbr || prog.program_code || prog.program_name
    }))
  ];

  const sectionChoices = [
    { value: "", label: "Unassigned" },
    ...sections.map(sec => ({
      value: sec.section_id,
      label: sec.section_name
    }))
  ];

  const probationChoices = [
    { value: "Automatic", label: "Automatic (from grades)" },
    { value: "None", label: "None" },
    { value: "Warning", label: "Warning" },
    { value: "Probationary 1", label: "Probationary 1" },
    { value: "Probationary 2", label: "Probationary 2" }
  ];

  const standingChoices = [
    { value: "Regular", label: "Regular" },
    { value: "Irregular", label: "Irregular" }
  ];

  const modalContent = (
    <div className="modalOverlay">
      <form onSubmit={handleSubmit} className="modalContainer" style={{ display: 'flex', flexDirection: 'column' }}>

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

        <div className="modalScrollArea">

          {/* SECTION 1: PRIMARY DETAILS */}
          <div className="formSection">
            <h4 className="sectionHeading">Primary Details</h4>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">FIRST NAME <span style={{color: 'red'}}>*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="formGroup">
                <label className="formLabel">MIDDLE NAME</label>
                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">LAST NAME <span style={{color: 'red'}}>*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">SUFFIX</label>
                <input type="text" name="suffix" value={formData.suffix} onChange={handleChange} placeholder="e.g. Jr., III" />
              </div>
              <div className="formGroup">
                <label className="formLabel">STUDENT NUMBER <span style={{color: 'red'}}>*</span></label>
                <input type="text" name="studentNumber" value={formData.studentNumber} onChange={handleChange} required />
              </div>
              <div className="formGroup">
                <label className="formLabel">EMAIL ADDRESS <span style={{color: 'red'}}>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">PROGRAM <span style={{color: 'red'}}>*</span></label>
                <Dropdown
                  options={programChoices}
                  value={formData.programId}
                  onChange={(val) => handleChange({ target: { name: 'programId', value: val } })}
                  placeholder="Select Program"
                />
              </div>
              <div className="formGroup">
                <label className="formLabel">YEAR LEVEL <span style={{color: 'red'}}>*</span></label>
                <Dropdown
                  options={[
                    { value: "1", label: "1st Year" },
                    { value: "2", label: "2nd Year" },
                    { value: "3", label: "3rd Year" },
                    { value: "4", label: "4th Year" }
                  ]}
                  value={formData.yearLevel}
                  onChange={(val) => handleChange({ target: { name: 'yearLevel', value: val } })}
                  placeholder="Select Year Level"
                />
              </div>
              <div className="formGroup">
                <label className="formLabel">SECTION</label>
                <Dropdown
                  options={sectionChoices}
                  value={formData.sectionId}
                  onChange={(val) => handleChange({ target: { name: 'sectionId', value: val } })}
                  placeholder="Unassigned"
                />
              </div>
            </div>
          </div>

          {isEditMode && (
            <div className="formSection">
              <h4 className="sectionHeading">Academic Status</h4>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">PROBATION STATUS</label>
                  <Dropdown
                    options={probationChoices}
                    value={formData.probationStatus}
                    onChange={(val) => handleChange({ target: { name: 'probationStatus', value: val } })}
                    placeholder="Select Probation Status"
                  />
                  {formData.probationStatus === 'Automatic' && (
                    <small style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                      Calculated from grades: {studentData?.academic_status || 'None'}
                    </small>
                  )}
                </div>
                <div className="formGroup">
                  <label className="formLabel">STANDING</label>
                  <Dropdown
                    options={standingChoices}
                    value={formData.standing}
                    onChange={(val) => handleChange({ target: { name: 'standing', value: val } })}
                    placeholder="Select Standing"
                  />
                </div>
              </div>
              {hasStatusChanges && (
                <div className="formGroup">
                  <label className="formLabel">REASON FOR CHANGE <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="text"
                    name="statusReason"
                    value={formData.statusReason}
                    onChange={handleChange}
                    maxLength={200}
                    placeholder="e.g. Cross-enrollee, completed summer retake"
                  />
                </div>
              )}
            </div>
          )}

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

              <h4 className="sectionHeading">Personal Information</h4>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">SEX</label>
                  <Dropdown
                    options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]}
                    value={formData.sex}
                    onChange={(val) => handleChange({ target: { name: 'sex', value: val } })}
                    placeholder="Select Sex"
                  />
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
                  <Dropdown
                    options={[
                      { value: "Single", label: "Single" },
                      { value: "Married", label: "Married" },
                      { value: "Widowed", label: "Widowed" },
                      { value: "Separated", label: "Separated" }
                    ]}
                    value={formData.civilStatus}
                    onChange={(val) => handleChange({ target: { name: 'civilStatus', value: val } })}
                    placeholder="Select Civil Status"
                  />
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

              <h5 className="subSectionHeading">Permanent Address</h5>
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

              <h4 className="sectionHeading" style={{ marginTop: '20px' }}>Program and Education</h4>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">CLASSIFICATION</label>
                  <Dropdown
                    options={[
                      { value: "New", label: "New" },
                      { value: "Continuing", label: "Continuing" },
                      { value: "Returnee", label: "Returnee" },
                      { value: "Shiftee", label: "Shiftee" },
                      { value: "Transferee", label: "Transferee" }
                    ]}
                    value={formData.classification}
                    onChange={(val) => handleChange({ target: { name: 'classification', value: val } })}
                    placeholder="Select Classification"
                  />
                </div>
                <div className="formGroup">
                  <label className="formLabel">PRIVATE OR PUBLIC</label>
                  <Dropdown
                    options={[{ value: "Public", label: "Public" }, { value: "Private", label: "Private" }]}
                    value={formData.pubprivHS}
                    onChange={(val) => handleChange({ target: { name: 'pubprivHS', value: val } })}
                    placeholder="Select Type"
                  />
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

              <h4 className="sectionHeading" style={{ marginTop: '20px' }}>Family Information</h4>

              <h5 className="subSectionHeading" style={{ marginBottom: '8px', color: '#555' }}>Father's Details</h5>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">First Name</label>
                  <input type="text" name="fatherFirstName" value={formData.fatherFirstName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Middle Name</label>
                  <input type="text" name="fatherMiddleName" value={formData.fatherMiddleName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Last Name</label>
                  <input type="text" name="fatherLastName" value={formData.fatherLastName} onChange={handleChange} />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">Suffix</label>
                  <input type="text" name="fatherSuffix" value={formData.fatherSuffix} onChange={handleChange} placeholder="Jr., III" />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Status</label>
                  <Dropdown
                    options={[{ value: "Living", label: "Living" }, { value: "Deceased", label: "Deceased" }]}
                    value={formData.fatherStatus}
                    onChange={(val) => handleChange({ target: { name: 'fatherStatus', value: val } })}
                    placeholder="Select Status"
                  />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">Occupation</label>
                  <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Contact Number</label>
                  <input type="text" name="fatherContact" value={formData.fatherContact} onChange={handleChange} />
                </div>
              </div>

              <h5 className="subSectionHeading" style={{ marginTop: '10px', marginBottom: '8px', color: '#555' }}>Mother's Details</h5>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">First Name</label>
                  <input type="text" name="motherFirstName" value={formData.motherFirstName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Middle Name</label>
                  <input type="text" name="motherMiddleName" value={formData.motherMiddleName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Last Name</label>
                  <input type="text" name="motherLastName" value={formData.motherLastName} onChange={handleChange} />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">Suffix</label>
                  <input type="text" name="motherSuffix" value={formData.motherSuffix} onChange={handleChange} placeholder="Jr., III" />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Status</label>
                  <Dropdown
                    options={[{ value: "Living", label: "Living" }, { value: "Deceased", label: "Deceased" }]}
                    value={formData.motherStatus}
                    onChange={(val) => handleChange({ target: { name: 'motherStatus', value: val } })}
                    placeholder="Select Status"
                  />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">Occupation</label>
                  <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Contact Number</label>
                  <input type="text" name="motherContact" value={formData.motherContact} onChange={handleChange} />
                </div>
              </div>

              <h5 className="subSectionHeading" style={{ marginTop: '10px', marginBottom: '8px', color: '#555' }}>Guardian's Details (if any)</h5>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">First Name</label>
                  <input type="text" name="guardianFirstName" value={formData.guardianFirstName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Middle Name</label>
                  <input type="text" name="guardianMiddleName" value={formData.guardianMiddleName} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Last Name</label>
                  <input type="text" name="guardianLastName" value={formData.guardianLastName} onChange={handleChange} />
                </div>
              </div>
              <div className="formRow split2">
                <div className="formGroup">
                  <label className="formLabel">Suffix</label>
                  <input type="text" name="guardianSuffix" value={formData.guardianSuffix} onChange={handleChange} placeholder="Jr., III" />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Occupation</label>
                  <input type="text" name="guardianOccupation" value={formData.guardianOccupation} onChange={handleChange} />
                </div>
              </div>
              <div className="formRow">
                <div className="formGroup">
                  <label className="formLabel">Contact Number</label>
                  <input type="text" name="guardianContact" value={formData.guardianContact} onChange={handleChange} />
                </div>
              </div>

              <h4 className="sectionHeading" style={{ marginTop: '20px' }}>Family Background</h4>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">WHO SUPPORTS YOUR EDUCATION?</label>
                  <Dropdown
                    options={[
                      { value: "", label: "-- Select --" },
                      { value: "Parents", label: "Parents" },
                      { value: "Relatives", label: "Relatives" },
                      { value: "Brother or Sister", label: "Brother or Sister" },
                      { value: "Benefactors", label: "Benefactors" },
                      { value: "Scholarship", label: "Scholarship" }
                    ]}
                    value={formData.support}
                    onChange={(val) => handleChange({ target: { name: 'support', value: val } })}
                    placeholder="-- Select --"
                  />
                </div>
                <div className="formGroup">
                  <label className="formLabel">PARENTS' JOINT MONTHLY INCOME</label>
                  <Dropdown
                    options={[
                      { value: "", label: "-- Select --" },
                      { value: "Below P20K", label: "Below P20K" },
                      { value: "P21K to P40K", label: "P21K to P40K" },
                      { value: "P41K to P60K", label: "P41K to P60K" },
                      { value: "Above P80K", label: "Above P80K" }
                    ]}
                    value={formData.parentsIncome}
                    onChange={(val) => handleChange({ target: { name: 'parentsIncome', value: val } })}
                    placeholder="-- Select --"
                  />
                </div>
                <div className="formGroup">
                  <label className="formLabel">WHILE STUDYING, WILL YOU LIVE IN</label>
                  <Dropdown
                    options={[
                      { value: "", label: "-- Select --" },
                      { value: "Dorm/Boarding House", label: "Dorm/Boarding House" },
                      { value: "Parent's House", label: "Parent's House" },
                      { value: "Relative's House", label: "Relative's House" },
                      { value: "Other", label: "Other" }
                    ]}
                    value={formData.livingIn}
                    onChange={(val) => handleChange({ target: { name: 'livingIn', value: val } })}
                    placeholder="-- Select --"
                  />
                </div>
              </div>
              <div className="formRow split3">
                <div className="formGroup">
                  <label className="formLabel">DAILY TRANSPORTATION EXPENSE</label>
                  <Dropdown
                    options={[
                      { value: "", label: "-- Select --" },
                      { value: "< P50", label: "Less than P50" },
                      { value: "P51-P100", label: "P51 to P100" },
                      { value: "> P100", label: "More than P100" }
                    ]}
                    value={formData.dailyTranspoExpense}
                    onChange={(val) => handleChange({ target: { name: 'dailyTranspoExpense', value: val } })}
                    placeholder="-- Select --"
                  />
                </div>
                <div className="formGroup">
                  <label className="formLabel">NUMBER OF SIBLINGS</label>
                  <input type="number" min="0" name="noSiblings" value={formData.noSiblings} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">ORDINAL POSITION</label>
                  <Dropdown
                    options={[
                      { value: "", label: "-- Select --" },
                      { value: "Only Child", label: "Only Child" },
                      { value: "Eldest Child", label: "Eldest Child" },
                      { value: "Middle Child", label: "Middle Child" },
                      { value: "Youngest Child", label: "Youngest Child" }
                    ]}
                    value={formData.ordinalPosition}
                    onChange={(val) => handleChange({ target: { name: 'ordinalPosition', value: val } })}
                    placeholder="-- Select --"
                  />
                </div>
              </div>

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

      <ConfirmationModal
        isOpen={successState.isOpen}
        title={successState.title}
        summary={successState.summary}
        message={successState.message}
        variant={successState.variant}
        isAlert={true}
        onConfirm={() => {
          setSuccessState({ isOpen: false });
          onSuccess();
        }}
        onCancel={() => {
          setSuccessState({ isOpen: false });
          onSuccess();
        }}
      />

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </div>
  );

  const portalTarget = document.getElementById('portal-root') || document.body;
  return ReactDOM.createPortal(modalContent, portalTarget);
};

export default AddStudent;
import React, { useState, useEffect, useMemo } from 'react';
import { BiUserPlus, BiChevronDown } from 'react-icons/bi';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import Dropdown from '../../../Components/shared/Dropdown';
import Button from '../../../Components/ui/Button';
import TextField from '../../../Components/ui/Textfield';
import Modal from '../../../Components/ui/Modal';
import cx from '../../../Components/ui/Cx';

const AddStudent = ({ onClose, onSuccess, studentToEdit = null, initialData = null }) => {
  const [openSection, setOpenSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [rawSections, setRawSections] = useState([]);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  const studentData = studentToEdit || initialData;
  const isEditMode = !!studentData;

  const [formData, setFormData] = useState({
    studentNumber: '', email: '', accountStatus: true,
    probationStatus: 'Automatic', standing: 'Regular', statusReason: '',
    firstName: '', middleName: '', lastName: '', suffix: '', sex: 'Male', birthDate: '', placeOfBirth: '', phoneNumber: '', landline: '', religion: '', nationality: 'Filipino', civilStatus: 'Single', height: '', weight: '', language: '', visualProblems: '',
    permHouseNo: '', permStreet: '', permSubdivision: '', permBarangay: '', permCity: '', permProvince: '',
    sameAsPermanent: false, provHouseNo: '', provStreet: '', provSubdivision: '', provBarangay: '', provCity: '', provProvince: '',
    programId: '', sectionId:'', yearLevel: '1', classification: 'New', highschoolGraduated: '', pubprivHS: 'Public', schoolAddress: '', hsFinalGWA: '',
    fatherFirstName: '', fatherMiddleName: '', fatherLastName: '', fatherSuffix: '', fatherStatus: 'Living', fatherOccupation: '', fatherContact: '',
    motherFirstName: '', motherMiddleName: '', motherLastName: '', motherSuffix: '', motherStatus: 'Living', motherOccupation: '', motherContact: '',
    guardianFirstName: '', guardianMiddleName: '', guardianLastName: '', guardianSuffix: '', guardianOccupation: '', guardianContact: '',
    support: '', parentsIncome: '', livingIn: '', dailyTranspoExpense: '', noSiblings: '', ordinalPosition: '',
    awardsHonors: '', hobbiesInterests: '', futureCareer: '', academicClubsExtracurr: ''
  });

  useEffect(() => {
    const fetchPrograms = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        if (data.success) setPrograms(data.data);
      } catch (error) { console.error("Error fetching programs:", error); }
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/sections/by-program/${formData.programId}?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        if (!cancelled && data.success) setRawSections(data.data);
      } catch (err) { if (!cancelled) console.error(err); }
    };
    fetchSections();
    return () => { cancelled = true; };
  }, [formData.programId, formData.yearLevel]);
  
  const sections = useMemo(() => {
    const yl = String(formData.yearLevel || '');
    let list = rawSections.filter((s) => !yl || String(s.year_level) === yl);
    const programUnchanged = isEditMode && String(studentData?.program_id || '') === String(formData.programId || '');
    if (programUnchanged && studentData?.section_id && !list.some((s) => String(s.section_id) === String(studentData.section_id))) {
      list = [{ section_id: studentData.section_id, section_name: studentData.section || `(Section #${studentData.section_id})`, year_level: studentData.year_level }, ...list];
    }
    return list;
  }, [rawSections, formData.yearLevel, formData.programId, isEditMode, studentData]);

  useEffect(() => {
    if (studentData) {
      setFormData(prev => ({
        ...prev,
        studentNumber: studentData.student_number || '',
        email: studentData.email || studentData.school_email || '',
        firstName: studentData.first_name || '',
        lastName: studentData.last_name || '',
        middleName: studentData.middle_name || '',
        suffix: studentData.suffix || '',
        sex: studentData.sex || 'Male',
        probationStatus: studentData.academic_status_overridden ? studentData.academic_status : 'Automatic',
        standing: studentData.standing || 'Regular',
        birthDate: studentData.birth_date ? studentData.birth_date.split('T')[0] : '',
        placeOfBirth: studentData.place_of_birth || '',
        phoneNumber: studentData.mobile_no || '',
        landline: studentData.landline || '',
        religion: studentData.religion || '',
        nationality: studentData.nationality || 'Filipino',
        civilStatus: studentData.civil_status || 'Single',
        height: studentData.height || '',
        weight: studentData.weight || '',
        language: studentData.language_dialect || '',
        visualProblems: studentData.visual_problems || '',
        permHouseNo: studentData.perm_house_no || '',
        permStreet: studentData.perm_street || '',
        permBarangay: studentData.perm_barangay || '',
        permCity: studentData.perm_city || '',
        permProvince: studentData.perm_province || '',
        sameAsPermanent: !!studentData.same_as_permanent,
        provHouseNo: studentData.prov_house_no || '',
        provStreet: studentData.prov_street || '',
        provBarangay: studentData.prov_barangay || '',
        provCity: studentData.prov_city || '',
        provProvince: studentData.prov_province || '',
        programId: studentData.program_id || '',
        sectionId: studentData.section_id || '',
        yearLevel: studentData.year_level?.toString() || '1',
        classification: studentData.classification || 'New',
        highschoolGraduated: studentData.highschool_graduated || '',
        pubprivHS: studentData.pub_priv_hs || 'Public',
        schoolAddress: studentData.hs_school_address || '',
        hsFinalGWA: studentData.hs_final_gwa || '',
        fatherFirstName: studentData.father_firstname || '',
        fatherMiddleName: studentData.father_middlename || '',
        fatherLastName: studentData.father_lastname || '',
        fatherSuffix: studentData.father_suffix || '',
        fatherStatus: studentData.father_status || 'Living',
        fatherOccupation: studentData.father_occupation || '',
        fatherContact: studentData.father_contact || '',
        motherFirstName: studentData.mother_firstname || '',
        motherMiddleName: studentData.mother_middlename || '',
        motherLastName: studentData.mother_lastname || '',
        motherSuffix: studentData.mother_suffix || '',
        motherStatus: studentData.mother_status || 'Living',
        motherOccupation: studentData.mother_occupation || '',
        motherContact: studentData.mother_contact || '',
        guardianFirstName: studentData.guardian_firstname || '',
        guardianMiddleName: studentData.guardian_middlename || '',
        guardianLastName: studentData.guardian_lastname || '',
        guardianSuffix: studentData.guardian_suffix || '',
        guardianOccupation: studentData.guardian_occupation || '',
        guardianContact: studentData.guardian_contact || '',
        support: studentData.support || '',
        parentsIncome: studentData.parents_income || '',
        livingIn: studentData.living_in || '',
        dailyTranspoExpense: studentData.daily_transpo_expense || '',
        noSiblings: studentData.no_siblings ?? '',
        ordinalPosition: studentData.ordinal_position || '',
        awardsHonors: studentData.awards_honors || '',
        hobbiesInterests: studentData.hobbies_interests || '',
        futureCareer: studentData.future_career || '',
        academicClubsExtracurr: studentData.acad_extracurr || ''
      }));
    }
  }, [studentData]);

  const originalProbation = studentData?.academic_status_overridden ? studentData.academic_status : 'Automatic';
  const originalStanding = studentData?.standing || 'Regular';
  const statusChanges = {};
  if (formData.probationStatus !== originalProbation) statusChanges.probation_status = formData.probationStatus;
  if (formData.standing !== originalStanding) statusChanges.standing = formData.standing;
  const hasStatusChanges = isEditMode && Object.keys(statusChanges).length > 0;

  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIsDirty(true);
    if (name === 'sameAsPermanent') {
      setFormData(prev => ({ ...prev, sameAsPermanent: checked, ...(checked ? { provHouseNo: prev.permHouseNo, provStreet: prev.permStreet, provBarangay: prev.permBarangay, provCity: prev.permCity, provProvince: prev.permProvince } : {}) }));
      return;
    }
    if (name === 'yearLevel' || name === 'programId') {
      setFormData(prev => ({ ...prev, [name]: value, sectionId: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
      const studentId = studentData?.student_id;
      const url = isEditMode && studentId ? `${process.env.REACT_APP_API_URL}/admin/students/${studentId}` : `${process.env.REACT_APP_API_URL}/admin/students`;
      const method = isEditMode && studentId ? 'PUT' : 'POST';

      const payload = { ...formData, student_number: formData.studentNumber, first_name: formData.firstName, last_name: formData.lastName, program_id: parseInt(formData.programId, 10) };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success || response.ok) {
        if (hasStatusChanges) {
          const statusRes = await fetch(`${process.env.REACT_APP_API_URL}/admin/students/${studentId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...statusChanges, reason: formData.statusReason.trim() })
          });
          const statusData = await statusRes.json();
          if (!statusData.success) {
            openAlert('Status Change Failed', `The record saved, but status change failed: ${statusData.message}`, 'danger');
            return;
          }
        }
        setIsDirty(false);
        setSuccessState({ isOpen: true, title: isEditMode ? 'Student Updated' : 'Student Created', message: 'The record has been saved.', variant: 'success' });
      } else {
        openAlert('Save Failed', data.message || 'Failed to save student.', 'danger');
      }
    } catch (error) {
      openAlert('Error', 'An unexpected error occurred.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseInputClasses = "w-full rounded-ctl bg-surface-2 px-3.5 py-3 text-base text-ink ring-1 ring-line-strong placeholder:text-ink-3 transition-shadow focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60";

  const toggleSection = (section) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={isEditMode ? "Edit Student Record" : "Add New Student"}
        description={isEditMode ? "Update existing student information." : "Enter student personal and academic information."}
        icon={<BiUserPlus className="text-2xl" />}
        loading={isSubmitting}
        isDirty={isDirty}
        footer={({ requestClose }) => (
          <>
            <Button type="button" variant="secondary" onClick={requestClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={!isDirty}>
              {isSubmitting ? "Saving..." : (isEditMode ? "Update Student" : "Create Student")}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Primary Details */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-ink">Primary Details</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={<>First Name <span className="text-danger">*</span></>} name="firstName" value={formData.firstName} onChange={handleChange} required />
              <TextField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
              <TextField label={<>Last Name <span className="text-danger">*</span></>} name="lastName" value={formData.lastName} onChange={handleChange} required />
              <TextField label="Suffix" name="suffix" value={formData.suffix} onChange={handleChange} placeholder="e.g. Jr., III" />
              <TextField label={<>Student Number <span className="text-danger">*</span></>} name="studentNumber" value={formData.studentNumber} onChange={handleChange} required />
              <TextField label={<>Email Address <span className="text-danger">*</span></>} type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink">Program <span className="text-danger">*</span></label>
                <Dropdown options={[{ value: "", label: "Select Program" }, ...programs.map(p => ({ value: p.program_id, label: p.program_abbr || p.program_name }))]} value={formData.programId} onChange={(v) => handleChange({ target: { name: 'programId', value: v } })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink">Year Level <span className="text-danger">*</span></label>
                  <Dropdown options={[{ value: "1", label: "1st Year" }, { value: "2", label: "2nd Year" }, { value: "3", label: "3rd Year" }, { value: "4", label: "4th Year" }]} value={formData.yearLevel} onChange={(v) => handleChange({ target: { name: 'yearLevel', value: v } })} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink">Section</label>
                  <Dropdown options={[{ value: "", label: "Unassigned" }, ...sections.map(s => ({ value: s.section_id, label: s.section_name }))]} value={formData.sectionId} onChange={(v) => handleChange({ target: { name: 'sectionId', value: v } })} />
                </div>
              </div>
            </div>
          </div>

          {/* Edit Mode Academic Status */}
          {isEditMode && (
            <div className="mt-8 border-t border-line pt-6">
              <h4 className="mb-4 text-sm font-semibold text-ink">Academic Status</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink">Probation Status</label>
                  <Dropdown options={[{ value: "Automatic", label: "Automatic" }, { value: "None", label: "None" }, { value: "Warning", label: "Warning" }, { value: "Probationary 1", label: "Probationary 1" }, { value: "Probationary 2", label: "Probationary 2" }]} value={formData.probationStatus} onChange={(v) => handleChange({ target: { name: 'probationStatus', value: v } })} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink">Standing</label>
                  <Dropdown options={[{ value: "Regular", label: "Regular" }, { value: "Irregular", label: "Irregular" }]} value={formData.standing} onChange={(v) => handleChange({ target: { name: 'standing', value: v } })} />
                </div>
              </div>
              {hasStatusChanges && (
                <div className="mt-4">
                  <TextField label={<>Reason for Change <span className="text-danger">*</span></>} name="statusReason" value={formData.statusReason} onChange={handleChange} />
                </div>
              )}
            </div>
          )}

          {/* Accordion Section Container */}
          <div className="mt-8 space-y-3 border-t border-line pt-6">
            
            {/* Personal Info Accordion */}
            <div className="mb-2 overflow-hidden rounded-panel border !border-line bg-surface">
              <button type="button" onClick={() => toggleSection('personal')} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-line-strong/30">
                <span>Personal Information</span>
                <BiChevronDown className={cx("text-lg transition-transform duration-200", openSection === 'personal' && "rotate-180")} />
              </button>
              {openSection === 'personal' && (
                <div className="animate-in fade-in slide-in-from-top-2 border-t border-line/50 bg-surface px-5 py-5 duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Sex</label>
                      <Dropdown options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} value={formData.sex} onChange={(v) => handleChange({ target: { name: 'sex', value: v } })} />
                    </div>
                    <TextField label="Date of Birth" type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                    <TextField label="Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} />
                    <TextField label="Phone (Mobile)" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                    <TextField label="Landline" name="landline" value={formData.landline} onChange={handleChange} />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Civil Status</label>
                      <Dropdown options={[{ value: "Single", label: "Single" }, { value: "Married", label: "Married" }, { value: "Widowed", label: "Widowed" }, { value: "Separated", label: "Separated" }]} value={formData.civilStatus} onChange={(v) => handleChange({ target: { name: 'civilStatus', value: v } })} />
                    </div>
                    <TextField label="Religion" name="religion" value={formData.religion} onChange={handleChange} />
                    <TextField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                    <TextField label="Language / Dialect" name="language" value={formData.language} onChange={handleChange} />
                    <TextField label="Height" name="height" value={formData.height} onChange={handleChange} placeholder="e.g. 170 cm" />
                    <TextField label="Weight" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 65 kg" />
                    <TextField label="Visual Problem" name="visualProblems" value={formData.visualProblems} onChange={handleChange} placeholder="e.g. N/A or Glasses" />
                  </div>
                </div>
              )}
            </div>

            {/* Permanent Address Accordion */}
            <div className="mb-2 overflow-hidden rounded-panel border !border-line bg-surface">
              <button type="button" onClick={() => toggleSection('permanent')} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-line-strong/30">
                <span>Permanent Address</span>
                <BiChevronDown className={cx("text-lg transition-transform duration-200", openSection === 'permanent' && "rotate-180")} />
              </button>
              {openSection === 'permanent' && (
                <div className="animate-in fade-in slide-in-from-top-2 border-t border-line/50 bg-surface px-5 py-5 duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="House No. / Street" name="permHouseNo" value={formData.permHouseNo} onChange={handleChange} />
                    <TextField label="Subdivision / Street" name="permStreet" value={formData.permStreet} onChange={handleChange} />
                    <TextField label="Barangay" name="permBarangay" value={formData.permBarangay} onChange={handleChange} />
                    <TextField label="City / Municipality" name="permCity" value={formData.permCity} onChange={handleChange} />
                    <TextField label="Province" name="permProvince" value={formData.permProvince} onChange={handleChange} />
                  </div>
                </div>
              )}
            </div>

            {/* Provincial Address Accordion */}
            <div className="mb-2 overflow-hidden rounded-panel border !border-line bg-surface">
              <button type="button" onClick={() => toggleSection('provincial')} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-line-strong/30">
                <span>Provincial Address</span>
                <BiChevronDown className={cx("text-lg transition-transform duration-200", openSection === 'provincial' && "rotate-180")} />
              </button>
              {openSection === 'provincial' && (
                <div className="animate-in fade-in slide-in-from-top-2 border-t border-line/50 bg-surface px-5 py-5 duration-200">
                  <div className="mb-4 flex items-center justify-end">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
                      <input type="checkbox" name="sameAsPermanent" checked={formData.sameAsPermanent} onChange={handleChange} className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand" />
                      Same as Permanent Address
                    </label>
                  </div>
                  {!formData.sameAsPermanent && (
                    <div className="animate-in fade-in grid gap-4 duration-200 sm:grid-cols-2">
                      <TextField label="House No. / Street" name="provHouseNo" value={formData.provHouseNo} onChange={handleChange} />
                      <TextField label="Subdivision / Street" name="provStreet" value={formData.provStreet} onChange={handleChange} />
                      <TextField label="Barangay" name="provBarangay" value={formData.provBarangay} onChange={handleChange} />
                      <TextField label="City / Municipality" name="provCity" value={formData.provCity} onChange={handleChange} />
                      <TextField label="Province" name="provProvince" value={formData.provProvince} onChange={handleChange} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Program & Education Accordion */}
            <div className="mb-2 overflow-hidden rounded-panel border !border-line bg-surface">
              <button type="button" onClick={() => toggleSection('education')} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-line-strong/30">
                <span>Program and Education</span>
                <BiChevronDown className={cx("text-lg transition-transform duration-200", openSection === 'education' && "rotate-180")} />
              </button>
              {openSection === 'education' && (
                <div className="animate-in fade-in slide-in-from-top-2 border-t border-line/50 bg-surface px-5 py-5 duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Classification</label>
                      <Dropdown options={[{ value: "New", label: "New" }, { value: "Continuing", label: "Continuing" }, { value: "Returnee", label: "Returnee" }, { value: "Shiftee", label: "Shiftee" }, { value: "Transferee", label: "Transferee" }]} value={formData.classification} onChange={(v) => handleChange({ target: { name: 'classification', value: v } })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Private or Public</label>
                      <Dropdown options={[{ value: "Public", label: "Public" }, { value: "Private", label: "Private" }]} value={formData.pubprivHS} onChange={(v) => handleChange({ target: { name: 'pubprivHS', value: v } })} />
                    </div>
                    <TextField label="High School Graduated" name="highschoolGraduated" value={formData.highschoolGraduated} onChange={handleChange} />
                    <TextField label="4th Year HS Final GWA" type="number" step="0.01" name="hsFinalGWA" value={formData.hsFinalGWA} onChange={handleChange} placeholder="e.g. 88.50" />
                    <div className="sm:col-span-2">
                      <TextField label="School Address" name="schoolAddress" value={formData.schoolAddress} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Family Information Accordion */}
            <div className="mb-2 overflow-hidden rounded-panel border !border-line bg-surface">
              <button type="button" onClick={() => toggleSection('family')} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-line-strong/30">
                <span>Family Information</span>
                <BiChevronDown className={cx("text-lg transition-transform duration-200", openSection === 'family' && "rotate-180")} />
              </button>
              {openSection === 'family' && (
                <div className="animate-in fade-in slide-in-from-top-2 border-t border-line/50 bg-surface px-5 py-5 duration-200">
                  <h5 className="mb-3 text-sm font-medium text-ink-2">Father's Details</h5>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="First Name" name="fatherFirstName" value={formData.fatherFirstName} onChange={handleChange} />
                    <TextField label="Middle Name" name="fatherMiddleName" value={formData.fatherMiddleName} onChange={handleChange} />
                    <TextField label="Last Name" name="fatherLastName" value={formData.fatherLastName} onChange={handleChange} />
                    <TextField label="Suffix" name="fatherSuffix" value={formData.fatherSuffix} onChange={handleChange} placeholder="Jr., III" />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Status</label>
                      <Dropdown options={[{ value: "Living", label: "Living" }, { value: "Deceased", label: "Deceased" }]} value={formData.fatherStatus} onChange={(v) => handleChange({ target: { name: 'fatherStatus', value: v } })} />
                    </div>
                    <TextField label="Occupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
                    <TextField label="Contact Number" name="fatherContact" value={formData.fatherContact} onChange={handleChange} />
                  </div>

                  <h5 className="mb-3 mt-6 text-sm font-medium text-ink-2 border-t border-line pt-4">Mother's Details</h5>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="First Name" name="motherFirstName" value={formData.motherFirstName} onChange={handleChange} />
                    <TextField label="Middle Name" name="motherMiddleName" value={formData.motherMiddleName} onChange={handleChange} />
                    <TextField label="Last Name" name="motherLastName" value={formData.motherLastName} onChange={handleChange} />
                    <TextField label="Suffix" name="motherSuffix" value={formData.motherSuffix} onChange={handleChange} placeholder="Jr., III" />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Status</label>
                      <Dropdown options={[{ value: "Living", label: "Living" }, { value: "Deceased", label: "Deceased" }]} value={formData.motherStatus} onChange={(v) => handleChange({ target: { name: 'motherStatus', value: v } })} />
                    </div>
                    <TextField label="Occupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
                    <TextField label="Contact Number" name="motherContact" value={formData.motherContact} onChange={handleChange} />
                  </div>

                  <h5 className="mb-3 mt-6 text-sm font-medium text-ink-2 border-t border-line pt-4">Guardian's Details (if any)</h5>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="First Name" name="guardianFirstName" value={formData.guardianFirstName} onChange={handleChange} />
                    <TextField label="Middle Name" name="guardianMiddleName" value={formData.guardianMiddleName} onChange={handleChange} />
                    <TextField label="Last Name" name="guardianLastName" value={formData.guardianLastName} onChange={handleChange} />
                    <TextField label="Suffix" name="guardianSuffix" value={formData.guardianSuffix} onChange={handleChange} placeholder="Jr., III" />
                    <TextField label="Occupation" name="guardianOccupation" value={formData.guardianOccupation} onChange={handleChange} />
                    <TextField label="Contact Number" name="guardianContact" value={formData.guardianContact} onChange={handleChange} />
                  </div>
                </div>
              )}
            </div>

            {/* Family Background Accordion */}
            <div className="mb-2 overflow-hidden rounded-panel border !border-line bg-surface">
              <button type="button" onClick={() => toggleSection('background')} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-line-strong/30">
                <span>Family Background</span>
                <BiChevronDown className={cx("text-lg transition-transform duration-200", openSection === 'background' && "rotate-180")} />
              </button>
              {openSection === 'background' && (
                <div className="animate-in fade-in slide-in-from-top-2 border-t border-line/50 bg-surface px-5 py-5 duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Who supports your education?</label>
                      <Dropdown options={[{ value: "", label: "-- Select --" }, { value: "Parents", label: "Parents" }, { value: "Relatives", label: "Relatives" }, { value: "Brother or Sister", label: "Brother or Sister" }, { value: "Benefactors", label: "Benefactors" }, { value: "Scholarship", label: "Scholarship" }]} value={formData.support} onChange={(v) => handleChange({ target: { name: 'support', value: v } })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Parents' Joint Monthly Income</label>
                      <Dropdown options={[{ value: "", label: "-- Select --" }, { value: "Below P20K", label: "Below P20K" }, { value: "P21K to P40K", label: "P21K to P40K" }, { value: "P41K to P60K", label: "P41K to P60K" }, { value: "Above P80K", label: "Above P80K" }]} value={formData.parentsIncome} onChange={(v) => handleChange({ target: { name: 'parentsIncome', value: v } })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">While studying, will you live in</label>
                      <Dropdown options={[{ value: "", label: "-- Select --" }, { value: "Dorm/Boarding House", label: "Dorm/Boarding House" }, { value: "Parent's House", label: "Parent's House" }, { value: "Relative's House", label: "Relative's House" }, { value: "Other", label: "Other" }]} value={formData.livingIn} onChange={(v) => handleChange({ target: { name: 'livingIn', value: v } })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Daily Transportation Expense</label>
                      <Dropdown options={[{ value: "", label: "-- Select --" }, { value: "< P50", label: "Less than P50" }, { value: "P51-P100", label: "P51 to P100" }, { value: "> P100", label: "More than P100" }]} value={formData.dailyTranspoExpense} onChange={(v) => handleChange({ target: { name: 'dailyTranspoExpense', value: v } })} />
                    </div>
                    <TextField label="Number of Siblings" type="number" min="0" name="noSiblings" value={formData.noSiblings} onChange={handleChange} />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Ordinal Position</label>
                      <Dropdown options={[{ value: "", label: "-- Select --" }, { value: "Only Child", label: "Only Child" }, { value: "Eldest Child", label: "Eldest Child" }, { value: "Middle Child", label: "Middle Child" }, { value: "Youngest Child", label: "Youngest Child" }]} value={formData.ordinalPosition} onChange={(v) => handleChange({ target: { name: 'ordinalPosition', value: v } })} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Achievements Accordion */}
            <div className="mb-2 overflow-hidden rounded-panel border !border-line bg-surface">
              <button type="button" onClick={() => toggleSection('achievements')} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-ink transition-colors hover:bg-line-strong/30">
                <span>Achievements, Hobbies & Interests</span>
                <BiChevronDown className={cx("text-lg transition-transform duration-200", openSection === 'achievements' && "rotate-180")} />
              </button>
              {openSection === 'achievements' && (
                <div className="animate-in fade-in slide-in-from-top-2 border-t border-line/50 bg-surface px-5 py-5 duration-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Awards / Honors Received</label>
                      <textarea rows="2" name="awardsHonors" value={formData.awardsHonors} onChange={handleChange} className={baseInputClasses} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Career / Work You Want to Pursue</label>
                      <textarea rows="2" name="futureCareer" value={formData.futureCareer} onChange={handleChange} className={baseInputClasses} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Hobbies / Sports / Interests</label>
                      <textarea rows="2" name="hobbiesInterests" value={formData.hobbiesInterests} onChange={handleChange} className={baseInputClasses} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-ink">Academic Clubs / Extracurriculars</label>
                      <textarea rows="2" name="academicClubsExtracurr" value={formData.academicClubsExtracurr} onChange={handleChange} className={baseInputClasses} />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </form>
      </Modal>

      <ConfirmationModal isOpen={successState.isOpen} title={successState.title} message={successState.message} variant={successState.variant} isAlert={true} onConfirm={() => { setSuccessState({ isOpen: false }); onSuccess(); }} onCancel={() => { setSuccessState({ isOpen: false }); onSuccess(); }} />
      <ConfirmationModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} variant={confirmState.variant} isAlert={confirmState.isAlert} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />
    </>
  );
};

export default AddStudent;
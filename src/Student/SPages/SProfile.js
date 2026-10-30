import React, { useEffect, useRef, useState } from 'react';
import { BiLeftArrowAlt, BiRightArrowAlt, BiSave } from 'react-icons/bi';
import Dropdown from '../../Components/shared/Dropdown';
import ConfirmationModal from '../../Admin/AComponents/ConfirmationModal'; // TODO: adjust to wherever ConfirmationModal lives
import '../../GlobalStyle/Global.css';
import '../../GlobalStyle/GlobalForm.css';
import './SProfile.css'; 

const STEPS = [
  'Basic Details',
  'Personal Information',
  'Address',
  'Parents & Guardian',
  'Family Background',
  'Education & Achievements',
];

const opt = (...vals) => vals.map((v) => (Array.isArray(v) ? { value: v[0], label: v[1] } : { value: v, label: v }));
const BLANK = { value: '', label: '-- Select --' };

const CIVIL = opt('Single', 'Married', 'Widowed', 'Separated');
const PUBPRIV = opt('Public', 'Private');
const LIVING = opt('Living', 'Deceased');
const SUPPORT = [BLANK, ...opt('Parents', 'Relatives', 'Brother or Sister', 'Benefactors', 'Scholarship')];
const INCOME = [BLANK, ...opt('Below P20K', 'P21K to P40K', 'P41K to P60K', 'Above P80K')];
const LIVING_IN = [BLANK, ...opt('Dorm/Boarding House', "Parent's House", "Relative's House", 'Other')];
const TRANSPO = [BLANK, ...opt(['< P50', 'Less than P50'], ['P51-P100', 'P51 to P100'], ['> P100', 'More than P100'])];
const ORDINAL = [BLANK, ...opt('Only Child', 'Eldest Child', 'Middle Child', 'Youngest Child')];

/** First non-empty value among several possible API key names. */
const pick = (d, ...keys) => {
  for (const k of keys) {
    const v = d?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
};

/** Case/wording-insensitive key so legacy values ("PARENT'S HOUSE", "BETWEEN P51-P100") match option values. */
const norm = (v) => String(v).toLowerCase().replace(/^between\s+/, '').replace(/\s+/g, ' ').trim();
const canonical = (value, options) => {
  if (!value) return '';
  const hit = options.find((o) => o.value && norm(o.value) === norm(value));
  return hit ? hit.value : value;
};

/** Living/Deceased from father_status, or from an is_alive-style boolean if that is what the API returns. */
const statusFrom = (d, who) => {
  const s = pick(d, `${who}_status`);
  if (s) return s;
  const alive = d?.[`${who}_is_alive`] ?? d?.[`${who}_alive`];
  if (alive === true || alive === 't' || alive === 'true') return 'Living';
  if (alive === false || alive === 'f' || alive === 'false') return 'Deceased';
  return ''; // unknown: leave blank and do not overwrite on save
};

/** API response (snake_case, key names vary) -> form state (camelCase, same names as AddStudent). */
const mapProfile = (d) => ({
  // Read-only
  studentNumber: pick(d, 'student_number', 'studentNumber'),
  schoolEmail: pick(d, 'school_email', 'email'),
  firstName: pick(d, 'first_name', 'firstname', 'firstName'),
  middleName: pick(d, 'middle_name', 'middlename', 'middleName'),
  lastName: pick(d, 'last_name', 'lastname', 'lastName'),
  suffix: pick(d, 'suffix'),
  sex: pick(d, 'sex'),
  birthDate: pick(d, 'birth_date', 'birthDate').toString().split('T')[0],
  program: pick(d, 'program_abbr', 'program_name', 'program_code'),
  yearLevel: pick(d, 'year_level', 'yearLevel').toString(),
  section: pick(d, 'section', 'section_name'),
  classification: pick(d, 'classification'),
  standing: pick(d, 'standing'),

  // Personal
  personalEmail: pick(d, 'personal_email', 'personalEmail'),
  placeOfBirth: pick(d, 'place_of_birth', 'birth_place', 'placeOfBirth'),
  phoneNumber: pick(d, 'mobile_no', 'phone_number', 'phoneNumber'),
  landline: pick(d, 'landline', 'landline_no'),
  religion: pick(d, 'religion'),
  nationality: pick(d, 'nationality') || 'Filipino',
  civilStatus: canonical(pick(d, 'civil_status', 'civilStatus'), CIVIL) || 'Single',
  height: pick(d, 'height'),
  weight: pick(d, 'weight'),
  language: pick(d, 'language_dialects', 'language_dialect', 'language'),
  visualProblems: pick(d, 'visual_problems', 'visualProblems'),

  // Permanent address (stored as present_* / perm_* depending on endpoint)
  permHouseNo: pick(d, 'perm_house_no', 'present_houseno'),
  permStreet: pick(d, 'perm_street', 'present_street', 'street'),
  permBarangay: pick(d, 'perm_barangay', 'present_sbdvsn_brgy', 'present_barangay', 'barangay'),
  permCity: pick(d, 'perm_city', 'present_city_mncplty', 'present_city', 'city_municipality'),
  permProvince: pick(d, 'perm_province', 'present_province', 'province'),

  // Provincial address
  sameAsPermanent: !!d?.same_as_permanent,
  provHouseNo: pick(d, 'prov_house_no', 'provincial_houseno'),
  provStreet: pick(d, 'prov_street', 'provincial_street'),
  provBarangay: pick(d, 'prov_barangay', 'provincial_sbdvsn_brgy'),
  provCity: pick(d, 'prov_city', 'provincial_city_mncplty'),
  provProvince: pick(d, 'prov_province', 'provincial_province'),

  // Parents / guardian
  fatherFirstName: pick(d, 'father_firstname', 'father_first_name'),
  fatherMiddleName: pick(d, 'father_middlename', 'father_middle_name'),
  fatherLastName: pick(d, 'father_lastname', 'father_last_name'),
  fatherSuffix: pick(d, 'father_suffix'),
  fatherStatus: statusFrom(d, 'father'),
  fatherOccupation: pick(d, 'father_occupation'),
  fatherContact: pick(d, 'father_contact', 'father_contact_no'),

  motherFirstName: pick(d, 'mother_firstname', 'mother_first_name'),
  motherMiddleName: pick(d, 'mother_middlename', 'mother_middle_name'),
  motherLastName: pick(d, 'mother_lastname', 'mother_last_name'),
  motherSuffix: pick(d, 'mother_suffix'),
  motherStatus: statusFrom(d, 'mother'),
  motherOccupation: pick(d, 'mother_occupation'),
  motherContact: pick(d, 'mother_contact', 'mother_contact_no'),

  guardianFirstName: pick(d, 'guardian_firstname', 'guardian_first_name'),
  guardianMiddleName: pick(d, 'guardian_middlename', 'guardian_middle_name'),
  guardianLastName: pick(d, 'guardian_lastname', 'guardian_last_name'),
  guardianSuffix: pick(d, 'guardian_suffix'),
  guardianOccupation: pick(d, 'guardian_occupation'),
  guardianContact: pick(d, 'guardian_contact', 'guardian_contact_no'),

  // Family background
  support: canonical(pick(d, 'support'), SUPPORT),
  parentsIncome: canonical(pick(d, 'parents_income'), INCOME),
  livingIn: canonical(pick(d, 'living_in'), LIVING_IN),
  dailyTranspoExpense: canonical(pick(d, 'daily_transpo_expense'), TRANSPO),
  noSiblings: d?.no_siblings ?? '',
  ordinalPosition: canonical(pick(d, 'ordinal_position'), ORDINAL),

  // Education & achievements
  highschoolGraduated: pick(d, 'highschool_graduated'),
  pubprivHS: canonical(pick(d, 'pub_priv_hs', 'pubpriv_hs', 'pubprivHS'), PUBPRIV) || 'Public',
  schoolAddress: pick(d, 'hs_school_address', 'highschool_address', 'schoolAddress'),
  hsFinalGWA: pick(d, 'hs_final_gwa'),
  awardsHonors: pick(d, 'awards_honors'),
  futureCareer: pick(d, 'future_career'),
  hobbiesInterests: pick(d, 'hobbies_interests'),
  academicClubsExtracurr: pick(d, 'acad_extracurr', 'acad_clubs_extracurr'),
});

/* ---------- Small field helpers ---------- */
const Text = ({ label, name, form, onChange, ...rest }) => (
  <div className="formGroup">
    <label className="formLabel">{label}</label>
    <input type="text" name={name} value={form[name]} onChange={onChange} {...rest} />
  </div>
);

const Area = ({ label, name, form, onChange }) => (
  <div className="formGroup">
    <label className="formLabel">{label}</label>
    <textarea rows="2" name={name} value={form[name]} onChange={onChange} />
  </div>
);

const Pick = ({ label, name, form, setField, options }) => {
  // A stored value that is not one of the options (legacy data) is kept visible instead of showing blank.
  const current = form[name];
  const opts = current && !options.some((o) => o.value === current)
    ? [{ value: current, label: current }, ...options]
    : options;
  return (
  <div className="formGroup">
    <label className="formLabel">{label}</label>
    <Dropdown
      options={opts}
      value={form[name]}
      onChange={(val) => setField(name, val)}
      placeholder="-- Select --"
    />
  </div>
  );
};

const ReadOnly = ({ label, value, type = 'text' }) => (
  <div className="formGroup">
    <label className="formLabel">{label}</label>
    <input
      type={type}
      value={value || ''}
      placeholder="—"
      readOnly
      tabIndex={-1}
      style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
    />
  </div>
);

const subHeading = { color: 'var(--text-secondary)', marginTop: '20px', marginBottom: '8px' };

/* ---------- Component ---------- */
function SProfile() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [modal, setModal] = useState({ isOpen: false });
  const scrollRef = useRef(null);

  const totalSteps = STEPS.length;
  const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) {
          if (process.env.NODE_ENV === 'development') console.log('[SProfile] raw profile', d.data);
          setForm(mapProfile(d.data));
        } else {
          setLoadError(d.message || 'Failed to load profile.');
        }
      })
      .catch(() => !cancelled && setLoadError('Network error. Could not load your profile.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const closeModal = () => setModal({ isOpen: false });
  const openAlert = (title, message, variant = 'info') =>
    setModal({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeModal, onCancel: closeModal });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'sameAsPermanent') {
      setForm((prev) => ({
        ...prev,
        sameAsPermanent: checked,
        ...(checked ? {
          provHouseNo: prev.permHouseNo,
          provStreet: prev.permStreet,
          provBarangay: prev.permBarangay,
          provCity: prev.permCity,
          provProvince: prev.permProvince,
        } : {}),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const setField = (name, value) => handleChange({ target: { name, value } });

  const goTo = (n) => {
    setStep(n);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validate = () => {
    if (form.personalEmail && !/^\S+@\S+\.\S+$/.test(form.personalEmail)) return 'Enter a valid personal email address.';
    if (form.hsFinalGWA !== '' && isNaN(form.hsFinalGWA)) return 'High school GWA must be a number.';
    if (form.noSiblings !== '' && Number(form.noSiblings) < 0) return 'Number of siblings cannot be negative.';
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      openAlert('Check Your Details', problem, 'warning');
      return;
    }

    setSaving(true);
    const n = (v) => (v === '' || v === undefined ? null : v);
    const same = form.sameAsPermanent;
    const prov = (perm, own) => (same ? n(perm) : n(own));
    const gwa = form.hsFinalGWA !== '' && !isNaN(form.hsFinalGWA) ? parseFloat(form.hsFinalGWA) : null;
    const siblings = form.noSiblings !== '' ? parseInt(form.noSiblings, 10) : null;

    // Only student-editable fields are sent. Both key variants are included where
    // the backend has been seen using either name (same approach as AddStudent).
    const payload = {
      personal_email: n(form.personalEmail),
      place_of_birth: n(form.placeOfBirth),
      birth_place: n(form.placeOfBirth),
      mobile_no: n(form.phoneNumber),
      landline: n(form.landline),
      religion: n(form.religion),
      nationality: form.nationality || 'Filipino',
      civil_status: form.civilStatus || 'Single',
      height: n(form.height),
      weight: n(form.weight),
      language_dialects: n(form.language),
      visual_problems: n(form.visualProblems),

      present_houseno: n(form.permHouseNo),
      present_street: n(form.permStreet),
      present_sbdvsn_brgy: n(form.permBarangay),
      present_city_mncplty: n(form.permCity),
      present_barangay: n(form.permBarangay),
      present_city: n(form.permCity),
      present_province: n(form.permProvince),
      perm_house_no: n(form.permHouseNo),
      perm_street: n(form.permStreet),
      perm_barangay: n(form.permBarangay),
      perm_city: n(form.permCity),
      perm_province: n(form.permProvince),

      same_as_permanent: same,
      provincial_houseno: prov(form.permHouseNo, form.provHouseNo),
      provincial_street: prov(form.permStreet, form.provStreet),
      provincial_sbdvsn_brgy: prov(form.permBarangay, form.provBarangay),
      provincial_city_mncplty: prov(form.permCity, form.provCity),
      prov_house_no: prov(form.permHouseNo, form.provHouseNo),
      prov_street: prov(form.permStreet, form.provStreet),
      prov_barangay: prov(form.permBarangay, form.provBarangay),
      prov_city: prov(form.permCity, form.provCity),
      prov_province: prov(form.permProvince, form.provProvince),

      father_firstname: n(form.fatherFirstName),
      father_middlename: n(form.fatherMiddleName),
      father_lastname: n(form.fatherLastName),
      father_suffix: n(form.fatherSuffix),
      father_status: n(form.fatherStatus),
      father_occupation: n(form.fatherOccupation),
      father_contact: n(form.fatherContact),

      mother_firstname: n(form.motherFirstName),
      mother_middlename: n(form.motherMiddleName),
      mother_lastname: n(form.motherLastName),
      mother_suffix: n(form.motherSuffix),
      mother_status: n(form.motherStatus),
      mother_occupation: n(form.motherOccupation),
      mother_contact: n(form.motherContact),

      guardian_firstname: n(form.guardianFirstName),
      guardian_middlename: n(form.guardianMiddleName),
      guardian_lastname: n(form.guardianLastName),
      guardian_suffix: n(form.guardianSuffix),
      guardian_occupation: n(form.guardianOccupation),
      guardian_contact: n(form.guardianContact),

      support: n(form.support),
      parents_income: n(form.parentsIncome),
      living_in: n(form.livingIn),
      daily_transpo_expense: n(form.dailyTranspoExpense),
      no_siblings: siblings,
      ordinal_position: n(form.ordinalPosition),

      highschool_graduated: n(form.highschoolGraduated),
      pub_priv_hs: form.pubprivHS || 'Public',
      pubpriv_hs: form.pubprivHS || 'Public',
      hs_school_address: n(form.schoolAddress),
      highschool_address: n(form.schoolAddress),
      hs_final_gwa: gwa,

      awards_honors: n(form.awardsHonors),
      future_career: n(form.futureCareer),
      hobbies_interests: n(form.hobbiesInterests),
      acad_extracurr: n(form.academicClubsExtracurr),
    };

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success || res.ok) {
        setModal({
          isOpen: true,
          title: 'Profile Updated',
          summary: 'Your profile has been updated successfully.',
          variant: 'success',
          isAlert: true,
          onConfirm: closeModal,
          onCancel: closeModal,
        });
      } else {
        openAlert('Update Failed', data.message || 'Failed to update your profile.', 'danger');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="InnerContainer"><p>Loading profile...</p></div>;
  if (loadError || !form) {
    return <div className="InnerContainer"><p style={{ color: 'var(--status-danger-text)' }}>{loadError || 'Error loading profile.'}</p></div>;
  }

  const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;
  const f = { form, onChange: handleChange };
  const p = { form, setField };

  return (
    <div className="InnerContainer" ref={scrollRef} style={{ justifyContent: 'flex-start', overflowY: 'auto' }}>
      <div className="SProfileZoom">
      {/* Progress */}
      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', marginBottom: '12px', flexShrink: 0 }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--branding-maroon)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Step {step} of {totalSteps} &middot; {STEPS[step - 1]}
      </span>

      <div className="FormContent" style={{ minHeight: '400px', flexShrink: 1 }}>

        {/* STEP 1: Basic details (read-only) */}
        {step === 1 && (
          <div className="stepContent">
            <h4 className="sectionHeading">Primary Details</h4>
            <div className="formRow split3">
              <ReadOnly label="FIRST NAME" value={form.firstName} />
              <ReadOnly label="MIDDLE NAME" value={form.middleName} />
              <ReadOnly label="LAST NAME" value={form.lastName} />
            </div>
            <div className="formRow split3">
              <ReadOnly label="SUFFIX" value={form.suffix} />
              <ReadOnly label="STUDENT NUMBER" value={form.studentNumber} />
              <ReadOnly label="SCHOOL EMAIL" value={form.schoolEmail} />
            </div>
            <div className="formRow split3">
              <ReadOnly label="PROGRAM" value={form.program} />
              <ReadOnly label="YEAR LEVEL" value={form.yearLevel} />
              <ReadOnly label="SECTION" value={form.section} />
            </div>
            <div className="formRow split3">
              <ReadOnly label="CLASSIFICATION" value={form.classification} />
              <ReadOnly label="STANDING" value={form.standing} />
              <ReadOnly label="SEX" value={form.sex} />
            </div>

          </div>
        )}

        {/* STEP 2: Personal */}
        {step === 2 && (
          <div className="stepContent">
            <h4 className="sectionHeading">Personal Information</h4>
            <div className="formRow split3">
              <ReadOnly label="DATE OF BIRTH" type="date" value={form.birthDate} />
              <Text label="PLACE OF BIRTH" name="placeOfBirth" {...f} />
              <Text label="PERSONAL EMAIL" name="personalEmail" {...f} />
            </div>
            <div className="formRow split3">
              <Text label="PHONE (MOBILE)" name="phoneNumber" {...f} />
              <Text label="LANDLINE" name="landline" {...f} />
              <Pick label="CIVIL STATUS" name="civilStatus" options={CIVIL} {...p} />
            </div>
            <div className="formRow split3">
              <Text label="RELIGION" name="religion" {...f} />
              <Text label="NATIONALITY" name="nationality" {...f} />
              <Text label="LANGUAGE / DIALECT" name="language" {...f} />
            </div>
            <div className="formRow split3">
              <Text label="HEIGHT" name="height" placeholder="e.g. 170 cm" {...f} />
              <Text label="WEIGHT" name="weight" placeholder="e.g. 65 kg" {...f} />
              <Text label="VISUAL PROBLEM" name="visualProblems" placeholder="e.g. N/A or Glasses" {...f} />
            </div>
          </div>
        )}

        {/* STEP 3: Address */}
        {step === 3 && (
          <div className="stepContent">
            <h4 className="sectionHeading">Permanent Address</h4>
            <div className="formRow split3">
              <Text label="HOUSE NO. / STREET" name="permHouseNo" {...f} />
              <Text label="SUBDIVISION / STREET" name="permStreet" {...f} />
              <Text label="BARANGAY" name="permBarangay" {...f} />
            </div>
            <div className="formRow split2">
              <Text label="CITY / MUNICIPALITY" name="permCity" {...f} />
              <Text label="PROVINCE" name="permProvince" {...f} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', marginBottom: '8px' }}>
              <h4 className="sectionHeading" style={{ margin: 0 }}>Provincial Address</h4>
              <label style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" name="sameAsPermanent" checked={form.sameAsPermanent} onChange={handleChange} />
                Same as Permanent Address
              </label>
            </div>
            {!form.sameAsPermanent && (
              <>
                <div className="formRow split3">
                  <Text label="HOUSE NO. / STREET" name="provHouseNo" {...f} />
                  <Text label="SUBDIVISION / STREET" name="provStreet" {...f} />
                  <Text label="BARANGAY" name="provBarangay" {...f} />
                </div>
                <div className="formRow split2">
                  <Text label="CITY / MUNICIPALITY" name="provCity" {...f} />
                  <Text label="PROVINCE" name="provProvince" {...f} />
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 4: Parents & Guardian */}
        {step === 4 && (
          <div className="stepContent">
            <h4 className="sectionHeading">Family Information</h4>

            <h5 className="subSectionHeading" style={{ ...subHeading, marginTop: 0 }}>Father's Details</h5>
            <div className="formRow split3">
              <Text label="First Name" name="fatherFirstName" {...f} />
              <Text label="Middle Name" name="fatherMiddleName" {...f} />
              <Text label="Last Name" name="fatherLastName" {...f} />
            </div>
            <div className="formRow split2">
              <Text label="Suffix" name="fatherSuffix" placeholder="Jr., III" {...f} />
              <Pick label="Status" name="fatherStatus" options={LIVING} {...p} />
            </div>
            <div className="formRow split2">
              <Text label="Occupation" name="fatherOccupation" {...f} />
              <Text label="Contact Number" name="fatherContact" {...f} />
            </div>

            <h5 className="subSectionHeading" style={subHeading}>Mother's Details</h5>
            <div className="formRow split3">
              <Text label="First Name" name="motherFirstName" {...f} />
              <Text label="Middle Name" name="motherMiddleName" {...f} />
              <Text label="Last Name" name="motherLastName" {...f} />
            </div>
            <div className="formRow split2">
              <Text label="Suffix" name="motherSuffix" placeholder="Jr., III" {...f} />
              <Pick label="Status" name="motherStatus" options={LIVING} {...p} />
            </div>
            <div className="formRow split2">
              <Text label="Occupation" name="motherOccupation" {...f} />
              <Text label="Contact Number" name="motherContact" {...f} />
            </div>

            <h5 className="subSectionHeading" style={subHeading}>Guardian's Details (if any)</h5>
            <div className="formRow split3">
              <Text label="First Name" name="guardianFirstName" {...f} />
              <Text label="Middle Name" name="guardianMiddleName" {...f} />
              <Text label="Last Name" name="guardianLastName" {...f} />
            </div>
            <div className="formRow split3">
              <Text label="Suffix" name="guardianSuffix" placeholder="Jr., III" {...f} />
              <Text label="Occupation" name="guardianOccupation" {...f} />
              <Text label="Contact Number" name="guardianContact" {...f} />
            </div>
          </div>
        )}

        {/* STEP 5: Family Background */}
        {step === 5 && (
          <div className="stepContent">
            <h4 className="sectionHeading">Family Background</h4>
            <div className="formRow split3">
              <Pick label="WHO SUPPORTS YOUR EDUCATION?" name="support" options={SUPPORT} {...p} />
              <Pick label="PARENTS' JOINT MONTHLY INCOME" name="parentsIncome" options={INCOME} {...p} />
              <Pick label="WHILE STUDYING, WILL YOU LIVE IN" name="livingIn" options={LIVING_IN} {...p} />
            </div>
            <div className="formRow split3">
              <Pick label="DAILY TRANSPORTATION EXPENSE" name="dailyTranspoExpense" options={TRANSPO} {...p} />
              <div className="formGroup">
                <label className="formLabel">NUMBER OF SIBLINGS</label>
                <input type="number" min="0" name="noSiblings" value={form.noSiblings} onChange={handleChange} />
              </div>
              <Pick label="ORDINAL POSITION" name="ordinalPosition" options={ORDINAL} {...p} />
            </div>
          </div>
        )}

        {/* STEP 6: Education & Achievements */}
        {step === 6 && (
          <div className="stepContent">
            <h4 className="sectionHeading">Program and Education</h4>
            <div className="formRow split2">
              <Text label="HIGH SCHOOL GRADUATED" name="highschoolGraduated" {...f} />
              <Pick label="PRIVATE OR PUBLIC" name="pubprivHS" options={PUBPRIV} {...p} />
            </div>
            <div className="formRow split2">
              <Text label="SCHOOL ADDRESS" name="schoolAddress" {...f} />
              <div className="formGroup">
                <label className="formLabel">4TH YEAR HS FINAL GWA</label>
                <input type="number" step="0.01" name="hsFinalGWA" value={form.hsFinalGWA} onChange={handleChange} placeholder="e.g. 88.50" />
              </div>
            </div>

            <h4 className="sectionHeading" style={{ marginTop: '20px' }}>Achievements, Hobbies &amp; Interests</h4>
            <div className="formRow split2">
              <Area label="AWARDS / HONORS RECEIVED" name="awardsHonors" {...f} />
              <Area label="CAREER / WORK YOU WANT TO PURSUE" name="futureCareer" {...f} />
            </div>
            <div className="formRow split2">
              <Area label="HOBBIES / SPORTS / INTERESTS" name="hobbiesInterests" {...f} />
              <Area label="ACADEMIC CLUBS / EXTRACURRICULARS" name="academicClubsExtracurr" {...f} />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="SProfileNav">
        {step > 1 ? (
          <button type="button" className="cancelBtn" onClick={() => goTo(step - 1)} disabled={saving}>
            <BiLeftArrowAlt style={{ marginRight: '5px', fontSize: '1.2rem' }} /> BACK
          </button>
        ) : <span />}

        {step < totalSteps ? (
          <button type="button" className="submitBtn" onClick={() => goTo(step + 1)}>
            NEXT <BiRightArrowAlt style={{ marginLeft: '5px', fontSize: '1.2rem' }} />
          </button>
        ) : (
          <button type="button" className="submitBtn" onClick={handleSave} disabled={saving}>
            {saving ? 'SAVING...' : <><BiSave style={{ marginRight: '5px', fontSize: '1.2rem' }} /> SAVE CHANGES</>}
          </button>
        )}
      </div>

      </div>

      <ConfirmationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        summary={modal.summary}
        variant={modal.variant}
        isAlert={modal.isAlert}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </div>
  );
}

export default SProfile;
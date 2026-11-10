import React, { useEffect, useRef, useState } from 'react';
import { BiLeftArrowAlt, BiRightArrowAlt, BiSave, BiUndo } from 'react-icons/bi';

import TextField from '../../Components/ui/Textfield';
import Button from '../../Components/ui/Button';
import Alert from '../../Components/ui/Alert';
import ConfirmationModal from '../../Components/shared/ConfirmationModal';
import Avatar from '../../Components/ui/Avatar';

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

const pick = (d, ...keys) => {
  for (const k of keys) {
    const v = d?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
};

const norm = (v) => String(v).toLowerCase().replace(/^between\s+/, '').replace(/\s+/g, ' ').trim();
const canonical = (value, options) => {
  if (!value) return '';
  const hit = options.find((o) => o.value && norm(o.value) === norm(value));
  return hit ? hit.value : value;
};

const statusFrom = (d, who) => {
  const s = pick(d, `${who}_status`);
  if (s) return s;
  const alive = d?.[`${who}_is_alive`] ?? d?.[`${who}_alive`];
  if (alive === true || alive === 't' || alive === 'true') return 'Living';
  if (alive === false || alive === 'f' || alive === 'false') return 'Deceased';
  return '';
};

const mapProfile = (d) => ({
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

  permHouseNo: pick(d, 'perm_house_no', 'present_houseno'),
  permStreet: pick(d, 'perm_street', 'present_street', 'street'),
  permBarangay: pick(d, 'perm_barangay', 'present_sbdvsn_brgy', 'present_barangay', 'barangay'),
  permCity: pick(d, 'perm_city', 'present_city_mncplty', 'present_city', 'city_municipality'),
  permProvince: pick(d, 'perm_province', 'present_province', 'province'),

  sameAsPermanent: !!d?.same_as_permanent,
  provHouseNo: pick(d, 'prov_house_no', 'provincial_houseno'),
  provStreet: pick(d, 'prov_street', 'provincial_street'),
  provBarangay: pick(d, 'prov_barangay', 'provincial_sbdvsn_brgy'),
  provCity: pick(d, 'prov_city', 'provincial_city_mncplty'),
  provProvince: pick(d, 'prov_province', 'provincial_province'),

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

  support: canonical(pick(d, 'support'), SUPPORT),
  parentsIncome: canonical(pick(d, 'parents_income'), INCOME),
  livingIn: canonical(pick(d, 'living_in'), LIVING_IN),
  dailyTranspoExpense: canonical(pick(d, 'daily_transpo_expense'), TRANSPO),
  noSiblings: d?.no_siblings ?? '',
  ordinalPosition: canonical(pick(d, 'ordinal_position'), ORDINAL),

  highschoolGraduated: pick(d, 'highschool_graduated'),
  pubprivHS: canonical(pick(d, 'pub_priv_hs', 'pubpriv_hs', 'pubprivHS'), PUBPRIV) || 'Public',
  schoolAddress: pick(d, 'hs_school_address', 'highschool_address', 'schoolAddress'),
  hsFinalGWA: pick(d, 'hs_final_gwa'),
  awardsHonors: pick(d, 'awards_honors'),
  futureCareer: pick(d, 'future_career'),
  hobbiesInterests: pick(d, 'hobbies_interests'),
  academicClubsExtracurr: pick(d, 'acad_extracurr', 'acad_clubs_extracurr'),
});

/* ---------------- Field helpers ---------------- */

const Field = ({ label, name, form, onChange, ...rest }) => (
  <TextField 
    id={`field-${name}`} 
    name={name} 
    label={label} 
    value={form[name]} 
    onChange={onChange} 
    inputClassName="md:h-14 md:text-lg md:px-4 md:bg-surface"
    {...rest} 
  />
);

const Area = ({ label, name, form, onChange }) => (
  <div className="space-y-1.5">
    <label htmlFor={`field-${name}`} className="block text-sm font-medium text-ink md:text-base">
      {label}
    </label>
    <textarea
      id={`field-${name}`}
      rows={3}
      name={name}
      value={form[name]}
      onChange={onChange}
      className="w-full rounded-ctl bg-surface-2 px-3.5 py-3 text-base text-ink ring-1 ring-line-strong transition-shadow placeholder:text-ink-3 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:text-lg md:px-4 md:py-4 md:bg-surface"
    />
  </div>
);

const Select = ({ label, name, form, setField, options }) => {
  const current = form[name];
  const opts = current && !options.some((o) => o.value === current) ? [{ value: current, label: current }, ...options] : options;
  return (
    <div className="space-y-1.5">
      <label htmlFor={`field-${name}`} className="block text-sm font-medium text-ink md:text-base">
        {label}
      </label>
      <select
        id={`field-${name}`}
        name={name}
        value={current}
        onChange={(e) => setField(name, e.target.value)}
        className="h-12 w-full rounded-ctl bg-surface-2 px-3.5 text-base text-ink ring-1 ring-line-strong transition-shadow focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:h-14 md:text-lg md:px-4 md:bg-surface"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const SectionHeading = ({ children }) => (
  <h3 className="mb-4 mt-2 font-display text-lg font-semibold text-ink md:text-xl">{children}</h3>
);

const SubHeading = ({ children }) => (
  <h4 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-3">{children}</h4>
);

/* ---------------- Component ---------------- */

function SProfile() {
  const [form, setForm] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [modal, setModal] = useState({ isOpen: false });
  const scrollRef = useRef(null);

  const totalSteps = STEPS.length;
  const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) {
          const mapped = mapProfile(d.data);
          setForm(mapped);
          setInitialForm(mapped);
        } else {
          setLoadError(d.message || 'Failed to load profile.');
        }
      })
      .catch(() => !cancelled && setLoadError('Network error. Could not load your profile.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
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
        ...(checked
          ? {
              provHouseNo: prev.permHouseNo,
              provStreet: prev.permStreet,
              provBarangay: prev.permBarangay,
              provCity: prev.permCity,
              provProvince: prev.permProvince,
            }
          : {}),
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

  const handleDiscard = () => setForm(initialForm);

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

    const payload = {
      student_number: n(form.studentNumber),
      school_email: n(form.schoolEmail),
      first_name: n(form.firstName),
      middle_name: n(form.middleName),
      last_name: n(form.lastName),
      suffix: n(form.suffix),
      sex: n(form.sex),
      birth_date: n(form.birthDate),
      program_abbr: n(form.program),
      year_level: n(form.yearLevel),
      section_name: n(form.section),
      classification: n(form.classification),
      standing: n(form.standing),

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
        setInitialForm(form);
        goTo(1);
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

  if (loading) {
    return (
      <div className="ax space-y-4 p-4 md:p-6 lg:flex lg:gap-6">
        <div className="hidden w-64 shrink-0 space-y-4 lg:block">
          <div className="h-48 animate-pulse rounded-panel bg-surface-2" />
          <div className="h-64 animate-pulse rounded-panel bg-surface-2" />
        </div>
        <div className="flex-1 space-y-4 rounded-panel border !border-line bg-surface p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-ctl bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="ax p-4">
        <Alert tone="danger">{loadError || 'Error loading profile.'}</Alert>
      </div>
    );
  }

  const f = { form, onChange: handleChange };
  const p = { form, setField };

  return (
    <div className="ax min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 pb-32 md:pb-6 lg:flex-row lg:px-8">
        
        {/* LEFT COLUMN: Identity & Stepper Navigation */}
        <div className="w-full shrink-0 lg:w-64 flex flex-col gap-4">
          {/* Profile Card */}
          <div className="flex flex-row items-center gap-4 rounded-panel border !border-line bg-surface p-4 sm:p-5 lg:flex-col lg:text-center">
            <div className="shrink-0">
              <Avatar first={form.firstName} last={form.lastName} size="lg" className="h-16 w-16 text-xl lg:h-20 lg:w-20" />
            </div>
            <div className="min-w-0 flex-1 lg:w-full">
              <h2 className="truncate font-semibold text-ink lg:whitespace-normal lg:text-lg">
                {form.firstName} {form.lastName}
              </h2>
              <p className="mt-0.5 text-sm text-ink-3">{form.studentNumber || 'No Student Number'}</p>
            </div>
          </div>

          {/* Vertical Stepper (desktop) */}
          <nav className="hidden lg:flex flex-col gap-1 rounded-panel border !border-line bg-surface p-3">
            {STEPS.map((label, i) => {
              const num = i + 1;
              const active = step === num;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => goTo(num)}
                  className={`flex items-center gap-3 rounded-ctl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    active ? 'bg-brand-soft text-brand-ink' : 'text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${
                    active ? 'bg-brand text-brand-on' : 'bg-surface-2 text-ink-3'
                  }`}>
                    {num}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Progress bar */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">Step {step} of {totalSteps}</span>
              <span className="text-ink-3">{STEPS[step - 1]}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Form */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="rounded-panel border !border-line bg-surface p-4 sm:p-6 md:p-8">
            <div className="mb-6 border-b !border-line pb-4">
              <h2 className="font-display text-2xl font-bold text-ink">{STEPS[step - 1]}</h2>
            </div>

            {step === 1 && (
              <div className="space-y-5 md:space-y-6">
                <SectionHeading>Primary Details</SectionHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-4"><Field label="First name" name="firstName" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Middle name" name="middleName" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Last name" name="lastName" {...f} /></div>
                  
                  <div className="md:col-span-4"><Field label="Suffix" name="suffix" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Student number" name="studentNumber" {...f} /></div>
                  <div className="md:col-span-4"><Field label="School email" type="email" name="schoolEmail" {...f} /></div>
                  
                  <div className="md:col-span-4"><Field label="Program" name="program" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Year level" name="yearLevel" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Section" name="section" {...f} /></div>
                  
                  <div className="md:col-span-4"><Field label="Classification" name="classification" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Standing" name="standing" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Sex" name="sex" {...f} /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 md:space-y-6">
                <SectionHeading>Personal Information</SectionHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-4"><Field label="Date of birth" type="date" name="birthDate" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Place of birth" name="placeOfBirth" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Personal email" type="email" name="personalEmail" {...f} /></div>

                  <div className="md:col-span-4"><Field label="Phone (mobile)" type="tel" name="phoneNumber" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Landline" name="landline" {...f} /></div>
                  <div className="md:col-span-4"><Select label="Civil status" name="civilStatus" options={CIVIL} {...p} /></div>

                  <div className="md:col-span-4"><Field label="Religion" name="religion" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Nationality" name="nationality" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Language / dialect" name="language" {...f} /></div>

                  <div className="md:col-span-4"><Field label="Height" name="height" placeholder="e.g. 170 cm" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Weight" name="weight" placeholder="e.g. 65 kg" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Visual problem" name="visualProblems" placeholder="e.g. N/A or Glasses" {...f} /></div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 md:space-y-6">
                <SectionHeading>Permanent Address</SectionHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-4"><Field label="House no. / street" name="permHouseNo" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Subdivision / street" name="permStreet" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Barangay" name="permBarangay" {...f} /></div>
                  
                  <div className="md:col-span-6"><Field label="City / municipality" name="permCity" {...f} /></div>
                  <div className="md:col-span-6"><Field label="Province" name="permProvince" {...f} /></div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t !border-line mt-6">
                  <SectionHeading>Provincial Address</SectionHeading>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-2">
                    <input
                      type="checkbox"
                      name="sameAsPermanent"
                      checked={form.sameAsPermanent}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-line-strong text-brand focus:ring-brand/40"
                    />
                    Same as permanent address
                  </label>
                </div>
                {!form.sameAsPermanent && (
                  <div className="space-y-5 md:space-y-6 pt-2">
                    <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                      <div className="md:col-span-4"><Field label="House no. / street" name="provHouseNo" {...f} /></div>
                      <div className="md:col-span-4"><Field label="Subdivision / street" name="provStreet" {...f} /></div>
                      <div className="md:col-span-4"><Field label="Barangay" name="provBarangay" {...f} /></div>
                      
                      <div className="md:col-span-6"><Field label="City / municipality" name="provCity" {...f} /></div>
                      <div className="md:col-span-6"><Field label="Province" name="provProvince" {...f} /></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 md:space-y-6">
                <SectionHeading>Family Information</SectionHeading>

                <SubHeading>Father's Details</SubHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-4"><Field label="First name" name="fatherFirstName" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Middle name" name="fatherMiddleName" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Last name" name="fatherLastName" {...f} /></div>

                  <div className="md:col-span-4"><Field label="Suffix" name="fatherSuffix" placeholder="Jr., III" {...f} /></div>
                  <div className="md:col-span-4"><Select label="Status" name="fatherStatus" options={LIVING} {...p} /></div>
                  <div className="md:col-span-4"><Field label="Contact number" type="tel" name="fatherContact" {...f} /></div>

                  <div className="md:col-span-12"><Field label="Occupation" name="fatherOccupation" {...f} /></div>
                </div>

                <SubHeading>Mother's Details</SubHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-4"><Field label="First name" name="motherFirstName" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Middle name" name="motherMiddleName" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Last name" name="motherLastName" {...f} /></div>

                  <div className="md:col-span-4"><Field label="Suffix" name="motherSuffix" placeholder="Jr., III" {...f} /></div>
                  <div className="md:col-span-4"><Select label="Status" name="motherStatus" options={LIVING} {...p} /></div>
                  <div className="md:col-span-4"><Field label="Contact number" type="tel" name="motherContact" {...f} /></div>

                  <div className="md:col-span-12"><Field label="Occupation" name="motherOccupation" {...f} /></div>
                </div>

                <SubHeading>Guardian's Details (if any)</SubHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-4"><Field label="First name" name="guardianFirstName" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Middle name" name="guardianMiddleName" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Last name" name="guardianLastName" {...f} /></div>

                  <div className="md:col-span-3"><Field label="Suffix" name="guardianSuffix" placeholder="Jr., III" {...f} /></div>
                  <div className="md:col-span-5"><Field label="Occupation" name="guardianOccupation" {...f} /></div>
                  <div className="md:col-span-4"><Field label="Contact number" type="tel" name="guardianContact" {...f} /></div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5 md:space-y-6">
                <SectionHeading>Family Background</SectionHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-4"><Select label="Who supports your education?" name="support" options={SUPPORT} {...p} /></div>
                  <div className="md:col-span-4"><Select label="Parents' joint monthly income" name="parentsIncome" options={INCOME} {...p} /></div>
                  <div className="md:col-span-4"><Select label="While studying, will you live in" name="livingIn" options={LIVING_IN} {...p} /></div>

                  <div className="md:col-span-4"><Select label="Daily transportation expense" name="dailyTranspoExpense" options={TRANSPO} {...p} /></div>
                  <div className="md:col-span-4"><Field label="Number of siblings" type="number" min="0" name="noSiblings" {...f} /></div>
                  <div className="md:col-span-4"><Select label="Ordinal position" name="ordinalPosition" options={ORDINAL} {...p} /></div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5 md:space-y-6">
                <SectionHeading>Program and Education</SectionHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-6"><Field label="High school graduated" name="highschoolGraduated" {...f} /></div>
                  <div className="md:col-span-6"><Select label="Private or public" name="pubprivHS" options={PUBPRIV} {...p} /></div>

                  <div className="md:col-span-6"><Field label="School address" name="schoolAddress" {...f} /></div>
                  <div className="md:col-span-6">
                    <Field
                      label="4th year HS final GWA"
                      type="number"
                      step="0.01"
                      name="hsFinalGWA"
                      placeholder="e.g. 88.50"
                      {...f}
                    />
                  </div>
                </div>

                <SectionHeading>Achievements, hobbies &amp; interests</SectionHeading>
                <div className="grid gap-5 md:grid-cols-12 md:gap-6">
                  <div className="md:col-span-6"><Area label="Awards / honors received" name="awardsHonors" {...f} /></div>
                  <div className="md:col-span-6"><Area label="Career / work you want to pursue" name="futureCareer" {...f} /></div>
                  
                  <div className="md:col-span-6"><Area label="Hobbies / sports / interests" name="hobbiesInterests" {...f} /></div>
                  <div className="md:col-span-6"><Area label="Academic clubs / extracurriculars" name="academicClubsExtracurr" {...f} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer Actions */}
          <div className="fixed inset-x-0 bottom-0 z-10 border-t !border-line bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:static md:border-0 md:bg-transparent md:p-0">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 lg:pl-[18rem]">
              <div>
                {step > 1 && (
                  <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={saving} className="md:h-12">
                    <BiLeftArrowAlt className="text-lg" /> Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isDirty && !saving && (
                  <Button variant="secondary" onClick={handleDiscard} title="Discard changes" className="md:h-12">
                    <BiUndo className="text-lg" /> Discard
                  </Button>
                )}
                {step < totalSteps ? (
                  <Button variant="primary" onClick={() => goTo(step + 1)} className="md:h-12 md:px-6">
                    Next <BiRightArrowAlt className="text-lg" />
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleSave} disabled={saving || !isDirty} loading={saving} className="md:h-12 md:px-6">
                    {!saving && <BiSave className="text-lg" />}
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                )}
              </div>
            </div>
          </div>
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
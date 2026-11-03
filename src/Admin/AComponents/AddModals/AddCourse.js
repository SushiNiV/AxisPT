import React, { useState, useEffect } from "react";
import { BiBookContent, BiX } from 'react-icons/bi';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import Dropdown from '../../../Components/shared/Dropdown'; 
import Modal from '../../../Components/ui/Modal';
import Button from '../../../Components/ui/Button';
import TextField from '../../../Components/ui/Textfield';
import NumberInput from '../../../Components/ui/NumberInput';
import cx from '../../../Components/ui/Cx';

function AddCourse({ onClose, onSuccess, courseToEdit = null }) {
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    lec_units: 0,
    lab_units: 0,
    course_desc: ""
  });
  const [selectedPrerequisites, setSelectedPrerequisites] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tempProgram, setTempProgram] = useState("");
  const [tempCurriculum, setTempCurriculum] = useState("");
  const [tempYear, setTempYear] = useState("");
  const [tempSemester, setTempSemester] = useState("");
  
  const [programs, setPrograms] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [filteredCurricula, setFilteredCurricula] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const isEditMode = !!courseToEdit;

  const [prereqSearch, setPrereqSearch] = useState("");
  const [showPrereqDropdown, setShowPrereqDropdown] = useState(false);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });
  const showSuccess = (title, summary) => setSuccessState({ isOpen: true, title, summary, variant: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [programsRes, curriculaRes, coursesRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/curricula`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, { headers })
        ]);
        const programsData = await programsRes.json();
        const curriculaData = await curriculaRes.json();
        const coursesData = await coursesRes.json();
        if (programsData.success) setPrograms(programsData.data);
        if (curriculaData.success) setCurricula(curriculaData.data);
        if (coursesData.success) setAvailableCourses(coursesData.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (courseToEdit) {
      setFormData({
        course_code: courseToEdit.course_code || "",
        course_name: courseToEdit.course_name || "",
        lec_units: courseToEdit.lec_units || 0,
        lab_units: courseToEdit.lab_units || 0,
        course_desc: courseToEdit.course_desc || ""
      });

      const fetchFullCourse = async () => {
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/courses/${courseToEdit.course_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await response.json();
          if (data.success && data.data) {
            if (data.data.prerequisites) {
              let prereqIds = [];
              if (Array.isArray(data.data.prerequisites)) prereqIds = data.data.prerequisites;
              else if (typeof data.data.prerequisites === 'string') prereqIds = data.data.prerequisites.split(',').map(Number).filter(Boolean);
              const prereqCourses = availableCourses.filter(c => prereqIds.includes(c.course_id));
              setSelectedPrerequisites(prereqCourses.map(c => ({ id: c.course_id, code: c.course_code, name: c.course_name })));
            }
            if (data.data.assignments && data.data.assignments.length > 0) {
              const mapped = data.data.assignments.map(a => ({
                curriculum_id: a.curriculum_id,
                curriculum_name: a.program_abbr || a.program_name || "Unknown",
                program_name: a.program_name,
                program_abbr: a.program_abbr,
                version_name: a.version_name,
                start_year: a.start_year,
                year_level: a.year_level,
                semester_id: a.semester_id,
                semester_label: a.semester_label
              }));
              setAssignments(mapped);
            }
          }
        } catch (err) {
          console.error("Error fetching full course:", err);
        }
      };
      fetchFullCourse();
    }
  }, [courseToEdit, availableCourses]);

  useEffect(() => {
    if (tempProgram) {
      const filtered = curricula.filter(c => c.program_id === parseInt(tempProgram));
      setFilteredCurricula(filtered);
      setTempCurriculum("");
    } else {
      setFilteredCurricula([]);
      setTempCurriculum("");
    }
  }, [tempProgram, curricula]);

  const lecUnits = parseInt(formData.lec_units) || 0;
  const labUnits = parseInt(formData.lab_units) || 0;
  const totalUnits = lecUnits + labUnits;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIsDirty(true);
    if (name === 'lec_units' || name === 'lab_units') {
      const numValue = value === '' ? 0 : parseInt(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const filteredAvailable = availableCourses.filter(c =>
    !selectedPrerequisites.some(p => p.id === c.course_id) &&
    (isEditMode ? c.course_id !== courseToEdit.course_id : true) &&
    (c.course_code.toLowerCase().includes(prereqSearch.toLowerCase()) ||
    c.course_name.toLowerCase().includes(prereqSearch.toLowerCase()))
  );

  const togglePrereq = (course) => {
    setIsDirty(true);
    setSelectedPrerequisites(prev => {
      const exists = prev.some(p => p.id === course.course_id);
      if (exists) return prev.filter(p => p.id !== course.course_id);
      return [...prev, { id: course.course_id, code: course.course_code, name: course.course_name }];
    });
    setPrereqSearch("");
    setShowPrereqDropdown(false);
  };

  const removePrereq = (id) => {
    setIsDirty(true);
    setSelectedPrerequisites(prev => prev.filter(p => p.id !== id));
  };

  const addAssignment = () => {
    if (!tempCurriculum || !tempYear || !tempSemester) {
      openAlert('Missing Selection', 'Please select Curriculum, Year, and Semester.', 'warning');
      return;
    }
    const existing = assignments.find(a => a.curriculum_id === parseInt(tempCurriculum));
    if (existing) {
      openAlert('Duplicate Assignment', 'This curriculum is already assigned. Please remove the existing assignment first.', 'warning');
      return;
    }

    const curriculum = curricula.find(c => c.curriculum_id === parseInt(tempCurriculum));
    const program = programs.find(p => p.program_id === curriculum?.program_id);
    
    const newAssignment = {
      curriculum_id: parseInt(tempCurriculum),
      curriculum_name: program?.program_abbr || program?.program_name || curriculum?.version_name || "Unknown",
      program_name: program?.program_name,
      program_abbr: program?.program_abbr,
      start_year: curriculum?.start_year,
      version_name: curriculum?.version_name,
      year_level: parseInt(tempYear),
      semester_id: parseInt(tempSemester)
    };
    
    setIsDirty(true);
    setAssignments([...assignments, newAssignment]);
    setTempProgram("");
    setTempCurriculum("");
    setTempYear("");
    setTempSemester("");
  };

  const removeAssignment = (index) => {
    setIsDirty(true);
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.course_code || !formData.course_name) {
      openAlert('Missing Fields', 'Please fill in Course Code and Course Name.', 'warning');
      return;
    }
    if (lecUnits === 0 && labUnits === 0) {
      openAlert('Missing Units', 'Please specify at least one unit (Lecture or Lab).', 'warning');
      return;
    }
    if (assignments.length === 0) {
      openAlert('No Assignments', 'Please add at least one curriculum assignment.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const url = isEditMode
        ? `${process.env.REACT_APP_API_URL}/admin/courses/${courseToEdit.course_id}`
        : `${process.env.REACT_APP_API_URL}/admin/courses`;
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = {
        course_code: formData.course_code.toUpperCase(),
        course_name: formData.course_name.toUpperCase(),
        lec_units: lecUnits,
        lab_units: labUnits,
        course_desc: formData.course_desc || null,
        prerequisites: selectedPrerequisites.map(p => p.id),
        assignments: assignments
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success || response.ok) {
        setIsDirty(false);
        showSuccess(
          isEditMode ? 'Course Updated' : 'Course Created',
          isEditMode ? 'The course has been updated successfully.' : 'The course has been created successfully.'
        );
      } else {
        openAlert('Save Failed', data.message || 'Failed to save course.', 'danger');
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSemesterLabel = (semesterId) => {
    switch(semesterId) {
      case 1: return "1st Semester";
      case 2: return "2nd Semester";
      case 3: return "Summer Term";
      default: return "";
    }
  };

  const programOptions = [
    { value: "", label: "Select Program" },
    ...programs.map(p => ({ value: p.program_id, label: p.program_abbr || p.program_name }))
  ];

  const curriculumOptions = [
    { value: "", label: "Select Curriculum" },
    ...filteredCurricula.map(cur => {
      const isAlreadyAssigned = assignments.some(a => a.curriculum_id === cur.curriculum_id);
      return {
        value: cur.curriculum_id,
        label: `${cur.version_name} (${cur.start_year})${isAlreadyAssigned ? ' - Already Assigned' : ''}`
      };
    })
  ];

  const yearOptions = [
    { value: "", label: "Select Year" },
    ...[1,2,3,4,5].map(y => ({ value: y, label: `${y} Year` }))
  ];

  const semesterOptions = [
    { value: "", label: "Select Semester" },
    { value: "1", label: "1st Semester" },
    { value: "2", label: "2nd Semester" },
    { value: "3", label: "Summer" }
  ];

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={isEditMode ? "Update Course" : "Add New Course"}
        description="Define course details, prerequisites, and curriculum assignments."
        icon={<BiBookContent className="text-2xl" />}
        loading={isSubmitting}
        isDirty={isDirty}
        footer={({ requestClose }) => (
          <>
            <Button type="button" variant="secondary" onClick={requestClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={!isDirty}>
              {isSubmitting ? "Saving..." : (isEditMode ? "Update Course" : "Create Course")}
            </Button>
          </>
        )}
      >
        <div className="space-y-8">
          {/* Course Details */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-ink">Course Details</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={<>Course Code <span className="text-danger">*</span></>} name="course_code" value={formData.course_code} onChange={handleChange} placeholder="e.g. PT101" />
              <TextField label={<>Course Name <span className="text-danger">*</span></>} name="course_name" value={formData.course_name} onChange={handleChange} placeholder="e.g. Anatomy" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <NumberInput label={<>Lec Units <span className="text-danger">*</span></>} name="lec_units" value={formData.lec_units} onChange={handleChange} min="0" placeholder="0" />
              <NumberInput label="Lab Units" name="lab_units" value={formData.lab_units} onChange={handleChange} min="0" placeholder="0" />
              <TextField label="Total Units" value={totalUnits} disabled className="opacity-60" />
            </div>
          </div>

          {/* Prerequisites */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-ink border-t border-line pt-6">Prerequisites</h4>
            <div className="space-y-3">
              <div className="relative">
                <TextField label="Search Prerequisites" value={prereqSearch} onChange={(e) => { setPrereqSearch(e.target.value); setShowPrereqDropdown(true); }} onFocus={() => setShowPrereqDropdown(true)} placeholder="Type to search courses..." />
                {showPrereqDropdown && filteredAvailable.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-48 w-full overflow-y-auto rounded-ctl border border-line bg-surface p-1 shadow-xl">
                    {filteredAvailable.map(course => (
                      <div
                        key={course.course_id}
                        onClick={() => togglePrereq(course)}
                        className="cursor-pointer truncate rounded-md px-3 py-2 text-sm text-ink hover:bg-surface-2"
                      >
                        {course.course_code} — {course.course_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPrerequisites.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedPrerequisites.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-1 pl-3 pr-2 text-xs font-medium text-brand-ink">
                      {p.code} - {p.name}
                      <button type="button" onClick={() => removePrereq(p.id)} className="grid h-4 w-4 place-items-center rounded-full hover:bg-brand/20">
                        <BiX className="text-sm" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Curriculum Assignments */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-ink border-t border-line pt-6">Curriculum Assignments <span className="text-danger">*</span></h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink">Program</label>
                <Dropdown options={programOptions} value={tempProgram} onChange={(v) => { setIsDirty(true); setTempProgram(v); }} placeholder="Select Program" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink">Curriculum</label>
                <Dropdown options={curriculumOptions} value={tempCurriculum} onChange={(v) => { setIsDirty(true); setTempCurriculum(v); }} placeholder="Select Curriculum" disabled={!tempProgram} />
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink">Year Level</label>
                <Dropdown options={yearOptions} value={tempYear} onChange={(v) => { setIsDirty(true); setTempYear(v); }} placeholder="Select Year" disabled={!tempCurriculum} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink">Semester</label>
                <Dropdown options={semesterOptions} value={tempSemester} onChange={(v) => { setIsDirty(true); setTempSemester(v); }} placeholder="Select Semester" disabled={!tempCurriculum} />
              </div>
            </div>
            
            <Button type="button" variant="secondary" onClick={addAssignment} className="mt-4 !border-0 bg-brand-soft text-brand-ink hover:bg-brand/20">
              + Add Assignment
            </Button>

            {assignments.length > 0 && (
              <div className="mt-4 space-y-2">
                {assignments.map((assignment, idx) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between gap-3 rounded-ctl border border-line bg-surface-2 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{assignment.program_abbr || assignment.curriculum_name}</p>
                      <p className="text-xs text-ink-2">
                        {assignment.version_name} ({assignment.start_year}) · Year {assignment.year_level} · {getSemesterLabel(assignment.semester_id)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssignment(idx)}
                      className="rounded-ctl px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Description */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-ink border-t border-line pt-6">Course Description</h4>
            <textarea
              name="course_desc"
              rows="4"
              value={formData.course_desc}
              onChange={handleChange}
              placeholder="Enter course description..."
              className="w-full rounded-ctl bg-surface-2 px-3.5 py-3 text-base text-ink ring-1 ring-line-strong placeholder:text-ink-3 transition-shadow focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>
        </div>
      </Modal>

      <ConfirmationModal isOpen={successState.isOpen} title={successState.title} summary={successState.summary} variant={successState.variant} isAlert={true} onConfirm={() => { setSuccessState({ isOpen: false }); onSuccess(); }} onCancel={() => { setSuccessState({ isOpen: false }); onSuccess(); }} />
      <ConfirmationModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} variant={confirmState.variant} isAlert={confirmState.isAlert} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />
    </>
  );
}

export default AddCourse;
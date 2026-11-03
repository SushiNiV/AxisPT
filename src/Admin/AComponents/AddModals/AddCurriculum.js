import React, { useState, useEffect } from "react";
import { BiLayerPlus } from 'react-icons/bi';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import Dropdown from '../../../Components/shared/Dropdown'; 
import Modal from '../../../Components/ui/Modal';
import Button from '../../../Components/ui/Button';
import TextField from '../../../Components/ui/Textfield';
import cx from '../../../Components/ui/Cx';

function AddCurriculum({ onClose, onSuccess, curriculumToEdit = null }) {
  const isEditMode = !!curriculumToEdit;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    program: "",
    start_year: currentYear,
    version: "",
    is_active: true
  });
  const [programs, setPrograms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  const closeConfirm = () => setConfirmState({ isOpen: false });

  const openAlert = (title, message, variant = 'info') => {
    setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });
  };

  const showSuccess = (title, summary) => {
    setSuccessState({ isOpen: true, title, summary, variant: 'success' });
  };

  const yearOptions = [];
  for (let year = currentYear - 10; year <= currentYear + 10; year++) {
    yearOptions.push(year);
  }

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setPrograms(data.data);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (isEditMode && curriculumToEdit) {
      setFormData({
        program: curriculumToEdit.program_id || "",
        start_year: curriculumToEdit.start_year || currentYear,
        version: curriculumToEdit.version_name || "",
        is_active: curriculumToEdit.is_active || false
      });
      setIsActive(curriculumToEdit.is_active || false);
    }
  }, [isEditMode, curriculumToEdit, currentYear]);

  // Helper to update a single field and mark dirty
  const handleFieldChange = (name, value) => {
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { program, start_year, version } = formData;

    if (!program || !start_year || !version) {
      openAlert('Missing Fields', 'Please fill in Program, Start Year, and Version.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const url = isEditMode
        ? `${process.env.REACT_APP_API_URL}/admin/curricula/${curriculumToEdit.curriculum_id}`
        : `${process.env.REACT_APP_API_URL}/admin/curricula`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          program_id: parseInt(program),
          start_year: parseInt(start_year),
          version_name: version,
          is_active: isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsDirty(false);
        showSuccess(
          isEditMode ? 'Curriculum Updated' : 'Curriculum Created',
          isEditMode ? 'The curriculum has been updated successfully.' : 'The curriculum has been created successfully.'
        );
      } else {
        openAlert('Save Failed', data.message || 'Failed to save curriculum.', 'danger');
      }
    } catch (error) {
      console.error("Error submitting curriculum:", error);
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dropdown options
  const programOptions = [
    { value: "", label: "Select Program" },
    ...programs.map(program => ({
      value: program.program_id,
      label: `${program.program_name} (${program.program_abbr})`
    }))
  ];

  const startYearOptions = yearOptions.map(year => ({
    value: year,
    label: String(year)
  }));

  return (
    <>
      <Modal
  isOpen={true}
  onClose={onClose}
  title={isEditMode ? "Update Curriculum" : "Add New Curriculum"}
  description="Define the curriculum version and starting year."
  icon={<BiLayerPlus className="text-2xl" />}
  loading={isSubmitting}
  isDirty={isDirty}
  footer={({ requestClose }) => (
    <>
          <Button 
          type="button" 
          variant="secondary" 
          onClick={requestClose} 
          disabled={isSubmitting}>
          Cancel
          </Button>
          <Button 
            type="button" 
            variant="primary" 
            onClick={handleSubmit} 
            loading={isSubmitting} 
            disabled={!isDirty}
          >
            {isSubmitting ? "Saving..." : (isEditMode ? "Update Curriculum" : "Create Curriculum")}
          </Button>
        </>
      )}
    >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Program <span className="text-danger">*</span></label>
            <Dropdown
              options={programOptions}
              value={formData.program}
              onChange={(val) => handleFieldChange('program', val)}
              placeholder="Select Program"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Start Year <span className="text-danger">*</span></label>
            <Dropdown
              options={startYearOptions}
              value={formData.start_year}
              onChange={(val) => handleFieldChange('start_year', val)}
              placeholder="Select Start Year"
            />
          </div>

          <TextField
            label={<>Version <span className="text-danger">*</span></>}
            name="version"
            placeholder="e.g. Version 1.0"
            value={formData.version}
            onChange={(e) => handleFieldChange('version', e.target.value)}
          />

          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-ink">Curriculum Status <span className="text-danger">*</span></label>
            <div 
              className="flex cursor-pointer items-center gap-3" 
              onClick={() => { setIsDirty(true); setIsActive(!isActive); }}
            >
              <div className={cx(
                "relative h-6 w-11 rounded-full transition-colors duration-200 ease-in-out",
                isActive ? "bg-brand" : "bg-line-strong"
              )}>
                <div className={cx(
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                  isActive ? "translate-x-6" : "translate-x-1"
                )} />
              </div>
              <span className={cx(
                "text-sm font-medium transition-colors",
                isActive ? "text-brand-ink" : "text-ink-2"
              )}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={successState.isOpen}
        title={successState.title}
        summary={successState.summary}
        variant={successState.variant}
        isAlert={true}
        onConfirm={() => { setSuccessState({ isOpen: false }); onSuccess(); }}
        onCancel={() => { setSuccessState({ isOpen: false }); onSuccess(); }}
      />

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        isAlert={confirmState.isAlert}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </>
  );
}

export default AddCurriculum;
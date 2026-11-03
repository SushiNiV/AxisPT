import React, { useState, useEffect } from "react";
import { BiCalendarPlus } from 'react-icons/bi';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import Modal from '../../../Components/ui/Modal';
import Button from '../../../Components/ui/Button';
import NumberInput from '../../../Components/ui/NumberInput';
import cx from '../../../Components/ui/Cx';

function AddYear({ onClose, onSuccess, yearToEdit = null }) {
  const currentYear = new Date().getFullYear();
  const isEditMode = !!yearToEdit;
  
  let initialStartYear = currentYear;
  let initialEndYear = currentYear + 1;
  let initialIsActive = false;
  
  if (isEditMode && yearToEdit.year_label) {
    const [start, end] = yearToEdit.year_label.split('-');
    initialStartYear = parseInt(start);
    initialEndYear = parseInt(end);
    initialIsActive = yearToEdit.is_active || false;
  }
  
  const [startYear, setStartYear] = useState(initialStartYear);
  const [endYear, setEndYear] = useState(initialEndYear);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });
  
  const showSuccess = (title, summary) => setSuccessState({ isOpen: true, title, summary, variant: 'success' });
  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });

  useEffect(() => {
    if (isEditMode && yearToEdit.year_label) {
      const [start, end] = yearToEdit.year_label.split('-');
      setStartYear(parseInt(start));
      setEndYear(parseInt(end));
      setIsActive(yearToEdit.is_active || false);
    }
  }, [yearToEdit, isEditMode]);

  const handleStartYearChange = (e) => {
    const value = parseInt(e.target.value);
    setIsDirty(true);
    setStartYear(value);
    if (value && !isNaN(value)) setEndYear(value + 1);
  };

  const handleSubmit = async () => {
    if (!startYear || !endYear) { openAlert('Missing Fields', 'Please fill in all required fields.', 'warning'); return; }
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const url = isEditMode 
        ? `${process.env.REACT_APP_API_URL}/admin/academic-years/${yearToEdit.year_id}`
        : `${process.env.REACT_APP_API_URL}/admin/academic-years`;
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ year_label: `${startYear}-${endYear}`, is_active: isActive })
      });
      const data = await response.json();
      if (data.success) {
        setIsDirty(false);
        showSuccess(isEditMode ? 'Academic Year Updated' : 'Academic Year Created', `The academic year ${startYear}-${endYear} has been saved successfully.`);
      } else {
        openAlert('Save Failed', data.message || 'Failed to save academic year.', 'danger');
      }
    } catch (error) {
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={isEditMode ? "Update Academic Year" : "Add Academic Year"}
        description="Define the academic year range."
        icon={<BiCalendarPlus className="text-2xl" />}
        loading={isSubmitting}
        isDirty={isDirty}
        footer={({ requestClose }) => (
          <>
            <Button type="button" variant="secondary" onClick={requestClose} disabled={isSubmitting}>
             Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={!isDirty}>
              {isSubmitting ? "Saving..." : (isEditMode ? "Update Year" : "Create Year")}
            </Button>
          </>
        )}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput label={<>Start Year <span className="text-danger">*</span></>} value={startYear} onChange={handleStartYearChange} min="2000" max="2100" />
            <NumberInput
              label={<>End Year <span className="text-danger">*</span></>} value={endYear}
              onChange={(e) => { setIsDirty(true); setEndYear(parseInt(e.target.value)); }}
              min={startYear + 1} max="2100"
            />
          </div>
          {isEditMode && isActive && <p className="text-xs text-warn">Note: Setting this as active will deactivate other active academic years.</p>}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-ink">Academic Year Status <span className="text-danger">*</span></label>
            <div className="flex cursor-pointer items-center gap-3" onClick={() => { setIsDirty(true); setIsActive(!isActive); }}>
              <div className={cx("relative h-6 w-11 rounded-full transition-colors duration-200 ease-in-out", isActive ? "bg-brand" : "bg-line-strong")}>
                <div className={cx("absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out", isActive ? "translate-x-6" : "translate-x-1")} />
              </div>
              <span className={cx("text-sm font-medium transition-colors", isActive ? "text-brand-ink" : "text-ink-2")}>{isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmationModal isOpen={successState.isOpen} title={successState.title} summary={successState.summary} variant={successState.variant} isAlert={true} onConfirm={() => { setSuccessState({ isOpen: false }); onSuccess(); }} onCancel={() => { setSuccessState({ isOpen: false }); onSuccess(); }} />
      <ConfirmationModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} variant={confirmState.variant} isAlert={confirmState.isAlert} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />
    </>
  );
}

export default AddYear;
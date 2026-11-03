import React, { useState, useEffect } from "react";
import { BiBookOpen } from 'react-icons/bi';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import Modal from '../../../Components/ui/Modal';
import Button from '../../../Components/ui/Button';
import TextField from '../../../Components/ui/Textfield';
import Dropdown from '../../../Components/shared/Dropdown';
import cx from '../../../Components/ui/Cx';

function AddProgram({ onClose, onSuccess, programToEdit = null }) {
  const [programName, setProgramName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [selectedYears, setSelectedYears] = useState([]);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });
  const isEditMode = !!programToEdit;

  const options = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });
  const showSuccess = (title, summary) => setSuccessState({ isOpen: true, title, summary, variant: 'success' });

  useEffect(() => {
    if (programToEdit) {
      setProgramName(programToEdit.program_name || "");
      setAbbreviation(programToEdit.program_abbr || "");
      setDescription(programToEdit.program_description || "");
      setIsActive(programToEdit.program_status === true);
      const yearsArray = [];
      const totalYears = programToEdit.total_year || 0;
      for (let i = 1; i <= totalYears; i++) yearsArray.push(`${i}${getYearSuffix(i)} Year`);
      setSelectedYears(yearsArray);
    }
  }, [programToEdit]);

  const getYearSuffix = (year) => year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";

  const handleYearClick = (clickedYear) => {
    setIsDirty(true);
    const clickedYearNum = options.indexOf(clickedYear) + 1;
    if (selectedYears.includes(clickedYear)) { setSelectedYears(prev => prev.filter(y => y !== clickedYear)); return; }
    const yearsToSelect = [];
    for (let i = 1; i <= clickedYearNum; i++) yearsToSelect.push(options[i - 1]);
    const allSelected = yearsToSelect.every(year => selectedYears.includes(year));
    setSelectedYears(allSelected ? prev => [...prev, clickedYear] : yearsToSelect);
  };

  const handleSubmit = async () => {
    if (!programName || !abbreviation || selectedYears.length === 0) {
      openAlert('Missing Fields', 'Please fill in Program Name, Abbreviation, and Total Year.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const url = isEditMode
        ? `${process.env.REACT_APP_API_URL}/admin/programs/${programToEdit.program_id}`
        : `${process.env.REACT_APP_API_URL}/admin/programs`;
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          program_name: programName,
          program_abbr: abbreviation,
          total_year: selectedYears.length,
          program_description: description,
          program_status: isActive
        })
      });
      const data = await response.json();
      if (data.success) {
        setIsDirty(false);
        showSuccess(isEditMode ? 'Program Updated' : 'Program Created', 'The program has been saved successfully.');
      } else {
        openAlert('Save Failed', data.message || 'Failed to save program.', 'danger');
      }
    } catch (error) {
      openAlert('Connection Error', 'An unexpected error occurred.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const yearChoices = options.map(y => ({ value: y, label: y }));
  const currentYearSelection = selectedYears.length > 0 ? selectedYears.join(", ") : "";

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={isEditMode ? "Update Program" : "Add New Program"}
        description="Enter the program details and curriculum length."
        icon={<BiBookOpen className="text-2xl" />}
        loading={isSubmitting}
        isDirty={isDirty}
        footer={({ requestClose }) => (
          <>
            <Button type="button" variant="secondary" onClick={requestClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={!isDirty}>
              {isSubmitting ? "Saving..." : (isEditMode ? "Update Program" : "Create Program")}
            </Button>
          </>
        )}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={<>Program Name <span className="text-danger">*</span></>} placeholder="Physical Therapy" value={programName} onChange={(e) => { setIsDirty(true); setProgramName(e.target.value); }} />
            <TextField label={<>Abbreviation <span className="text-danger">*</span></>} placeholder="BSPT" value={abbreviation} onChange={(e) => { setIsDirty(true); setAbbreviation(e.target.value.toUpperCase()); }} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Total Years <span className="text-danger">*</span></label>
            <Dropdown options={yearChoices} value={currentYearSelection} onChange={(val) => handleYearClick(val)} placeholder="Select Total Years" />
            {selectedYears.length > 0 && <p className="text-xs text-ink-3">Selected: {selectedYears.join(", ")}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Description</label>
            <textarea
              rows="3"
              placeholder="Enter program description..."
              value={description}
              onChange={(e) => { setIsDirty(true); setDescription(e.target.value); }}
              className="w-full rounded-ctl bg-surface-2 px-3.5 py-3 text-base text-ink ring-1 ring-line-strong placeholder:text-ink-3 transition-shadow focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </div>
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-ink">Status <span className="text-danger">*</span></label>
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

export default AddProgram;
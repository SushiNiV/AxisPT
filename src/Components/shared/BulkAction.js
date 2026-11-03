import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BiPencil, BiTrash, BiX, BiPrinter } from 'react-icons/bi';
import ConfirmationModal from '../shared/ConfirmationModal';
import Button from '../ui/Button'; 

const yearSuffix = (y) =>
  y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th';

const BulkAction = ({
  studentIds = [],
  showBar = false,
  isEditOpen = false,
  editLabel = "Edit Selected",
  onRequestEdit,
  onClose,
  onSuccess,
  onClear,
  onDelete,
}) => {
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [programId, setProgramId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });
  const [errorState, setErrorState] = useState({ isOpen: false });

  const closeConfirm = () => setConfirmState({ isOpen: false });

  const openConfirm = (config) =>
    setConfirmState({
      isOpen: true,
      variant: 'info',
      confirmLabel: 'CONFIRM',
      cancelLabel: 'CANCEL',
      isAlert: false,
      loading: false,
      ...config,
    });

  const showSuccess = (title, message) =>
    setSuccessState({ isOpen: true, title, message, variant: 'success' });

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPrograms(data.data);
      });
  }, []);

  useEffect(() => {
    if (!programId) {
      setSections([]);
      setSectionId('');
      return;
    }
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/admin/sections/by-program/${programId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSections(data.data);
      });
  }, [programId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!yearLevel && !sectionId) {
      setError('Select a year level or section to apply.');
      return;
    }
    setError(null);

    const changes = [];
    if (yearLevel) changes.push(`Year Level → ${yearLevel}${yearSuffix(yearLevel)} Year`);
    if (sectionId) {
      const picked = sections.find((s) => String(s.section_id) === String(sectionId));
      if (picked) changes.push(`Section → ${picked.section_name}`);
    }

    openConfirm({
      title: 'Confirm Bulk Update',
      message: (
        <>
          Apply the following changes to <strong>{studentIds.length}</strong> student(s)?
          <ul className="mt-3 ml-5 list-disc space-y-1">
            {changes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      ),
      variant: 'warning',
      confirmLabel: 'APPLY',
      onConfirm: performUpdate,
      onCancel: closeConfirm,
    });
  };

  const performUpdate = async () => {
    setConfirmState((s) => ({ ...s, loading: true }));
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/students/batch-update`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds,
          yearLevel: yearLevel || null,
          sectionId: sectionId ? parseInt(sectionId, 10) : null,
        }),
      });
      
      const data = await response.json();
      closeConfirm();
      
      if (data.success) {
        // Trigger refresh in parent IMMEDIATELY
        onSuccess?.(data.message); 
        
        // Then show the success modal
        showSuccess('Students Updated', data.message || `Successfully updated ${studentIds.length} student(s).`);
      } else {
        setErrorState({
          isOpen: true,
          title: 'Update Failed',
          message: data.message || 'Failed to update students.',
          variant: 'danger'
        });
      }
    } catch (err) {
      closeConfirm();
      setErrorState({
        isOpen: true,
        title: 'Connection Error',
        message: 'Failed to connect to the server.',
        variant: 'danger'
      });
    }
  };

  const portalTarget = document.getElementById('portal-root') || document.body;

  // Shared class for standard inputs
  const inputClass = "h-10 w-full rounded-ctl border-0 bg-surface-2 px-3 text-sm text-ink focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60";

  return createPortal(
    <>
      {/* ---------- Floating selection bar ---------- */}
      {showBar && studentIds.length > 1 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="ax fixed bottom-7 left-1/2 z-[900] flex -translate-x-1/2 items-center gap-4 rounded-full bg-brand py-2.5 pl-6 pr-3 shadow-xl"
        >
          <span className="whitespace-nowrap text-base font-semibold text-brand-on">
            {studentIds.length} selected
          </span>
          <div className="flex items-center gap-1.5">
            
            {/* MAIN ACTION BUTTON */}
            {onRequestEdit && (
              <button
                type="button"
                onClick={onRequestEdit}
                className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-base font-semibold text-ink transition hover:opacity-80 active:scale-95 !border-0"
              >
                {editLabel.includes('Print') ? <BiPrinter className="text-base" aria-hidden="true" /> : <BiPencil className="text-base" aria-hidden="true" />}
                {editLabel}
              </button>
            )}
            
            {/* DELETE BUTTON */}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-base font-semibold text-danger transition hover:opacity-80 active:scale-95 !border-0"
              >
                <BiTrash className="text-base" aria-hidden="true" />
                Delete Selected
              </button>
            )}
            
            {/* CLEAR BUTTON */}
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear selection"
              className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-base font-semibold text-ink-2 transition hover:opacity-80 active:scale-95 !border-0"
            >
              <BiX className="text-base" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ---------- Edit modal ---------- */}
      {isEditOpen && (
        <div
          className="ax fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4"
          onClick={onClose}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-lift"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-base font-semibold text-ink">
                Edit {studentIds.length} Student{studentIds.length === 1 ? '' : 's'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 disabled:opacity-50"
              >
                <BiX className="text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 overflow-y-auto px-5 py-4">
              <section>
                <h4 className="mb-1 text-sm font-semibold text-ink">Bulk Update</h4>
                <p className="text-xs text-ink-2">
                  Only fields you set here will change. Leave a field blank to keep each student's current value.
                </p>
              </section>

              {error && (
                <p role="alert" className="rounded-ctl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
                  {error}
                </p>
              )}

              <section className="space-y-4">
                <h4 className="text-sm font-semibold text-ink">Academic Placement</h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-ink-2">Year level</span>
                    <select
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">No change</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-ink-2">
                      Program <span className="text-ink-3">(to pick a section)</span>
                    </span>
                    <select
                      value={programId}
                      onChange={(e) => setProgramId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select program</option>
                      {programs.map((p) => (
                        <option key={p.program_id} value={p.program_id}>
                          {p.program_abbr || p.program_name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-ink-2">Section</span>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    disabled={!programId}
                    className={inputClass}
                  >
                    <option value="">No change</option>
                    {sections.map((sec) => (
                      <option key={sec.section_id} value={sec.section_id}>
                        {sec.section_name} ({sec.semester_label}, Y{sec.year_level})
                      </option>
                    ))}
                  </select>
                </label>
              </section>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-line bg-surface px-5 py-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="!border-0 bg-surface-2 hover:bg-line-strong"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                Apply
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ---------- Modals (Moved outside the edit modal) ---------- */}
      
      {/* Confirm / warning prompt */}
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

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={successState.isOpen}
        title={successState.title}
        message={successState.message}
        variant={successState.variant}
        isAlert
        onConfirm={() => {
          setSuccessState({ isOpen: false });
          onClose();
        }}
        onCancel={() => {
          setSuccessState({ isOpen: false });
          onClose();
        }}
      />

      {/* Error Modal */}
      <ConfirmationModal
        isOpen={errorState.isOpen}
        title={errorState.title}
        message={errorState.message}
        variant={errorState.variant}
        isAlert
        onConfirm={() => setErrorState({ isOpen: false })}
        onCancel={() => setErrorState({ isOpen: false })}
      />
    </>,
    portalTarget
  );
};

export default BulkAction;
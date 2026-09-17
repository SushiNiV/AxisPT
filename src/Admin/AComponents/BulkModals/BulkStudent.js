import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ConfirmationModal from '../ConfirmationModal';
import '../../../GlobalForm.css';
import '../../../GlobalOverlay.css';
import '../../../Global.css';

const BulkStudent = ({ studentIds, onClose, onSuccess }) => {
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [programId, setProgramId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Confirmation / Success modal state
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  // ---------- Modal helpers ----------
  const closeConfirm = () => setConfirmState({ isOpen: false });

  const openConfirm = (config) => {
    setConfirmState({
      isOpen: true,
      variant: 'info',
      confirmLabel: 'CONFIRM',
      cancelLabel: 'CANCEL',
      isAlert: false,
      loading: false,
      ...config,
    });
  };

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

  const showSuccess = (title, message) => {
    setSuccessState({ isOpen: true, title, message, variant: 'success' });
  };

  // ---------- Data fetching ----------
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setPrograms(data.data); });
  }, []);

  useEffect(() => {
    if (!programId) { setSections([]); setSectionId(''); return; }
    const token = sessionStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/admin/sections/by-program/${programId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setSections(data.data); });
  }, [programId]);

  // ---------- Submit: validate → open confirmation ----------
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!yearLevel && !sectionId) {
      setError('Select a year level or section to apply.');
      return;
    }
    setError(null);

    // Build a human-readable summary of what's changing
    const changes = [];
    if (yearLevel) changes.push(`Year Level → ${yearLevel}${yearLevel === '1' ? 'st' : yearLevel === '2' ? 'nd' : yearLevel === '3' ? 'rd' : 'th'} Year`);
    if (sectionId) {
      const picked = sections.find(s => String(s.section_id) === String(sectionId));
      if (picked) changes.push(`Section → ${picked.section_name}`);
    }

    openConfirm({
      title: 'Confirm Bulk Update',
      message: (
        <>
          Apply the following changes to <strong>{studentIds.length}</strong> student(s)?
          <br /><br />
          <ul style={{ margin: '0 0 0 1.2rem', padding: 0 }}>
            {changes.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </>
      ),
      variant: 'warning',
      confirmLabel: 'APPLY',
      onConfirm: performUpdate,
      onCancel: closeConfirm,
    });
  };

  // ---------- Actual API call (runs after user confirms) ----------
  const performUpdate = async () => {
    setConfirmState((s) => ({ ...s, loading: true }));
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/students/batch-update`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds,
          yearLevel: yearLevel || null,
          sectionId: sectionId ? parseInt(sectionId, 10) : null,
        })
      });
      const data = await response.json();
      closeConfirm();
      if (data.success) {
        showSuccess(
          'Students Updated',
          data.message || `Successfully updated ${studentIds.length} student(s).`
        );
      } else {
        openAlert('Update Failed', data.message || 'Failed to update students.', 'danger');
      }
    } catch (err) {
      closeConfirm();
      openAlert('Connection Error', 'Failed to connect to the server.', 'danger');
    }
  };

  const modalContent = (
    <div className="modalOverlay">
      <form onSubmit={handleSubmit} className="modalContainer" style={{ maxWidth: '520px' }}>

        <div className="modalHeader">
          <h3 className="modalTitle">EDIT {studentIds.length} STUDENT(S)</h3>
          <div className="CloseBtnArea">
            <button
              type="button"
              className="CloseBtn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              &times;
            </button>
          </div>
        </div>

        <div className="modalScrollArea">

          <div className="formSection">
            <h4 className="sectionHeading">Bulk Update</h4>
            <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
              Only fields you set here will change. Leave a field blank to keep each student's current value.
            </p>
          </div>

          {error && (
            <p style={{ color: '#c62828', fontSize: '0.85rem', margin: '0 0 1rem 0' }} role="alert">
              {error}
            </p>
          )}

          <div className="formSection">
            <h4 className="sectionHeading">Academic Placement</h4>

            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">YEAR LEVEL</label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="formSelect"
                >
                  <option value="">No change</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div className="formGroup">
                <label className="formLabel">PROGRAM (to pick a section)</label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="formSelect"
                >
                  <option value="">Select Program</option>
                  {programs.map(p => (
                    <option key={p.program_id} value={p.program_id}>
                      {p.program_abbr || p.program_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formRow">
              <div className="formGroup">
                <label className="formLabel">SECTION</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="formSelect"
                  disabled={!programId}
                >
                  <option value="">No change</option>
                  {sections.map(sec => (
                    <option key={sec.section_id} value={sec.section_id}>
                      {sec.section_name} ({sec.semester_label}, Y{sec.year_level})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modalFooter">
            <button
              type="button"
              className="cancelBtn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="submitBtn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'APPLYING...' : 'APPLY'}
            </button>
          </div>

        </div>

      </form>

      {/* Success modal */}
      <ConfirmationModal
        isOpen={successState.isOpen}
        title={successState.title}
        message={successState.message}
        variant={successState.variant}
        isAlert={true}
        onConfirm={() => {
          setSuccessState({ isOpen: false });
          onSuccess(successState.message);
        }}
        onCancel={() => {
          setSuccessState({ isOpen: false });
          onSuccess(successState.message);
        }}
      />

      {/* Confirm / alert modal */}
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

export default BulkStudent;
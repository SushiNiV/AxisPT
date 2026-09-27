import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../Global.css';
import '../../../GlobalEmpty.css';

function ArchivedSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmState, setConfirmState] = useState({ isOpen: false });

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

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/sections/archived`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setSections(data.data);
      else setError(data.message || 'Failed to fetch archived sections.');
    } catch (err) {
      console.error('Error fetching archived sections:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const filteredSections = sections.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      s.section_name?.toLowerCase().includes(term) ||
      s.program_abbr?.toLowerCase().includes(term) ||
      s.program_name?.toLowerCase().includes(term)
    );
  });

  const handleRestore = (section) => {
    openConfirm({
      title: 'Restore Section',
      summary: <>Restore <strong>{section.section_name}</strong> ({section.program_abbr})?</>,
      message: <>The section will be visible again in section pickers.</>,
      variant: 'info',
      confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/section-assignments/${section.assignment_id}/restore`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) fetchSections();
          else openAlert('Restore Failed', data.message || 'Failed to restore section.', 'danger');
        } catch (err) {
          console.error('Error restoring section:', err);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⏳</div>
          <h3 className="emptyStateTitle">Loading Archived Sections</h3>
          <p className="emptyStateText">Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⚠️</div>
          <h3 className="emptyStateTitle">Error Loading Archived Sections</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoData = filteredSections.length === 0;

  return (
    <>
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        summary={confirmState.summary}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search archived sections..."
            className="SearchInput"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <BiX className="ClearSearchIcon" onClick={() => setSearchTerm('')} />}
        </div>
      </div>

      {hasNoData ? (
        searchTerm ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No archived sections found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📚</div>
            <h3 className="emptyStateTitle">No Archived Sections</h3>
            <p className="emptyStateText">Sections you archive will appear here.</p>
          </div>
        )
      ) : (
        <div className="TableContainer">
          <table className="Table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Program</th>
                <th>Year Level</th>
                <th>Semester</th>
                <th>Students</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSections.map((sec) => (
                <tr key={sec.assignment_id}>
                  <td>{sec.section_name}</td>
                  <td>{sec.program_abbr || sec.program_name}</td>
                  <td>{sec.year_level}</td>
                  <td>{sec.semester_label}</td>
                  <td>{sec.student_count ?? 0}</td>
                  <td className="tableActions">
                    <button className="tableEditBtn" onClick={() => handleRestore(sec)}>
                      <BiUndo /> Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default ArchivedSections;
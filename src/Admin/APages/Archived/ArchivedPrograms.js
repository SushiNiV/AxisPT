import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../Global.css';
import '../../../GlobalEmpty.css';

function ArchivedPrograms() {
  const [programs, setPrograms] = useState([]);
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

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/programs?mode=archived`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setPrograms(data.data);
      else setError(data.message || 'Failed to fetch archived programs.');
    } catch (err) {
      console.error('Error fetching archived programs:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const filteredPrograms = programs.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      p.program_name?.toLowerCase().includes(term) ||
      p.program_abbr?.toLowerCase().includes(term)
    );
  });

  const handleRestore = (program) => {
    openConfirm({
      title: 'Restore Program',
      summary: <>Restore <strong>{program.program_name}</strong>?</>,
      message: <>The program will be visible again in all program pickers.</>,
      variant: 'info',
      confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/programs/${program.program_id}/restore`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) fetchPrograms();
          else openAlert('Restore Failed', data.message || 'Failed to restore program.', 'danger');
        } catch (err) {
          console.error('Error restoring program:', err);
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
          <h3 className="emptyStateTitle">Loading Archived Programs</h3>
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
          <h3 className="emptyStateTitle">Error Loading Archived Programs</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoData = filteredPrograms.length === 0;

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
            placeholder="Search archived programs..."
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
            <p className="emptyStateText">No archived programs found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">🗂️</div>
            <h3 className="emptyStateTitle">No Archived Programs</h3>
            <p className="emptyStateText">Programs you archive will appear here.</p>
          </div>
        )
      ) : (
        <div className="TableContainer">
          <table className="Table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Abbreviation</th>
                <th>Total Years</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((p) => (
                <tr key={p.program_id}>
                  <td>{p.program_name}</td>
                  <td>{p.program_abbr}</td>
                  <td>{p.total_year}</td>
                  <td className="tableActions">
                    <button className="tableEditBtn" onClick={() => handleRestore(p)}>
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

export default ArchivedPrograms;
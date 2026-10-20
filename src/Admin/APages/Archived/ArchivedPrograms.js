import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalCard.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import '../../../ResponsiveStyle/ResponsiveTable.css';

function ArchivedPrograms() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = isMobile ? 10 : 50;

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
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
  useEffect(() => { setCurrentPage(1); }, [isMobile, searchTerm]);

  const filteredPrograms = programs.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      p.program_name?.toLowerCase().includes(term) ||
      p.program_abbr?.toLowerCase().includes(term)
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredPrograms.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredPrograms.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

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
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
      <div className="InnerContainer ArchiveLayout">
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
      <div className="InnerContainer ArchiveLayout">
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
    <div className="InnerContainer ArchiveLayout">
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
        <>
          {isMobile ? (
            /* --- MOBILE CARD VIEW --- */
            <div className="CardsContainer RecordCards">
              {currentItems.map((p) => (
                <div className="Card RecordCard" key={p.program_id}>
                  <div className="CardMain">
                    <div className="cardContent">
                      <div className="cardHeader">
                        <span className="cardTitle">{p.program_name}</span>
                      </div>
                      
                      <div className="CardDetails" style={{ marginTop: 0 }}>
                        <span className="detailBadge">{p.program_abbr}</span>
                        <span className="detailBadge" style={{ background: '#f0f0f0', color: '#555' }}>
                          {p.total_year} Years
                        </span>
                      </div>
                    </div>

                    <button 
                      className="tableEditBtn" 
                      onClick={() => handleRestore(p)}
                      style={{ marginLeft: '10px' }}
                    >
                      <BiUndo /> Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* --- DESKTOP TABLE VIEW --- */
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
                  {currentItems.map((p) => (
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

          {(!isMobile || totalPages > 1) && (
          <div className="PaginationContainer">
            <div className="PaginationControls">
              <button className="PageBtn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
              <button className="PageBtn" onClick={goToPrevPage} disabled={currentPage === 1}>‹</button>
              <div className="CurrentPageInputWrapper">
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0 && val <= totalPages) setCurrentPage(val);
                  }}
                  className="CurrentPageInput"
                />
              </div>
              <div className="PaginationInfo">
                out of <span>{totalPages}</span>
              </div>
              <button className="PageBtn" onClick={goToNextPage} disabled={currentPage === totalPages}>›</button>
              <button className="PageBtn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}

export default ArchivedPrograms;
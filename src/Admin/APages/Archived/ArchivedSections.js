import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalCard.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import '../../../ResponsiveStyle/ResponsiveTable.css';

function ArchivedSections() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
  useEffect(() => { setCurrentPage(1); }, [isMobile, searchTerm]);

  const filteredSections = sections.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      s.section_name?.toLowerCase().includes(term) ||
      s.program_abbr?.toLowerCase().includes(term) ||
      s.program_name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredSections.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredSections.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

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
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
    <div className="InnerContainer">
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
        <>
          {isMobile ? (
            <div className="CardsContainer RecordCards">
              {currentItems.map((s) => (
                <div className="Card RecordCard" key={s.assignment_id}>
                  <div className="CardMain">
                    <div className="cardContent">
                      <div className="cardHeader">
                        <span className="cardTitle">{s.section_name}</span>
                      </div>
                      
                      <div className="CardDetails" style={{ marginTop: 0 }}>
                        <span className="detailBadge">{s.program_abbr || s.program_name}</span>
                        <span className="detailBadge" style={{ background: '#f0f0f0', color: '#555' }}>
                          Year {s.year_level}
                        </span>
                        <span className="detailBadge" style={{ background: '#f0f0f0', color: '#555' }}>
                          {s.semester_label}
                        </span>
                      </div>
                    </div>

                    <button 
                      className="tableEditBtn" 
                      onClick={() => handleRestore(s)}
                      style={{ marginLeft: '10px' }}
                    >
                      <BiUndo /> Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                  {currentItems.map((sec) => (
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

export default ArchivedSections;
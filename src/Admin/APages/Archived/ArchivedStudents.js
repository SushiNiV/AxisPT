import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalCard.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import '../../../ResponsiveStyle/ResponsiveTable.css';

function ArchivedStudents() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [students, setStudents] = useState([]);
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

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/students?includeArchived=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setStudents(data.data.filter((s) => s.archived_at));
      } else {
        setError(data.message || 'Failed to fetch archived students.');
      }
    } catch (err) {
      console.error('Error fetching archived students:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { setCurrentPage(1); }, [isMobile, searchTerm]);

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const label = `${s.last_name || ''} ${s.first_name || ''} ${s.student_number || ''}`.toLowerCase();
    const reason = (s.archive_reason || '').toLowerCase();
    return !term || label.includes(term) || reason.includes(term);
  });

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const handleRestore = (student) => {
    openConfirm({
      title: 'Restore Student',
      summary: <>Restore <strong>{student.last_name}, {student.first_name}</strong> ({student.student_number})?</>,
      message: <>The student will reappear in the Masterlist. You will need to reassign their section and enrollment separately.</>,
      variant: 'info',
      confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/students/${student.student_id}/restore`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) fetchStudents();
          else openAlert('Restore Failed', data.message || 'Failed to restore student.', 'danger');
        } catch (err) {
          console.error('Error restoring student:', err);
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
          <h3 className="emptyStateTitle">Loading Archived Students</h3>
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
          <h3 className="emptyStateTitle">Error Loading Archived Students</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoData = filteredStudents.length === 0;

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
            placeholder="Search archived students..."
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
            <p className="emptyStateText">No archived students found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">🎓</div>
            <h3 className="emptyStateTitle">No Archived Students</h3>
            <p className="emptyStateText">Students you archive will appear here.</p>
          </div>
        )
      ) : (
        <>
          {isMobile ? (
            <div className="CardsContainer RecordCards">
              {currentItems.map((std) => (
                <div className="Card RecordCard" key={std.student_id}>
                  <div className="CardMain">
                    <div className="cardContent">
                      <div className="cardHeader">
                        <span className="cardTitle">{std.last_name}, {std.first_name}</span>
                      </div>
                      <span className="RecordCardSub">{std.student_number}</span>
                      
                      <div className="CardDetails" style={{ marginTop: '8px' }}>
                        <span className="detailBadge">{std.program_abbr || std.program_name || '-'}</span>
                        {std.year_level && <span className="detailBadge">Year {std.year_level}</span>}
                        {std.section_name && <span className="detailBadge">{std.section_name}</span>}
                        {std.archive_reason && (
                          <span className="detailBadge" style={{ background: '#f0f0f0', color: '#555' }}>
                            {std.archive_reason}
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      className="tableEditBtn" 
                      onClick={() => handleRestore(std)}
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
                    <th>Student No.</th>
                    <th>Full Name</th>
                    <th>Program</th>
                    <th>Year Level</th>
                    <th>Section</th>
                    <th>Remarks</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((std) => (
                    <tr key={std.student_id}>
                      <td>{std.student_number}</td>
                      <td>{`${std.last_name}, ${std.first_name}`}</td>
                      <td>{std.program_abbr || std.program_name || '-'}</td>
                      <td>{std.year_level || '-'}</td>
                      <td>{std.section_name || '-'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#666', maxWidth: '200px', wordBreak: 'break-word' }}>
                        {std.archive_reason || ''}
                      </td>
                      <td className="tableActions">
                        <button className="tableEditBtn" onClick={() => handleRestore(std)}>
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

export default ArchivedStudents;
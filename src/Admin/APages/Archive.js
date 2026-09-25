import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiX, BiRevision } from 'react-icons/bi';
import ConfirmationModal from '../AComponents/ConfirmationModal';
import '../../GlobalHistory.css';
import '../../Global.css';
import '../../GlobalEmpty.css';

function Archive() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(30);

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
      onConfirm: () => setConfirmState({ isOpen: false }),
      onCancel: () => setConfirmState({ isOpen: false }),
    });
  };

  const fetchArchived = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/students?includeArchived=true`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        // Keep only archived rows.
        setStudents(data.data.filter((s) => s.archived_at));
      } else {
        setError(data.message || "Failed to fetch archived students.");
      }
    } catch (err) {
      console.error("Error fetching archived students:", err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const filteredStudents = students.filter((std) => {
    const fullName = `${std.first_name} ${std.last_name}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    return (
      fullName.includes(term) ||
      std.student_number?.toLowerCase().includes(term) ||
      std.personal_email?.toLowerCase().includes(term) ||
      (std.archive_reason || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const visibleStart = filteredStudents.length ? indexOfFirstItem + 1 : 0;
  const visibleEnd = Math.min(indexOfLastItem, filteredStudents.length);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const handleRestore = (student) => {
    const studentName = `${student.last_name}, ${student.first_name}`;
    openConfirm({
      title: 'Restore Student',
      summary: (
        <>
          Restore <strong>{studentName}</strong> ({student.student_number})?
        </>
      ),
      message: (
        <>
          Their account will be reactivated and they will appear in the
          Masterlist again. You will need to reassign their section and
          enrollment separately.
        </>
      ),
      variant: 'info',
      confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/students/${student.student_id}/restore`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchArchived();
          } else {
            openAlert('Restore Failed', data.message || 'Failed to restore student.', 'danger');
          }
        } catch (err) {
          console.error("Error restoring student:", err);
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
          <h3 className="emptyStateTitle">Loading Archive</h3>
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
          <h3 className="emptyStateTitle">Error Loading Archive</h3>
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
            onChange={handleSearch}
          />
          {searchTerm && <BiX className="ClearSearchIcon" onClick={clearSearch} />}
        </div>
      </div>

      {hasNoData ? (
        searchTerm ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No archived students matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={clearSearch}>Clear Search</button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📦</div>
            <h3 className="emptyStateTitle">Archive is Empty</h3>
            <p className="emptyStateText">Students you archive will appear here.</p>
          </div>
        )
      ) : (
        <>
          <div className="MasterlistSummary" aria-live="polite">
            <span className="MasterlistResultCount">
              Showing {visibleStart}–{visibleEnd} of {filteredStudents.length} archived students
            </span>
          </div>

          <div className="TableContainer">
            <table className="Table">
              <thead>
                <tr>
                  <th>Student No.</th>
                  <th>Full Name</th>
                  <th>Program</th>
                  <th>Year Level</th>
                  <th>Section</th>
                  <th>Email</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((std) => (
                  <tr key={std.student_id}>
                    <td>{std.student_number}</td>
                    <td>{`${std.last_name}, ${std.first_name}`}</td>
                    <td>{std.program_abbr || std.program_name || '-'}</td>
                    <td>{std.year_level ? `${std.year_level}` : '-'}</td>
                    <td>{std.section_name || '-'}</td>
                    <td>{std.personal_email}</td>
                    <td style={{ fontSize: '0.8rem', color: '#666', maxWidth: '200px', wordBreak: 'break-word' }}>
                      {std.archive_reason || ''}
                    </td>
                    <td className="tableActions">
                      <button className="tableEditBtn" onClick={() => handleRestore(std)}>
                        <BiRevision /> Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </>
      )}
    </div>
  );
}

export default Archive;
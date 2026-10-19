import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalCard.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import '../../../ResponsiveStyle/ResponsiveTable.css';

function ArchivedCourses() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [courses, setCourses] = useState([]);
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

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/courses?includeArchived=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setCourses(data.data.filter(c => c.is_archived === true));
      } else {
        setError(data.message || 'Failed to fetch archived courses.');
      }
    } catch (err) {
      console.error('Error fetching archived courses:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { setCurrentPage(1); }, [isMobile, searchTerm]);

  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      c.course_code?.toLowerCase().includes(term) ||
      c.course_name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredCourses.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const handleRestore = (course) => {
    openConfirm({
      title: 'Restore Course',
      summary: <>Restore <strong>{course.course_code}</strong> — {course.course_name}?</>,
      message: <>The course will be reactivated and available for curriculum assignment.</>,
      variant: 'info',
      confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/courses/${course.course_id}/restore`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) fetchCourses();
          else openAlert('Restore Failed', data.message || 'Failed to restore course.', 'danger');
        } catch (err) {
          console.error('Error restoring course:', err);
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
          <h3 className="emptyStateTitle">Loading Archived Courses</h3>
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
          <h3 className="emptyStateTitle">Error Loading Archived Courses</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  // Security Guard
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  if (role !== 'admin') {
    return <Navigate to="/admin/archive/students" replace />;
  }

  const hasNoData = filteredCourses.length === 0;

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
            placeholder="Search archived courses..."
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
            <p className="emptyStateText">No archived courses found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📚</div>
            <h3 className="emptyStateTitle">No Archived Courses</h3>
            <p className="emptyStateText">Courses you archive will appear here.</p>
          </div>
        )
      ) : (
        <>
          {isMobile ? (
            <div className="CardsContainer RecordCards">
              {currentItems.map((c) => (
                <div className="Card RecordCard" key={c.course_id}>
                  <div className="CardMain">
                    <div className="cardContent">
                      <div className="cardHeader">
                        <span className="cardTitle">{c.course_code}</span>
                      </div>
                      <span className="RecordCardSub">{c.course_name}</span>
                      
                      <div className="CardDetails" style={{ marginTop: '8px' }}>
                        <span className="detailBadge">
                          {c.total_units || c.lec_units + c.lab_units} units
                        </span>
                      </div>
                    </div>

                    <button 
                      className="tableEditBtn" 
                      onClick={() => handleRestore(c)}
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
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Units</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((c) => (
                    <tr key={c.course_id}>
                      <td><strong>{c.course_code}</strong></td>
                      <td>{c.course_name}</td>
                      <td>{c.total_units || c.lec_units + c.lab_units}</td>
                      <td className="tableActions">
                        <button className="tableEditBtn" onClick={() => handleRestore(c)}>
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

export default ArchivedCourses;
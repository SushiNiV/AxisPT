import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalEmpty.css';

function ArchivedCourses() {
  const [courses, setCourses] = useState([]);
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
        // Only show the archived ones on this page
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

  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      c.course_code?.toLowerCase().includes(term) ||
      c.course_name?.toLowerCase().includes(term)
    );
  });

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
              {filteredCourses.map((c) => (
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
    </>
  );
}

export default ArchivedCourses;
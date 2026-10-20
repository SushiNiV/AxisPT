import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalCard.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import '../../../ResponsiveStyle/ResponsiveTable.css';

function ArchivedUsers() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [users, setUsers] = useState([]);
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

  const formatRoleName = (roleId) => {
    if (!roleId) return '—';
    // Dynamic map from role_id — since we don't fetch roles list here, 
    // fall back to known IDs. Ideally fetch /admin/roles.
    if (roleId === 1) return 'Student';
    if (roleId === 2) return 'Admin';
    if (roleId === 3) return 'Super Admin';
    return '—';
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/faculties?includeInactive=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.filter(u => u.is_active === false));
      } else {
        setError(data.message || 'Failed to fetch archived users.');
      }
    } catch (err) {
      console.error('Error fetching archived users:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setCurrentPage(1); }, [isMobile, searchTerm]);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return (
      !term ||
      fullName.includes(term) ||
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const handleRestore = (user) => {
    openConfirm({
      title: 'Restore User',
      summary: <>Restore <strong>{user.username}</strong> ({user.first_name} {user.last_name})?</>,
      message: <>The user will be reactivated and able to log in again.</>,
      variant: 'info',
      confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/users/${user.user_id}/restore`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) fetchUsers();
          else openAlert('Restore Failed', data.message || 'Failed to restore user.', 'danger');
        } catch (err) {
          console.error('Error restoring user:', err);
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
          <h3 className="emptyStateTitle">Loading Archived Users</h3>
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
          <h3 className="emptyStateTitle">Error Loading Archived Users</h3>
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

  const hasNoData = filteredUsers.length === 0;

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
            placeholder="Search archived users..."
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
            <p className="emptyStateText">No archived users found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">👥</div>
            <h3 className="emptyStateTitle">No Archived Users</h3>
            <p className="emptyStateText">Users you archive will appear here.</p>
          </div>
        )
      ) : (
        <>
          {isMobile ? (
            <div className="CardsContainer RecordCards">
              {currentItems.map((u) => (
                <div className="Card RecordCard" key={u.user_id}>
                  <div className="CardMain">
                    <div className="cardContent">
                      <div className="cardHeader">
                        <span className="cardTitle">{u.username}</span>
                      </div>
                      <span className="RecordCardSub" style={{ fontWeight: 600, color: '#333', marginBottom: '8px', display: 'block' }}>
                        {u.first_name} {u.last_name || ''} 
                        <span style={{ fontWeight: 400, color: '#666', margin: '0 6px' }}>—</span> 
                        {u.email || 'No email'}
                      </span>
                      <div className="CardDetails" style={{ marginTop: 0 }}>
                        <span className="detailBadge">{formatRoleName(u.role_id)}</span>
                        {u.designation_name && <span className="detailBadge">{u.designation_name}</span>}
                      </div>
                    </div>

                    <button 
                      className="tableEditBtn" 
                      onClick={() => handleRestore(u)}
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
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Designation</th>
                    <th>School Email</th>
                    <th style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((u) => (
                    <tr key={u.user_id}>
                      <td>{u.username}</td>
                      <td>{u.first_name} {u.last_name || ''}</td>
                      <td>{formatRoleName(u.role_id)}</td>
                      <td>{u.designation_name || '—'}</td>
                      <td>{u.email || '—'}</td>
                      <td className="tableActions">
                        <button className="tableEditBtn" onClick={() => handleRestore(u)}>
                          <BiUndo /> Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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

export default ArchivedUsers;
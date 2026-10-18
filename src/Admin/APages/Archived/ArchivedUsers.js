import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { BiSearch, BiX, BiUndo } from 'react-icons/bi';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalEmpty.css';

function ArchivedUsers() {
  const [users, setUsers] = useState([]);
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

  const formatRoleName = (roleString) => {
    if (!roleString) return '—';
    return roleString.split(', ').map(r => {
      if (r === 'SUPERADMIN') return 'Super Admin';
      if (r === 'ADMIN') return 'Admin';
      return r;
    }).join(', ');
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
        // Filter to show ONLY inactive (archived) users
        setUsers(data.data.filter((u) => u.is_active === false));
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
            { 
                method: 'POST', 
                headers: { Authorization: `Bearer ${token}` } 
            }
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
      <div className="InnerContainer">
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
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⚠️</div>
          <h3 className="emptyStateTitle">Error Loading Archived Users</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  // Security Guard (Moved down to prevent Hooks error)
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  if (role !== 'admin') {
    return <Navigate to="/admin/archive/students" replace />;
  }

  const hasNoData = filteredUsers.length === 0;

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
            <p className="emptyStateText">Users you delete/archive will appear here.</p>
          </div>
        )
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
              {filteredUsers.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.username}</td>
                  <td>{u.first_name} {u.last_name || ''}</td>
                  <td>{formatRoleName(u.roles)}</td>
                  <td>{u.designations || '—'}</td>
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
    </>
  );
}

export default ArchivedUsers;
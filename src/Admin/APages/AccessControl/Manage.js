import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiX, BiPencil, BiTrash, BiDotsVerticalRounded } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery'; 
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/GlobalHistory.css';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import '../../../GlobalStyle/GlobalCard.css'; 
import '../../../ResponsiveStyle/ResponsiveTable.css'; 
import AddFaculty from '../../AComponents/AddModals/AddFaculty';

function AManage() {
  const isMobile = useMediaQuery('(max-width: 768px)'); 
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const rowsPerPage = isMobile ? 10 : 50; 
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  const [menuUserId, setMenuUserId] = useState(null); 

  const [confirmState, setConfirmState] = useState({ isOpen: false });

  const filterRef = useRef(null);

  // Dynamic roles list
  const [rolesList, setRolesList] = useState([]);
  const [statusOptions] = useState(["Active", "Inactive"]);

  useEffect(() => { setCurrentPage(1); }, [isMobile]);

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
    const role = rolesList.find(r => r.role_id === roleId);
    return role ? role.role_name : '—';
  };

  const hasActiveFilters = selectedRole !== "" || selectedStatus !== "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch Roles Mapping
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setRolesList(data.data);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };
    fetchRoles();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/faculties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddSuccess = () => {
    setShowAddFaculty(false);
    setEditingFaculty(null);
    fetchUsers();
  };

  const handleEdit = (user) => {
    setEditingFaculty(user);
    setShowAddFaculty(true);
  };

  const handleArchive = (user) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    openConfirm({
      title: 'Archive User',
      summary: (
        <>Archive <strong>{user.username}</strong>{fullName ? ` (${fullName})` : ''}?</>
      ),
      message: (
        <>
          The user account will be deactivated and hidden from the main list. 
          Their data is preserved and can be restored from the Archive page.
        </>
      ),
      variant: 'danger',
      confirmLabel: 'ARCHIVE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/users/${user.user_id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchUsers();
          } else {
            openAlert('Archive Failed', data.message || 'Failed to archive user.', 'danger');
          }
        } catch (error) {
          console.error("Error archiving user:", error);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.designation_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !selectedRole || user.role_id === parseInt(selectedRole);
    const matchesStatus = !selectedStatus || (selectedStatus === "Active" ? user.is_active : !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedRole("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⏳</div>
          <h3 className="emptyStateTitle">Loading Users</h3>
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
          <h3 className="emptyStateTitle">Error Loading Users</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoData = filteredUsers.length === 0;

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

      {showAddFaculty && (
        <AddFaculty
          onClose={() => {
            setShowAddFaculty(false);
            setEditingFaculty(null);
          }}
          onSuccess={handleAddSuccess}
          facultyToEdit={editingFaculty}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search users..."
            className="SearchInput"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <BiX
              className="ClearSearchIcon"
              onClick={clearSearch}
            />
          )}
        </div>

        <div className="TopbarBtnContainer" ref={filterRef}>
          <button
            className={`TopbarBtn ${isFilterOpen ? 'Active' : ''} ${hasActiveFilters ? 'FilterActive' : ''}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <BiFilterAlt className="linkIcon" />
            Filter
          </button>

          {isFilterOpen && (
            <div className="FilterDropdown">
              <div className="FilterGroup">
                <label>ROLE</label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL ROLES</option>
                  {rolesList.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="FilterGroup">
                <label>STATUS</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL STATUS</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="BtnsContainer">
                <button className="ResetFilterBtn" onClick={resetFilters}>Reset</button>
                <button className="ApplyFilterBtn" onClick={() => setIsFilterOpen(false)}>Apply</button>
              </div>
            </div>
          )}
        </div>

        <div className="TopbarBtnContainer">
          <button className="TopbarBtn" onClick={() => setShowAddFaculty(true)}>
            <BiPlusCircle className="linkIcon" />
            User
          </button>
        </div>
      </div>

      {hasNoData ? (
        searchTerm ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No users found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={clearSearch}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">👥</div>
            <h3 className="emptyStateTitle">No Users Yet</h3>
            <p className="emptyStateText">Get started by creating your first user.</p>
            <button className="emptyStateBtn" onClick={() => setShowAddFaculty(true)}>
              <BiPlusCircle className="linkIcon"/> Create User
            </button>
          </div>
        )
      ) : (
        <>
          {/* --- MOBILE VIEW --- */}
          {isMobile ? (
            <div className="CardsContainer RecordCards">
              {currentItems.map((user) => (
                <div className="Card RecordCard" key={user.user_id}>
                  <div className="CardMain">
                    <div className="cardContent">
                      <div className="cardHeader">
                        <span className="cardTitle">{user.username}</span>
                      </div>
                      <span className="RecordCardSub">
                        {user.first_name} {user.last_name || ''} 
                        <span style={{ fontWeight: 400, color: '#666', margin: '0 6px' }}>—</span> 
                        {user.email || 'No email'}
                      </span>
                      <div className="CardDetails">
                        <span className="detailBadge">{formatRoleName(user.role_id)}</span>
                        {user.designation_name && <span className="detailBadge">{user.designation_name}</span>}
                        <span className={`statusBadge ${user.is_active ? 'active-bg' : 'inactive-bg'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <button
                      className="RecordMenuBtn"
                      aria-label="User actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuUserId(menuUserId === user.user_id ? null : user.user_id);
                      }}
                    >
                      <BiDotsVerticalRounded />
                    </button>
                  </div>

                  {menuUserId === user.user_id && (
                    <>
                      <div
                        className="CardMenuBackdrop"
                        onClick={(e) => { e.stopPropagation(); setMenuUserId(null); }}
                      />
                      <div className="CardMenu" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setMenuUserId(null); handleEdit(user); }}>
                          <BiPencil /> Edit
                        </button>
                        <button className="danger" onClick={() => { setMenuUserId(null); handleArchive(user); }}>
                          <BiTrash /> Archive
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="TableContainer">
              <table className="Table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" />
                    </th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Designation</th>
                    <th> School Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((user) => (
                    <tr key={user.user_id}>
                      <td><input type="checkbox" /></td>
                      <td>{user.username}</td>
                      <td>{user.first_name} {user.last_name || ''}</td>
                      <td>{formatRoleName(user.role_id)}</td>
                      <td>{user.designation_name || '—'}</td>
                      <td>{user.email || '—'}</td>
                      <td>
                        <span className={`statusBadge ${user.is_active ? 'active-bg' : 'inactive-bg'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="tableActions">
                        <button className="tableEditBtn" onClick={() => handleEdit(user)}>
                          <BiPencil /> Edit
                        </button>
                        <button className="tableDeleteBtn" onClick={() => handleArchive(user)}>
                          <BiTrash /> Archive
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

export default AManage;
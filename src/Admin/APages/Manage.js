import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiX, BiTrash, BiExport } from 'react-icons/bi';
import '../../GlobalHistory.css';
import '../../Global.css';
import '../../GlobalEmpty.css';
import AddFaculty from '../AComponents/AddFaculty';

function AManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  const filterRef = useRef(null);
  
  const [roleOptions, setRoleOptions] = useState([]);
  const [statusOptions] = useState(["Active", "Inactive"]);

  const formatRoleName = (role) => {
    if (role === 'SUPERADMIN') return 'Super Admin';
    if (role === 'ADMIN') return 'Admin';
    return role;
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        const uniqueRoles = [...new Set(data.data.flatMap(u => u.roles?.split(', ') || []))];
        setRoleOptions(uniqueRoles);
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

  const handleDelete = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          fetchUsers();
        } else {
          alert(data.message || "Failed to delete user.");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred.");
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.designations?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roles?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !selectedRole || (user.roles && user.roles.includes(selectedRole));
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
                  {roleOptions.map(role => (
                    <option key={role} value={role}>
                      {formatRoleName(role)}
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
                    <td>{formatRoleName(user.roles)}</td>
                    <td>{user.designations || '—'}</td>
                    <td>{user.email || '—'}</td>
                    <td>
                      <span className={`statusBadge ${user.is_active ? 'active-bg' : 'inactive-bg'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="tableActions">
                      <button className="tableEditBtn" onClick={() => handleEdit(user)}>Edit</button>
                      <button className="tableDeleteBtn" onClick={() => handleDelete(user.user_id, user.username)}>Delete</button>
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

export default AManage;
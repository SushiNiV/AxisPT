import React, { useState, useEffect } from 'react';
import './AManagePeople.css';
import { BiSearch, BiX, BiTrash, BiPlusCircle, BiUserCheck, BiUserX } from 'react-icons/bi';
import SelectionPanel from '../../Components/SelectionPanel';

function AManagePeople() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Admin' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.roles?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const clearSearch = () => { setSearchTerm(""); setCurrentPage(1); };

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= totalPages) setCurrentPage(value);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(currentUsers.map(u => u.user_id));
    else setSelectedIds([]);
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleAddUser = async () => {
    const token = sessionStorage.getItem('token');
    await fetch(`${process.env.REACT_APP_API_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newUser)
    });
    setShowAdd(false);
    setNewUser({ username: '', password: '', role: 'Admin' });
    fetchUsers();
  };

  const toggleStatus = async (id, isActive) => {
    const token = sessionStorage.getItem('token');
    await fetch(`${process.env.REACT_APP_API_URL}/admin/users/${id}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ is_active: !isActive })
    });
    fetchUsers();
  };

  return (
    <div className="amanageContainer">
      {/* Add User Modal */}
      {showAdd && (
        <div className="modalOverlay" onClick={() => setShowAdd(false)}>
          <div className="createContainer" onClick={e => e.stopPropagation()}>
            <div className="createHeader">
              <h3>ADD USER</h3>
              <button className="closeBt" onClick={() => setShowAdd(false)}>&times;</button>
            </div>
            <div className="formScrollArea">
              <div className="createFormContent">
                <div className="formGroup">
                  <label>USERNAME <span style={{color: 'red'}}>*</span></label>
                  <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                </div>
                <div className="formGroup">
                  <label>PASSWORD <span style={{color: 'red'}}>*</span></label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                </div>
                <div className="formGroup">
                  <label>ROLE</label>
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
                <div className="filterBtnsContainer">
                  <button className="resetFilterBtn" onClick={() => setShowAdd(false)}>CANCEL</button>
                  <button className="applyFilterBtn" onClick={handleAddUser}>CREATE</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input type="text" placeholder="Search username or role..." className="studentSearchInput"
            value={searchTerm} onChange={handleSearch} />
          {searchTerm && <BiX className="clearSearchIcon" onClick={clearSearch} />}
        </div>
        <div className="createBtnContainer">
          <button className="createBtnManage" onClick={() => setShowAdd(true)}>
            <BiPlusCircle className="linkIcon" /> Add User
          </button>
        </div>
      </div>

      <div className="tableContainer">
        <table className="studentTable">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={handleSelectAll}
                checked={currentUsers.length > 0 && selectedIds.length === currentUsers.length} /></th>
              <th>No.</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Loading users...</td></tr>
            ) : currentUsers.length > 0 ? (
              currentUsers.map((user, index) => {
                const isSelected = selectedIds.includes(user.user_id);
                return (
                  <tr key={user.user_id} className={isSelected ? 'selected-row' : ''}>
                    <td><input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(user.user_id)} /></td>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>{user.username}</td>
                    <td>{user.roles || '—'}</td>
                    <td>
                      <span className={`statusBadge ${user.is_active ? 'badge-green' : 'badge-red'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="actionBtn" onClick={() => toggleStatus(user.user_id, user.is_active)}
                        title={user.is_active ? 'Deactivate' : 'Activate'}>
                        {user.is_active ? <BiUserX size={16} /> : <BiUserCheck size={16} />}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '10px', color: '#666'}}>
                {searchTerm ? `No users matching "${searchTerm}"` : "No users available"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn first" onClick={goToFirstPage} disabled={currentPage === 1}>«</button>
          <button className="pageBtn prev" onClick={goToPrevPage} disabled={currentPage === 1}>‹</button>
          <div className="currentPageInputWrapper">
            <input type="number" value={currentPage} onChange={handlePageInput} className="currentPageInput" />
          </div>
          <div className="paginationInfo"><div>out of <span>{totalPages || 1}</span></div></div>
          <button className="pageBtn next" onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0}>›</button>
          <button className="pageBtn last" onClick={goToLastPage} disabled={currentPage === totalPages || totalPages === 0}>»</button>
        </div>
      </div>

      <SelectionPanel selectedCount={selectedIds.length} onClear={() => setSelectedIds([])}>
        <button className="deleteBtn" onClick={() => console.log("Delete:", selectedIds)}>
          <BiTrash size={18} /> Delete Selected
        </button>
      </SelectionPanel>
    </div>
  );
}

export default AManagePeople;
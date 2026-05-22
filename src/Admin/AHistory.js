import React, { useState, useRef, useEffect } from 'react';
import './AHistory.css';
import { BiSearch, BiFilterAlt, BiChevronDown, BiX } from 'react-icons/bi';

function AHistory() {
  const [historyData, setHistoryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [loading, setLoading] = useState(true);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const dropdownRef = useRef(null);

  // Data Fetching
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/history`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });

        const data = await response.json();

        if (data.success && data.history) {
          const mappedData = data.history.map(item => ({
            id: item.log_id,
            userId: item.user_id,
            userRole: item.user_role,
            action: item.action,
            targetId: item.target_id,
            details: item.details,
            timestamp: new Date(item.timestamp).toLocaleString()
          }));
          setHistoryData(mappedData);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const roleOptions = ["DEVELOPER", "ADMIN"];
  const actionOptions = ["LOGIN_SUCCESS", "LOGIN_FAILED", "BULK_ACCEPT", "BULK_REJECT", "PASSWORD_CHANGED", "PASSWORD_CHANGE_FAILED"];

  // Filtering Logic
  const safeString = (value) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const filteredHistory = historyData.filter((item) => {
    const searchStr = safeString(searchTerm).toLowerCase();
    
    const matchesSearch = 
      safeString(item.userId).toLowerCase().includes(searchStr) ||
      safeString(item.action).toLowerCase().includes(searchStr) ||
      safeString(item.details).toLowerCase().includes(searchStr);

    const matchesRole = !selectedRole || safeString(item.userRole) === selectedRole;
    const matchesAction = !selectedAction || safeString(item.action) === selectedAction;

    return matchesSearch && matchesRole && matchesAction;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  // Event Handlers
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
    setSelectedAction("");
    setCurrentPage(1);
  };

  const goToNextPage = () => { 
    if (currentPage < totalPages) setCurrentPage(p => p + 1); 
  };
  
  const goToPrevPage = () => { 
    if (currentPage > 1) setCurrentPage(p => p - 1); 
  };

  // Click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="ahistory-container">
      <div className="ahistory-searchBarSection">
        <div className="ahistory-searchWrapper">
          <BiSearch className="ahistory-searchIcon" />
          <input 
            type="text" 
            placeholder="Search history..." 
            className="ahistory-studentSearchInput"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <BiX 
              className="ahistory-clearSearchIcon" 
              onClick={clearSearch}
            />
          )}
        </div>
        
        <div className="ahistory-filterContainer" ref={dropdownRef}>
          <button 
            className={`ahistory-filterToggleBtn ${isFilterOpen ? 'ahistory-active' : ''}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <BiFilterAlt className="ahistory-linkIcon" />
            Filter
          </button>

          {isFilterOpen && (
            <div className="ahistory-filterDropdown">
              <div className="ahistory-filterGroup">
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
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="ahistory-filterGroup">
                <label>ACTION</label>
                <select 
                  value={selectedAction} 
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL ACTIONS</option>
                  {actionOptions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              <div className="ahistory-filterBtnsContainer">
                <button className="ahistory-resetFilterBtn" onClick={resetFilters}>Reset</button>
                <button className="ahistory-applyFilterBtn" onClick={() => setIsFilterOpen(false)}>Apply</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ahistory-historyTableContainer">
        <table className="ahistory-historyPage ahistory-studentTable">
          <thead>
            <tr>
              <th>No.</th>
              <th>User ID</th>
              <th>User Role</th>
              <th>Action</th>
              <th>Target ID</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Loading history...</td>
              </tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{item.userId}</td>
                  <td>{item.userRole}</td>
                  <td>
                    <span className={`ahistory-statusTag ahistory-${safeString(item.action).toLowerCase()}`}>
                      {item.action}
                    </span>
                  </td>
                  <td>{item.targetId || "—"}</td>
                  <td>{item.details}</td>
                  <td>{item.timestamp}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No records found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="ahistory-paginationContainer">
          <div className="ahistory-paginationControls">
            <button className="ahistory-pageBtn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
            <button className="ahistory-pageBtn" onClick={goToPrevPage} disabled={currentPage === 1}>‹</button>
            <div className="ahistory-currentPageInputWrapper">
              <input 
                type="number" 
                value={currentPage} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val <= totalPages) setCurrentPage(val);
                }} 
                className="ahistory-currentPageInput" 
              />
            </div>
            <div className="ahistory-paginationInfo">
              out of <span>{totalPages}</span>
            </div>
            <button className="ahistory-pageBtn" onClick={goToNextPage} disabled={currentPage === totalPages}>›</button>
            <button className="ahistory-pageBtn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AHistory;
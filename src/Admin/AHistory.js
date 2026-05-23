import React, { useState, useEffect, useRef } from 'react';
import { BiSearch, BiFilterAlt, BiChevronDown, BiX } from 'react-icons/bi';
import './../GlobalHistory.css';
import './../Global.css'

function AHistory() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  
  const filterRef = useRef(null);
  
  const [designationOptions, setDesignationOptions] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);

  const hasActiveFilters = selectedDesignation !== "" || selectedAction !== "";

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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
            userId: item.username,
            designation: item.designation || item.user_role,
            action: item.action,
            targetId: item.target_username || item.username,
            details: item.details,
            timestamp: item.timestamp
          }));
          
          setHistoryData(mappedData);
          
          const uniqueDesignations = [...new Set(mappedData.map(item => item.designation))];
          const uniqueActions = [...new Set(mappedData.map(item => item.action))];
          
          setDesignationOptions(uniqueDesignations);
          setActionOptions(uniqueActions);
        } else {
          setError(data.message || "Failed to fetch history data");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to connect to the server");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

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

    const matchesDesignation = !selectedDesignation || safeString(item.designation) === selectedDesignation;
    const matchesAction = !selectedAction || safeString(item.action) === selectedAction;

    return matchesSearch && matchesDesignation && matchesAction;
  });

  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedDesignation("");
    setSelectedAction("");
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
      <div className="HistoryContainer">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          Loading history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="HistoryContainer">
        <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="InnerContainer">

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input 
            type="text" 
            placeholder="Search history..." 
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
                <label>DESIGNATION</label>
                <select 
                  value={selectedDesignation} 
                  onChange={(e) => {
                    setSelectedDesignation(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL DESIGNATIONS</option>
                  {designationOptions.map(designation => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
              </div>

              <div className="FilterGroup">
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

              <div className="BtnsContainer">
                <button className="ResetFilterBtn" onClick={resetFilters}>Reset</button>
                <button className="ApplyFilterBtn" onClick={() => setIsFilterOpen(false)}>Apply</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="TableContainer History">
        <table className="Table">
          <thead>
            <tr>
              <th>No.</th>
              <th>User ID</th>
              <th>Designation</th>
              <th>Action</th>
              <th>Target ID</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <tr key={item.id}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{item.userId}</td>
                  <td>{item.designation}</td>
                  <td>
                    <span className={`StatusTag ${safeString(item.action).toLowerCase().replace(/ /g, '-')}`}>
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
                <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>
                  No records found matching your criteria.
                </td>
              </tr>
            )}
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
    </div>
  );
}

export default AHistory;
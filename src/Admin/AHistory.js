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
  const [activeGroup, setActiveGroup] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const dropdownRef = useRef(null); 
  
  // 1. Data Fetching
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
        console.log('Raw history data:', JSON.stringify(data, null, 2));
        if (data.success && data.history) {
          const mappedData = data.history.map(item => ({
            id: item.id,                             
            userId: item.user_id,
            userRole: item.user_role || '—',          
            action: item.action,
            targetId: item.target_user_id,            
            details: item.details || '',
            timestamp: new Date(item.created_at).toLocaleString()  
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

  const filters = [
    { label: "ROLE", options: ["DEVELOPER", "ADMIN"] },
    { label: "ACTION", options: ["LOGIN", "BULK_ACCEPT", "BULK_REJECT", "PASSWORD_CHANGE"] }
  ];

  // 2. Filtering Logic
  const filteredHistory = historyData.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
    (String(item.userId || '')).toLowerCase().includes(searchStr) ||
    (item.action?.toLowerCase() || "").includes(searchStr) ||
    (item.details?.toLowerCase() || "").includes(searchStr);

    const matchesFilters = Object.keys(filterValues).every(key => {
      const selectedValues = filterValues[key];
      if (!selectedValues || selectedValues.length === 0) return true;
      if (key === "ROLE") return selectedValues.includes(item.userRole);
      if (key === "ACTION") return selectedValues.includes(item.action);
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  // 3. Pagination Logic
  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  // 4. Event Handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleOption = (label, option) => {
    setFilterValues(prev => {
      const currentSelection = prev[label] || [];
      const newSelection = currentSelection.includes(option)
        ? currentSelection.filter(item => item !== option)
        : [...currentSelection, option];
      return { ...prev, [label]: newSelection };
    });
    setCurrentPage(1);
  };

  const getSortedDisplay = (label) => {
    const currentSelection = filterValues[label] || [];
    if (currentSelection.length > 0) return currentSelection.join(", ");
    return `ALL ${label}S`;
  };

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
        setActiveGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="ahistoryContainer">
      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search history..." 
            className="studentSearchInput"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <BiX 
              className="clearSearchIcon" 
              onClick={() => {setSearchTerm(""); setCurrentPage(1);}} 
              style={{cursor: 'pointer'}}
            />
          )}
        </div>
        
        <div className="filterContainer" ref={dropdownRef}>
          <button 
            className={`filterToggleBtn ${isFilterOpen ? 'active' : ''}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <BiFilterAlt className="linkIcon" />
            Filter
          </button>

          {isFilterOpen && (
            <div className="filterDropdown">
              {filters.map((f, index) => (
                <div className="filterGroup" key={f.label}>
                  <label className="sectionLabel">{f.label}</label>
                  <div 
                    className={`customSelectTrigger ${activeGroup === index ? 'focused' : ''}`}
                    onClick={() => setActiveGroup(activeGroup === index ? null : index)}
                  >
                    <div className="selectedTextDisplay">{getSortedDisplay(f.label)}</div>
                    <BiChevronDown className={`arrowIcon ${activeGroup === index ? 'rotate' : ''}`} />
                    
                    {activeGroup === index && (
                      <div className="checkboxListContainer" onClick={(e) => e.stopPropagation()}>
                        {f.options.map((opt) => (
                          <label key={opt} className="checkboxItem">
                            <input 
                              type="checkbox"
                              checked={(filterValues[f.label] || []).includes(opt)}
                              onChange={() => toggleOption(f.label, opt)}
                            />
                            <span>{opt}</span> 
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="filterBtnsContainer">
                <button className="resetFilterBtn" onClick={() => {setFilterValues({}); setCurrentPage(1);}}>Reset</button>
                <button className="applyFilterBtn" onClick={() => setIsFilterOpen(false)}>Apply</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="historyTableContainer">
        <table className="historyPage studentTable">
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
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>Loading history...</td></tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{item.userId}</td>
                  <td>{item.userRole}</td>
                  <td>
                    <span className={`statusTag ${item.action?.toLowerCase()}`}>
                        {item.action}
                    </span>
                  </td>
                  <td>{item.targetId || "—"}</td>
                  <td>{item.details}</td>
                  <td>{item.timestamp}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No records found matching your criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
          <button className="pageBtn" onClick={goToPrevPage} disabled={currentPage === 1}>‹</button>
          <div className="currentPageInputWrapper">
            <input 
                type="number" 
                value={currentPage} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val <= totalPages) setCurrentPage(val);
                }} 
                className="currentPageInput" 
            />
          </div>
          <div className="paginationInfo">
            <div>out of <span>{totalPages}</span></div>
          </div>
          <button className="pageBtn" onClick={goToNextPage} disabled={currentPage === totalPages}>›</button>
          <button className="pageBtn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      </div>
    </div>
  );
}

export default AHistory;
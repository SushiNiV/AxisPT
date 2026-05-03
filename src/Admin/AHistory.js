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

        if (data.success) {
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

  const filters = [
    { label: "Role", options: ["DEVELOPER", "ADMIN"] },
    { label: "Action", options: ["LOGIN", "BULK_ACCEPT", "BULK_REJECT", "PASSWORD_CHANGE"] }
  ];

  const filteredHistory = historyData.filter((item) => {
    const matchesSearch = 
      item.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = Object.keys(filterValues).every(key => {
      const selectedValues = filterValues[key];
      if (!selectedValues || selectedValues.length === 0) return true;
      if (key === "Role") return selectedValues.includes(item.userRole);
      if (key === "Action") return selectedValues.includes(item.action);
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

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

  const getSortedDisplay = (label, options) => {
    const currentSelection = filterValues[label] || [];
    const sortedSelection = options.filter(opt => currentSelection.includes(opt));
    if (sortedSelection.length > 0) return sortedSelection.join(", ");
    return `ALL ${label}S`;
  };

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= totalPages) setCurrentPage(value);
  };

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
    <div className="amasterlistContainer">
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
          {searchTerm && <BiX className="clearSearchIcon" onClick={() => {setSearchTerm(""); setCurrentPage(1);}} style={{cursor: 'pointer'}}/>}
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
                <div className="filterGroup" key={index}>
                  <label className="sectionLabel">{f.label}</label>
                  <div 
                    className={`customSelectTrigger ${activeGroup === index ? 'focused' : ''}`}
                    onClick={() => setActiveGroup(activeGroup === index ? null : index)}
                  >
                    <div className="selectedTextDisplay">{getSortedDisplay(f.label, f.options)}</div>
                    <BiChevronDown className={`arrowIcon ${activeGroup === index ? 'rotate' : ''}`} />
                    {activeGroup === index && (
                      <div className="checkboxListContainer" onClick={(e) => e.stopPropagation()}>
                        {f.options.map((opt, i) => (
                          <label key={i} className="checkboxItem">
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
                <button className="applyFilterBtn" onClick={() => setIsFilterOpen(false)}>Apply Filters</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tableContainer">
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
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading data...</td></tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{item.userId}</td>
                  <td>{item.userRole}</td>
                  <td><span className={`statusTag ${item.action.toLowerCase()}`}>{item.action}</span></td>
                  <td>{item.targetId}</td>
                  <td>{item.details}</td>
                  <td>{item.timestamp}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>No history found.</td></tr>
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
          <div className="paginationInfo">
            <div>out of <span>{totalPages || 1}</span></div>
          </div>
          <button className="pageBtn next" onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0}>›</button>
          <button className="pageBtn last" onClick={goToLastPage} disabled={currentPage === totalPages || totalPages === 0}>»</button>
        </div>
      </div>
    </div>
  );
}

export default AHistory;
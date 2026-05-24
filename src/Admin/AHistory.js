import React, { useState, useEffect } from 'react';
import { BiSearch, BiX } from 'react-icons/bi';
import Filter from '../Components/Filter';
import './../GlobalHistory.css';
import './../Global.css';
import './../GlobalEmpty.css';

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
  const [tempDesignation, setTempDesignation] = useState("");
  const [tempAction, setTempAction] = useState("");
  
  const [designationOptions, setDesignationOptions] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);

  const hasActiveFilters = selectedDesignation !== "" || selectedAction !== "";

  useEffect(() => {
    if (isFilterOpen) {
      setTempDesignation(selectedDesignation);
      setTempAction(selectedAction);
    }
  }, [isFilterOpen, selectedDesignation, selectedAction]);

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

  const filters = [
    { 
      name: "designation", 
      label: "DESIGNATION", 
      value: tempDesignation,
      options: designationOptions,
      placeholder: "ALL DESIGNATIONS"
    },
    { 
      name: "action", 
      label: "ACTION", 
      value: tempAction,
      options: actionOptions,
      placeholder: "ALL ACTIONS"
    }
  ];

  const handleFilterChange = (name, value) => {
    if (name === "designation") {
      setTempDesignation(value);
    } else if (name === "action") {
      setTempAction(value);
    }
  };

  const resetFilters = () => {
    setTempDesignation("");
    setTempAction("");
    setSelectedDesignation("");
    setSelectedAction("");
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setSelectedDesignation(tempDesignation);
    setSelectedAction(tempAction);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

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

  const goToNextPage = () => { 
    if (currentPage < totalPages) setCurrentPage(p => p + 1); 
  };
  
  const goToPrevPage = () => { 
    if (currentPage > 1) setCurrentPage(p => p - 1); 
  };

  const hasNoData = filteredHistory.length === 0;

  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⏳</div>
          <h3 className="emptyStateTitle">Loading History</h3>
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
          <h3 className="emptyStateTitle">Error Loading History</h3>
          <p className="emptyStateText">{error}</p>
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
        
        <Filter
          isOpen={isFilterOpen}
          setIsOpen={setIsFilterOpen}
          hasActiveFilters={hasActiveFilters}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          onApply={applyFilters}
        />
      </div>

      {hasNoData ? (
        searchTerm ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No history records found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={clearSearch}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📜</div>
            <h3 className="emptyStateTitle">No History Records</h3>
            <p className="emptyStateText">No history records available.</p>
          </div>
        )
      ) : (
        <>
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
                {currentItems.map((item, index) => (
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

export default AHistory;
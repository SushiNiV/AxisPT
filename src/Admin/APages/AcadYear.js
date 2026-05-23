import React, { useState, useEffect, useCallback } from 'react';
import AddYear from './../AComponents/AddYear';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiCalendar, BiTimeFive, BiX, BiCalendarX } from 'react-icons/bi';

import '../../Global.css';
import '../../GlobalEmpty.css';

function AAcadYear() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const rowsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAcademicYears(data.data);
          setTotalPages(Math.ceil(data.data.length / rowsPerPage) || 1);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = () => {
    setShowAdd(false);
    fetchData();
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const filteredYears = academicYears.filter(year =>
    year.year_label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedYears = filteredYears.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredYears.length / rowsPerPage) || 1);
    setCurrentPage(1);
  }, [searchTerm, academicYears, rowsPerPage]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const hasNoData = !loading && filteredYears.length === 0;
  const hasSearchResults = searchTerm && filteredYears.length === 0 && academicYears.length > 0;

  return (
    <div className="InnerContainer">
      {showAdd && (
        <AddYear
          onClose={() => setShowAdd(false)} 
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search academic year..."
            className="SearchInput"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <BiX className="ClearSearchIcon" onClick={() => { setSearchTerm(""); setCurrentPage(1); }} />
          )}
        </div>

        <div className="TopbarBtnContainer">
          <button className="TopbarBtn" onClick={() => setShowAdd(true)}>
            <BiPlusCircle className="linkIcon" /> Academic Year
          </button>
        </div>
      </div>

      <div className="CardsContainer">
        {loading ? (
          <div className="emptyState">
            <div className="emptyStateIcon">⏳</div>
            <h3 className="emptyStateTitle">Loading Academic Years</h3>
            <p className="emptyStateText">Please wait while we fetch the data...</p>
          </div>
        ) : paginatedYears.length > 0 ? (
          paginatedYears.map((year) => (
            <div className="Card" key={year.year_id}>
              <div className="cardCheckbox">
                <input type="checkbox" />
              </div>
              <div className={`cardIcon ${year.is_active ? 'active' : 'inactive'}`}>
                <BiCalendar />
              </div>
              <div className="cardContent">
                <div className="cardHeader">
                  <span className={`statusBadge ${year.is_active ? 'active-bg' : 'inactive-bg'}`}>
                    {year.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="cardTimestamp">
                    <BiTimeFive style={{marginRight: '4px'}}/>
                    {formatTimestamp(year.created_at)}
                  </span>
                </div>
                <h3 className="cardTitle">Academic Year {year.year_label}</h3>
              </div>
              <div className="CardAction">
                <button className="actionBtn editBtn">Edit</button>
                <button className="actionBtn deleteBtn">Delete</button>
              </div>
            </div>
          ))
        ) : hasSearchResults ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No academic years found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm("")}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📅</div>
            <h3 className="emptyStateTitle">No Academic Years Yet</h3>
            <p className="emptyStateText">Get started by creating your first academic year.</p>
            <button className="emptyStateBtn" onClick={() => setShowAdd(true)}>
              <BiPlusCircle className="linkIcon"/> Create Year
            </button>
          </div>
        )}
      </div>

      {!loading && paginatedYears.length > 0 && (
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
    </div>
  );
}

export default AAcadYear;
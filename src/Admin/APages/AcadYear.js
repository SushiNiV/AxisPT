import React, { useState, useEffect, useCallback } from 'react';
import AddYear from './../AComponents/AddYear';
import { BiSearch, BiPlusCircle, BiCalendar, BiX, BiPencil, BiTrash } from 'react-icons/bi';

import '../../Global.css';
import '../../GlobalCard.css';
import '../../GlobalEmpty.css';

function AAcadYear() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingYear, setEditingYear] = useState(null);

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
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = () => {
    setShowAdd(false);
    setEditingYear(null);
    fetchData();
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setShowAdd(true);
  };

  const handleDelete = async (yearId, yearLabel) => {
    if (window.confirm(`Are you sure you want to delete Academic Year ${yearLabel}?`)) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years/${yearId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          fetchData();
        } else {
          alert(data.message || "Failed to delete academic year.");
        }
      } catch (error) {
        console.error("Error deleting academic year:", error);
        alert("An error occurred.");
      }
    }
  };

  const handleSetActive = async (yearId) => {
    if (window.confirm("Activating this academic year will deactivate the current active year. Continue?")) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years/${yearId}/activate`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          fetchData();
        } else {
          alert(data.message || "Failed to activate academic year.");
        }
      } catch (error) {
        console.error("Error activating academic year:", error);
        alert("An error occurred.");
      }
    }
  };

  const handleSetSemester = async (yearId, semesterId, semesterName) => {
    if (window.confirm(`Set ${semesterName} as the current semester for this academic year?`)) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years/${yearId}/semester`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ current_sem: semesterId })
        });
        const data = await response.json();
        if (data.success) {
          fetchData();
        } else {
          alert(data.message || "Failed to set semester.");
        }
      } catch (error) {
        console.error("Error setting semester:", error);
        alert("An error occurred.");
      }
    }
  };

  const getAcademicYearStatus = (yearLabel, isActive) => {
    if (isActive) return 'current';
    
    const currentYear = new Date().getFullYear();
    const startYear = parseInt(yearLabel.split('-')[0]);
    
    if (startYear > currentYear) {
      return 'future';
    } else {
      return 'past';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'current': return 'Active';
      case 'future': return 'Inactive';
      case 'past': return 'Inactive';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'current': return 'active-bg';
      case 'future': return 'inactive-bg';
      case 'past': return 'inactive-bg';
      default: return '';
    }
  };

  const getTermStatusLabel = (status) => {
    switch(status) {
      case 'current': return 'Current Term';
      case 'future': return 'Future Term';
      case 'past': return 'Past Term';
      default: return '';
    }
  };

  const filteredYears = academicYears.filter(year =>
    year.year_label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSearchResults = searchTerm && filteredYears.length === 0 && academicYears.length > 0;

  const semesters = [
    { id: 1, name: '1st Semester' },
    { id: 2, name: '2nd Semester' },
    { id: 3, name: 'Summer Term' }
  ];

  return (
    <div className="InnerContainer">
      {showAdd && (
        <AddYear
          onClose={() => {
            setShowAdd(false);
            setEditingYear(null);
          }}
          onSuccess={handleAddSuccess}
          yearToEdit={editingYear}
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
            onChange={(e) => { setSearchTerm(e.target.value); }}
          />
          {searchTerm && (
            <BiX className="ClearSearchIcon" onClick={() => { setSearchTerm(""); }} />
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
        ) : filteredYears.length > 0 ? (
          filteredYears.map((year) => {
            const status = getAcademicYearStatus(year.year_label, year.is_active);
            const statusLabel = getStatusLabel(status);
            const statusClass = getStatusClass(status);
            const termStatusLabel = getTermStatusLabel(status);
            
            return (
              <div className="Card" key={year.year_id}>
                <div className="CardMain">
                  <div className={`cardIcon ${status === 'current' ? 'active' : 'inactive'}`}>
                    <BiCalendar />
                  </div>
                  <div className="cardContent">
                    <div className="cardHeader">
                      <span className={`statusBadge ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h3 className="cardTitle">Academic Year {year.year_label}</h3>
                    <div className="CardDetails">
                      <span className={`detailBadge ${status === 'current' ? 'current-bg' : status === 'future' ? 'future-bg' : 'past-bg'}`}>
                        {termStatusLabel}
                      </span>
                      {status === 'current' && semesters.map((sem) => (
                        <button
                          key={sem.id}
                          className={`detailBadge ${year.current_sem === sem.id ? 'active-semester' : 'inactive-semester'}`}
                          onClick={() => handleSetSemester(year.year_id, sem.id, sem.name)}
                        >
                          {sem.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="CardAction">
                    {status !== 'current' && status !== 'past' && (
                      <button className="actionBtn activateBtn" onClick={() => handleSetActive(year.year_id)}>
                        Set Active
                      </button>
                    )}
                    <button className="actionBtn editBtn" onClick={() => handleEdit(year)}>
                      <BiPencil /> Edit
                    </button>
                    <button className="actionBtn deleteBtn" onClick={() => handleDelete(year.year_id, year.year_label)}>
                      <BiTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
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

      <div className="BottomBuffer"></div>
    </div>
  );
}

export default AAcadYear;
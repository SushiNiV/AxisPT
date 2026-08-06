import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiX, BiTrash, BiExport } from 'react-icons/bi';
import '../../GlobalHistory.css';
import '../../Global.css';
import '../../GlobalEmpty.css';
// Ensure to create or adjust this modal component path as needed
import AddStudent from '../AComponents/AddStudent';

function Masterlist() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Student Filter States
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const filterRef = useRef(null);

  // Dynamic Options derived from data
  const [programOptions, setProgramOptions] = useState([]);
  const [yearLevelOptions, setYearLevelOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [statusOptions] = useState(["Active", "Inactive"]);

  const hasActiveFilters = 
    selectedProgram !== "" || 
    selectedYearLevel !== "" || 
    selectedSection !== "" || 
    selectedStatus !== "";

  // Handle outside click for filter menu dropdown
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

  // Fetch Student Masterlist
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setStudents(data.data);

        // Extract unique options dynamically for filter dropdowns
        const uniquePrograms = [...new Set(data.data.map(s => s.program_abbr || s.program_name).filter(Boolean))];
        const uniqueYears = [...new Set(data.data.map(s => s.year_level).filter(Boolean))].sort();
        const uniqueSections = [...new Set(data.data.map(s => s.section_name).filter(Boolean))].sort();

        setProgramOptions(uniquePrograms);
        setYearLevelOptions(uniqueYears);
        setSectionOptions(uniqueSections);
      } else {
        setError(data.message || "Failed to fetch student masterlist.");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddSuccess = () => {
    setShowAddStudent(false);
    setEditingStudent(null);
    fetchStudents();
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setShowAddStudent(true);
  };

  const handleDelete = async (studentId, studentNo) => {
    if (window.confirm(`Are you sure you want to delete student "${studentNo}"?`)) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/students/${studentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          fetchStudents();
        } else {
          alert(data.message || "Failed to delete student record.");
        }
      } catch (error) {
        console.error("Error deleting student:", error);
        alert("An error occurred while attempting to delete.");
      }
    }
  };

  // Filter & Search Logic
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program_abbr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.section_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram = !selectedProgram || (student.program_abbr === selectedProgram || student.program_name === selectedProgram);
    const matchesYear = !selectedYearLevel || String(student.year_level) === String(selectedYearLevel);
    const matchesSection = !selectedSection || student.section_name === selectedSection;
    const matchesStatus = !selectedStatus || (selectedStatus === "Active" ? student.is_active : !student.is_active);

    return matchesSearch && matchesProgram && matchesYear && matchesSection && matchesStatus;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedProgram("");
    setSelectedYearLevel("");
    setSelectedSection("");
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
          <h3 className="emptyStateTitle">Loading Masterlist</h3>
          <p className="emptyStateText">Please wait while we fetch student records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⚠️</div>
          <h3 className="emptyStateTitle">Error Loading Masterlist</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoData = filteredStudents.length === 0;

  return (
    <div className="InnerContainer">
      {showAddStudent && (
        <AddStudent
          onClose={() => {
            setShowAddStudent(false);
            setEditingStudent(null);
          }}
          onSuccess={handleAddSuccess}
          studentToEdit={editingStudent}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input 
            type="text" 
            placeholder="Search student no., name, email..." 
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
                <label>PROGRAM</label>
                <select 
                  value={selectedProgram} 
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL PROGRAMS</option>
                  {programOptions.map(prog => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>

              <div className="FilterGroup">
                <label>YEAR LEVEL</label>
                <select 
                  value={selectedYearLevel} 
                  onChange={(e) => {
                    setSelectedYearLevel(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL YEARS</option>
                  {yearLevelOptions.map(yr => (
                    <option key={yr} value={yr}>Year {yr}</option>
                  ))}
                </select>
              </div>

              <div className="FilterGroup">
                <label>SECTION</label>
                <select 
                  value={selectedSection} 
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL SECTIONS</option>
                  {sectionOptions.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
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
          <button className="TopbarBtn" onClick={() => setShowAddStudent(true)}>
            <BiPlusCircle className="linkIcon" />
            Student
          </button>
        </div>
      </div>

      {hasNoData ? (
        searchTerm ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No students found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={clearSearch}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">🎓</div>
            <h3 className="emptyStateTitle">No Students Found</h3>
            <p className="emptyStateText">Get started by enrolling or adding your first student.</p>
            <button className="emptyStateBtn" onClick={() => setShowAddStudent(true)}>
              <BiPlusCircle className="linkIcon"/> Add Student
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
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Program</th>
                  <th>Year Level</th>
                  <th>Section</th>
                  <th>School Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((student) => (
                  <tr key={student.student_id}>
                    <td><input type="checkbox" /></td>
                    <td>{student.student_number || '—'}</td>
                    <td>{student.last_name}, {student.first_name} {student.middle_name ? `${student.middle_name[0]}.` : ''}</td>
                    <td>{student.program_abbr || student.program_name || '—'}</td>
                    <td>{student.year_level ? `Year ${student.year_level}` : '—'}</td>
                    <td>{student.section_name || '—'}</td>
                    <td>{student.email || '—'}</td>
                    <td>
                      <span className={`statusBadge ${student.is_active ? 'active-bg' : 'inactive-bg'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="tableActions">
                      <button className="tableEditBtn" onClick={() => handleEdit(student)}>Edit</button>
                      <button className="tableDeleteBtn" onClick={() => handleDelete(student.student_id, student.student_number)}>Delete</button>
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

export default Masterlist;
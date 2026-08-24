import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiPlusCircle, BiX, BiPencil, BiTrash, BiListCheck } from 'react-icons/bi';
import Filter from '../../Components/Filter';
import '../../GlobalHistory.css';
import '../../Global.css';
import '../../GlobalEmpty.css';
import AddStudent from '../AComponents/AddStudent';
import AddGrade from '../AComponents/AddGrade';

function Masterlist() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(30);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Overlay & Editing states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Grade Modal state
  const [viewingGradesFor, setViewingGradesFor] = useState(null);

  // Filter States
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [tempProgram, setTempProgram] = useState("");
  const [tempYearLevel, setTempYearLevel] = useState("");
  const [tempStatus, setTempStatus] = useState("");

  const [programOptions, setProgramOptions] = useState([]);
  const [yearLevelOptions] = useState(["1st Year", "2nd Year", "3rd Year", "4th Year"]);
  const [statusOptions] = useState(["Regular", "Warning", "Probationary 1", "Probationary 2"]);

  const hasActiveFilters = selectedProgram !== "" || selectedYearLevel !== "" || selectedStatus !== "";

  // Sync temp filter state when opening filter popup
  useEffect(() => {
    if (isFilterOpen) {
      setTempProgram(selectedProgram);
      setTempYearLevel(selectedYearLevel);
      setTempStatus(selectedStatus);
    }
  }, [isFilterOpen, selectedProgram, selectedYearLevel, selectedStatus]);

  // Fetch Programs for Filter
  const fetchPrograms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const programs = data.data.map(p => p.program_name);
        setProgramOptions(programs);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  }, []);

  // Fetch Students Data
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
      } else {
        setError(data.message || "Failed to fetch student masterlist");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetchStudents();
  }, [fetchPrograms, fetchStudents]);

  // Filter Configuration
  const filters = [
    { 
      name: "program", 
      label: "PROGRAM", 
      value: tempProgram,
      options: programOptions,
      placeholder: "ALL PROGRAMS"
    },
    { 
      name: "yearLevel", 
      label: "YEAR LEVEL", 
      value: tempYearLevel,
      options: yearLevelOptions,
      placeholder: "ALL YEARS"
    },
    { 
      name: "status", 
      label: "ACADEMIC STANDING", 
      value: tempStatus,
      options: statusOptions,
      placeholder: "ALL STANDINGS"
    }
  ];

  const handleFilterChange = (name, value) => {
    if (name === "program") setTempProgram(value);
    else if (name === "yearLevel") setTempYearLevel(value);
    else if (name === "status") setTempStatus(value);
  };

  const resetFilters = () => {
    setTempProgram("");
    setTempYearLevel("");
    setTempStatus("");
    setSelectedProgram("");
    setSelectedYearLevel("");
    setSelectedStatus("");
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setSelectedProgram(tempProgram);
    setSelectedYearLevel(tempYearLevel);
    setSelectedStatus(tempStatus);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  // Search & Filter Logic
  const filteredStudents = students.filter((std) => {
    const fullName = `${std.first_name} ${std.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      std.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.personal_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram = !selectedProgram || std.program_name === selectedProgram;
    const matchesYearLevel = !selectedYearLevel || std.year_level?.toString() === selectedYearLevel.charAt(0);
    const matchesStatus = !selectedStatus || std.academic_status === selectedStatus;

    return matchesSearch && matchesProgram && matchesYearLevel && matchesStatus;
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

  const goToNextPage = () => { 
    if (currentPage < totalPages) setCurrentPage(p => p + 1); 
  };
  
  const goToPrevPage = () => { 
    if (currentPage > 1) setCurrentPage(p => p - 1); 
  };

  const handleAddSuccess = () => {
    setShowAddStudent(false);
    setEditingStudent(null);
    fetchStudents();
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setShowAddStudent(true);
  };

  const handleViewGrades = (student) => {
    setViewingGradesFor(student);
  };

  // Academic standing badge styling. Regular/Probationary 2 reuse the
  // existing green/red badge classes; Warning and Probationary 1 sit in
  // between and use inline colors since no global class exists for them yet.
  const getStandingBadgeProps = (status) => {
    switch (status) {
      case "Regular":
        return { className: "statusBadge active-bg" };
      case "Warning":
        return { className: "statusBadge", style: { backgroundColor: "#fff3cd", color: "#8a6512" } };
      case "Probationary 1":
        return { className: "statusBadge", style: { backgroundColor: "#ffe0b2", color: "#e65100" } };
      case "Probationary 2":
        return { className: "statusBadge inactive-bg" };
      default:
        return { className: "statusBadge" };
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm("Are you sure you want to delete this student record?")) {
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
          alert(data.message || "Failed to delete student.");
        }
      } catch (err) {
        console.error("Error deleting student:", err);
        alert("An error occurred.");
      }
    }
  };

  // Loading State UI
  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⏳</div>
          <h3 className="emptyStateTitle">Loading Masterlist</h3>
          <p className="emptyStateText">Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  // Error State UI
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
          isOpen={showAddStudent}
          onClose={() => {
            setShowAddStudent(false);
            setEditingStudent(null);
          }}
          onSuccess={handleAddSuccess}
          initialData={editingStudent}
          isEditMode={!!editingStudent}
        />
      )}

      {viewingGradesFor && (
        <AddGrade
          student={viewingGradesFor}
          onClose={() => setViewingGradesFor(null)}
          onSuccess={() => setViewingGradesFor(null)}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input 
            type="text" 
            placeholder="Search student number, name, or email..." 
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

        <div className="TopbarBtnContainer">
          <button className="TopbarBtn" onClick={() => { setEditingStudent(null); setShowAddStudent(true); }}>
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
            <h3 className="emptyStateTitle">No Students Yet</h3>
            <p className="emptyStateText">Get started by creating your first student record.</p>
            <button className="emptyStateBtn" onClick={() => { setEditingStudent(null); setShowAddStudent(true); }}>
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
                  <th>Student No.</th>
                  <th>Full Name</th>
                  <th>Program</th>
                  <th>Year Level</th>
                  <th>Section</th>
                  <th>Email</th>
                  <th>Standing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((std) => (
                  <tr key={std.student_id}>
                    <td><input type="checkbox" /></td>
                    <td>{std.student_number}</td>
                    <td>{`${std.last_name}, ${std.first_name}`}</td>
                    <td>{std.program_abbr || std.program_name || '-'}</td>
                    <td>{std.year_level ? `${std.year_level}` : '-'}</td>
                    <td>{std.section_name || '-'}</td>
                    <td>{std.personal_email}</td>
                    <td>
                      <span {...getStandingBadgeProps(std.academic_status)}>
                        {std.academic_status || 'Regular'}
                      </span>
                    </td>
                    <td className="tableActions">
                      <button className="tableEditBtn" onClick={() => handleViewGrades(std)}>
                        <BiListCheck /> Grades
                      </button>
                      <button className="tableEditBtn" onClick={() => handleEdit(std)}>
                        <BiPencil /> Edit
                      </button>
                      <button className="tableDeleteBtn" onClick={() => handleDelete(std.student_id)}>
                        <BiTrash /> Delete
                      </button>
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
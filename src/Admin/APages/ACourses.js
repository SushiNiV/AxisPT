import React, { useState, useRef, useEffect } from 'react';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiX, BiTrash, BiExport } from 'react-icons/bi';
import '../../GlobalHistory.css';
import '../../Global.css';
import AddCourse from '../AComponents/AddCourse';

function ACourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  
  const filterRef = useRef(null);
  
  const [programOptions, setProgramOptions] = useState(["BSIT", "BSCS", "BSIS"]);
  const [yearLevelOptions] = useState(["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]);
  const [semesterOptions] = useState(["1st Semester", "2nd Semester", "Summer"]);

  const hasActiveFilters = selectedProgram !== "" || selectedYearLevel !== "" || selectedSemester !== "";

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

  // Mock data for testing
  const mockCourses = [
    {
      course_id: 1,
      course_code: "CC101",
      course_name: "Introduction to Computing",
      program_name: "BSIT",
      year_level: 1,
      semester_label: "1st Semester",
      lec_units: 3,
      lab_units: 0,
      total_units: 3,
      prerequisites: "None"
    },
    {
      course_id: 2,
      course_code: "PROG101",
      course_name: "Programming Fundamentals",
      program_name: "BSIT",
      year_level: 1,
      semester_label: "2nd Semester",
      lec_units: 2,
      lab_units: 1,
      total_units: 3,
      prerequisites: "CC101"
    },
    {
      course_id: 3,
      course_code: "MATH101",
      course_name: "Discrete Mathematics",
      program_name: "BSCS",
      year_level: 1,
      semester_label: "1st Semester",
      lec_units: 3,
      lab_units: 0,
      total_units: 3,
      prerequisites: "None"
    },
    {
      course_id: 4,
      course_code: "DB101",
      course_name: "Database Management System",
      program_name: "BSIT",
      year_level: 2,
      semester_label: "1st Semester",
      lec_units: 2,
      lab_units: 1,
      total_units: 3,
      prerequisites: "PROG101"
    },
    {
      course_id: 5,
      course_code: "NET101",
      course_name: "Networking Fundamentals",
      program_name: "BSIT",
      year_level: 2,
      semester_label: "2nd Semester",
      lec_units: 2,
      lab_units: 1,
      total_units: 3,
      prerequisites: "CC101"
    }
  ];

  useEffect(() => {
    setCourses(mockCourses);
    setLoading(false);
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram = !selectedProgram || course.program_name === selectedProgram;
    const matchesYearLevel = !selectedYearLevel || course.year_level?.toString() === selectedYearLevel.charAt(0);
    const matchesSemester = !selectedSemester || course.semester_label === selectedSemester;

    return matchesSearch && matchesProgram && matchesYearLevel && matchesSemester;
  });

  const totalPages = Math.ceil(filteredCourses.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

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
    setSelectedSemester("");
    setCurrentPage(1);
  };

  const goToNextPage = () => { 
    if (currentPage < totalPages) setCurrentPage(p => p + 1); 
  };
  
  const goToPrevPage = () => { 
    if (currentPage > 1) setCurrentPage(p => p - 1); 
  };

  const handleAddSuccess = () => {
    setShowAddCourse(false);
  };

  if (loading) {
    return (
      <div className="InnerContainer">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          Loading courses...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="InnerContainer">
        <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="InnerContainer">
      {showAddCourse && (
        <AddCourse
          onClose={() => setShowAddCourse(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input 
            type="text" 
            placeholder="Search course code or name..." 
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
                  {programOptions.map(program => (
                    <option key={program} value={program}>{program}</option>
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
                  {yearLevelOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="FilterGroup">
                <label>SEMESTER</label>
                <select 
                  value={selectedSemester} 
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">ALL SEMESTERS</option>
                  {semesterOptions.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
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
          <button className="TopbarBtn" onClick={() => setShowAddCourse(true)}>
            <BiPlusCircle className="linkIcon" />
            Course
          </button>
        </div>
      </div>

      <div className="TableContainer">
        <table className="Table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" />
              </th>
              <th>Code</th>
              <th>Course Name</th>
              <th>Program</th>
              <th>Year & Semester</th>
              <th>Units</th>
              <th>Prerequisites</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((course) => (
                <tr key={course.course_id}>
                  <td><input type="checkbox" /></td>
                  <td>{course.course_code}</td>
                  <td>{course.course_name}</td>
                  <td>{course.program_name}</td>
                  <td>{`${course.year_level} Year - ${course.semester_label}`}</td>
                  <td>{course.total_units}</td>
                  <td>{course.prerequisites}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>
                  No courses found matching your criteria.
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

export default ACourses;
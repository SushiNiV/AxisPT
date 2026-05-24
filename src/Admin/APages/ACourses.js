import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiPlusCircle, BiX } from 'react-icons/bi';
import Filter from '../../Components/Filter';
import '../../GlobalHistory.css';
import '../../Global.css';
import '../../GlobalEmpty.css';
import AddCourse from '../AComponents/AddCourse';

function ACourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [tempProgram, setTempProgram] = useState("");
  const [tempYearLevel, setTempYearLevel] = useState("");
  const [tempSemester, setTempSemester] = useState("");
  
  const [programOptions, setProgramOptions] = useState([]);
  const [yearLevelOptions] = useState(["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]);
  const [semesterOptions] = useState(["1st Semester", "2nd Semester", "Summer"]);

  const hasActiveFilters = selectedProgram !== "" || selectedYearLevel !== "" || selectedSemester !== "";

  useEffect(() => {
    if (isFilterOpen) {
      setTempProgram(selectedProgram);
      setTempYearLevel(selectedYearLevel);
      setTempSemester(selectedSemester);
    }
  }, [isFilterOpen, selectedProgram, selectedYearLevel, selectedSemester]);

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

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      } else {
        setError(data.message || "Failed to fetch courses");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetchCourses();
  }, [fetchPrograms, fetchCourses]);

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
      name: "semester", 
      label: "SEMESTER", 
      value: tempSemester,
      options: semesterOptions,
      placeholder: "ALL SEMESTERS"
    }
  ];

  const handleFilterChange = (name, value) => {
    if (name === "program") setTempProgram(value);
    else if (name === "yearLevel") setTempYearLevel(value);
    else if (name === "semester") setTempSemester(value);
  };

  const resetFilters = () => {
    setTempProgram("");
    setTempYearLevel("");
    setTempSemester("");
    setSelectedProgram("");
    setSelectedYearLevel("");
    setSelectedSemester("");
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setSelectedProgram(tempProgram);
    setSelectedYearLevel(tempYearLevel);
    setSelectedSemester(tempSemester);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

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

  const goToNextPage = () => { 
    if (currentPage < totalPages) setCurrentPage(p => p + 1); 
  };
  
  const goToPrevPage = () => { 
    if (currentPage > 1) setCurrentPage(p => p - 1); 
  };

  const handleAddSuccess = () => {
    setShowAddCourse(false);
    fetchCourses();
  };

  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⏳</div>
          <h3 className="emptyStateTitle">Loading Courses</h3>
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
          <h3 className="emptyStateTitle">Error Loading Courses</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoData = filteredCourses.length === 0;

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
          <button className="TopbarBtn" onClick={() => setShowAddCourse(true)}>
            <BiPlusCircle className="linkIcon" />
            Course
          </button>
        </div>
      </div>

      {hasNoData ? (
        searchTerm ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No courses found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={clearSearch}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📚</div>
            <h3 className="emptyStateTitle">No Courses Yet</h3>
            <p className="emptyStateText">Get started by creating your first course.</p>
            <button className="emptyStateBtn" onClick={() => setShowAddCourse(true)}>
              <BiPlusCircle className="linkIcon"/> Create Course
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
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Program</th>
                  <th>Year & Semester</th>
                  <th>Units</th>
                  <th>Prerequisites</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((course) => (
                  <tr key={course.course_id}>
                    <td><input type="checkbox" /></td>
                    <td>{course.course_code}</td>
                    <td>{course.course_name}</td>
                    <td>{course.program_name}</td>
                    <td>{`${course.year_level} Year - ${course.semester_label}`}</td>
                    <td>{course.total_units || course.lec_units + course.lab_units}</td>
                    <td>{course.prerequisites || 'None'}</td>
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

export default ACourses;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ACourses.css';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiX, BiTrash, BiExport } from 'react-icons/bi';
import FilterComponent from '../../Components/FilterComponent';
import SelectionPanel from '../../Components/SelectionPanel';
import AddCourse from '../AComponents/AddCourse';

function ACourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCourses(data.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Filters
  const courseFilters = [
    { label: "Program", placeholder: "All Programs", options: ["BSCS", "BSIT"] },
    { label: "Year Level", placeholder: "All Year Levels", options: ["1st Year", "2nd Year", "3rd Year", "4th Year"] },
    { label: "Semester", placeholder: "All Semesters", options: ["1st Semester", "2nd Semester", "Summer"] },
  ];

  const handleFilterApply = (filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  // Filtering logic
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = Object.keys(activeFilters).every(key => {
      const selectedValues = activeFilters[key];
      if (!selectedValues || selectedValues.length === 0) return true;
      
      if (key === "Program") {
        return selectedValues.some(v => course.programs?.includes(v));
      }
      if (key === "Year Level") {
        return selectedValues.some(v => course.year_sem?.includes(v));
      }
      if (key === "Semester") {
        return selectedValues.some(v => course.year_sem?.includes(v));
      }
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / rowsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedCourses.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddSuccess = () => {
    setShowAddCourse(false);
    fetchCourses();
  };

  return (
    <div className="amasterlistContainer">
      {showAddCourse && (
        <AddCourse
          onClose={() => setShowAddCourse(false)} 
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search course name or code..." 
            className="studentSearchInput"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <BiX className="clearSearchIcon" onClick={() => { setSearchTerm(""); setCurrentPage(1); }} />
          )}
        </div>
        
        <FilterComponent 
          filters={courseFilters} 
          onApply={handleFilterApply} 
        />

        <div className="createBtnContainer">
          <button className="createBtn" onClick={() => setShowAddCourse(true)}>
            <BiPlusCircle className="linkIcon"/>
            Course
          </button>
        </div>
      </div>

      <div className="tableContainer">
        <table className="studentTable">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={paginatedCourses.length > 0 && selectedIds.length === paginatedCourses.length}
                />
              </th>
              <th>Code</th>
              <th>Course Name</th>
              <th>Program</th>
              <th>Year and Semester</th>
              <th>Total Units</th>
              <th>Prerequisites</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading courses...</td></tr>
            ) : paginatedCourses.length > 0 ? (
              paginatedCourses.map((course) => (
                <tr key={course.id} className={selectedIds.includes(course.id) ? 'selectedRow' : ''}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(course.id)} onChange={() => handleSelectRow(course.id)} />
                  </td>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.programs || 'N/A'}</td>
                  <td>{course.year_sem || 'N/A'}</td>
                  <td>{course.units}</td>
                  <td>{course.prereq || 'None'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>
                {searchTerm ? `No courses found matching "${searchTerm}"` : "No courses available"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn first" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
          <button className="pageBtn prev" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
          <div className="currentPageInputWrapper">
            <input 
              type="number" 
              value={currentPage} 
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }} 
              className="currentPageInput" 
              min="1"
              max={totalPages || 1}
            />
          </div>
          <div className="paginationInfo"><div>out of <span>{totalPages || 1}</span></div></div>
          <button className="pageBtn next" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
          <button className="pageBtn last" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      </div>

      {/* Selection Panel */}
      <SelectionPanel selectedCount={selectedIds.length} onClear={() => setSelectedIds([])}>
        <button onClick={() => console.log("Delete courses:", selectedIds)} className="deleteBtn">
          <BiTrash size={18} /> Delete
        </button>
      </SelectionPanel>
    </div>
  );
}

export default ACourses;
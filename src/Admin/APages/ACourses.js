import React, { useState, useRef, useEffect } from 'react';
import './ACourses.css';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiChevronDown } from 'react-icons/bi';

function ACourses() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const dropdownRef = useRef(null);

  const courses = [
    { id: 1, code: 'IT101', name: 'Introduction to Computing', program: 'BSIT', yearSem: '1st Year - 1st Sem', units: 3, prereq: 'None' },
    { id: 2, code: 'CS202', name: 'Data Structures and Algorithms', program: 'BSCS', yearSem: '2nd Year - 1st Sem', units: 3, prereq: 'CS101' },
  ];

  const filters = [
    { label: "Year Level", options: ["1ST YEAR", "2ND YEAR", "3RD YEAR", "4TH YEAR"], placeholder: "ALL YEAR LEVELS" },
    { label: "Status", options: ["VERIFIED", "PENDING", "REJECTED"], placeholder: "ALL STATUSES" }
  ];

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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = courses.map((c) => c.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleOption = (label, option) => {
    setFilterValues(prev => {
      const currentSelection = prev[label] || [];
      const newSelection = currentSelection.includes(option)
        ? currentSelection.filter(item => item !== option)
        : [...currentSelection, option];
      return { ...prev, [label]: newSelection };
    });
  };

  const getSortedDisplay = (label, options) => {
    const currentSelection = filterValues[label] || [];
    const sortedSelection = options.filter(opt => currentSelection.includes(opt));
    if (sortedSelection.length > 0) return sortedSelection.join(", ").toUpperCase();
    const placeholder = filters.find(f => f.label === label)?.placeholder;
    return (placeholder || `ALL ${label}S`).toUpperCase();
  };

  return (
    <div className="amasterlistContainer">
      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search course name or code..." 
            className="studentSearchInput"
          />
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
                    <div className="selectedTextDisplay">
                      {getSortedDisplay(f.label, f.options)}
                    </div>
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
                            <span>{opt.toUpperCase()}</span> 
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="filterBtnsContainer">
                <button className="resetFilterBtn" onClick={() => setFilterValues({})}>Reset</button>
                <button className="applyFilterBtn" onClick={() => setIsFilterOpen(false)}>Apply Filters</button>
              </div>
            </div>
          )}
        </div>

        <div className="createBtnContainer">
          <button className="createBtn">
            <BiPlusCircle className="linkIcon" />
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
                  checked={selectedIds.length === courses.length && courses.length > 0}
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
            {courses.map((course) => {
              const isSelected = selectedIds.includes(course.id);
              return (
                <tr key={course.id} className={isSelected ? 'selectedRow' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleSelectRow(course.id)}
                    />
                  </td>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.program}</td>
                  <td>{course.yearSem}</td>
                  <td>{course.units}</td>
                  <td>{course.prereq}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn first">«</button>
          <button className="pageBtn prev">‹</button>
          <div className="currentPageInputWrapper">
            <input type="number" defaultValue="1" className="currentPageInput" />
          </div>
          <div className="paginationInfo">
            <div>out of <span>50</span></div>
          </div>
          <button className="pageBtn next">›</button>
          <button className="pageBtn last">»</button>
        </div>
      </div>

      <div className="addCourseContainer">
        <div className="">

        </div>
      </div>

    </div>
  );
}

export default ACourses;
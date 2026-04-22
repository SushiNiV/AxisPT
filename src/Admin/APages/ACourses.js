import React, { useState } from 'react';
import './ACourses.css';
import { BiSearch, BiFilterAlt, BiPlusCircle } from 'react-icons/bi';

function ACourses() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const students = [
    { id: 'CSEL312', name: 'CS ELECTIVE 312', year: '3rd Year', block: 'BSPT 3-Y2-1', program: 'Computer Science', status: 'Enrolled' },
    { id: 'CSEL315', name: 'CS ELECTIVE 315', year: '2nd Year', block: 'BSPT 2-Y2-1', program: 'Business Administration', status: 'Pending' },
    { id: 'CSTH411', name: 'CS THESIS 1', year: '1st Year', block: 'BSPT 1-Y2-1', program: 'Engineering', status: 'Withdrawn' },
  ];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = students.map((s) => s.id); 
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) 
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
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
        <div className="filterContainer">
          <button 
            className={`filterToggleBtn ${isFilterOpen ? 'active' : ''}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <BiFilterAlt className="linkIcon" />
            Filter
          </button>

          {isFilterOpen && (
            <div className="filterDropdown">
              <div className="filterGroup">
                <label>Year Level</label>
                <select>
                  <option value="">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div className="filterGroup">
                <label>Status</label>
                <select>
                  <option value="">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <button className="applyFilterBtn">Apply Filters</button>
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
                  checked={students.length > 0 && selectedIds.length === students.length}
                />
              </th>
              <th>Code</th>
              <th>Course Name</th>
              <th>Program</th>
              <th>Year and Semester</th>
              <th>Total Units</th>
              <th>Prerequisites</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const isSelected = selectedIds.includes(student.id);

              return (
                <tr key={student.id} className={isSelected ? 'selected-row' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleSelectRow(student.id)}
                    />
                  </td>
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
    </div>
  );
}

export default ACourses;
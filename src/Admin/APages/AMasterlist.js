import React, { useState } from 'react';
import './AMasterlist.css';
import { BiSearch, BiFilterAlt, BiX } from 'react-icons/bi';

function AMasterlist() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const students = [
    { id: '01230001234', name: 'Dela Cruz, Juan P.', year: '3rd Year', block: 'BSPT 3-Y2-1', program: 'Computer Science', status: 'Enrolled' },
    { id: '01230001235', name: 'Santos, Maria L.', year: '2nd Year', block: 'BSPT 2-Y2-1', program: 'Business Administration', status: 'Pending' },
    { id: '01230001236', name: 'Reyes, Ricardo G.', year: '1st Year', block: 'BSPT 1-Y2-1', program: 'Engineering', status: 'Withdrawn' },
    { id: '01230001237', name: 'Luna, Antonio K.', year: '4th Year', block: 'BSPT 4-Y2-1', program: 'Physical Therapy', status: 'Enrolled' },
    { id: '01230001238', name: 'Dela Cruz, Juan P.', year: '3rd Year', block: 'BSPT 3-Y2-1', program: 'Computer Science', status: 'Enrolled' },
    { id: '01230001239', name: 'Santos, Maria L.', year: '2nd Year', block: 'BSPT 2-Y2-1', program: 'Business Administration', status: 'Pending' },
    { id: '01230001240', name: 'Reyes, Ricardo G.', year: '1st Year', block: 'BSPT 1-Y2-1', program: 'Engineering', status: 'Withdrawn' },
    { id: '01230001241', name: 'Luna, Antonio K.', year: '4th Year', block: 'BSPT 4-Y2-1', program: 'Physical Therapy', status: 'Enrolled' },
    { id: '01230001242', name: 'Dela Cruz, Juan P.', year: '3rd Year', block: 'BSPT 3-Y2-1', program: 'Computer Science', status: 'Enrolled' },
    { id: '01230001243', name: 'Santos, Maria L.', year: '2nd Year', block: 'BSPT 2-Y2-1', program: 'Business Administration', status: 'Pending' },
    { id: '01230001244', name: 'Reyes, Ricardo G.', year: '1st Year', block: 'BSPT 1-Y2-1', program: 'Engineering', status: 'Withdrawn' },
    { id: '01230001245', name: 'Luna, Antonio K.', year: '4th Year', block: 'BSPT 4-Y2-1', program: 'Physical Therapy', status: 'Enrolled' },

  ];

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const indexOfLastStudent = currentPage * rowsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - rowsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = currentStudents.map((s) => s.id); 
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Enrolled': return 'badge-green';
      case 'Pending': return 'badge-yellow';
      case 'Withdrawn': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="amasterlistContainer">
      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search student name or ID..." 
            className="studentSearchInput"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <BiX className="clearSearchIcon" onClick={clearSearch} style={{cursor: 'pointer', fontSize: '1.2rem'}} />
          )}
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
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div className="filterGroup">
                <label>Status</label>
                <select>
                  <option value="">All Status</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Pending">Pending</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>
              <button className="applyFilterBtn">Apply Filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="tableContainer">
        <table className="studentTable">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={currentStudents.length > 0 && selectedIds.length === currentStudents.length}
                />
              </th>
              <th>No.</th>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Year Level</th>
              <th>Section</th>
              <th>Program</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student, index) => {
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
                    <td>{indexOfFirstStudent + index + 1}</td>
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                    <td>{student.year}</td>
                    <td>{student.block}</td>
                    <td>{student.program}</td>
                    <td>
                      <span className={`statusBadge ${getStatusBadge(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '30px', color: '#666'}}>
                  No students found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn first" onClick={goToFirstPage} disabled={currentPage === 1}>«</button>
          <button className="pageBtn prev" onClick={goToPrevPage} disabled={currentPage === 1}>‹</button>
          
          <div className="currentPageInputWrapper">
            <input 
              type="number" 
              value={currentPage} 
              onChange={handlePageInput}
              className="currentPageInput" 
            />
          </div>

          <div className="paginationInfo">
            <div>out of <span>{totalPages || 1}</span></div>
          </div>

          <button className="pageBtn next" onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0}>›</button>
          <button className="pageBtn last" onClick={goToLastPage} disabled={currentPage === totalPages || totalPages === 0}>»</button>
        </div>
      </div>
    </div>
  );
}

export default AMasterlist;
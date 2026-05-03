import React, { useState, useEffect } from 'react';
import './AMasterlist.css';
import { BiSearch, BiX, BiTrash, BiExport, BiRefresh } from 'react-icons/bi';
import SelectionPanel from '../../Components/SelectionPanel';
import FilterComponent from '../../Components/FilterComponent';

function AMasterlist() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    fetchMasterlist();
  }, []);

  const fetchMasterlist = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/masterlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Error loading masterlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const masterlistFilters = [
    { label: "Status", placeholder: "All Statuses", options: ["Enrolled", "Pending", "Withdrawn"] },
    { label: "Year Level", options: ["1ST YEAR", "2ND YEAR", "3RD YEAR", "4TH YEAR"] },
    { label: "Program", options: ["PHYSICAL THERAPY", "RESPIRATORY THERAPY", "RADIOLOGIC TECHNOLOGY"] }
  ];

  const handleFilterApply = (filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDropdowns = Object.keys(activeFilters).every(key => {
      const selectedValues = activeFilters[key];
      
      if (!selectedValues || selectedValues.length === 0) return true;

      if (key === "Year Level") return selectedValues.includes(student.year);
      if (key === "Status") return selectedValues.includes(student.status);
      if (key === "Program") return selectedValues.includes(student.program);
      
      return true;
    });

    return matchesSearch && matchesDropdowns;
  });

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

        <FilterComponent 
          filters={masterlistFilters} 
          onApply={handleFilterApply} 
        />
      </div>

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
                <td colSpan="8" style={{textAlign: 'center', padding: '10px', color: '#666'}}>
                {searchTerm 
                  ? `No student found matching "${searchTerm}"` 
                  : "No students available"
                }
              </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
      <SelectionPanel 
        selectedCount={selectedIds.length} 
        onClear={() => setSelectedIds([])}
      >
        <button onClick={() => console.log("Changing Status...")}>
          <BiRefresh size={18} /> Change Status
        </button>
        
        <button onClick={() => console.log("Exporting...")}>
          <BiExport size={18} /> Export
        </button>
        
        <button className="deleteBtn" onClick={() => console.log("Deleting...")}>
          <BiTrash size={18} /> Delete
        </button>
      </SelectionPanel>
    </div>
  );
}

export default AMasterlist;
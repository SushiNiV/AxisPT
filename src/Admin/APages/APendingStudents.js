import React, { useState, useEffect } from 'react';
import './APendingStudents.css';
import { BiSearch, BiX, BiCheck, BiTrash, BiExport } from 'react-icons/bi';
import SelectionPanel from '../../Components/SelectionPanel';
import FilterComponent from '../../Components/FilterComponent';

function APendingStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const pendingFilters = [
  { label: "Year Level", options: ["1ST YEAR", "2ND YEAR", "3RD YEAR", "4TH YEAR"] },
  { label: "Program", options: ["PHYSICAL THERAPY", "RESPIRATORY THERAPY", "RADIOLOGIC TECHNOLOGY"] }
];

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const fetchPendingStudents = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/pending-students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = '/admin-signin';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = (filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

const filteredStudents = students.filter((s) => {

  const fullName = `${s.firstname} ${s.middlename} ${s.lastname}`.toLowerCase();
  const search = searchTerm.toLowerCase();
  const matchesSearch = fullName.includes(search) || s.student_id.toLowerCase().includes(search);

  const matchesDropdowns = Object.keys(activeFilters).every(key => {
    const selectedOptions = activeFilters[key]; 
    if (!selectedOptions || selectedOptions.length === 0) return true;
    const studentValue = (key === "Year Level") ? s.year_level : s.program;
    const hasMatch = selectedOptions.some(option => 
    option.trim().toUpperCase() === studentValue?.toString().trim().toUpperCase());

    return hasMatch;
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const visibleIds = currentStudents.map((s) => s.student_id);
      setSelectedIds(visibleIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
  if (!selectedIds.length) return;

  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/bulk-${action}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ ids: selectedIds }), 
    });

    if (response.ok) {
      setStudents(prev => prev.filter(s => !selectedIds.includes(s.student_id)));
      setSelectedIds([]); 
      alert(`Success! Status updated in database.`);
    } else {
      alert("Server found, but update failed.");
    }
  } catch (error) {
    console.error("Connection error:", error);
  }
};

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  return (
    <div className="apendingStudentsContainer">
      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search pending student..." 
            className="studentSearchInput"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && <BiX className="clearSearchIcon" onClick={clearSearch} style={{cursor: 'pointer'}}/>}
        </div>

        <FilterComponent 
          filters={pendingFilters} 
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Loading students...</td></tr>
            ) : currentStudents.length > 0 ? (
              currentStudents.map((student, index) => {
                const isSelected = selectedIds.includes(student.student_id);
                return (
                  <tr key={student.student_id} className={isSelected ? 'selected-row' : ''}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(student.student_id)}
                      />
                    </td>
                    <td>{indexOfFirstStudent + index + 1}</td>
                    <td>{student.student_id}</td>
                    <td>{`${student.firstname} ${student.middlename} ${student.lastname}`}</td>
                    <td>{student.year_level}</td>
                    <td>{student.section || 'N/A'}</td>
                    <td>{student.program}</td>
                  </tr>
                );
              })
            ) : (
            <tr>
              <td colSpan="8" style={{textAlign: 'center', padding: '10px', color: '#666'}}>
                {searchTerm 
                  ? `No pending registrations matching "${searchTerm}"` 
                  : "No pending registrations found."
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
              onChange={(e) => setCurrentPage(Number(e.target.value))} 
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
      <A></A>
      <SelectionPanel 
        selectedCount={selectedIds.length} 
        onClear={() => setSelectedIds([])}
      >
        <button  onClick={() => handleBulkAction('accept')}>
          <BiCheck size={18} /> Accept Selected
        </button>
        
        <button className="deleteBtn" onClick={() => handleBulkAction('reject')}>
          <BiTrash size={18} /> Reject Selected
        </button>
      </SelectionPanel>
    </div>
  );
}

export default APendingStudents;
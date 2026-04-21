import React, { useState, useEffect, useRef } from 'react';
import './APendingStudents.css';
import { BiSearch, BiFilterAlt } from 'react-icons/bi';

function APendingStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const indexOfLastStudent = currentPage * rowsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - rowsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / rowsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  const selectAllRef = useRef(null);

  useEffect(() => {
    const fetchPendingStudents = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/pending-students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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

    fetchPendingStudents();
  }, []);

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

  const handleAccept = async (studentId) => {
    if (!window.confirm(`Are you sure you want to accept student ${studentId}?`)) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/approve-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ student_id: studentId }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Student accepted successfully!");
        setStudents(prev => prev.filter(s => (s.id || s.student_id) !== studentId));
      } else {
        alert(data.message || "Failed to accept student.");
      }
    } catch (error) {
      console.error("Error accepting student:", error);
    }
  };

  return (
    <div className="apendingStudentsContainer">
      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search student name or ID..." 
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

              <button className="applyFilterBtn">Apply Filters</button>
            </div>
          )}
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
              <th>No.</th>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Year Level</th>
              <th>Section</th>
              <th>Program</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="8">Loading students...</td></tr>
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
                    <td>
                      <button className="acceptBtn" onClick={() => handleAccept(student.student_id)}>
                        Accept
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="8" style={{textAlign: 'center', padding: '10px'}}>No pending registrations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="paginationContainer">
        <div className="paginationControls">
          <button 
            className="pageBtn first" 
            onClick={goToFirstPage} 
            disabled={currentPage === 1}
          >«</button>
          <button 
            className="pageBtn prev" 
            onClick={goToPrevPage} 
            disabled={currentPage === 1}
          >‹</button>
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
          <button 
            className="pageBtn next" 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages || totalPages === 0}
          >›</button>
          <button 
            className="pageBtn last" 
            onClick={goToLastPage} 
            disabled={currentPage === totalPages || totalPages === 0}
          >»</button>
        </div>
      </div>
    </div>
  );
}

export default APendingStudents;
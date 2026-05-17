import React, { useState, useEffect } from 'react';
import './AMasterlist.css'; // Reusing your existing styles for consistency
import { BiSearch, BiX } from 'react-icons/bi';
import FilterComponent from '../../Components/FilterComponent';
import GradeModal from '../AComponents/GradeModal'; 

function AGrades() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10); // Standardized rows

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null); // Modal state

  useEffect(() => {
    fetchGradesList();
  }, []);

  const fetchGradesList = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/masterlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students || []); // Safety fallback to empty array
      }
    } catch (error) {
      console.error("Error loading grades list:", error);
      setStudents([]); // Ensure it's not undefined on error
    } finally {
      setLoading(false);
    }
  };

  const gradeFilters = [
    { label: "Year Level", options: ["1ST YEAR", "2ND YEAR", "3RD YEAR", "4TH YEAR"] },
    { label: "Program", options: ["PHYSICAL THERAPY", "RESPIRATORY THERAPY"] }
  ];

  const handleFilterApply = (filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  // Your existing filtering logic adapted
  const filteredStudents = (students || []).filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDropdowns = Object.keys(activeFilters).every(key => {
      const selectedValues = activeFilters[key];
      if (!selectedValues || selectedValues.length === 0) return true;
      if (key === "Year Level") return selectedValues.includes(student.year);
      if (key === "Program") return selectedValues.includes(student.program);
      return true;
    });

    return matchesSearch && matchesDropdowns;
  });

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const indexOfLastStudent = currentPage * rowsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - rowsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  return (
    <div className="amasterlistContainer">
      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search student to view grades..." 
            className="studentSearchInput"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <BiX className="clearSearchIcon" onClick={() => setSearchTerm("")} />}
        </div>

        <FilterComponent filters={gradeFilters} onApply={handleFilterApply} />
      </div>

      <div className="tableContainer">
        <table className="studentTable">
          <thead>
            <tr>
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
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading records...</td></tr>
            ) : currentStudents.length > 0 ? (
              currentStudents.map((student, index) => (
                <tr key={student.id} className="grade-row-hover">
                  <td>{indexOfFirstStudent + index + 1}</td>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.year}</td>
                  <td>{student.block}</td>
                  <td>{student.program}</td>
                  <td>
                    <button 
                      className="viewBtn" 
                      onClick={() => setSelectedStudent(student)}
                      style={{ padding: '5px 15px', cursor: 'pointer', backgroundColor: '#3d1616', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      View Grades
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (Simplified from your masterlist) */}
      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
          <span>Page {currentPage} of {totalPages || 1}</span>
          <button className="pageBtn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      </div>

      {/* The Dynamic Modal */}
      {selectedStudent && (
        <GradeModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
}

export default AGrades;
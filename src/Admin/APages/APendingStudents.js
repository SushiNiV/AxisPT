import React, { useState, useEffect } from 'react';
import './APendingStudents.css';
import { BiSearch, BiFilterAlt } from 'react-icons/bi';

function APendingStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
            {loading ? (
              <tr><td colSpan="7">Loading students...</td></tr>
            ) : students.length > 0 ? (
              students.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{index + 1}</td>
                  <td>{student.student_id}</td>
                  <td>{`${student.first_name} ${student.last_name}`}</td>
                  <td>{student.year_level}</td>
                  <td>{student.section || 'N/A'}</td>
                  <td>{student.program}</td>
                  <td>
                    <span className="status-pill pending">Pending</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7">No pending registrations found.</td></tr>
            )}
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

export default APendingStudents;
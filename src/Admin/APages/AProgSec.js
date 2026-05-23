import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiPlusCircle, BiX, BiTrash } from 'react-icons/bi';
import './AProgSec.css';
import '../../Global.css';
import AddProgram from '../AComponents/AddProgram';

function AProgSec() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const rowsPerPage = 10;

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
        setTotalPages(Math.ceil(data.data.length / rowsPerPage) || 1);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleAddSuccess = () => {
    setShowAdd(false);
    fetchPrograms();
  };

  const filteredPrograms = programs.filter(prog =>
    prog.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prog.program_abbr?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPrograms = filteredPrograms.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredPrograms.length / rowsPerPage) || 1);
    setCurrentPage(1);
  }, [searchTerm, programs]);

  return (
    <div className="InnerContainer">
      {showAdd && (
        <AddProgram
          onClose={() => setShowAdd(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search program name or abbreviation..."
            className="SearchInput"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <BiX className="ClearSearchIcon" onClick={() => { setSearchTerm(""); setCurrentPage(1); }} />
          )}
        </div>

        <div className="TopbarBtnContainer">
          <button className="TopbarBtn" onClick={() => setShowAdd(true)}>
            <BiPlusCircle className="linkIcon" /> Program
          </button>
        </div>
      </div>

      <div className="progsecTableContainer">
        <table className="progsecTable">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" />
              </th>
              <th>Program Name</th>
              <th>Abbreviation</th>
              <th>Total Years</th>
              <th>Sections</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="progsecEmpty">Loading programs...</td></tr>
            ) : paginatedPrograms.length > 0 ? (
              paginatedPrograms.map((prog) => (
                <tr key={prog.program_id}>
                  <td style={{ width: '40px' }}>
                    <input type="checkbox" />
                  </td>
                  <td>{prog.program_name}</td>
                  <td>{prog.program_abbr}</td>
                  <td>{prog.total_year}</td>
                  <td>0</td>
                  <td>
                    <span className={`statusBadge ${prog.program_status ? 'active' : 'inactive'}`}>
                      {prog.program_status ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="progsecEmpty">No programs found.</td></tr>
            )}
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
    </div>
  );
}

export default AProgSec;
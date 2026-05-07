import React, { useState, useEffect, useCallback } from 'react';
import './AProgSec.css';
import AddProgram from './../AComponents/AddProgram';
import { BiSearch, BiFilterAlt, BiPlusCircle } from 'react-icons/bi';

function AProgSec() {
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchProgram, setSearchProgram] = useState("");
  const [searchSection, setSearchSection] = useState("");
  const [showAddProgram, setShowAddProgram] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const progRes = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers });
      if (progRes.ok) {
        const progData = await progRes.json();
        if (progData.success) setPrograms(progData.data);
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const sectRes = await fetch(`${process.env.REACT_APP_API_URL}/admin/sections`, { headers });
      if (sectRes.ok) {
        const sectData = await sectRes.json();
        if (sectData.success) setSections(sectData.data);
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = () => {
    setShowAddProgram(false);
    fetchData();
  };

  return (
    <div className="amasterlistContainer">
      {showAddProgram && (
        <AddProgram 
          onClose={() => setShowAddProgram(false)} 
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search program name or abbreviation..." 
            className="studentSearchInput"
            value={searchProgram}
            onChange={(e) => setSearchProgram(e.target.value)}
          />
        </div>
        
        <div className="filterContainer">
          <button className="filterToggleBtn">
            <BiFilterAlt className="linkIcon" />
            Filter
          </button>
        </div>

        <div className="createBtnContainer">
          <button className="createBtn" onClick={() => setShowAddProgram(true)}>
            <BiPlusCircle className="linkIcon" />
            Program
          </button>
        </div>
      </div>

      <div className="tableContainer">
        <table className="studentTable">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Program Name</th>
              <th>Abbreviation</th>
              <th>Total Year</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>Loading programs...</td></tr>
            ) : programs.length > 0 ? (
              programs
                .filter(p => 
                  p.name.toLowerCase().includes(searchProgram.toLowerCase()) || 
                  p.abbreviation.toLowerCase().includes(searchProgram.toLowerCase())
                )
                .map((prog, index) => (
                <tr key={prog.id || index}>
                  <td><input type="checkbox" /></td>
                  <td>{prog.name}</td>
                  <td>{prog.abbreviation}</td>
                  <td>{prog.total_years}</td>
                  <td>
                    <span className={prog.status ? "status-active" : "status-inactive"}>
                        {prog.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>No programs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <hr style={{ margin: '2rem 0', border: '0', borderTop: '1px solid #eee' }} />

      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search section..." 
            className="studentSearchInput"
            value={searchSection}
            onChange={(e) => setSearchSection(e.target.value)}
          />
        </div>
        
        <div className="filterContainer">
          <button className="filterToggleBtn">
            <BiFilterAlt className="linkIcon" />
            Filter
          </button>
        </div>

        <div className="createBtnContainer">
          <button className="createBtn">
            <BiPlusCircle className="linkIcon" />
            Section
          </button>
        </div>
      </div>

      <div className="tableContainer">
        <table className="studentTable">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Section Name</th>
              <th>Program</th>
              <th>Year Level</th>
              <th>Semester</th>
              <th>Academic Year</th>
              <th>Total Students</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading sections...</td></tr>
            ) : sections.length > 0 ? (
              sections
                .filter(s => s.name.toLowerCase().includes(searchSection.toLowerCase()))
                .map((sect, index) => (
                <tr key={sect.id || index}>
                  <td><input type="checkbox" /></td>
                  <td>{sect.name}</td>
                  <td>{sect.program_name}</td>
                  <td>{sect.year_level}</td>
                  <td>{sect.student_count}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>No sections found.</td></tr>
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
            <div>out of <span>1</span></div>
          </div>
          <button className="pageBtn next">›</button>
          <button className="pageBtn last">»</button>
        </div>
      </div>
    </div>
  );
}

export default AProgSec;
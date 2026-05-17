import React, { useState, useEffect, useCallback } from 'react';
import './AProgSec.css';
import AddProgram from './../AComponents/AddProgram';
import AddSection from './../AComponents/AddSection';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiX, BiTrash, BiExport, BiRefresh } from 'react-icons/bi';
import FilterComponent from '../../Components/FilterComponent';
import SelectionPanel from '../../Components/SelectionPanel';

function AProgSec() {
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchProgram, setSearchProgram] = useState("");
  const [searchSection, setSearchSection] = useState("");
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  
  // Filter states
  const [activeProgramFilters, setActiveProgramFilters] = useState({});
  const [activeSectionFilters, setActiveSectionFilters] = useState({});
  const [selectedProgramIds, setSelectedProgramIds] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  
  // Pagination
  const [programPage, setProgramPage] = useState(1);
  const [sectionPage, setSectionPage] = useState(1);
  const rowsPerPage = 10;

  const programFilters = [
    { label: "Status", placeholder: "All Statuses", options: ["Active", "Inactive"] },
    { label: "Total Year", options: ["1", "2", "3", "4", "5"] }
  ];

  const sectionFilters = [
    { label: "Year Level", options: ["1", "2", "3", "4", "5"] },
    { label: "Semester", options: ["1st Semester", "2nd Semester", "Summer"] }
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const [progRes, sectRes, acadRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers }),
        fetch(`${process.env.REACT_APP_API_URL}/admin/sections`, { headers }),
        fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years`, { headers })
      ]);

      const progData = await progRes.json();
      const sectData = await sectRes.json();
      const acadData = await acadRes.json();

      if (progData.success) setPrograms(progData.data);
      if (sectData.success) setSections(sectData.data);
      if (acadData.success) setAcademicYears(acadData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
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

  // Program Filtering
  const handleProgramFilterApply = (filters) => {
    setActiveProgramFilters(filters);
    setProgramPage(1);
  };

const filteredPrograms = programs.filter((prog) => {
  const matchesSearch = 
    prog.program_name?.toLowerCase().includes(searchProgram.toLowerCase()) || 
    prog.program_abbr?.toLowerCase().includes(searchProgram.toLowerCase());

  const matchesFilters = Object.keys(activeProgramFilters).every(key => {
    const selectedValues = activeProgramFilters[key];
    
    console.log('Filter key:', key);
    console.log('Selected values:', selectedValues);
    
    if (!selectedValues || selectedValues.length === 0) return true;
    
    if (key === "Status") {
      const statusText = prog.program_status ? "Active" : "Inactive";
      console.log('Status check:', statusText, selectedValues);
      return selectedValues.includes(statusText);
    }
    if (key === "Total Year") {
      console.log('Year check:', prog.total_year, typeof prog.total_year, selectedValues);
      return selectedValues.some(v => {
        console.log('Comparing:', v, typeof v, 'with', prog.total_year, typeof prog.total_year);
        return Number(v) === Number(prog.total_year);
      });
    }
    return true;
  });

  return matchesSearch && matchesFilters;
});

  const handleSectionFilterApply = (filters) => {
    setActiveSectionFilters(filters);
    setSectionPage(1);
  };

  const filteredSections = sections.filter((sect) => {
    const matchesSearch = 
      sect.name?.toLowerCase().includes(searchSection.toLowerCase());

    const matchesFilters = Object.keys(activeSectionFilters).every(key => {
      const selectedValues = activeSectionFilters[key];
      if (!selectedValues || selectedValues.length === 0) return true;
      if (key === "Year Level") {
        return selectedValues.includes(String(sect.year_level));
      }
      if (key === "Semester") {
        return selectedValues.includes(sect.semester);
      }
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  // Program Pagination
  const totalProgramPages = Math.ceil(filteredPrograms.length / rowsPerPage);
  const paginatedPrograms = filteredPrograms.slice(
    (programPage - 1) * rowsPerPage, 
    programPage * rowsPerPage
  );

  // Section Pagination
  const totalSectionPages = Math.ceil(filteredSections.length / rowsPerPage);
  const paginatedSections = filteredSections.slice(
    (sectionPage - 1) * rowsPerPage, 
    sectionPage * rowsPerPage
  );

  // Program Selection
  const handleSelectAllPrograms = (e) => {
    if (e.target.checked) {
      setSelectedProgramIds(paginatedPrograms.map(p => p.program_id));
    } else {
      setSelectedProgramIds([]);
    }
  };

  const handleSelectProgram = (id) => {
    setSelectedProgramIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Section Selection
  const handleSelectAllSections = (e) => {
    if (e.target.checked) {
      setSelectedSectionIds(paginatedSections.map(s => s.id));
    } else {
      setSelectedSectionIds([]);
    }
  };

  const handleSelectSection = (id) => {
    setSelectedSectionIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="amasterlistContainer">
      {/* Add Program Modal */}
      {showAddProgram && (
        <AddProgram 
          onClose={() => setShowAddProgram(false)} 
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Add Section Modal */}
      {showAddSection && (
        <AddSection 
          onClose={() => setShowAddSection(false)} 
          onSuccess={() => { setShowAddSection(false); fetchData(); }}
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
            onChange={(e) => { setSearchProgram(e.target.value); setProgramPage(1); }}
          />
          {searchProgram && (
            <BiX className="clearSearchIcon" onClick={() => { setSearchProgram(""); setProgramPage(1); }} />
          )}
        </div>
        
        <FilterComponent 
          filters={programFilters} 
          onApply={handleProgramFilterApply} 
        />

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
              <th>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAllPrograms}
                  checked={paginatedPrograms.length > 0 && selectedProgramIds.length === paginatedPrograms.length}
                />
              </th>
              <th>Program Name</th>
              <th>Abbreviation</th>
              <th>Total Years</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>Loading programs...</td></tr>
            ) : paginatedPrograms.length > 0 ? (
              paginatedPrograms.map((prog) => (
                <tr key={prog.program_id} className={selectedProgramIds.includes(prog.program_id) ? 'selected-row' : ''}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedProgramIds.includes(prog.program_id)}
                      onChange={() => handleSelectProgram(prog.program_id)}
                    />
                  </td>
                  <td>{prog.program_name}</td>
                  <td>{prog.program_abbr}</td>
                  <td>{prog.total_year}</td>
                  <td>
                    <span className={`statusBadge ${prog.program_status ? 'badge-green' : 'badge-red'}`}>
                      {prog.program_status ? "Active" : "Inactive"}
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

      {/* Program Pagination */}
      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn first" onClick={() => setProgramPage(1)} disabled={programPage === 1}>«</button>
          <button className="pageBtn prev" onClick={() => setProgramPage(p => p - 1)} disabled={programPage === 1}>‹</button>
          <div className="currentPageInputWrapper">
            <input 
              type="number" 
              value={programPage} 
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalProgramPages) setProgramPage(val);
              }} 
              className="currentPageInput" 
              min="1"
              max={totalProgramPages || 1}
            />
          </div>
          <div className="paginationInfo"><div>out of <span>{totalProgramPages || 1}</span></div></div>
          <button className="pageBtn next" onClick={() => setProgramPage(p => p + 1)} disabled={programPage === totalProgramPages}>›</button>
          <button className="pageBtn last" onClick={() => setProgramPage(totalProgramPages)} disabled={programPage === totalProgramPages}>»</button>
        </div>
      </div>

      {/* Program Selection Panel */}
      <SelectionPanel selectedCount={selectedProgramIds.length} onClear={() => setSelectedProgramIds([])}>
        <button onClick={() => console.log("Delete programs:", selectedProgramIds)} className="deleteBtn">
          <BiTrash size={18} /> Delete
        </button>
      </SelectionPanel>

      <hr style={{ margin: '1rem 0', border: '1px solid #e0e0e0' }} />

      {/* ========== SECTIONS SECTION ========== */}
      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search section..." 
            className="studentSearchInput"
            value={searchSection}
            onChange={(e) => { setSearchSection(e.target.value); setSectionPage(1); }}
          />
          {searchSection && (
            <BiX className="clearSearchIcon" onClick={() => { setSearchSection(""); setSectionPage(1); }} />
          )}
        </div>
        
        <FilterComponent 
          filters={sectionFilters} 
          onApply={handleSectionFilterApply} 
        />

        <div className="createBtnContainer">
          <button className="createBtn" onClick={() => setShowAddSection(true)}>
            <BiPlusCircle className="linkIcon" />
            Section
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
                  onChange={handleSelectAllSections}
                  checked={paginatedSections.length > 0 && selectedSectionIds.length === paginatedSections.length}
                />
              </th>
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
            ) : paginatedSections.length > 0 ? (
              paginatedSections.map((sect) => (
                <tr key={sect.id} className={selectedSectionIds.includes(sect.id) ? 'selected-row' : ''}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedSectionIds.includes(sect.id)}
                      onChange={() => handleSelectSection(sect.id)}
                    />
                  </td>
                  <td>{sect.name}</td>
                  <td>{sect.program_name}</td>
                  <td>{sect.year_level}</td>
                  <td>{sect.semester}</td>    
                  <td>{sect.academic_year}</td>  
                  <td>{sect.student_count}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>No sections found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Section Pagination */}
      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn first" onClick={() => setSectionPage(1)} disabled={sectionPage === 1}>«</button>
          <button className="pageBtn prev" onClick={() => setSectionPage(p => p - 1)} disabled={sectionPage === 1}>‹</button>
          <div className="currentPageInputWrapper">
            <input 
              type="number" 
              value={sectionPage} 
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalSectionPages) setSectionPage(val);
              }} 
              className="currentPageInput" 
              min="1"
              max={totalSectionPages || 1}
            />
          </div>
          <div className="paginationInfo"><div>out of <span>{totalSectionPages || 1}</span></div></div>
          <button className="pageBtn next" onClick={() => setSectionPage(p => p + 1)} disabled={sectionPage === totalSectionPages}>›</button>
          <button className="pageBtn last" onClick={() => setSectionPage(totalSectionPages)} disabled={sectionPage === totalSectionPages}>»</button>
        </div>
      </div>

      {/* Section Selection Panel */}
      <SelectionPanel selectedCount={selectedSectionIds.length} onClear={() => setSelectedSectionIds([])}>
        <button onClick={() => console.log("Delete sections:", selectedSectionIds)} className="deleteBtn">
          <BiTrash size={18} /> Delete
        </button>
      </SelectionPanel>
    </div>
  );
}

export default AProgSec;
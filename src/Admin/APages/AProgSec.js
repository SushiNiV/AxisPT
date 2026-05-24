import React, { useState, useEffect, useCallback } from 'react';
import './AProgSec.css';
import AddProgram from './../AComponents/AddProgram';
import AddSection from './../AComponents/AddSection';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiX, BiTrash, BiChevronDown, BiChevronRight } from 'react-icons/bi';
import FilterComponent from '../../Components/FilterComponent';
import SelectionPanel from '../../Components/SelectionPanel';

function AProgSec() {
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchProgram, setSearchProgram] = useState("");
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  
  const [activeProgramFilters, setActiveProgramFilters] = useState({});
  const [selectedProgramIds, setSelectedProgramIds] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [sectionSearch, setSectionSearch] = useState("");
  
  const [programPage, setProgramPage] = useState(1);
  const rowsPerPage = 10;

  const programFilters = [
    { label: "Status", placeholder: "All Statuses", options: ["Active", "Inactive"] },
    { label: "Total Year", options: ["1", "2", "3", "4", "5"] }
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddSuccess = () => {
    setShowAddProgram(false);
    setShowAddSection(false);
    fetchData();
  };

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
      if (!selectedValues || selectedValues.length === 0) return true;
      if (key === "Status") {
        const statusText = prog.program_status ? "Active" : "Inactive";
        return selectedValues.includes(statusText);
      }
      if (key === "Total Year") {
        return selectedValues.some(v => Number(v) === Number(prog.total_year));
      }
      return true;
    });
    return matchesSearch && matchesFilters;
  });

  const getSectionsForProgram = (programId) => {
    return sections.filter(s => {
      const prog = programs.find(p => p.program_id === programId);
      const matchesProgram = s.program_name === prog?.program_abbr;
      const matchesSearch = sectionSearch === "" || s.name?.toLowerCase().includes(sectionSearch.toLowerCase());
      return matchesProgram && matchesSearch;
    });
  };

  const totalProgramPages = Math.ceil(filteredPrograms.length / rowsPerPage);
  const paginatedPrograms = filteredPrograms.slice(
    (programPage - 1) * rowsPerPage, 
    programPage * rowsPerPage
  );

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

  const handleSelectSection = (id, e) => {
    e.stopPropagation();
    setSelectedSectionIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleExpand = (programId) => {
    setExpandedProgram(expandedProgram === programId ? null : programId);
    setSectionSearch("");
  };

  return (
    <div className="progsecContainer">
      {showAddProgram && (
        <AddProgram onClose={() => setShowAddProgram(false)} onSuccess={handleAddSuccess} />
      )}
      {showAddSection && (
        <AddSection onClose={() => setShowAddSection(false)} onSuccess={handleAddSuccess} />
      )}

      <div className="progsecSearchBar">
        <div className="progsecSearchWrapper">
          <BiSearch className="progsecSearchIcon" />
          <input type="text" placeholder="Search program name or abbreviation..." className="progsecSearchInput"
            value={searchProgram} onChange={(e) => { setSearchProgram(e.target.value); setProgramPage(1); }} />
          {searchProgram && <BiX className="progsecClearIcon" onClick={() => { setSearchProgram(""); setProgramPage(1); }} />}
        </div>

        <FilterComponent filters={programFilters} onApply={handleProgramFilterApply} />

        <div className="progsecCreateBtnContainer">
          <button className="progsecCreateBtn" onClick={() => setShowAddProgram(true)}>
            <BiPlusCircle className="progsecBtnIcon" /> Program
          </button>
        </div>
      </div>

      {/* Card-style Program List */}
      <div className="progsecCardList">
        {loading ? (
          <p className="progsecEmpty">Loading programs...</p>
        ) : paginatedPrograms.length > 0 ? (
          paginatedPrograms.map((prog) => {
            const programSections = getSectionsForProgram(prog.program_id);
            const isExpanded = expandedProgram === prog.program_id;
            
            return (
              <div key={prog.program_id} className={`progsecActivityCard ${isExpanded ? 'progsecCardExpanded' : ''}`}>
                <div className="progsecCardRow" onClick={() => toggleExpand(prog.program_id)}>
                  <div className="progsecCardCheck" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedProgramIds.includes(prog.program_id)}
                      onChange={() => handleSelectProgram(prog.program_id)} />
                  </div>
                  <div className="progsecCardIcon">
                    <div className={`progsecIconCircle ${prog.program_status ? 'active' : 'inactive'}`}>
                      {prog.program_abbr?.charAt(0) || 'P'}
                    </div>
                  </div>
                  <div className="progsecCardContent">
                    <div className="progsecCardHeader">
                      <h3 className="progsecCardTitle">{prog.program_name}</h3>
                      <span className={`progsecCardStatus ${prog.program_status ? 'active' : 'inactive'}`}>
                        {prog.program_status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="progsecCardDetails">
                      {prog.program_abbr} • {prog.total_year} {prog.total_year === 1 ? 'Year' : 'Years'} • {programSections.length} Sections
                    </p>
                  </div>
                  <div className="progsecCardArrow">
                    {isExpanded ? <BiChevronDown size={20} /> : <BiChevronRight size={20} />}
                  </div>
                </div>

                {/* Expanded Section Dropdown */}
                {isExpanded && (
                  <div className="progsecSectionDropdown">
                    <div className="progsecSearchBar">
                      <div className="progsecSearchWrapper">
                        <BiSearch className="progsecSearchIcon" />
                        <input 
                          type="text" 
                          placeholder="Search sections..." 
                          className="progsecSearchInput"
                          value={sectionSearch} 
                          onChange={(e) => setSectionSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()} 
                        />
                        {sectionSearch && (
                          <BiX className="progsecClearIcon" onClick={(e) => { e.stopPropagation(); setSectionSearch(""); }} />
                        )}
                      </div>
                      
                      <div className="progsecCreateBtnContainer">
                        <button 
                          className="progsecCreateBtn" 
                          onClick={(e) => { e.stopPropagation(); setShowAddSection(true); }}
                        >
                          <BiPlusCircle className="progsecBtnIcon" /> Section
                        </button>
                      </div>
                    </div>

                    {programSections.length > 0 ? (
                      <table className="progsecNestedTable">
                        <thead className="progsecNestedHeader">
                          <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>SECTION NAME</th>
                            <th>YEAR LEVEL</th>
                            <th>SEMESTER</th>
                            <th>ACADEMIC YEAR</th>
                            <th>STUDENTS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {programSections.map(sect => (
                            <tr key={sect.id} className={`progsecNestedRow ${selectedSectionIds.includes(sect.id) ? 'progsecRowSelected' : ''}`}>
                              <td>
                                <input type="checkbox" checked={selectedSectionIds.includes(sect.id)}
                                  onChange={(e) => handleSelectSection(sect.id, e)} />
                              </td>
                              <td>{sect.name}</td>
                              <td>{sect.year_level}</td>
                              <td>{sect.semester}</td>
                              <td>{sect.academic_year}</td>
                              <td>{sect.student_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="progsecNoSections">No sections found for this program</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="progsecEmpty">No programs found.</p>
        )}
      </div>

      <div className="progsecPagination">
        <div className="progsecPaginationControls">
          <button className="progsecPageBtn" onClick={() => setProgramPage(1)} disabled={programPage === 1}>«</button>
          <button className="progsecPageBtn" onClick={() => setProgramPage(p => p - 1)} disabled={programPage === 1}>‹</button>
          <div className="progsecPageInputWrapper">
            <input type="number" value={programPage} onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1 && val <= totalProgramPages) setProgramPage(val);
            }} className="progsecPageInput" min="1" max={totalProgramPages || 1} />
          </div>
          <div className="progsecPaginationInfo"><div>out of <span>{totalProgramPages || 1}</span></div></div>
          <button className="progsecPageBtn" onClick={() => setProgramPage(p => p + 1)} disabled={programPage === totalProgramPages}>›</button>
          <button className="progsecPageBtn" onClick={() => setProgramPage(totalProgramPages)} disabled={programPage === totalProgramPages}>»</button>
        </div>
      </div>

      <SelectionPanel selectedCount={selectedProgramIds.length + selectedSectionIds.length} onClear={() => { setSelectedProgramIds([]); setSelectedSectionIds([]); }}>
        <button onClick={() => console.log("Delete:", { programs: selectedProgramIds, sections: selectedSectionIds })} className="deleteBtn">
          <BiTrash size={18} /> Delete Selected
        </button>
      </SelectionPanel>
    </div>
  );
}

export default AProgSec;
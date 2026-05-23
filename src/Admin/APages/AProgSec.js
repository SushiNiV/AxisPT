import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BiSearch, BiPlusCircle, BiX, BiTrash, BiBook, BiPencil, BiFilterAlt } from 'react-icons/bi';

import '../../Global.css';
import '../../GlobalCard.css';
import '../../GlobalEmpty.css';
import AddProgram from '../AComponents/AddProgram';
import AddSection from '../AComponents/AddSection';

function AProgSec() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState({});
  const [sectionSearch, setSectionSearch] = useState({});
  const [sections, setSections] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedProgramForSection, setSelectedProgramForSection] = useState(null);
  const [filterYearLevel, setFilterYearLevel] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

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
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSectionsForProgram = useCallback(async (programId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/sections/active?program_id=${programId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSections(prev => ({
          ...prev,
          [programId]: data.data
        }));
      }
    } catch (err) {
      console.error("Error fetching sections:", err);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddSuccess = () => {
    setShowAdd(false);
    setEditingProgram(null);
    fetchPrograms();
  };

  const handleSectionAddSuccess = () => {
    setShowAddSection(false);
    if (selectedProgramForSection) {
      fetchSectionsForProgram(selectedProgramForSection.id);
    }
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setShowAdd(true);
  };

  const handleDelete = async (programId) => {
    if (window.confirm("Are you sure you want to delete this program?")) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs/${programId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          fetchPrograms();
        } else {
          alert(data.message || "Failed to delete program.");
        }
      } catch (error) {
        console.error("Error deleting program:", error);
        alert("An error occurred.");
      }
    }
  };

  const resetFilters = () => {
    setFilterYearLevel("");
    setFilterSemester("");
  };

  const toggleExpand = (programId) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }));
    if (!sections[programId]) {
      fetchSectionsForProgram(programId);
    }
  };

  const handleCheckboxChange = (programId, e) => {
    e.stopPropagation();
    toggleExpand(programId);
  };

  const updateSectionSearch = (programId, value) => {
    setSectionSearch(prev => ({
      ...prev,
      [programId]: value
    }));
  };

  const filteredPrograms = programs.filter(prog =>
    prog.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prog.program_abbr?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredSections = (programId) => {
    const programSections = sections[programId] || [];
    return programSections.filter(section => {
      const matchesSearch = section.section_name?.toLowerCase().includes((sectionSearch[programId] || "").toLowerCase());
      const matchesYearLevel = !filterYearLevel || section.year_level?.toString() === filterYearLevel;
      const matchesSemester = !filterSemester || section.semester_label === filterSemester;
      return matchesSearch && matchesYearLevel && matchesSemester;
    });
  };

  const hasSearchResults = searchTerm && filteredPrograms.length === 0 && programs.length > 0;

  return (
    <div className="InnerContainer">
      {showAdd && (
        <AddProgram
          onClose={() => {
            setShowAdd(false);
            setEditingProgram(null);
          }}
          onSuccess={handleAddSuccess}
          programToEdit={editingProgram}
        />
      )}
      {showAddSection && (
        <AddSection
          onClose={() => setShowAddSection(false)}
          onSuccess={handleSectionAddSuccess}
          programId={selectedProgramForSection?.id}
          programName={selectedProgramForSection?.name}
          programAbbr={selectedProgramForSection?.abbr}
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
            onChange={(e) => { setSearchTerm(e.target.value); }}
          />
          {searchTerm && (
            <BiX className="ClearSearchIcon" onClick={() => { setSearchTerm(""); }} />
          )}
        </div>

        <div className="TopbarBtnContainer">
          <button className="TopbarBtn" onClick={() => setShowAdd(true)}>
            <BiPlusCircle className="linkIcon" /> Program
          </button>
        </div>
      </div>

      <div className="CardsContainer">
        {loading ? (
          <div className="emptyState">
            <div className="emptyStateIcon">⏳</div>
            <h3 className="emptyStateTitle">Loading Programs</h3>
            <p className="emptyStateText">Please wait while we fetch the data...</p>
          </div>
        ) : filteredPrograms.length > 0 ? (
          filteredPrograms.map((prog) => {
            const filteredSections = getFilteredSections(prog.program_id);
            return (
              <div key={prog.program_id} className="Card">
                <div className="CardMain">
                  <div className="cardCheckbox">
                    <input 
                      type="checkbox" 
                      checked={expandedPrograms[prog.program_id] || false}
                      onChange={(e) => handleCheckboxChange(prog.program_id, e)}
                    />
                  </div>
                  <div className={`cardIcon ${prog.program_status ? 'active' : 'inactive'}`}>
                    <BiBook />
                  </div>
                  <div className="cardContent">
                    <div className="cardHeader">
                      <span className={`statusBadge ${prog.program_status ? 'active-bg' : 'inactive-bg'}`}>
                        {prog.program_status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="cardTitle">{prog.program_name}</h3>
                    <div className="CardDetails">
                      <span className="detailBadge">Abbr: {prog.program_abbr}</span>
                      <span className="detailBadge">{prog.total_year} Year(s)</span>
                    </div>
                  </div>
                  <div className="CardAction">
                    <button className="actionBtn editBtn" onClick={() => handleEdit(prog)}>
                      <BiPencil /> Edit
                    </button>
                    <button className="actionBtn deleteBtn" onClick={() => handleDelete(prog.program_id)}>
                      <BiTrash /> Delete
                    </button>
                  </div>
                </div>

                {expandedPrograms[prog.program_id] && (
                  <div className="CardExpandedPanel">
                    <div className="CardExpandedControls">
                      <div className="CardExpandedSearchWrapper">
                        <BiSearch className="SearchIcon" />
                        <input
                          type="text"
                          placeholder="Search sections..."
                          className="SearchInput"
                          value={sectionSearch[prog.program_id] || ""}
                          onChange={(e) => updateSectionSearch(prog.program_id, e.target.value)}
                        />
                        {sectionSearch[prog.program_id] && (
                          <BiX 
                            className="ClearSearchIcon" 
                            onClick={() => updateSectionSearch(prog.program_id, "")}
                          />
                        )}
                      </div>
                      
                      <div className="CardExpandedBtnGroup">
                        <div className="CardExpandedBtnContainer" ref={filterRef}>
                          <button className="TopbarBtn" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <BiFilterAlt className="linkIcon" /> Filter
                          </button>
                          {isFilterOpen && (
                            <div className="FilterDropdown">
                              <div className="FilterGroup">
                                <label>YEAR LEVEL</label>
                                <select 
                                  value={filterYearLevel}
                                  onChange={(e) => setFilterYearLevel(e.target.value)}
                                >
                                  <option value="">ALL YEARS</option>
                                  <option value="1">1st Year</option>
                                  <option value="2">2nd Year</option>
                                  <option value="3">3rd Year</option>
                                  <option value="4">4th Year</option>
                                </select>
                              </div>
                              <div className="FilterGroup">
                                <label>SEMESTER</label>
                                <select 
                                  value={filterSemester}
                                  onChange={(e) => setFilterSemester(e.target.value)}
                                >
                                  <option value="">ALL SEMESTERS</option>
                                  <option value="1st Semester">1st Semester</option>
                                  <option value="2nd Semester">2nd Semester</option>
                                  <option value="Summer">Summer</option>
                                </select>
                              </div>
                              <div className="BtnsContainer">
                                <button className="ResetFilterBtn" onClick={resetFilters}>Reset</button>
                                <button className="ApplyFilterBtn" onClick={() => setIsFilterOpen(false)}>Apply</button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="CardExpandedBtnContainer">
                          <button className="TopbarBtn" onClick={() => {
                            setSelectedProgramForSection({ 
                              id: prog.program_id, 
                              name: prog.program_name, 
                              abbr: prog.program_abbr 
                            });
                            setShowAddSection(true);
                          }}>
                            <BiPlusCircle className="linkIcon" /> Section
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="TableContainer NestedTable">
                      <table className="Table">
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>
                              <input type="checkbox" />
                            </th>
                            <th>No.</th>
                            <th>Section Name</th>
                            <th>Year Level</th>
                            <th>Semester</th>
                            <th>Students</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSections.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>
                                No sections found.
                              </td>
                            </tr>
                          ) : (
                            filteredSections.map((section, idx) => (
                              <tr key={section.section_id}>
                                <td><input type="checkbox" /></td>
                                <td>{idx + 1}</td>
                                <td>{section.section_name}</td>
                                <td>{section.year_level || '-'}</td>
                                <td>{section.semester_label || '-'}</td>
                                <td>{section.student_count || 0}</td>
                                <td className="tableActions">
                                  <button className="tableEditBtn">Edit</button>
                                  <button className="tableDeleteBtn">Delete</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : hasSearchResults ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No programs found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm("")}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📚</div>
            <h3 className="emptyStateTitle">No Programs Yet</h3>
            <p className="emptyStateText">Get started by creating your first program.</p>
            <button className="emptyStateBtn" onClick={() => setShowAdd(true)}>
              <BiPlusCircle className="linkIcon"/> Create Program
            </button>
          </div>
        )}
      </div>

      <div className="BottomBuffer"></div>
    </div>
  );
}

export default AProgSec;
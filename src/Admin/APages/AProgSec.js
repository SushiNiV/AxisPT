import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BiSearch, BiPlusCircle, BiX, BiTrash, BiBook, BiPencil, BiFilterAlt } from 'react-icons/bi';

import '../../Global.css';
import '../../GlobalCard.css';
import '../../GlobalEmpty.css';
import AddProgram from '../AComponents/AddProgram';

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

  const toggleExpand = (programId) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }));
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
          filteredPrograms.map((prog) => (
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
                              <select>
                                <option value="">ALL YEARS</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                              </select>
                            </div>
                            <div className="FilterGroup">
                              <label>SEMESTER</label>
                              <select>
                                <option value="">ALL SEMESTERS</option>
                                <option value="1">1st Semester</option>
                                <option value="2">2nd Semester</option>
                                <option value="3">Summer</option>
                              </select>
                            </div>
                            <div className="BtnsContainer">
                              <button className="ResetFilterBtn">Reset</button>
                              <button className="ApplyFilterBtn">Apply</button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="CardExpandedBtnContainer">
                        <button className="TopbarBtn" onClick={() => console.log("Add section for", prog.program_id)}>
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
                        {(sections[prog.program_id] || []).length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>
                              No sections found.
                            </td>
                          </tr>
                        ) : (
                          (sections[prog.program_id] || [])
                            .filter(section => 
                              section.name?.toLowerCase().includes((sectionSearch[prog.program_id] || "").toLowerCase())
                            )
                            .map((section, idx) => (
                              <tr key={section.id}>
                                <td><input type="checkbox" /></td>
                                <td>{idx + 1}</td>
                                <td>{section.name}</td>
                                <td>{section.year}</td>
                                <td>{section.semester}</td>
                                <td>{section.students}</td>
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
          ))
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
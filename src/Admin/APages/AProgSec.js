import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BiSearch, BiPlusCircle, BiX, BiTrash, BiBook, BiPencil, BiFilterAlt,
  BiChevronDown, BiChevronRight,
} from 'react-icons/bi';

import '../../Global.css';
import '../../GlobalCard.css';
import '../../GlobalEmpty.css';
import ConfirmationModal from '../AComponents/ConfirmationModal';
import AddProgram from '../AComponents/AddModals/AddProgram';
import AddSection from '../AComponents/AddModals/AddSection';

function AProgSec() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState({});
  const [sectionSearch, setSectionSearch] = useState({});
  const [sections, setSections] = useState({});
  const [loadingSections, setLoadingSections] = useState({});
  const [sectionErrors, setSectionErrors] = useState({});
  const [openFilterProgramId, setOpenFilterProgramId] = useState(null);
  const filterRef = useRef(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedProgramForSection, setSelectedProgramForSection] = useState(null);
  const [sectionFilters, setSectionFilters] = useState({});
  const [academicYears, setAcademicYears] = useState([]);

  // --- Confirmation / Success modal states ---
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  const closeConfirm = () => setConfirmState({ isOpen: false });

  const openConfirm = (config) => {
    setConfirmState({
      isOpen: true, variant: 'info', confirmLabel: 'CONFIRM',
      cancelLabel: 'CANCEL', isAlert: false, loading: false, ...config,
    });
  };

  const openAlert = (title, message, variant = 'info') => {
    setConfirmState({
      isOpen: true, title, message, variant, isAlert: true,
      onConfirm: closeConfirm, onCancel: closeConfirm,
    });
  };

  const showSuccess = (title, message) => {
    setSuccessState({ isOpen: true, title, message, variant: 'success' });
  };

  // --- Fetch academic years ---
  useEffect(() => {
    const fetchAcademicYears = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setAcademicYears(data.data);
    };
    fetchAcademicYears();
  }, []);

  // --- Fetch programs ---
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setPrograms(data.data);
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Fetch sections for a program (lazy + cached per filter combo) ---
  const fetchSectionsForProgram = useCallback(async (programId, yearId = null, semesterId = null) => {
    setLoadingSections((prev) => ({ ...prev, [programId]: true }));
    setSectionErrors((prev) => ({ ...prev, [programId]: null }));
    try {
      const token = sessionStorage.getItem('token');
      const params = new URLSearchParams();
      if (yearId) params.append('yearId', yearId);
      if (semesterId) params.append('semesterId', semesterId);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/sections/by-program/${programId}${qs}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) setSections((prev) => ({ ...prev, [programId]: data.data }));
      else setSectionErrors((prev) => ({ ...prev, [programId]: data.message || 'Failed to load sections.' }));
    } catch (err) {
      setSectionErrors((prev) => ({ ...prev, [programId]: 'Failed to connect to the server.' }));
    } finally {
      setLoadingSections((prev) => ({ ...prev, [programId]: false }));
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  // Click outside to close active filter menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setOpenFilterProgramId(null);
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

  // --- Program delete ---
  const handleDelete = (program) => {
    openConfirm({
      title: 'Delete Program',
      message: (
        <>
          Are you sure you want to permanently delete <strong>{program.program_name}</strong> ({program.program_abbr})?
          <br /><br />
          <span style={{ color: '#c62828', fontSize: '0.75rem' }}>
            This action cannot be undone. All associated curricula, sections, and
            curriculum assignments will be permanently removed.
          </span>
        </>
      ),
      variant: 'danger',
      confirmLabel: 'DELETE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/programs/${program.program_id}`,
            { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
          );
          const data = await response.json();
          closeConfirm();
          if (data.success) {
            fetchPrograms();
            showSuccess('Program Deleted', `${program.program_name} has been deleted successfully.`);
          } else {
            openAlert('Delete Failed', data.message || 'Failed to delete program.', 'danger');
          }
        } catch (error) {
          console.error("Error deleting program:", error);
          closeConfirm();
          openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  // --- Section delete ---
  const handleSectionDelete = (programId, section) => {
    openConfirm({
      title: 'Delete Section',
      message: (
        <>
          Are you sure you want to delete <strong>{section.section_name}</strong>?
          <br /><br />
          <span style={{ color: '#c62828', fontSize: '0.75rem' }}>
            Sections that still have enrolled students or active assignments cannot be deleted.
          </span>
        </>
      ),
      variant: 'danger',
      confirmLabel: 'DELETE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/sections/${section.section_id}`,
            { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
          );
          const data = await response.json();
          closeConfirm();
          if (data.success) {
            fetchSectionsForProgram(programId);
            showSuccess('Section Deleted', `${section.section_name} has been deleted.`);
          } else {
            openAlert('Delete Failed', data.message || 'Failed to delete section.', 'danger');
          }
        } catch (error) {
          console.error("Error deleting section:", error);
          closeConfirm();
          openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const handleSectionEdit = (section) => {
    openAlert('Coming Soon', 'Section editing will be available in a future update.', 'info');
  };

  const toggleFilter = (programId) => {
    setOpenFilterProgramId((prev) => (prev === programId ? null : programId));
  };

  const updateSectionFilter = (programId, key, value) => {
    setSectionFilters((prev) => ({
      ...prev,
      [programId]: { ...prev[programId], [key]: value },
    }));
  };

  const resetFilters = (programId) => {
    setSectionFilters((prev) => ({
      ...prev,
      [programId]: { yearLevel: "", semesterId: "", schoolYearId: "" },
    }));
  };

  // --- Expand / collapse ---
  const toggleExpand = (programId) => {
    setExpandedPrograms((prev) => ({ ...prev, [programId]: !prev[programId] }));
    if (!sections[programId] && !loadingSections[programId]) {
      fetchSectionsForProgram(programId);
    }
  };

  const updateSectionSearch = (programId, value) => {
    setSectionSearch((prev) => ({ ...prev, [programId]: value }));
  };

  const filteredPrograms = programs.filter((prog) =>
    prog.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prog.program_abbr?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client-side filters (year level + semester text) applied to whatever the
  // server returned for the active school-year/semester server-side filters.
  const getFilteredSections = (programId) => {
    const programSections = sections[programId] || [];
    const progFilters = sectionFilters[programId] || { yearLevel: "", semesterId: "", schoolYearId: "" };

    return programSections.filter((section) => {
      const matchesSearch = section.section_name
        ?.toLowerCase()
        .includes((sectionSearch[programId] || "").toLowerCase());
      const matchesYearLevel =
        !progFilters.yearLevel || section.year_level?.toString() === progFilters.yearLevel;
      const matchesSemester =
        !progFilters.semesterId ||
        section.semester_id?.toString() === progFilters.semesterId?.toString();
      return matchesSearch && matchesYearLevel && matchesSemester;
    });
  };

  const hasSearchResults = searchTerm && filteredPrograms.length === 0 && programs.length > 0;

  return (
    <div className="InnerContainer">
      {showAdd && (
        <AddProgram
          onClose={() => { setShowAdd(false); setEditingProgram(null); }}
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <BiX className="ClearSearchIcon" onClick={() => setSearchTerm("")} />
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
            const isExpanded = !!expandedPrograms[prog.program_id];
            const isLoadingSections = !!loadingSections[prog.program_id];
            const sectionError = sectionErrors[prog.program_id];
            const filteredSections = getFilteredSections(prog.program_id);
            const currentFilters = sectionFilters[prog.program_id] || {
              yearLevel: "",
              semesterId: "",
              schoolYearId: "",
            };

            return (
              <div key={prog.program_id} className="Card">
                <div className="CardMain">
                  <button
                    type="button"
                    className="expandToggle"
                    onClick={(e) => { e.stopPropagation(); toggleExpand(prog.program_id); }}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Collapse sections' : 'Expand sections'}
                  >
                    {isExpanded ? <BiChevronDown /> : <BiChevronRight />}
                  </button>

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
                    <button className="actionBtn deleteBtn" onClick={() => handleDelete(prog)}>
                      <BiTrash /> Delete
                    </button>
                  </div>
                </div>

                {isExpanded && (
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
                        <div
                          className="CardExpandedBtnContainer"
                          ref={openFilterProgramId === prog.program_id ? filterRef : null}
                        >
                          <button className="TopbarBtn" onClick={() => toggleFilter(prog.program_id)}>
                            <BiFilterAlt className="linkIcon" /> Filter
                          </button>

                          {openFilterProgramId === prog.program_id && (
                            <div className="FilterDropdown">
                              <div className="FilterGroup">
                                <label>SCHOOL YEAR</label>
                                <select
                                  value={currentFilters.schoolYearId || ""}
                                  onChange={(e) =>
                                    updateSectionFilter(prog.program_id, 'schoolYearId', e.target.value)
                                  }
                                >
                                  <option value="">CURRENT</option>
                                  {academicYears.map((y) => (
                                    <option key={y.year_id} value={y.year_id}>
                                      {y.year_label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="FilterGroup">
                                <label>SEMESTER</label>
                                <select
                                  value={currentFilters.semesterId || ""}
                                  onChange={(e) =>
                                    updateSectionFilter(prog.program_id, 'semesterId', e.target.value)
                                  }
                                >
                                  <option value="">ALL SEMESTERS</option>
                                  <option value="1">1st Semester</option>
                                  <option value="2">2nd Semester</option>
                                  <option value="3">Summer</option>
                                </select>
                              </div>

                              <div className="FilterGroup">
                                <label>YEAR LEVEL</label>
                                <select
                                  value={currentFilters.yearLevel || ""}
                                  onChange={(e) =>
                                    updateSectionFilter(prog.program_id, 'yearLevel', e.target.value)
                                  }
                                >
                                  <option value="">ALL YEARS</option>
                                  <option value="1">1st Year</option>
                                  <option value="2">2nd Year</option>
                                  <option value="3">3rd Year</option>
                                  <option value="4">4th Year</option>
                                </select>
                              </div>

                              <div className="BtnsContainer">
                                <button
                                  className="ResetFilterBtn"
                                  onClick={() => {
                                    resetFilters(prog.program_id);
                                    fetchSectionsForProgram(prog.program_id);
                                  }}
                                >
                                  Reset
                                </button>
                                <button
                                  className="ApplyFilterBtn"
                                  onClick={() => {
                                    fetchSectionsForProgram(
                                      prog.program_id,
                                      currentFilters.schoolYearId || null,
                                      currentFilters.semesterId || null
                                    );
                                    setOpenFilterProgramId(null);
                                  }}
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="CardExpandedBtnContainer">
                          <button
                            className="TopbarBtn"
                            onClick={() => {
                              setSelectedProgramForSection({
                                id: prog.program_id,
                                name: prog.program_name,
                                abbr: prog.program_abbr,
                              });
                              setShowAddSection(true);
                            }}
                          >
                            <BiPlusCircle className="linkIcon" /> Section
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="TableContainer NestedTable">
                      {isLoadingSections ? (
                        <div className="SectionLoadingState">
                          <span className="SectionSpinner" />
                          <span>Loading sections…</span>
                        </div>
                      ) : sectionError ? (
                        <div className="SectionErrorState" role="alert">
                          <span>{sectionError}</span>
                          <button
                            type="button"
                            className="tableEditBtn"
                            onClick={() => fetchSectionsForProgram(prog.program_id)}
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
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
                              <th>School Year</th>
                              <th>Students</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSections.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="SectionEmptyRow">
                                  No sections found
                                </td>
                              </tr>
                            ) : (
                              filteredSections.map((section, idx) => (
                                <tr key={section.assignment_id || section.section_id}>
                                  <td><input type="checkbox" /></td>
                                  <td>{idx + 1}</td>
                                  <td>
                                    {section.section_name}
                                    {section.is_current && (
                                      <span
                                        className="statusBadge active-bg"
                                        style={{ marginLeft: '8px', fontSize: '0.65rem' }}
                                      >
                                        Current
                                      </span>
                                    )}
                                  </td>
                                  <td>{section.year_level ? `${section.year_level}` : '-'}</td>
                                  <td>{section.semester_label || '-'}</td>
                                  <td>{section.year_label || '-'}</td>
                                  <td>{section.student_count || 0}</td>
                                  <td className="tableActions">
                                    <button
                                      className="tableEditBtn"
                                      onClick={() => handleSectionEdit(section)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="tableDeleteBtn"
                                      onClick={() => handleSectionDelete(prog.program_id, section)}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}
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
              <BiPlusCircle className="linkIcon" /> Create Program
            </button>
          </div>
        )}
      </div>

      <div className="BottomBuffer"></div>

      <ConfirmationModal
        isOpen={successState.isOpen}
        title={successState.title}
        message={successState.message}
        variant={successState.variant}
        isAlert={true}
        onConfirm={() => setSuccessState({ isOpen: false })}
        onCancel={() => setSuccessState({ isOpen: false })}
      />

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </div>
  );
}

export default AProgSec;
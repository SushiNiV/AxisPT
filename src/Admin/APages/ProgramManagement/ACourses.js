import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiPlusCircle, BiX, BiPencil, BiTrash, BiChevronDown, BiDotsVerticalRounded } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import '../../../ResponsiveStyle/ResponsiveTable.css';
import '../../../GlobalStyle/GlobalCard.css';
import Filter from '../../../Components/Filter';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import '../../../GlobalStyle/GlobalHistory.css';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import AddCourse from '../../AComponents/AddModals/AddCourse';

function ACourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [tempProgram, setTempProgram] = useState("");
  const [tempYearLevel, setTempYearLevel] = useState("");
  const [tempSemester, setTempSemester] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);

  const [confirmState, setConfirmState] = useState({ isOpen: false });

  const [programOptions, setProgramOptions] = useState([]);
  const [yearLevelOptions] = useState(["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]);
  const [semesterOptions] = useState(["1st Semester", "2nd Semester", "Summer"]);

  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';

  const hasActiveFilters = selectedProgram !== "" || selectedYearLevel !== "" || selectedSemester !== "";

  const isMobile = useMediaQuery('(max-width: 768px)');
  const rowsPerPage = isMobile ? 10 : 50;
  
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [menuCourseId, setMenuCourseId] = useState(null);

  const unitsOf = (c) => c.total_units || c.lec_units + c.lab_units;
  const programLabel = (c) => c.program_abbrs?.length ? c.program_abbrs.join(', ') : '-';

  // Helper specifically for the new desktop list layout
  const getUniqueAssignments = (c) => {
    if (!c.assignments || c.assignments.length === 0) return [];
    // Deduplicate so we don't show the same year/semester twice
    return Array.from(
      new Set(c.assignments.map(a => `${a.year_level} Yr - ${a.semester_label}`))
    );
  };

  // Helper for the mobile accordion pills
  const getAssignmentPills = (c) => {
    const unique = getUniqueAssignments(c);
    if (unique.length === 0) return '-';
    
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {unique.map((pair, idx) => (
          <span 
            key={idx} 
            className="detailBadge" 
            style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', padding: '2px 8px', margin: 0 }}
          >
            {pair}
          </span>
        ))}
      </div>
    );
  };

  useEffect(() => { setCurrentPage(1); }, [isMobile]);

  useEffect(() => {
    if (isFilterOpen) {
      setTempProgram(selectedProgram);
      setTempYearLevel(selectedYearLevel);
      setTempSemester(selectedSemester);
    }
  }, [isFilterOpen, selectedProgram, selectedYearLevel, selectedSemester]);

  const closeConfirm = () => setConfirmState({ isOpen: false });

  const openConfirm = (config) => {
    setConfirmState({
      isOpen: true,
      variant: 'info',
      confirmLabel: 'CONFIRM',
      cancelLabel: 'CANCEL',
      isAlert: false,
      loading: false,
      ...config,
    });
  };

  const openAlert = (title, message, variant = 'info') => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      variant,
      isAlert: true,
      onConfirm: () => setConfirmState({ isOpen: false }),
      onCancel: () => setConfirmState({ isOpen: false }),
    });
  };

  const fetchPrograms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const programs = data.data.map(p => p.program_abbr || p.program_name);
        setProgramOptions(programs);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      } else {
        setError(data.message || "Failed to fetch courses");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetchCourses();
  }, [fetchPrograms, fetchCourses]);

  const filters = [
    { name: "program", label: "PROGRAM", value: tempProgram, options: programOptions, placeholder: "ALL PROGRAMS" },
    { name: "yearLevel", label: "YEAR LEVEL", value: tempYearLevel, options: yearLevelOptions, placeholder: "ALL YEARS" },
    { name: "semester", label: "SEMESTER", value: tempSemester, options: semesterOptions, placeholder: "ALL SEMESTERS" }
  ];

  const handleFilterChange = (name, value) => {
    if (name === "program") setTempProgram(value);
    else if (name === "yearLevel") setTempYearLevel(value);
    else if (name === "semester") setTempSemester(value);
  };

  const resetFilters = () => {
    setTempProgram("");
    setTempYearLevel("");
    setTempSemester("");
    setSelectedProgram("");
    setSelectedYearLevel("");
    setSelectedSemester("");
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setSelectedProgram(tempProgram);
    setSelectedYearLevel(tempYearLevel);
    setSelectedSemester(tempSemester);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram = !selectedProgram ||
      (course.program_abbrs || []).some(abbr => abbr === selectedProgram);

    const matchesYearLevel = !selectedYearLevel ||
      (course.assignments || []).some(a => a.year_level?.toString() === selectedYearLevel.charAt(0));

    const matchesSemester = !selectedSemester ||
      (course.assignments || []).some(a => a.semester_label === selectedSemester);

    return matchesSearch && matchesProgram && matchesYearLevel && matchesSemester;
  });

  const totalPages = Math.ceil(filteredCourses.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const handleAddSuccess = () => {
    setShowAddCourse(false);
    setEditingCourse(null);
    fetchCourses();
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setShowAddCourse(true);
  };

  const handleDelete = (course) => {
    openConfirm({
      title: 'Archive Course',
      summary: (
        <>Archive <strong>{course.course_code}</strong> — {course.course_name}?</>
      ),
      message: (
        <span style={{ color: '#c62828', fontSize: '0.85rem' }}>
          The course will be hidden from all lists and pickers. Existing grades,
          curricula, and student records stay intact. You can restore it later
          from the Archive page.
        </span>
      ),
      variant: 'danger',
      confirmLabel: 'ARCHIVE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/courses/${course.course_id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchCourses();
          } else {
            openAlert('Archive Failed', data.message || 'Failed to archive course.', 'danger');
          }
        } catch (err) {
          console.error("Error archiving course:", err);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⏳</div>
          <h3 className="emptyStateTitle">Loading Courses</h3>
          <p className="emptyStateText">Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⚠️</div>
          <h3 className="emptyStateTitle">Error Loading Courses</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoData = filteredCourses.length === 0;

  return (
    <div className="InnerContainer CourseContainer">
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        summary={confirmState.summary}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />

      {showAddCourse && (
        <AddCourse
          onClose={() => {
            setShowAddCourse(false);
            setEditingCourse(null);
          }}
          onSuccess={handleAddSuccess}
          courseToEdit={editingCourse}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search course code or name..."
            className="SearchInput"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <BiX
              className="ClearSearchIcon"
              onClick={clearSearch}
            />
          )}
        </div>

        <Filter
          isOpen={isFilterOpen}
          setIsOpen={setIsFilterOpen}
          hasActiveFilters={hasActiveFilters}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          onApply={applyFilters}
        />

        {isAdmin && (
          <div className="TopbarBtnContainer">
            <button className="TopbarBtn" aria-label="Add course" onClick={() => setShowAddCourse(true)}>
              <BiPlusCircle className="linkIcon" />
              Course
            </button>
          </div>
        )}
      </div>

      {hasNoData ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {searchTerm ? (
            <div className="emptyState">
              <div className="emptyStateIcon">🔍</div>
              <h3 className="emptyStateTitle">No matching results</h3>
              <p className="emptyStateText">No courses found matching "{searchTerm}"</p>
              <button className="emptyStateBtn" onClick={clearSearch}>
                Clear Search
              </button>
            </div>
          ) : isAdmin ? (
            <div className="emptyState">
              <div className="emptyStateIcon">📚</div>
              <h3 className="emptyStateTitle">No Courses Yet</h3>
              <p className="emptyStateText">Get started by creating your first course.</p>
              <button className="emptyStateBtn" onClick={() => setShowAddCourse(true)}>
                <BiPlusCircle className="linkIcon"/> Create Course
              </button>
            </div>
          ) : (
            <div className="emptyState">
              <div className="emptyStateIcon">📚</div>
              <h3 className="emptyStateTitle">No Courses Yet</h3>
              <p className="emptyStateText">There are no courses to display.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {isMobile ? (
            <div className="CardsContainer RecordCards">
              {currentItems.map((course) => {
                const isExpanded = expandedCourseId === course.course_id;
                
                return (
                  <div
                    key={course.course_id}
                    className={`Card RecordCard ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedCourseId(isExpanded ? null : course.course_id)}
                  >
                    <div className="CardMain">
                      <div className="cardContent">
                        <div className="cardHeader">
                          <span className="cardTitle">{course.course_code}</span>
                        </div>
                        <span className="RecordCardSub">{course.course_name}</span>
                        
                        {/* COLLAPSED STATE: Only Units are shown here now */}
                        <div className="CardDetails">
                          <span className="detailBadge">{unitsOf(course)} units</span>
                        </div>
                      </div>

                      <div className="RecordChevron">
                        <BiChevronDown style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                      </div>

                      {isAdmin && (
                        <button
                          className="RecordMenuBtn"
                          aria-label="Course actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuCourseId(menuCourseId === course.course_id ? null : course.course_id);
                          }}
                        >
                          <BiDotsVerticalRounded />
                        </button>
                      )}
                    </div>

                    {/* EXPANDED STATE: Prerequisites and Assignments are shown here */}
                    {isExpanded && (
                      <div className="CardExpandedContent" onClick={(e) => e.stopPropagation()}>
                        <div style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
                          
                          {/* Prerequisites */}
                          {course.prerequisite_codes && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>
                                Prerequisites:
                              </span>
                              <span className="detailBadge">{course.prerequisite_codes}</span>
                            </div>
                          )}

                          {/* Programs */}
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>
                            Programs: {programLabel(course)}
                          </span>
                          
                          {/* Assignments */}
                          {getAssignmentPills(course)}
                        </div>
                      </div>
                    )}

                    {isAdmin && menuCourseId === course.course_id && (
                      <>
                        <div
                          className="CardMenuBackdrop"
                          onClick={(e) => { e.stopPropagation(); setMenuCourseId(null); }}
                        />
                        <div className="CardMenu" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setMenuCourseId(null); handleEdit(course); }}>
                            <BiPencil /> Edit
                          </button>
                          <button className="danger" onClick={() => { setMenuCourseId(null); handleDelete(course); }}>
                            <BiTrash /> Archive
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="DesktopCourseList">
              {currentItems.map((course) => {
                const uniqueAssignments = getUniqueAssignments(course);
                
                return (
                  <div key={course.course_id} className="DesktopCourseRow">
                    
                    <div className="CourseRowMain">
                      <div className="CourseRowCode">{course.course_code}</div>
                      <div className="CourseRowName" title={course.course_name}>
                        {course.course_name}
                      </div>
                      <div className="CourseRowMeta">
                        <span><strong>Units:</strong> {unitsOf(course)}</span>
                        <span><strong>Prerequisite:</strong> {course.prerequisite_codes || 'None'}</span>
                      </div>
                    </div>

                    <div className="CourseRowAssignments">
                      <div className="CourseRowPrograms">
                        {programLabel(course)}
                      </div>
                      {uniqueAssignments.length > 0 ? (
                        uniqueAssignments.map((pair, idx) => (
                          <span key={idx} className="detailBadge" style={{ alignSelf: 'flex-start', margin: 0, fontSize: '0.75rem' }}>
                            {pair}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>No assignments</span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="CourseRowActions">
                        <button className="tableEditBtn" onClick={() => handleEdit(course)}>
                          <BiPencil /> Edit
                        </button>
                        <button className="tableDeleteBtn" onClick={() => handleDelete(course)}>
                          <BiTrash /> Archive
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(!isMobile || totalPages > 1) && (
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
          )}
        </>
      )}
    </div>
  );
}

export default ACourses;
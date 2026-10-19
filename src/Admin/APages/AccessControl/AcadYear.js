import React, { useState, useEffect, useCallback } from 'react';
import AddYear from '../../AComponents/AddModals/AddYear';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import { BiSearch, BiPlusCircle, BiCalendar, BiX, BiPencil, BiDotsVerticalRounded } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalCard.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import '../../../ResponsiveStyle/ResponsiveTable.css';

function AAcadYear() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [menuYearId, setMenuYearId] = useState(null); 

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = isMobile ? 10 : 15;

  const [confirmState, setConfirmState] = useState({ isOpen: false });

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
      onConfirm: closeConfirm,
      onCancel: closeConfirm,
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAcademicYears(data.data);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when searching or switching layouts
  useEffect(() => { setCurrentPage(1); }, [searchTerm, isMobile]);

  const handleAddSuccess = () => {
    setShowAdd(false);
    setEditingYear(null);
    fetchData();
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setShowAdd(true);
  };

  const handleSetActive = (year) => {
    openConfirm({
      title: 'Activate Academic Year',
      summary: (<>Set Academic Year <strong>{year.year_label}</strong> as active?</>),
      message: (<>The currently active academic year will be deactivated. All new enrollments and grade entries will default to this year.</>),
      variant: 'warning',
      confirmLabel: 'ACTIVATE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/academic-years/${year.year_id}/activate`,
            {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchData();
          } else {
            openAlert('Activation Failed', data.message || 'Failed to activate academic year.', 'danger');
          }
        } catch (error) {
          console.error("Error activating academic year:", error);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const handleSetSemester = (year, semesterId, semesterName) => {
    openConfirm({
      title: 'Set Current Semester',
      summary: (<>Set <strong>{semesterName}</strong> as the current term for AY {year.year_label}?</>),
      message: (<>All new enrollments and grade entries will default to this semester.</>),
      variant: 'info',
      confirmLabel: 'SET',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/academic-years/${year.year_id}/semester`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ current_sem: semesterId })
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchData();
          } else {
            openAlert('Update Failed', data.message || 'Failed to set semester.', 'danger');
          }
        } catch (error) {
          console.error("Error setting semester:", error);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const getAcademicYearStatus = (yearLabel, isActive) => {
    if (isActive) return 'current';
    const currentYear = new Date().getFullYear();
    const startYear = parseInt(yearLabel.split('-')[0]);
    if (startYear > currentYear) return 'future';
    return 'past';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'current': return 'Active';
      case 'future': return 'Inactive';
      case 'past': return 'Inactive';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'current': return 'active-bg';
      case 'future': return 'inactive-bg';
      case 'past': return 'inactive-bg';
      default: return '';
    }
  };

  const getTermStatusLabel = (status) => {
    switch (status) {
      case 'current': return 'Current Term';
      case 'future': return 'Future Term';
      case 'past': return 'Past Term';
      default: return '';
    }
  };

  const filteredYears = academicYears.filter(year =>
    year.year_label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredYears.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredYears.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const hasSearchResults = searchTerm && filteredYears.length === 0 && academicYears.length > 0;

  const semesters = [
    { id: 1, name: '1st Semester' },
    { id: 2, name: '2nd Semester' },
    { id: 3, name: 'Summer Term' }
  ];

  return (
    <div className="InnerContainer">
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

      {showAdd && (
        <AddYear
          onClose={() => { setShowAdd(false); setEditingYear(null); }}
          onSuccess={handleAddSuccess}
          yearToEdit={editingYear}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search academic year..."
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
            <BiPlusCircle className="linkIcon" /> Academic Year
          </button>
        </div>
      </div>

      <div className="CardsContainer">
        {loading ? (
          <div className="emptyState">
            <div className="emptyStateIcon">⏳</div>
            <h3 className="emptyStateTitle">Loading Academic Years</h3>
            <p className="emptyStateText">Please wait while we fetch the data...</p>
          </div>
        ) : filteredYears.length > 0 ? (
          currentItems.map((year) => {
            const status = getAcademicYearStatus(year.year_label, year.is_active);
            const statusLabel = getStatusLabel(status);
            const statusClass = getStatusClass(status);
            const termStatusLabel = getTermStatusLabel(status);

            return (
              <div className="Card RecordCard" key={year.year_id}>
                {isMobile ? (
                  /* --- MOBILE LAYOUT --- */
                  <div className="CardMain" style={{ alignItems: 'flex-start' }}>
                    <div className="cardContent">
                      
                      <div className="cardHeader" style={{ marginBottom: '8px' }}>
                        <span className="cardTitle" style={{ margin: 0 }}>
                          Academic Year {year.year_label}
                        </span>
                        <span className={`statusBadge ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      
                      <div className="CardDetails" style={{ marginTop: 0 }}>
                        <span className={`detailBadge ${status === 'current' ? 'current-bg' : status === 'future' ? 'future-bg' : 'past-bg'}`}>
                          {termStatusLabel}
                        </span>
                        {status === 'current' && semesters.map((sem) => (
                          <button
                            key={sem.id}
                            className={`detailBadge ${year.current_sem === sem.id ? 'active-semester' : 'inactive-semester'}`}
                            onClick={() => handleSetSemester(year, sem.id, sem.name)}
                          >
                            {sem.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className="RecordMenuBtn"
                      aria-label="Year actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuYearId(menuYearId === year.year_id ? null : year.year_id);
                      }}
                    >
                      <BiDotsVerticalRounded />
                    </button>

                    {menuYearId === year.year_id && (
                      <>
                        <div className="CardMenuBackdrop" onClick={(e) => { e.stopPropagation(); setMenuYearId(null); }} />
                        <div className="CardMenu" onClick={(e) => e.stopPropagation()}>
                          {status !== 'current' && status !== 'past' && (
                            <button onClick={() => { setMenuYearId(null); handleSetActive(year); }}>
                              <BiCalendar /> Set Active
                            </button>
                          )}
                          <button onClick={() => { setMenuYearId(null); handleEdit(year); }}>
                            <BiPencil /> Edit
                          </button>
                          {/* DELETE BUTTON REMOVED */}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* --- DESKTOP LAYOUT --- */
                  <div className="CardMain">
                    <div className={`cardIcon ${status === 'current' ? 'active' : 'inactive'}`}>
                      <BiCalendar />
                    </div>
                    <div className="cardContent">
                      <div className="cardHeader">
                        <span className={`statusBadge ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <h3 className="cardTitle">Academic Year {year.year_label}</h3>
                      <div className="CardDetails">
                        <span className={`detailBadge ${status === 'current' ? 'current-bg' : status === 'future' ? 'future-bg' : 'past-bg'}`}>
                          {termStatusLabel}
                        </span>
                        {status === 'current' && semesters.map((sem) => (
                          <button
                            key={sem.id}
                            className={`detailBadge ${year.current_sem === sem.id ? 'active-semester' : 'inactive-semester'}`}
                            onClick={() => handleSetSemester(year, sem.id, sem.name)}
                          >
                            {sem.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="CardAction">
                      {status !== 'current' && status !== 'past' && (
                        <button className="actionBtn activateBtn" onClick={() => handleSetActive(year)}>
                          Set Active
                        </button>
                      )}
                      <button className="actionBtn editBtn" onClick={() => handleEdit(year)}>
                        <BiPencil /> Edit
                      </button>
                      {/* DELETE BUTTON REMOVED */}
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
            <p className="emptyStateText">No academic years found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm("")}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📅</div>
            <h3 className="emptyStateTitle">No Academic Years Yet</h3>
            <p className="emptyStateText">Get started by creating your first academic year.</p>
            <button className="emptyStateBtn" onClick={() => setShowAdd(true)}>
              <BiPlusCircle className="linkIcon"/> Create Year
            </button>
          </div>
        )}
      </div>

  
      {!loading && filteredYears.length > (!isMobile || totalPages > 1) && (
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
    </div>
  );
}

export default AAcadYear;
import React, { useState, useEffect, useCallback } from 'react';
import './Curricula.css';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import { BiSearch, BiPlusCircle, BiX, BiBook, BiPencil, BiDotsVerticalRounded } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalCard.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import AddCurriculum from '../../AComponents/AddModals/AddCurriculum';

function ACurricula() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [menuCurriculumId, setMenuCurriculumId] = useState(null); 

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

  const fetchCurricula = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/curricula`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCurricula(data.data);
    } catch (err) {
      console.error("Error fetching curricula:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurricula(); }, [fetchCurricula]);

  // Reset to page 1 when searching or switching layouts
  useEffect(() => { setCurrentPage(1); }, [searchTerm, isMobile]);

  const handleAddSuccess = () => {
    setShowAdd(false);
    setEditingCurriculum(null);
    fetchCurricula();
  };

  const handleEdit = (curriculum) => {
    setEditingCurriculum(curriculum);
    setShowAdd(true);
  };

  const getCurriculumStatus = (isActive) => {
    if (isActive) return 'current';
    return 'inactive';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'current': return 'Active';
      case 'inactive': return 'Inactive';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'current': return 'active-bg';
      case 'inactive': return 'inactive-bg';
      default: return '';
    }
  };

  const filteredCurricula = curricula.filter(c =>
    c.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.start_year?.toString().includes(searchTerm.toLowerCase()) ||
    c.version_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredCurricula.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredCurricula.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const hasSearchResults = searchTerm && filteredCurricula.length === 0 && curricula.length > 0;

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
        <AddCurriculum
          onClose={() => {
            setShowAdd(false);
            setEditingCurriculum(null);
          }}
          onSuccess={handleAddSuccess}
          curriculumToEdit={editingCurriculum}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search curriculum..."
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
            <BiPlusCircle className="linkIcon" /> Curriculum
          </button>
        </div>
      </div>

      <div className="CardsContainer">
        {loading ? (
          <div className="emptyState">
            <div className="emptyStateIcon">⏳</div>
            <h3 className="emptyStateTitle">Loading Curricula</h3>
            <p className="emptyStateText">Please wait while we fetch the data...</p>
          </div>
        ) : filteredCurricula.length > 0 ? (
          currentItems.map((curriculum) => {
            const status = getCurriculumStatus(curriculum.is_active);
            const statusLabel = getStatusLabel(status);
            const statusClass = getStatusClass(status);

            return (
              <div className="Card RecordCard" key={curriculum.curriculum_id}>
                {isMobile ? (
                  /* --- MOBILE LAYOUT --- */
                  <div className="CardMain" style={{ alignItems: 'flex-start' }}>
                    <div className="cardContent">
                      
                      <div className="cardHeader" style={{ marginBottom: '8px' }}>
                        <span className="cardTitle" style={{ margin: 0 }}>
                          {curriculum.program_name}
                        </span>
                        <span className={`statusBadge ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      
                      <div className="CardDetails" style={{ marginTop: 0 }}>
                        <span className="detailBadge">From: {curriculum.start_year}</span>
                        <span className="detailBadge">Version: {curriculum.version_name}</span>
                        <span className="detailBadge">Courses: {curriculum.course_count || 0}</span>
                      </div>
                    </div>

                    <button
                      className="RecordMenuBtn"
                      aria-label="Curriculum actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuCurriculumId(menuCurriculumId === curriculum.curriculum_id ? null : curriculum.curriculum_id);
                      }}
                    >
                      <BiDotsVerticalRounded />
                    </button>

                    {menuCurriculumId === curriculum.curriculum_id && (
                      <>
                        <div
                          className="CardMenuBackdrop"
                          onClick={(e) => { e.stopPropagation(); setMenuCurriculumId(null); }}
                        />
                        <div className="CardMenu" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setMenuCurriculumId(null); handleEdit(curriculum); }}>
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
                      <BiBook />
                    </div>
                    <div className="cardContent">
                      <div className="cardHeader">
                        <span className={`statusBadge ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <h3 className="cardTitle">{curriculum.program_name}</h3>
                      <div className="CardDetails">
                        <span className="detailBadge">From: {curriculum.start_year}</span>
                        <span className="detailBadge">Version: {curriculum.version_name}</span>
                        <span className="detailBadge">Courses: {curriculum.course_count || 0}</span>
                      </div>
                    </div>
                    <div className="CardAction">
                      <button className="actionBtn editBtn" onClick={() => handleEdit(curriculum)}>
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
            <p className="emptyStateText">No curricula found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm("")}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📚</div>
            <h3 className="emptyStateTitle">No Curricula Yet</h3>
            <p className="emptyStateText">Get started by creating your first curriculum.</p>
            <button className="emptyStateBtn" onClick={() => setShowAdd(true)}>
              <BiPlusCircle className="linkIcon"/> Create Curriculum
            </button>
          </div>
        )}
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      {!loading && filteredCurricula.length > 0 && (
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

export default ACurricula;
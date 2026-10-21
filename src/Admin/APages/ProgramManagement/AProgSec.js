import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BiSearch, BiPlusCircle, BiX, BiPencil, BiTrash, BiUndo, BiBook, BiDotsVerticalRounded
} from 'react-icons/bi';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import AddProgram from '../../AComponents/AddModals/AddProgram';
import AddSection from '../../AComponents/AddModals/AddSection';
import Dropdown from '../../../Components/Dropdown'; // <-- Import Dropdown
import useMediaQuery from '../../../Components/useMediaQuery';
import '../../../GlobalStyle/Global.css';
import '../../../GlobalStyle/GlobalCard.css';
import '../../../GlobalStyle/ProgSec.css';
import '../../../GlobalStyle/GlobalEmpty.css';
import '../../../ResponsiveStyle/ResponsiveTable.css';

function AProgSec() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [searchProgram, setSearchProgram] = useState('');
  const [searchSection, setSearchSection] = useState('');
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [confirmState, setConfirmState] = useState({ isOpen: false });

  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';
  const closeConfirm = () => setConfirmState({ isOpen: false });
  const [menuSectionId, setMenuSectionId] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = isMobile ? 5 : 10;

  // Reset page on search or when program changes
  useEffect(() => { setCurrentPage(1); }, [searchSection, selectedProgram, isMobile]);

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

  const token = () => sessionStorage.getItem('token');

  const fetchPrograms = useCallback(async () => {
    setLoadingPrograms(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/programs?includeArchived=true`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const data = await res.json();
      if (data.success) setPrograms(data.data);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  useEffect(() => {
    if (selectedProgram) {
      const stillThere = programs.find(p => p.program_id === selectedProgram.program_id);
      if (stillThere) setSelectedProgram(stillThere);
      else { setSelectedProgram(null); setSections([]); }
    }
  }, [programs]);

  const fetchSections = useCallback(async (programId) => {
    if (!programId) { setSections([]); return; }
    setLoadingSections(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/sections/by-program/${programId}?includeArchived=true`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const data = await res.json();
      if (data.success) setSections(data.data);
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setLoadingSections(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProgram) fetchSections(selectedProgram.program_id);
  }, [selectedProgram, fetchSections]);

  const handleProgramSuccess = () => {
    setShowAddProgram(false);
    setEditingProgram(null);
    fetchPrograms();
  };

  const handleSectionSuccess = () => {
    setShowAddSection(false);
    setEditingSection(null);
    if (selectedProgram) fetchSections(selectedProgram.program_id);
  };

  const handleArchiveProgram = (program) => {
    openConfirm({
      title: 'Archive Program',
      summary: <>Archive <strong>{program.program_name}</strong>?</>,
      message: <> <span style={{ color: '#c62828' }}>The program will be hidden from all pickers. Curricula, sections, and student records stay intact.</span></>,
      variant: 'danger',
      confirmLabel: 'ARCHIVE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/programs/${program.program_id}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            if (selectedProgram?.program_id === program.program_id) {
              setSelectedProgram(null);
              setSections([]);
            }
            fetchPrograms();
          } else {
            openAlert('Archive Failed', data.message || 'Failed to archive program.', 'danger');
          }
        } catch (err) {
          console.error('Error archiving program:', err);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const handleRestoreProgram = (program) => {
    openConfirm({
      title: 'Restore Program',
      summary: <>Restore <strong>{program.program_name}</strong>?</>,
      message: <>The program will be visible again in all program pickers.</>,
      variant: 'info',
      confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/programs/${program.program_id}/restore`,
            { method: 'POST', headers: { Authorization: `Bearer ${token()}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) fetchPrograms();
          else openAlert('Restore Failed', data.message || 'Failed to restore program.', 'danger');
        } catch (err) {
          console.error('Error restoring program:', err);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const handleArchiveSection = (section) => {
    openConfirm({
      title: 'Archive Section',
      summary: <>Archive <strong>{section.section_name}</strong>?</>,
      message: <>The section will be hidden from section pickers. Students assigned to it keep their assignment until reassigned.</>,
      variant: 'danger',
      confirmLabel: 'ARCHIVE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/section-assignments/${section.assignment_id}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            if (selectedProgram) fetchSections(selectedProgram.program_id);
          } else {
            openAlert('Archive Failed', data.message || 'Failed to archive section.', 'danger');
          }
        } catch (err) {
          console.error('Error archiving section:', err);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const handleRestoreSection = (section) => {
    openConfirm({
      title: 'Restore Section',
      summary: <>Restore <strong>{section.section_name}</strong>?</>,
      message: <>The section will be visible again in section pickers.</>,
      variant: 'info',
      confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/section-assignments/${section.assignment_id}/restore`,
            { method: 'POST', headers: { Authorization: `Bearer ${token()}` } }
          );
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            if (selectedProgram) fetchSections(selectedProgram.program_id);
          } else {
            openAlert('Restore Failed', data.message || 'Failed to restore section.', 'danger');
          }
        } catch (err) {
          console.error('Error restoring section:', err);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const filteredPrograms = useMemo(() => programs.filter(p =>
    !searchProgram ||
    p.program_name?.toLowerCase().includes(searchProgram.toLowerCase()) ||
    p.program_abbr?.toLowerCase().includes(searchProgram.toLowerCase())
  ), [programs, searchProgram]);

  const filteredSections = useMemo(() => {
    const term = searchSection.toLowerCase();
    return sections.filter(s =>
      !term ||
      s.section_name?.toLowerCase().includes(term) ||
      s.year_level?.toLowerCase().includes(term) ||
      s.semester_label?.toLowerCase().includes(term)
    );
  }, [sections, searchSection]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredSections.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredSections.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  // Prepare options for mobile Dropdown
  const mobileProgramOptions = programs.map(p => ({
    value: p.program_id,
    label: `${p.program_abbr}${p.program_status === false ? ' (Archived)' : ''}`
  }));

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

      {showAddProgram && (
        <AddProgram
          onClose={() => { setShowAddProgram(false); setEditingProgram(null); }}
          onSuccess={handleProgramSuccess}
          programToEdit={editingProgram}
        />
      )}

      {showAddSection && (
        <AddSection
          onClose={() => { setShowAddSection(false); setEditingSection(null); }}
          onSuccess={handleSectionSuccess}
          sectionToEdit={editingSection}
          programId={selectedProgram?.program_id}
          programName={selectedProgram?.program_name}
          programAbbr={selectedProgram?.program_abbr}
        />
      )}
      
      {isMobile && (
        <div className="ProgPickerRow">
          <Dropdown
            options={mobileProgramOptions}
            value={selectedProgram?.program_id ?? ''}
            onChange={(val) => {
              const p = programs.find((x) => String(x.program_id) === String(val));
              setSelectedProgram(p || null);
            }}
            disabled={loadingPrograms}
            placeholder={loadingPrograms ? 'Loading…' : 'Select a program'}
          />
          {isAdmin && (
            <button
              className="TopbarBtn ProgAddBtn"
              aria-label="Add program"
              onClick={() => { setEditingProgram(null); setShowAddProgram(true); }}
            >
              <BiPlusCircle className="linkIcon" />
              Program
            </button>
          )}
        </div>
      )}
      
      <div className="ProgSecSplit DocSplitView">
        {!isMobile && (
        <aside className="ProgSidebar DocListPanel">
          <div className="ProgSidebarHeader">
            <div className="SearchWrapper">
              <BiSearch className="SearchIcon" />
              <input
                type="text"
                placeholder="Search programs"
                className="SearchInput"
                value={searchProgram}
                onChange={(e) => setSearchProgram(e.target.value)}
              />
              {searchProgram && <BiX className="ClearSearchIcon" onClick={() => setSearchProgram('')} />}
            </div>
            {isAdmin && (
              <button
                className="TopbarBtn"
                onClick={() => { setEditingProgram(null); setShowAddProgram(true); }}
                title="Add a new program"
              >
                <BiPlusCircle className="linkIcon" />
                Program
              </button>
            )}
          </div>

          <div className="DocStudentList">
            {loadingPrograms ? (
              <p className="DocListMessage">Loading…</p>
            ) : filteredPrograms.length === 0 ? (
              <p className="DocListMessage">No programs found</p>
            ) : (
              filteredPrograms.map((p) => {
                const selected = selectedProgram?.program_id === p.program_id;
                const archived = p.program_status === false;
                return (
                  <div
                    key={p.program_id}
                    className={`DocStudentRow ${selected ? 'Active' : ''}`}
                    onClick={() => setSelectedProgram(p)}
                    style={{ opacity: archived && !selected ? 0.6 : 1 }}
                  >
                    <div className="DocStudentRowContent">
                      <p className="DocStudentName">
                        {p.program_name}
                        {archived && <span className="ArchivedTag">Archived</span>}
                      </p>
                      <p className="DocStudentMeta">
                        {p.program_abbr} &middot; {p.total_year} years
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
        )}

        <main className="ProgDetail">
          {!selectedProgram ? (
            <div className="emptyState">
              <div className="emptyStateIcon">📓</div>
              <h3 className="emptyStateTitle">Select a Program</h3>
              <p className="emptyStateText">Choose a program on the left to view and manage its sections.</p>
            </div>
          ) : (
            <>
              <header className="ProgDetailHeader">
                <div className="ProgDetailTitle">
                  <h2>{selectedProgram.program_name}</h2>
                  <div className="ProgDetailMeta">
                    <span className={`statusBadge ${selectedProgram.program_status ? 'active-bg' : 'inactive-bg'}`}>
                      {selectedProgram.program_status ? 'Active' : 'Archived'}
                    </span>
                    <span className="ProgDetailMetaText">
                      {selectedProgram.program_abbr} &middot; {selectedProgram.total_year} years
                    </span>
                  </div>
                </div>
                <div className="ProgDetailActions">
                  {isAdmin && (
                      <>
                        <button
                          className="actionBtn editBtn"
                          onClick={() => { setEditingProgram(selectedProgram); setShowAddProgram(true); }}
                        >
                          <BiPencil /> Edit
                        </button>

                        {selectedProgram.program_status === false ? (
                          <button className="actionBtn restoreBtn" onClick={() => handleRestoreProgram(selectedProgram)}>
                            <BiUndo /> Restore
                          </button>
                        ) : (
                          <button className="actionBtn deleteBtn" onClick={() => handleArchiveProgram(selectedProgram)}>
                            <BiTrash /> Archive
                          </button>
                        )}
                      </>
                    )}
                </div>
              </header>

              <div className="SectionToolbar">
                <div className="SearchWrapper">
                  <BiSearch className="SearchIcon" />
                  <input
                    type="text"
                    placeholder="Search sections"
                    className="SearchInput"
                    value={searchSection}
                    onChange={(e) => setSearchSection(e.target.value)}
                  />
                  {searchSection && <BiX className="ClearSearchIcon" onClick={() => setSearchSection('')} />}
                </div>
                {isAdmin && (
                  <button
                    className="TopbarBtn"
                    onClick={() => { setEditingSection(null); setShowAddSection(true); }}
                    disabled={selectedProgram.program_status === false}
                  >
                    <BiPlusCircle className="linkIcon" />
                    Section
                  </button>
                )}
              </div>
              {isMobile ? (
                <div className="CardsContainer RecordCards">
                  {loadingSections ? (
                    <p className="DocListMessage">Loading sections…</p>
                  ) : filteredSections.length === 0 ? (
                    <p className="DocListMessage">
                      {searchSection ? `No sections matching "${searchSection}"` : 'No sections yet.'}
                    </p>
                  ) : (
                    currentItems.map((sec) => {
                      const archived = sec.is_active === false;
                      return (
                        <div key={sec.assignment_id} className={`Card RecordCard${archived ? ' archived' : ''}`}>
                          <div className="CardMain">
                            <div className="cardContent">
                              <div className="cardHeader">
                                <span className="cardTitle">{sec.section_name}</span>
                              </div>
                              <div className="CardDetails">
                                <span className="detailBadge">{sec.year_level}</span>
                                <span className="detailBadge">{sec.semester_label}</span>
                                <span className="detailBadge">{sec.student_count ?? 0} students</span>
                                {archived && <span className="detailBadge">Archived</span>}
                              </div>
                            </div>

                            {isAdmin && (
                              <button
                                className="RecordMenuBtn"
                                aria-label="Section actions"
                                onClick={() => setMenuSectionId(menuSectionId === sec.assignment_id ? null : sec.assignment_id)}
                              >
                                <BiDotsVerticalRounded />
                              </button>
                            )}
                          </div>

                          {isAdmin && menuSectionId === sec.assignment_id && (
                            <>
                              <div className="CardMenuBackdrop" onClick={() => setMenuSectionId(null)} />
                              <div className="CardMenu">
                                {archived ? (
                                  <button onClick={() => { setMenuSectionId(null); handleRestoreSection(sec); }}>
                                    <BiUndo /> Restore
                                  </button>
                                ) : (
                                  <>
                                    <button onClick={() => { setMenuSectionId(null); setEditingSection(sec); setShowAddSection(true); }}>
                                      <BiPencil /> Edit
                                    </button>
                                    <button className="danger" onClick={() => { setMenuSectionId(null); handleArchiveSection(sec); }}>
                                      <BiTrash /> Archive
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
              <div className="TableContainer">
                <table className="Table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Year</th>
                      <th>Semester</th>
                      <th>Students</th>
                      {isAdmin && <th style={{ width: '140px' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSections ? (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                          Loading sections…
                        </td>
                      </tr>
                    ) : filteredSections.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                          {searchSection
                              ? `No sections matching "${searchSection}"`
                            : isAdmin
                              ? 'No sections yet. Click "Section" above to add one.'
                              : 'No sections yet.'}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((sec) => {
                        const archived = sec.is_active === false;
                        return (
                          <tr key={sec.assignment_id} className={archived ? 'rowArchived' : ''}>
                            <td>
                              {sec.section_name}
                              {archived && <span className="ArchivedTag">Archived</span>}
                            </td>
                            <td>{sec.year_level}</td>
                            <td>{sec.semester_label}</td>
                            <td>{sec.student_count ?? 0}</td>
                            {isAdmin && (
                              <td className="tableActions">
                                {archived ? (
                                  <button className="tableEditBtn" onClick={() => handleRestoreSection(sec)}>
                                    <BiUndo /> Restore
                                  </button>
                                ) : (
                                  <>
                                    <button className="tableEditBtn" onClick={() => { setEditingSection(sec); setShowAddSection(true); }} title="Edit section">
                                      <BiPencil /> Edit
                                    </button>
                                    <button className="tableDeleteBtn" onClick={() => handleArchiveSection(sec)} title="Archive section">
                                      <BiTrash /> Archive
                                    </button>
                                  </>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            
            {!loadingSections && filteredSections.length > (!isMobile || totalPages > 1) && (
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
        </main>
      </div>
    </div>
  );
}

export default AProgSec;
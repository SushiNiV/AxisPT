import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BiSearch, BiPlusCircle, BiX, BiPencil, BiTrash, BiRevision, BiBook
} from 'react-icons/bi';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import AddProgram from '../../AComponents/AddModals/AddProgram';
import AddSection from '../../AComponents/AddModals/AddSection';
import '../../../Global.css';
import '../../../GlobalCard.css';
import '../../../ProgSec.css';
import '../../../GlobalEmpty.css';

function AProgSec() {
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [searchProgram, setSearchProgram] = useState('');
  const [searchSection, setSearchSection] = useState('');

  const [showArchivedPrograms, setShowArchivedPrograms] = useState(false);
  const [showArchivedSections, setShowArchivedSections] = useState(false);

  const [showAddProgram, setShowAddProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

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

  const token = () => sessionStorage.getItem('token');

  const fetchPrograms = useCallback(async () => {
    setLoadingPrograms(true);
    try {
      const qs = showArchivedPrograms ? '?includeArchived=true' : '';
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs${qs}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (data.success) setPrograms(data.data);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoadingPrograms(false);
    }
  }, [showArchivedPrograms]);

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
      const qs = showArchivedSections ? '?includeArchived=true' : '';
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/sections/by-program/${programId}${qs}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const data = await res.json();
      if (data.success) setSections(data.data);
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setLoadingSections(false);
    }
  }, [showArchivedSections]);

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
      message: <>The program will be hidden from all pickers. Curricula, sections, and student records stay intact.</>,
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

  const filteredSections = useMemo(() => sections.filter(s =>
    !searchSection ||
    s.section_name?.toLowerCase().includes(searchSection.toLowerCase())
  ), [sections, searchSection]);

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
        />
      )}

      <div className="ProgSecSplit DocSplitView">
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
            <button
              className="TopbarBtn"
              onClick={() => { setEditingProgram(null); setShowAddProgram(true); }}
              title="Add a new program"
            >
              <BiPlusCircle className="linkIcon" />
              Program
            </button>
          </div>

          <div className="ProgSidebarToggle">
            <button
              className={`SidebarToggleBtn ${showArchivedPrograms ? 'active' : ''}`}
              onClick={() => setShowArchivedPrograms((v) => !v)}
            >
              <BiRevision />
              {showArchivedPrograms ? 'Hide Archived' : 'Show Archived'}
            </button>
          </div>

          <ul className="ProgList">
            {loadingPrograms ? (
              <li className="ProgListItemEmpty">Loading…</li>
            ) : filteredPrograms.length === 0 ? (
              <li className="ProgListItemEmpty">No programs found</li>
            ) : (
              filteredPrograms.map((p) => {
                const selected = selectedProgram?.program_id === p.program_id;
                const archived = p.program_status === false;
                return (
                  <li
                    key={p.program_id}
                    className={`ProgListItem ${selected ? 'selected' : ''} ${archived ? 'archived' : ''}`}
                    onClick={() => setSelectedProgram(p)}
                  >
                    <div className="ProgItemTitle">{p.program_name}</div>
                    <div className="ProgItemSub">
                      {p.program_abbr} &middot; {p.total_year} years
                      {archived && <span className="ArchivedTag">Archived</span>}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <main className="ProgDetail">
          {!selectedProgram ? (
            <div className="emptyState">
              <div className="emptyStateIcon"><BiBook /></div>
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
                  {selectedProgram.program_status === false ? (
                    <button className="actionBtn restoreBtn" onClick={() => handleRestoreProgram(selectedProgram)}>
                      <BiRevision /> Restore
                    </button>
                  ) : (
                    <>
                      <button className="actionBtn editBtn" onClick={() => { setEditingProgram(selectedProgram); setShowAddProgram(true); }}>
                        <BiPencil /> Edit
                      </button>
                      <button className="actionBtn deleteBtn" onClick={() => handleArchiveProgram(selectedProgram)}>
                        <BiTrash /> Archive
                      </button>
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
                <button
                  className={`SidebarToggleBtn ${showArchivedSections ? 'active' : ''}`}
                  onClick={() => setShowArchivedSections((v) => !v)}
                >
                  <BiRevision />
                  {showArchivedSections ? 'Hide Archived' : 'Show Archived'}
                </button>
                <button
                  className="TopbarBtn"
                  onClick={() => { setEditingSection(null); setShowAddSection(true); }}
                  disabled={selectedProgram.program_status === false}
                >
                  <BiPlusCircle className="linkIcon" />
                  Section
                </button>
              </div>

              <div className="TableContainer">
                <table className="Table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Year</th>
                      <th>Semester</th>
                      <th>Students</th>
                      <th style={{ width: '140px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSections ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Loading sections…</td></tr>
                    ) : filteredSections.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No sections {showArchivedSections ? '' : 'yet'}.</td></tr>
                    ) : (
                      filteredSections.map((sec) => {
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
                            <td className="tableActions">
                              {archived ? (
                                <button className="tableEditBtn" onClick={() => handleRestoreSection(sec)}>
                                  <BiRevision /> Restore
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
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default AProgSec;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BiSearch, BiPlus, BiX, BiPencil, BiTrash, BiUndo, BiBook, BiChevronRight
} from 'react-icons/bi';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import AddProgram from '../../AComponents/AddModals/AddProgram';
import AddSection from '../../AComponents/AddModals/AddSection';
import useMediaQuery from '../../../Components/useMediaQuery';
import Button from '../../../Components/ui/Button';
import Badge from '../../../Components/ui/Badge';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';
import BottomSheet from '../../../Components/ui/Bottomsheet';

const TH = 'sticky top-0 z-10 border-b !border-line bg-surface-2 px-3 py-3 text-xs font-semibold text-ink-2';

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
  
  const [sheetSection, setSheetSection] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false });

  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';
  const closeConfirm = () => setConfirmState({ isOpen: false });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = isMobile ? 10 : 15;

  useEffect(() => { setCurrentPage(1); }, [searchSection, selectedProgram, isMobile]);

  const openConfirm = (config) => {
    setConfirmState({
      isOpen: true, variant: 'info', confirmLabel: 'CONFIRM', cancelLabel: 'CANCEL', isAlert: false, loading: false,
      ...config,
    });
  };

  const openAlert = (title, message, variant = 'info') => {
    setConfirmState({
      isOpen: true, title, message, variant, isAlert: true,
      onConfirm: closeConfirm, onCancel: closeConfirm,
    });
  };

  const token = () => sessionStorage.getItem('token');

  const fetchPrograms = useCallback(async () => {
    setLoadingPrograms(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs?includeArchived=true`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setPrograms(data.data);
    } catch (err) { console.error('Error fetching programs:', err); } 
    finally { setLoadingPrograms(false); }
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/sections/by-program/${programId}?includeArchived=true`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setSections(data.data);
    } catch (err) { console.error('Error fetching sections:', err); } 
    finally { setLoadingSections(false); }
  }, []);

  useEffect(() => { if (selectedProgram) fetchSections(selectedProgram.program_id); }, [selectedProgram, fetchSections]);

  const handleProgramSuccess = () => { setShowAddProgram(false); setEditingProgram(null); fetchPrograms(); };
  const handleSectionSuccess = () => { setShowAddSection(false); setEditingSection(null); if (selectedProgram) fetchSections(selectedProgram.program_id); };

  const handleArchiveProgram = (program) => {
    openConfirm({
      title: 'Archive Program', summary: <>Archive <strong>{program.program_name}</strong>?</>,
      message: <span className="text-danger text-sm">The program will be hidden from all pickers. Curricula, sections, and student records stay intact.</span>,
      variant: 'danger', confirmLabel: 'ARCHIVE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs/${program.program_id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            if (selectedProgram?.program_id === program.program_id) { setSelectedProgram(null); setSections([]); }
            fetchPrograms();
          } else openAlert('Archive Failed', data.message || 'Failed to archive program.', 'danger');
        } catch (err) {
          setConfirmState({ isOpen: false }); openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      }, onCancel: closeConfirm,
    });
  };

  const handleRestoreProgram = (program) => {
    openConfirm({
      title: 'Restore Program', summary: <>Restore <strong>{program.program_name}</strong>?</>,
      message: <>The program will be visible again in all program pickers.</>, variant: 'info', confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs/${program.program_id}/restore`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) fetchPrograms();
          else openAlert('Restore Failed', data.message || 'Failed to restore program.', 'danger');
        } catch (err) { setConfirmState({ isOpen: false }); openAlert('Error', 'An unexpected error occurred.', 'danger'); }
      }, onCancel: closeConfirm,
    });
  };

  const handleArchiveSection = (section) => {
    openConfirm({
      title: 'Archive Section', summary: <>Archive <strong>{section.section_name}</strong>?</>,
      message: <>The section will be hidden from section pickers. Students assigned to it keep their assignment until reassigned.</>,
      variant: 'danger', confirmLabel: 'ARCHIVE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/section-assignments/${section.assignment_id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) { if (selectedProgram) fetchSections(selectedProgram.program_id); }
          else openAlert('Archive Failed', data.message || 'Failed to archive section.', 'danger');
        } catch (err) { setConfirmState({ isOpen: false }); openAlert('Error', 'An unexpected error occurred.', 'danger'); }
      }, onCancel: closeConfirm,
    });
  };

  const handleRestoreSection = (section) => {
    openConfirm({
      title: 'Restore Section', summary: <>Restore <strong>{section.section_name}</strong>?</>,
      message: <>The section will be visible again in section pickers.</>, variant: 'info', confirmLabel: 'RESTORE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/section-assignments/${section.assignment_id}/restore`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
          const data = await res.json();
          setConfirmState({ isOpen: false });
          if (data.success) { if (selectedProgram) fetchSections(selectedProgram.program_id); }
          else openAlert('Restore Failed', data.message || 'Failed to restore section.', 'danger');
        } catch (err) { setConfirmState({ isOpen: false }); openAlert('Error', 'An unexpected error occurred.', 'danger'); }
      }, onCancel: closeConfirm,
    });
  };

  const filteredPrograms = useMemo(() => programs.filter(p => !searchProgram || p.program_name?.toLowerCase().includes(searchProgram.toLowerCase()) || p.program_abbr?.toLowerCase().includes(searchProgram.toLowerCase())), [programs, searchProgram]);

  const filteredSections = useMemo(() => {
    const term = searchSection.toLowerCase();
    return sections.filter(s => !term || s.section_name?.toLowerCase().includes(term) || s.year_level?.toLowerCase().includes(term) || s.semester_label?.toLowerCase().includes(term));
  }, [sections, searchSection]);

  const totalPages = Math.ceil(filteredSections.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredSections.slice(indexOfFirstItem, indexOfLastItem);

  const runFromSheet = (action) => {
    const sec = sheetSection;
    setSheetSection(null);
    if (sec) action(sec);
  };

  return (
    <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4 relative">
      <ConfirmationModal {...confirmState} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />
      
      {showAddProgram && <AddProgram onClose={() => { setShowAddProgram(false); setEditingProgram(null); }} onSuccess={handleProgramSuccess} programToEdit={editingProgram} />}
      {showAddSection && <AddSection onClose={() => { setShowAddSection(false); setEditingSection(null); }} onSuccess={handleSectionSuccess} sectionToEdit={editingSection} programId={selectedProgram?.program_id} programName={selectedProgram?.program_name} programAbbr={selectedProgram?.program_abbr} />}
      
      {/* Mobile Program Picker */}
      {isMobile && (
        <div className="flex shrink-0 items-center gap-2">
          <select 
            className="h-10 flex-1 appearance-none rounded-ctl border !border-line bg-surface px-3 text-base text-ink focus-visible:border-brand focus-visible:outline-none sm:text-sm"
            value={selectedProgram?.program_id || ''}
            onChange={(e) => { const p = programs.find((x) => String(x.program_id) === String(e.target.value)); setSelectedProgram(p || null); }}
            disabled={loadingPrograms}
          >
            <option value="">{loadingPrograms ? 'Loading…' : 'Select a program'}</option>
            {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_abbr} {p.program_status === false ? '(Archived)' : ''}</option>)}
          </select>
          {isAdmin && (
            <Button onClick={() => { setEditingProgram(null); setShowAddProgram(true); }} aria-label="Add program" className="shrink-0 !px-3 sm:!px-4">
              <BiPlus className="text-xl" aria-hidden="true" />
              <span className="hidden sm:inline">Program</span>
            </Button>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-panel border !border-line bg-surface lg:w-[340px]">
            {/* Sidebar Toolbar */}
            <div className="flex shrink-0 items-center gap-2 border-b !border-line p-3">
               <div className="relative flex-1">
                  <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
                  <input 
                    type="text" 
                    placeholder="Search programs" 
                    className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm" 
                    value={searchProgram} 
                    onChange={(e) => setSearchProgram(e.target.value)} 
                  />
                  {searchProgram && (
                    <button onClick={() => setSearchProgram('')} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
                      <BiX />
                    </button>
                  )}
               </div>
               {isAdmin && (
                 <Button onClick={() => { setEditingProgram(null); setShowAddProgram(true); }} aria-label="Add program" className="shrink-0 !px-3 sm:!px-4">
                   <BiPlus className="text-xl" aria-hidden="true" />
                   <span className="hidden sm:inline">Program</span>
                 </Button>
               )}
            </div>
            
            {/* Programs List */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {loadingPrograms ? <p className="p-4 text-center text-sm text-ink-3">Loading…</p> : filteredPrograms.length === 0 ? <p className="p-4 text-center text-sm text-ink-3">No programs found</p> : (
                filteredPrograms.map((p) => {
                  const selected = selectedProgram?.program_id === p.program_id;
                  const archived = p.program_status === false;
                  return (
                    <button key={p.program_id} onClick={() => setSelectedProgram(p)} className={`flex w-full flex-col gap-1 border-t !border-line p-3.5 text-left transition-colors hover:bg-surface-2 ${selected ? 'bg-brand-soft' : ''} ${archived && !selected ? 'opacity-60' : ''}`}>
                      <p className={`font-semibold text-sm ${selected ? 'text-brand-ink' : 'text-ink'}`}>
                        {p.program_name} {archived && <Badge tone="neutral" className="ml-2">Archived</Badge>}
                      </p>
                      <p className={`text-xs ${selected ? 'text-brand-ink/80' : 'text-ink-2'}`}>{p.program_abbr} &middot; {p.total_year} years</p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Main Detail Content */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          {!selectedProgram ? (
            <div className="flex h-full flex-1 items-center justify-center">
              <EmptyState 
                icon={BiBook} 
                title="Select a Program" 
                text="Choose a program on the left to view and manage its sections." 
                className="!border-0 !bg-transparent !shadow-none h-full w-full"
              />
            </div>
          ) : (
            <>
              <header className="flex shrink-0 flex-col justify-between gap-4 border-b !border-line p-5 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-display text-2xl text-ink">{selectedProgram.program_name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <Badge tone={selectedProgram.program_status ? 'ok' : 'neutral'}>{selectedProgram.program_status ? 'Active' : 'Archived'}</Badge>
                    <span className="text-ink-2">{selectedProgram.program_abbr} &middot; {selectedProgram.total_year} years</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isAdmin && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => { setEditingProgram(selectedProgram); setShowAddProgram(true); }}><BiPencil className="text-base"/> Edit</Button>
                      {selectedProgram.program_status === false ? (
                        <Button size="sm" variant="secondary" onClick={() => handleRestoreProgram(selectedProgram)}><BiUndo className="text-base"/> Restore</Button>
                      ) : (
                        <Button size="sm" variant="danger" onClick={() => handleArchiveProgram(selectedProgram)}><BiTrash className="text-base"/> Archive</Button>
                      )}
                    </>
                  )}
                </div>
              </header>

              {/* Sections Toolbar */}
              <div className="flex shrink-0 items-center gap-2 p-3 border-b !border-line">
                <div className="relative min-w-0 flex-1">
                   <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
                   <input 
                     type="text" 
                     placeholder="Search sections" 
                     className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm" 
                     value={searchSection} 
                     onChange={(e) => setSearchSection(e.target.value)} 
                   />
                   {searchSection && (
                     <button onClick={() => setSearchSection('')} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
                       <BiX />
                     </button>
                   )}
                </div>
                {isAdmin && (
                  <Button onClick={() => { setEditingSection(null); setShowAddSection(true); }} disabled={selectedProgram.program_status === false} className="shrink-0 !px-3 sm:!px-4 ml-auto">
                    <BiPlus className="text-xl" aria-hidden="true" />
                    <span className="hidden sm:inline">Section</span>
                  </Button>
                )}
              </div>

              {/* Sections Results */}
              <div className="min-h-0 flex-1 overflow-hidden">
                {loadingSections ? (
                  <p className="p-6 text-center text-sm text-ink-3">Loading sections…</p>
                ) : filteredSections.length === 0 ? (
                  <div className="py-12"><EmptyState icon={BiBook} title="No sections found" text={searchSection ? `No sections matching "${searchSection}"` : "This program doesn't have any sections yet."} /></div>
                ) : isMobile ? (
                  <ul className="divide-y divide-line overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden h-full">
                    {currentItems.map(sec => (
                       <li key={sec.assignment_id} className={`flex items-center gap-3 px-3 ${sec.is_active === false ? 'opacity-60' : ''}`}>
                         <button onClick={() => setSheetSection(sec)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                           <span className="min-w-0 flex-1">
                             <span className="block truncate font-medium text-ink">
                               {sec.section_name}
                               {sec.is_active === false && <Badge className="ml-2">Archived</Badge>}
                             </span>
                             <span className="block truncate text-xs text-ink-2">{sec.year_level} &middot; {sec.semester_label}</span>
                             <span className="block truncate text-xs text-ink-2">{sec.student_count ?? 0} students</span>
                           </span>
                           <BiChevronRight aria-hidden="true" className="shrink-0 text-xl text-ink-3" />
                         </button>
                       </li>
                    ))}
                  </ul>
                ) : (
                  <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden h-full">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                      <thead>
                        <tr>
                          <th scope="col" className={TH}>Section</th>
                          <th scope="col" className={TH}>Year</th>
                          <th scope="col" className={TH}>Semester</th>
                          <th scope="col" className={TH}>Students</th>
                          {isAdmin && <th scope="col" className={`${TH} w-44`}><span className="sr-only">Actions</span></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map(sec => (
                          <tr key={sec.assignment_id} className={`border-t !border-line transition-colors hover:bg-surface-2 ${sec.is_active === false ? 'opacity-60' : ''}`}>
                            <td className="px-3 py-3 font-medium text-ink">
                              {sec.section_name} 
                              {sec.is_active === false && <Badge className="ml-2">Archived</Badge>}
                            </td>
                            <td className="px-3 py-3 text-ink-2">{sec.year_level}</td>
                            <td className="px-3 py-3 text-ink-2">{sec.semester_label}</td>
                            <td className="px-3 py-3 text-ink-2 tabular-nums">{sec.student_count ?? 0}</td>
                            {isAdmin && (
                              <td className="py-2 pl-3 pr-3">
                                <div className="flex items-center justify-end gap-2">
                                  {sec.is_active === false ? (
                                    <Button size="sm" variant="secondary" onClick={() => handleRestoreSection(sec)}><BiUndo className="text-base"/> Restore</Button>
                                  ) : (
                                    <>
                                      <Button size="sm" variant="secondary" onClick={() => { setEditingSection(sec); setShowAddSection(true); }}><BiPencil className="text-base"/> Edit</Button>
                                      <Button size="sm" variant="danger" onClick={() => handleArchiveSection(sec)}><BiTrash className="text-base"/> Archive</Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {!loadingSections && filteredSections.length > 0 && (
                <Pagination page={currentPage} pageCount={totalPages} total={filteredSections.length} pageSize={rowsPerPage} onPageChange={setCurrentPage} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile BottomSheet */}
      <BottomSheet open={!!sheetSection} onClose={() => setSheetSection(null)} title="Section details">
        {sheetSection && (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-semibold text-ink">
                {sheetSection.section_name}
                {sheetSection.is_active === false && <Badge className="ml-2">Archived</Badge>}
              </p>
            </div>

            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-sm">
              <dt className="text-ink-2">Year</dt>
              <dd className="text-right font-medium text-ink">{sheetSection.year_level}</dd>
              
              <dt className="text-ink-2">Semester</dt>
              <dd className="text-right font-medium text-ink">{sheetSection.semester_label}</dd>
              
              <dt className="text-ink-2">Students</dt>
              <dd className="text-right font-medium text-ink tabular-nums">{sheetSection.student_count ?? 0}</dd>
            </dl>

            {isAdmin && (
              <div className="grid gap-2">
                {sheetSection.is_active === false ? (
                  <Button variant="secondary" size="lg" onClick={() => runFromSheet(handleRestoreSection)}>
                    <BiUndo className="text-xl" aria-hidden="true" /> Restore section
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="lg" onClick={() => runFromSheet((sec) => { setEditingSection(sec); setShowAddSection(true); })}>
                      <BiPencil className="text-xl" aria-hidden="true" /> Edit section
                    </Button>
                    <Button variant="danger" size="lg" onClick={() => runFromSheet(handleArchiveSection)}>
                      <BiTrash className="text-xl" aria-hidden="true" /> Archive section
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default AProgSec;
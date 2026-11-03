import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BiSearch, BiX, BiUndo, BiErrorCircle, BiArchive } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import Button from '../../../Components/ui/Button';
import Chip from '../../../Components/ui/Chip';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';
import BottomSheet from '../../../Components/ui/Bottomsheet';
import Avatar from '../../../Components/ui/Avatar';

const TH = 'sticky top-0 z-10 border-b !border-line bg-surface-2 px-3 py-3 text-xs font-semibold text-ink-2';

const TYPES = [
  { id: 'students', label: 'Students', endpoint: '/admin/students?includeArchived=true', key: 'student_id', dateField: 'archived_at' },
  { id: 'programs', label: 'Programs', endpoint: '/admin/programs?mode=archived', key: 'program_id' },
  { id: 'sections', label: 'Sections', endpoint: '/admin/sections/archived', key: 'assignment_id' },
  { id: 'courses', label: 'Courses', endpoint: '/admin/courses?includeArchived=true', key: 'course_id', filterFn: c => c.is_archived },
  { id: 'users', label: 'Users', endpoint: '/admin/faculties?includeInactive=true', key: 'user_id', filterFn: u => !u.is_active }
];

function AArchive() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const role = (sessionStorage.getItem('role') || localStorage.getItem('role') || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [activeType, setActiveType] = useState('students');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = isMobile ? 10 : 50;

  const [sheetRecord, setSheetRecord] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openConfirm = (config) => setConfirmState({ isOpen: true, variant: 'info', confirmLabel: 'CONFIRM', cancelLabel: 'CANCEL', isAlert: false, loading: false, ...config });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });

  const fetchRecords = useCallback(async () => {
    const typeConfig = TYPES.find(t => t.id === activeType);
    if (!typeConfig) return;

    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}${typeConfig.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        let filtered = data.data;
        if (typeConfig.id === 'students') filtered = data.data.filter(s => s.archived_at);
        if (typeConfig.filterFn) filtered = data.data.filter(typeConfig.filterFn);
        setRecords(filtered);
      } else {
        setError(data.message || `Failed to fetch archived ${typeConfig.label.toLowerCase()}.`);
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => { 
    fetchRecords(); 
    setCurrentPage(1);
    setSearchTerm('');
  }, [fetchRecords, isMobile]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return records.filter(r => {
      let text = '';
      if (activeType === 'students') text = `${r.last_name} ${r.first_name} ${r.student_number} ${r.archive_reason || ''}`;
      if (activeType === 'programs') text = `${r.program_name} ${r.program_abbr}`;
      if (activeType === 'sections') text = `${r.section_name} ${r.program_abbr} ${r.program_name}`;
      if (activeType === 'courses') text = `${r.course_code} ${r.course_name}`;
      if (activeType === 'users') text = `${r.username} ${r.first_name} ${r.last_name} ${r.email}`;
      return !term || text.toLowerCase().includes(term);
    });
  }, [records, searchTerm, activeType]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  const handleRestore = (record) => {
    const typeConfig = TYPES.find(t => t.id === activeType);
    let title = '', summary = '', message = '', url = '';
    let confirmLabel = 'RESTORE';
    let variant = 'info';

    if (activeType === 'students') {
      title = 'Unarchive Student';
      summary = <>Are you sure you want to restore <strong>{record.last_name}, {record.first_name}</strong> ({record.student_number})?</>;
      message = 'This will reactivate their account, remove them from the archive, and return them to the active Masterlist. You will still need to reassign their section and enrollment separately.';
      url = `/admin/students/${record.student_id}/restore`;
      confirmLabel = 'UNARCHIVE';
      variant = 'success';
    } else if (activeType === 'programs') {
      title = 'Restore Program';
      summary = <>Restore <strong>{record.program_name}</strong>?</>;
      message = 'The program will be visible again in all program pickers.';
      url = `/admin/programs/${record.program_id}/restore`;
    } else if (activeType === 'sections') {
      title = 'Restore Section';
      summary = <>Restore <strong>{record.section_name}</strong> ({record.program_abbr})?</>;
      message = 'The section will be visible again in section pickers.';
      url = `/admin/section-assignments/${record.assignment_id}/restore`;
    } else if (activeType === 'courses') {
      title = 'Restore Course';
      summary = <>Restore <strong>{record.course_code}</strong> — {record.course_name}?</>;
      message = 'The course will be reactivated and available for curriculum assignment.';
      url = `/admin/courses/${record.course_id}/restore`;
    } else if (activeType === 'users') {
      title = 'Restore User';
      summary = <>Restore <strong>{record.username}</strong> ({record.first_name} {record.last_name})?</>;
      message = 'The user will be reactivated and able to log in again.';
      url = `/admin/users/${record.user_id}/restore`;
    }

    openConfirm({
      title, summary, message, variant, confirmLabel,
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const res = await fetch(`${process.env.REACT_APP_API_URL}${url}`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          
          setConfirmState({ isOpen: false });
          
          if (data.success) {
            fetchRecords();
            setSuccessState({
              isOpen: true,
              title: 'Success',
              summary: 'Action completed successfully.',
              message: 'The record has been restored and is now active.',
              variant: 'success'
            });
          } else {
            openAlert('Restore Failed', data.message || 'Failed to restore.', 'danger');
          }
        } catch (err) {
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const getRecordTitle = (record) => {
    if (activeType === 'students') return `${record.last_name}, ${record.first_name}`;
    if (activeType === 'programs') return record.program_name;
    if (activeType === 'sections') return record.section_name;
    if (activeType === 'courses') return `${record.course_code} — ${record.course_name}`;
    if (activeType === 'users') return `${record.first_name} ${record.last_name || ''}`;
    return '';
  };

  const getRecordSubtitle = (record) => {
    if (activeType === 'students') return `${record.student_number} · ${record.program_abbr || '-'}`;
    if (activeType === 'programs') return `${record.program_abbr} · ${record.total_year} years`;
    if (activeType === 'sections') return `${record.program_abbr || record.program_name} · Year ${record.year_level} · ${record.semester_label}`;
    if (activeType === 'courses') return `${record.total_units || 0} units`;
    if (activeType === 'users') return `${record.username} · ${record.email || 'No email'}`;
    return '';
  };

  const runFromSheet = (action) => {
    const rec = sheetRecord;
    setSheetRecord(null);
    if (rec) action(rec);
  };

  // --- SKELETON LOADER ---
  if (loading) {
    return (
      <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4">
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-ctl bg-surface-2" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />
          ))}
        </div>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel bg-surface">
          <div className="p-4 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b !border-line pb-3 last:border-0">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-surface-2" />
                </div>
                <div className="h-8 w-24 animate-pulse rounded-ctl bg-surface-2" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4 relative">
      
      <ConfirmationModal {...confirmState} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />

      <ConfirmationModal
        isOpen={successState.isOpen}
        title={successState.title}
        summary={successState.summary}
        message={successState.message}
        variant={successState.variant}
        isAlert={true}
        onConfirm={() => setSuccessState({ isOpen: false })}
        onCancel={() => setSuccessState({ isOpen: false })}
      />

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
          <input
            type="text"
            placeholder={`Search archived ${activeType}...`}
            className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
              <BiX />
            </button>
          )}
        </div>
      </div>

      {/* Type Chips */}
      <div className="flex shrink-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TYPES.map(t => {
          if (!isAdmin && ['programs', 'sections', 'courses', 'users'].includes(t.id)) return null;
          return (
            <Chip
              key={t.id}
              selected={activeType === t.id}
              onClick={() => setActiveType(t.id)}
            >
              {t.label}
            </Chip>
          );
        })}
      </div>

      {error ? (
        <EmptyState icon={BiErrorCircle} title="Error Loading Archive" text={error} action={<Button onClick={fetchRecords}>Try again</Button>} />
      ) : filteredRecords.length === 0 ? (
        <EmptyState 
          icon={BiArchive} 
          title={searchTerm ? "No matching results" : `No Archived ${TYPES.find(t => t.id === activeType)?.label}`} 
          text={searchTerm ? `No archived records found matching "${searchTerm}".` : `Records you archive will appear here.`} 
          action={searchTerm ? <Button variant="secondary" onClick={() => setSearchTerm('')}>Clear Search</Button> : null}
        />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel bg-surface">
          {isMobile ? (
            /* MOBILE LIST */
            <ul className="flex-1 divide-y divide-line overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {currentItems.map((record) => (
                <li key={record[TYPES.find(t => t.id === activeType).key]} className="flex items-center gap-3 px-3">
                  <button onClick={() => setSheetRecord(record)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                    <Avatar first={getRecordTitle(record)} last="" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{getRecordTitle(record)}</span>
                      <span className="block truncate text-xs text-ink-2">{getRecordSubtitle(record)}</span>
                      {activeType === 'students' && record.archive_reason && (
                        <span className="mt-1 block text-xs text-danger">Reason: {record.archive_reason}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            /* DESKTOP TABLE */
            <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full min-w-[800px] !border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} pl-4`}>Record</th>
                    <th scope="col" className={TH}>Details</th>
                    {activeType === 'students' && <th scope="col" className={TH}>Reason</th>}
                    <th scope="col" className={`${TH} w-32 text-right`}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((record) => (
                    <tr key={record[TYPES.find(t => t.id === activeType).key]} className="border-t !border-line transition-colors hover:bg-surface-2">
                      <td className="px-3 py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar first={getRecordTitle(record)} last="" />
                          <p className="font-medium text-ink">{getRecordTitle(record)}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ink-2">{getRecordSubtitle(record)}</td>
                      {activeType === 'students' && <td className="px-3 py-3 text-ink-3 text-xs">{record.archive_reason || '—'}</td>}
                      <td className="py-2 pl-3 pr-3 text-right">
                        <Button size="sm" variant="secondary" onClick={() => handleRestore(record)}>
                          <BiUndo className="text-base" /> Restore
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={currentPage} pageCount={totalPages} total={filteredRecords.length} pageSize={rowsPerPage} onPageChange={setCurrentPage} />
        </section>
      )}

      {/* Mobile BottomSheet */}
      <BottomSheet open={!!sheetRecord} onClose={() => setSheetRecord(null)} title="Archived Record">
        {sheetRecord && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar size="lg" first={getRecordTitle(sheetRecord)} last="" />
              <div>
                <p className="text-lg font-semibold text-ink">{getRecordTitle(sheetRecord)}</p>
                <p className="text-sm text-ink-2">{getRecordSubtitle(sheetRecord)}</p>
              </div>
            </div>

            {activeType === 'students' && sheetRecord.archive_reason && (
              <div className="rounded bg-danger-soft p-3 text-sm text-danger">
                <b>Reason for archiving:</b> {sheetRecord.archive_reason}
              </div>
            )}

            <div className="grid gap-2">
              <Button variant="primary" size="lg" onClick={() => runFromSheet(handleRestore)}>
                <BiUndo className="text-xl" /> Restore Record
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default AArchive;
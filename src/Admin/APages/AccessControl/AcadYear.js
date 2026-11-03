import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiPlus, BiX, BiCalendar, BiPencil, BiCheckCircle } from 'react-icons/bi';
import AddYear from '../../AComponents/AddModals/AddYear';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import useMediaQuery from '../../../Components/useMediaQuery';
import Button from '../../../Components/ui/Button';
import Badge from '../../../Components/ui/Badge';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';

function AAcadYear() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingYear, setEditingYear] = useState(null);

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

  const filteredYears = academicYears.filter(year =>
    year.year_label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredYears.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredYears.slice(indexOfFirstItem, indexOfLastItem);

  const hasSearchResults = searchTerm && filteredYears.length === 0 && academicYears.length > 0;

  const semesters = [
    { id: 1, name: '1st Semester' },
    { id: 2, name: '2nd Semester' },
    { id: 3, name: 'Summer Term' }
  ];

  // --- SKELETON LOADER ---
  if (loading) {
    return (
      <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4">
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-ctl bg-surface-2" />
          <div className="h-10 w-36 shrink-0 animate-pulse rounded-ctl bg-surface-2" />
        </div>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          <div className="p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 border-b !border-line pb-4 last:border-0">
                <div className="flex flex-1 items-start gap-4">
                  <div className="hidden h-12 w-12 shrink-0 animate-pulse rounded-xl bg-surface-2 sm:block" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-1/3 animate-pulse rounded bg-surface-2" />
                    <div className="flex gap-2">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-surface-2" />
                      <div className="h-6 w-20 animate-pulse rounded-full bg-surface-2" />
                      <div className="h-6 w-20 animate-pulse rounded-full bg-surface-2" />
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <div className="h-8 w-24 animate-pulse rounded-ctl bg-surface-2" />
                  <div className="h-8 w-16 animate-pulse rounded-ctl bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4 relative">
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

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
          <input
            type="text"
            placeholder="Search academic year..."
            className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
              <BiX />
            </button>
          )}
        </div>

        <Button onClick={() => setShowAdd(true)} className="shrink-0 !px-3 sm:!px-4">
          <BiPlus className="text-xl" aria-hidden="true" />
          <span className="hidden sm:inline">Academic Year</span>
        </Button>
      </div>

      {filteredYears.length === 0 ? (
        <EmptyState 
          icon={BiCalendar} 
          title={hasSearchResults ? "No matching results" : "No Academic Years Yet"} 
          text={hasSearchResults ? `No academic years found matching "${searchTerm}"` : "Get started by creating your first academic year."} 
          action={
            <Button variant={hasSearchResults ? "secondary" : "primary"} onClick={() => hasSearchResults ? setSearchTerm("") : setShowAdd(true)}>
              {hasSearchResults ? "Clear Search" : "Create Year"}
            </Button>
          } 
        />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="divide-y divide-line m-0 p-0 list-none">
              {currentItems.map((year) => {
                const status = getAcademicYearStatus(year.year_label, year.is_active);
                const isActive = status === 'current';

                return (
                  <li key={year.year_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-2">
                    
                    {/* Left Side: Icon, Status, Title, Semesters */}
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-brand-soft text-brand-ink' : 'bg-surface-2 text-ink-3'}`}>
                        <BiCalendar className="text-2xl" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Badge tone={isActive ? 'ok' : 'neutral'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <h3 className="text-lg font-semibold text-ink">Academic Year {year.year_label}</h3>
                        </div>

                        {/* Term Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {isActive ? (
                            semesters.map((sem) => (
                              <button
                                key={sem.id}
                                onClick={() => handleSetSemester(year, sem.id, sem.name)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                                  year.current_sem === sem.id 
                                    ? 'bg-brand text-white shadow-sm' 
                                    : 'bg-surface-2 text-ink-2 hover:bg-line'
                                }`}
                              >
                                {sem.name}
                              </button>
                            ))
                          ) : (
                            <span className="text-sm text-ink-3 italic">
                              {status === 'future' ? 'Future Term' : 'Past Term'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex items-center gap-2 shrink-0 sm:self-center self-end mt-2 sm:mt-0">
                      {!isActive && status !== 'past' && (
                        <Button size="sm" variant="secondary" onClick={() => handleSetActive(year)}>
                          <BiCheckCircle className="text-base" /> Set Active
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(year)}>
                        <BiPencil className="text-base" /> Edit
                      </Button>
                    </div>

                  </li>
                );
              })}
            </ul>
          </div>

          <Pagination page={currentPage} pageCount={totalPages} total={filteredYears.length} pageSize={rowsPerPage} onPageChange={setCurrentPage} />
        </section>
      )}
    </div>
  );
}

export default AAcadYear;
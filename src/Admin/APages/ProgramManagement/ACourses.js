import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BiSearch, BiPlus, BiX, BiPencil, BiTrash, BiChevronDown, BiErrorCircle } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import Filter from '../../../Components/shared/Filter';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import AddCourse from '../../AComponents/AddModals/AddCourse';
import Button from '../../../Components/ui/Button';
import Badge from '../../../Components/ui/Badge';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';
import ActionMenu from '../../../Components/Actionmenu';

const TH = 'sticky top-0 z-10 border-b !border-line bg-surface-2 px-3 py-3 text-xs font-semibold text-ink-2';
const FILTER_KEYS = { program: 'programName', curriculumId: 'curriculumId', yearLevel: 'yearLevel', semester: 'semester' };

function ACourses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  
  const [courses, setCourses] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false });

  const [programOptions, setProgramOptions] = useState([]);
  const [yearLevelOptions] = useState(["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]);
  const [semesterOptions] = useState(["1st Semester", "2nd Semester", "Summer"]);

  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superadmin';
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const rowsPerPage = isMobile ? 10 : 50;
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  const applied = useMemo(() => {
    const sp = new URLSearchParams(paramsKey);
    return {
      program:      sp.get('programName')  ?? '',
      curriculumId: sp.get('curriculumId') ?? '',
      yearLevel:    sp.get('yearLevel')    ?? '',
      semester:     sp.get('semester')     ?? '',
    };
  }, [paramsKey]);

  const curriculumId = applied.curriculumId ? String(applied.curriculumId) : "";
  const hasActiveFilters = Object.values(applied).some(Boolean);

  const [draft, setDraft] = useState(applied);
  useEffect(() => {
    if (!isFilterOpen) {
      setDraft(applied);
    }
  }, [applied, isFilterOpen]);

  useEffect(() => { setCurrentPage(1); }, [paramsKey, searchTerm, isMobile]);

  const unitsOf = (c) => c.total_units || c.lec_units + c.lab_units;
  const curriculumLabel = (c) => `${c.program_abbr || c.program_name} · ${c.version_name} (${c.start_year})`;

  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openConfirm = (config) => setConfirmState({ isOpen: true, variant: 'info', confirmLabel: 'CONFIRM', cancelLabel: 'CANCEL', isAlert: false, loading: false, ...config });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });

  const fetchPrograms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setProgramOptions(data.data.map(p => p.program_abbr || p.program_name));
    } catch (err) { console.error(err); }
  }, []);

  const fetchCurricula = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/curricula`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setCurricula(data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/courses`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setCourses(data.data);
      else setError(data.message || "Failed to fetch courses");
    } catch (err) { setError("Failed to connect to the server"); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrograms(); fetchCurricula(); fetchCourses(); }, [fetchPrograms, fetchCurricula, fetchCourses]);

  const curriculumOptions = useMemo(() => {
    let filtered = curricula;
    if (draft.program) {
      filtered = curricula.filter((c) => c.program_abbr === draft.program || c.program_name === draft.program);
    }
    const options = filtered.map((c) => ({ value: String(c.curriculum_id), label: curriculumLabel(c) }));
    if (draft.curriculumId && !options.find(o => o.value === String(draft.curriculumId))) {
      const cur = curricula.find(c => String(c.curriculum_id) === String(draft.curriculumId));
      options.push({ 
        value: String(draft.curriculumId), 
        label: cur ? curriculumLabel(cur) : `Curriculum #${draft.curriculumId}` 
      });
    }
    return options;
  }, [curricula, draft.program, draft.curriculumId]);

  const filters = [
    { name: 'program',      label: 'Program',    value: draft.program,      options: programOptions,    placeholder: 'All programs' },
    { name: 'curriculumId', label: 'Curriculum', value: draft.curriculumId, options: curriculumOptions, placeholder: 'All curricula' },
    { name: 'yearLevel',    label: 'Year level', value: draft.yearLevel,    options: yearLevelOptions,  placeholder: 'All years' },
    { name: 'semester',     label: 'Semester',   value: draft.semester,     options: semesterOptions,   placeholder: 'All semesters' },
  ];

  const handleFilterChange = (name, value) => {
    setDraft((d) => {
      const next = { ...d, [name]: value };
      if (name === 'program' && value) {
        const cur = curricula.find((c) => String(c.curriculum_id) === next.curriculumId);
        if (cur && cur.program_abbr !== value) next.curriculumId = '';
      }
      return next;
    });
  };

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);
    const put = (k, v) => (v ? next.set(k, v) : next.delete(k));
    put('curriculumId', draft.curriculumId);
    put('programName',  draft.curriculumId ? '' : draft.program);
    put('yearLevel',    draft.yearLevel);
    put('semester',     draft.semester);
    setSearchParams(next, { replace: true });
    setIsFilterOpen(false);
  };

  const removeFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(FILTER_KEYS[key]);
    setSearchParams(next, { replace: true });
  };

  const clearAll = () => { setSearchParams({}, { replace: true }); setSearchTerm(''); setIsFilterOpen(false); };

  const filteredCourses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const yr = applied.yearLevel.charAt(0);
    const filtering = Boolean(curriculumId || applied.program || yr || applied.semester);

    return courses.flatMap((c) => {
      if (q && !(c.course_code?.toLowerCase().includes(q) || c.course_name?.toLowerCase().includes(q))) return [];

      const visibleAssignments = (c.assignments ?? []).filter((a) =>
        (!curriculumId       || String(a.curriculum_id) === curriculumId) &&
        (!applied.program    || a.program_abbr === applied.program) &&
        (!yr                 || String(a.year_level) === yr) &&
        (!applied.semester   || a.semester_label === applied.semester)
      );

      return filtering && visibleAssignments.length === 0 ? [] : [{ ...c, visibleAssignments }];
    });
  }, [courses, searchTerm, applied, curriculumId]);

  const totalPages = Math.ceil(filteredCourses.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

  const handleAddSuccess = () => { setShowAddCourse(false); setEditingCourse(null); fetchCourses(); };
  const handleEdit = (course) => { setEditingCourse(course); setShowAddCourse(true); };

  const handleDelete = (course) => {
    openConfirm({
      title: 'Archive Course',
      summary: <>Archive <strong>{course.course_code}</strong> — {course.course_name}?</>,
      message: <span className="text-danger text-sm">The course will be hidden from all lists and pickers. Existing grades, curricula, and student records stay intact.</span>,
      variant: 'danger', confirmLabel: 'ARCHIVE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/courses/${course.course_id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) fetchCourses();
          else openAlert('Archive Failed', data.message || 'Failed to archive course.', 'danger');
        } catch (err) { setConfirmState({ isOpen: false }); openAlert('Error', 'An unexpected error occurred.', 'danger'); }
      }, onCancel: closeConfirm,
    });
  };

  // --- SKELETON LOADER ---
  if (loading) {
    return (
      <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4">
        {/* Toolbar Skeleton */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-ctl bg-surface-2" />
          <div className="h-10 w-24 shrink-0 animate-pulse rounded-ctl bg-surface-2" />
          <div className="h-10 w-32 shrink-0 animate-pulse rounded-ctl bg-surface-2" />
        </div>
        {/* Table Skeleton */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          <div className="min-h-0 flex-1 overflow-hidden p-3 space-y-3">
            {/* Fake Header */}
            <div className="flex gap-4 pb-3 border-b !border-line">
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-1/6 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-surface-2" />
              <div className="h-4 flex-1 animate-pulse rounded bg-surface-2" />
            </div>
            {/* Fake Rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b !border-line pb-3 last:border-0">
                <div className="flex flex-col gap-1.5 w-1/3">
                  <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
                </div>
                <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
                <div className="flex gap-2">
                  <div className="h-6 w-24 animate-pulse rounded-full bg-surface-2" />
                  <div className="h-6 w-24 animate-pulse rounded-full bg-surface-2" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-surface-2 ml-auto" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) return <div className="ax flex h-full flex-col justify-center"><EmptyState icon={BiErrorCircle} title="Error Loading Courses" text={error} action={<Button onClick={fetchCourses}>Try again</Button>} /></div>;

  return (
    <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4 relative">
      <ConfirmationModal {...confirmState} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />
      {showAddCourse && <AddCourse onClose={() => { setShowAddCourse(false); setEditingCourse(null); }} onSuccess={handleAddSuccess} courseToEdit={editingCourse} />}

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
          <input type="text" placeholder="Search course code or name…" className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink focus-visible:border-brand focus-visible:outline-none sm:text-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          {searchTerm && <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink"><BiX /></button>}
        </div>
        <Filter isOpen={isFilterOpen} setIsOpen={setIsFilterOpen} hasActiveFilters={hasActiveFilters} filters={filters} onFilterChange={handleFilterChange} onReset={clearAll} onApply={applyFilters} />
        {isAdmin && <Button onClick={() => setShowAddCourse(true)} className="shrink-0 !px-3 sm:!px-4"><BiPlus className="text-xl" /><span className="hidden sm:inline">Course</span></Button>}
      </div>

      {/* Active Filter Banner */}
      {(curriculumId || applied.program) && (
        <div className="flex shrink-0 items-center gap-2 px-1">
          <span className="text-sm text-ink-2">Showing courses in:</span>
          <Badge tone="brand" className="gap-1 pr-1">
            {curriculumId 
              ? (curricula.find((c) => String(c.curriculum_id) === curriculumId) 
                  ? curriculumLabel(curricula.find((c) => String(c.curriculum_id) === curriculumId)) 
                  : `Curriculum #${curriculumId}`)
              : applied.program}
            <button 
              onClick={() => curriculumId ? removeFilter('curriculumId') : removeFilter('program')}
              className="rounded-full p-0.5 hover:bg-brand-ink/20 text-brand-on"
              aria-label="Clear filter"
            >
              <BiX className="text-sm" />
            </button>
          </Badge>
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <EmptyState 
          icon={BiSearch} 
          title={searchTerm || hasActiveFilters ? "No matching results" : "No Courses Yet"} 
          text={searchTerm || hasActiveFilters ? "Try adjusting your search or filters." : "Get started by creating your first course."} 
          action={
            (searchTerm || hasActiveFilters) ? (
              <Button variant="secondary" onClick={clearAll}>Clear search and filters</Button>
            ) : isAdmin ? (
              <Button onClick={() => setShowAddCourse(true)}><BiPlus /> Create Course</Button>
            ) : null
          } 
        />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          
          {isMobile ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {currentItems.map((course) => {
                const isExpanded = expandedCourseId === course.course_id;
                return (
                  <div key={course.course_id} className="rounded-ctl border !border-line bg-surface overflow-hidden">
                    <button onClick={() => setExpandedCourseId(isExpanded ? null : course.course_id)} className="flex w-full items-center justify-between p-4 text-left">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{course.course_code}</p>
                        <p className="truncate text-sm text-ink-2">{course.course_name}</p>
                        <div className="mt-2 flex gap-1.5"><Badge tone="neutral">{unitsOf(course)} units</Badge></div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 ml-3">
                        <BiChevronDown className={`text-xl text-ink-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isAdmin && (
                          <div onClick={(e) => e.stopPropagation()}>
                             <ActionMenu items={[
                               { label: 'Edit', icon: BiPencil, onClick: () => handleEdit(course) },
                               { label: 'Archive', icon: BiTrash, danger: true, onClick: () => handleDelete(course) }
                             ]}/>
                          </div>
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t !border-line bg-surface-2/50 p-4 text-sm">
                        <div className="mb-3 flex flex-wrap gap-2">
                          {course.prerequisite_codes && <Badge tone="neutral">Pre-req: {course.prerequisite_codes}</Badge>}
                        </div>
                        <p className="text-xs font-semibold text-ink-3 uppercase mb-2">Assignments</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(course.visibleAssignments && hasActiveFilters ? course.visibleAssignments : (course.assignments || [])).length > 0 
                            ? (course.visibleAssignments && hasActiveFilters ? course.visibleAssignments : course.assignments).map((a, idx) => (
                                <Badge key={idx} tone="brand">{a.year_level} Yr - {a.semester_label}</Badge>
                              )) 
                            : <span className="text-sm text-ink-3">No assignments</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} w-1/3`}>Course</th>
                    <th scope="col" className={TH}>Programs</th>
                    <th scope="col" className={TH}>Assignments</th>
                    <th scope="col" className={TH}>Details</th>
                    {isAdmin && <th scope="col" className={`${TH} w-44 text-right`}><span className="sr-only">Actions</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((course) => {
                    const displayAssignments = (course.visibleAssignments && hasActiveFilters) ? course.visibleAssignments : (course.assignments || []);
                    const uniquePrograms = Array.from(new Set(displayAssignments.map(a => a.program_abbr).filter(Boolean)));

                    return (
                      <tr key={course.course_id} className="border-t !border-line transition-colors hover:bg-surface-2">
                        <td className="px-3 py-3">
                          <p className="font-medium text-ink">{course.course_code}</p>
                          <p className="truncate text-xs text-ink-2 max-w-[250px]" title={course.course_name}>{course.course_name}</p>
                        </td>
                        <td className="px-3 py-3 text-ink-2">
                          {uniquePrograms.length > 0 ? uniquePrograms.join(', ') : '-'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {displayAssignments.length > 0 ? displayAssignments.map((a, idx) => (
                              <Badge key={idx} tone="neutral">{a.year_level} Yr - {a.semester_label}</Badge>
                            )) : <span className="text-xs text-ink-3">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-ink-2 text-xs">{unitsOf(course)} units</p>
                          {course.prerequisite_codes && <p className="text-ink-3 text-xs mt-1 truncate max-w-[150px]" title={course.prerequisite_codes}>Pre-req: {course.prerequisite_codes}</p>}
                        </td>
                        {isAdmin && (
                          <td className="py-2 pl-3 pr-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="secondary" onClick={() => handleEdit(course)}><BiPencil className="text-base"/> Edit</Button>
                              <Button size="sm" variant="danger" onClick={() => handleDelete(course)}><BiTrash className="text-base"/> Archive</Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={currentPage} pageCount={totalPages} total={filteredCourses.length} pageSize={rowsPerPage} onPageChange={setCurrentPage} />
        </section>
      )}
    </div>
  );
}

export default ACourses;
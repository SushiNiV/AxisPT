import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiPlus, BiX, BiPencil, BiTrash, BiChevronDown, BiErrorCircle } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import Filter from '../../../Components/shared/Filter';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import AddCourse from '../../AComponents/AddModals/AddCourse';
import Button from '../../../Components/ui/Button';
import Badge from '../../../Components/ui/Badge';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';
import ActionMenu from '../../../Components/Actionmenu';

const TH = 'sticky top-0 z-10 border-b !border-line bg-surface-2 px-3 py-3 text-xs font-semibold text-ink-2';

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

  const unitsOf = (c) => c.total_units || c.lec_units + c.lab_units;
  const programLabel = (c) => c.program_abbrs?.length ? c.program_abbrs.join(', ') : '-';
  const getUniqueAssignments = (c) => c.assignments ? Array.from(new Set(c.assignments.map(a => `${a.year_level} Yr - ${a.semester_label}`))) : [];

  useEffect(() => { setCurrentPage(1); }, [isMobile]);

  useEffect(() => {
    if (isFilterOpen) {
      setTempProgram(selectedProgram); setTempYearLevel(selectedYearLevel); setTempSemester(selectedSemester);
    }
  }, [isFilterOpen, selectedProgram, selectedYearLevel, selectedSemester]);

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

  useEffect(() => { fetchPrograms(); fetchCourses(); }, [fetchPrograms, fetchCourses]);

  const filters = [
    { name: "program", label: "Program", value: tempProgram, options: programOptions, placeholder: "All programs" },
    { name: "yearLevel", label: "Year level", value: tempYearLevel, options: yearLevelOptions, placeholder: "All years" },
    { name: "semester", label: "Semester", value: tempSemester, options: semesterOptions, placeholder: "All semesters" }
  ];

  const handleFilterChange = (name, value) => {
    if (name === "program") setTempProgram(value);
    else if (name === "yearLevel") setTempYearLevel(value);
    else if (name === "semester") setTempSemester(value);
  };

  const resetFilters = () => { setTempProgram(""); setTempYearLevel(""); setTempSemester(""); setSelectedProgram(""); setSelectedYearLevel(""); setSelectedSemester(""); setIsFilterOpen(false); setCurrentPage(1); };
  const applyFilters = () => { setSelectedProgram(tempProgram); setSelectedYearLevel(tempYearLevel); setSelectedSemester(tempSemester); setIsFilterOpen(false); setCurrentPage(1); };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) || course.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = !selectedProgram || (course.program_abbrs || []).some(abbr => abbr === selectedProgram);
    const matchesYearLevel = !selectedYearLevel || (course.assignments || []).some(a => a.year_level?.toString() === selectedYearLevel.charAt(0));
    const matchesSemester = !selectedSemester || (course.assignments || []).some(a => a.semester_label === selectedSemester);
    return matchesSearch && matchesProgram && matchesYearLevel && matchesSemester;
  });

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

  if (loading) return <div className="ax flex h-full items-center justify-center"><p className="text-sm text-ink-3 animate-pulse">Loading Courses…</p></div>;
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
        <Filter isOpen={isFilterOpen} setIsOpen={setIsFilterOpen} hasActiveFilters={hasActiveFilters} filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} onApply={applyFilters} />
        {isAdmin && <Button onClick={() => setShowAddCourse(true)} className="shrink-0 !px-3 sm:!px-4"><BiPlus className="text-xl" /><span className="hidden sm:inline">Course</span></Button>}
      </div>

      {filteredCourses.length === 0 ? (
        <EmptyState 
          icon={BiSearch} 
          title={searchTerm ? "No matching results" : "No Courses Yet"} 
          text={searchTerm ? `No courses found matching "${searchTerm}"` : "Get started by creating your first course."} 
          action={!searchTerm && isAdmin ? <Button onClick={() => setShowAddCourse(true)}><BiPlus /> Create Course</Button> : null} 
        />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          
          {isMobile ? (
            /* MOBILE VIEW (Accordion Cards) */
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
                          <Badge tone="neutral">{programLabel(course)}</Badge>
                        </div>
                        <p className="text-xs font-semibold text-ink-3 uppercase mb-2">Assignments</p>
                        <div className="flex flex-wrap gap-1.5">
                          {getUniqueAssignments(course).length > 0 ? getUniqueAssignments(course).map((pair, idx) => (
                            <Badge key={idx} tone="brand">{pair}</Badge>
                          )) : <span className="text-sm text-ink-3">No assignments</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* DESKTOP VIEW (Table) */
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
                  {currentItems.map((course) => (
                    <tr key={course.course_id} className="border-t !border-line transition-colors hover:bg-surface-2">
                      <td className="px-3 py-3">
                        <p className="font-medium text-ink">{course.course_code}</p>
                        <p className="truncate text-xs text-ink-2 max-w-[250px]" title={course.course_name}>{course.course_name}</p>
                      </td>
                      <td className="px-3 py-3 text-ink-2">
                        {programLabel(course)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {getUniqueAssignments(course).length > 0 ? getUniqueAssignments(course).map((pair, idx) => (
                            <Badge key={idx} tone="neutral">{pair}</Badge>
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
                  ))}
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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BiSearch, BiPlus, BiX, BiPencil, BiTrash, BiListCheck, BiChevronRight,
  BiGroup, BiErrorCircle, BiSortAlt2, BiSortUp, BiSortDown,
} from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery';
import Filter from '../../../Components/shared/Filter';
import ConfirmationModal from '../../AComponents/ConfirmationModal';
import Button from '../../../Components/ui/Button';
import Badge from '../../../Components/ui/Badge';
import Avatar from '../../../Components/ui/Avatar';
import Chip from '../../../Components/ui/Chip';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';
import BottomSheet from '../../../Components/ui/Bottomsheet';
import ActionMenu from '../../../Components/Actionmenu';
import AddStudent from '../../AComponents/AddModals/AddStudent';
import AddGrade from '../../AComponents/AddModals/AddGrade';
import BulkStudent from '../../AComponents/BulkModals/BulkStudent';

const ARCHIVE_REASON_OPTIONS = [
  'Transferred out',
  'Dropped',
  'Graduated',
  'Failed / Retained',
  'Deceased',
  'Others',
];
 
const OTHERS = 'Others';
 
// Probation filter chips (values match the Filter dropdown's status options).
const STATUS_CHIPS = [
  { value: 'No Probationary', label: 'No probation' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Probationary 1', label: 'Probationary 1' },
  { value: 'Probationary 2', label: 'Probationary 2' },
];
const STATUS_TONE = {
  'No Probationary': 'ok',
  Warning: 'warn',
  'Probationary 1': 'danger',
  'Probationary 2': 'danger',
};
const STATUS_RANK = { 'No Probationary': 0, Warning: 1, 'Probationary 1': 2, 'Probationary 2': 3 };
 
const SORTERS = {
  name: (a, b) =>
    `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`),
  program: (a, b) =>
    (a.program_abbr || a.program_name || '').localeCompare(b.program_abbr || b.program_name || '') ||
    (a.year_level || 0) - (b.year_level || 0),
  status: (a, b) => (STATUS_RANK[a.academic_status] ?? 0) - (STATUS_RANK[b.academic_status] ?? 0),
};
 
const programLine = (std) =>
  [std.program_abbr || std.program_name, std.year_level && `Year ${std.year_level}`]
    .filter(Boolean)
    .join(', ');
 
const TH = 'sticky top-0 z-10 border-b border-line bg-surface-2 px-3 py-3 text-xs font-semibold text-ink-2';
 
/** Sortable table header cell. */
function SortHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort.key === sortKey;
  const Icon = !active ? BiSortAlt2 : sort.dir === 'asc' ? BiSortUp : BiSortDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      className={`${TH} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 rounded font-semibold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
          active ? 'text-ink' : ''
        }`}
      >
        {label}
        <Icon aria-hidden="true" className={`text-base ${active ? 'text-brand-ink' : 'text-ink-3'}`} />
      </button>
    </th>
  );
}
 
/** Removable tag for an applied filter. */
function FilterTag({ onRemove, children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-3 pr-1.5 text-brand-ink">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${children}`}
        className="grid h-5 w-5 place-items-center rounded-full hover:bg-brand/15"
      >
        <BiX />
      </button>
    </span>
  );
}
 
function Masterlist() {
  const isMobile = useMediaQuery('(max-width: 768px)');
 
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [selectMode, setSelectMode] = useState(false); // mobile only
  const [sheetStudent, setSheetStudent] = useState(null); // mobile action sheet
 
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
 
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
 
  const [viewingGradesFor, setViewingGradesFor] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
 
  const [, setArchiveReasonCategory] = useState('');
  const [, setArchiveReasonOther] = useState('');
  const [archiveReason, setArchiveReason] = useState('');
 
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [tempProgram, setTempProgram] = useState("");
  const [tempYearLevel, setTempYearLevel] = useState("");
  const [tempStatus, setTempStatus] = useState("");
 
  const [programOptions, setProgramOptions] = useState([]);
  const [yearLevelOptions] = useState(["1st Year", "2nd Year", "3rd Year", "4th Year"]);
  const [statusOptions] = useState(["No Probationary", "Warning", "Probationary 1", "Probationary 2"]);
 
  const hasActiveFilters =
    selectedProgram !== "" || selectedYearLevel !== "" || selectedStatus !== "";
 
  const archiveSelectionRef = useRef({ category: '', other: '' });
  
 
  const rowsPerPage = isMobile ? 10 : 30;
 
  useEffect(() => {
    if (isFilterOpen) {
      setTempProgram(selectedProgram);
      setTempYearLevel(selectedYearLevel);
      setTempStatus(selectedStatus);
    }
  }, [isFilterOpen, selectedProgram, selectedYearLevel, selectedStatus]);
 
  const fetchPrograms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProgramOptions(
          data.data.map(p => ({
            value: p.program_name,                    // what the filter matches on
            label: p.program_abbr || p.program_name   // what the user sees
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  }, []);
 
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Older records may store "None"; normalize to the current label
        setStudents(
          data.data.map(s => ({
            ...s,
            academic_status: !s.academic_status || s.academic_status === 'None'
              ? 'No Probationary'
              : s.academic_status
          }))
        );
      } else {
        setError(data.message || "Failed to fetch student masterlist");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    fetchPrograms();
    fetchStudents();
  }, [fetchPrograms, fetchStudents]);
 
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
 
  const filters = [
    { name: "program", label: "Program", value: tempProgram, options: programOptions, placeholder: "All programs" },
    { name: "yearLevel", label: "Year level", value: tempYearLevel, options: yearLevelOptions, placeholder: "All year levels" },
    { name: "status", label: "Probation status", value: tempStatus, options: statusOptions, placeholder: "All statuses" },
  ];
 
  const handleFilterChange = (name, value) => {
    if (name === "program") setTempProgram(value);
    else if (name === "yearLevel") setTempYearLevel(value);
    else if (name === "status") setTempStatus(value);
  };
 
  const resetFilters = () => {
    setTempProgram("");
    setTempYearLevel("");
    setTempStatus("");
    setSelectedProgram("");
    setSelectedYearLevel("");
    setSelectedStatus("");
    setIsFilterOpen(false);
    setCurrentPage(1);
  };
 
  const applyFilters = () => {
    setSelectedProgram(tempProgram);
    setSelectedYearLevel(tempYearLevel);
    setSelectedStatus(tempStatus);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };
 
  const resetArchiveReason = () => {
    setArchiveReasonCategory('');
    setArchiveReasonOther('');
  };
 
  const term = searchTerm.toLowerCase();
  const matchesBase = (std) => {
    const fullName = `${std.first_name} ${std.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(term) ||
      std.student_number?.toLowerCase().includes(term) ||
      std.personal_email?.toLowerCase().includes(term);
    const matchesProgram = !selectedProgram || std.program_name === selectedProgram;
    const matchesYearLevel =
      !selectedYearLevel || std.year_level?.toString() === selectedYearLevel.charAt(0);
    return matchesSearch && matchesProgram && matchesYearLevel;
  };
 
  // Everything except the probation filter: the status chips count from this set.
  const baseFiltered = students.filter(matchesBase);
  const filteredStudents = baseFiltered.filter(
    (std) => !selectedStatus || std.academic_status === selectedStatus
  );
  const statusCounts = baseFiltered.reduce((counts, s) => {
    const status = s.academic_status || 'No Probationary';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
 
  const sortedStudents = sort.key
    ? [...filteredStudents].sort((a, b) => SORTERS[sort.key](a, b) * (sort.dir === 'asc' ? 1 : -1))
    : filteredStudents;
 
  const totalPages = Math.ceil(sortedStudents.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);
 
  const handleSort = (key) => {
    setSort((s) =>
      s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : { key: null, dir: 'asc' }
    );
    setCurrentPage(1);
  };
 
  const setStatusFilter = (value) => {
    setSelectedStatus(value);
    setTempStatus(value);
    setCurrentPage(1);
  };
  const clearProgram = () => { setSelectedProgram(''); setTempProgram(''); setCurrentPage(1); };
  const clearYear = () => { setSelectedYearLevel(''); setTempYearLevel(''); setCurrentPage(1); };
 
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
 
  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };
 
 
  const handleAddSuccess = () => {
    setShowAddStudent(false);
    setEditingStudent(null);
    fetchStudents();
  };
 
  const handleEdit = async (student) => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/students/${student.student_id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setEditingStudent(data.data);
        setShowAddStudent(true);
      }
    } catch (err) {
      console.error(err);
    }
  };
 
  const handleViewGrades = (student) => setViewingGradesFor(student);
 
 
  const handleDelete = (student) => {
    const studentName = `${student.last_name}, ${student.first_name}`;
    resetArchiveReason();
    archiveSelectionRef.current = { category: '', other: '' };
 
    openConfirm({
      title: 'Delete Student Record',
      summary: <>Delete <strong>{studentName}</strong> ({student.student_number})?</>,
      message: (
        <span style={{ color: '#c62828', fontSize: '0.75rem' }}>
          Their account will be deactivated and they will be hidden from the
          default Masterlist. All their grades, enrollment history, and
          personal records are preserved. You can restore them later.
        </span>
      ),
      variant: 'danger',
      confirmLabel: 'DELETE',
 
      selectLabel: 'REASON FOR ARCHIVING',
      selectPlaceholder: 'Select a reason',
      selectValue: '',
      selectOptions: ARCHIVE_REASON_OPTIONS,
      selectRequired: true,
      onSelectChange: (value) => {
        archiveSelectionRef.current.category = value;
        if (value !== OTHERS) archiveSelectionRef.current.other = '';
        setArchiveReasonCategory(value);
        setConfirmState((s) => ({
          ...s,
          selectValue: value,
          showInput: value === OTHERS,
        }));
      },
 
      showInput: false,
      inputLabel: 'SPECIFY REASON',
      inputPlaceholder: 'Type the reason…',
      inputValue: '',
      inputRequired: true,
      onInputChange: (value) => {
        archiveSelectionRef.current.other = value;
        setArchiveReasonOther(value);
        setConfirmState((s) => ({ ...s, inputValue: value }));
      },
 
      onConfirm: async () => {
        const { category, other } = archiveSelectionRef.current;
        const finalReason = category === OTHERS ? other.trim() : category;
 
        if (!finalReason) {
          openAlert('Reason Required', 'Please select or specify a reason for archiving.', 'warning');
          return;
        }
 
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/students/${student.student_id}`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ reason: finalReason }),
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          resetArchiveReason();
          if (data.success) {
            fetchStudents();
          } else {
            openAlert('Delete Failed', data.message || 'Failed to delete student.', 'danger');
          }
        } catch (err) {
          console.error('Error deleting student:', err);
          setConfirmState({ isOpen: false });
          resetArchiveReason();
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: () => {
        setConfirmState({ isOpen: false });
        resetArchiveReason();
      },
    });
  };
 
  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
 
  const toggleSelectAll = () => {
    const allSelected = currentItems.length > 0 && selectedIds.length === currentItems.length;
    setSelectedIds(allSelected ? [] : currentItems.map((s) => s.student_id));
  };
 
  const clearSelection = () => setSelectedIds([]);
 
  const handleBulkDelete = () => {
    setArchiveReason('');
    openConfirm({
      title: 'Delete Students',
      summary: <>Delete <strong>{selectedIds.length}</strong> selected student record(s)?</>,
      message: (
        <span>
          Their accounts will be deactivated and they will be hidden from the
          default Masterlist. All data is preserved and can be restored later.
        </span>
      ),
      variant: 'danger',
      confirmLabel: 'DELETE',
 
      inputLabel: 'REASON FOR ARCHIVING',
      inputPlaceholder: 'e.g. Transferred out, dropped, graduated…',
      inputValue: archiveReason,
      onInputChange: setArchiveReason,
      inputRequired: true,
 
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/students/batch-delete`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                studentIds: selectedIds,
                reason: (confirmState.inputValue || '').trim() || null,
              }),
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          setArchiveReason('');
          if (data.success) {
            clearSelection();
            fetchStudents();
            openAlert('Students Deleted', data.message, 'success');
          } else {
            openAlert('Delete Failed', data.message || 'Failed to delete selected students.', 'danger');
          }
        } catch (err) {
          console.error('Error batch-deleting students:', err);
          setConfirmState({ isOpen: false });
          setArchiveReason('');
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: () => { setConfirmState({ isOpen: false }); setArchiveReason(''); },
    });
  };
 
  const handleBulkEditSuccess = () => {
    setShowBulkEdit(false);
    clearSelection();
    fetchStudents();
  };
 
  const toggleSelectMode = () => {
    if (selectMode) clearSelection();
    setSelectMode(!selectMode);
  };
 
  if (loading) {
    return (
      <div className="InnerContainer ArchiveLayout">
        <div className="ax flex flex-1 flex-col gap-3" aria-busy="true" aria-label="Loading students">
          <div className="h-10 animate-pulse rounded-ctl bg-line/60" />
          <div className="h-9 w-2/3 animate-pulse rounded-full bg-line/60" />
          <div className="space-y-3 rounded-panel border border-line bg-surface p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-ctl bg-line/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="InnerContainer ArchiveLayout">
        <div className="ax flex flex-1 flex-col">
          <EmptyState
            icon={BiErrorCircle}
            title="Couldn't load the masterlist"
            text={error}
            action={<Button onClick={fetchStudents}>Try again</Button>}
          />
        </div>
      </div>
    );
  }
 
  const hasNoData = filteredStudents.length === 0;
  const allOnPageSelected = currentItems.length > 0 && selectedIds.length === currentItems.length;
  const programLabel =
    programOptions.find((p) => p.value === selectedProgram)?.label || selectedProgram;
 
  const openAdd = () => { setEditingStudent(null); setShowAddStudent(true); };
  const clearAllFilters = () => { clearSearch(); resetFilters(); };
  const runFromSheet = (action) => {
    const student = sheetStudent;
    setSheetStudent(null);
    if (student) action(student);
  };
 
  return (
    <div className="InnerContainer ArchiveLayout">
      {showAddStudent && (
        <AddStudent
          isOpen={showAddStudent}
          onClose={() => { setShowAddStudent(false); setEditingStudent(null); }}
          onSuccess={handleAddSuccess}
          initialData={editingStudent}
          isEditMode={!!editingStudent}
        />
      )}
 
      {showBulkEdit && (
        <BulkStudent
          studentIds={selectedIds}
          onClose={() => setShowBulkEdit(false)}
          onSuccess={handleBulkEditSuccess}
        />
      )}
 
      {viewingGradesFor && (
        <AddGrade
          student={viewingGradesFor}
          onClose={() => setViewingGradesFor(null)}
          onSuccess={() => { setViewingGradesFor(null); fetchStudents(); }}
        />
      )}
 
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
 
        selectLabel={confirmState.selectLabel}
        selectPlaceholder={confirmState.selectPlaceholder}
        selectValue={confirmState.selectValue}
        selectOptions={confirmState.selectOptions}
        onSelectChange={confirmState.onSelectChange}
        selectRequired={confirmState.selectRequired}
 
        showInput={confirmState.showInput}
        inputLabel={confirmState.inputLabel}
        inputPlaceholder={confirmState.inputPlaceholder}
        inputValue={confirmState.inputValue}
        onInputChange={confirmState.onInputChange}
        inputRequired={confirmState.inputRequired}
      />
 
      <div className="ax flex min-h-0 flex-1 flex-col gap-3 pb-4">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <BiSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name, student number, or email"
              aria-label="Search students"
              className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink"
              >
                <BiX />
              </button>
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
          <Button onClick={openAdd} aria-label="Add student" className="shrink-0 !px-3 sm:!px-4">
            <BiPlus className="text-xl" aria-hidden="true" />
            <span className="hidden sm:inline">Add student</span>
          </Button>
        </div>
 
        {/* Probation quick filters */}
        <div
          role="group"
          aria-label="Filter by probation status"
          className="flex shrink-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Chip selected={!selectedStatus} count={baseFiltered.length} onClick={() => setStatusFilter('')}>
            All
          </Chip>
          {STATUS_CHIPS.map(({ value, label }) => (
            <Chip
              key={value}
              selected={selectedStatus === value}
              count={statusCounts[value] || 0}
              onClick={() => setStatusFilter(selectedStatus === value ? '' : value)}
            >
              {label}
            </Chip>
          ))}
        </div>
 
        {(selectedProgram || selectedYearLevel) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-2">Filtered by</span>
            {selectedProgram && <FilterTag onRemove={clearProgram}>{programLabel}</FilterTag>}
            {selectedYearLevel && <FilterTag onRemove={clearYear}>{selectedYearLevel}</FilterTag>}
            <button type="button" onClick={resetFilters} className="font-medium text-brand-ink hover:underline">
              Clear all
            </button>
          </div>
        )}
 
        {/* Results */}
        {hasNoData ? (
          searchTerm || hasActiveFilters ? (
            <EmptyState
              icon={BiSearch}
              title="No matching students"
              text="Try a different search, or clear the filters."
              action={<Button variant="secondary" onClick={clearAllFilters}>Clear search and filters</Button>}
            />
          ) : (
            <EmptyState
              icon={BiGroup}
              title="No students yet"
              text="Create the first student record to get started."
              action={
                <Button onClick={openAdd}>
                  <BiPlus className="text-xl" aria-hidden="true" /> Add student
                </Button>
              }
            />
          )
        ) : (
          <section
            aria-label="Students"
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface"
          >
            {isMobile ? (
              <>
                <div className="flex shrink-0 items-center justify-between border-b !border-line px-4 py-2.5 text-sm">
                  {selectMode ? (
                    <label className="flex items-center gap-2 text-ink-2">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 accent-brand"
                      />
                      Select all on this page
                    </label>
                  ) : (
                    <span className="tabular-nums text-ink-2">{filteredStudents.length} students</span>
                  )}
                  <button type="button" onClick={toggleSelectMode} className="font-medium text-brand-ink">
                    {selectMode ? 'Done' : 'Select'}
                  </button>
                </div>
 
                <ul className="divide-y divide-line">
                  {currentItems.map((std) => {
                    const isSelected = selectedIds.includes(std.student_id);
                    const name = `${std.last_name}, ${std.first_name}`;
                    const status = std.academic_status || 'No Probationary';
                    return (
                      <li key={std.student_id} className={`flex items-center gap-3 px-3 ${isSelected ? 'bg-brand-soft' : ''}`}>
                        {selectMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(std.student_id)}
                            aria-label={`Select ${name}`}
                            className="h-5 w-5 shrink-0 accent-brand"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => (selectMode ? toggleSelectOne(std.student_id) : setSheetStudent(std))}
                          className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
                        >
                          <Avatar first={std.first_name} last={std.last_name} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-ink">{name}</span>
                            <span className="block truncate text-xs tabular-nums text-ink-2">{std.student_number}</span>
                            <span className="block truncate text-xs text-ink-2">{programLine(std)}</span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            {status !== 'No Probationary' && <Badge tone={STATUS_TONE[status]}>{status}</Badge>}
                            {std.standing === 'Irregular' && <Badge tone="brand">Irregular</Badge>}
                          </span>
                          {!selectMode && <BiChevronRight aria-hidden="true" className="shrink-0 text-xl text-ink-3" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={`${TH} w-12 pl-4`}>
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAll}
                          aria-label="Select all students on this page"
                          className="h-4 w-4 accent-brand"
                        />
                      </th>
                      <SortHeader label="Student" sortKey="name" sort={sort} onSort={handleSort} />
                      <SortHeader label="Program" sortKey="program" sort={sort} onSort={handleSort} />
                      <th scope="col" className={`${TH} hidden xl:table-cell`}>Email</th>
                      <th scope="col" className={TH}>Standing</th>
                      <SortHeader label="Probation" sortKey="status" sort={sort} onSort={handleSort} />
                      <th scope="col" className={`${TH} w-44`}><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((std) => {
                      const isSelected = selectedIds.includes(std.student_id);
                      const name = `${std.last_name}, ${std.first_name}`;
                      const status = std.academic_status || 'No Probationary';
                      return (
                        <tr
                          key={std.student_id}
                          onClick={() => toggleSelectOne(std.student_id)}
                          className={`cursor-pointer border-t !border-line transition-colors ${
                            isSelected ? 'bg-brand-soft' : 'hover:bg-surface-2'
                          }`}
                        >
                          <td className="w-12 py-3 pl-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(std.student_id)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Select ${name}`}
                              className="h-4 w-4 accent-brand"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar first={std.first_name} last={std.last_name} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-ink">
                                  {name}
                                  {std.archived_at && <Badge className="ml-2">Archived</Badge>}
                                </p>
                                <p className="text-xs tabular-nums text-ink-2">{std.student_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-ink">{std.program_abbr || std.program_name || '-'}</p>
                            <p className="text-xs text-ink-2">
                              {[std.year_level && `Year ${std.year_level}`, std.section_name].filter(Boolean).join(', ') || '-'}
                            </p>
                          </td>
                          <td className="hidden max-w-[240px] truncate px-3 py-3 text-ink-2 xl:table-cell">
                            {std.personal_email}
                          </td>
                          <td className="px-3 py-3">
                            <Badge tone={std.standing === 'Irregular' ? 'brand' : 'neutral'}>
                              {std.standing || 'Regular'}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <Badge tone={STATUS_TONE[status] || 'neutral'}>{status}</Badge>
                          </td>
                          <td className="py-2 pl-3 pr-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="secondary" onClick={() => handleViewGrades(std)}>
                                <BiListCheck className="text-base" aria-hidden="true" /> Grades
                              </Button>
                              <ActionMenu
                                label={`More actions for ${name}`}
                                items={[
                                  { label: 'Edit', icon: BiPencil, onClick: () => handleEdit(std) },
                                  { label: 'Archive', icon: BiTrash, danger: true, onClick: () => handleDelete(std) },
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
 
            <Pagination
              page={currentPage}
              pageCount={totalPages}
              total={sortedStudents.length}
              pageSize={rowsPerPage}
              onPageChange={setCurrentPage}
            />
          </section>
        )}
      </div>
 
      {/* Mobile: tap a student to see details and actions */}
      <BottomSheet open={!!sheetStudent} onClose={() => setSheetStudent(null)} title="Student details">
        {sheetStudent && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar size="lg" first={sheetStudent.first_name} last={sheetStudent.last_name} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-ink">
                  {sheetStudent.last_name}, {sheetStudent.first_name}
                </p>
                <p className="text-sm tabular-nums text-ink-2">{sheetStudent.student_number}</p>
              </div>
            </div>
 
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-sm">
              <dt className="text-ink-2">Program</dt>
              <dd className="text-right font-medium text-ink">
                {sheetStudent.program_abbr || sheetStudent.program_name || '-'}
              </dd>
              <dt className="text-ink-2">Year and section</dt>
              <dd className="text-right font-medium text-ink">
                {[sheetStudent.year_level && `Year ${sheetStudent.year_level}`, sheetStudent.section_name]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </dd>
              <dt className="text-ink-2">Email</dt>
              <dd className="break-all text-right font-medium text-ink">{sheetStudent.personal_email || '-'}</dd>
              <dt className="text-ink-2">Standing</dt>
              <dd className="flex justify-end">
                <Badge tone={sheetStudent.standing === 'Irregular' ? 'brand' : 'neutral'}>
                  {sheetStudent.standing || 'Regular'}
                </Badge>
              </dd>
              <dt className="text-ink-2">Probation</dt>
              <dd className="flex justify-end">
                <Badge tone={STATUS_TONE[sheetStudent.academic_status] || 'ok'}>
                  {sheetStudent.academic_status || 'No Probationary'}
                </Badge>
              </dd>
            </dl>
 
            <div className="grid gap-2">
              <Button variant="secondary" size="lg" onClick={() => runFromSheet(handleViewGrades)}>
                <BiListCheck className="text-xl" aria-hidden="true" /> View grades
              </Button>
              <Button variant="secondary" size="lg" onClick={() => runFromSheet(handleEdit)}>
                <BiPencil className="text-xl" aria-hidden="true" /> Edit student
              </Button>
              <Button variant="danger" size="lg" onClick={() => runFromSheet(handleDelete)}>
                <BiTrash className="text-xl" aria-hidden="true" /> Delete student
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
 
      {selectedIds.length > 1 && (
        <div className="BulkActionBar">
          <span className="BulkActionCount">{selectedIds.length} selected</span>
          <div className="BulkActionButtons">
            <button className="TopbarBtn" onClick={() => setShowBulkEdit(true)}>
              <BiPencil className="linkIcon" /> Edit <span className="BulkLabelExtra">Selected</span>
            </button>
            <button className="tableDeleteBtn" onClick={handleBulkDelete}>
              <BiTrash /> Delete <span className="BulkLabelExtra">Selected</span>
            </button>
            <button className="ClearSelectionBtn" onClick={clearSelection} aria-label="Clear selection">
              <BiX /> <span className="BulkLabelExtra">Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
 
export default Masterlist;
 
import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiPlusCircle, BiX, BiPencil, BiTrash, BiListCheck } from 'react-icons/bi';
import Filter from '../../Components/Filter';
import ConfirmationModal from '../AComponents/ConfirmationModal';
import '../../GlobalHistory.css';
import '../../Global.css';
import '../../GlobalEmpty.css';
import AddStudent from '../AComponents/AddModals/AddStudent';
import AddGrade from '../AComponents/AddModals/AddGrade';
import BulkStudent from '../AComponents/BulkModals/BulkStudent';

function Masterlist() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(30);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Overlay & Editing states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Bulk selection & bulk-edit states
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Grade Modal state
  const [viewingGradesFor, setViewingGradesFor] = useState(null);

  // Confirmation / Alert modal state
  //   confirmState: { isOpen, title, message, variant, confirmLabel, onConfirm, isAlert, loading }
  const [confirmState, setConfirmState] = useState({ isOpen: false });

  // Filter States
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [tempProgram, setTempProgram] = useState("");
  const [tempYearLevel, setTempYearLevel] = useState("");
  const [tempStatus, setTempStatus] = useState("");

  const [programOptions, setProgramOptions] = useState([]);
  const [yearLevelOptions] = useState(["1st Year", "2nd Year", "3rd Year", "4th Year"]);
  const [statusOptions] = useState(["None", "Warning", "Probationary 1", "Probationary 2"]);

  const hasActiveFilters = selectedProgram !== "" || selectedYearLevel !== "" || selectedStatus !== "";

  useEffect(() => {
    if (isFilterOpen) {
      setTempProgram(selectedProgram);
      setTempYearLevel(selectedYearLevel);
      setTempStatus(selectedStatus);
    }
  }, [isFilterOpen, selectedProgram, selectedYearLevel, selectedStatus]);

  const fetchPrograms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const programs = data.data.map(p => p.program_name);
        setProgramOptions(programs);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
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

  // ---------- Helper: open confirm / alert ----------
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
      onConfirm: () => setConfirmState({ isOpen: false }),
      onCancel: () => setConfirmState({ isOpen: false }),
    });
  };

  // Filter Configuration
  const filters = [
    { name: "program", label: "PROGRAM", value: tempProgram, options: programOptions, placeholder: "ALL PROGRAMS" },
    { name: "yearLevel", label: "YEAR LEVEL", value: tempYearLevel, options: yearLevelOptions, placeholder: "ALL YEARS" },
    { name: "status", label: "ACADEMIC STANDING", value: tempStatus, options: statusOptions, placeholder: "ALL STANDINGS" },
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

  const filteredStudents = students.filter((std) => {
    const fullName = `${std.first_name} ${std.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      std.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.personal_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram = !selectedProgram || std.program_name === selectedProgram;
    const matchesYearLevel = !selectedYearLevel || std.year_level?.toString() === selectedYearLevel.charAt(0);
    const matchesStatus = !selectedStatus || std.academic_status === selectedStatus;

    return matchesSearch && matchesProgram && matchesYearLevel && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const visibleStart = filteredStudents.length ? indexOfFirstItem + 1 : 0;
  const visibleEnd = Math.min(indexOfLastItem, filteredStudents.length);
  const standingCounts = filteredStudents.reduce(
    (counts, student) => {
      const status = student.academic_status || 'None';
      if (status === 'None') counts.none += 1;
      else if (status === 'Warning') counts.warning += 1;
      else if (status.startsWith('Probationary')) counts.probationary += 1;
      return counts;
    },
    { none: 0, warning: 0, probationary: 0 }
  );

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

  const handleAddSuccess = () => {
    setShowAddStudent(false);
    setEditingStudent(null);
    fetchStudents();
  };

  const handleEdit = async (student) => {
    try {
      const token = sessionStorage.getItem('token');
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

  const handleViewGrades = (student) => {
    setViewingGradesFor(student);
  };

  const getStandingBadgeProps = (status) => {
    switch (status) {
      case "None":
        return { className: "statusBadge active-bg" };
      case "Warning":
        return { className: "statusBadge", style: { backgroundColor: "#fff3cd", color: "#8a6512" } };
      case "Probationary 1":
        return { className: "statusBadge", style: { backgroundColor: "#ffe0b2", color: "#e65100" } };
      case "Probationary 2":
        return { className: "statusBadge inactive-bg" };
      default:
        return { className: "statusBadge" };
    }
  };

  // ---------- Delete via ConfirmationModal ----------
  const handleDelete = (student) => {
    const studentName = `${student.last_name}, ${student.first_name}`;
    openConfirm({
      title: 'Delete Student Record',
      message: (
        <>
          Are you sure you want to permanently delete the record of{' '}
          <strong>{studentName}</strong> ({student.student_number})?
          <br /><br />
          <span style={{ color: '#c62828', fontSize: '0.75rem' }}>
            This action cannot be undone. All associated grades, family information,
            and enrollment records will be permanently removed.
          </span>
        </>
      ),
      variant: 'danger',
      confirmLabel: 'DELETE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/students/${student.student_id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchStudents();
          } else {
            openAlert('Delete Failed', data.message || 'Failed to delete student.', 'danger');
          }
        } catch (err) {
          console.error("Error deleting student:", err);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: () => setConfirmState({ isOpen: false }),
    });
  };

  // ---------- Bulk selection helpers ----------
  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === currentItems.length ? [] : currentItems.map((s) => s.student_id)
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // ---------- Bulk delete via ConfirmationModal ----------
  const handleBulkDelete = () => {
    openConfirm({
      title: 'Delete Students',
      message: (
        <>
          Permanently delete <strong>{selectedIds.length}</strong> selected student record(s)?
          <br /><br />
          <span style={{ color: '#c62828', fontSize: '0.75rem' }}>
            This action cannot be undone. All associated grades, family information,
            and enrollment records for these students will be permanently removed.
          </span>
        </>
      ),
      variant: 'danger',
      confirmLabel: 'DELETE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/students/batch-delete`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentIds: selectedIds }),
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            clearSelection();
            fetchStudents();
            openAlert('Students Deleted', data.message, 'success');
          } else {
            openAlert('Delete Failed', data.message || 'Failed to delete selected students.', 'danger');
          }
        } catch (err) {
          console.error("Error batch-deleting students:", err);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: () => setConfirmState({ isOpen: false }),
    });
  };

  const handleBulkEditSuccess = () => {
    setShowBulkEdit(false);
    clearSelection();
    fetchStudents();
  };

  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⏳</div>
          <h3 className="emptyStateTitle">Loading Masterlist</h3>
          <p className="emptyStateText">Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⚠️</div>
          <h3 className="emptyStateTitle">Error Loading Masterlist</h3>
          <p className="emptyStateText">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoData = filteredStudents.length === 0;

  return (
    <div className="InnerContainer">
      {showAddStudent && (
        <AddStudent
          isOpen={showAddStudent}
          onClose={() => {
            setShowAddStudent(false);
            setEditingStudent(null);
          }}
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
          onSuccess={() => {
            setViewingGradesFor(null);
            fetchStudents();
          }}
        />
      )}

      {/* Reusable Confirmation / Alert Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search student number, name, or email..."
            className="SearchInput"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <BiX className="ClearSearchIcon" onClick={clearSearch} />
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

        <div className="TopbarBtnContainer">
          <button className="TopbarBtn" onClick={() => { setEditingStudent(null); setShowAddStudent(true); }}>
            <BiPlusCircle className="linkIcon" />
            Student
          </button>
        </div>
      </div>

      {hasNoData ? (
        searchTerm ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No students found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={clearSearch}>Clear Search</button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">🎓</div>
            <h3 className="emptyStateTitle">No Students Yet</h3>
            <p className="emptyStateText">Get started by creating your first student record.</p>
            <button className="emptyStateBtn" onClick={() => { setEditingStudent(null); setShowAddStudent(true); }}>
              <BiPlusCircle className="linkIcon"/> Add Student
            </button>
          </div>
        )
      ) : (
        <>
          <div className="MasterlistSummary" aria-live="polite">
            <span className="MasterlistResultCount">
              Showing {visibleStart}–{visibleEnd} of {filteredStudents.length} students
            </span>
            <div className="MasterlistStandingCounts" aria-label="Academic standing summary">
              <span className="MasterlistStanding None">None {standingCounts.None}</span>
              <span className="MasterlistStanding warning">Warning {standingCounts.warning}</span>
              <span className="MasterlistStanding probationary">Probationary {standingCounts.probationary}</span>
            </div>
          </div>

          <div className="TableContainer">
            <table className="Table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Student No.</th>
                  <th>Full Name</th>
                  <th>Program</th>
                  <th>Year Level</th>
                  <th>Section</th>
                  <th>Email</th>
                  <th>Probation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((std) => (
                  <tr key={std.student_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(std.student_id)}
                        onChange={() => toggleSelectOne(std.student_id)}
                      />
                    </td>
                    <td>{std.student_number}</td>
                    <td>{`${std.last_name}, ${std.first_name}`}</td>
                    <td>{std.program_abbr || std.program_name || '-'}</td>
                    <td>{std.year_level ? `${std.year_level}` : '-'}</td>
                    <td>{std.section_name || '-'}</td>
                    <td>{std.personal_email}</td>
                    <td>
                      <span {...getStandingBadgeProps(std.academic_status)}>
                        {std.academic_status || 'None'}
                      </span>
                    </td>
                    <td className="tableActions">
                      <button className="tableEditBtn" onClick={() => handleViewGrades(std)}>
                        <BiListCheck /> Grades
                      </button>
                      <button className="tableEditBtn" onClick={() => handleEdit(std)}>
                        <BiPencil /> Edit
                      </button>
                      <button className="tableDeleteBtn" onClick={() => handleDelete(std)}>
                        <BiTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </>
      )}

      {/* Bottom floating bulk-action bar — appears once at least one row is checked */}
      {selectedIds.length > 1 && (
        <div className="BulkActionBar">
          <span className="BulkActionCount">{selectedIds.length} selected</span>
          <div className="BulkActionButtons">
            <button className="TopbarBtn" onClick={() => setShowBulkEdit(true)}>
              <BiPencil className="linkIcon" /> Edit Selected
            </button>
            <button className="tableDeleteBtn" onClick={handleBulkDelete}>
              <BiTrash /> Delete Selected
            </button>
            <button className="ClearSelectionBtn" onClick={clearSelection}>
              <BiX /> Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Masterlist;
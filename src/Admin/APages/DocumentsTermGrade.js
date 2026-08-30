import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BiSearch, BiX, BiPrinter, BiFullscreen } from 'react-icons/bi';
import Filter from '../../Components/Filter';
import '../../Global.css';
import '../../Documents.css';
import TermGrade from '../AComponents/StudentDocuments/TermGrade'; 

/**
 * ============================================================================
 * DocumentsTermGrade
 * ============================================================================
 * Routed under ADocuments (the "Term Grade" tab). Mirrors the layout of
 * DocumentsStudentForm.js: search + filter live at the top of the list
 * panel, zoom + print controls live at the top of the preview panel,
 * checkboxes drive a multi-select batch print, and the list is paginated.
 *
 * One structural difference from DocumentsStudentForm.js: TermGrade.js is a
 * pure presentational component that takes a flat `data` prop directly
 * (unlike StudentForm.js, which fetches its own data internally from a
 * studentId/adminMode prop). So this page fetches term grade data itself in
 * two places: once for whichever single student is selected (the live
 * preview), and again in bulk for whichever students are checked (the
 * hidden batch print area) - StudentForm.js only needs the second fetch,
 * since it can self-fetch for the live preview.
 *
 * NOTE: /admin/term-grade/:id does not exist on the backend yet - this is
 * still the frontend-first pass.
 * ============================================================================
 */

const DEFAULT_PREVIEW_SCALE = 1;
const MIN_PREVIEW_SCALE = 0.3;
const MAX_PREVIEW_SCALE = 1;
const PREVIEW_SCALE_STEP = 0.1;
const PAGE_WIDTH_MM = 215.9;
const PAGE_HEIGHT_MM = 330.2;
const STUDENTS_PER_PAGE = 15;

function DocumentsTermGrade() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewScale, setPreviewScale] = useState(DEFAULT_PREVIEW_SCALE);
  const [printForms, setPrintForms] = useState([]);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isPrintPending, setIsPrintPending] = useState(false);
  const [printError, setPrintError] = useState(null);

  // Term grade document data for whichever single student is selected -
  // this is the one fetch StudentForm.js doesn't need, since it self-fetches.
  const [termGradeData, setTermGradeData] = useState(null);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  // Filter state, same temp/selected pattern used in Masterlist.js / DocumentsStudentForm.js
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYearLevel, setSelectedYearLevel] = useState('');
  const [tempProgram, setTempProgram] = useState('');
  const [tempYearLevel, setTempYearLevel] = useState('');
  const [programOptions, setProgramOptions] = useState([]);
  const [yearLevelOptions] = useState(['1st Year', '2nd Year', '3rd Year', '4th Year']);
  const hasActiveFilters = selectedProgram !== '' || selectedYearLevel !== '';

  useEffect(() => {
    if (isFilterOpen) {
      setTempProgram(selectedProgram);
      setTempYearLevel(selectedYearLevel);
    }
  }, [isFilterOpen, selectedProgram, selectedYearLevel]);

  const fetchPrograms = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProgramOptions(data.data.map((p) => p.program_name));
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      } else {
        setError(data.message || 'Failed to load students.');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchPrograms();
  }, [fetchStudents, fetchPrograms]);

  // Live preview fetch: term grade data for whichever single student is
  // currently selected. Independent of the batch print fetch below.
  useEffect(() => {
    if (!selectedStudentId) {
      setTermGradeData(null);
      return;
    }

    const fetchTermGrade = async () => {
      setGradeLoading(true);
      setGradeError(null);
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/term-grade/${selectedStudentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        if (data.success) {
          setTermGradeData(data.data);
        } else {
          setGradeError(data.message || 'Failed to load term grade document.');
        }
      } catch (err) {
        console.error('Error fetching term grade document:', err);
        setGradeError('Failed to connect to the server.');
      } finally {
        setGradeLoading(false);
      }
    };

    fetchTermGrade();
  }, [selectedStudentId]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return students.filter((std) => {
      const fullName = `${std.first_name} ${std.last_name}`.toLowerCase();
      const matchesSearch = !term ||
        fullName.includes(term) ||
        std.student_number?.toLowerCase().includes(term) ||
        std.personal_email?.toLowerCase().includes(term);

      const matchesProgram = !selectedProgram || std.program_name === selectedProgram;
      const matchesYearLevel = !selectedYearLevel || std.year_level?.toString() === selectedYearLevel.charAt(0);

      return matchesSearch && matchesProgram && matchesYearLevel;
    });
  }, [students, searchTerm, selectedProgram, selectedYearLevel]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const indexOfFirstStudent = (currentPage - 1) * STUDENTS_PER_PAGE;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfFirstStudent + STUDENTS_PER_PAGE);
  const selectedStudentIdSet = useMemo(() => new Set(selectedStudentIds), [selectedStudentIds]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!isPrintPending || printForms.length === 0) return undefined;

    const printTimer = window.setTimeout(() => {
      window.print();
      setIsPrintPending(false);
    }, 0);

    return () => window.clearTimeout(printTimer);
  }, [isPrintPending, printForms]);

  const filters = [
    {
      name: 'program',
      label: 'PROGRAM',
      value: tempProgram,
      options: programOptions,
      placeholder: 'ALL PROGRAMS'
    },
    {
      name: 'yearLevel',
      label: 'YEAR LEVEL',
      value: tempYearLevel,
      options: yearLevelOptions,
      placeholder: 'ALL YEARS'
    }
  ];

  const handleFilterChange = (name, value) => {
    if (name === 'program') setTempProgram(value);
    else if (name === 'yearLevel') setTempYearLevel(value);
  };

  const resetFilters = () => {
    setTempProgram('');
    setTempYearLevel('');
    setSelectedProgram('');
    setSelectedYearLevel('');
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setSelectedProgram(tempProgram);
    setSelectedYearLevel(tempYearLevel);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId) || null;

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((ids) => (
      ids.includes(studentId)
        ? ids.filter((id) => id !== studentId)
        : [...ids, studentId]
    ));
  };

  const handlePrint = async () => {
    if (selectedStudentIds.length === 0 || isPreparingPrint) return;

    setIsPreparingPrint(true);
    setPrintError(null);

    try {
      const token = sessionStorage.getItem('token');
      const forms = await Promise.all(selectedStudentIds.map(async (studentId) => {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/term-grade/${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to prepare one or more term grade documents.');
        }

        return { studentId, data: result.data };
      }));

      setPrintForms(forms);
      setIsPrintPending(true);
    } catch (err) {
      console.error('Batch print error:', err);
      setPrintError(err.message || 'Unable to prepare the selected term grade documents.');
    } finally {
      setIsPreparingPrint(false);
    }
  };

  const changePreviewScale = (amount) => {
    setPreviewScale((scale) => Math.min(
      MAX_PREVIEW_SCALE,
      Math.max(MIN_PREVIEW_SCALE, Number((scale + amount).toFixed(1)))
    ));
  };

  const resetPreviewScale = () => setPreviewScale(DEFAULT_PREVIEW_SCALE);

  return (
    <>
      <div className="DocSplitView">

        <div className="DocListPanel">
          <div className="DocListTop">
            <div className="SearchWrapper">
              <BiSearch className="SearchIcon" />
              <input
                type="text"
                placeholder="Search students..."
                className="SearchInput"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <BiX className="ClearSearchIcon" onClick={() => { setSearchTerm(''); setCurrentPage(1); }} />
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
          </div>
          <div className="DocListSelectionInfo">
            {selectedStudentIds.length} selected for printing
          </div>
          <div className="DocStudentList">
            {loading ? (
              <p className="DocListMessage">Loading students...</p>
            ) : error ? (
              <p className="DocListMessage" style={{ color: '#c62828' }}>{error}</p>
            ) : filteredStudents.length === 0 ? (
              <p className="DocListMessage">No students found.</p>
            ) : (
              currentStudents.map((std) => (
                <div
                  key={std.student_id}
                  className={`DocStudentRow ${selectedStudentId === std.student_id ? 'Active' : ''} ${selectedStudentIdSet.has(std.student_id) ? 'Selected' : ''}`}
                  onClick={() => {
                    setSelectedStudentId(std.student_id);
                    toggleStudentSelection(std.student_id);
                  }}
                >
                  <input
                    className="DocStudentCheckbox"
                    type="checkbox"
                    checked={selectedStudentIdSet.has(std.student_id)}
                    onChange={() => toggleStudentSelection(std.student_id)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Select ${std.last_name}, ${std.first_name} for printing`}
                  />
                  <div className="DocStudentRowContent">
                    <p className="DocStudentName">{std.last_name}, {std.first_name}</p>
                    <p className="DocStudentMeta">
                      {std.student_number} &middot; {std.program_abbr || std.program_name || '-'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {!loading && !error && filteredStudents.length > 0 && (
            <div className="PaginationContainer DocListPagination">
              <div className="PaginationControls">
                <button className="PageBtn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
                <button className="PageBtn" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>‹</button>
                <div className="CurrentPageInputWrapper">
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => {
                      const page = Number.parseInt(e.target.value, 10);
                      if (page >= 1 && page <= totalPages) setCurrentPage(page);
                    }}
                    className="CurrentPageInput"
                    aria-label="Current page"
                  />
                </div>
                <div className="PaginationInfo">out of <span>{totalPages}</span></div>
                <button className="PageBtn" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>›</button>
                <button className="PageBtn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
              </div>
            </div>
          )}
        </div>

        <div className="DocPreviewPanel">
          <div className="DocPreviewActions">
            <button className="TopbarBtn" onClick={handlePrint} disabled={selectedStudentIds.length === 0 || isPreparingPrint}>
              <BiPrinter className="linkIcon" /> {isPreparingPrint ? 'Preparing…' : `Print (${selectedStudentIds.length})`}
            </button>
            {printError && <p className="DocPrintError" role="alert">{printError}</p>}
          </div>

          <div className="DocPreviewZoomControls" aria-label="Document preview zoom">
            <button
              type="button"
              className="DocPreviewZoomButton"
              onClick={resetPreviewScale}
              disabled={previewScale === DEFAULT_PREVIEW_SCALE}
              title={`Reset zoom to ${Math.round(DEFAULT_PREVIEW_SCALE * 100)}%`}
              aria-label="Reset zoom"
            >
              <BiFullscreen />
            </button>
            <button
              type="button"
              className="DocPreviewZoomButton"
              onClick={() => changePreviewScale(PREVIEW_SCALE_STEP)}
              disabled={previewScale >= MAX_PREVIEW_SCALE}
              title={`Zoom in (${Math.round(previewScale * 100)}%)`}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="DocPreviewZoomButton"
              onClick={() => changePreviewScale(-PREVIEW_SCALE_STEP)}
              disabled={previewScale <= MIN_PREVIEW_SCALE}
              title={`Zoom out (${Math.round(previewScale * 100)}%)`}
              aria-label="Zoom out"
            >
              −
            </button>
          </div>

          {!selectedStudent ? (
            <div className="DocEmptyState">
              <p>Select a student to preview their term grade document.</p>
            </div>
          ) : gradeLoading ? (
            <div className="DocEmptyState">
              <p>Loading term grade document...</p>
            </div>
          ) : gradeError ? (
            <div className="DocEmptyState">
              <p style={{ color: '#c62828' }}>{gradeError}</p>
            </div>
          ) : (
            <div
              className="DocPreviewOuter DocPrintArea"
              style={{
                width: `calc(${PAGE_WIDTH_MM}mm * ${previewScale})`,
                height: `calc(${PAGE_HEIGHT_MM}mm * ${previewScale})`
              }}
            >
              <div
                className="DocPreviewScaler"
                style={{
                  width: `${PAGE_WIDTH_MM}mm`,
                  height: `${PAGE_HEIGHT_MM}mm`,
                  transform: `scale(${previewScale})`
                }}
              >
                <TermGrade data={termGradeData} />
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="DocBatchPrintArea">
        {printForms.map(({ studentId, data }) => (
          <div className="DocBatchPrintForm" key={studentId}>
            <TermGrade data={data} />
          </div>
        ))}
      </div>
    </>
  );
}

export default DocumentsTermGrade;
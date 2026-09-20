import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BiSearch, BiX, BiPrinter, BiFullscreen } from 'react-icons/bi';
import Filter from '../../Components/Filter';
import '../../Global.css';
import '../../Documents.css';
import CourseOutline from '../AComponents/StudentDocuments/CourseOutline';

const DEFAULT_PREVIEW_SCALE = 1;
const MIN_PREVIEW_SCALE = 0.3;
const MAX_PREVIEW_SCALE = 1;
const PREVIEW_SCALE_STEP = 0.1;
const PAGE_WIDTH_MM = 215.9;
const PAGE_HEIGHT_MM = 330.2;

function DocumentsCourseOutline() {
  const [students, setStudents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [outlineData, setOutlineData] = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineError, setOutlineError] = useState(null);

  const [previewScale, setPreviewScale] = useState(DEFAULT_PREVIEW_SCALE);
  const [printForms, setPrintForms] = useState([]);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isPrintPending, setIsPrintPending] = useState(false);
  const [printError, setPrintError] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [tempProgram, setTempProgram] = useState('');
  const [programOptions, setProgramOptions] = useState([]);
  const hasActiveFilters = selectedProgram !== '';

  // --- Fetch programs + curricula on mount ---
// --- Fetch programs (for filter) + students on mount ---
useEffect(() => {
  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const [programsRes, studentsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.REACT_APP_API_URL}/admin/students`, {   // <-- was /admin/curricula
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const programsData = await programsRes.json();
      const studentsData = await studentsRes.json();
      if (programsData.success) setProgramOptions(programsData.data.map((p) => p.program_abbr || p.program_name));
      if (studentsData.success) setStudents(studentsData.data);      // <-- rename state
      else setError(studentsData.message || 'Failed to load students.');
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };
  fetchAll();
}, []);


// --- Fetch outline when a student is selected ---
  useEffect(() => {
    if (!selectedStudentId) {
      setOutlineData(null);
      return;
    }
    const fetchOutline = async () => {
      setOutlineLoading(true);
      setOutlineError(null);
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/course-outline/${selectedStudentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        if (data.success) setOutlineData(data.data);
        else setOutlineError(data.message || 'Failed to load outline.');
      } catch (err) {
        console.error('Error fetching outline:', err);
        setOutlineError('Failed to connect to the server.');
      } finally {
        setOutlineLoading(false);
      }
    };
    fetchOutline();
  }, [selectedStudentId]);

      const filteredStudents = useMemo(() => {
      const term = searchTerm.toLowerCase();
      return students.filter((s) => {
        const label = `${s.first_name || ''} ${s.last_name || ''} ${s.student_number || ''} ${s.program_abbr || ''}`.toLowerCase();
        const matchesSearch = !term || label.includes(term);
        const matchesProgram = !selectedProgram || (s.program_abbr || s.program_name) === selectedProgram;
        return matchesSearch && matchesProgram;
      });
    }, [students, searchTerm, selectedProgram]);

    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const selectedStudent = students.find((s) => s.student_id === selectedStudentId) || null;

    const toggleSelection = (id) => {
      setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    };

  const handlePrint = async () => {
    if (selectedIds.length === 0 || isPreparingPrint) return;
    setIsPreparingPrint(true);
    setPrintError(null);
    try {
      const token = sessionStorage.getItem('token');
      const forms = await Promise.all(selectedIds.map(async (studentId) => {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/course-outline/${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to prepare one or more outlines.');
        }
        return { studentId, data: result.data };
      }));
      setPrintForms(forms);
      setIsPrintPending(true);
    } catch (err) {
      console.error('Batch print error:', err);
      setPrintError(err.message || 'Unable to prepare the selected outlines.');
    } finally {
      setIsPreparingPrint(false);
    }
  };

  useEffect(() => {
    if (!isPrintPending || printForms.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      window.print();
      setIsPrintPending(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isPrintPending, printForms]);

  const changePreviewScale = (amount) => {
    setPreviewScale((scale) => Math.min(MAX_PREVIEW_SCALE, Math.max(MIN_PREVIEW_SCALE, Number((scale + amount).toFixed(1)))));
  };
  const resetPreviewScale = () => setPreviewScale(DEFAULT_PREVIEW_SCALE);

  const filters = [
    { name: 'program', label: 'PROGRAM', value: tempProgram, options: programOptions, placeholder: 'ALL PROGRAMS' },
  ];

  const handleFilterChange = (name, value) => {
    if (name === 'program') setTempProgram(value);
  };
  const resetFilters = () => {
    setTempProgram('');
    setSelectedProgram('');
    setIsFilterOpen(false);
  };
  const applyFilters = () => {
    setSelectedProgram(tempProgram);
    setIsFilterOpen(false);
  };

  return (
    <>
      <div className="DocSplitView">
        {/* Left: curriculum list */}
        <div className="DocListPanel">
          <div className="DocListTop">
            <div className="SearchWrapper">
              <BiSearch className="SearchIcon" />
              <input
                type="text"
                placeholder="Search students..."
                className="SearchInput"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <BiX className="ClearSearchIcon" onClick={() => setSearchTerm('')} />
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
          <div className="DocListSelectionInfo">{selectedIds.length} selected for printing</div>
          <div className="DocStudentList">
            {loading ? (
              <p className="DocListMessage">Loading curricula...</p>
            ) : error ? (
              <p className="DocListMessage" style={{ color: '#c62828' }}>{error}</p>
            ) : filteredStudents.length === 0 ? (
              <p className="DocListMessage">No students found.</p>
            ) : (
              filteredStudents.map((stu) => (
              <div
                key={stu.student_id}
                className={`DocStudentRow ${selectedStudentId === stu.student_id ? 'Active' : ''} ${selectedIdSet.has(stu.student_id) ? 'Selected' : ''}`}
                onClick={() => {
                  setSelectedStudentId(stu.student_id);
                  toggleSelection(stu.student_id);
                }}
              >
                <input
                  className="DocStudentCheckbox"
                  type="checkbox"
                  checked={selectedIdSet.has(stu.student_id)}
                  onChange={() => toggleSelection(stu.student_id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="DocStudentRowContent">
                  <p className="DocStudentName">
                    {stu.last_name}, {stu.first_name} {stu.middle_name ? stu.middle_name[0] + '.' : ''}
                  </p>
                  <p className="DocStudentMeta">
                    {stu.student_number} · {stu.program_abbr || stu.program_name}
                  </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: preview */}
        <div className="DocPreviewPanel">
          <div className="DocPreviewActions">
            <button className="TopbarBtn" onClick={handlePrint} disabled={selectedIds.length === 0 || isPreparingPrint}>
              <BiPrinter className="linkIcon" /> {isPreparingPrint ? 'Preparing…' : `Print (${selectedIds.length})`}
            </button>
            {printError && <p className="DocPrintError">{printError}</p>}
          </div>

          <div className="DocPreviewZoomControls">
            <button type="button" className="DocPreviewZoomButton" onClick={resetPreviewScale} disabled={previewScale === DEFAULT_PREVIEW_SCALE}><BiFullscreen /></button>
            <button type="button" className="DocPreviewZoomButton" onClick={() => changePreviewScale(PREVIEW_SCALE_STEP)} disabled={previewScale >= MAX_PREVIEW_SCALE}>+</button>
            <button type="button" className="DocPreviewZoomButton" onClick={() => changePreviewScale(-PREVIEW_SCALE_STEP)} disabled={previewScale <= MIN_PREVIEW_SCALE}>−</button>
          </div>

          {!selectedStudent ? (
            <div className="DocEmptyState"><p>Select a student to preview its course outline.</p></div>
          ) : outlineLoading ? (
            <div className="DocEmptyState"><p>Loading outline...</p></div>
          ) : outlineError ? (
            <div className="DocEmptyState"><p style={{ color: '#c62828' }}>{outlineError}</p></div>
          ) : (
            <div
              className="DocPreviewOuter DocPrintArea"
              style={{ width: `calc(${PAGE_WIDTH_MM}mm * ${previewScale})`, height: `calc(${PAGE_HEIGHT_MM}mm * ${previewScale})` }}
            >
              <div
                className="DocPreviewScaler"
                style={{ width: `${PAGE_WIDTH_MM}mm`, height: `${PAGE_HEIGHT_MM}mm`, transform: `scale(${previewScale})` }}
              >
                <CourseOutline data={outlineData} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch print area */}
      <div className="DocBatchPrintArea">
        {printForms.map(({ studentId, data }) => (
          <div className="DocBatchPrintForm" key={studentId}>
            <CourseOutline data={data} />
          </div>
        ))}
      </div>
    </>
  );
}

export default DocumentsCourseOutline;
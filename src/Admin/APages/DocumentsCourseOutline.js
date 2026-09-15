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
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
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
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('token');
        const [programsRes, curriculaRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/programs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/curricula`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const programsData = await programsRes.json();
        const curriculaData = await curriculaRes.json();
        if (programsData.success) setProgramOptions(programsData.data.map((p) => p.program_abbr || p.program_name));
        if (curriculaData.success) setCurricula(curriculaData.data);
        else setError(curriculaData.message || 'Failed to load curricula.');
      } catch (err) {
        console.error('Error loading documents:', err);
        setError('Failed to connect to the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // --- Fetch outline when a curriculum is selected ---
  useEffect(() => {
    if (!selectedCurriculumId) {
      setOutlineData(null);
      return;
    }
    const fetchOutline = async () => {
      setOutlineLoading(true);
      setOutlineError(null);
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/course-outline/${selectedCurriculumId}`,
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
  }, [selectedCurriculumId]);

  const filteredCurricula = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return curricula.filter((c) => {
      const label = `${c.program_name || ''} ${c.version_name || ''} ${c.program_abbr || ''}`.toLowerCase();
      const matchesSearch = !term || label.includes(term);
      const matchesProgram = !selectedProgram || (c.program_abbr || c.program_name) === selectedProgram;
      return matchesSearch && matchesProgram;
    });
  }, [curricula, searchTerm, selectedProgram]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCurriculum = curricula.find((c) => c.curriculum_id === selectedCurriculumId) || null;

  const toggleSelection = (id) => {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const handlePrint = async () => {
    if (selectedIds.length === 0 || isPreparingPrint) return;
    setIsPreparingPrint(true);
    setPrintError(null);
    try {
      const token = sessionStorage.getItem('token');
      const forms = await Promise.all(selectedIds.map(async (curriculumId) => {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/course-outline/${curriculumId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to prepare one or more outlines.');
        }
        return { curriculumId, data: result.data };
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
                placeholder="Search curricula..."
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
            ) : filteredCurricula.length === 0 ? (
              <p className="DocListMessage">No curricula found.</p>
            ) : (
              filteredCurricula.map((cur) => (
                <div
                  key={cur.curriculum_id}
                  className={`DocStudentRow ${selectedCurriculumId === cur.curriculum_id ? 'Active' : ''} ${selectedIdSet.has(cur.curriculum_id) ? 'Selected' : ''}`}
                  onClick={() => {
                    setSelectedCurriculumId(cur.curriculum_id);
                    toggleSelection(cur.curriculum_id);
                  }}
                >
                  <input
                    className="DocStudentCheckbox"
                    type="checkbox"
                    checked={selectedIdSet.has(cur.curriculum_id)}
                    onChange={() => toggleSelection(cur.curriculum_id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="DocStudentRowContent">
                    <p className="DocStudentName">
                      {cur.program_abbr || cur.program_name} — {cur.version_name}
                    </p>
                    <p className="DocStudentMeta">Started {cur.start_year}</p>
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

          {!selectedCurriculum ? (
            <div className="DocEmptyState"><p>Select a curriculum to preview its course outline.</p></div>
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
        {printForms.map(({ curriculumId, data }) => (
          <div className="DocBatchPrintForm" key={curriculumId}>
            <CourseOutline data={data} />
          </div>
        ))}
      </div>
    </>
  );
}

export default DocumentsCourseOutline;
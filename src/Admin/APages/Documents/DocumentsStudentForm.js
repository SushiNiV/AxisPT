import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BiSearch, BiX, BiPrinter, BiFullscreen, BiChevronRight } from 'react-icons/bi';
import BulkAction from '../../../Components/shared/BulkAction';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import StudentForm from '../../AComponents/StudentDocuments/StudentForm'; 
import useMediaQuery from '../../../Components/useMediaQuery';
import Button from '../../../Components/ui/Button';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';

const DEFAULT_PREVIEW_SCALE = 1;
const MIN_PREVIEW_SCALE = 0.5;
const MAX_PREVIEW_SCALE = 2;
const PREVIEW_SCALE_STEP = 0.1;
const PAGE_WIDTH_MM = 215.9;
const PAGE_HEIGHT_MM = 330.2;
const STUDENTS_PER_PAGE = 15;

function DocumentsStudentForm() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewScale, setPreviewScale] = useState(DEFAULT_PREVIEW_SCALE);
  const [printForms, setPrintForms] = useState([]);
  const [printReady, setPrintReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printError, setPrintError] = useState(null);
  const [showBulkPrintConfirm, setShowBulkPrintConfirm] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
  }, [fetchStudents]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return students.filter((std) => {
      const fullName = `${std.first_name} ${std.last_name}`.toLowerCase();
      return !term || fullName.includes(term) || std.student_number?.toLowerCase().includes(term) || std.personal_email?.toLowerCase().includes(term);
    });
  }, [students, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const indexOfFirstStudent = (currentPage - 1) * STUDENTS_PER_PAGE;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfFirstStudent + STUDENTS_PER_PAGE);
  const selectedStudentIdSet = useMemo(() => new Set(selectedStudentIds), [selectedStudentIds]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId) || null;

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((ids) => ids.includes(studentId) ? ids.filter((id) => id !== studentId) : [...ids, studentId]);
  };

  const clearSelection = () => setSelectedStudentIds([]);

  const handlePrint = async () => {
    if (selectedStudentIds.length === 0 || isPreparingPrint) return;
    setIsPreparingPrint(true);
    setPrintError(null);
    setReadyCount(0);
    setPrintReady(false);
    setShowBulkPrintConfirm(false);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const forms = await Promise.all(selectedStudentIds.map(async (studentId) => {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/student-form/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to prepare form.');
        return { studentId, data: result.data };
      }));

      setPrintForms(forms);
    } catch (err) {
      console.error('Batch print error:', err);
      setPrintError(err.message || 'Unable to prepare the selected student forms.');
      setIsPreparingPrint(false);
    }
  };

  const handlePortalFormReady = useCallback(() => {
    setReadyCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (printForms.length === 0) return;
    if (readyCount < printForms.length) return;
    if (printReady) return;

    setPrintReady(true);

    const raf = requestAnimationFrame(() => {
      window.print();
      setTimeout(() => {
        setIsPreparingPrint(false);
        setPrintForms([]);
        setPrintReady(false);
        setReadyCount(0);
        clearSelection();
      }, 500);
    });

    return () => cancelAnimationFrame(raf);
  }, [printForms, readyCount, printReady]);

  const changePreviewScale = (amount) => {
    setPreviewScale((scale) => Math.min(MAX_PREVIEW_SCALE, Math.max(MIN_PREVIEW_SCALE, Number((scale + amount).toFixed(1)))));
  };
  const resetPreviewScale = () => setPreviewScale(DEFAULT_PREVIEW_SCALE);

  const printStyles = `
    @media print {
      @page { size: 215.9mm 330.2mm; margin: 0; }
      
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      body * { visibility: hidden !important; }
      
      #print-portal-root, #print-portal-root * { 
        visibility: visible !important; 
      }
      
      #print-portal-root {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        background: #ffffff !important;
        background-color: #ffffff !important;
        color: #000000 !important;
        color-scheme: light !important;
        z-index: 99999;
      }
      
      .print-page {
        page-break-after: always;
        break-after: page;
      }
      .print-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      
      <div className="ax flex h-full min-h-0 gap-4 pb-4 relative">
        
        {isPreparingPrint && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
            <div className="rounded-panel border !border-line bg-surface p-6 shadow-lift flex flex-col items-center gap-3">
               <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
               <p className="font-semibold text-ink">Preparing documents for print...</p>
            </div>
          </div>
        )}

        {/* Left Pane */}
        <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-panel border !border-line bg-surface md:w-[340px]">
          <div className="flex shrink-0 items-center gap-2 border-b !border-line p-3">
            <div className="relative min-w-0 flex-1">
              <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
              <input
                type="text" placeholder="Search students..." value={searchTerm}
                className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm"
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
                  <BiX />
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0 border-b !border-line bg-surface-2 px-4 py-2 text-xs font-semibold text-ink-2">
            {selectedStudentIds.length} selected for printing
          </div>

          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loading ? (
              // --- LEFT PANE SKELETON ---
              <ul className="m-0 list-none divide-y divide-line p-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-surface-2" />
                    <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
                    </div>
                    <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-surface-2" />
                  </li>
                ))}
              </ul>
            ) : error ? (
              <p className="p-4 text-center text-sm text-danger">{error}</p>
            ) : (
              <ul className="m-0 list-none divide-y divide-line p-0">
                {currentStudents.map((std) => {
                  const isSelected = selectedStudentIdSet.has(std.student_id);
                  const isActive = selectedStudentId === std.student_id;
                  return (
                    <li key={std.student_id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-surface-2 ${isActive ? 'bg-brand-soft' : ''}`} onClick={() => { if (!isMobile) setSelectedStudentId(std.student_id); toggleStudentSelection(std.student_id); }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleStudentSelection(std.student_id)} onClick={(e) => e.stopPropagation()} className="h-4 w-4 shrink-0 accent-brand" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{std.last_name}, {std.first_name}</p>
                        <p className="truncate text-xs text-ink-2">{std.student_number} &middot; {std.program_abbr || '-'}</p>
                      </div>
                      {!isMobile && <BiChevronRight className="shrink-0 text-lg text-ink-3" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!loading && !error && filteredStudents.length > 0 && (
            <div className="shrink-0 border-t !border-line">
              <Pagination page={currentPage} pageCount={totalPages} total={filteredStudents.length} pageSize={STUDENTS_PER_PAGE} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>

        {/* Right Pane */}
        {!isMobile && (
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface-2">
            <div className="absolute right-6 top-6 z-20 flex flex-col items-end gap-3">
              {printError && <span className="rounded bg-danger-soft px-3 py-1 text-xs font-semibold text-danger shadow-sm">{printError}</span>}
              <Button onClick={() => setShowBulkPrintConfirm(true)} disabled={selectedStudentIds.length === 0 || isPreparingPrint} className="shadow-lift">
                <BiPrinter className="text-lg" /> {isPreparingPrint ? 'Preparing…' : `Print (${selectedStudentIds.length})`}
              </Button>
              <div className="flex flex-col overflow-hidden rounded-ctl border !border-line bg-surface shadow-lift">
                <button onClick={resetPreviewScale} disabled={previewScale === DEFAULT_PREVIEW_SCALE} className="flex h-10 w-10 items-center justify-center border-b !border-line text-lg text-brand hover:bg-surface-2 disabled:opacity-50"><BiFullscreen /></button>
                <button onClick={() => changePreviewScale(PREVIEW_SCALE_STEP)} disabled={previewScale >= MAX_PREVIEW_SCALE} className="flex h-10 w-10 items-center justify-center border-b !border-line text-xl font-bold text-brand hover:bg-surface-2 disabled:opacity-50">+</button>
                <div className="flex h-10 items-center justify-center border-b !border-line bg-surface-2 px-2 text-xs font-bold tabular-nums text-ink-2">{Math.round(previewScale * 100)}%</div>
                <button onClick={() => changePreviewScale(-PREVIEW_SCALE_STEP)} disabled={previewScale <= MIN_PREVIEW_SCALE} className="flex h-10 w-10 items-center justify-center text-xl font-bold text-brand hover:bg-surface-2 disabled:opacity-50">−</button>
              </div>
            </div>

            <div className="h-full w-full overflow-auto p-12 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {!selectedStudent ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState icon={BiChevronRight} title="No student selected" text="Select a student from the list." className="!border-0 !bg-transparent" />
                </div>
              ) : (
                <div className="mx-auto flex w-fit shrink-0 justify-center">
                  <div 
                    className="shadow-lift transition-transform duration-200" 
                    style={{ 
                      width: `calc(${PAGE_WIDTH_MM}mm * ${previewScale})`, 
                      height: `calc(${PAGE_HEIGHT_MM}mm * ${previewScale})`,
                      backgroundColor: '#ffffff',
                      colorScheme: 'light'
                    }}
                  >
                    <div 
                      style={{ 
                        width: `${PAGE_WIDTH_MM}mm`, 
                        height: `${PAGE_HEIGHT_MM}mm`, 
                        transform: `scale(${previewScale})`, 
                        transformOrigin: 'top left',
                        backgroundColor: '#ffffff',
                        color: '#000000'
                      }}
                    >
                      <StudentForm adminMode={true} studentId={selectedStudent.student_id} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---------- BULK ACTION FLOATING BAR ---------- */}
      <BulkAction
        studentIds={selectedStudentIds}
        showBar
        isEditOpen={false} 
        editLabel="Print Selected" 
        onRequestEdit={() => setShowBulkPrintConfirm(true)} 
        onClose={() => {}}
        onSuccess={() => {}}
        onClear={clearSelection}
        onDelete={null} 
      />

      {/* ---------- CONFIRMATION MODAL ---------- */}
      <ConfirmationModal
        isOpen={showBulkPrintConfirm}
        title={`Print ${selectedStudentIds.length} Student Forms?`}
        message="This will generate and format PDF documents for all selected students. Continue?"
        variant="info"
        confirmLabel="PRINT"
        cancelLabel="CANCEL"
        isAlert={false}
        loading={isPreparingPrint}
        onConfirm={handlePrint}
        onCancel={() => setShowBulkPrintConfirm(false)}
      />

      {printForms.length > 0 && createPortal(
        <div id="print-portal-root">
          {printForms.map(({ studentId, data }) => (
            <div key={studentId} className="print-page">
              <StudentForm
                adminMode={true}
                studentId={studentId}
                studentData={data}
                onReady={handlePortalFormReady}
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export default DocumentsStudentForm;
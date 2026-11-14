import React, { useState, useEffect, useMemo } from 'react';
import { BiSpreadsheet, BiChevronDown, BiUndo, BiX } from 'react-icons/bi';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import useMediaQuery from '../../../Components/useMediaQuery';
import Modal from '../../../Components/ui/Modal';
import Button from '../../../Components/ui/Button';
import Dropdown from '../../../Components/shared/Dropdown';
import Badge from '../../../Components/ui/Badge';
import cx from '../../../Components/ui/Cx';

const TERMS = ['Prelim', 'Midterm', 'Final'];
// key = enum value stored in the database (remarks_type)
const REMARK_LABELS = { NONE: '—', P: 'Passed', F: 'Failed', INC: 'Incomplete', NFE: 'No Final Exam' };
const REMARK_OPTIONS = Object.entries(REMARK_LABELS).map(([value, label]) => ({ value, label }));

const makeAttemptKey = (courseId, yearLevel, semesterId) => `${courseId}-${yearLevel}-${semesterId}`;

// Single source of truth for manual grade ranges (keep in sync with the DB
// check constraints and the RANGES check in grademanageModel.js).
const RULES = {
  raw:        { min: 60, max: 100 },
  transmuted: { min: 60, max: 100 },
};

// Returns a short error message, or null when the value is acceptable.
const validateGrade = (kind, v) => {
  if (v === '' || v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!/^\d{1,3}(\.\d{0,2})?$/.test(s)) return 'Numbers only';
  const n = Number(s);
  const { min, max } = RULES[kind];
  if (n < min || n > max) return `Must be ${min}–${max}`;
  return null;
};

const isValidRaw = (v) => validateGrade('raw', v) === null;
const isValidTrans = (v) => validateGrade('transmuted', v) === null;

// Typing filter: only allows input that can still grow into a value in 60-100
// (so "9" is fine on the way to "93", but "5", "45" or "101" are blocked).
const canTypeGrade = (s) => {
  if (s === '') return true;
  if (!/^\d{1,3}(\.\d{0,2})?$/.test(s)) return false;
  const n = Number(s);
  if (n > 100) return false;
  if (n >= 60) return true;
  return /^(1|10|[6-9])$/.test(s);
};

const getTransmutedEquivalent = (val) => {
  const n = Number(val);
  if (isNaN(n)) return '';
  if (n >= 1 && n <= 5) {
    let pct = 0;
    if (n >= 4.0) pct = 70 + ((5 - n) / 1) * 5; 
    else if (n >= 3.0) pct = 75 + ((4 - n) / 1) * 5;
    else if (n >= 2.75) pct = 76 + ((3 - n) / 0.25) * 3;
    else if (n >= 2.5) pct = 80 + ((2.75 - n) / 0.25) * 2;
    else if (n >= 2.25) pct = 83 + ((2.5 - n) / 0.25) * 2;
    else if (n >= 2.0) pct = 86 + ((2.25 - n) / 0.25) * 2;
    else if (n >= 1.75) pct = 89 + ((2.0 - n) / 0.25) * 2;
    else if (n >= 1.5) pct = 92 + ((1.75 - n) / 0.25) * 2;
    else if (n >= 1.25) pct = 95 + ((1.5 - n) / 0.25) * 2;
    else pct = 98 + ((1.25 - n) / 0.25) * 2;
    return `~${Math.round(pct)}%`;
  }
  if (n > 5 && n <= 100) {
    let point = 5.0;
    if (n >= 98) point = 1.0;
    else if (n >= 95) point = 1.25;
    else if (n >= 92) point = 1.5;
    else if (n >= 89) point = 1.75;
    else if (n >= 86) point = 2.0;
    else if (n >= 83) point = 2.25;
    else if (n >= 80) point = 2.5;
    else if (n >= 76) point = 2.75;
    else if (n >= 75) point = 3.0;
    else point = 5.0;
    return `${point.toFixed(2)}`;
  }
  return '';
};

const LocalSearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = React.useRef(null);

  useEffect(() => {
    if (!isOpen) {
      const selected = options.find(o => String(o.value) === String(value));
      setSearchTerm(selected ? selected.label : '');
    }
  }, [value, isOpen, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  const filtered = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className="h-10 w-full rounded-ctl bg-surface-2 px-3 text-sm text-ink ring-1 ring-line-strong focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); if (!e.target.value) onChange(''); }}
        onFocus={() => { setSearchTerm(''); setIsOpen(true); }}
      />
      <BiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
      
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-48 w-full overflow-y-auto rounded-ctl border border-line bg-surface p-1 shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-ink-3">No courses found</div>
          ) : (
            filtered.map(opt => (
              <div
                key={opt.value}
                className={cx(
                  "cursor-pointer truncate rounded-md px-3 py-2 text-sm transition-colors",
                  String(value) === String(opt.value) ? "bg-brand text-brand-on" : "text-ink hover:bg-surface-2"
                )}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Raw native input, fully controlled
const ScoreInput = ({ attemptKey, term, field, termScores, entry, onChange, isMobileView = false }) => {
  if (!field) return <span className="text-ink-3 opacity-30" aria-hidden="true">—</span>;
  const value = termScores[field.component] ?? '';
  const isValid = value === '' || (Number(value) >= 0 && Number(value) <= 100);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(attemptKey, term, field.component, e.target.value)}
      onWheel={(e) => e.currentTarget.blur()}
      aria-label={`${entry.courseCode} ${term} ${field.component}`}
      aria-invalid={!isValid}
      className={cx(
        "h-9 rounded-ctl bg-surface-2 px-2 text-center text-sm font-semibold text-ink ring-1 ring-line-strong focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        isMobileView ? "w-full" : "w-[72px]",
        !isValid && "ring-2 ring-danger bg-danger-soft"
      )}
    />
  );
};

const ManualGradeInput = ({ val, onChange, placeholder, isValid, showConversion, kind }) => {
  const error = kind ? validateGrade(kind, val) : null;
  const equivalent = showConversion && val && !error ? getTransmutedEquivalent(val) : '';
  return (
    <div className="flex flex-col items-center justify-start min-h-[44px]">
      <input
        type="text"
        inputMode="decimal"
        value={val}
        onChange={(e) => {
          const next = e.target.value;
          if (kind && !canTypeGrade(next)) return;
          onChange(next);
        }}
        onWheel={(e) => e.currentTarget.blur()}
        placeholder={placeholder}
        aria-invalid={!isValid}
        className={cx(
          "h-9 w-[72px] rounded-ctl bg-surface-2 px-2 text-center text-sm font-semibold text-ink ring-1 ring-line-strong focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
          !isValid && "ring-2 ring-danger bg-danger-soft"
        )}
      />
      {error ? (
        <span className="mt-1 text-xs font-medium leading-none text-danger">{error}</span>
      ) : equivalent && (
        <span
          title="Grade-point equivalent"
          className="mt-1 inline-flex items-center rounded-md bg-brand/10 px-2 py-1 text-sm font-bold leading-none text-brand-ink"
        >
          = {equivalent}
        </span>
      )}
    </div>
  );
};

function GradeTable({ 
  attemptKeys, gradesMap, activeTerm, onScoreChange, onManualGradeChange, onRemarksChange, onRemove, 
  getAllComponentsForTerm, yearLevel, semesterId, isMobile 
}) {
  const allComponents = getAllComponentsForTerm(attemptKeys, activeTerm);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {attemptKeys.map((attemptKey) => {
          const entry = gradesMap[attemptKey];
          if (!entry) return null;
          const termScores = entry.scoresByTerm[activeTerm] || {};
          const entryComponents = (entry.enterableFields || []).filter(f => f.term === null || f.term === activeTerm);
          
          return (
            <div key={attemptKey} className="rounded-panel border border-line bg-surface p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-ink">{entry.courseCode}</div>
                  <div className="text-xs text-ink-2">{entry.courseName}</div>
                </div>
                {(!entry.inCurriculum || entry.gradeId) && (
                  <button
                    type="button"
                    onClick={() => onRemove(yearLevel, semesterId, attemptKey)}
                    aria-label={`Remove ${entry.courseCode}`}
                    className="grid h-10 w-10 place-items-center text-ink-3 hover:text-danger"
                  >
                    <BiX />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {allComponents.map(comp => {
                  const field = entryComponents.find(f => f.component === comp);
                  return (
                    <div key={comp} className="space-y-1">
                      <label className="text-[0.7rem] font-semibold uppercase text-ink-2">{comp}</label>
                      {field ? (
                        <ScoreInput attemptKey={attemptKey} term={activeTerm} field={field} termScores={termScores} entry={entry} onChange={onScoreChange} isMobileView={true} />
                      ) : (
                        <span className="text-ink-3 opacity-30 block text-center py-2">—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-dashed border-line grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.7rem] font-semibold uppercase text-ink-2 mb-1 block text-center">Raw</label>
                  <ManualGradeInput 
                    val={entry.grades?.[activeTerm]?.raw ?? ''}
                    onChange={(v) => onManualGradeChange(attemptKey, activeTerm, 'raw', v)}
                    placeholder="60-100"
                    kind="raw"
                    isValid={isValidRaw(entry.grades?.[activeTerm]?.raw)}
                  />
                </div>
                <div>
                  <label className="text-[0.7rem] font-semibold uppercase text-ink-2 mb-1 block text-center">Transmuted</label>
                  <ManualGradeInput 
                    val={entry.grades?.[activeTerm]?.transmuted ?? ''}
                    onChange={(v) => onManualGradeChange(attemptKey, activeTerm, 'transmuted', v)}
                    placeholder="60-100"
                    kind="transmuted"
                    isValid={isValidTrans(entry.grades?.[activeTerm]?.transmuted)}
                    showConversion={true}
                  />
                </div>
                {activeTerm === 'Final' && (
                  <div className="col-span-2 mt-2">
                    <label className="text-[0.7rem] font-semibold uppercase text-ink-2 mb-1 block">Final Remarks</label>
                    <Dropdown
                      options={REMARK_OPTIONS}
                      value={entry.remarks || 'NONE'}
                      onChange={(v) => onRemarksChange(attemptKey, v === 'NONE' ? '' : v)}
                      placeholder="—"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="w-[70px] px-1 py-2 text-left text-[0.6rem] font-bold uppercase tracking-wider text-ink-3">Code</th>
            <th className="w-[150px] px-1 py-2 text-left text-[0.6rem] font-bold uppercase tracking-wider text-ink-3">Course</th>
            
            {allComponents.map(comp => (
              <th key={comp} className="w-[100px] px-0.5 py-2 text-center text-[0.6rem] font-bold uppercase tracking-wider text-ink-3 truncate" title={comp}>
                {comp}
              </th>
            ))}
            
            <th className="w-[120px] pl-6 pr-3 py-2 text-center text-[0.65rem] font-extrabold uppercase tracking-wider text-ink-2 border-l-2 border-line-strong">Raw</th>
            <th className="w-[120px] px-3 py-2 text-center text-[0.65rem] font-extrabold uppercase tracking-wider text-ink-2">Transmuted</th>

            {activeTerm === 'Final' && (
              <th className="w-[170px] pl-6 pr-3 py-2 text-center text-[0.65rem] font-extrabold uppercase tracking-wider text-ink-2 border-l-2 border-line-strong">Remarks</th>
            )}
            
            <th className="w-[40px]"></th>
          </tr>
        </thead>
        <tbody>
          {attemptKeys.map((attemptKey) => {
            const entry = gradesMap[attemptKey];
            if (!entry) return null;
            const termScores = entry.scoresByTerm[activeTerm] || {};
            const entryComponents = (entry.enterableFields || []).filter(f => f.term === null || f.term === activeTerm);

            return (
              <tr key={attemptKey} className="border-b border-line last:border-b-0 align-top h-[88px]">
                <td className="px-1 py-3 font-bold text-brand-ink whitespace-nowrap text-xs">
                  {entry.courseCode}
                </td>
                <td className="px-1 py-3 text-ink text-xs truncate" title={entry.courseName}>{entry.courseName}</td>
                
                {allComponents.map(comp => {
                  const field = entryComponents.find(f => f.component === comp);
                  return (
                    <td key={comp} className="px-0.5 py-3 text-center">
                      {field ? (
                        <ScoreInput attemptKey={attemptKey} term={activeTerm} field={field} termScores={termScores} entry={entry} onChange={onScoreChange} />
                      ) : (
                        <span className="text-ink-3 opacity-30">—</span>
                      )}
                    </td>
                  );
                })}

                <td className="pl-6 pr-3 py-3 text-center border-l-2 border-line-strong">
                  <ManualGradeInput 
                    val={entry.grades?.[activeTerm]?.raw ?? ''}
                    onChange={(v) => onManualGradeChange(attemptKey, activeTerm, 'raw', v)}
                    placeholder="60-100"
                    kind="raw"
                    isValid={isValidRaw(entry.grades?.[activeTerm]?.raw)}
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <ManualGradeInput 
                    val={entry.grades?.[activeTerm]?.transmuted ?? ''}
                    onChange={(v) => onManualGradeChange(attemptKey, activeTerm, 'transmuted', v)}
                    placeholder="60-100"
                    kind="transmuted"
                    isValid={isValidTrans(entry.grades?.[activeTerm]?.transmuted)}
                    showConversion={true}
                  />
                </td>

                {activeTerm === 'Final' && (
                  <td className="pl-6 pr-3 py-3 text-center border-l-2 border-line-strong">
                    <Dropdown
                      options={REMARK_OPTIONS}
                      value={entry.remarks || 'NONE'}
                      onChange={(v) => onRemarksChange(attemptKey, v === 'NONE' ? '' : v)}
                      placeholder="—"
                    />
                  </td>
                )}
                
                <td className="w-8 px-1 py-3 text-center">
                  {(!entry.inCurriculum || entry.gradeId) && (
                    <button
                      type="button"
                      onClick={() => onRemove(yearLevel, semesterId, attemptKey)}
                      aria-label={`Remove ${entry.courseCode}`}
                      title="Remove course"
                      className="text-ink-3 hover:text-danger mt-2"
                    >
                      <BiX className="text-lg" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const AddGrade = ({ onClose, onSuccess, student }) => {
  const studentId = useMemo(() => student?.student_id, [student?.student_id]);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const [meta, setMeta] = useState(null);
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeTerm, setActiveTerm] = useState('Prelim');
  const [gradesMap, setGradesMap] = useState({});
  const [attemptKeysBySemester, setAttemptKeysBySemester] = useState({});
  const [gradableCourses, setGradableCourses] = useState([]);
  const [addingToSemesterKey, setAddingToSemesterKey] = useState(null);
  const [courseToAdd, setCourseToAdd] = useState('');
  
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });
  const [archiveState, setArchiveState] = useState({ isOpen: false, entry: null, attemptKey: null, yearLevel: null, semesterId: null });
  const [archiveReason, setArchiveReason] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archivedGrades, setArchivedGrades] = useState([]);

  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openConfirm = (config) => setConfirmState({ isOpen: true, variant: 'info', confirmLabel: 'CONFIRM', cancelLabel: 'CANCEL', isAlert: false, loading: false, ...config });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });
  const showSuccess = (title, message) => setSuccessState({ isOpen: true, title, message, variant: 'success' });

  useEffect(() => {
    if (!studentId) return;
    
    setLoading(true);
    setMeta(null);
    setYears([]);
    setActiveYear(null);
    setActiveSemester(null);
    setGradesMap({});
    setAttemptKeysBySemester({});
    setArchivedGrades([]);
    setShowArchived(false);
    setError(null);

    let cancelled = false;

    const fetchAll = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const [sheetRes, coursesRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/students/${studentId}/gradable-courses`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (cancelled) return; 
        
        if (!sheetRes.ok) throw new Error('Failed to load grade sheet.');
        if (!coursesRes.ok) throw new Error('Failed to load gradable courses.');
        const sheetJson = await sheetRes.json();
        const coursesJson = await coursesRes.json();
        
        if (cancelled) return;

        if (!sheetJson.success) {
          setError(sheetJson.message || 'Failed to load grade sheet.');
          return;
        }
        const sheet = sheetJson.data;
        
        setMeta({
          programName: sheet.programName, programAbbr: sheet.programAbbr,
          totalYears: sheet.totalYears, currentYearLevel: sheet.currentYearLevel,
        });
        setYears(sheet.years);

        // Start on the student's current year; if the sheet has no block for it,
        // fall back to the first year so a year AND a semester are always selected.
        const currentYearNum = Number(sheet.currentYearLevel) || 1;
        const startYear = sheet.years.find(y => y.yearLevel === currentYearNum) || sheet.years[0];
        if (startYear) {
          setActiveYear(startYear.yearLevel);
          if (startYear.semesters?.length) {
            setActiveSemester(startYear.semesters[0].semesterId);
          }
        }

        const map = {};
        const keysBySemester = {};
        sheet.years.forEach((yearBlock) => {
          yearBlock.semesters.forEach((sem) => {
            const semKey = `${yearBlock.yearLevel}-${sem.semesterId}`;
            keysBySemester[semKey] = sem.courses.map((c) => makeAttemptKey(c.courseId, yearBlock.yearLevel, sem.semesterId));
            sem.courses.forEach((course) => {
              const key = makeAttemptKey(course.courseId, yearBlock.yearLevel, sem.semesterId);
              map[key] = {
                ...course,
                yearLevel: yearBlock.yearLevel,
                semesterId: sem.semesterId,
                isNew: false,
                scoresByTerm: {
                  Prelim: { ...course.scoresByTerm?.Prelim },
                  Midterm: { ...course.scoresByTerm?.Midterm },
                  Final: { ...course.scoresByTerm?.Final }
                },
                grades: {
                  Prelim: { raw: course.prelim_raw ?? '', transmuted: course.prelim_transmuted ?? '' },
                  Midterm: { raw: course.midterm_raw ?? '', transmuted: course.midterm_transmuted ?? '' },
                  Final: { raw: course.final_raw ?? '', transmuted: course.final_transmuted ?? '' },
                },
                remarks: course.remarks ?? ''
              };
            });
          });
        });
        
        if (cancelled) return;

        setGradesMap(map);
        setAttemptKeysBySemester(keysBySemester);
        if (coursesJson.success) setGradableCourses(coursesJson.data);
        setIsDirty(false);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to connect to the server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchAll();
    return () => { cancelled = true; };
  }, [studentId]);

  useEffect(() => {
    if (!showArchived || !studentId) return;
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades/archived`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.success) setArchivedGrades(data.data); })
      .catch(() => {});
  }, [showArchived, studentId]);

  const handleScoreChange = (attemptKey, term, component, rawValue) => {
    if (rawValue !== '' && (isNaN(Number(rawValue)) || Number(rawValue) < 0 || Number(rawValue) > 100)) return;
    setIsDirty(true);
    setGradesMap((prev) => ({
      ...prev,
      [attemptKey]: {
        ...prev[attemptKey],
        scoresByTerm: {
          ...prev[attemptKey].scoresByTerm,
          [term]: { ...prev[attemptKey].scoresByTerm[term], [component]: rawValue }
        }
      }
    }));
  };

  const handleManualGradeChange = (attemptKey, term, field, value) => {
    setIsDirty(true);
    setGradesMap((prev) => ({
      ...prev,
      [attemptKey]: {
        ...prev[attemptKey],
        grades: {
          ...prev[attemptKey].grades,
          [term]: { ...prev[attemptKey].grades[term], [field]: value }
        }
      }
    }));
  };

  const handleRemarksChange = (attemptKey, value) => {
    setIsDirty(true);
    setGradesMap((prev) => ({
      ...prev,
      [attemptKey]: { ...prev[attemptKey], remarks: value }
    }));
  };

  const getAllComponentsForTerm = (attemptKeys, term) => {
    const components = new Set();
    attemptKeys.forEach((key) => {
      const entry = gradesMap[key];
      if (!entry) return;
      (entry.enterableFields || [])
        .filter(f => f.term === null || f.term === term)
        .forEach(f => components.add(f.component));
    });
    return Array.from(components);
  };

  const insertCourse = (course, yearLevel, semesterId) => {
    const attemptKey = makeAttemptKey(course.courseId, yearLevel, semesterId);
    const semKey = `${yearLevel}-${semesterId}`;
    setIsDirty(true);
    setGradesMap((prev) => ({
      ...prev,
      [attemptKey]: { 
        ...course, 
        yearLevel, 
        semesterId, 
        isNew: true, 
        attemptCount: 1, 
        scoresByTerm: { Prelim: {}, Midterm: {}, Final: {} },
        grades: { Prelim: { raw: '', transmuted: '' }, Midterm: { raw: '', transmuted: '' }, Final: { raw: '', transmuted: '' } },
        remarks: ''
      }
    }));
    setAttemptKeysBySemester((prev) => ({ ...prev, [semKey]: [...(prev[semKey] || []), attemptKey] }));
    setCourseToAdd('');
    setAddingToSemesterKey(null);
  };

  const handleAddCourse = (yearLevel, semesterId) => {
    if (!courseToAdd) return;
    const course = gradableCourses.find((c) => c.courseId === Number(courseToAdd));
    if (!course) return;
    if (course.curriculumYearLevel && course.curriculumYearLevel !== yearLevel) {
      openConfirm({
        title: 'Add off-curriculum course?',
        message: `"${course.courseCode} — ${course.courseName}" belongs to Year ${course.curriculumYearLevel}. Continue?`,
        variant: 'warning', confirmLabel: 'ADD ANYWAY',
        onConfirm: () => { closeConfirm(); insertCourse(course, yearLevel, semesterId); },
        onCancel: closeConfirm
      });
      return;
    }
    insertCourse(course, yearLevel, semesterId);
  };

  // A curriculum course is always listed, so after its grade is deleted or archived the
  // row is reset to empty instead of being removed from the sheet.
  const clearCourseRow = (attemptKey) => {
    setGradesMap((prev) => ({
      ...prev,
      [attemptKey]: {
        ...prev[attemptKey],
        gradeId: null,
        finalGrade: null,
        remarks: '',
        scoresByTerm: { Prelim: {}, Midterm: {}, Final: {} },
        grades: {
          Prelim: { raw: '', transmuted: '' },
          Midterm: { raw: '', transmuted: '' },
          Final: { raw: '', transmuted: '' },
        },
      },
    }));
  };

  const handleRemoveCourse = (yearLevel, semesterId, attemptKey) => {
    const entry = gradesMap[attemptKey];
    if (!entry) return;

    // ✅ Bulletproof check for emptiness
    const hasScores = TERMS.some((t) => 
      Object.values(entry.scoresByTerm?.[t] || {}).some((val) => {
        const s = String(val ?? '').trim();
        return s !== '';
      })
    );

    const hasManualGrades = TERMS.some((t) => {
      const raw = String(entry.grades?.[t]?.raw ?? '').trim();
      const trans = String(entry.grades?.[t]?.transmuted ?? '').trim();
      return raw !== '' || trans !== '';
    });

    // Remarks are worked out from the scores (or left over after clearing them), so they
    // do not make a course "non-empty".
    const isCompletelyEmpty = !hasScores && !hasManualGrades;

    // If it's empty (or was never saved), hard delete it.
    if (!entry.gradeId || isCompletelyEmpty) {
      openConfirm({
        title: 'Remove Course',
        message: `Remove "${entry.courseCode}" from this semester? Since it has no grades entered, it will be permanently deleted.`,
        variant: 'warning', confirmLabel: 'REMOVE',
        onConfirm: async () => {
          closeConfirm();
          setIsSubmitting(true);
          try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            const res = await fetch(
              `${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades/${entry.courseId}/empty?yearLevel=${yearLevel}&semesterId=${semesterId}`,
              { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (data.success || res.status === 404) {
              if (entry.inCurriculum) {
                clearCourseRow(attemptKey);
              } else {
                const semKey = `${yearLevel}-${semesterId}`;
                setAttemptKeysBySemester((prev) => ({ ...prev, [semKey]: (prev[semKey] || []).filter((k) => k !== attemptKey) }));
                setGradesMap((prev) => { const next = { ...prev }; delete next[attemptKey]; return next; });
              }
              setIsDirty(true);
            } else {
              openAlert('Delete Failed', data.message || 'Failed to delete course.', 'danger');
            }
          } catch (err) {
            openAlert('Connection Error', 'An unexpected error occurred.', 'danger');
          } finally {
            setIsSubmitting(false);
          }
        },
        onCancel: closeConfirm,
      });
      return;
    }

    // If it HAS grades, trigger the Archive flow.
    setArchiveReason('');
    setArchiveState({ isOpen: true, entry, attemptKey, yearLevel, semesterId });
  };

  const performArchiveSavedCourse = async (reason) => {
    const { entry, attemptKey, yearLevel, semesterId } = archiveState;
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades/${entry.courseId}/archive?gradeId=${entry.gradeId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason })
        }
      );
      const data = await response.json();
      if (data.success) {
        if (entry.inCurriculum) {
          clearCourseRow(attemptKey);
        } else {
          const semKey = `${yearLevel}-${semesterId}`;
          setAttemptKeysBySemester((prev) => ({ ...prev, [semKey]: (prev[semKey] || []).filter((k) => k !== attemptKey) }));
          setGradesMap((prev) => { const next = { ...prev }; delete next[attemptKey]; return next; });
        }
        setArchiveState({ isOpen: false, entry: null, attemptKey: null, yearLevel: null, semesterId: null });
        setArchiveReason('');
        showSuccess('Grade Archived', `The grade for "${entry.courseCode}" has been archived.`);
      } else {
        openAlert('Archive Failed', data.message || 'Failed to archive grade.', 'danger');
      }
    } catch (err) {
      openAlert('Connection Error', 'An unexpected error occurred.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGrades = async (entries) => {
    if (!activeSemester || !activeYear) {
      openAlert(
        'Missing Semester',
        'Please make sure a year and semester are selected before saving.',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ semester_id: Number(activeSemester), grades: entries })
      });
      const data = await response.json();
      if (data.success) {
        setIsDirty(false);
        showSuccess('Grades Saved', "The student's grades have been updated successfully.");
      } else {
        openAlert('Save Failed', data.message || 'Failed to save grades.', 'danger');
      }
    } catch (err) {
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const problems = [];
    Object.values(gradesMap).forEach((v) => {
      if (Number(v.semesterId) !== Number(activeSemester)) return;

      TERMS.forEach((t) => {
        const r = validateGrade('raw', v.grades?.[t]?.raw);
        const tr = validateGrade('transmuted', v.grades?.[t]?.transmuted);
        if (r) problems.push(`${v.courseCode} ${t} raw: ${r}`);
        if (tr) problems.push(`${v.courseCode} ${t} transmuted: ${tr}`);
      });
    });
    if (problems.length > 0) {
      openAlert('Fix these before saving', problems.join('\n'), 'warning');
      return;
    }

    const entries = Object.entries(gradesMap)
      .filter(([, v]) => {
        if (Number(v.semesterId) !== Number(activeSemester)) return false;

        const hasScores = TERMS.some((t) => Object.values(v.scoresByTerm[t] || {}).some((val) => val !== '' && val !== undefined));
        const hasGrades = TERMS.some((t) => v.grades?.[t]?.raw !== '' || v.grades?.[t]?.transmuted !== '');
        return hasScores || hasGrades || !!v.remarks;
      })
      .map(([key, v]) => ({
        _attemptKey: key, 
        courseId: v.courseId, 
        yearLevel: v.yearLevel, 
        semesterId: v.semesterId,
        scoresByTerm: v.scoresByTerm, 
        prelim_raw: v.grades.Prelim.raw === '' ? null : Number(v.grades.Prelim.raw),
        prelim_transmuted: v.grades.Prelim.transmuted === '' ? null : Number(v.grades.Prelim.transmuted),
        midterm_raw: v.grades.Midterm.raw === '' ? null : Number(v.grades.Midterm.raw),
        midterm_transmuted: v.grades.Midterm.transmuted === '' ? null : Number(v.grades.Midterm.transmuted),
        final_raw: v.grades.Final.raw === '' ? null : Number(v.grades.Final.raw),
        final_transmuted: v.grades.Final.transmuted === '' ? null : Number(v.grades.Final.transmuted),
        remarks: v.remarks || null,
        prereqEligible: v.prereqEligible !== false,
        prereqMissing: v.prereqMissing || [], 
        prereqMissingIds: v.prereqMissingIds || []
      }));

    if (entries.length === 0) { openAlert('No Grades Entered', 'Please enter at least one grade before saving.', 'warning'); return; }

    const overrideNeeded = entries.filter((en) => !en.prereqEligible);
    if (overrideNeeded.length > 0) {
      const labelled = overrideNeeded.map((en) => {
        const metaRow = gradesMap[en._attemptKey];
        return `• ${metaRow?.courseCode || `#${en.courseId}`} — missing: ${en.prereqMissing.join(', ')}`;
      }).join('\n');
      openConfirm({
        title: 'Prerequisite(s) Not Met',
        message: `The following course(s) have unmet prerequisites:\n\n${labelled}\n\nSave anyway? This will be recorded in the audit log.`,
        variant: 'warning', confirmLabel: 'SAVE ANYWAY', cancelLabel: 'CANCEL',
        onConfirm: () => {
          closeConfirm();
          submitGrades(entries.map(({ _attemptKey, prereqEligible, prereqMissing, ...en }) => ({
             ...en, missingPrereqs: !prereqEligible ? entries.find(e => e._attemptKey === _attemptKey).prereqMissingIds : []
          })));
        },
        onCancel: closeConfirm
      });
      return;
    }
    
    submitGrades(entries.map(({ _attemptKey, prereqEligible, prereqMissing, prereqMissingIds, ...en }) => ({ ...en, missingPrereqs: [] })));
  };

  if (!studentId) return null;
  const studentLabel = student.full_name || `${student.last_name || ''}, ${student.first_name || ''}`.trim();
  const currentYearBlock = years.find(y => y.yearLevel === activeYear);
  const currentSemester = currentYearBlock?.semesters.find(s => s.semesterId === activeSemester);
  const activeSemKey = currentSemester ? `${currentYearBlock.yearLevel}-${currentSemester.semesterId}` : null;
  const activeAttemptKeys = activeSemKey ? (attemptKeysBySemester[activeSemKey] || []) : [];
  const usedCourseIds = new Set(activeAttemptKeys.map((k) => gradesMap[k]?.courseId).filter(Boolean));
  const addableCourses = gradableCourses
    .filter((c) => !usedCourseIds.has(c.courseId))
    .filter((c) => c.alreadyPassed !== true)
    .filter((c) => !!c.curriculumYearLevel);

   return (
    <div className="ax">
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Student Grades"
        description={`${studentLabel} ${student.student_number ? `(${student.student_number})` : ''}${meta ? ` · ${meta.programAbbr || meta.programName}` : ''}`}
        icon={<BiSpreadsheet className="text-2xl" />}
        loading={isSubmitting}
        isDirty={isDirty}
        size="2xl"
        footer={({ requestClose }) => (
          <>
            <Button type="button" variant="secondary" onClick={requestClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={loading || !!error || !isDirty}>
              {isSubmitting ? "Saving..." : (isDirty ? "Save Changes" : "Save Grades")}
            </Button>
          </>
        )}
      >
        {loading ? (
          <div role="status" className="py-10 text-center text-sm text-ink-3">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
            <p className="mt-2">Loading grade sheet...</p>
          </div>
        ) : error ? (
          <div role="alert" className="py-10 text-center">
            <p className="text-danger mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : !meta ? (
          <div role="status" className="py-10 text-center text-sm text-ink-3">
            <p>No curriculum information found for this student.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1 border-b border-line">
              {years.map((yearBlock) => {
                const isCurrent = yearBlock.yearLevel === Number(meta?.currentYearLevel);
                const isFuture = meta && yearBlock.yearLevel > Number(meta.currentYearLevel);
                const isActive = yearBlock.yearLevel === activeYear;
                return (
                  <button
                    key={yearBlock.yearLevel}
                    type="button"
                    disabled={isFuture}
                    onClick={() => {
                      setActiveYear(yearBlock.yearLevel);
                      if (yearBlock.semesters?.length) {
                        setActiveSemester(yearBlock.semesters[0].semesterId);
                        setActiveTerm('Prelim');
                      }
                    }}
                    className={cx(
                      "relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
                      isActive ? "border-brand text-brand-ink" : "border-transparent text-ink-2 hover:text-ink",
                      isFuture && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {yearBlock.yearLevel}{['st','nd','rd'][yearBlock.yearLevel - 1] || 'th'} Year
                    {isCurrent && <span className="ml-1.5 text-xs text-ok">●</span>}
                  </button>
                );
              })}
            </div>

            {currentYearBlock && (
              <div className="flex gap-2">
                {currentYearBlock.semesters.map((sem) => {
                  const isActiveSem = sem.semesterId === activeSemester;
                  return (
                    <button
                      key={sem.semesterId}
                      type="button"
                      onClick={() => { setActiveSemester(sem.semesterId); setActiveTerm('Prelim'); }}
                      className={cx(
                        "rounded-ctl px-4 py-2 text-sm font-medium transition-colors",
                        isActiveSem ? "bg-brand text-brand-on" : "bg-surface-2 text-ink-2 hover:bg-line-strong hover:text-ink"
                      )}
                    >
                      {sem.semesterLabel}
                    </button>
                  );
                })}
              </div>
            )}

            {currentSemester && (
  <div className="rounded-panel border !border-line bg-surface">
    {activeAttemptKeys.length === 0 ? (
      <p className="px-4 py-6 text-center text-xs italic text-ink-3">No courses in this semester yet.</p>
    ) : (
      <>
        {/* Header row with tabs and Add Course button */}
        <div className="flex items-center justify-between border-b border-line pl-4 pr-3 py-3">
          <div className="flex gap-1">
            {TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setActiveTerm(term)}
                className={cx(
                  "relative -mb-[13px] rounded-t-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2",
                  activeTerm === term ? "border-brand text-brand-ink" : "border-transparent text-ink-2 hover:text-ink"
                )}
              >
                {term}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setAddingToSemesterKey(addingToSemesterKey === activeSemKey ? null : activeSemKey)}
            className="!h-8 !px-3 !text-xs shadow-sm"
          >
            + Add Course
          </Button>
        </div>

        {/* Dropdown search input, appears below the header */}
        {addingToSemesterKey === activeSemKey && (
          <div className="flex items-center gap-2 border-b border-line bg-surface-2 p-3">
            <div className="flex-1">
              <LocalSearchableSelect
                options={addableCourses.map(c => ({
                  value: c.courseId,
                  label: `${c.courseCode} — ${c.courseName}${c.curriculumYearLevel ? ` (Y${c.curriculumYearLevel})` : ''}`
                }))}
                value={courseToAdd} onChange={setCourseToAdd}
                placeholder="Search or select a course..."
              />
            </div>
            <Button 
              type="button" 
              variant="primary" 
              onClick={() => handleAddCourse(currentYearBlock.yearLevel, currentSemester.semesterId)} 
              className="!h-10 !px-5"
            >
              Add
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setAddingToSemesterKey(null)} 
              className="!border-0 bg-surface hover:bg-line-strong !h-10"
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="p-4">
          <GradeTable
            attemptKeys={activeAttemptKeys}
            gradesMap={gradesMap}
            activeTerm={activeTerm}
            onScoreChange={handleScoreChange}
            onManualGradeChange={handleManualGradeChange}
            onRemarksChange={handleRemarksChange}
            onRemove={handleRemoveCourse}
            getAllComponentsForTerm={getAllComponentsForTerm}
            yearLevel={currentYearBlock.yearLevel}
            semesterId={currentSemester.semesterId}
            isMobile={isMobile}
          />
        </div>
      </>
    )}
  </div>
)}

            <div className="border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setShowArchived(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink"
              >
                <BiChevronDown className={cx("text-lg transition-transform", showArchived && "rotate-180")} />
                {showArchived ? 'Hide archived grades' : `Show archived grades${archivedGrades.length > 0 ? ` (${archivedGrades.length})` : ''}`}
              </button>
                            {showArchived && (
                <div className="mt-3 space-y-2">
                  {archivedGrades.length === 0 ? (
                    <p className="text-xs italic text-ink-3">No archived grades for this student.</p>
                  ) : (
                    archivedGrades.map((ag) => (
                      <div
                        key={ag.gradeId}
                        className="flex items-center justify-between gap-3 rounded-ctl border border-line bg-surface-2/50 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink-3 line-through text-sm">{ag.courseCode}</span>
                            <Badge tone="neutral">Archived</Badge>
                          </div>
                          <p className="text-xs text-ink-2 truncate">{ag.courseName}</p>
                          <p className="text-xs text-ink-3 mt-1">
                            Year {ag.yearLevel} · {ag.semesterLabel} · {ag.archiveReason || 'No reason provided'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="shrink-0"
                          onClick={async () => {
                            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                            const res = await fetch(
                              `${process.env.REACT_APP_API_URL}/admin/students/${studentId}/grades/${ag.courseId}/restore?gradeId=${ag.gradeId}`,
                              { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
                            );
                            const data = await res.json();
                            if (data.success) {
                              setArchivedGrades(prev => prev.filter(x => x.gradeId !== ag.gradeId));
                              showSuccess('Grade Restored', `"${ag.courseCode}" has been restored to the active sheet.`);
                              setTimeout(() => window.location.reload(), 1500);
                            } else {
                              openAlert('Restore Failed', data.message || 'Failed to restore grade.', 'danger');
                            }
                          }}
                        >
                          <BiUndo className="text-base" /> Restore
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}                    
            </div>

          </div>
        )}
      </Modal>

      <ConfirmationModal isOpen={successState.isOpen} title={successState.title} message={successState.message} variant={successState.variant} isAlert={true} onConfirm={() => { setSuccessState({ isOpen: false }); onSuccess(); }} onCancel={() => { setSuccessState({ isOpen: false }); onSuccess(); }} />
      <ConfirmationModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} variant={confirmState.variant} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} isAlert={confirmState.isAlert} loading={confirmState.loading} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />
      <ConfirmationModal
        isOpen={archiveState.isOpen}
        title="Archive Saved Grade?"
        message={
          archiveState.entry
            ? `Archive the saved grade for "${archiveState.entry.courseCode} — ${archiveState.entry.courseName}"? The grade will be hidden from this sheet but can be restored later.`
            : ''
        }
        variant="warning"
        isAlert={false}
        confirmLabel="ARCHIVE"
        cancelLabel="CANCEL"
        showInput={true}
        inputLabel="Reason for archiving"
        inputPlaceholder="e.g., Enrolled in error, dropped, transferred"
        inputValue={archiveReason}
        onInputChange={setArchiveReason}
        inputRequired={true}
        loading={isSubmitting}
        onConfirm={() => {
          if (!archiveReason.trim()) return;
          performArchiveSavedCourse(archiveReason.trim());
        }}
        onCancel={() => {
          setArchiveState({ isOpen: false, entry: null, attemptKey: null, yearLevel: null, semesterId: null });
          setArchiveReason('');
        }}
      />
    </div>
  );
};

export default AddGrade;
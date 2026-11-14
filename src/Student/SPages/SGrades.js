import React, { useEffect, useState } from 'react';
import { BiChevronDown, BiChevronUp, BiBookAlt, BiBarChart } from 'react-icons/bi';
import Badge from '../../Components/ui/Badge';
import EmptyState from '../../Components/ui/Emptystate';

function SGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTerms, setExpandedTerms] = useState({});

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/student/grades`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setGrades(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const toggleTerm = (termKey) => {
    setExpandedTerms((prev) => ({ ...prev, [termKey]: !prev[termKey] }));
  };

  /* ---------- LOADING SKELETON ---------- */
  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="ax space-y-4 p-4 md:p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-12 w-full animate-pulse rounded-panel bg-surface-2" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-32 animate-pulse rounded-panel bg-surface-2" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- EMPTY STATE ---------- */
  if (grades.length === 0) {
    return (
      <div className="InnerContainer">
        <div className="ax p-4 md:p-6 h-full flex items-center justify-center">
          <EmptyState
            icon={BiBarChart}
            title="No Grades Yet"
            text="Your grades will appear here once posted by the faculty."
          />
        </div>
      </div>
    );
  }

  /* ---------- GROUP BY YEAR + SEMESTER ---------- */
  const groupedGrades = grades.reduce((acc, grade) => {
    const semLabel = grade.semester_label || `Semester ${grade.semester_id}`;
    const groupKey = `Year ${grade.year_level} - ${semLabel}`;
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(grade);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedGrades).sort((a, b) => {
    const yearA = parseInt(a.match(/Year (\d+)/)[1], 10);
    const yearB = parseInt(b.match(/Year (\d+)/)[1], 10);
    if (yearA !== yearB) return yearA - yearB;
    return a.localeCompare(b);
  });

  /* ---------- RENDER ---------- */
  return (
    <div className="InnerContainer">
      <div className="ax min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sortedGroupKeys.map((groupKey) => {
          const isExpanded = expandedTerms[groupKey] === true;
          const courses = groupedGrades[groupKey];
          const totalUnits = courses.reduce(
            (sum, c) => sum + Number(c.lec_units || 0) + Number(c.lab_units || 0),
            0
          );

          return (
            <div key={groupKey} className="rounded-panel border !border-line bg-surface overflow-hidden shadow-sm">
              
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleTerm(groupKey)}
                className={`relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 ${
                  isExpanded ? 'border-b !border-line' : ''
                }`}
                aria-expanded={isExpanded}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <BiBookAlt className="text-lg" />
                </div>
                
                <div className="min-w-0 pr-8">
                  <h3 className="truncate text-sm font-semibold text-ink">{groupKey}</h3>
                  <p className="text-xs text-ink-3">
                    {courses.length} course{courses.length !== 1 ? 's' : ''} &middot; {totalUnits} units
                  </p>
                </div>
                
                {/* Chevron perfectly centered on the right */}
                <span className="absolute inset-y-0 right-4 flex items-center text-ink-2">
                  {isExpanded ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
                </span>
              </button>

              {/* Cards Container */}
              {isExpanded && (
                <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                  {courses.map((g) => {
                    const prelim = g.components.find(
                      (c) => c.term === 'Prelim' && (c.component_name === 'Prelim Exam' || c.component_name === 'Unit Practical Exam')
                    );
                    const midterm = g.components.find(
                      (c) => c.term === 'Midterm' && (c.component_name === 'Midterm Exam' || c.component_name === 'Unit Practical Exam')
                    );
                    const final = g.components.find(
                      (c) => c.term === 'Final' && (c.component_name === 'Final Exam' || c.component_name === 'Unit Practical Exam')
                    );
                    const isPassed = g.remarks === 'P';

                    return (
                      <div 
                        key={g.grade_id} 
                        className="flex flex-col rounded-panel border !border-line bg-surface overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* MAROON HEADER MOTIF */}
                        <div className="flex items-start justify-between gap-2 bg-gradient-to-r from-brand to-[#4a0a14] px-4 py-3 text-brand-on">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-on/80">
                              {g.course_code}
                            </p>
                            <h4 className="mt-0.5 line-clamp-2 text-sm font-semibold">
                              {g.course_name}
                            </h4>
                          </div>
                          
                          <Badge 
                            tone="neutral" 
                            className="!bg-white/15 !text-white !ring-white/20 backdrop-blur-sm shrink-0"
                          >
                            {isPassed ? 'Passed' : (g.remarks || 'Failed')}
                          </Badge>
                        </div>

                        {/* Score Row */}
                        <div className="mt-auto grid grid-cols-4 gap-2 p-4">
                          <div className="text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">Prelim</p>
                            <p className="mt-0.5 text-sm font-medium tabular-nums text-ink">{prelim?.score ?? '—'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">Midterm</p>
                            <p className="mt-0.5 text-sm font-medium tabular-nums text-ink">{midterm?.score ?? '—'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">Final</p>
                            <p className="mt-0.5 text-sm font-medium tabular-nums text-ink">{final?.score ?? '—'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">Grade</p>
                            <p className={`mt-0.5 text-base font-bold tabular-nums ${isPassed ? 'text-brand' : 'text-danger'}`}>
                              {g.final_grade ?? '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SGrades;
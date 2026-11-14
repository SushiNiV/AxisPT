import React, { useEffect, useState } from 'react';
import { BiBarChart, BiTime } from 'react-icons/bi';
import Badge from '../../Components/ui/Badge';
import EmptyState from '../../Components/ui/Emptystate';
import Dropdown from '../../Components/shared/Dropdown';

function SAcademics() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the selected term dropdown
  const [selectedTerm, setSelectedTerm] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/student/subjects`, { headers }).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/student/grades`, { headers }).then(r => r.json())
    ])
      .then(([subjectsData, gradesData]) => {
        if (subjectsData.success) setSubjects(subjectsData.data.enrolled || []);
        if (gradesData.success) {
          setGrades(gradesData.data || []);
          
          // Auto-select the latest term by default
          const grouped = (gradesData.data || []).reduce((acc, g) => {
            const key = `Year ${g.year_level} - ${g.semester_label || `Semester ${g.semester_id}`}`;
            acc.add(key);
            return acc;
          }, new Set());
          
          const sorted = Array.from(grouped).sort((a, b) => b.localeCompare(a));
          if (sorted.length > 0) setSelectedTerm(sorted[0]);
        }
      })
      .catch(err => console.error('Academics fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- GROUPING LOGIC ---------- */
  const groupedGrades = grades.reduce((acc, grade) => {
    const semLabel = grade.semester_label || `Semester ${grade.semester_id}`;
    const groupKey = `Year ${grade.year_level} - ${semLabel}`;
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(grade);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedGrades).sort((a, b) => {
    const yearA = parseInt(a.match(/Year (\d+)/)?.[1] || 0, 10);
    const yearB = parseInt(b.match(/Year (\d+)/)?.[1] || 0, 10);
    if (yearA !== yearB) return yearB - yearA;
    return b.localeCompare(a);
  });

  // Format for the Dropdown component
  const termOptions = sortedGroupKeys.map(key => ({ value: key, label: key }));
  
  // Get grades for the currently selected term
  const displayedGrades = groupedGrades[selectedTerm] || [];

  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="ax p-4 md:p-6 space-y-4">
          <div className="h-10 w-64 animate-pulse rounded bg-surface-2" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 animate-pulse rounded-panel bg-surface-2" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="InnerContainer">
      <div className="ax min-h-0 flex-1 space-y-8 overflow-y-auto p-4 md:p-6 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* --- CURRENT ENROLLMENT --- */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <BiTime className="text-xl text-brand" />
            <h2 className="font-display text-xl font-bold text-ink">Current Enrollment</h2>
          </div>
          
          {subjects.length === 0 ? (
            <p className="text-sm text-ink-3">No active subjects enrolled this term.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {subjects.map((s) => (
                <div key={s.curriculum_course_id} className="flex flex-col rounded-panel border !border-line bg-surface overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-brand to-[#4a0a14] px-4 py-3 text-brand-on">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-on/80">{s.course_code}</p>
                    <h4 className="mt-0.5 line-clamp-2 text-sm font-semibold">{s.course_name}</h4>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-3">Units</span>
                      <span className="font-medium text-ink">{(s.lec_units || 0) + (s.lab_units || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-3">Section</span>
                      <span className="font-medium text-ink">{s.section_name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-3">Faculty</span>
                      <span className="font-medium text-ink truncate max-w-[150px]">{s.faculty_first_name ? `${s.faculty_first_name} ${s.faculty_last_name}` : 'TBA'}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t !border-line flex justify-end">
                      <Badge tone="neutral">Ongoing</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- GRADES SECTION WITH DROPDOWN --- */}
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BiBarChart className="text-xl text-brand" />
              <h2 className="font-display text-xl font-bold text-ink">Grade History</h2>
            </div>
            
            {/* Dropdown to switch terms */}
            {termOptions.length > 0 && (
              <div className="w-full sm:w-64">
                <Dropdown
                  options={termOptions}
                  value={selectedTerm}
                  onChange={(val) => setSelectedTerm(val)}
                  placeholder="Select a term"
                />
              </div>
            )}
          </div>
          
          {displayedGrades.length === 0 ? (
            <EmptyState 
              icon={BiBarChart} 
              title="No Grades Yet" 
              text="Your grades will appear here once posted by the faculty." 
            />
          ) : (
            <div className="rounded-panel border !border-line bg-surface p-4 md:p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedGrades.map((g) => {
                  const isPassed = g.remarks === 'P';
                  
                  // Get the individual term scores
                  const prelim = g.components.find(c => c.term === 'Prelim' && (c.component_name === 'Prelim Exam' || c.component_name === 'Unit Practical Exam'));
                  const midterm = g.components.find(c => c.term === 'Midterm' && (c.component_name === 'Midterm Exam' || c.component_name === 'Unit Practical Exam'));
                  const final = g.components.find(c => c.term === 'Final' && (c.component_name === 'Final Exam' || c.component_name === 'Unit Practical Exam'));

                  return (
                    <div key={g.grade_id} className="flex flex-col rounded-panel border !border-line bg-surface overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                      {/* Header Motif */}
                      <div className="flex items-start justify-between gap-2 bg-gradient-to-r from-brand to-[#4a0a14] px-4 py-3 text-brand-on">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-on/80">{g.course_code}</p>
                          <h4 className="mt-0.5 line-clamp-2 text-sm font-semibold">{g.course_name}</h4>
                        </div>
                        <Badge tone="neutral" className="!bg-white/15 !text-white !ring-white/20 backdrop-blur-sm shrink-0">
                          {isPassed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>

                      {/* Score Grid */}
                      <div className="mt-auto grid grid-cols-4 gap-2 p-4 border-t !border-line">
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
                          <p className={`mt-0.5 text-base font-bold tabular-nums ${isPassed ? 'text-brand' : 'text-danger'}`}>{g.final_grade ?? '—'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default SAcademics;